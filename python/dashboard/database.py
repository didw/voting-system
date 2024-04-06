# python/dashboard/database.py

import mysql.connector

def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="your_username",
        password="your_password",
        database="voting_db"
    )
    return connection

def create_device(mac_address):
    connection = get_db_connection()
    cursor = connection.cursor()
    query = "INSERT INTO devices (mac_address) VALUES (%s)"
    cursor.execute(query, (mac_address,))
    connection.commit()
    device_id = cursor.lastrowid
    cursor.close()
    connection.close()
    return device_id

def create_vote(device_id, candidate_id):
    connection = get_db_connection()
    cursor = connection.cursor()
    query = "INSERT INTO votes (device_id, candidate_id) VALUES (%s, %s)"
    cursor.execute(query, (device_id, candidate_id))
    connection.commit()
    cursor.close()
    connection.close()

def is_device_registered(mac_address):
    connection = get_db_connection()
    cursor = connection.cursor()
    query = "SELECT id FROM devices WHERE mac_address = %s"
    cursor.execute(query, (mac_address,))
    result = cursor.fetchone()
    cursor.close()
    connection.close()
    return result is not None