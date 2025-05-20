#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h> // 그래픽 프리미티브에 필요

class DisplayManager {
private:
    Adafruit_SSD1306 display;
    int screenWidth;
    int screenHeight;

public:
    DisplayManager(int width, int height) : display(width, height, &Wire, -1), screenWidth(width), screenHeight(height) {}

    void setup() {
        if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { // 128x64의 경우 주소 0x3C
            Serial.println(F("SSD1306 allocation failed"));
            for (;;); // 진행하지 않고 무한 루프
        }
        // display.clearDisplay(); // setup 시에는 바로 clear하지 않고, showLoadingScreen 등에서 clear 하도록 변경
        // display.display();
        Serial.println("Display driver initialized.");
    }

    void clearScreen() {
        display.clearDisplay();
        display.display();
    }

    void showLoadingScreen() {
        display.clearDisplay();
        display.setTextSize(2); // "Loading..." 텍스트 크기 조절 가능
        display.setTextColor(SSD1306_WHITE);

        const char* loading_text = "Loading...";
        int16_t x1_bounds, y1_bounds;
        uint16_t w_bounds, h_bounds;
        display.getTextBounds(loading_text, 0, 0, &x1_bounds, &y1_bounds, &w_bounds, &h_bounds);
        display.setCursor((screenWidth - w_bounds) / 2, (screenHeight - h_bounds) / 2 + h_bounds/4); // 중앙 정렬

        display.print(loading_text);
        display.display();
        Serial.println("Displaying: Loading...");
    }

    void showDoneMessage() {
        display.clearDisplay();
        display.setTextSize(3); // "Done" 텍스트 크기 (OK보다 약간 작게 또는 유사하게)
        display.setTextColor(SSD1306_WHITE);

        const char* done_text = "Done";
        int16_t x1_bounds, y1_bounds;
        uint16_t w_bounds, h_bounds;
        display.getTextBounds(done_text, 0, 0, &x1_bounds, &y1_bounds, &w_bounds, &h_bounds);

        int16_t cursorX = (screenWidth - w_bounds) / 2;
        int16_t cursorY = (screenHeight - h_bounds) / 2 + h_bounds/4; // 실험적 조정

        display.setCursor(cursorX, cursorY);
        display.print(done_text);
        display.display();
        Serial.println("Displaying: Done");
    }


    // 이 함수는 요구사항에 따라 메인 스케치 흐름에서 더 이상 호출되지 않음
    void showCandidateList(const char* candidates[], int count, int selectedIndex) {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SSD1306_WHITE);
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

    void showSpinningEffect(int durationMillis) {
        display.clearDisplay();
        long startTime = millis();
        int centerX = screenWidth / 2;
        int centerY = screenHeight / 2;
        int radius = min(centerX, centerY) - 5;
        int numLines = 6; // 스피너 라인 수 (조절 가능)
        float lineLength = radius * 0.6; // 라인 길이 (조절 가능)

        while (millis() - startTime < durationMillis) {
            display.clearDisplay(); // 이전 프레임 지우기
            float angleOffset = (float)((millis() - startTime) % 1000) / 1000.0 * 2.0 * PI; // 1초 동안 회전

            for (int i = 0; i < numLines; ++i) {
                float angle = (2.0 * PI / numLines) * i + angleOffset;
                int x1 = centerX + (radius - lineLength) * cos(angle);
                int y1 = centerY + (radius - lineLength) * sin(angle);
                int x2 = centerX + radius * cos(angle);
                int y2 = centerY + radius * sin(angle);
                display.drawLine(x1, y1, x2, y2, SSD1306_WHITE);
            }
            display.display();
            delay(33); // 애니메이션 프레임 지연 (약 30FPS)
        }
        display.clearDisplay(); // 다음 화면 전에 스피너 지우기
        display.display();
    }

    void showOKMessage() {
        display.clearDisplay();
        display.setTextSize(5); // 큰 텍스트 크기
        display.setTextColor(SSD1306_WHITE);

        const char* ok_text = "OK";
        int16_t x1_bounds, y1_bounds;
        uint16_t w_bounds, h_bounds;
        display.getTextBounds(ok_text, 0, 0, &x1_bounds, &y1_bounds, &w_bounds, &h_bounds);

        int16_t cursorX = (screenWidth - w_bounds) / 2;
        int16_t cursorY = (screenHeight - h_bounds) / 2 + h_bounds/4;

        display.setCursor(cursorX, cursorY);
        display.print(ok_text);
        display.display();
        Serial.println("Displaying: OK");
    }
};

#endif