# Img2Display

**Live Application:** [https://img-2-display.vercel.app/](https://img-2-display.vercel.app/)

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

## 📖 Step-by-Step Guide: How to Use Wokwi & Arduino IDE

Img2Display generates everything needed for both cloud simulation and real hardware upload. Follow these simple steps:

### Option A: Online Simulation in Wokwi (Zero Hardware Required)

You don't need a physical ESP32 or screen to test your animation. Wokwi runs full embedded emulation right inside your web browser.

1. **Open Wokwi**: Go to [https://wokwi.com](https://wokwi.com).
2. **Start a New Project**:
   - For ESP32 projects: Select **ESP32** (or ESP32-S3).
   - For Arduino Uno projects: Select **Arduino Uno**.
3. **Set Up the Virtual Breadboard & Wiring**:
   - In Wokwi, switch to the **`diagram.json`** tab.
   - In Img2Display, click the **Wokwi Simulator Config** tab (or copy `diagram.json` from your downloaded ZIP).
   - Copy and replace all text in Wokwi's `diagram.json` with the generated configuration. This automatically places and wires your screen to the exact microcontroller pins!
4. **Add `image_data.h` in Wokwi**:
   - Notice that `sketch.ino` contains `#include "image_data.h"`. Without this file, compilation will fail with `image_data.h: No such file or directory`.
   - In Wokwi's editor tab bar (next to `sketch.ino`), click the `+` (or small down-arrow) and click **New File**.
   - Name the file **`image_data.h`** (exact lowercase name, case-sensitive) and press Enter.
   - Copy the C-array code from Img2Display's **`image_data.h`** tab and paste it into this newly created file.
5. **Paste the Arduino Sketch**:
   - In Wokwi, switch to the **`sketch.ino`** tab.
   - Copy the code from Img2Display's **`sketch.ino (Main Sketch)`** tab and paste it here.
6. **Include Libraries**:
   - Open Wokwi's **`libraries.txt`** tab and add the necessary libraries:
     - For OLED:
       ```text
       Adafruit SSD1306
       Adafruit GFX Library
       ```
     - For ST7789 / ST7735 / ILI9341 TFT:
       ```text
       Adafruit GFX Library
       Adafruit ST7735 and ST7789 Library
       Adafruit ILI9341
       ```
7. **Simulate**: Click the green **Play (▶)** button. Your image or animation will start playing immediately!

---

### Option B: Uploading to Physical Hardware using Arduino IDE

#### How `image_data.h` works in Arduino IDE:
The sketch links to the array data via `#include "image_data.h"`. For Arduino IDE to compile successfully, `image_data.h` must reside in the **exact same folder** as `sketch.ino`.

You can set it up in either of two easy ways:

- **Method 1 (Recommended - 1-Click ZIP)**:
  1. Click the green **Download Project ZIP** button in Img2Display.
  2. Extract the ZIP. It already contains both `sketch.ino` and `image_data.h` together in a folder named `sketch`.
  3. Double-click `sketch.ino` to open it in Arduino IDE. Both files will appear automatically as side-by-side tabs!

- **Method 2 (Manual Copy/Paste into an Existing Sketch)**:
  1. Open Arduino IDE and create/open your sketch.
  2. Paste the code from Img2Display's **`sketch.ino`** tab into the main editor.
  3. In Arduino IDE, click the tab menu (three vertical dots `⋮` or the small downward arrow on the far right of the tab bar, or press **`Ctrl + Shift + N`**).
  4. Click **New Tab**, type **`image_data.h`**, and hit Enter.
  5. Paste the code from Img2Display's **`image_data.h`** tab into this new tab.

#### Uploading to the Board:
1. **Install Required Libraries**:
   - Open the Library Manager in Arduino IDE (**Tools** > **Manage Libraries...** or `Ctrl + Shift + I`).
   - Search for and install:
     - **Adafruit GFX Library** (Install with all dependencies if prompted).
     - **For OLED (SSD1306)**: Install **Adafruit SSD1306**.
     - **For ST7789 / ST7735 TFT**: Install **Adafruit ST7735 and ST7789 Library**.
     - **For ILI9341 TFT**: Install **Adafruit ILI9341**.
2. **Connect Microcontroller & Select Port**:
   - Plug your ESP32 or Arduino board into your PC via a data-capable USB cable.
   - In Arduino IDE, go to **Tools** > **Board** and pick your board (e.g., *ESP32 Dev Module* or *Arduino Uno*).
   - Go to **Tools** > **Port** and select the active COM port (e.g., `COM3`, `COM5`).
3. **Wire the Display**:
   - Refer to the Pinout Table below and wire your display to the designated pins on your microcontroller.
4. **Upload the Code**:
   - Click the **Upload (➔)** button (or press `Ctrl + U`).
   - If flashing ESP32, hold down the `BOOT` button on the board for a second if the console shows `Connecting........_____.....`.
   - Once uploading completes, your screen will light up with your image or animation!

---

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

## Deployment and Usage

The application is fully client-side and requires zero server configuration or build pipelines.

### Live Production Link
The production application is deployed and available at:
- **[https://img-2-display.vercel.app/](https://img-2-display.vercel.app/)**

### Local Development
To run locally, serve the project root with any static web server:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Open `http://localhost:8080` in your browser.

### Hosting on Vercel or GitHub Pages
- **Vercel**: Link your GitHub repository (`https://github.com/gourab354/img-2-display.git`) to Vercel. Automatic zero-config deployment will build and serve it at `https://img-2-display.vercel.app/`.
- **GitHub Pages**: Go to **Settings** > **Pages** > **Branch: main (root /)** > Save.

---

## License

MIT License. Free for personal, educational, and commercial microcontroller projects.
