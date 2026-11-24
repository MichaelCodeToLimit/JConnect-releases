$ErrorActionPreference = 'Stop'

# JConnect installs for the current user, so its uninstall entry is under that user's registry hive.
$keys = Get-UninstallRegistryKey -SoftwareName 'JConnect*'

if ($keys.Count -eq 1) {
  $key = $keys[0]
  $uninstaller = ($key.UninstallString -replace '^"([^"]+)".*$', '$1')
  Uninstall-ChocolateyPackage -PackageName 'jconnect' -FileType 'exe' -SilentArgs '/S' -File $uninstaller -ValidExitCodes @(0)
}
elseif ($keys.Count -eq 0) {
  Write-Warning 'JConnect was not found in the uninstall list. It may already be removed.'
}
else {
  Write-Warning "$($keys.Count) matches found for JConnect. Nothing was uninstalled, to avoid removing the wrong program."
  $keys | ForEach-Object { Write-Warning "- $($_.DisplayName)" }
}
