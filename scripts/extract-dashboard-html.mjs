import fs from 'fs';
import zlib from 'zlib';

const htmlPath =
  'C:/Users/Admin/.cursor/projects/d-audience-design/uploads/c__Users_Admin_Downloads_Audience_Dashboard_-_USA_v3__Standalone_-L1-L216-0.html';
const s = fs.readFileSync(htmlPath, 'utf8');

const manifest = JSON.parse(
  s.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)[1]
);

function decodeEntry(entry) {
  const bytes = Buffer.from(entry.data, 'base64');
  const finalBytes = entry.compressed ? zlib.gunzipSync(bytes) : bytes;
  return finalBytes.toString('utf8');
}

const targetUuids = [
  '3807d5f2-b8e4-4e19-8f17-9524d98dc315',
  '56ada1ab-abf5-455f-adc5-f69fa1c19048',
];

for (const uuid of targetUuids) {
  const entry = manifest[uuid];
  if (!entry) {
    console.log('missing', uuid);
    continue;
  }
  const code = decodeEntry(entry);
  const out = `D:/audience-design/tmp-${uuid}.jsx`;
  fs.writeFileSync(out, code);
  console.log('wrote', out, code.length);
}

// Also decode CSS if any
for (const [uuid, entry] of Object.entries(manifest)) {
  if (entry.mime?.includes('css')) {
    const code = decodeEntry(entry);
    fs.writeFileSync(`D:/audience-design/tmp-${uuid}.css`, code);
    console.log('css', uuid, code.length);
  }
}
