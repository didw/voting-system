# 실시간 투표 및 추첨 시스템

## 1\. 개요 (Overview)

본 프로젝트는 실시간 투표와 추첨 기능을 제공하는 시스템입니다. 사물인터넷(IoT) 기기(Arduino), 메시지 통신을 위한 MQTT 브로커, 그리고 결과 확인 및 이벤트 관리를 위한 웹 대시보드로 구성되어 있습니다. 발표나 경연과 같이 청중의 참여가 필요한 이벤트에서 활용할 수 있도록 설계되었습니다.

---

## 2\. 주요 기능 (Features)

- **실시간 투표:** 청중은 전용 하드웨어 기기를 사용하여 투표에 참여할 수 있습니다.
- **라이브 결과 대시보드:** 투표 결과를 실시간으로 보여주는 웹 인터페이스를 제공합니다.
- **최종 결과 발표:** 투표 결과에 따라 최종 우승자를 극적으로 발표하는 대시보드 기능이 포함됩니다.
- **행운권 추첨:** 경품 추첨을 위한 번호 추첨 시스템을 제공합니다.
- **안전한 통신:** 사용자 이름과 비밀번호 인증을 통해 MQTT 통신을 보호합니다.

---

## 3\. 시스템 아키텍처 (System Architecture)

이 시스템은 다음 구성 요소로 이루어져 있습니다.

1.  **투표 기기 (Arduino):** 투표용 버튼과 상태 표시를 위한 디스플레이가 장착된 ESP8266 기반 기기입니다. WiFi에 연결하여 MQTT 브로커와 통신합니다.
2.  **MQTT 브로커:** 투표 기기와 백엔드 애플리케이션 간의 메시지를 중계하는 중앙 서버입니다. 투표 데이터와 기기 상태를 수신합니다.
3.  **데이터베이스 (MariaDB):** 기기 정보, 투표 내역, 결과 등 모든 데이터를 저장합니다.
4.  **대시보드 (Streamlit):** 다음과 같은 기능을 제공하는 Python 웹 애플리케이션 세트입니다.
    - 실시간 투표 현황 집계
    - 최종 우승자 발표
    - 행운권 추첨 진행

---

## 4\. 필수 소프트웨어 설치 (Prerequisites and Installation)

이 프로젝트를 실행하기 위해 필요한 소프트웨어와 설치 방법입니다.

### 4.1. 데이터베이스 서버 (MariaDB)

MariaDB는 MySQL과 호환되는 오픈 소스 데이터베이스입니다.

- **Windows:**

  1.  [MariaDB 다운로드 페이지](https://mariadb.org/download/)로 이동하여 최신 안정화 버전(LTS)을 다운로드합니다.
  2.  설치 프로그램을 실행하고, **root 사용자의 비밀번호를 설정**하는 단계를 주의 깊게 따릅니다. 이 비밀번호는 이후 설정에 필요하므로 반드시 기억해두세요.
  3.  나머지 설정은 기본값으로 두고 설치를 완료합니다.

- **macOS (Homebrew 사용):**

  ```bash
  # Homebrew를 사용하여 MariaDB 설치
  brew install mariadb

  # MariaDB 서비스 시작
  brew services start mariadb
  ```

- **Linux (Ubuntu 기준):**

  ```bash
  # 패키지 목록 업데이트 및 MariaDB 서버 설치
  sudo apt update
  sudo apt install mariadb-server

  # 보안 설정 스크립트 실행 (root 비밀번호 설정 등)
  sudo mysql_secure_installation
  ```

### 4.2. MQTT 브로커 (Mosquitto)

Mosquitto는 경량의 오픈 소스 MQTT 브로커입니다.

- **Windows:**

  1.  [Mosquitto 다운로드 페이지](https://mosquitto.org/download/)로 이동하여 Windows용 설치 프로그램을 다운로드합니다.
  2.  설치 프로그램을 실행하여 설치를 완료합니다. 기본적으로 Windows 서비스로 등록되어 부팅 시 자동으로 실행됩니다.

- **macOS (Homebrew 사용):**

  ```bash
  # Homebrew를 사용하여 Mosquitto 설치
  brew install mosquitto

  # Mosquitto 서비스 시작
  brew services start mosquitto
  ```

- **Linux (Ubuntu 기준):**

  ```bash
  # Mosquitto 및 클라이언트 도구 설치
  sudo apt update
  sudo apt install mosquitto mosquitto-clients
  ```

> **참고:** 이 프로젝트의 `python/mqtt_broker/broker.py`는 Python으로 간단한 브로커를 구현한 예제입니다. 테스트용으로는 사용할 수 있지만, 안정적인 운영을 위해서는 위에서 설명한 Mosquitto 서버를 설치하고 실행하는 것을 강력히 권장합니다.

### 4.3. Python 3.8+

- [Python 공식 웹사이트](https://www.python.org/downloads/)에서 Python 3.8 이상의 버전을 다운로드하여 설치합니다.
- Windows 설치 시, "Add Python to PATH" 옵션을 반드시 체크해주세요.

### 4.4. Arduino IDE 및 ESP8266 보드 설정

- **Arduino IDE 설치:** [Arduino 공식 웹사이트](https://www.arduino.cc/en/software)에서 IDE를 다운로드하여 설치합니다.
- **ESP8266 보드 매니저 추가:**
  1.  Arduino IDE를 열고 `파일 > 환경설정` (File \> Preferences)으로 이동합니다.
  2.  `추가적인 보드 매니저 URLs` 필드에 다음 주소를 입력합니다.
      ```
      http://arduino.esp8266.com/stable/package_esp8266com_index.json
      ```
- **ESP8266 보드 설치:**
  1.  `툴 > 보드 > 보드 매니저`로 이동합니다.
  2.  검색창에 `esp8266`을 입력하고 `esp8266 by ESP8266 Community`를 찾아 설치합니다.
- **라이브러리 설치:**
  1.  `스케치 > 라이브러리 포함하기 > 라이브러리 관리`로 이동합니다.
  2.  다음 라이브러리들을 검색하여 각각 설치합니다.
      - `Adafruit_SSD1306`
      - `Adafruit_GFX`
      - `PubSubClient`
      - `WiFiManager`

---

## 5\. 프로젝트 설정 (Project Setup)

### 5.1. 데이터베이스 스키마 설정

1.  MariaDB(MySQL) 서버에 접속합니다. (예: `sudo mysql -u root -p`)
2.  다음 명령어를 순서대로 실행하여 데이터베이스와 사용자를 생성하고 권한을 부여합니다.

    ```sql
    -- 'votedb' 데이터베이스 생성
    CREATE DATABASE votedb;

    -- 'jyyang' 사용자 생성 및 비밀번호 설정
    CREATE USER 'jyyang'@'localhost' IDENTIFIED BY 'didwhdduf';

    -- 'jyyang' 사용자에게 'votedb'에 대한 모든 권한 부여
    GRANT ALL PRIVILEGES ON votedb.* TO 'jyyang'@'localhost';

    -- 권한 변경사항 적용
    FLUSH PRIVILEGES;
    ```

3.  `database/schema.sql` 파일을 사용하여 테이블을 생성합니다.
    ```bash
    # MariaDB에 schema.sql 파일 실행
    mysql -u jyyang -p votedb < database/schema.sql
    ```

### 5.2. Python 가상 환경 및 패키지 설치

1.  터미널에서 `python` 디렉토리로 이동합니다.
2.  가상 환경을 생성하고 활성화합니다.

    ```bash
    # 가상 환경 생성
    python -m venv venv

    # Windows
    venv\Scripts\activate

    # macOS/Linux
    source venv/bin/activate
    ```

3.  `requirements.txt` 파일을 사용하여 필요한 패키지를 설치합니다.
    ```bash
    pip install -r requirements.txt
    ```

### 5.3. Arduino 기기 설정

1.  `arduino/voting_device` 폴더에 있는 `.ino` 파일을 Arduino IDE로 엽니다.
2.  코드 내에서 MQTT 브로커의 IP 주소 등 필요한 설정을 확인하고 수정합니다. (`WiFiManager`를 사용하므로 WiFi 정보는 기기 부팅 시 설정할 수 있습니다.)
3.  코드를 ESP8266 기기에 업로드합니다.

---

## 6\. 시스템 실행 (Running the System)

1.  **MQTT 브로커 실행:**
    - (권장) Mosquitto 서버가 설치 후 자동으로 실행되고 있는지 확인합니다.
    - (테스트용) 또는, 프로젝트에 포함된 Python 브로커를 실행할 수 있습니다.
      ```bash
      python python/mqtt_broker/broker.py
      ```
2.  **대시보드 애플리케이션 실행:**
    - **메인 투표 대시보드:**
      ```bash
      streamlit run python/dashboard/app.py
      ```
    - **결과 발표 대시보드:**
      ```bash
      streamlit run python/dashboard/app_result.py
      ```
    - **행운권 추첨 대시보드:**
      ```bash
      streamlit run python/lucky_draw/app.py
      ```
3.  **Arduino 기기 전원 켜기:**
    - 기기의 전원을 켜면 WiFi에 연결되고 시스템 사용 준비가 완료됩니다.

---

## `python/requirements.txt`

```text
streamlit
paho-mqtt
pymysql
pandas
```
