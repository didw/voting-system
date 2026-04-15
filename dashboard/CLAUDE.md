# Dashboard (Next.js)

## Overview

Next.js App Router 기반 풀스택 대시보드. API Routes로 DB CRUD, React 페이지로 투표/심사/순위/추첨 UI 제공.

## Pages

| Route | 기능 |
|-------|------|
| `/` | 홈 (페이지 네비게이션) |
| `/voting` | 투표 진행 (팀 입력 → 타이머 → 실시간 카운트 → 결과) |
| `/judge` | 심사위원 점수 입력 (팀별 테이블) |
| `/ranking` | 순위 발표 (1/2/3등 스핀 애니메이션) |
| `/lucky-draw` | 행운권 추첨 (번호 범위 설정, 스핀, 이력) |

## API Routes

| Endpoint | Methods | 기능 |
|----------|---------|------|
| `/api/teams` | GET, POST, PATCH, DELETE | 세션 CRUD, 투표 시작/종료, 전체 리셋 |
| `/api/votes` | GET, DELETE | 세션별 투표 수 조회, 리셋 |
| `/api/judge` | GET, POST | 심사 점수 조회/입력 |
| `/api/lottery` | GET, POST, DELETE | 추첨 이력, 번호 추첨, 초기화 |

## Components

- `Timer.tsx` — 카운트다운 (감속 효과, 긴급 시 빨간색 pulse)
- `ScoreDisplay.tsx` — 대형 점수 표시 (scale 애니메이션)
- `RankingReveal.tsx` — 이름 스핀 → 우승자 공개
- `LotteryWheel.tsx` — 숫자 스핀 → 당첨 번호 공개

## Realtime

`useWebSocket` 훅으로 Gateway WebSocket 서버에 연결. 투표 이벤트 수신 시 UI 자동 갱신.

## Run

```bash
npm run dev     # 개발 서버 (포트 3000)
npm run build   # 프로덕션 빌드
npm start       # 프로덕션 실행
```
