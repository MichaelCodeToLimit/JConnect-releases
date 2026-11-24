$ErrorActionPreference = 'Stop'

# JConnect installs for the current user, so its uninstall entry is under that user's registry hive.
# Wrapped in @() because a single match comes back as one object, which has no Count.
$keys = @(Get-UninstallRegistryKey -SoftwareName 'JConnect*')

if ($keys.Count -eq 1) {
  $key = $keys[0]
  $uninstaller = ($key.UninstallString -replace '^"([^"]+)".*$', '$1')
  # The NSIS uninstaller hands its work to a temporary copy of itself. Start-Process -Wait also waits
  # for that copy, which Uninstall-ChocolateyPackage doesn't, so files could be left behind.
  $process = Start-Process -FilePath $uninstaller -ArgumentList '/currentuser', '/S' -PassThru -Wait
  if ($process.ExitCode -ne 0) {
    throw "The JConnect uninstaller exited with code $($process.ExitCode)."
  }

  # Run from an elevated window, the uninstaller can remove its registry entry and leave the files behind.
  # Give it a moment to finish, then clear what is left, but only if the folder really is JConnect's.
  $installDir = Split-Path -Parent $uninstaller
  $deadline = (Get-Date).AddSeconds(20)
  while ((Test-Path $installDir) -and ((Get-Date) -lt $deadline)) { Start-Sleep -Seconds 2 }
  if ((Test-Path (Join-Path $installDir 'JConnect.exe'))) {
    Remove-Item -Path $installDir -Recurse -Force
  }
}
elseif ($keys.Count -eq 0) {
  Write-Warning 'JConnect was not found in the uninstall list. It may already be removed.'
}
else {
  Write-Warning "$($keys.Count) matches found for JConnect. Nothing was uninstalled, to avoid removing the wrong program."
  $keys | ForEach-Object { Write-Warning "- $($_.DisplayName)" }
}
