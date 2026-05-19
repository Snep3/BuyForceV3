const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function solidPNG(w, h, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const row = Buffer.alloc(w * 3 + 1);
  row[0] = 0;
  for (let x = 0; x < w; x++) { row[1 + x*3] = r; row[2 + x*3] = g; row[3 + x*3] = b; }

  const rows = [];
  for (let y = 0; y < h; y++) rows.push(row);
  const idat = zlib.deflateSync(Buffer.concat(rows), { level: 1 });

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const dir = path.join(__dirname, 'assets', 'images');
fs.mkdirSync(dir, { recursive: true });

const files = [
  { name: 'icon.png',                      w: 1024, h: 1024, r: 34,  g: 139, b: 230 }, // #228be6
  { name: 'splash-icon.png',               w: 512,  h: 512,  r: 34,  g: 139, b: 230 },
  { name: 'favicon.png',                   w: 64,   h: 64,   r: 34,  g: 139, b: 230 },
  { name: 'android-icon-foreground.png',   w: 1024, h: 1024, r: 34,  g: 139, b: 230 },
  { name: 'android-icon-background.png',   w: 1024, h: 1024, r: 230, g: 244, b: 254 }, // #E6F4FE
  { name: 'android-icon-monochrome.png',   w: 1024, h: 1024, r: 255, g: 255, b: 255 },
];

for (const f of files) {
  fs.writeFileSync(path.join(dir, f.name), solidPNG(f.w, f.h, f.r, f.g, f.b));
  console.log(`✓ ${f.name}`);
}
console.log('\nAll assets created in assets/images/');
