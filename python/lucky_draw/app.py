import streamlit as st
import streamlit.components.v1 as components
import pymysql
import random
import time
import math
from database import get_db_connection


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


def generate_number(available_numbers, start_idx):
    number_container = st.empty()  # 숫자 업데이트를 위한 컨테이너
    total_len = random.randint(0, len(available_numbers))
    number = None

    for i in range(total_len):
        number = available_numbers[i%len(available_numbers) + start_idx]
        if i == total_len - 1:
            # 마지막 번호를 빨간색으로 표시
            number_container.markdown(f'<h2 style="text-align: right;font-size:500px">{number}</h2>', unsafe_allow_html=True)
            time.sleep(0.5)
            for _ in range(3):
                number_container.markdown(f'<h2 style="text-align: right;color:red;font-size:500px">{number}</h2>', unsafe_allow_html=True)
                time.sleep(0.5)
                number_container.markdown(f'<h2 style="text-align: right;font-size:500px">{number}</h2>', unsafe_allow_html=True)
                time.sleep(0.5)
        else:
            number_container.markdown(f'<h2 style="text-align: right;font-size:500px">{number}</h2>', unsafe_allow_html=True)


        if i > total_len - 3:
            time.sleep(0.4)
        elif i > total_len - 7:
            time.sleep(0.3)
        elif i > total_len - 13:
            time.sleep(0.2)
        elif i > total_len - 30:
            time.sleep(0.1)
        elif i > total_len - 50:
            time.sleep(0.05)
        elif i > total_len - 100:
            time.sleep(0.01)
        elif i > total_len - 300:
            time.sleep(0.005)
        else:
            time.sleep(0.002)

    return number


def show_history(numbers):
    message = ''
    for i, number in enumerate(numbers, start=1):
        message += f'{number}, '
        if i % 10 == 0:
            st.write(message)
            message = ''
    if message:
        st.write(message)

# Streamlit 앱
def main():
    min_value = 1
    max_value = 600

    components.html("""
    <script>
    document.addEventListener('DOMContentLoaded', (event) => {
        document.body.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var button = document.querySelector('[data-testid="baseButton-secondary"]');
                button.click();
            }
        });
    });
    </script>
    """, height=0)

    if 'button_label' not in st.session_state:
        st.session_state['button_label'] = 'INIT'
        st.session_state.start_idx = 0

    all_numbers = fetch_numbers()
    available_numbers = [i for i in range(min_value, max_value+1) if i not in all_numbers]
    number_container = st.empty()  # 숫자 업데이트를 위한 컨테이너
    if st.session_state['button_label'] == 'GO':
        st.session_state.start_idx += 1
        number = available_numbers[st.session_state.start_idx%len(available_numbers)]
        number_container.markdown(f'<h2 style="text-align: right;font-size:500px">{number}</h2>', unsafe_allow_html=True)
        # time.sleep(0.001)
        # st.rerun()
    if st.button(st.session_state['button_label']):
        if st.session_state['button_label'] == 'INIT':
            st.session_state['button_label'] = 'GO'
            st.rerun()
        if st.session_state['button_label'] == 'READY':
            st.session_state['button_label'] = 'GO'
            st.rerun()
        elif st.session_state['button_label'] == 'GO':
            st.session_state['button_label'] = 'READY'
            total_len = random.randint(0, len(available_numbers))
            number = None

            for i in range(total_len):
                number = available_numbers[i%len(available_numbers) + st.session_state.start_idx]
                if i == total_len - 1:
                    # 마지막 번호를 빨간색으로 표시
                    number_container.markdown(f'<h2 style="text-align: right;font-size:500px">{number}</h2>', unsafe_allow_html=True)
                    time.sleep(0.5)
                    for _ in range(3):
                        number_container.markdown(f'<h2 style="text-align: right;color:red;font-size:500px">{number}</h2>', unsafe_allow_html=True)
                        time.sleep(0.5)
                        number_container.markdown(f'<h2 style="text-align: right;font-size:500px">{number}</h2>', unsafe_allow_html=True)
                        time.sleep(0.5)
                else:
                    number_container.markdown(f'<h2 style="text-align: right;font-size:500px">{number}</h2>', unsafe_allow_html=True)


                if i > total_len - 3:
                    time.sleep(0.4)
                elif i > total_len - 7:
                    time.sleep(0.3)
                elif i > total_len - 13:
                    time.sleep(0.2)
                elif i > total_len - 30:
                    time.sleep(0.1)
                elif i > total_len - 50:
                    time.sleep(0.05)
                elif i > total_len - 100:
                    time.sleep(0.01)
                elif i > total_len - 300:
                    time.sleep(0.005)
                else:
                    time.sleep(0.002)
            
            insert_number(number)
            st.rerun()


if __name__ == '__main__':
    main()
