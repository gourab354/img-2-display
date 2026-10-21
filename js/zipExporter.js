/**
 * Client-Side ZIP File Generator (Zero External Dependencies)
 * Implements PKZIP format specifications with CRC-32 checksums.
 */
class ZipArchive {
  constructor() {
    this.files = [];
  }

  addFile(filename, content) {
    let bytes;
    if (typeof content === 'string') {
      bytes = new TextEncoder().encode(content);
    } else if (content instanceof Uint8Array) {
      bytes = content;
    } else if (content instanceof ArrayBuffer) {
      bytes = new Uint8Array(content);
    } else {
      bytes = new TextEncoder().encode(String(content));
    }
    this.files.push({ name: filename, data: bytes });
  }

  // Calculate standard CRC-32
  static crc32(bytes) {
    let crc = -1;
    for (let i = 0; i < bytes.length; i++) {
      let b = bytes[i];
      crc ^= b;
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ -1) >>> 0;
  }

  generateBlob() {
    const localHeaders = [];
    const centralHeaders = [];
    let currentOffset = 0;
    const encoder = new TextEncoder();

    for (const file of this.files) {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = file.data;
      const crc = ZipArchive.crc32(dataBytes);
      const size = dataBytes.length;

      // Local File Header (30 bytes + name + data)
      const localBuf = new Uint8Array(30 + nameBytes.length + size);
      const lv = new DataView(localBuf.buffer);
      lv.setUint32(0, 0x04034b50, true); // Local file header signature
      lv.setUint16(4, 20, true);         // Version needed to extract
      lv.setUint16(6, 0, true);          // General purpose bit flag
      lv.setUint16(8, 0, true);          // Compression method: Store (0)
      lv.setUint16(10, 0, true);         // Mod time
      lv.setUint16(12, 0, true);         // Mod date
      lv.setUint32(14, crc, true);       // CRC32
      lv.setUint32(18, size, true);      // Compressed size
      lv.setUint32(22, size, true);      // Uncompressed size
      lv.setUint16(26, nameBytes.length, true); // Filename length
      lv.setUint16(28, 0, true);         // Extra field length
      localBuf.set(nameBytes, 30);
      localBuf.set(dataBytes, 30 + nameBytes.length);

      localHeaders.push(localBuf);

      // Central Directory Header (46 bytes + name)
      const centralBuf = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralBuf.buffer);
      cv.setUint32(0, 0x02014b50, true); // Central header signature
      cv.setUint16(4, 20, true);         // Version made by
      cv.setUint16(6, 20, true);         // Version needed
      cv.setUint16(8, 0, true);          // Flags
      cv.setUint16(10, 0, true);         // Method
      cv.setUint16(12, 0, true);         // Time
      cv.setUint16(14, 0, true);         // Date
      cv.setUint32(16, crc, true);       // CRC32
      cv.setUint32(20, size, true);      // Compressed size
      cv.setUint32(24, size, true);      // Uncompressed size
      cv.setUint16(28, nameBytes.length, true); // Filename length
      cv.setUint16(30, 0, true);         // Extra field len
      cv.setUint16(32, 0, true);         // Comment len
      cv.setUint16(34, 0, true);         // Disk number start
      cv.setUint16(36, 0, true);         // Internal attributes
      cv.setUint32(38, 0, true);         // External attributes
      cv.setUint32(42, currentOffset, true); // Relative offset of local header
      centralBuf.set(nameBytes, 46);

      centralHeaders.push(centralBuf);
      currentOffset += localBuf.length;
    }

    const centralDirOffset = currentOffset;
    let centralDirSize = 0;
    for (const h of centralHeaders) centralDirSize += h.length;

    // End of Central Directory Record (22 bytes)
    const eocdBuf = new Uint8Array(22);
    const ev = new DataView(eocdBuf.buffer);
    ev.setUint32(0, 0x06054b50, true);       // EOCD signature
    ev.setUint16(4, 0, true);                // Disk number
    ev.setUint16(6, 0, true);                // Start disk
    ev.setUint16(8, this.files.length, true); // Entries on disk
    ev.setUint16(10, this.files.length, true);// Total entries
    ev.setUint32(12, centralDirSize, true);  // Central dir size
    ev.setUint32(16, centralDirOffset, true);// Central dir offset
    ev.setUint16(20, 0, true);               // Comment len

    const fullBlobParts = [...localHeaders, ...centralHeaders, eocdBuf];
    return new Blob(fullBlobParts, { type: 'application/zip' });
  }

  download(filename = 'microcontroller_display_project.zip') {
    const blob = this.generateBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

window.ZipArchive = ZipArchive;
