import paho.mqtt.client as mqtt
import time

def on_publish(client, userdata, result):
    print("Data published")

# MQTT 클라이언트 인스턴스 생성
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)

# 사용자 인증 정보 설정
client.username_pw_set("jyyang", "didwhdduf")  # 실제 사용자 이름과 비밀번호로 변경

# MQTT 브로커에 연결
client.connect("3.36.29.2", 1883)  # 여기에 실제 브로커 주소 입력

# 콜백 함수 설정
client.on_publish = on_publish

# 테스트 데이터 전송
while True:
    mac_address = "00:11:22:33:44:55"  # 예시 MAC 주소
    button_status = "ON"  # 또는 "OFF"

    # 메시지 생성 및 발행
    message = f"{mac_address} {button_status}"
    client.publish("voting/device", message)
    print(f"Sent: {message}")

    # 일정 시간 간격으로 반복
    time.sleep(5)  # 5초 간격으로 변경 가능
