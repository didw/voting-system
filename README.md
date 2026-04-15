# 실시간 투표 및 추첨 시스템

## 1. 개요

실시간 투표와 행운권 추첨 기능을 제공하는 이벤트 시스템입니다. ESP8266 기반 IoT 투표 기기, MQTT 메시지 브로커, Node.js 게이트웨이, Next.js 대시보드로 구성됩니다.

경연/발표 이벤트에서 청중이 전용 기기로 투표하고, 실시간으로 결과를 집계하며, 심사위원 점수와 합산하여 최종 순위를 발표할 수 있습니다.

---

## 2. 주요 기능

- **실시간 투표:** 청중이 전용 하드웨어 기기(ESP8266)로 투표 (세션당 기기당 1표)
- **라이브 카운트:** WebSocket을 통해 투표 수를 실시간으로 대시보드에 표시
- **심사위원 점수:** 대시보드에서 팀별 심사위원 점수를 수동 입력
- **순위 발표:** 투표 + 심사 합산 점수로 1/2/3등 애니메이션 발표
- **행운권 추첨:** 설정 가능한 번호 범위에서 중복 없이 랜덤 추첨
- **안전한 통신:** MQTT username/password 인증

---

## 3. 시스템 아키텍처

```
Arduino (ESP8266)
    ↓ MQTT (voting/device)
Mosquitto Broker
    ↓ MQTT Subscribe
Gateway (Node.js/TypeScript)
    ↓ DB Write + WebSocket Push
MariaDB (votedb)
    ↑ REST API (mysql2)
Next.js Dashboard (API Routes + React)
```

| 구성 요소 | 기술 | 역할 |
|-----------|------|------|
| 투표 기기 | ESP8266, SSD1306 OLED | 버튼 입력 → MQTT 투표 메시지 전송 |
| MQTT 브로커 | Mosquitto | 기기 ↔ 게이트웨이 메시지 중계 |
| 게이트웨이 | Node.js, mqtt.js, ws | MQTT 구독 → DB 저장 → WebSocket 푸시 |
| 데이터베이스 | MariaDB | 세션, 기기, 투표, 결과, 추첨 데이터 저장 |
| 대시보드 | Next.js, Tailwind CSS | 투표 진행, 심사 입력, 순위 발표, 추첨 UI |

---

## 4. 프로젝트 구조

```
voting-system/
├── .env                         # DB/MQTT/WS 자격증명 및 설정
├── package.json                 # 모노레포 (npm workspaces)
├── docs/
│   ├── SETUP.md                 # 서버 초기 세팅 가이드
│   └── ARDUINO_UPLOAD.md        # Arduino 펌웨어 업로드 가이드
├── arduino/voting_device/       # ESP8266 펌웨어
│   ├── config.h                 # WiFi/MQTT 설정
│   ├── voting_device.ino        # 메인 스케치
│   ├── wifi_manager.h           # WiFi 연결
│   ├── mqtt_handler.h           # MQTT 클라이언트
│   └── display_manager.h        # OLED 제어
├── database/
│   └── schema.sql               # MariaDB 스키마
├── gateway/                     # MQTT Gateway (Node.js)
│   └── src/
│       ├── index.ts             # 진입점
│       ├── config.ts            # .env 로드
│       ├── db.ts                # MariaDB 커넥션 풀
│       ├── mqtt-client.ts       # MQTT 구독/메시지 처리
│       └── ws-server.ts         # WebSocket 서버
└── dashboard/                   # Next.js 대시보드
    └── src/
        ├── lib/                 # DB, 환경변수
        ├── hooks/               # useWebSocket
        ├── components/          # Timer, ScoreDisplay, RankingReveal, LotteryWheel
        └── app/
            ├── voting/          # 투표 진행
            ├── judge/           # 심사위원 점수 입력
            ├── ranking/         # 순위 발표
            ├── lucky-draw/      # 행운권 추첨
            └── api/             # REST API (teams, votes, judge, lottery)
```

---

## 5. 빠른 시작 (같은 PC에서 테스트)

### 5.1. 필수 소프트웨어

- **Node.js 18+**: [https://nodejs.org/](https://nodejs.org/)
- **MariaDB**: [https://mariadb.org/download/](https://mariadb.org/download/)
- **Mosquitto**: [https://mosquitto.org/download/](https://mosquitto.org/download/)

### 5.2. 설치 및 실행

```bash
# 1. 프로젝트 클론
git clone <REPOSITORY_URL>
cd voting-system

# 2. .env 확인/수정
nano .env

# 3. DB 스키마 적용
mysql -u jyyang -p votedb < database/schema.sql

# 4. 의존성 설치
npm install

# 5. Gateway + Dashboard 동시 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## 6. 서버 배포 (새 인프라)

별도 리눅스 서버에 배포하는 경우 아래 문서를 참고하세요:

**[docs/SETUP.md](docs/SETUP.md)** — 서버 초기 세팅 가이드
- 시스템 요구사항
- Node.js, MariaDB, Mosquitto 설치
- DB 사용자 및 스키마 설정
- Mosquitto MQTT 인증 설정
- 방화벽 (UFW) 포트 오픈
- 공유기 포트포워딩
- systemd 서비스 등록 (프로덕션)
- 코드 업데이트 후 재배포 방법

### 필요 포트 요약

| 포트 | 용도 | 외부 접속 시 포트포워딩 |
|------|------|------------------------|
| 1883 | MQTT (기기 통신) | 11883 → 1883 |
| 3000 | Dashboard (웹 UI) | 3000 → 3000 |
| 8080 | WebSocket (실시간) | 8080 → 8080 |

---

## 7. Arduino 투표 기기

**[docs/ARDUINO_UPLOAD.md](docs/ARDUINO_UPLOAD.md)** — 펌웨어 업로드 가이드
- Arduino IDE 설치 및 ESP8266 보드/라이브러리 설정
- `config.h`에서 WiFi/MQTT 서버 주소 변경 방법
- 컴파일 및 업로드 절차
- 여러 대 일괄 업로드 방법
- 문제 해결 (OLED, WiFi, MQTT, 드라이버)

### config.h 주요 설정

```c
const char* WIFI_SSID     = "이벤트장_WiFi";       // 현장 WiFi
const char* WIFI_PASSWORD  = "WiFi비밀번호";

const char* MQTT_BROKER   = "서버주소.com";         // 서버 외부 주소
const int   MQTT_PORT     = 11883;                 // 포트포워딩된 포트
```

---

## 8. 대시보드 페이지

| URL | 기능 |
|-----|------|
| `/` | 홈 (페이지 네비게이션) |
| `/voting` | 투표 진행 (팀 이름 입력 → 타이머 → 실시간 카운트 → 결과) |
| `/judge` | 심사위원 점수 입력 (팀별 테이블) |
| `/ranking` | 순위 발표 (1/2/3등 스핀 애니메이션) |
| `/lucky-draw` | 행운권 추첨 (번호 범위 설정, 스핀, 이력) |

---

## 9. MQTT 프로토콜

| 메시지 | 형식 | 설명 |
|--------|------|------|
| 기기 등록 | `mac:AA:BB:CC:DD:EE:FF` | 기기 부팅 시 MAC 주소 전송 |
| 투표 | `vote:0,mac:AA:BB:CC:DD:EE:FF` | OK 버튼 누를 때 투표 전송 |

- Topic: `voting/device`
- 인증: username/password (`.env`에서 관리)
- 세션당 기기당 1표 (DB UNIQUE 제약으로 보장)
