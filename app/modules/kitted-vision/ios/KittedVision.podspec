Pod::Spec.new do |s|
  s.name           = 'KittedVision'
  s.version        = '0.1.0'
  s.summary        = 'On-device photo prep for Kitted (neck-down crop, face pixelation).'
  s.description    = 'Apple Vision wrapper used by the Kitted app. Demo stub until P8.'
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
