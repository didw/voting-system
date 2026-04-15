# Gateway (MQTT → DB + WebSocket)

## Overview

Mosquitto 브로커에 연결하여 `voting/device` 토픽을 구독하고, 메시지를 파싱하여 MariaDB에 저장하며, WebSocket으로 대시보드에 실시간 푸시하는 Node.js 서비스.

## Files

```
gateway/src/
├── index.ts          # 진입점 (WS 서버 + MQTT 클라이언트 시작)
├── config.ts         # .env 로드 (DB, MQTT, WS 설정)
├── db.ts             # MariaDB 커넥션 풀, 기기 등록, 투표 기록
├── mqtt-client.ts    # MQTT 구독, 메시지 파싱 및 처리
└── ws-server.ts      # WebSocket 서버, broadcast 함수
```

## Run

```bash
npm run dev    # tsx watch 모드
npm run build  # tsc 컴파일
npm start      # dist/index.js 실행
```

## Message Processing

| 메시지 | 처리 |
|--------|------|
| `mac:<MAC>` | ensureDevice → broadcast "device_registered" |
| `vote:0,mac:<MAC>` | ensureDevice → 활성 세션 조회 → recordVote (중복 무시) → broadcast "vote" |

## WebSocket Events (→ Dashboard)

- `{ type: "device_registered", mac, deviceId }`
- `{ type: "vote", sessionId, count }`

## Key Design

- 커넥션 풀 (mysql2, limit 10)
- 활성 세션 없으면 투표 무시
- `UNIQUE(session_id, device_id)`로 DB 레벨 중복 방지
- 자동 재연결 (MQTT, WebSocket)
