# JConnect releases

**JConnect** is remote desktop for your own computers, with no IP addresses, no port forwarding and no account needed. Computers on your network find each other, you pair them once with a six-digit code, and every session is end-to-end encrypted.

This repository publishes JConnect's downloads. Each release keeps its files under names that include the version, so a link to one never changes. The source code isn't public.

**[Download JConnect](https://jconnect-1dsx.onrender.com/download/)** · [All releases](https://github.com/MichaelCodeToLimit/JConnect-releases/releases) · [Docs](https://jconnect-1dsx.onrender.com/docs/) · [Privacy](https://jconnect-1dsx.onrender.com/privacy/)

| System | File | Needs |
| --- | --- | --- |
| Windows | `JConnect-Setup-<version>.exe` | Windows 10 or 11, 64-bit |
| Mac with Apple silicon | `JConnect-<version>-arm64.dmg` | macOS 13 or later |
| Mac with an Intel processor | `JConnect-<version>-x64.dmg` | macOS 13 or later |
| Ubuntu, Debian, Linux Mint | `JConnect-<version>-amd64.deb` | 64-bit Intel or AMD, an X11 session to be controlled |
| Android, Android TV and Google TV | `JConnect-<version>.apk` | Android 8.0 or later |

JConnect is an early beta. The Windows and Mac builds aren't signed by Microsoft or Apple yet, so both ask you to confirm them the first time. Each release's notes say how.

## Check a download

Every release has a `SHA256SUMS.txt`. Compare it with your download:

- **Windows (PowerShell):** `Get-FileHash .\JConnect-Setup-<version>.exe`
- **Mac:** `shasum -a 256 JConnect-<version>-arm64.dmg`
- **Linux:** `sha256sum -c SHA256SUMS.txt`

## How releases get here

A workflow publishes each new download from JConnect's website as a release here, and only when its size and SHA-256 match what the website says they should be. See `.github/scripts/mirror.js`.
