import fs from 'fs';
import zlib from 'zlib';

function createCrc32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrc32Table();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([len, body, crcBuf]);
}

function generatePng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw uncompressed scanlines: each row is 1 filter byte (0) + width * 4 (RGBA)
  const raw = Buffer.alloc(height * (1 + width * 4));
  let pos = 0;

  const center = size / 2;
  const radius = size * (isMaskable ? 0.48 : 0.44);

  for (let y = 0; y < height; y++) {
    raw[pos++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Icon color design:
      // Dark slate background #0f172a with subtle sky gradient
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Squircle/rounded badge inside
      const pad = size * 0.12;
      const inBox = x >= pad && x <= size - pad && y >= pad && y <= size - pad;

      // Central symbol: Video Play triangle & clapper
      const isInPlayTriangle =
        dx >= -size * 0.12 &&
        dx <= size * 0.16 &&
        Math.abs(dy) <= (size * 0.16 - dx * 0.6) * 0.8 &&
        dx <= size * 0.14;

      // Outer ring / border
      if (Math.abs(dist - size * 0.38) < size * 0.02) {
        r = 56;
        g = 189;
        b = 248; // #38bdf8
      } else if (isInPlayTriangle) {
        r = 56;
        g = 189;
        b = 248; // #38bdf8
      } else if (inBox && y < pad + size * 0.15) {
        // clapper stripe
        r = 2;
        g = 132;
        b = 199; // #0284c7
      } else if (inBox) {
        r = 30;
        g = 41;
        b = 59; // #1e293b
      }

      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
      raw[pos++] = a;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

fs.writeFileSync('./public/pwa-192x192.png', generatePng(192));
fs.writeFileSync('./public/pwa-512x512.png', generatePng(512));
fs.writeFileSync('./public/pwa-maskable-512x512.png', generatePng(512, true));
fs.writeFileSync('./public/apple-touch-icon.png', generatePng(180));

console.log('PWA PNG Icons generated successfully.');
