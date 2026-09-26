// Publishes JConnect's downloads from its website as GitHub releases, each file under a name with its version, so
// package managers such as winget have a link whose file never changes. Nothing is published unless its size and
// SHA-256 match what the website, or the release file in releases/, says the file should be.
//
// A release comes from either:
// - releases/<tag>.json, written by hand: { tag, title, assets: [{ name, url, sha256, size }] }, or
// - the website's <download>.json, which JConnect's updater reads, whenever it names a version with no release yet.
// Release notes come from notes/<tag>.md when that exists.
// Needs GH_TOKEN (the workflow's token) and the gh command, as on GitHub's runners.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const SITE = 'https://jconnect-1dsx.onrender.com/download/';
const ROOT = path.join(__dirname, '..', '..');

// Each download on the website, and how its release names it.
const DOWNLOADS = [
  { file: 'JConnect-Setup.exe', platform: 'windows', name: (v) => `JConnect-Setup-${v}.exe` },
  { file: 'JConnect-Linux.deb', platform: 'linux', name: (v) => `JConnect-${v}-amd64.deb` },
  { file: 'JConnect-Mac-AppleSilicon.dmg', platform: 'mac', name: (v) => `JConnect-${v}-arm64.dmg` },
  { file: 'JConnect-Mac-Intel.dmg', platform: 'mac', name: (v) => `JConnect-${v}-x64.dmg` },
  { file: 'JConnect-Android.apk', platform: 'android', name: (v) => `JConnect-${v}.apk` },
];
const PLATFORM_NAMES = { windows: 'Windows', linux: 'Linux', mac: 'Mac', android: 'Android' };

const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const exists = (tag) => {
  try {
    gh('release', 'view', tag, '--json', 'tagName');
    return true;
  } catch {
    return false;
  }
};

// 0.1.0-beta.2 → "0.1.0 Beta 2".
const pretty = (version) => version.replace(/-([a-z]+)\.(\d+)$/i, (_m, kind, n) => ` ${kind[0].toUpperCase()}${kind.slice(1)} ${n}`);

async function fromWebsite() {
  const found = [];
  for (const d of DOWNLOADS) {
    const res = await fetch(`${SITE}${d.file}.json`, { cache: 'no-store' });
    if (!res.ok) continue;
    const info = await res.json();
    if (info.app !== 'jconnect' || info.file !== d.file || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(info.version)) continue;
    found.push({ ...d, version: info.version, sha256: info.sha256, size: info.size });
  }
  // One release per platform and version. Both Mac downloads have to be at the same version to be published together.
  const releases = new Map();
  for (const f of found) {
    const tag = `${f.platform}-v${f.version}`;
    if (!releases.has(tag)) releases.set(tag, { tag, title: `JConnect ${pretty(f.version)} for ${PLATFORM_NAMES[f.platform]}`, assets: [] });
    releases.get(tag).assets.push({ name: f.name(f.version), url: `${SITE}${f.file}`, sha256: f.sha256, size: f.size });
  }
  const macFiles = DOWNLOADS.filter((d) => d.platform === 'mac').length;
  return [...releases.values()].filter((r) => !r.tag.startsWith('mac-') || r.assets.length === macFiles);
}

function fromRepository() {
  const dir = path.join(ROOT, 'releases');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

async function download(asset, dir) {
  const res = await fetch(asset.url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${asset.url}: HTTP ${res.status}`);
  const data = Buffer.from(await res.arrayBuffer());
  const sha256 = crypto.createHash('sha256').update(data).digest('hex');
  if (sha256 !== asset.sha256 || (asset.size && data.length !== asset.size)) {
    throw new Error(`${asset.url} is ${data.length} bytes with SHA-256 ${sha256}, not ${asset.size} bytes with ${asset.sha256}. The website may have a newer file already.`);
  }
  const file = path.join(dir, asset.name);
  fs.writeFileSync(file, data);
  return { file, line: `${sha256}  ${asset.name}` };
}

async function publish(release) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jconnect-release-'));
  const files = [];
  const sums = [];
  for (const asset of release.assets) {
    const { file, line } = await download(asset, dir);
    files.push(file);
    sums.push(line);
  }
  fs.writeFileSync(path.join(dir, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
  files.push(path.join(dir, 'SHA256SUMS.txt'));

  const notesFile = path.join(ROOT, 'notes', `${release.tag}.md`);
  const notes = fs.existsSync(notesFile)
    ? fs.readFileSync(notesFile, 'utf8')
    : `${release.title}. It's the same build as the download on [JConnect's website](https://jconnect-1dsx.onrender.com/download/).\n\nCheck a download against SHA256SUMS.txt before you open it.\n`;
  const notesPath = path.join(dir, 'notes.md');
  fs.writeFileSync(notesPath, notes);
  const prerelease = /-/.test(release.tag.replace(/^[a-z]+-v/, '')) ? ['--prerelease'] : [];
  gh('release', 'create', release.tag, ...files, '--title', release.title, '--notes-file', notesPath, ...prerelease);
  fs.rmSync(dir, { recursive: true, force: true });
}

async function main() {
  const candidates = [...fromRepository(), ...await fromWebsite()];
  const seen = new Set();
  let failed = false;
  for (const release of candidates) {
    if (seen.has(release.tag)) continue;
    seen.add(release.tag);
    if (exists(release.tag)) {
      console.log(`${release.tag}: already published`);
      continue;
    }
    try {
      await publish(release);
      console.log(`${release.tag}: published ${release.assets.map((a) => a.name).join(', ')}`);
    } catch (err) {
      failed = true;
      console.log(`::error::${release.tag}: ${err.message}`);
    }
  }
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
