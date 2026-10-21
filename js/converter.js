/**
 * Image and Color Conversion Engines for Microcontroller Displays
 */
const DisplayConverter = {
  // Bayer 4x4 Dither Matrix (values 0-15 normalized to 0-255)
  bayerMatrix4x4: [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ].map(row => row.map(v => (v / 16) * 255)),

  /**
   * Render source image/canvas onto a target canvas with scaling and rotation
   */
  renderSourceToCanvas(sourceElement, targetCanvas, options) {
    const { width, height, scalingMode = 'contain', rotation = 0, invert = false } = options;
    targetCanvas.width = width;
    targetCanvas.height = height;

    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear background (black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Source dimensions
    const sw = sourceElement.naturalWidth || sourceElement.videoWidth || sourceElement.width;
    const sh = sourceElement.naturalHeight || sourceElement.videoHeight || sourceElement.height;

    if (!sw || !sh) return ctx;

    // Temporary canvas for rotation & scaling
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.fillStyle = '#000000';
    tCtx.fillRect(0, 0, width, height);

    let dw = width, dh = height, dx = 0, dy = 0;

    if (scalingMode === 'stretch') {
      dw = width;
      dh = height;
      dx = 0;
      dy = 0;
    } else if (scalingMode === 'cover') {
      const srcRatio = sw / sh;
      const targetRatio = width / height;
      if (srcRatio > targetRatio) {
        // Crop horizontally
        const nw = sh * targetRatio;
        const sx = (sw - nw) / 2;
        tCtx.drawImage(sourceElement, sx, 0, nw, sh, 0, 0, width, height);
      } else {
        // Crop vertically
        const nh = sw / targetRatio;
        const sy = (sh - nh) / 2;
        tCtx.drawImage(sourceElement, 0, sy, sw, nh, 0, 0, width, height);
      }
    } else {
      // Contain (preserve aspect ratio with letterbox)
      const scale = Math.min(width / sw, height / sh);
      dw = sw * scale;
      dh = sh * scale;
      dx = (width - dw) / 2;
      dy = (height - dh) / 2;
      tCtx.drawImage(sourceElement, 0, 0, sw, sh, dx, dy, dw, dh);
    }

    if (scalingMode === 'stretch') {
      tCtx.drawImage(sourceElement, 0, 0, sw, sh, 0, 0, width, height);
    }

    // Apply rotation if needed
    const rad = (parseInt(rotation, 10) * Math.PI) / 180;
    if (rad !== 0) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rad);
      ctx.drawImage(tempCanvas, -width / 2, -height / 2);
      ctx.restore();
    } else {
      ctx.drawImage(tempCanvas, 0, 0);
    }

    // Color inversion
    if (invert) {
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 255 - d[i];         // R
        d[i + 1] = 255 - d[i + 1]; // G
        d[i + 2] = 255 - d[i + 2]; // B
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return ctx;
  },

  /**
   * Process canvas pixels for 1-bit Monochrome display (SSD1306, SH1106)
   * Returns: { monoDataArray (0 or 1 per pixel), cBytes (Uint8Array for Adafruit_GFX) }
   */
  processMonochrome(canvas, options = {}) {
    const { dither = 'floyd', threshold = 128 } = options;
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Convert to grayscale 2D array
    const gray = new Float32Array(w * h);
    for (let i = 0; i < d.length; i += 4) {
      // Standard luminance formula
      const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      gray[i / 4] = luma;
    }

    const binary = new Uint8Array(w * h); // 1 = white, 0 = black

    if (dither === 'threshold') {
      for (let i = 0; i < gray.length; i++) {
        binary[i] = gray[i] >= threshold ? 1 : 0;
      }
    } else if (dither === 'bayer') {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const matrixVal = this.bayerMatrix4x4[y % 4][x % 4];
          const adjusted = gray[idx] + (matrixVal - 128) * (threshold / 128);
          binary[idx] = adjusted >= threshold ? 1 : 0;
        }
      }
    } else if (dither === 'atkinson') {
      // Atkinson dithering (diffuses 1/8 to 6 neighbors)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const oldVal = gray[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binary[idx] = newVal === 255 ? 1 : 0;
          const err = (oldVal - newVal) >> 3; // divide by 8

          if (x + 1 < w) gray[idx + 1] += err;
          if (x + 2 < w) gray[idx + 2] += err;
          if (y + 1 < h) {
            if (x - 1 >= 0) gray[(y + 1) * w + (x - 1)] += err;
            gray[(y + 1) * w + x] += err;
            if (x + 1 < w) gray[(y + 1) * w + (x + 1)] += err;
          }
          if (y + 2 < h) {
            gray[(y + 2) * w + x] += err;
          }
        }
      }
    } else {
      // Default: Floyd-Steinberg error diffusion
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const oldVal = gray[idx];
          const newVal = oldVal >= threshold ? 255 : 0;
          binary[idx] = newVal === 255 ? 1 : 0;
          const err = oldVal - newVal;

          if (x + 1 < w) gray[idx + 1] += (err * 7) / 16;
          if (y + 1 < h) {
            if (x - 1 >= 0) gray[(y + 1) * w + (x - 1)] += (err * 3) / 16;
            gray[(y + 1) * w + x] += (err * 5) / 16;
            if (x + 1 < w) gray[(y + 1) * w + (x + 1)] += (err * 1) / 16;
          }
        }
      }
    }

    // Convert binary 0/1 array into Adafruit GFX horizontal byte array
    // Each row has ceil(w / 8) bytes. Within each byte, MSB = leftmost pixel.
    const bytesPerRow = Math.ceil(w / 8);
    const totalBytes = bytesPerRow * h;
    const cBytes = new Uint8Array(totalBytes);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (binary[y * w + x] === 1) {
          const byteIndex = y * bytesPerRow + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8); // MSB first
          cBytes[byteIndex] |= (1 << bitIndex);
        }
      }
    }

    // Write back monochrome pixels to canvas for preview
    for (let i = 0; i < binary.length; i++) {
      const val = binary[i] ? 255 : 0;
      d[i * 4] = val;
      d[i * 4 + 1] = val;
      d[i * 4 + 2] = val;
      d[i * 4 + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    return {
      cBytes,
      totalBytes,
      pixelsCount: w * h,
      bytesPerRow
    };
  },

  /**
   * Process canvas pixels for 16-bit RGB565 display (ST7789, ST7735, ILI9341)
   * Format: 5 bits Red, 6 bits Green, 5 bits Blue
   * Supports Floyd-Steinberg 16-bit color dithering for silky-smooth skin tones & gradients
   * Returns: { words: Uint16Array, hexStrings: Array, totalBytes: number }
   */
  processRGB565(canvas, options = {}) {
    const {
      swapEndian = false,
      colorOrder = 'rgb',
      dither = 'floyd'
    } = options;

    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const totalPixels = w * h;
    const words = new Uint16Array(totalPixels);
    const hexStrings = [];

    // Separate R, G, B channels as float buffers for dithering error diffusion
    const rArr = new Float32Array(totalPixels);
    const gArr = new Float32Array(totalPixels);
    const bArr = new Float32Array(totalPixels);

    const isBGR = colorOrder === 'bgr';
    for (let i = 0; i < totalPixels; i++) {
      const pIdx = i * 4;
      rArr[i] = isBGR ? d[pIdx + 2] : d[pIdx];
      gArr[i] = d[pIdx + 1];
      bArr[i] = isBGR ? d[pIdx] : d[pIdx + 2];
    }

    const useDither = (dither === 'floyd');

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const pIdx = idx * 4;

        const curR = Math.min(255, Math.max(0, rArr[idx]));
        const curG = Math.min(255, Math.max(0, gArr[idx]));
        const curB = Math.min(255, Math.max(0, bArr[idx]));

        // Quantize to 5-bit Red, 6-bit Green, 5-bit Blue
        const r5 = Math.round((curR * 31) / 255);
        const g6 = Math.round((curG * 63) / 255);
        const b5 = Math.round((curB * 31) / 255);

        // Reconstructed 8-bit color for error calculation and preview
        const qR = Math.round((r5 * 255) / 31);
        const qG = Math.round((g6 * 255) / 63);
        const qB = Math.round((b5 * 255) / 31);

        if (useDither) {
          const errR = curR - qR;
          const errG = curG - qG;
          const errB = curB - qB;

          if (x + 1 < w) {
            rArr[idx + 1] += (errR * 7) / 16;
            gArr[idx + 1] += (errG * 7) / 16;
            bArr[idx + 1] += (errB * 7) / 16;
          }
          if (y + 1 < h) {
            if (x - 1 >= 0) {
              const bl = (y + 1) * w + (x - 1);
              rArr[bl] += (errR * 3) / 16;
              gArr[bl] += (errG * 3) / 16;
              bArr[bl] += (errB * 3) / 16;
            }
            const b = (y + 1) * w + x;
            rArr[b] += (errR * 5) / 16;
            gArr[b] += (errG * 5) / 16;
            bArr[b] += (errB * 5) / 16;
            if (x + 1 < w) {
              const br = (y + 1) * w + (x + 1);
              rArr[br] += (errR * 1) / 16;
              gArr[br] += (errG * 1) / 16;
              bArr[br] += (errB * 1) / 16;
            }
          }
        }

        let rgb565 = (r5 << 11) | (g6 << 5) | b5;

        // If byte swap is checked, swap MSB and LSB
        if (swapEndian) {
          rgb565 = ((rgb565 & 0xFF) << 8) | ((rgb565 >> 8) & 0xFF);
          // Accurately simulate hardware distortion so user sees immediate feedback
          const simR5 = (rgb565 >> 11) & 0x1F;
          const simG6 = (rgb565 >> 5) & 0x3F;
          const simB5 = rgb565 & 0x1F;
          d[pIdx] = Math.round((simR5 * 255) / 31);
          d[pIdx + 1] = Math.round((simG6 * 255) / 63);
          d[pIdx + 2] = Math.round((simB5 * 255) / 31);
        } else {
          d[pIdx] = isBGR ? qB : qR;
          d[pIdx + 1] = qG;
          d[pIdx + 2] = isBGR ? qR : qB;
        }

        words[idx] = rgb565;
        hexStrings.push('0x' + rgb565.toString(16).toUpperCase().padStart(4, '0'));
      }
    }

    ctx.putImageData(imgData, 0, 0);

    return {
      words,
      hexStrings,
      totalBytes: totalPixels * 2,
      pixelsCount: totalPixels
    };
  },

  /**
   * Process canvas pixels for 8-bit Grayscale
   */
  processGrayscale(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const totalPixels = w * h;
    const bytes = new Uint8Array(totalPixels);
    const hexStrings = [];

    for (let i = 0; i < d.length; i += 4) {
      const luma = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      bytes[i / 4] = luma;
      hexStrings.push('0x' + luma.toString(16).toUpperCase().padStart(2, '0'));

      d[i] = luma;
      d[i + 1] = luma;
      d[i + 2] = luma;
    }

    ctx.putImageData(imgData, 0, 0);

    return {
      bytes,
      hexStrings,
      totalBytes: totalPixels,
      pixelsCount: totalPixels
    };
  }
};

window.DisplayConverter = DisplayConverter;
