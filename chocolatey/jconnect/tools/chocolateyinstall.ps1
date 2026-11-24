$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName    = 'jconnect'
  fileType       = 'exe'
  url64bit       = 'https://github.com/MichaelCodeToLimit/JConnect-releases/releases/download/windows-v0.1.0-beta.1/JConnect-Setup-0.1.0-beta.1.exe'
  checksum64     = 'b4b5eb13a4c984ed0fb925eed86903ad8c7bd195b09fdd7c4e0b7bce534c76e1'
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs
