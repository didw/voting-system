# 서버 초기 세팅 가이드

새 리눅스 서버(Ubuntu 22.04+)에 투표 시스템을 처음 설치할 때 따라야 하는 전체 과정입니다.

---

## 1. 시스템 요구사항

| 항목 | 최소 사양 |
|------|-----------|
| OS | Ubuntu 22.04 LTS 이상 |
| CPU | 1 core |
| RAM | 1 GB |
| Disk | 10 GB |
| Node.js | 18 이상 |
| MariaDB | 10.6 이상 |
| Mosquitto | 2.0 이상 |

---

## 2. 기본 패키지 설치

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 도구
sudo apt install -y curl git build-essential
```

---

## 3. Node.js 설치 (18 LTS 이상)

```bash
# NodeSource 저장소 추가 및 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 확인
node -v   # v22.x.x
npm -v    # 10.x.x
```

---

## 4. MariaDB 설치 및 설정

```bash
# 설치
sudo apt install -y mariadb-server

# 보안 설정 (root 비밀번호 설정)
sudo mysql_secure_installation
```

### 4.1. DB 및 사용자 생성

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE votedb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jyyang'@'localhost' IDENTIFIED BY 'didwhdduf';
GRANT ALL PRIVILEGES ON votedb.* TO 'jyyang'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **주의:** 사용자명과 비밀번호는 `.env` 파일과 일치해야 합니다. 환경에 맞게 변경하세요.

### 4.2. 자동 시작 설정

```bash
sudo systemctl enable mariadb
sudo systemctl start mariadb
```

---

## 5. Mosquitto MQTT 브로커 설치 및 설정

```bash
# 설치
sudo apt install -y mosquitto mosquitto-clients
```

### 5.1. 인증 설정

```bash
# MQTT 사용자 추가 (비밀번호 입력 프롬프트)
sudo mosquitto_passwd -c /etc/mosquitto/passwd jyyang

# Mosquitto 설정 파일 생성
sudo tee /etc/mosquitto/conf.d/voting.conf > /dev/null << 'EOF'
# 리스너 설정
listener 1883

# 인증 활성화
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF
```

### 5.2. 자동 시작 및 재시작

```bash
sudo systemctl enable mosquitto
sudo systemctl restart mosquitto

# 동작 확인
sudo systemctl status mosquitto
```

### 5.3. MQTT 연결 테스트

```bash
# 터미널 1: 구독
mosquitto_sub -h localhost -p 1883 -u jyyang -P didwhdduf -t "voting/device"

# 터미널 2: 발행
mosquitto_pub -h localhost -p 1883 -u jyyang -P didwhdduf -t "voting/device" -m "mac:AA:BB:CC:DD:EE:FF"
```

---

## 6. 방화벽 설정

```bash
# UFW 활성화 (이미 활성화된 경우 생략)
sudo ufw enable

# SSH (원격 접속)
sudo ufw allow 22/tcp

# MQTT (투표 기기 → 브로커)
sudo ufw allow 1883/tcp

# Dashboard (웹 브라우저 접속)
sudo ufw allow 3000/tcp

# WebSocket (대시보드 실시간 통신)
sudo ufw allow 8080/tcp

# 확인
sudo ufw status
```

---

## 7. 공유기 포트포워딩 (외부 접속 시)

ESP8266 기기나 대시보드가 외부 네트워크에서 접속해야 하는 경우:

| 외부 포트 | → 내부 포트 | 프로토콜 | 용도 |
|-----------|-------------|----------|------|
| 11883 | → 1883 | TCP | MQTT (투표 기기 접속) |
| 3000 | → 3000 | TCP | Dashboard (웹 접속) |
| 8080 | → 8080 | TCP | WebSocket (실시간 통신) |

> **참고:** 같은 내부 네트워크에서만 사용하면 포트포워딩은 불필요합니다.

---

## 8. 프로젝트 설치

```bash
# 프로젝트 클론
git clone <REPOSITORY_URL> ~/voting-system
cd ~/voting-system

# 환경변수 확인 및 수정
nano .env
# → DB_USER, DB_PASSWORD, MQTT_USERNAME, MQTT_PASSWORD 등 환경에 맞게 수정
# → MQTT_EXTERNAL_HOST를 새 서버의 외부 주소(도메인 또는 IP)로 변경

# DB 스키마 적용
mysql -u jyyang -p votedb < database/schema.sql

# 의존성 설치
npm install
```

---

## 9. 서비스 실행

### 9.1. 개발 모드 (테스트)

```bash
# Gateway + Dashboard 동시 실행
npm run dev
```

### 9.2. 프로덕션 모드 (systemd)

#### Gateway 서비스

```bash
sudo tee /etc/systemd/system/voting-gateway.service > /dev/null << EOF
[Unit]
Description=Voting System Gateway
After=network.target mosquitto.service mariadb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/voting-system/gateway
ExecStart=$(which node) dist/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

#### Dashboard 서비스

```bash
sudo tee /etc/systemd/system/voting-dashboard.service > /dev/null << EOF
[Unit]
Description=Voting System Dashboard
After=network.target mariadb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/voting-system/dashboard
ExecStart=$(which npx) next start -p 3000
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

#### 빌드 및 서비스 시작

```bash
cd ~/voting-system

# 프로덕션 빌드
npm run build:gateway
npm run build:dashboard

# 서비스 등록 및 시작
sudo systemctl daemon-reload
sudo systemctl enable voting-gateway voting-dashboard
sudo systemctl start voting-gateway voting-dashboard

# 상태 확인
sudo systemctl status voting-gateway
sudo systemctl status voting-dashboard
```

#### 로그 확인

```bash
# Gateway 로그
journalctl -u voting-gateway -f

# Dashboard 로그
journalctl -u voting-dashboard -f
```

---

## 10. 동작 확인 체크리스트

```
[ ] MariaDB 실행 중:        sudo systemctl status mariadb
[ ] Mosquitto 실행 중:      sudo systemctl status mosquitto
[ ] DB 스키마 적용됨:       mysql -u jyyang -p -e "USE votedb; SHOW TABLES;"
[ ] MQTT 인증 동작:         mosquitto_pub/sub 테스트
[ ] Gateway 실행 중:        sudo systemctl status voting-gateway
[ ] Dashboard 실행 중:      sudo systemctl status voting-dashboard
[ ] 방화벽 포트 열림:       sudo ufw status
[ ] 브라우저 접속 확인:     http://<서버IP>:3000
[ ] Arduino 기기 연결:      OLED에 "Done" 표시 확인
```

---

## 11. 서비스 관리 명령어 요약

```bash
# 시작
sudo systemctl start voting-gateway voting-dashboard

# 중지
sudo systemctl stop voting-gateway voting-dashboard

# 재시작
sudo systemctl restart voting-gateway voting-dashboard

# 로그 (실시간)
journalctl -u voting-gateway -f
journalctl -u voting-dashboard -f

# 코드 업데이트 후 재배포
cd ~/voting-system
git pull
npm install
npm run build:gateway
npm run build:dashboard
sudo systemctl restart voting-gateway voting-dashboard
```
