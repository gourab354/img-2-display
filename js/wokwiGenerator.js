/**
 * Wokwi Simulator Config Generator
 * Generates exact diagram.json with board and display wiring for 1-click simulation in Wokwi.
 */
const WokwiGenerator = {
  generateDiagramJson(config) {
    const {
      displayType = 'oled_128x64_i2c',
      mcuBoard = 'esp32_devkit',
      pins = {}
    } = config;

    const isOled = displayType.startsWith('oled_') || displayType.startsWith('sh1106_');
    const isESP32 = mcuBoard.startsWith('esp32');

    let diagram = {};

    if (isESP32 && isOled) {
      // ESP32 with SSD1306 OLED (I2C)
      const sda = pins.sda !== undefined ? pins.sda : 21;
      const scl = pins.scl !== undefined ? pins.scl : 22;

      diagram = {
        version: 1,
        author: "Img2Display Pro Studio",
        editor: "wokwi",
        parts: [
          { type: "board-esp32-devkit-c-v4", id: "esp", top: 0, left: 0, attrs: {} },
          { type: "board-ssd1306", id: "oled", top: -80, left: 160, attrs: { i2cAddress: "0x3c" } }
        ],
        connections: [
          [ "esp:TX", "$serialMonitor:RX", "", [] ],
          [ "esp:RX", "$serialMonitor:TX", "", [] ],
          [ "esp:GND.1", "oled:GND", "black", [ "v0" ] ],
          [ "esp:3V3", "oled:VCC", "red", [ "v0" ] ],
          [ `esp:${scl}`, "oled:SCL", "yellow", [ "v0" ] ],
          [ `esp:${sda}`, "oled:SDA", "green", [ "v0" ] ]
        ]
      };
    } else if (isESP32 && !isOled) {
      // ESP32 with ILI9341 TFT Display (SPI)
      const cs = pins.cs !== undefined ? pins.cs : 5;
      const dc = pins.dc !== undefined ? pins.dc : 2;
      const rst = pins.rst !== undefined ? pins.rst : 4;

      diagram = {
        version: 1,
        author: "Img2Display Pro Studio",
        editor: "wokwi",
        parts: [
          { type: "board-esp32-devkit-c-v4", id: "esp", top: 0, left: 0, attrs: {} },
          { type: "board-ili9341", id: "tft", top: -120, left: 180, attrs: {} }
        ],
        connections: [
          [ "esp:TX", "$serialMonitor:RX", "", [] ],
          [ "esp:RX", "$serialMonitor:TX", "", [] ],
          [ "esp:GND.1", "tft:GND", "black", [ "v0" ] ],
          [ "esp:3V3", "tft:VCC", "red", [ "v0" ] ],
          [ `esp:${cs}`, "tft:CS", "blue", [ "v0" ] ],
          [ `esp:${rst}`, "tft:RESET", "orange", [ "v0" ] ],
          [ `esp:${dc}`, "tft:D/C", "green", [ "v0" ] ],
          [ "esp:23", "tft:MOSI", "purple", [ "v0" ] ],
          [ "esp:18", "tft:SCK", "white", [ "v0" ] ]
        ]
      };
    } else if (!isESP32 && isOled) {
      // Arduino Uno with SSD1306 (I2C: A4=SDA, A5=SCL)
      diagram = {
        version: 1,
        author: "Img2Display Pro Studio",
        editor: "wokwi",
        parts: [
          { type: "wokwi-arduino-uno", id: "uno", top: 0, left: 0, attrs: {} },
          { type: "board-ssd1306", id: "oled", top: -90, left: 140, attrs: { i2cAddress: "0x3c" } }
        ],
        connections: [
          [ "uno:GND.1", "oled:GND", "black", [ "v0" ] ],
          [ "uno:5V", "oled:VCC", "red", [ "v0" ] ],
          [ "uno:A4", "oled:SDA", "green", [ "v0" ] ],
          [ "uno:A5", "oled:SCL", "yellow", [ "v0" ] ]
        ]
      };
    } else {
      // Generic fallback
      diagram = {
        version: 1,
        author: "Img2Display Pro Studio",
        editor: "wokwi",
        parts: [
          { type: "board-esp32-devkit-c-v4", id: "esp", top: 0, left: 0, attrs: {} }
        ],
        connections: [
          [ "esp:TX", "$serialMonitor:RX", "", [] ],
          [ "esp:RX", "$serialMonitor:TX", "", [] ]
        ]
      };
    }

    return JSON.stringify(diagram, null, 2);
  },

  getWokwiGuide(config) {
    const isOled = (config.displayType || '').startsWith('oled_');
    return `// =================================================================
// HOW TO RUN IN WOKWI SIMULATOR (ZERO HARDWARE REQUIRED)
// =================================================================
// 1. Visit: https://wokwi.com
// 2. Click "Start New Project" -> Select "${config.mcuBoard?.startsWith('esp32') ? 'ESP32' : 'Arduino Uno'}".
// 3. Open the "diagram.json" tab in Wokwi and replace its contents with the JSON below.
// 4. In Wokwi's sketch tab, add a new file named "image_data.h" and paste the code from our 'image_data.h' tab.
// 5. Replace "sketch.ino" with our generated 'sketch.ino' code.
// 6. In "diagram.json" or "libraries.txt", ensure libraries are included:
//      ${isOled ? 'Adafruit SSD1306\n//      Adafruit GFX Library' : 'Adafruit GFX Library\n//      Adafruit ST7735 and ST7789 Library\n//      Adafruit ILI9341'}
// 7. Click the green Play button ▶ to watch your image/animation display live!
// =================================================================

`;
  }
};

window.WokwiGenerator = WokwiGenerator;
