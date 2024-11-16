# python/dashboard/database.py

import pymysql

def get_db_connection():
    # 데이터베이스 연결 정보 설정
    connection = pymysql.connect(
        host="localhost",
        user="jyyang",
        password="didwhdduf",
        database="votedb",
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

def create_device(mac_address):
    # 새 디바이스(맥 주소)를 데이터베이스에 등록하고 생성된 ID 반환
    connection = get_db_connection()
    with connection.cursor() as cursor:
        query = "INSERT INTO devices (mac_address) VALUES (%s)"
        cursor.execute(query, (mac_address,))
        connection.commit()
        device_id = cursor.lastrowid
    connection.close()
    return device_id

def create_vote(device_id):
    # 투표 데이터(디바이스 ID와 후보자 ID)를 데이터베이스에 기록
    connection = get_db_connection()
    with connection.cursor() as cursor:
        query = "INSERT INTO votes (device_id) VALUES (%s)"
        cursor.execute(query, (device_id,))
        connection.commit()
    connection.close()

def is_device_registered(mac_address):
    # 디바이스가 이미 등록되어 있는지 확인
    connection = get_db_connection()
    with connection.cursor() as cursor:
        query = "SELECT id FROM devices WHERE mac_address = %s"
        cursor.execute(query, (mac_address,))
        result = cursor.fetchone()
    connection.close()
    return result is not None

def clear_devices():
    # 디바이스 테이블 초기화
    connection = get_db_connection()
    with connection.cursor() as cursor:
        query = "TRUNCATE TABLE devices"
        cursor.execute(query)
        connection.commit()
    connection.close()