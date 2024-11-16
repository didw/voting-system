import streamlit as st
import time
from database import get_db_connection
import random
import pymysql


# 행운권 번호 저장 함수
def insert_number(number):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            insert_sql = 'INSERT INTO lottery (number) VALUES (%s)'
            cursor.execute(insert_sql, (number,))
        conn.commit()
    except pymysql.err.IntegrityError:
        return False
    finally:
        conn.close()
    return True


# 과거 번호 조회 함수
def fetch_numbers():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            fetch_sql = 'SELECT number FROM lottery ORDER BY id DESC'
            cursor.execute(fetch_sql)
            result = cursor.fetchall()
            return [row['number'] for row in result]
    finally:
        conn.close()


def generate_number(available_numbers, number_container):
    total_len = random.randint(5, 20)
    number = None

    for i in range(total_len):
        number = available_numbers[(i + st.session_state.number) % len(available_numbers)]
        if i == total_len - 1:
            # 마지막 번호를 빨간색으로 표시
            number_container.markdown(f'<h2 style="text-align: center;white-space: nowrap;font-size:500px">{number}</h2>', unsafe_allow_html=True)
            time.sleep(0.5)
            for _ in range(3):
                number_container.markdown(f'<h2 style="text-align: center;white-space: nowrap;color:red;font-size:500px">{number}</h2>', unsafe_allow_html=True)
                time.sleep(0.5)
                number_container.markdown(f'<h2 style="text-align: center;white-space: nowrap;font-size:500px">{number}</h2>', unsafe_allow_html=True)
                time.sleep(0.5)
        else:
            number_container.markdown(f'<h2 style="text-align: center;white-space: nowrap;font-size:500px">{number}</h2>', unsafe_allow_html=True)

        if i > total_len - 3:
            time.sleep(0.4)
        elif i > total_len - 7:
            time.sleep(0.3)
        elif i > total_len - 10:
            time.sleep(0.2)
        else:
            time.sleep(0.1)

    return number

# 숫자를 표시할 변수 초기화
if 'number' not in st.session_state:
    st.session_state.number = 0

if 'all_numbers' not in st.session_state:
    st.session_state.all_numbers = fetch_numbers()

# 화면에 숫자를 표시
# st.write(st.session_state.number)
number_container = st.empty()
available_numbers = ["앞", "뒤", "앞뒤", "꽝"]
number_container.markdown(f'<h2 style="text-align: center;white-space: nowrap;font-size:500px">{available_numbers[st.session_state.number]}</h2>', unsafe_allow_html=True)


# 숫자를 업데이트하는 함수
def update_number():
    if st.session_state.number < 3:
        st.session_state.number += 1
    else:
        st.session_state.number = 0


# 'Start/Stop' 버튼
if st.button('Start/Stop'):
    if 'running' not in st.session_state or not st.session_state.running:
        st.session_state.running = True
    else:
        st.session_state.running = False
        generate_number(available_numbers, number_container)

# 버튼을 눌러 상태를 변경할 수 있도록 함
if 'running' in st.session_state and st.session_state.running:
    while st.session_state.running:
        update_number()
        time.sleep(0.1)  # 숫자가 변경되는 속도를 조절
        st.rerun()  # 화면을 갱신
