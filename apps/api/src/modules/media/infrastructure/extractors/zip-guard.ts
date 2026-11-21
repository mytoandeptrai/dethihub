import { inflateRawSync } from 'node:zlib'

// Limits sized for real documents (uploads are at most 12 MB): a document.xml of several hundred pages is a few MB,
// embedded images barely compress further. The old limits (50 / 100 MB) let a valid file near the cap cost ~500 MB of RAM.
const ZIP_MAX_ENTRIES = 3000
const ZIP_MAX_ENTRY = 24 * 1024 * 1024
const ZIP_MAX_TOTAL = 48 * 1024 * 1024
// ZIP record signatures and field maxima, in decimal (the formatter and linter disagree on hex digit case)
const EOCD_SIGNATURE = 101_010_256 // 0x06054B50
const CENTRAL_ENTRY_SIGNATURE = 33_639_248 // 0x02014B50
const LOCAL_HEADER_SIGNATURE = 67_324_752 // 0x04034B50
const UINT16_MAX = 65_535
const UINT32_MAX = 4_294_967_295
const bad = () => new Error('Tệp hỏng hoặc không đúng định dạng.')

export function assertSafeZip(buf: Buffer) {
  // find the End Of Central Directory record (signature 0x06054B50) in the last 64 KB
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Tệp hỏng hoặc không đúng định dạng.')
  const declared = buf.readUInt16LE(eocd + 10)
  const cdSize = buf.readUInt32LE(eocd + 12)
  let off = buf.readUInt32LE(eocd + 16)
  if (declared === UINT16_MAX || cdSize === UINT32_MAX || off === UINT32_MAX)
    throw new Error('Tệp quá lớn hoặc không hỗ trợ (zip64).')
  // Walk EXACTLY the list JSZip will read, otherwise every limit below covers only part of the file:
  // - JSZip follows record signatures to the end, not the count declared in the EOCD → count by signature, then require it to match;
  // - JSZip shifts every offset when the central directory does not end right before the EOCD (it assumes data prepended to the file)
  //   → require the central directory to sit against the EOCD, with no prepended data and no extra bytes.
  if (
    buf.readUInt16LE(eocd + 4) !== 0 ||
    buf.readUInt16LE(eocd + 6) !== 0 ||
    buf.readUInt16LE(eocd + 8) !== declared
  )
    throw bad()
  if (off + cdSize !== eocd || eocd + 22 + buf.readUInt16LE(eocd + 20) !== buf.length) throw bad()
  let total = 0
  let count = 0
  for (; off < eocd; count++) {
    if (count >= ZIP_MAX_ENTRIES) throw new Error('Tệp có quá nhiều thành phần.')
    if (off + 46 > eocd || buf.readUInt32LE(off) !== CENTRAL_ENTRY_SIGNATURE) throw bad()
    const method = buf.readUInt16LE(off + 10)
    const csize = buf.readUInt32LE(off + 20)
    const size = buf.readUInt32LE(off + 24)
    if (size > ZIP_MAX_ENTRY) throw new Error('Tệp chứa thành phần quá lớn.')
    // the declared size may be forged: really inflate with an output cap (zlib stops as soon as it is exceeded)
    const local = buf.readUInt32LE(off + 42)
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== LOCAL_HEADER_SIGNATURE)
      throw new Error('Tệp hỏng hoặc không đúng định dạng.')
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const budget = Math.min(ZIP_MAX_ENTRY, ZIP_MAX_TOTAL - total)
    let real = csize
    if (method === 8) {
      try {
        // inflate at most the declared number of bytes (+1): a lying entry stops zlib at once, at almost no cost
        real = inflateRawSync(buf.subarray(start, start + csize), {
          maxOutputLength: Math.max(1, Math.min(budget, size + 1)),
        }).length
        if (real > size) throw new RangeError('size')
      } catch (error) {
        if (error instanceof RangeError)
          throw new Error('Tệp giải nén ra quá lớn.', { cause: error })
        throw new Error('Tệp hỏng hoặc không đúng định dạng.', { cause: error })
      }
    } else if (method !== 0) throw new Error('Tệp nén theo kiểu không hỗ trợ.')
    total += Math.max(real, size)
    if (total > ZIP_MAX_TOTAL) throw new Error('Tệp giải nén ra quá lớn.')
    off += 46 + buf.readUInt16LE(off + 28) + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32)
  }
  // the last record must end exactly at the EOCD, and the real record count must equal the declared one
  if (off !== eocd || count !== declared) throw bad()
}
