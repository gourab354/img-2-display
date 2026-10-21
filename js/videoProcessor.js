/**
 * Video, GIF & Animation Frame Processor
 * Extracts sequential frames from video/GIF files for microcontroller playback.
 */
class VideoProcessor {
  constructor() {
    this.extractedFrames = []; // Array of { canvas, timestamp }
    this.videoElement = document.createElement('video');
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.videoElement.preload = 'auto';
    this.duration = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.currentFrameIdx = 0;
    this.onFrameChange = null;
  }

  /**
   * Load a video file (MP4, WebM)
   */
  async loadVideoFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.videoElement.src = url;

      this.videoElement.onloadedmetadata = () => {
        this.duration = this.videoElement.duration || 1;
        resolve({
          duration: this.duration,
          width: this.videoElement.videoWidth,
          height: this.videoElement.videoHeight
        });
      };

      this.videoElement.onerror = (e) => {
        reject(new Error('Failed to load video file. Please check format.'));
      };
    });
  }

  /**
   * Seek video to a precise timestamp and capture frame onto canvas
   */
  async seekAndCaptureFrame(timestamp, targetWidth, targetHeight) {
    return new Promise((resolve) => {
      const onSeeked = () => {
        this.videoElement.removeEventListener('seeked', onSeeked);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0, targetWidth, targetHeight);

        resolve({ canvas, timestamp });
      };

      this.videoElement.addEventListener('seeked', onSeeked);
      this.videoElement.currentTime = Math.min(timestamp, this.duration - 0.01);
    });
  }

  /**
   * Extract frames from the loaded video based on FPS, start/end trim, and max frame limits
   */
  async extractVideoFrames(options, progressCallback) {
    const {
      fps = 10,
      startTime = 0,
      endTime = 3,
      maxFrames = 30,
      targetWidth = 128,
      targetHeight = 64
    } = options;

    this.extractedFrames = [];
    const actualStart = Math.max(0, startTime);
    const actualEnd = Math.min(this.duration, Math.max(actualStart + 0.1, endTime));
    const step = 1 / fps;

    const timestamps = [];
    for (let t = actualStart; t <= actualEnd; t += step) {
      if (maxFrames !== 'all' && timestamps.length >= parseInt(maxFrames, 10)) {
        break;
      }
      timestamps.push(t);
    }

    if (timestamps.length === 0) {
      timestamps.push(0);
    }

    for (let i = 0; i < timestamps.length; i++) {
      const frame = await this.seekAndCaptureFrame(timestamps[i], targetWidth, targetHeight);
      this.extractedFrames.push(frame);
      if (progressCallback) {
        progressCallback(i + 1, timestamps.length);
      }
    }

    this.currentFrameIdx = 0;
    return this.extractedFrames;
  }

  /**
   * Generate a procedural high-tech demo animation (Radar sweep + Rotating HUD Cube)
   * Perfect for instant 1-click test without needing external files!
   */
  generateDemoAnimation(options = {}) {
    const {
      frameCount = 16,
      width = 128,
      height = 64,
      isTFT = false
    } = options;

    this.extractedFrames = [];
    this.duration = frameCount / 10;

    for (let f = 0; f < frameCount; f++) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.44;
      const progress = f / frameCount;

      if (isTFT) {
        // High-tech RGB Cyber Ring Animation
        const hue = Math.floor(progress * 360);
        ctx.strokeStyle = `hsl(${hue}, 85%, 60%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.stroke();

        // Inner polygon
        ctx.fillStyle = `hsl(${(hue + 120) % 360}, 90%, 50%)`;
        const sides = 5;
        ctx.beginPath();
        for (let s = 0; s < sides; s++) {
          const a = (s * 2 * Math.PI) / sides + progress * Math.PI * 2;
          const px = cx + Math.cos(a) * (maxR * 0.65);
          const py = cy + Math.sin(a) * (maxR * 0.65);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // High-tech text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`FRAME ${f + 1}/${frameCount}`, cx, cy + maxR + 12);
      } else {
        // Monochrome OLED Radar / Wireframe Cube
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        // Outer HUD border
        ctx.strokeRect(2, 2, width - 4, height - 4);

        // Circular radar rings
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, maxR * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Sweeping radar beam
        const angle = progress * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
        ctx.stroke();

        // Blip targets
        const b1x = cx + Math.cos(angle - 0.7) * (maxR * 0.7);
        const b1y = cy + Math.sin(angle - 0.7) * (maxR * 0.7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b1x - 1, b1y - 1, 3, 3);

        // Frame counter HUD
        ctx.fillStyle = '#ffffff';
        ctx.font = '7px monospace';
        ctx.fillText(`ESP32 ANIM`, 6, 12);
        ctx.fillText(`F:${f + 1}/${frameCount}`, width - 36, 12);
      }

      this.extractedFrames.push({
        canvas,
        timestamp: f * 0.1
      });
    }

    this.currentFrameIdx = 0;
    return this.extractedFrames;
  }

  /**
   * Playback animation loop
   */
  startPlayback(fps = 10, onFrameUpdate) {
    if (this.extractedFrames.length <= 1) return;
    this.stopPlayback();
    this.isPlaying = true;
    const interval = 1000 / fps;

    this.playTimer = setInterval(() => {
      this.currentFrameIdx = (this.currentFrameIdx + 1) % this.extractedFrames.length;
      if (onFrameUpdate) {
        onFrameUpdate(this.currentFrameIdx, this.extractedFrames[this.currentFrameIdx]);
      }
    }, interval);
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  getFrame(index) {
    if (index >= 0 && index < this.extractedFrames.length) {
      return this.extractedFrames[index];
    }
    return null;
  }

  clear() {
    this.stopPlayback();
    this.extractedFrames = [];
    this.duration = 0;
    this.currentFrameIdx = 0;
    if (this.videoElement.src) {
      URL.revokeObjectURL(this.videoElement.src);
      this.videoElement.src = '';
    }
  }
}

window.VideoProcessor = VideoProcessor;
