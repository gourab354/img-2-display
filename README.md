# Img2Display

Img2Display is a browser-based conversion utility designed for embedded systems and microcontroller development. It converts raster images, animated GIFs, and video clips into hardware-compatible C/C++ byte arrays and complete Arduino/PlatformIO sketches for monochrome OLED and color TFT displays.

---

## Overview

Existing web converters frequently generate problematic code for microcontrollers due to improper library initialization, incorrect array placement in SRAM, and unhandled byte endianness in 16-bit color modes. Img2Display resolves these issues by generating verified, memory-safe code targeting standard embedded graphics libraries, including Adafruit GFX, Adafruit SSD1306, Adafruit ST7789, Adafruit ST7735, Adafruit ILI9341, and TFT_eSPI.

Additionally, Img2Display supports multi-frame video extraction, allowing developers to generate sequential frame arrays for animation playback on resource-constrained microcontrollers.

---

## Key Features

### 1. Video and Animation Processing
- Input format support: MP4, WebM, animated GIF, and image sequences.
- Configurable playback rate: 5, 8, 10, 15, and 20 frames per second (FPS).
- Integrated timeline trimmer to specify custom start and end timestamps.
- Frame timeline scrubber with interactive thumbnail reel for granular inspection.
- Generates non-blocking animation loops utilizing hardware timers (`millis()`).

### 2. High-Fidelity Color and Monochrome Processing
- **16-Bit RGB565 Engine**:
  - Implements multi-channel Floyd-Steinberg error diffusion dithering to eliminate color banding across gradients and skin tones.
  - Supports configurable color channel ordering (RGB and BGR) for compatibility with non-standard display panels.
  - Optional byte-order swap (MSB/LSB) toggle for raw SPI streaming DMA drivers.
- **1-Bit Monochrome Engine**:
  - Quantization algorithms: Floyd-Steinberg, Atkinson, Bayer 4x4 ordered matrix, and static thresholding.
  - Formats output to horizontal byte alignment with MSB-first bit order, directly compliant with `Adafruit_SSD1306::drawBitmap`.

### 3. Memory Safety and Hardware Budgeting
- All generated arrays are tagged with `PROGMEM` to guarantee placement in Flash memory (DROM), preventing SRAM exhaustion and bootloader crashes.
- Real-time flash budget calculation compared against selected microcontroller specifications (ESP32 4MB/8MB/16MB, ESP8266 4MB, RP2040 2MB, ATmega328P 32KB).

### 4. Code Generation and Simulation
- **Header (`image_data.h`)**: Formatted C arrays, dimension definitions, and multi-frame pointer arrays.
- **Main Sketch (`sketch.ino`)**: Ready-to-compile Arduino source code with correct library initialization methods (such as `tft.init(width, height)` for ST7789 and `tft.initR(INITR_BLACKTAB)` for ST7735).
- **Wokwi Configuration (`diagram.json`)**: Pre-wired virtual breadboard and display schematics for direct simulation without physical hardware.
- **Project Export**: Download individual files or a complete project ZIP archive containing source files, diagrams, and build instructions.

---

## Supported Hardware

### Microcontrollers
- Espressif ESP32 (DevKit v1, ESP32-S3, ESP32-C3)
- Espressif ESP8266 (NodeMCU, D1 Mini)
- Raspberry Pi RP2040 (Pico)
- Microchip ATmega328P (Arduino Uno, Nano)
- Microchip ATmega2560 (Arduino Mega)

### Displays and Controllers
- **SSD1306 / SH1106 OLED**: 128x64, 128x32 (I2C and SPI)
- **ST7789 TFT**: 240x240, 135x240, 240x320 (SPI)
- **ST7735 TFT**: 128x160, 128x128, 80x160 (SPI)
- **ILI9341 TFT**: 240x320, 320x240 (SPI)
- **GC9A01 Round TFT**: 240x240 (SPI)

---

## Technical Notes

### SPI Interface and Pin Configuration
- **MOSI (Master Out Slave In)**: Primary data carrier transferring commands and pixel arrays from the microcontroller to the display controller.
- **SCK (Serial Clock)**: Synchronous clock line driving SPI transactions.
- **CS (Chip Select)**: Active-low bus enable line.
- **DC / RS (Data / Command)**: Selects between display command register mode and data frame buffer mode.
- **MISO (Master In Slave Out)**: Return data line from the peripheral to the controller. Note that MISO is solely utilized for reading diagnostic registers, touch controllers, or auxiliary SD cards; it plays no role in image transmission or visual rendering quality.

### RGB565 Endianness
`Adafruit_GFX::drawRGBBitmap` expects 16-bit words formatted with red in bits [15:11], green in bits [10:5], and blue in bits [4:0]. Byte-swapping must remain disabled when using this function to prevent channel inversion and color solarization artifacts.

---

## Project Structure

```text
img2display/
├── index.html            # Application markup and interface structure
├── style.css             # Interface styles, typography, and hardware bezel simulation
├── js/
│   ├── app.js            # Core application controller and event pipeline
│   ├── converter.js      # Color quantization, Floyd-Steinberg, and array engines
│   ├── videoProcessor.js # Video decoding, timeline trimming, and frame extraction
│   ├── codeGenerator.js  # C/C++ sketch and header generator
│   ├── wokwiGenerator.js # Wokwi schematic and JSON generator
│   └── zipExporter.js    # Client-side archive packager
└── README.md             # Project documentation
```

---

## Local Development and Deployment

The project requires no external build tools, bundlers, or runtime compilers.

### Running Locally
You can serve the directory using any HTTP server:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Access the application at `http://localhost:8080`.

### GitHub Pages Deployment
1. Navigate to repository **Settings** > **Pages**.
2. Under **Branch**, select `main` and root (`/`).
3. Save changes. GitHub Pages will host the application directly from the repository root.

---

## License

MIT License. Free for personal, educational, and commercial microcontroller projects.
