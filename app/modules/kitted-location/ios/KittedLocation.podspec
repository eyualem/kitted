Pod::Spec.new do |s|
  s.name           = 'KittedLocation'
  s.version        = '0.1.0'
  s.summary        = 'Approximate, one-shot location for the Kitted morning card.'
  s.description    = 'CoreLocation with reduced accuracy, when-in-use only, for the morning card weather (02 "S1d").'
  s.author         = ''
  s.homepage       = 'https://trykitted.com'
  s.platforms      = { :ios => '26.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
