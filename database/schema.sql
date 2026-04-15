-- database/schema.sql
-- Voting System Schema for MariaDB

CREATE DATABASE IF NOT EXISTS votedb
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE votedb;

-- 투표 세션 (경연 라운드 단위)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL COMMENT '팀/참가자 이름',
    timer_seconds INT NOT NULL DEFAULT 10 COMMENT '투표 제한 시간(초)',
    status ENUM('waiting', 'voting', 'finished') NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL
) COMMENT='투표 세션 (경연 라운드)';

-- 등록된 디바이스
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mac_address VARCHAR(17) NOT NULL UNIQUE COMMENT 'ESP8266 MAC 주소',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='투표 기기 등록';

-- 개별 투표 기록
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    device_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    UNIQUE KEY uq_session_device (session_id, device_id) COMMENT '세션당 기기당 1표'
) COMMENT='개별 투표 기록';

-- 팀별 최종 결과 (투표 점수 + 심사 점수)
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL UNIQUE,
    vote_score INT NOT NULL DEFAULT 0 COMMENT '관객 투표 점수',
    judge_score INT NOT NULL DEFAULT 0 COMMENT '심사위원 점수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
) COMMENT='팀별 최종 결과';

-- 추첨 기록
CREATE TABLE IF NOT EXISTS lottery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number INT NOT NULL UNIQUE COMMENT '추첨된 번호',
    drawn_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='행운권 추첨 기록';
