/**
 * Img2Display Studio Pro — Application Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const $ = (id) => document.getElementById(id);

  const fileInput = $('fileInput');
  const dropzone = $('dropzone');
  const mediaInfoBar = $('mediaInfoBar');
  const mediaThumbCanvas = $('mediaThumbCanvas');
  const mediaFname = $('mediaFname');
  const mediaSpecs = $('mediaSpecs');
  const btnClearMedia = $('btnClearMedia');
  const btnDemoImage = $('btnDemoImage');
  const btnQuickDemo = $('btnQuickDemo');

  // Tabs
  const sourceTabs = $('sourceTabs');
  const videoControlsSection = $('videoControlsSection');

  // Video Settings
  const videoFps = $('videoFps');
  const maxFrames = $('maxFrames');
  const trimStart = $('trimStart');
  const trimEnd = $('trimEnd');
  const trimStartVal = $('trimStartVal');
  const trimEndVal = $('trimEndVal');
  const btnExtractFrames = $('btnExtractFrames');
  const videoDurationBadge = $('videoDurationBadge');

  // Hardware Config
  const mcuBoard = $('mcuBoard');
  const displayType = $('displayType');
  const targetWidth = $('targetWidth');
  const targetHeight = $('targetHeight');
  const colorFormat = $('colorFormat');
  const graphicsLibrary = $('graphicsLibrary');
  const pinInputsRow = $('pinInputsRow');
  const btnResetPins = $('btnResetPins');

  // Image Tuning
  const scalingMode = $('scalingMode');
  const rotationAngle = $('rotationAngle');
  const ditherAlgo = $('ditherAlgo');
  const thresholdLevel = $('thresholdLevel');
  const thresholdVal = $('thresholdVal');
  const swapEndian = $('swapEndian');
  const rgbDither = $('rgbDither');
  const colorOrder = $('colorOrder');
  const invertColors = $('invertColors');
  const monoControlsBox = $('monoControlsBox');
  const colorControlsBox = $('colorControlsBox');

  // Code Options
  const arrayVarName = $('arrayVarName');
  const flashStorage = $('flashStorage');

  // Simulator
  const simTitle = $('simTitle');
  const simResolutionBadge = $('simResolutionBadge');
  const deviceFrame = $('deviceFrame');
  const devicePinLabel = $('devicePinLabel');
  const displayCanvas = $('displayCanvas');
  const btnZoomToggle = $('btnZoomToggle');
  const btnPlayPause = $('btnPlayPause');

  // Scrubber
  const frameScrubberWrap = $('frameScrubberWrap');
  const currentFrameNumber = $('currentFrameNumber');
  const totalFramesCount = $('totalFramesCount');
  const frameScrubber = $('frameScrubber');
  const frameThumbsReel = $('frameThumbsReel');
  const btnPrevFrame = $('btnPrevFrame');
  const btnPlayAnimation = $('btnPlayAnimation');
  const btnNextFrame = $('btnNextFrame');

  // Memory Bar
  const memSizeVal = $('memSizeVal');
  const memPixelsVal = $('memPixelsVal');
  const memBudgetStatus = $('memBudgetStatus');
  const memProgressFill = $('memProgressFill');

  // Code Output
  const codeOutput = $('codeOutput');
  const codeLinesCount = $('codeLinesCount');
  const btnCopyCode = $('btnCopyCode');
  const btnDownloadCurrent = $('btnDownloadCurrent');
  const btnDownloadZip = $('btnDownloadZip');

  // Modal & Toast
  const btnHelpModal = $('btnHelpModal');
  const pinoutModal = $('pinoutModal');
  const btnCloseModal = $('btnCloseModal');
  const toastEl = $('toast');

  // --- State ---
  const state = {
    mode: 'image', // 'image' or 'video'
    currentFile: null,
    sourceImage: null, // HTMLImageElement
    rawFrames: [], // Array of canvases
    processedFramesData: [], // Array of converted data
    activeFrameIndex: 0,
    currentOutputView: 'header', // 'header', 'sketch', 'wokwi'
    generatedCode: {
      header: '',
      sketch: '',
      wokwi: ''
    },
    pins: {},
    zoom2x: false
  };

  const videoProcessor = new VideoProcessor();

  // Preset Board Memory Capacities (in bytes)
  const boardSpecs = {
    esp32_devkit: { flash: 4 * 1024 * 1024, ram: 320 * 1024, name: 'ESP32 DevKit' },
    esp32_s3:     { flash: 8 * 1024 * 1024, ram: 512 * 1024, name: 'ESP32-S3' },
    esp32_c3:     { flash: 4 * 1024 * 1024, ram: 400 * 1024, name: 'ESP32-C3' },
    esp8266:      { flash: 4 * 1024 * 1024, ram: 80 * 1024,  name: 'ESP8266' },
    rp2040:       { flash: 2 * 1024 * 1024, ram: 264 * 1024, name: 'RP2040 Pico' },
    arduino_uno:  { flash: 32 * 1024,       ram: 2 * 1024,   name: 'Arduino Uno' },
    arduino_mega: { flash: 256 * 1024,      ram: 8 * 1024,   name: 'Arduino Mega' }
  };

  // Display Presets
  const displayPresets = {
    oled_128x64_i2c: { w: 128, h: 64, color: 'mono_1bit', isI2C: true, name: 'SSD1306 (128×64) OLED' },
    oled_128x32_i2c: { w: 128, h: 32, color: 'mono_1bit', isI2C: true, name: 'SSD1306 (128×32) OLED' },
    oled_128x64_spi: { w: 128, h: 64, color: 'mono_1bit', isI2C: false, name: 'SSD1306 (128×64) SPI' },
    sh1106_128x64_i2c:{ w: 128, h: 64, color: 'mono_1bit', isI2C: true, name: 'SH1106 (128×64) OLED' },
    st7789_240x240:  { w: 240, h: 240, color: 'rgb565', isI2C: false, name: 'ST7789 (240×240) TFT' },
    st7789_135x240:  { w: 135, h: 240, color: 'rgb565', isI2C: false, name: 'ST7789 TTGO (135×240)' },
    st7789_240x320:  { w: 240, h: 320, color: 'rgb565', isI2C: false, name: 'ST7789 (240×320) TFT' },
    st7735_128x160:  { w: 128, h: 160, color: 'rgb565', isI2C: false, name: 'ST7735 (128×160) TFT' },
    st7735_128x128:  { w: 128, h: 128, color: 'rgb565', isI2C: false, name: 'ST7735 (128×128) TFT' },
    ili9341_240x320: { w: 240, h: 320, color: 'rgb565', isI2C: false, name: 'ILI9341 (240×320) TFT' },
    gc9a01_240x240:  { w: 240, h: 240, color: 'rgb565', isI2C: false, name: 'GC9A01 Round (240×240)' },
    custom:          { w: 128, h: 64, color: 'mono_1bit', isI2C: true, name: 'Custom Resolution' }
  };

  // Toast Helper
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  // --- Pinout Management ---
  function updatePinInputs() {
    const isI2C = displayType.value.includes('i2c');
    const board = mcuBoard.value;
    pinInputsRow.innerHTML = '';

    if (isI2C) {
      let defaultSda = 21, defaultScl = 22;
      if (board === 'esp8266') { defaultSda = 4; defaultScl = 5; } // D2, D1
      else if (board === 'arduino_uno') { defaultSda = 'A4'; defaultScl = 'A5'; }
      else if (board === 'arduino_mega') { defaultSda = 20; defaultScl = 21; }
      else if (board === 'rp2040') { defaultSda = 4; defaultScl = 5; }

      state.pins = { sda: defaultSda, scl: defaultScl };

      pinInputsRow.innerHTML = `
        <div class="pin-box">
          <label>SDA (Data)</label>
          <input type="text" id="pinSda" value="${defaultSda}">
        </div>
        <div class="pin-box">
          <label>SCL (Clock)</label>
          <input type="text" id="pinScl" value="${defaultScl}">
        </div>
        <div class="pin-box">
          <label>I2C Addr</label>
          <input type="text" id="pinAddr" value="0x3C" readonly>
        </div>
      `;

      $('pinSda').addEventListener('input', (e) => { state.pins.sda = e.target.value; triggerRegen(false); });
      $('pinScl').addEventListener('input', (e) => { state.pins.scl = e.target.value; triggerRegen(false); });
      devicePinLabel.textContent = `I2C: SDA=${defaultSda}, SCL=${defaultScl} • ADDR 0x3C`;
    } else {
      let cs = 5, dc = 2, rst = 4, mosi = 23, sck = 18;
      if (board === 'esp8266') { cs = 15; dc = 4; rst = 16; mosi = 13; sck = 14; }
      else if (board === 'arduino_uno') { cs = 10; dc = 9; rst = 8; mosi = 11; sck = 13; }
      else if (board === 'rp2040') { cs = 17; dc = 16; rst = 20; mosi = 19; sck = 18; }

      state.pins = { cs, dc, rst, mosi, sck };

      pinInputsRow.innerHTML = `
        <div class="pin-box">
          <label>CS</label>
          <input type="text" id="pinCs" value="${cs}">
        </div>
        <div class="pin-box">
          <label>DC / RS</label>
          <input type="text" id="pinDc" value="${dc}">
        </div>
        <div class="pin-box">
          <label>RST</label>
          <input type="text" id="pinRst" value="${rst}">
        </div>
        <div class="pin-box">
          <label>MOSI</label>
          <input type="text" id="pinMosi" value="${mosi}">
        </div>
        <div class="pin-box">
          <label>SCK</label>
          <input type="text" id="pinSck" value="${sck}">
        </div>
      `;

      $('pinCs').addEventListener('input', (e) => { state.pins.cs = e.target.value; triggerRegen(false); });
      $('pinDc').addEventListener('input', (e) => { state.pins.dc = e.target.value; triggerRegen(false); });
      $('pinRst').addEventListener('input', (e) => { state.pins.rst = e.target.value; triggerRegen(false); });
      devicePinLabel.textContent = `SPI: CS=${cs}, DC=${dc}, RST=${rst}, MOSI=${mosi}, SCK=${sck}`;
    }
  }

  // --- Display Preset Selection ---
  function applyDisplayPreset(presetKey) {
    const p = displayPresets[presetKey];
    if (!p) return;

    if (presetKey !== 'custom') {
      targetWidth.value = p.w;
      targetHeight.value = p.h;
      colorFormat.value = p.color;
    }

    const isMono = colorFormat.value === 'mono_1bit';
    monoControlsBox.classList.toggle('hidden', !isMono);
    colorControlsBox.classList.toggle('hidden', isMono);
    deviceFrame.setAttribute('data-display-style', isMono ? 'oled' : 'tft');

    updatePinInputs();
    updateBezelDimensions();
  }

  function updateBezelDimensions() {
    const w = parseInt(targetWidth.value, 10) || 128;
    const h = parseInt(targetHeight.value, 10) || 64;
    displayCanvas.width = w;
    displayCanvas.height = h;
    simResolutionBadge.textContent = `${w}×${h} px`;

    const p = displayPresets[displayType.value];
    simTitle.textContent = `${p ? p.name : 'Display'} Simulation`;
  }

  // --- Media Loading ---
  function handleFile(file) {
    if (!file) return;
    state.currentFile = file;

    // Check if video or GIF
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
    const isGif = file.type === 'image/gif' || file.name.endsWith('.gif');

    mediaFname.textContent = file.name;
    mediaInfoBar.classList.remove('hidden');

    // Auto set array name
    arrayVarName.value = CodeGenerator.sanitizeVarName(file.name);

    if (isVideo) {
      switchSourceTab('video');
      loadVideo(file);
    } else if (isGif) {
      switchSourceTab('video');
      loadImageAsStaticOrGif(file, true);
    } else {
      switchSourceTab('image');
      loadImageAsStatic(file);
    }
  }

  function loadImageAsStatic(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.sourceImage = img;
        mediaSpecs.textContent = `${img.naturalWidth}×${img.naturalHeight}px · Image`;

        // Update thumbnail
        drawThumbnail(img);

        // Render single frame
        state.rawFrames = [img];
        state.activeFrameIndex = 0;
        frameScrubberWrap.classList.add('hidden');
        btnPlayPause.classList.add('hidden');

        processAllFramesAndGenerate();
        toast('Image loaded successfully');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadImageAsStaticOrGif(file, isGif = false) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.sourceImage = img;
        mediaSpecs.textContent = `${img.naturalWidth}×${img.naturalHeight}px · ${isGif ? 'GIF Animation' : 'Image'}`;
        drawThumbnail(img);

        if (isGif) {
          // For GIF files, generate frames from GIF animation canvas
          extractGifFrames(img);
        } else {
          state.rawFrames = [img];
          state.activeFrameIndex = 0;
          processAllFramesAndGenerate();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function loadVideo(file) {
    try {
      toast('Reading video metadata...');
      const meta = await videoProcessor.loadVideoFile(file);
      mediaSpecs.textContent = `${meta.width}×${meta.height}px · ${meta.duration.toFixed(1)}s Video`;
      videoDurationBadge.textContent = `${meta.duration.toFixed(1)}s`;

      // Set trimmer ranges
      trimStart.max = meta.duration;
      trimEnd.max = meta.duration;
      trimStart.value = 0;
      trimEnd.value = Math.min(3, meta.duration);
      trimStartVal.textContent = '0.0s';
      trimEndVal.textContent = `${Math.min(3, meta.duration).toFixed(1)}s`;

      await extractFramesFromVideo();
    } catch (err) {
      toast('Error loading video: ' + err.message);
    }
  }

  async function extractFramesFromVideo() {
    toast('Extracting video frames...');
    const w = parseInt(targetWidth.value, 10) || 128;
    const h = parseInt(targetHeight.value, 10) || 64;
    const fps = parseInt(videoFps.value, 10) || 10;
    const maxF = maxFrames.value;
    const sTime = parseFloat(trimStart.value) || 0;
    const eTime = parseFloat(trimEnd.value) || 3;

    const frames = await videoProcessor.extractVideoFrames({
      fps,
      startTime: sTime,
      endTime: eTime,
      maxFrames: maxF,
      targetWidth: w,
      targetHeight: h
    }, (curr, total) => {
      // Progress toast
      if (curr % 5 === 0 || curr === total) {
        toast(`Extracted frame ${curr} of ${total}`);
      }
    });

    state.rawFrames = frames.map(f => f.canvas);
    state.activeFrameIndex = 0;

    if (state.rawFrames.length > 0) {
      drawThumbnail(state.rawFrames[0]);
    }

    setupScrubber(state.rawFrames);
    processAllFramesAndGenerate();
    toast(`Extracted ${state.rawFrames.length} frames ready for display`);
  }

  function extractGifFrames(img) {
    // Canvas GIF frame extractor simulation
    const w = parseInt(targetWidth.value, 10) || 128;
    const h = parseInt(targetHeight.value, 10) || 64;
    const totalFrames = 12;

    const frames = [];
    for (let f = 0; f < totalFrames; f++) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      frames.push(c);
    }

    state.rawFrames = frames;
    state.activeFrameIndex = 0;
    setupScrubber(frames);
    processAllFramesAndGenerate();
  }

  function drawThumbnail(source) {
    const ctx = mediaThumbCanvas.getContext('2d');
    ctx.clearRect(0, 0, 48, 48);
    const sw = source.naturalWidth || source.videoWidth || source.width;
    const sh = source.naturalHeight || source.videoHeight || source.height;
    ctx.drawImage(source, 0, 0, sw, sh, 0, 0, 48, 48);
  }

  // --- Scrubber & Timeline Setup ---
  function setupScrubber(frames) {
    const count = frames.length;
    if (count <= 1) {
      frameScrubberWrap.classList.add('hidden');
      btnPlayPause.classList.add('hidden');
      return;
    }

    frameScrubberWrap.classList.remove('hidden');
    btnPlayPause.classList.remove('hidden');
    totalFramesCount.textContent = count;
    frameScrubber.max = count - 1;
    frameScrubber.value = 0;
    currentFrameNumber.textContent = `Frame 1`;

    // Populate thumbnail reel
    frameThumbsReel.innerHTML = '';
    frames.forEach((frameCanvas, idx) => {
      const thumbItem = document.createElement('div');
      thumbItem.className = `reel-thumb-item ${idx === 0 ? 'active' : ''}`;
      thumbItem.title = `Jump to Frame ${idx + 1}`;

      const tc = document.createElement('canvas');
      tc.width = 50;
      tc.height = 50;
      tc.getContext('2d').drawImage(frameCanvas, 0, 0, 50, 50);

      const numBadge = document.createElement('span');
      numBadge.className = 'reel-thumb-num';
      numBadge.textContent = idx + 1;

      thumbItem.appendChild(tc);
      thumbItem.appendChild(numBadge);

      thumbItem.addEventListener('click', () => {
        setActiveFrame(idx);
      });

      frameThumbsReel.appendChild(thumbItem);
    });
  }

  function setActiveFrame(idx) {
    state.activeFrameIndex = idx;
    frameScrubber.value = idx;
    currentFrameNumber.textContent = `Frame ${idx + 1}`;

    // Highlight thumbnail reel
    const thumbs = frameThumbsReel.querySelectorAll('.reel-thumb-item');
    thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
    if (thumbs[idx]) {
      thumbs[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    renderActiveFrameToDisplay();
  }

  // --- Processing & Rendering ---
  function processAllFramesAndGenerate() {
    if (!state.rawFrames || state.rawFrames.length === 0) return;

    const w = parseInt(targetWidth.value, 10) || 128;
    const h = parseInt(targetHeight.value, 10) || 64;
    const color = colorFormat.value;
    const isMono = color === 'mono_1bit';

    const opts = {
      width: w,
      height: h,
      scalingMode: scalingMode.value,
      rotation: parseInt(rotationAngle.value, 10) || 0,
      invert: invertColors.checked,
      dither: color === 'rgb565' ? (rgbDither ? rgbDither.value : 'floyd') : ditherAlgo.value,
      threshold: parseInt(thresholdLevel.value, 10) || 128,
      swapEndian: swapEndian.checked,
      colorOrder: colorOrder ? colorOrder.value : 'rgb'
    };

    state.processedFramesData = [];

    // Process each frame
    for (let i = 0; i < state.rawFrames.length; i++) {
      const raw = state.rawFrames[i];
      const tempC = document.createElement('canvas');

      // 1. Render scaled, rotated, inverted source onto temp canvas
      DisplayConverter.renderSourceToCanvas(raw, tempC, opts);

      // 2. Convert to target format
      let result;
      if (isMono) {
        result = DisplayConverter.processMonochrome(tempC, opts);
      } else if (color === 'rgb565') {
        result = DisplayConverter.processRGB565(tempC, opts);
      } else {
        result = DisplayConverter.processGrayscale(tempC);
      }

      state.processedFramesData.push({
        ...result,
        canvas: tempC
      });
    }

    // Render active frame to display bezel
    renderActiveFrameToDisplay();

    // Calculate memory footprint
    updateMemoryMeter();

    // Generate Arduino C++ code and Wokwi config
    generateAllCode();
  }

  function renderActiveFrameToDisplay() {
    if (!state.processedFramesData[state.activeFrameIndex]) return;

    const frameData = state.processedFramesData[state.activeFrameIndex];
    const ctx = displayCanvas.getContext('2d');
    const w = displayCanvas.width;
    const h = displayCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(frameData.canvas, 0, 0);
  }

  function updateMemoryMeter() {
    const totalFrames = state.processedFramesData.length || 1;
    const w = parseInt(targetWidth.value, 10) || 128;
    const h = parseInt(targetHeight.value, 10) || 64;
    const totalPixels = w * h * totalFrames;

    let bytesPerFrame = 0;
    if (colorFormat.value === 'mono_1bit') {
      bytesPerFrame = Math.ceil(w / 8) * h;
    } else if (colorFormat.value === 'rgb565') {
      bytesPerFrame = w * h * 2;
    } else {
      bytesPerFrame = w * h;
    }

    const totalBytes = bytesPerFrame * totalFrames;
    const kb = (totalBytes / 1024).toFixed(2);
    const mb = (totalBytes / (1024 * 1024)).toFixed(3);

    memSizeVal.textContent = totalBytes >= 1048576 ? `${mb} MB` : `${kb} KB`;
    memPixelsVal.textContent = `${totalPixels.toLocaleString()} total pixels`;

    // Compare with target MCU Flash capacity
    const mcu = boardSpecs[mcuBoard.value] || boardSpecs.esp32_devkit;
    const pct = ((totalBytes / mcu.flash) * 100).toFixed(1);
    memProgressFill.style.width = `${Math.min(100, Math.max(1, pct))}%`;

    if (totalBytes > mcu.flash) {
      memBudgetStatus.className = 'chip chip-warn';
      memBudgetStatus.textContent = `CRITICAL: Exceeds ${mcu.name} Flash! (${pct}%)`;
      memProgressFill.classList.add('warn');
    } else if (pct > 75) {
      memBudgetStatus.className = 'chip chip-warn';
      memBudgetStatus.textContent = `Warning: High Flash Usage (${pct}% of ${mcu.name})`;
      memProgressFill.classList.add('warn');
    } else {
      memBudgetStatus.className = 'chip chip-success';
      memBudgetStatus.textContent = `Safe: Fits in ${mcu.name} Flash (${pct}%)`;
      memProgressFill.classList.remove('warn');
    }
  }

  function generateAllCode() {
    const w = parseInt(targetWidth.value, 10) || 128;
    const h = parseInt(targetHeight.value, 10) || 64;
    const count = state.processedFramesData.length || 1;
    const fps = parseInt(videoFps.value, 10) || 10;

    const config = {
      varName: arrayVarName.value || 'display_data',
      width: w,
      height: h,
      colorFormat: colorFormat.value,
      flashStorage: flashStorage.value,
      displayType: displayType.value,
      mcuBoard: mcuBoard.value,
      graphicsLibrary: graphicsLibrary.value,
      rotation: parseInt(rotationAngle.value, 10) || 0,
      frameCount: count,
      fps: fps,
      pins: state.pins
    };

    state.generatedCode.header = CodeGenerator.generateHeaderFile(state.processedFramesData, config);
    state.generatedCode.sketch = CodeGenerator.generateSketchFile(config);
    state.generatedCode.wokwi = WokwiGenerator.getWokwiGuide(config) + WokwiGenerator.generateDiagramJson(config);

    updateCodeView();
  }

  function updateCodeView() {
    const currentCode = state.generatedCode[state.currentOutputView] || '';
    codeOutput.value = currentCode;

    const lines = currentCode.split('\n').length;
    codeLinesCount.textContent = `${lines} lines`;
  }

  function triggerRegen(recalculateFrames = true) {
    if (recalculateFrames) {
      processAllFramesAndGenerate();
    } else {
      generateAllCode();
    }
  }

  // --- Animation Playback Controller ---
  let animTimer = null;
  let isSimPlaying = false;

  function toggleSimPlayback() {
    if (state.processedFramesData.length <= 1) return;

    if (isSimPlaying) {
      stopSimPlayback();
    } else {
      startSimPlayback();
    }
  }

  function startSimPlayback() {
    isSimPlaying = true;
    btnPlayPause.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      Pause
    `;
    btnPlayAnimation.textContent = '⏸';

    const fps = parseInt(videoFps.value, 10) || 10;
    const interval = 1000 / fps;

    animTimer = setInterval(() => {
      const nextIdx = (state.activeFrameIndex + 1) % state.processedFramesData.length;
      setActiveFrame(nextIdx);
    }, interval);
  }

  function stopSimPlayback() {
    isSimPlaying = false;
    btnPlayPause.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Play
    `;
    btnPlayAnimation.textContent = '▶';
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
    }
  }

  // --- UI Event Listeners ---

  // Source tab switching (Image vs Video)
  function switchSourceTab(tab) {
    state.mode = tab;
    sourceTabs.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    videoControlsSection.classList.toggle('hidden', tab !== 'video');
  }

  sourceTabs.addEventListener('click', (e) => {
    if (e.target.matches('.seg-btn')) {
      const tab = e.target.getAttribute('data-tab');
      switchSourceTab(tab);
    }
  });

  // Dropzone drag/drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  btnClearMedia.addEventListener('click', () => {
    state.currentFile = null;
    state.sourceImage = null;
    state.rawFrames = [];
    state.processedFramesData = [];
    videoProcessor.clear();
    stopSimPlayback();

    fileInput.value = '';
    mediaInfoBar.classList.add('hidden');
    frameScrubberWrap.classList.add('hidden');
    btnPlayPause.classList.add('hidden');

    const ctx = displayCanvas.getContext('2d');
    ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    codeOutput.value = '// Load an image or click "Try Demo Animation" above to begin!';
    toast('Media cleared');
  });

  // F1 Demo Loader (Uses the uploaded Aston Martin F1 car image)
  const f1DemoImg = new Image();
  f1DemoImg.src = 'assets/f1_demo.png';

  function loadF1Demo(asAnimation = false) {
    const run = () => {
      const isTFT = !displayType.value.startsWith('oled_') && !displayType.value.startsWith('sh1106_');
      const w = parseInt(targetWidth.value, 10) || 128;
      const h = parseInt(targetHeight.value, 10) || 64;

      if (asAnimation) {
        switchSourceTab('video');
        const frames = videoProcessor.generateDemoAnimation({
          frameCount: 16,
          width: w,
          height: h,
          isTFT: isTFT,
          sourceImage: f1DemoImg
        });

        mediaFname.textContent = 'aston_martin_f1_racing.mp4';
        mediaSpecs.textContent = `${w}×${h}px · 16 Frames F1 Racing Video`;
        mediaInfoBar.classList.remove('hidden');
        arrayVarName.value = 'f1_racing_video';

        state.rawFrames = frames.map(f => f.canvas);
        state.activeFrameIndex = 0;

        drawThumbnail(state.rawFrames[0]);
        setupScrubber(state.rawFrames);
        processAllFramesAndGenerate();

        startSimPlayback();
        toast('Aston Martin F1 demo video playing live!');
      } else {
        switchSourceTab('image');
        state.sourceImage = f1DemoImg;
        state.rawFrames = [f1DemoImg];
        state.activeFrameIndex = 0;

        mediaFname.textContent = 'aston_martin_f1_car.png';
        mediaSpecs.textContent = `${f1DemoImg.naturalWidth || 1000}×${f1DemoImg.naturalHeight || 600}px · Aston Martin F1`;
        mediaInfoBar.classList.remove('hidden');
        arrayVarName.value = 'aston_martin_f1';

        drawThumbnail(f1DemoImg);
        frameScrubberWrap.classList.add('hidden');
        btnPlayPause.classList.add('hidden');
        stopSimPlayback();

        processAllFramesAndGenerate();
        toast('Aston Martin F1 demo image loaded.');
      }
    };

    if (f1DemoImg.complete && f1DemoImg.naturalWidth > 0) {
      run();
    } else {
      f1DemoImg.onload = run;
    }
  }

  // Quick Demo Buttons (Image & Video)
  if (btnDemoImage) {
    btnDemoImage.addEventListener('click', () => loadF1Demo(false));
  }
  btnQuickDemo.addEventListener('click', () => loadF1Demo(true));

  // Trimmer sliders
  trimStart.addEventListener('input', (e) => {
    trimStartVal.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
  });
  trimEnd.addEventListener('input', (e) => {
    trimEndVal.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
  });

  btnExtractFrames.addEventListener('click', () => {
    if (state.currentFile && state.currentFile.type.startsWith('video/')) {
      extractFramesFromVideo();
    } else {
      toast('Please upload a video file to re-extract.');
    }
  });

  // Hardware Selectors
  mcuBoard.addEventListener('change', () => {
    updatePinInputs();
    updateMemoryMeter();
    generateAllCode();
  });

  displayType.addEventListener('change', (e) => {
    applyDisplayPreset(e.target.value);
    triggerRegen(true);
  });

  targetWidth.addEventListener('input', () => {
    updateBezelDimensions();
    triggerRegen(true);
  });
  targetHeight.addEventListener('input', () => {
    updateBezelDimensions();
    triggerRegen(true);
  });

  colorFormat.addEventListener('change', () => {
    const isMono = colorFormat.value === 'mono_1bit';
    monoControlsBox.classList.toggle('hidden', !isMono);
    colorControlsBox.classList.toggle('hidden', isMono);
    deviceFrame.setAttribute('data-display-style', isMono ? 'oled' : 'tft');
    triggerRegen(true);
  });

  graphicsLibrary.addEventListener('change', () => generateAllCode());

  btnResetPins.addEventListener('click', () => {
    updatePinInputs();
    generateAllCode();
    toast('GPIO pins reset to board defaults');
  });

  // Image Tuning
  scalingMode.addEventListener('change', () => triggerRegen(true));
  rotationAngle.addEventListener('change', () => triggerRegen(true));
  ditherAlgo.addEventListener('change', () => triggerRegen(true));
  thresholdLevel.addEventListener('input', (e) => {
    thresholdVal.textContent = e.target.value;
    triggerRegen(true);
  });
  swapEndian.addEventListener('change', () => triggerRegen(true));
  if (rgbDither) rgbDither.addEventListener('change', () => triggerRegen(true));
  if (colorOrder) colorOrder.addEventListener('change', () => triggerRegen(true));
  invertColors.addEventListener('change', () => triggerRegen(true));

  // Code Options
  arrayVarName.addEventListener('input', () => generateAllCode());
  flashStorage.addEventListener('change', () => generateAllCode());

  // Scrubber controls
  frameScrubber.addEventListener('input', (e) => {
    setActiveFrame(parseInt(e.target.value, 10));
  });

  btnPrevFrame.addEventListener('click', () => {
    if (state.rawFrames.length > 0) {
      const idx = (state.activeFrameIndex - 1 + state.rawFrames.length) % state.rawFrames.length;
      setActiveFrame(idx);
    }
  });

  btnNextFrame.addEventListener('click', () => {
    if (state.rawFrames.length > 0) {
      const idx = (state.activeFrameIndex + 1) % state.rawFrames.length;
      setActiveFrame(idx);
    }
  });

  btnPlayPause.addEventListener('click', toggleSimPlayback);
  btnPlayAnimation.addEventListener('click', toggleSimPlayback);

  // Zoom toggle
  btnZoomToggle.addEventListener('click', () => {
    state.zoom2x = !state.zoom2x;
    displayCanvas.style.transform = state.zoom2x ? 'scale(1.8)' : 'scale(1)';
    btnZoomToggle.textContent = state.zoom2x ? '200% Zoom' : '100% Zoom';
  });

  // Output Tabs
  document.querySelectorAll('.out-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.out-tab').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      state.currentOutputView = tabBtn.getAttribute('data-view');
      updateCodeView();
    });
  });

  // Action Buttons
  btnCopyCode.addEventListener('click', () => {
    const code = codeOutput.value;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      toast('Code copied to clipboard!');
    }).catch(() => {
      codeOutput.select();
      document.execCommand('copy');
      toast('Code copied to clipboard!');
    });
  });

  btnDownloadCurrent.addEventListener('click', () => {
    const code = codeOutput.value;
    if (!code) return;

    let filename = 'image_data.h';
    if (state.currentOutputView === 'sketch') filename = 'sketch.ino';
    else if (state.currentOutputView === 'wokwi') filename = 'diagram.json';

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded ${filename}`);
  });

  btnDownloadZip.addEventListener('click', () => {
    if (!state.generatedCode.header || !state.generatedCode.sketch) {
      toast('Please load media first!');
      return;
    }

    const zip = new ZipArchive();
    zip.addFile('image_data.h', state.generatedCode.header);
    zip.addFile('sketch.ino', state.generatedCode.sketch);
    zip.addFile('diagram.json', state.generatedCode.wokwi.split('// =================================================================')[2]?.trim() || WokwiGenerator.generateDiagramJson({
      displayType: displayType.value,
      mcuBoard: mcuBoard.value,
      pins: state.pins
    }));

    const readme = `# Microcontroller Display Project
Generated by Img2Display Pro Studio (https://img-2-display.vercel.app/)

## Files Included:
- **sketch.ino**: Ready to open in Arduino IDE or PlatformIO
- **image_data.h**: Flash PROGMEM arrays of your image/video animation
- **diagram.json**: 1-click simulation setup for Wokwi.com

## How to Compile in Arduino IDE:
1. Put \`sketch.ino\` and \`image_data.h\` in the same folder named \`sketch\`.
2. Open \`sketch.ino\` in Arduino IDE.
3. Install required library from Tools -> Manage Libraries:
   - For OLED: "Adafruit SSD1306" and "Adafruit GFX Library"
   - For TFT: "Adafruit ST7735 and ST7789 Library" or "Adafruit ILI9341"
4. Select your board (e.g. ESP32 Dev Module) and Upload!
`;
    zip.addFile('README.md', readme);

    const projName = `${CodeGenerator.sanitizeVarName(arrayVarName.value || 'display')}_project.zip`;
    zip.download(projName);
    toast(`Exported ${projName}`);
  });

  // Modal
  btnHelpModal.addEventListener('click', (e) => {
    e.preventDefault();
    pinoutModal.classList.remove('hidden');
  });

  btnCloseModal.addEventListener('click', () => {
    pinoutModal.classList.add('hidden');
  });

  pinoutModal.addEventListener('click', (e) => {
    if (e.target === pinoutModal) pinoutModal.classList.add('hidden');
  });

  // --- Initial Setup ---
  applyDisplayPreset('oled_128x64_i2c');

  // Load uploaded Aston Martin F1 demo image by default
  loadF1Demo(false);
});
