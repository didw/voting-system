#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

class DisplayManager {
private:
    Adafruit_SSD1306 display;
    int w, h;

    void centerText(const char* text, int size) {
        display.clearDisplay();
        display.setTextSize(size);
        display.setTextColor(SSD1306_WHITE);
        int16_t x1, y1;
        uint16_t tw, th;
        display.getTextBounds(text, 0, 0, &x1, &y1, &tw, &th);
        display.setCursor((w - tw) / 2, (h - th) / 2);
        display.print(text);
        display.display();
    }

public:
    DisplayManager(int width, int height)
        : display(width, height, &Wire, -1), w(width), h(height) {}

    void setup() {
        if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
            Serial.println(F("SSD1306 init failed"));
            for (;;);
        }
        display.clearDisplay();
        display.display();
    }

    void clear()         { display.clearDisplay(); display.display(); }
    void showLoading()   { centerText("Loading...", 2); }
    void showDone()      { centerText("Done", 3); }
    void showOK()        { centerText("OK", 5); }

    void showStatus(bool wifi, bool mqtt) {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(0, 0);
        display.print("WiFi: ");
        display.println(wifi ? "OK" : "...");
        display.print("MQTT: ");
        display.println(mqtt ? "OK" : "...");
        display.display();
    }

    void showSpinner(int durationMs) {
        int cx = w / 2, cy = h / 2;
        int radius = min(cx, cy) - 5;
        int lines = 6;
        float len = radius * 0.6;
        unsigned long start = millis();

        while (millis() - start < (unsigned long)durationMs) {
            display.clearDisplay();
            float offset = (float)((millis() - start) % 1000) / 1000.0 * 2.0 * PI;
            for (int i = 0; i < lines; i++) {
                float a = (2.0 * PI / lines) * i + offset;
                int x1 = cx + (radius - len) * cos(a);
                int y1 = cy + (radius - len) * sin(a);
                int x2 = cx + radius * cos(a);
                int y2 = cy + radius * sin(a);
                display.drawLine(x1, y1, x2, y2, SSD1306_WHITE);
            }
            display.display();
            delay(33);
        }
        clear();
    }
};

#endif
