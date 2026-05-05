// Generate PWA icons (192/512) as PNG using only Node built-ins.
// Procedural design: tile-teal background with a kaya circle (Hawker Mama mark).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  let c;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // pixel data
  const rows = [];
  const bg = [0x2b, 0xa5, 0x9d, 0xff]; // tile-teal
  const kaya = [0xe8, 0xb8, 0x3a, 0xff];
  const ink = [0x3a, 0x2d, 0x24, 0xff];
  const cream = [0xff, 0xf7, 0xe8, 0xff];
  const cx = size / 2,
    cy = size / 2;
  const ringR = size * 0.34;
  const ringW = size * 0.04;
  const dotR = size * 0.07;
  const cornerR = size * 0.12;

  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte
    for (let x = 0; x < size; x++) {
      // rounded corner cutoff
      const inCorner =
        (x < cornerR && y < cornerR && Math.hypot(cornerR - x, cornerR - y) > cornerR) ||
        (x > size - cornerR && y < cornerR && Math.hypot(x - (size - cornerR), cornerR - y) > cornerR) ||
        (x < cornerR && y > size - cornerR && Math.hypot(cornerR - x, y - (size - cornerR)) > cornerR) ||
        (x > size - cornerR && y > size - cornerR && Math.hypot(x - (size - cornerR), y - (size - cornerR)) > cornerR);
      if (inCorner) {
        row.push(0, 0, 0, 0);
        continue;
      }

      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);
      let p = bg;
      if (d > ringR && d < ringR + ringW) p = ink;
      else if (d <= ringR && d > ringR - size * 0.1) p = cream;
      else if (d <= ringR - size * 0.1) p = kaya;
      // central dot of sambal
      if (d < dotR) p = [0xd8, 0x43, 0x2b, 0xff];
      row.push(p[0], p[1], p[2], p[3]);
    }
    rows.push(...row);
  }

  const raw = Buffer.from(rows);
  const idatData = deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = `${here}/../public/icons`;
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/icon-192.png`, makePng(192));
writeFileSync(`${outDir}/icon-512.png`, makePng(512));
console.log('icons written to', outDir);
