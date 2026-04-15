# Voting System — Production Hardening Design

**Date:** 2026-04-15  
**Status:** Approved  

## Overview

실시간 투표 시스템을 상용화 수준으로 개선한다. 11가지 결함(Critical 3, High 5, Medium 3)을 수정하고, 기기 모니터링을 강화하며, WebSocket 안정성을 높인다.

---

## 1. DB Migration

### 변경 사항
`devices` 테이블에 컬럼 1개 추가:

```sql
ALTER TABLE devices
  ADD COLUMN last_voted_at TIMESTAMP NULL
  COMMENT '마지막 투표 버튼 누른 시각';
```

### 의미 구분
- `last_seen_at` — 전원을 켠 시각 (`mac:` 메시지 수신 시 갱신)
- `last_voted_at` — 투표 버튼을 누른 시각 (`vote:` 메시지 수신 시 갱신)

### 마이그레이션 파일
`database/schema.sql`에 ALTER 문 추가 + `database/migrate.sql` 별도 파일로 기존 DB에 적용 가능하게 제공.

---

## 2. Gateway 수정

### 2a. `db.ts`
- `ensureDevice(mac)`: `last_seen_at`만 갱신 (변경 없음)
- `recordVote(sessionId, deviceId)`: INSERT 후 `last_voted_at = NOW()` UPDATE 추가

```ts
// recordVote 내부 추가
await pool.execute(
  "UPDATE devices SET last_voted_at = NOW() WHERE id = ?",
  [deviceId]
);
```

### 2b. `ws-server.ts` — Ping/Pong Heartbeat 추가
- 30초 간격으로 모든 클라이언트에 ping 발송
- pong 응답 없는 클라이언트 강제 종료 (`terminate()`)
- 죽은 연결 축적 방지

```ts
setInterval(() => {
  for (const ws of wss.clients) {
    if (!(ws as any).isAlive) { ws.terminate(); continue; }
    (ws as any).isAlive = false;
    ws.ping();
  }
}, 30_000);
```

### 2c. `mqtt-client.ts` — `device_voted` 이벤트 추가
투표 수신 시 `device_activity`에 더해 `device_voted` 이벤트를 별도 broadcast:

```ts
broadcast("device_voted", { mac, deviceId, lastVotedAt: new Date().toISOString() });
```

---

## 3. Dashboard — Devices 탭

### 3a. `/api/devices/route.ts` 수정
- `last_voted_at` 컬럼 포함하여 반환
- `DELETE` 메서드 추가 (`DELETE /api/devices` — 기기 목록 초기화)

### 3b. 상태 로직 (새 기준)
| 상태 | 조건 |
|------|------|
| 🟢 온라인 | `last_seen_at` 24시간 이내 + `last_voted_at` 30분 이내 |
| 🟡 대기중 | `last_seen_at` 24시간 이내 + (`last_voted_at` 30분 초과 OR NULL) |
| 🔴 오프라인 | `last_seen_at` 24시간 초과 |

> "24시간 이내" 판단: `Date.now() - new Date(last_seen_at).getTime() < 24 * 60 * 60 * 1000` (타임존 무관, 절대 ms 비교)

### 3c. UI 레이아웃 (50~100대 대응)
- **요약 바**: 온라인/대기중/오프라인/전체 count를 상단 pill 한 줄로 표시
- **검색 + 필터**: MAC 주소 검색 입력, 상태 드롭다운 필터
- **컴팩트 테이블**: 행 높이 축소, 스티키 헤더, 스크롤 가능
- **컬럼**: #, MAC 주소, 상태, 전원 켬 시각, 마지막 투표
- **기기 목록 초기화 버튼**: `DELETE /api/devices` 호출, 확인 dialog 포함
- **WS 실시간**: `device_registered`, `device_activity`, `device_voted` 이벤트 수신 시 즉시 갱신

### 3d. `useWebSocket` 훅 — 지수 백오프 재연결
고정 2초 → 지수 백오프 (2s → 4s → 8s → 최대 30s):

```ts
let retryDelay = 2000;
ws.onclose = () => {
  setConnected(false);
  setTimeout(connect, retryDelay);
  retryDelay = Math.min(retryDelay * 2, 30_000);
};
ws.onopen = () => { setConnected(true); retryDelay = 2000; };
```

---

## 4. Dashboard — 투표 탭

### 4a. 중복 세션 방지
- `startVoting()` 호출 즉시 버튼 `disabled` + `loading` 상태 설정
- API 응답 전까지 재클릭 불가

### 4b. WS 연결 상태 표시
- `useWebSocket`이 반환하는 `connected` 상태 사용
- 투표 진행 중 (`phase === "voting"`) + `!connected` 시 우상단 소형 배지 표시:
  ```
  ⚠ 연결 끊김  (10px, 반투명)
  ```

### 4c. 폴링 폴백 (WS 끊김 대비)
- 투표 `phase === "voting"` + `!connected` 시 5초 간격 `GET /api/votes?sessionId=X` 폴링
- WS 재연결 시 폴링 중단

### 4d. 페이지 이탈 경고
- `window.beforeunload` 이벤트: 투표 진행 중(`phase === "voting"`) 페이지 이탈 시 브라우저 경고 dialog

### 4e. UI 레이아웃 (참가자 대형 화면 기준)
- 투표 수: **120px bold** — 멀리서 보이도록
- 팀명 + 타이머: 상단, 작게 (18px / 14px)
- WS 경고: 우상단 절대 위치, 10px 소형 배지
- 결과 화면도 동일하게 큰 숫자 유지

---

## 5. Dashboard — 행운권 추첨 탭

### 수정 흐름 (현재 버그 → 수정)

**현재 (버그):**  
`startDraw()` → LotteryWheel 애니메이션 시작 → 애니메이션 완료 후 서버 API 호출 → 서버가 다른 번호를 반환 → 화면과 실제 번호 불일치

**수정 후:**  
`startDraw()` → 서버 API 먼저 호출 → 당첨 번호 확정 → LotteryWheel에 `targetNumber` prop 전달 → 해당 번호로 정확히 랜딩하는 애니메이션

### `LotteryWheel` 컴포넌트 수정
- `targetNumber: number` prop 추가
- 애니메이션이 `targetNumber`로 정확히 멈추도록 수정
- 로딩 중(서버 응답 대기): "추첨 중..." 스피너 표시

---

## 6. Dashboard — Ranking 탭

### 수정
- `GET /api/teams?status=finished` 쿼리 파라미터 지원 추가 (API 레벨 필터)
- Ranking 페이지는 `fetch("/api/teams?status=finished")`로 호출
- `GET /api/teams` 파라미터 없을 시 기존 동작(전체 반환) 유지

---

## 7. Dashboard — Judge 탭

### 수정
- `saveAll()`: `for` 루프 순차 → `Promise.all` 병렬 호출
- 저장 완료 후 버튼 텍스트가 "전체 저장" → "✓ 저장됨"으로 1.5초간 변경 후 복귀

---

## 8. `/api/teams` DELETE 수정

`DELETE /api/teams` (전체 세션 리셋)에서 `DELETE FROM devices` 제거.  
기기 삭제는 `DELETE /api/devices`로 분리.

---

## 9. 에러 핸들링

### 방식
- 전역 토스트 시스템 없이 인라인 에러 상태로 처리 (scope 최소화)
- 각 페이지에서 API 실패 시 `console.error` 대신 화면에 간단한 에러 메시지 표시
- 투표 시작/종료 실패 시 버튼 상태 복구 (disabled 해제)

---

## 10. 파일별 변경 범위

| 파일 | 변경 |
|------|------|
| `database/schema.sql` | `last_voted_at` 컬럼 추가 |
| `database/migrate.sql` | 기존 DB용 ALTER 문 (신규) |
| `gateway/src/db.ts` | `recordVote` — `last_voted_at` 갱신 |
| `gateway/src/ws-server.ts` | ping/pong heartbeat |
| `gateway/src/mqtt-client.ts` | `device_voted` 이벤트 broadcast |
| `dashboard/src/hooks/useWebSocket.ts` | 지수 백오프 재연결 |
| `dashboard/src/app/api/devices/route.ts` | `last_voted_at` 포함 반환, DELETE 추가 |
| `dashboard/src/app/api/teams/route.ts` | DELETE에서 devices 제외; GET에 status 필터 |
| `dashboard/src/app/devices/page.tsx` | 새 상태 로직, 컴팩트 UI, 검색/필터, 초기화 버튼 |
| `dashboard/src/app/voting/page.tsx` | 중복 방지, WS 배지, 폴링 폴백, beforeunload, 대형 숫자 |
| `dashboard/src/app/ranking/page.tsx` | finished 필터 |
| `dashboard/src/app/judge/page.tsx` | Promise.all 병렬 저장 |
| `dashboard/src/app/lucky-draw/page.tsx` | 서버 먼저 호출 후 애니메이션 |
| `dashboard/src/components/LotteryWheel.tsx` | `targetNumber` prop 추가 |

---

## 11. 구현 순서 (의존성 기준)

1. DB migration (`last_voted_at`) — 이후 모든 기기 관련 변경의 전제
2. Gateway 수정 (db.ts, ws-server.ts, mqtt-client.ts)
3. Dashboard API 수정 (devices, teams)
4. `useWebSocket` 훅 개선
5. Devices 탭 UI 전면 개선
6. 투표 탭 개선
7. Ranking / Judge / Lucky Draw 수정
