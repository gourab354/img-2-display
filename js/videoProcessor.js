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
   * Generate dynamic racing animation using the uploaded Aston Martin F1 car image
   * Features dynamic tracking camera pan, track speed lines, and live telemetry HUD
   */
  generateDemoAnimation(options = {}) {
    const {
      frameCount = 16,
      width = 128,
      height = 64,
      isTFT = false,
      sourceImage = null
    } = options;

    this.extractedFrames = [];
    this.duration = frameCount / 10;

    for (let f = 0; f < frameCount; f++) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Clear dark background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const progress = f / frameCount;

      if (sourceImage && (sourceImage.naturalWidth || sourceImage.width)) {
        // Draw the uploaded Aston Martin F1 car with cinematic tracking camera motion
        const sw = sourceImage.naturalWidth || sourceImage.width;
        const sh = sourceImage.naturalHeight || sourceImage.height;

        // Cinematic tracking: pan smoothly from front wing to rear wing
        const cropW = sw * 0.75;
        const cropH = sh * 0.85;
        const maxPanX = sw - cropW;
        const panX = (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5) * maxPanX;
        const panY = (sh - cropH) * 0.5;

        ctx.drawImage(sourceImage, panX, panY, cropW, cropH, 0, 0, width, height);

        // Subtly darken bottom for telemetry readability
        const hudGrad = ctx.createLinearGradient(0, height - 16, 0, height);
        hudGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        hudGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = hudGrad;
        ctx.fillRect(0, height - 16, width, 16);

        // Top telemetry bar
        const topGrad = ctx.createLinearGradient(0, 0, 0, 12);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, 12);

        // Racing Telemetry HUD
        const currentSpeed = 312 + Math.floor(Math.sin(progress * Math.PI * 2) * 18);
        const currentRpm = 11400 + Math.floor(Math.sin(progress * Math.PI * 2) * 850);

        if (isTFT) {
          // Color TFT Racing Telemetry
          ctx.fillStyle = '#22c55e'; // Keyvo green
          ctx.font = 'bold 8px monospace';
          ctx.fillText(`AMR22`, 4, 9);

          ctx.fillStyle = '#fde047'; // Butter yellow
          ctx.fillText(`DRS ON`, 42, 9);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${currentSpeed} KM/H`, width - 58, 9);

          // Bottom tachometer bar
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(4, height - 6, width - 8, 3);
          const rpmWidth = Math.floor(((currentRpm - 10000) / 2500) * (width - 8));
          ctx.fillStyle = currentRpm > 12000 ? '#ef4444' : '#22c55e';
          ctx.fillRect(4, height - 6, Math.max(2, rpmWidth), 3);
        } else {
          // Monochrome OLED Telemetry
          ctx.fillStyle = '#ffffff';
          ctx.font = '7px monospace';
          ctx.fillText(`F1:${currentSpeed}KPH`, 3, 8);
          ctx.fillText(`F:${f + 1}/${frameCount}`, width - 36, 8);

          // Simple RPM line
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(3, height - 5, width - 6, 2);
        }

      } else {
        // Fallback procedural HUD if image is loading
        ctx.strokeStyle = isTFT ? '#22c55e' : '#ffffff';
        ctx.strokeRect(2, 2, width - 4, height - 4);
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        ctx.fillText(`ASTON MARTIN F1`, 8, height / 2);
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
