from database import create_device, create_vote, is_device_registered, clear_devices
import paho.mqtt.client as mqtt
from config import BROKER_HOST, BROKER_PORT


def on_connect(client, userdata, flags, reason_code, properties):
    print(f"Connected with result code {reason_code}")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("voting/device")


def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"Received message: {payload}")
    if payload.startswith("vote:"):
        _, vote_info = payload.split("vote: ")[1].split(", ")
        mac_address = vote_info.split("mac:")[1].strip()
        
        if not is_device_registered(mac_address):
            print(f"Device {mac_address} is not registered. Registering...")
            create_device(mac_address)
        
        create_vote(mac_address)
        print(f"Vote from {mac_address} is successfully recorded.")
    elif payload.startswith("mac:"):
        mac_address = payload.split("mac:")[1].strip()
        if not is_device_registered(mac_address):
            print(f"Device {mac_address} is not registered. Registering...")
            create_device(mac_address)
        else:
            print(f"Device {mac_address} is already registered.")

def start_broker():
    clear_devices()
    broker = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    broker.username_pw_set("jyyang", "didwhdduf")
    broker.on_connect = on_connect
    broker.on_message = on_message

    broker.connect(BROKER_HOST, BROKER_PORT, 60)

    broker.loop_forever()

if __name__ == "__main__":
    start_broker()
