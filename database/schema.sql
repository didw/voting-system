-- database/schema.sql

-- 디바이스 정보 테이블
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '디바이스 고유 ID',
    mac_address VARCHAR(17) UNIQUE COMMENT '디바이스 MAC 주소 (중복 불가)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록 시간'
);

-- 투표 기록 테이블
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '투표 기록 고유 ID',
    device_id INT COMMENT '투표한 디바이스 ID (devices.id 참조)',
    candidate_id INT COMMENT '투표 대상 후보 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '투표 시간',
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL ON UPDATE CASCADE
    -- 필요시 후보 테이블을 만들고 candidate_id에 대한 외래 키 추가 가능
    -- FOREIGN KEY (candidate_id) REFERENCES candidates(id)
) COMMENT='개별 투표 기록';

-- (관객) 투표 결과 집계 테이블
CREATE TABLE IF NOT EXISTS vote_results (
    name VARCHAR(255) PRIMARY KEY COMMENT '팀 또는 참가자 이름 (고유 식별자)',
    score INT DEFAULT 0 COMMENT '획득한 투표 점수',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 업데이트 시간'
) COMMENT='팀/참가자별 최종 투표 점수';

-- 심사 결과 집계 테이블
CREATE TABLE IF NOT EXISTS judge_results (
    name VARCHAR(255) PRIMARY KEY COMMENT '팀 또는 참가자 이름 (vote_results.name 참조)',
    score INT DEFAULT 0 COMMENT '획득한 심사 점수',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 업데이트 시간',
    FOREIGN KEY (name) REFERENCES vote_results(name) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT='팀/참가자별 최종 심사 점수';

-- 추첨 번호 기록 테이블
CREATE TABLE IF NOT EXISTS lottery (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '추첨 기록 고유 ID',
    number INT UNIQUE NOT NULL COMMENT '추첨된 번호 (중복 불가)',
    drawn_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '추첨 시간'
) COMMENT='로터리 추첨 번호 기록';