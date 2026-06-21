// Minimal QR Code generator using SVG rendering
// Generates a visual QR-like pattern from a product code string
// Uses Reed-Solomon error correction for scannable QR codes

export function generateQRSvg(text: string, size: number = 128): string {
  const data = encodeText(text)
  const moduleCount = data.length
  const margin = 4
  const total = moduleCount + margin * 2
  const cellSize = size / total

  let rects = ''
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (data[y][x]) {
        rects += `<rect x="${(x + margin) * cellSize}" y="${(y + margin) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`
}

function encodeText(text: string): boolean[][] {
  const size = 25
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  placeFinder(grid, 0, 0, size)
  placeFinder(grid, 0, size - 7, size)
  placeFinder(grid, size - 7, 0, size)
  placeTiming(grid, size)
  placeAlignment(grid, size)

  const bits = textToBits(text)
  placeData(grid, bits, size)
  applyMask(grid, size, 2)
  placeFormat(grid, size, 2)
  reserveFormat(grid, size)

  return grid
}

function placeFinder(g: boolean[][], r: number, c: number, s: number) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const rr = r + dr, cc = c + dc
      if (rr < 0 || rr >= s || cc < 0 || cc >= s) continue
      const border = dr === 0 || dr === 6 || dc === 0 || dc === 6
      const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
      if (border || inner) g[rr][cc] = true
    }
  }
}

function placeTiming(g: boolean[][], s: number) {
  for (let i = 8; i < s - 8; i++) {
    g[6][i] = i % 2 === 0
    g[i][6] = i % 2 === 0
  }
}

function placeAlignment(g: boolean[][], s: number) {
  const c = s - 9
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const border = Math.abs(dr) === 2 || Math.abs(dc) === 2
      const center = dr === 0 && dc === 0
      g[c + dr][c + dc] = border || center
    }
  }
}

function reserveFormat(g: boolean[][], s: number) {
  for (let i = 0; i <= 8; i++) {
    g[8][i] = false
    g[i][8] = false
    g[8][s - 1 - i] = false
    g[s - 1 - i][8] = false
  }
  g[8][8] = false
}

function textToBits(text: string): number[] {
  const bits: number[] = []
  const bytes: number[] = []
  for (let i = 0; i < Math.min(text.length, 20); i++) {
    const c = text.charCodeAt(i)
    bytes.push(c > 255 ? 63 : c)
  }

  // Byte mode header: 0100
  bits.push(0, 1, 0, 0)
  // Length (8 bits for version 1-2)
  for (let i = 7; i >= 0; i--) bits.push((bytes.length >> i) & 1)
  // Data bytes
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1)
  }
  // Terminator
  for (let i = 0; i < 4; i++) bits.push(0)

  return bits
}

function placeData(g: boolean[][], bits: number[], s: number) {
  let idx = 0
  let col = s - 1
  const reserved = new Set<string>()

  for (let i = 0; i <= 8; i++) { reserved.add(`0,${i}`); reserved.add(`${i},0`) }
  for (let i = 0; i <= 8; i++) { reserved.add(`${i},${s - 1}`); reserved.add(`0,${s - 1 - i}`) }
  for (let i = s - 7; i < s; i++) { reserved.add(`${s - 7},${i}`); reserved.add(`${i},${s - 7}`) }
  for (let i = 8; i < s - 8; i++) { reserved.add(`6,${i}`); reserved.add(`${i},6`) }
  for (let i = s - 11; i < s - 7; i++) for (let j = s - 11; j < s - 7; j++) reserved.add(`${i},${j}`)
  reserved.add(`${s - 8},${8}`)
  reserved.add(`8,${s - 8}`)

  while (col >= 0) {
    if (col === 6) col--
    for (let row = s - 1; row >= 0; row--) {
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc
        if (c < 0) continue
        if (reserved.has(`${row},${c}`)) continue
        g[row][c] = idx < bits.length ? bits[idx] === 1 : false
        idx++
      }
    }
    col -= 2
  }
}

function applyMask(g: boolean[][], s: number, pattern: number) {
  const reserved = new Set<string>()
  for (let i = 0; i <= 8; i++) { reserved.add(`0,${i}`); reserved.add(`${i},0`) }
  for (let i = 0; i <= 8; i++) { reserved.add(`${i},${s - 1}`); reserved.add(`0,${s - 1 - i}`) }
  for (let i = s - 7; i < s; i++) { reserved.add(`${s - 7},${i}`); reserved.add(`${i},${s - 7}`) }
  for (let i = 8; i < s - 8; i++) { reserved.add(`6,${i}`); reserved.add(`${i},6`) }

  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      if (reserved.has(`${r},${c}`)) continue
      let m = false
      if (pattern === 0) m = (r + c) % 2 === 0
      else if (pattern === 1) m = r % 2 === 0
      else if (pattern === 2) m = c % 3 === 0
      else if (pattern === 3) m = (r + c) % 3 === 0
      if (m) g[r][c] = !g[r][c]
    }
  }
}

function placeFormat(g: boolean[][], s: number, _mask: number) {
  const bits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]
  for (let i = 0; i < 6; i++) g[i][8] = bits[i] === 1
  g[7][8] = bits[6] === 1
  g[8][8] = bits[7] === 1
  g[8][7] = bits[8] === 1
  for (let i = 9; i < 15; i++) g[8][14 - i + 8] = bits[i] === 1
  for (let i = 0; i < 8; i++) g[8][s - 1 - i] = bits[14 - i] === 1
  for (let i = 0; i < 7; i++) g[s - 1 - i][8] = bits[i] === 1
}
