# Chocolatey package

Source for the `jconnect` package on the Chocolatey Community Repository. It downloads the installer from this repository's release and checks its SHA-256, so it holds no binaries.

**Tested on Windows 11:** `choco pack`, a local install and an uninstall all work, and the uninstall leaves no files or registry entry behind. The package isn't published yet.

Beta versions are prereleases, so installs need `--pre` until a stable version exists.

## Publish a version

1. Install Chocolatey, then from `chocolatey/jconnect` run `choco pack`.
2. Test it from a PowerShell window run as administrator, before pushing:
   ```powershell
   choco install jconnect -dv -s . -y --pre
   choco uninstall jconnect -dv -y
   ```
3. Get the API key from your account page on https://community.chocolatey.org, then:
   ```powershell
   choco apikey --key <your key> --source https://push.chocolatey.org/
   choco push jconnect.0.1.0-beta1.nupkg --source https://push.chocolatey.org/
   ```
4. A moderator reviews each new package and version, and automated checks scan it for viruses. Answer any comments on the package page.

## For a new JConnect version

- In `jconnect.nuspec`, set `version` (NuGet prereleases can't contain dots: `0.1.0-beta.2` becomes `0.1.0-beta2`) and `releaseNotes`.
- In `tools/chocolateyinstall.ps1`, set `url64bit` and `checksum64` to the release's file and its value in `SHA256SUMS.txt`.
