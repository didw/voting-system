# python/mqtt_broker/broker.py

from database import create_device, create_vote, is_device_registered, get_db_connection

import paho.mqtt.client as mqtt
from config import BROKER_HOST, BROKER_PORT

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker")
    client.subscribe("voting/device")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"Received message: {payload}")
    if payload.startswith("vote:"):
        _, candidate_id = payload.split(":")
        device_id = get_device_id(client)
        if device_id:
            create_vote(device_id, int(candidate_id))
    else:
        mac_address = payload
        if not is_device_registered(mac_address):
            create_device(mac_address)

def get_device_id(client):
    mac_address = client._client_id.decode()
    connection = get_db_connection()
    cursor = connection.cursor()
    query = "SELECT id FROM devices WHERE mac_address = %s"
    cursor.execute(query, (mac_address,))
    result = cursor.fetchone()
    cursor.close()
    connection.close()
    return result[0] if result else None

def start_broker():
    broker = mqtt.Client()
    broker.on_connect = on_connect
    broker.on_message = on_message

    broker.connect(BROKER_HOST, BROKER_PORT)
    broker.loop_forever()

if __name__ == "__main__":
    start_broker()