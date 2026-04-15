# Database Schema

## Overview

MariaDB 스키마 정의. 투표 세션, 기기 등록, 투표 기록, 결과 집계, 추첨 기록을 저장한다.

## Tables

### sessions
투표 세션 (경연 라운드 단위). 팀 이름, 타이머, 상태 관리.
- `id` INT PK, `team_name`, `timer_seconds`, `status` ENUM(waiting/voting/finished)
- `created_at`, `finished_at`

### devices
ESP8266 MAC 주소로 기기 등록.
- `id` INT PK, `mac_address` VARCHAR(17) UNIQUE

### votes
개별 투표 기록. 세션당 기기당 1표 (UNIQUE 제약).
- `id` INT PK, `session_id` FK, `device_id` FK
- `UNIQUE(session_id, device_id)` — 중복 투표 방지

### results
세션별 투표 점수 + 심사 점수 집계.
- `id` INT PK, `session_id` FK UNIQUE
- `vote_score`, `judge_score`

### lottery
추첨된 번호 기록. `number` UNIQUE로 중복 방지.

## Setup

```bash
mysql -u root -p < database/schema.sql
```
