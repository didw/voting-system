# Voting System - Project Guide

## Overview

실시간 투표 및 행운권 추첨 시스템. IoT 기기(ESP8266)로 청중이 투표하고, MQTT 브로커가 메시지를 중계하며, Next.js 대시보드에서 결과를 표시한다.

## Architecture

```
Arduino (ESP8266) --MQTT--> Mosquitto Broker <--MQTT-- Gateway (Node.js)
                                                          |
                                                     MariaDB (votedb)
                                                          |
                                                    WebSocket push
                                                          |
                                                   Next.js Dashboard
```

- **arduino/**: ESP8266 투표 기기 펌웨어 (C++/Arduino)
- **gateway/**: MQTT 구독 → DB 저장 → WebSocket 실시간 푸시 (Node.js/TypeScript)
- **dashboard/**: Next.js App Router 풀스택 (API Routes + React UI)
- **database/**: MariaDB 스키마 (schema.sql)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Device | ESP8266, SSD1306 OLED, Arduino C++ |
| Protocol | MQTT (Mosquitto, port 1883 / 외부 11883) |
| Gateway | Node.js, TypeScript, mqtt.js, mysql2, ws |
| Backend | Next.js API Routes, mysql2 |
| Frontend | Next.js (React), Tailwind CSS |
| Database | MariaDB (votedb) |
| Realtime | WebSocket (gateway → dashboard) |

## Project Structure

```
voting-system/
├── .env                         # DB/MQTT/WS 설정
├── package.json                 # 모노레포 루트 (workspaces)
├── arduino/voting_device/       # ESP8266 펌웨어
│   ├── config.h                 # WiFi/MQTT 설정값
│   ├── voting_device.ino        # 메인 스케치
│   ├── wifi_manager.h           # WiFi 연결
│   ├── mqtt_handler.h           # MQTT 클라이언트
│   └── display_manager.h        # OLED 제어
├── database/
│   └── schema.sql               # DB 테이블 정의
├── gateway/                     # MQTT → DB + WebSocket
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # 진입점
│       ├── config.ts            # .env 로드
│       ├── db.ts                # MariaDB 커넥션 풀
│       ├── mqtt-client.ts       # MQTT 구독 및 메시지 처리
│       └── ws-server.ts         # WebSocket 서버
└── dashboard/                   # Next.js 풀스택
    ├── package.json
    ├── .env.local               # 환경변수
    └── src/
        ├── lib/
        │   ├── config.ts        # 환경변수 로드
        │   └── db.ts            # MariaDB 커넥션 풀
        ├── hooks/
        │   └── useWebSocket.ts  # WebSocket 연결 훅
        ├── components/
        │   ├── Timer.tsx         # 카운트다운 타이머
        │   ├── ScoreDisplay.tsx  # 대형 점수 표시
        │   ├── RankingReveal.tsx # 순위 발표 애니메이션
        │   └── LotteryWheel.tsx  # 추첨 스피닝 애니메이션
        └── app/
            ├── layout.tsx       # 공통 레이아웃 + 네비게이션
            ├── page.tsx         # 홈
            ├── voting/page.tsx  # 투표 진행
            ├── judge/page.tsx   # 심사위원 점수 입력
            ├── ranking/page.tsx # 순위 발표
            ├── lucky-draw/page.tsx # 행운권 추첨
            └── api/
                ├── teams/route.ts   # 세션(팀) CRUD
                ├── votes/route.ts   # 투표 현황 조회
                ├── judge/route.ts   # 심사 점수 입력
                └── lottery/route.ts # 추첨 번호 관리
```

## Database

- Host: localhost, DB: votedb, User: jyyang
- 주요 테이블: `sessions`, `devices`, `votes`, `results`, `lottery`
- 스키마: `database/schema.sql`
- votes 테이블에 `UNIQUE(session_id, device_id)`로 세션당 기기당 1표 보장

## Build & Run

```bash
# 의존성 설치 (루트에서 전체)
npm install

# Gateway 실행 (Mosquitto가 별도로 실행 중이어야 함)
npm run dev:gateway

# Dashboard 실행
npm run dev:dashboard

# 동시 실행
npm run dev
```

## MQTT Protocol

- Topic: `voting/device`
- 기기 등록: `mac:<MAC_ADDRESS>`
- 투표: `vote:0,mac:<MAC_ADDRESS>`
- 인증: username/password 방식 (.env에서 관리)

## Conventions

- 언어: 한국어 UI, 영문 코드
- 전체 TypeScript (gateway, dashboard)
- DB 접근: mysql2 커넥션 풀 (gateway/src/db.ts, dashboard/src/lib/db.ts)
- 실시간: Gateway → WebSocket → Dashboard (useWebSocket 훅)
- 설정: .env 파일에서 모든 자격증명/설정 관리
- Arduino: config.h에 WiFi/MQTT 설정 분리
