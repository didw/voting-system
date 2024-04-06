#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Adafruit_SSD1306.h>

class DisplayManager {
private:
    Adafruit_SSD1306 display;

public:
    DisplayManager(int width, int height) : display(width, height, &Wire, -1) {}

    void setup() {
        display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
        display.clearDisplay();
        display.display();
    }

    void showLoadingScreen() {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(WHITE);
        display.setCursor(0, 0);
        display.println("Loading...");
        display.display();
    }

    void showCandidateList(const char* candidates[], int count, int selectedIndex) {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(WHITE);
        display.setCursor(0, 0);

        for (int i = 0; i < count; i++) {
            if (i == selectedIndex) {
                display.print("> ");
            } else {
                display.print("  ");
            }
            display.println(candidates[i]);
        }

        display.display();
    }
};

#endif