# Arduino 투표 기기 펌웨어 업로드 가이드

ESP8266 투표 기기에 펌웨어를 업로드하는 방법입니다.

---

## 1. 준비물

| 항목 | 설명 |
|------|------|
| PC | Windows, macOS, 또는 Linux |
| USB 케이블 | Micro USB (데이터 전송 가능한 케이블) |
| ESP8266 보드 | NodeMCU 또는 호환 보드 |
| Arduino IDE | 2.0 이상 권장 |

---

## 2. Arduino IDE 설치 (최초 1회)

### 2.1. IDE 설치

[https://www.arduino.cc/en/software](https://www.arduino.cc/en/software) 에서 다운로드 후 설치합니다.

### 2.2. ESP8266 보드 패키지 추가

1. `파일` → `환경설정` (macOS: `Arduino IDE` → `Settings`)
2. **추가적인 보드 매니저 URLs** 에 아래 주소 입력:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. 확인 클릭

### 2.3. ESP8266 보드 설치

1. `툴` → `보드` → `보드 매니저`
2. 검색: `esp8266`
3. **esp8266 by ESP8266 Community** 설치

### 2.4. 라이브러리 설치

`스케치` → `라이브러리 포함하기` → `라이브러리 관리` 에서 아래 3개를 검색하여 설치:

| 라이브러리 | 용도 |
|-----------|------|
| `Adafruit SSD1306` | OLED 디스플레이 드라이버 |
| `Adafruit GFX Library` | 그래픽 프리미티브 |
| `PubSubClient` | MQTT 클라이언트 |

> `Adafruit SSD1306` 설치 시 `Adafruit GFX Library`도 함께 설치할지 묻는 대화상자가 나오면 "Install All"을 선택합니다.

---

## 3. 서버 설정 변경 (새 인프라로 이전 시)

펌웨어를 업로드하기 전에 `arduino/voting_device/config.h` 파일을 수정합니다.

```c
#ifndef CONFIG_H
#define CONFIG_H

// WiFi — 이벤트 장소의 WiFi 정보로 변경
const char* WIFI_SSID     = "이벤트장_SSID";
const char* WIFI_PASSWORD  = "WiFi비밀번호";

// MQTT — 새 서버 주소로 변경
const char* MQTT_BROKER   = "새서버.도메인.com";  // 또는 공인 IP
const int   MQTT_PORT     = 11883;                // 포트포워딩된 외부 포트
const char* MQTT_TOPIC    = "voting/device";
const char* MQTT_USERNAME = "jyyang";
const char* MQTT_PASSWORD = "didwhdduf";

// Hardware — 변경 불필요
const int PIN_BUTTON_OK   = D4;

// Timing — 변경 불필요
const unsigned long DEBOUNCE_MS = 300;

#endif
```

### 변경 필수 항목

| 항목 | 설명 | 예시 |
|------|------|------|
| `WIFI_SSID` | 이벤트 장소 WiFi 이름 | `"EventHall_5G"` |
| `WIFI_PASSWORD` | WiFi 비밀번호 | `"hall1234"` |
| `MQTT_BROKER` | 서버 외부 주소 (도메인 또는 IP) | `"vote.example.com"` |
| `MQTT_PORT` | MQTT 외부 포트 | `11883` (포트포워딩) 또는 `1883` (같은 네트워크) |

### 같은 네트워크에서 사용하는 경우

기기와 서버가 같은 내부 네트워크에 있으면:

```c
const char* MQTT_BROKER   = "192.168.0.100";  // 서버 내부 IP
const int   MQTT_PORT     = 1883;             // 포트포워딩 불필요
```

---

## 4. 업로드 절차

### 4.1. 프로젝트 열기

Arduino IDE에서 `파일` → `열기` → `arduino/voting_device/voting_device.ino` 선택

> `.ino` 파일을 열면 같은 폴더의 `.h` 파일들(`config.h`, `wifi_manager.h`, `mqtt_handler.h`, `display_manager.h`)이 탭으로 자동 로드됩니다.

### 4.2. 보드 설정

`툴` 메뉴에서 아래와 같이 설정:

| 설정 항목 | 값 |
|-----------|-----|
| 보드 | NodeMCU 1.0 (ESP-12E Module) |
| Upload Speed | 115200 |
| Flash Size | 4MB (FS:2MB OTA:~1019KB) |
| 포트 | USB 연결 후 나타나는 COM 포트 (Windows: `COM3` 등, macOS: `/dev/cu.usbserial-xxxx`, Linux: `/dev/ttyUSB0`) |

> **포트가 안 보이는 경우:**
> - USB 케이블이 데이터 전송을 지원하는지 확인 (충전 전용 케이블은 불가)
> - CH340/CP2102 USB 드라이버 설치가 필요할 수 있음
>   - CH340: [https://www.wch.cn/downloads/CH341SER_EXE.html](https://www.wch.cn/downloads/CH341SER_EXE.html)
>   - CP2102: [https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)

### 4.3. 컴파일 확인

`스케치` → `확인/컴파일` (또는 `Ctrl+R` / `Cmd+R`)

오류 없이 `컴파일 완료` 메시지가 나오면 진행합니다.

### 4.4. 업로드

1. ESP8266 보드를 USB로 PC에 연결
2. `스케치` → `업로드` (또는 `Ctrl+U` / `Cmd+U`)
3. 업로드 진행 바가 100%까지 완료될 때까지 대기
4. `업로드 완료` 메시지 확인

### 4.5. 동작 확인

업로드 후 기기가 자동으로 재시작됩니다:

1. OLED에 `Loading...` 표시
2. WiFi 연결 시도 (시리얼 모니터에 `WiFi connecting...` 출력)
3. MQTT 연결 시도 (시리얼 모니터에 `MQTT connecting...connected` 출력)
4. OLED에 WiFi/MQTT 상태 표시 (`WiFi: OK`, `MQTT: OK`)
5. OLED에 `Done` 표시 (1초)
6. 화면 클리어 → 대기 상태

> **시리얼 모니터**: `툴` → `시리얼 모니터` (115200 baud) 에서 디버그 로그를 확인할 수 있습니다.

---

## 5. 여러 대 일괄 업로드

기기가 여러 대인 경우 아래 순서로 작업합니다:

1. `config.h`에서 WiFi/MQTT 설정을 한 번만 수정
2. 첫 번째 기기를 USB에 연결 → 포트 선택 → 업로드
3. 업로드 완료 후 USB 분리
4. 다음 기기를 USB에 연결 → 포트 선택 → 업로드 (컴파일은 캐시됨)
5. 반복

> 모든 기기는 같은 펌웨어를 사용합니다. MAC 주소로 자동 식별되므로 기기별 개별 설정은 불필요합니다.

---

## 6. 문제 해결

| 증상 | 원인 및 해결 |
|------|-------------|
| OLED에 아무것도 안 뜸 | OLED 배선 확인 (SDA→D2, SCL→D1), I2C 주소 0x3C 확인 |
| `Loading...`에서 멈춤 | WiFi SSID/PW 확인, WiFi 2.4GHz 인지 확인 (5GHz 미지원) |
| `WiFi: OK` / `MQTT: ...` | 서버 주소/포트 확인, Mosquitto 실행 여부, 방화벽/포트포워딩 확인 |
| OK 누르면 반응 없음 | 시리얼 모니터에서 MQTT 연결 상태 확인, 버튼 배선 (D4 → GND) 확인 |
| 업로드 실패 `espcomm_upload_mem failed` | 다른 USB 포트 시도, USB 케이블 교체, 업로드 중 FLASH 버튼 누르기 |
| 포트가 목록에 없음 | CH340/CP2102 드라이버 설치, 데이터 전송 가능 USB 케이블 사용 |
