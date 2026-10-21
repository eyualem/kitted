// kitted-location: approximate location for the morning/evening card's weather (02 "S1d",
// DECISIONS-LOG #58). CoreLocation with reduced accuracy (NSLocationDefaultAccuracyReduced in
// Info.plist, so iOS asks for approximate location), when-in-use only, one shot per request:
// no background mode, no monitoring, no significant-change service. The coordinate is handed to
// JS and kept nowhere on this side.
//
// Also Apple WeatherKit (09 §26 W1, #365): the hourly forecast for a coordinate JS hands in (already rounded there).
// It needs the paid team's WeatherKit entitlement; without it the call fails and JS falls back to NWS. JS calls it only
// while the paid-team switch is on (src/config/apple.ts).
import CoreLocation
import ExpoModulesCore
import WeatherKit

public class KittedLocationModule: Module {
  private lazy var locator = KittedLocator()

  public func definition() -> ModuleDefinition {
    Name("KittedLocation")

    /// "granted" / "denied" / "unknown" (not asked yet). Never shows a prompt.
    AsyncFunction("permission") { (promise: Promise) in
      promise.resolve(self.locator.permission() as Any?)
    }.runOnQueue(.main)

    /// Shows the iOS prompt the first time (the card's "Use your local weather?" row), then
    /// resolves with the answer. Already answered: resolves at once with that answer.
    AsyncFunction("requestPermission") { (promise: Promise) in
      self.locator.requestPermission(promise)
    }.runOnQueue(.main)

    /// One approximate fix: { latitude, longitude }, or null (not allowed, no fix, or timed out).
    AsyncFunction("currentLocation") { (timeoutMs: Double, promise: Promise) in
      self.locator.current(timeoutMs: timeoutMs, promise: promise)
    }.runOnQueue(.main)

    /// WeatherKit's hourly forecast from an hour ago to 30 hours ahead: [{ start, end, tempF, precipChance (0–1),
    /// humidity (0–1), windMph, condition }], times in the phone's own time zone ("2026-10-21T08:00:00-04:00").
    AsyncFunction("weatherKitHourly") { (latitude: Double, longitude: Double, promise: Promise) in
      Task {
        do {
          let now = Date()
          let hours = try await WeatherService.shared.weather(
            for: CLLocation(latitude: latitude, longitude: longitude),
            including: .hourly(startDate: now.addingTimeInterval(-3600), endDate: now.addingTimeInterval(30 * 3600))
          )
          let iso = ISO8601DateFormatter()
          iso.timeZone = TimeZone.current
          iso.formatOptions = [.withInternetDateTime]
          let rows: [[String: Any]] = hours.forecast.map { h in
            [
              "start": iso.string(from: h.date),
              "end": iso.string(from: h.date.addingTimeInterval(3600)),
              "tempF": h.temperature.converted(to: .fahrenheit).value,
              "precipChance": h.precipitationChance,
              "humidity": h.humidity,
              "windMph": h.wind.speed.converted(to: .milesPerHour).value,
              "condition": h.condition.rawValue,
            ]
          }
          promise.resolve(rows)
        } catch {
          promise.reject("ERR_WEATHERKIT", error.localizedDescription)
        }
      }
    }

    /// WeatherKit's required attribution: { serviceName, legalPageURL }.
    AsyncFunction("weatherKitAttribution") { (promise: Promise) in
      Task {
        do {
          let a = try await WeatherService.shared.attribution
          promise.resolve(["serviceName": a.serviceName, "legalPageURL": a.legalPageURL.absoluteString])
        } catch {
          promise.reject("ERR_WEATHERKIT", error.localizedDescription)
        }
      }
    }
  }
}

/// Lives on the main queue (CLLocationManager wants a run loop thread for its delegate calls).
final class KittedLocator: NSObject, CLLocationManagerDelegate {
  private let manager = CLLocationManager()
  private var permissionWaiters: [Promise] = []
  /// Waiting for one fix; each has a token so its own timeout can settle it (Promise is a struct).
  private var fixWaiters: [(token: Int, promise: Promise)] = []
  private var nextToken = 0
  /// A cached fix newer than this is good enough for the day's weather (it's city level anyway).
  private let freshFor: TimeInterval = 15 * 60

  override init() {
    super.init()
    manager.delegate = self
    manager.desiredAccuracy = kCLLocationAccuracyReduced
  }

  func permission() -> String {
    Self.label(manager.authorizationStatus)
  }

  func requestPermission(_ promise: Promise) {
    guard manager.authorizationStatus == .notDetermined else {
      promise.resolve(permission() as Any?)
      return
    }
    permissionWaiters.append(promise)
    if permissionWaiters.count == 1 { manager.requestWhenInUseAuthorization() }
  }

  func current(timeoutMs: Double, promise: Promise) {
    guard permission() == "granted" else {
      promise.resolve(nil as Any?)
      return
    }
    if let last = manager.location, -last.timestamp.timeIntervalSinceNow < freshFor {
      promise.resolve(Self.coordinate(last) as Any?)
      return
    }
    nextToken += 1
    let token = nextToken
    fixWaiters.append((token, promise))
    if fixWaiters.count == 1 { manager.requestLocation() }
    let wait = max(0.5, min(timeoutMs, 15_000) / 1000)
    DispatchQueue.main.asyncAfter(deadline: .now() + wait) { [weak self] in
      guard let self, let i = self.fixWaiters.firstIndex(where: { $0.token == token }) else { return }
      let waiter = self.fixWaiters.remove(at: i)
      waiter.promise.resolve(nil as Any?)
    }
  }

  // MARK: CLLocationManagerDelegate (main queue: the manager was made there)

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    // Also called once when the manager is created; only an actual answer settles the waiters.
    guard manager.authorizationStatus != .notDetermined, !permissionWaiters.isEmpty else { return }
    let answer = permission()
    let waiters = permissionWaiters
    permissionWaiters.removeAll()
    waiters.forEach { $0.resolve(answer as Any?) }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let fix = locations.last else { return }
    settleFix(Self.coordinate(fix))
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    settleFix(nil)
  }

  private func settleFix(_ value: [String: Double]?) {
    let waiters = fixWaiters
    fixWaiters.removeAll()
    waiters.forEach { $0.promise.resolve(value as Any?) }
  }

  private static func coordinate(_ fix: CLLocation) -> [String: Double] {
    ["latitude": fix.coordinate.latitude, "longitude": fix.coordinate.longitude]
  }

  private static func label(_ status: CLAuthorizationStatus) -> String {
    switch status {
    case .authorizedWhenInUse, .authorizedAlways: return "granted"
    case .denied, .restricted: return "denied"
    default: return "unknown"
    }
  }
}
