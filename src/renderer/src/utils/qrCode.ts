/**
 * QR Code SVG Generator
 *
 * Generates scannable QR codes following the ISO/IEC 18004 specification.
 * Supports byte-mode encoding with Reed-Solomon error correction.
 *
 * The algorithm:
 *   1. Encode input text as byte-mode data segments
 *   2. Add Reed-Solomon error correction codewords
 *   3. Build the QR matrix with finder/timing/alignment patterns
 *   4. Place data bits in the correct zigzag pattern
 *   5. Apply the best mask pattern (lowest penalty score)
 *   6. Write format information around the finder patterns
 *
 * Usage:
 *   const svg = generateQRSvg('PRD-000001', 200)
 *   // returns an <svg> string ready to embed in HTML
 */

const EC_LEVEL_M = 1; // Error correction level M (15% recovery)

// ─── GF(256) arithmetic for Reed-Solomon ────────────────────
// QR codes use Galois Field GF(256) with primitive polynomial 0x11D
const GF_EXP: number[] = new Array(256);
const GF_LOG: number[] = new Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
  }
  // Extend exponent table for modular reduction
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

// ─── Reed-Solomon generator polynomial ──────────────────────
// Produces the generator polynomial of degree `ecCount` for error correction
function rsGenPoly(ecCount: number): number[] {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

// ─── Reed-Solomon error correction ──────────────────────────
// Computes `ecCount` EC codewords for the given data bytes
function rsEncode(data: number[], ecCount: number): number[] {
  const gen = rsGenPoly(ecCount);
  const msg = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) msg[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

// ─── QR Version parameters ──────────────────────────────────
// Each entry: [totalCodewords, ecCodewordsPerBlock, numBlocks1, dataCodewords1, numBlocks2, dataCodewords2]
// EC Level M
const VERSION_PARAMS: Record<number, [number, number, number, number, number, number]> = {
  1:  [26, 10, 1, 16, 0, 0],
  2:  [44, 16, 1, 28, 0, 0],
  3:  [70, 26, 1, 44, 0, 0],
  4:  [100, 18, 2, 32, 0, 0],
  5:  [134, 24, 2, 43, 0, 0],
  6:  [172, 16, 4, 27, 0, 0],
  7:  [196, 18, 4, 31, 0, 0],
  8:  [242, 22, 2, 38, 2, 39],
  9:  [292, 22, 3, 36, 2, 37],
  10: [346, 26, 4, 43, 1, 44],
};

// Alignment pattern center positions per version
const ALIGN_POSITIONS: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

// Format information BCH-encoded bits for EC level M, mask 0-7
const FORMAT_INFO: number[] = [
  0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0,
];

/**
 * Determine the minimum QR version needed to encode the given byte length.
 * Returns -1 if data exceeds capacity.
 */
function chooseVersion(dataLen: number): number {
  for (let v = 1; v <= 10; v++) {
    const params = VERSION_PARAMS[v];
    const totalData = params[2] * params[3] + params[4] * params[5];
    // Byte mode: 4 bits mode + 8 bits length + data bytes * 8 + terminator
    const needed = Math.ceil((4 + 8 + dataLen * 8) / 8);
    if (needed <= totalData) return v;
  }
  return -1;
}

// ─── Matrix construction ────────────────────────────────────
type Matrix = (boolean | null)[][];

function createMatrix(size: number): Matrix {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

// Finder pattern: the 7x7 square at corners
function drawFinder(m: Matrix, row: number, col: number) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const r = row + dr, c = col + dc;
      if (r < 0 || r >= m.length || c < 0 || c >= m.length) continue;
      const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const isInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      const isSeparator = dr === -1 || dr === 7 || dc === -1 || dc === 7;
      m[r][c] = isBorder || isInner;
      if (isSeparator) m[r][c] = false;
    }
  }
}

// Timing patterns: alternating modules between finders
function drawTiming(m: Matrix) {
  for (let i = 8; i < m.length - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }
}

// Alignment pattern: 5x5 concentric square
function drawAlignment(m: Matrix, row: number, col: number) {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = row + dr, c = col + dc;
      if (r < 0 || r >= m.length || c < 0 || c >= m.length) continue;
      const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
      const isCenter = dr === 0 && dc === 0;
      m[r][c] = isBorder || isCenter;
    }
  }
}

// Dark module (always present at specific location)
function drawDarkModule(m: Matrix) {
  m[m.length - 8][8] = true;
}

// Reserve function areas (finder + format + timing + alignment) so data placement skips them
function reserveAreas(m: Matrix): Set<string> {
  const reserved = new Set<string>();
  const s = m.length;
  const add = (r: number, c: number) => { if (r >= 0 && r < s && c >= 0 && c < s) reserved.add(`${r},${c}`); };

  // Three finder patterns + separators
  for (let i = -1; i <= 8; i++) {
    for (let j = -1; j <= 8; j++) {
      add(i, j); add(i, s - 1 - j); add(s - 1 - i, j);
    }
  }
  // Timing patterns
  for (let i = 8; i < s - 8; i++) { add(6, i); add(i, 6); }
  // Alignment patterns
  const positions = ALIGN_POSITIONS[s === 21 ? 1 : s === 25 ? 2 : s === 29 ? 3 : s === 33 ? 4 : s === 37 ? 5 : s === 41 ? 6 : s === 45 ? 7 : s === 49 ? 8 : s === 53 ? 9 : 10] || [];
  for (const r of positions) for (const c of positions) {
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) add(r + dr, c + dc);
  }
  // Dark module
  add(s - 8, 8);

  return reserved;
}

// ─── Data placement ─────────────────────────────────────────
// Place data bits in the QR matrix using the standard zigzag pattern
function placeData(m: Matrix, bits: number[], reserved: Set<string>) {
  const s = m.length;
  let bitIdx = 0;
  // Zigzag from bottom-right, going upward in 2-column strips
  for (let col = s - 1; col >= 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    for (let pass = 0; pass < 2; pass++) {
      const upward = pass === 0;
      for (let i = 0; i < s; i++) {
        const row = upward ? s - 1 - i : i;
        for (let dc = 0; dc < 2; dc++) {
          const c = col - dc;
          if (c < 0 || reserved.has(`${row},${c}`)) continue;
          m[row][c] = bitIdx < bits.length ? bits[bitIdx] === 1 : false;
          bitIdx++;
        }
      }
    }
  }
}

// ─── Masking ────────────────────────────────────────────────
// Apply mask pattern and compute penalty score
function applyMask(m: Matrix, pattern: number, reserved: Set<string>) {
  const s = m.length;
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      if (reserved.has(`${r},${c}`) || m[r][c] === null) continue;
      let invert = false;
      switch (pattern) {
        case 0: invert = (r + c) % 2 === 0; break;
        case 1: invert = r % 2 === 0; break;
        case 2: invert = c % 3 === 0; break;
        case 3: invert = (r + c) % 3 === 0; break;
        case 4: invert = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
        case 5: invert = (r * c) % 2 + (r * c) % 3 === 0; break;
        case 6: invert = ((r * c) % 2 + (r * c) % 3) % 2 === 0; break;
        case 7: invert = ((r + c) % 2 + (r * c) % 3) % 2 === 0; break;
      }
      if (invert) m[r][c] = !(m[r][c] as boolean);
    }
  }
}

function penaltyScore(m: Matrix): number {
  const s = m.length;
  let score = 0;

  // Rule 1: runs of same color (5+ in a row)
  for (let r = 0; r < s; r++) {
    let run = 1;
    for (let c = 1; c < s; c++) {
      if (m[r][c] === m[r][c - 1]) { run++; } else { if (run >= 5) score += run - 2; run = 1; }
    }
    if (run >= 5) score += run - 2;
  }
  for (let c = 0; c < s; c++) {
    let run = 1;
    for (let r = 1; r < s; r++) {
      if (m[r][c] === m[r - 1][c]) { run++; } else { if (run >= 5) score += run - 2; run = 1; }
    }
    if (run >= 5) score += run - 2;
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < s - 1; r++) {
    for (let c = 0; c < s - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }

  // Rule 4: proportion of dark modules
  let dark = 0;
  for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) if (m[r][c]) dark++;
  const pct = (dark / (s * s)) * 100;
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;

  return score;
}

// ─── Format information ─────────────────────────────────────
// Write the 15-bit format string around the top-left finder pattern
function writeFormatInfo(m: Matrix, maskPattern: number) {
  const s = m.length;
  const formatIdx = EC_LEVEL_M * 8 + maskPattern;
  const bits = FORMAT_INFO[formatIdx];

  // Bits 0-7 along the left column and bottom row of top-left finder
  const positions1: [number, number][] = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = positions1[i];
    m[r][c] = ((bits >> (14 - i)) & 1) === 1;
  }

  // Second copy along bottom-left and top-right
  const positions2: [number, number][] = [
    [s - 1, 8], [s - 2, 8], [s - 3, 8], [s - 4, 8], [s - 5, 8], [s - 6, 8], [s - 7, 8],
    [8, s - 8], [8, s - 7], [8, s - 6], [8, s - 5], [8, s - 4], [8, s - 3], [8, s - 2], [8, s - 1],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = positions2[i];
    m[r][c] = ((bits >> (14 - i)) & 1) === 1;
  }
}

// ─── Main export ────────────────────────────────────────────

/**
 * Generate a scannable QR code as an SVG string.
 *
 * @param text  - The text to encode (barcodes, product IDs, URLs, etc.)
 * @param size  - Width/height in pixels (default 128)
 * @returns SVG markup string
 */
export function generateQRSvg(text: string, size: number = 128): string {
  // Encode text as bytes
  const textBytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    textBytes.push(code > 255 ? 63 : code); // Replace non-ASCII with '?'
  }

  const version = chooseVersion(textBytes.length);
  if (version === -1) {
    // Fallback: return a placeholder box if data too long
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/><text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${size / 10}" fill="#999">Too long</text></svg>`;
  }

  const params = VERSION_PARAMS[version];
  const moduleCount = version * 4 + 17; // 21 for v1, 25 for v2, etc.
  const [, ecPerBlock, blocks1, dataCW1, blocks2, dataCW2] = params;

  // ── Step 1: Build data codewords with mode indicator + character count ──
  const dataCW: number[] = [];
  // Byte mode indicator: 0100
  dataCW.push(0x40 >> 2); // 0100 in upper 4 bits of first byte... Actually let's do bit-level

  // Build bit stream
  const bitStream: number[] = [];
  // Mode indicator: 0100 (byte mode) — 4 bits
  bitStream.push(0, 1, 0, 0);
  // Character count: 8 bits for version 1-9
  for (let i = 7; i >= 0; i--) bitStream.push((textBytes.length >> i) & 1);
  // Data bytes
  for (const b of textBytes) {
    for (let i = 7; i >= 0; i--) bitStream.push((b >> i) & 1);
  }
  // Terminator (up to 4 zero bits)
  const totalDataBits = (dataCW1 * blocks1 + dataCW2 * blocks2) * 8;
  for (let i = 0; i < 4 && bitStream.length < totalDataBits; i++) bitStream.push(0);

  // Pad to byte boundary
  while (bitStream.length % 8 !== 0) bitStream.push(0);

  // Convert to codewords
  for (let i = 0; i < bitStream.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bitStream[i + j] || 0);
    dataCW.push(byte);
  }

  // Pad to required length with alternating 11101100 and 00010001
  const totalDataCW = dataCW1 * blocks1 + dataCW2 * blocks2;
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (dataCW.length < totalDataCW) {
    dataCW.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // ── Step 2: Interleave data blocks and compute EC ──
  const allDataCW: number[] = [];
  const allECCW: number[] = [];

  let offset = 0;
  // Block group 1
  for (let b = 0; b < blocks1; b++) {
    const block = dataCW.slice(offset, offset + dataCW1);
    allDataCW.push(...block);
    allECCW.push(...rsEncode(block, ecPerBlock));
    offset += dataCW1;
  }
  // Block group 2
  for (let b = 0; b < blocks2; b++) {
    const block = dataCW.slice(offset, offset + dataCW2);
    allDataCW.push(...block);
    allECCW.push(...rsEncode(block, ecPerBlock));
    offset += dataCW2;
  }

  // Interleave data codewords
  const interleavedData: number[] = [];
  const maxDataLen = Math.max(dataCW1, dataCW2 || 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < blocks1; b++) {
      if (i < dataCW1) interleavedData.push(allDataCW[b * dataCW1 + i]);
    }
    for (let b = 0; b < blocks2; b++) {
      if (i < dataCW2) interleavedData.push(allDataCW[blocks1 * dataCW1 + b * dataCW2 + i]);
    }
  }

  // Interleave EC codewords
  const interleavedEC: number[] = [];
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < blocks1 + blocks2; b++) {
      interleavedEC.push(allECCW[b * ecPerBlock + i]);
    }
  }

  // Final bit stream
  const finalBits: number[] = [];
  for (const cw of interleavedData) {
    for (let i = 7; i >= 0; i--) finalBits.push((cw >> i) & 1);
  }
  for (const cw of interleavedEC) {
    for (let i = 7; i >= 0; i--) finalBits.push((cw >> i) & 1);
  }

  // ── Step 3: Build QR matrix ──
  const m = createMatrix(moduleCount);

  // Draw fixed patterns
  drawFinder(m, 0, 0);
  drawFinder(m, 0, moduleCount - 7);
  drawFinder(m, moduleCount - 7, 0);
  drawTiming(m);
  drawDarkModule(m);

  // Draw alignment patterns
  const alignPos = ALIGN_POSITIONS[version] || [];
  for (const r of alignPos) {
    for (const c of alignPos) {
      // Skip if overlapping with finder patterns
      if (r <= 8 && c <= 8) continue;
      if (r <= 8 && c >= moduleCount - 8) continue;
      if (r >= moduleCount - 8 && c <= 8) continue;
      drawAlignment(m, r, c);
    }
  }

  // Reserve areas for function patterns
  const reserved = reserveAreas(m);

  // ── Step 4: Place data bits ──
  placeData(m, finalBits, reserved);

  // ── Step 5: Try all mask patterns, pick the one with lowest penalty ──
  let bestMask = 0;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    // Copy matrix
    const copy = m.map(row => [...row]);
    applyMask(copy, mask, reserved);
    writeFormatInfo(copy, mask);
    const score = penaltyScore(copy);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
    }
  }

  // Apply best mask to actual matrix
  applyMask(m, bestMask, reserved);
  writeFormatInfo(m, bestMask);

  // ── Step 6: Render SVG ──
  const quiet = 4; // Quiet zone modules
  const total = moduleCount + quiet * 2;
  const cellSize = size / total;

  let rects = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (m[r][c]) {
        rects += `<rect x="${(c + quiet) * cellSize}" y="${(r + quiet) * cellSize}" width="${cellSize + 0.5}" height="${cellSize + 0.5}" fill="#000"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
}
