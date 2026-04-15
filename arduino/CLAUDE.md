# Arduino Voting Device

## Overview

ESP8266 기반 투표 기기 펌웨어. OK 버튼을 누르면 MQTT를 통해 투표 메시지를 전송하고, OLED 디스플레이에 피드백 애니메이션을 표시한다.

## Hardware

- MCU: ESP8266 (NodeMCU 호환)
- Display: SSD1306 128x64 OLED (I2C, 주소 0x3C)
- Input: OK 버튼 (D4, INPUT_PULLUP, LOW = 눌림)

## File Structure

```
voting_device/
├── config.h            # WiFi/MQTT 설정값 (SSID, PW, Broker, Topic)
├── voting_device.ino   # 메인 스케치 (setup/loop, 버튼 처리)
├── wifi_manager.h      # WiFi 연결 및 상태 확인
├── mqtt_handler.h      # MQTT 연결, 발행, 자동 재연결
└── display_manager.h   # OLED 제어 (Loading, Done, OK, Status, Spinner)
```

## Dependencies (Arduino Library Manager)

- `Adafruit_SSD1306`, `Adafruit_GFX` - OLED 드라이버
- `PubSubClient` - MQTT 클라이언트
- `ESP8266WiFi` - WiFi (보드 패키지 포함)

## Data Flow

```
setup():
  OLED "Loading..." → WiFi 연결 → MQTT 연결 → Status 표시
  → "mac:<MAC>" 발행 → "Done" → 화면 클리어

loop():
  OK 버튼 (300ms debounce) → "vote:0,mac:<MAC>" 발행
  → Spinner (800ms) → "OK" (800ms) → 화면 클리어
```

## MQTT

- Broker/Port/인증: config.h에서 설정
- Topic: `voting/device`
- 메시지: `mac:AA:BB:CC:DD:EE:FF` (등록), `vote:0,mac:AA:BB:CC:DD:EE:FF` (투표)
