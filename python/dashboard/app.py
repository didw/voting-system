import streamlit as st
import time
from contextlib import closing
from database import get_db_connection

def reset_scores():
    with get_db_connection() as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute("TRUNCATE TABLE votes")
            connection.commit()

def get_total_score():
    with get_db_connection() as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute("SELECT COUNT(device_id) AS total_score FROM votes")
            result = cursor.fetchone()
    return result['total_score'] if result['total_score'] is not None else 0

def save_results(name, total_score):
    with get_db_connection() as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute("REPLACE INTO vote_results (name, score) VALUES (%s, %s)", (name, total_score))
            cursor.execute("REPLACE INTO judge_results (name, score) VALUES (%s, %s)", (name, 0))
            connection.commit()

def show_results_page(total_score):
    for _ in range(3):
        st.session_state.result_container.markdown(
            f"<h1 style='font-size: 500px; text-align: center; color:red;'>{total_score}</h1>", 
            unsafe_allow_html=True)
        time.sleep(0.5)
        st.session_state.result_container.markdown(
            f"<h1 style='font-size: 500px; text-align: center;'>{total_score}</h1>", 
            unsafe_allow_html=True)
        time.sleep(0.5)

def main():
    st.session_state.time_container = st.empty()
    st.session_state.result_container = st.empty()
    if 'page' not in st.session_state:
        st.session_state.page = 'main'
    
    if st.session_state.page == 'main':
        st.session_state.team_name = st.text_input("팀 이름", placeholder="")
        if st.button("투표 시작"):
            reset_scores()
            st.session_state.page = 'voting'
            st.session_state.start_time = time.time()
            st.session_state.timer_duration = 5

    if st.session_state.page == 'voting':
        while True:
            time.sleep(0.1)
            elapsed_time = time.time() - st.session_state.start_time
            remaining_time = max(0, st.session_state.timer_duration - int(elapsed_time))
            st.session_state.time_container.markdown(
                f"<h1 style='font-size: 500px; text-align: center;'>{remaining_time}</h1>", 
                unsafe_allow_html=True)
            if remaining_time <= 0:
                st.session_state.page = 'results'
                break  # Loop를 break로 종료
        st.rerun()  # 결과 페이지로 갱신

    if st.session_state.page == 'results':
        if 'show_results' not in st.session_state or st.session_state.show_results is False:
            st.session_state.show_results = True
            total_score = get_total_score()
            show_results_page(total_score)
            save_results(st.session_state.team_name, total_score)

        if st.button("홈으로"):
            st.session_state.page = 'main'
            st.session_state.show_results = False
            st.session_state.time_container.empty()
            st.session_state.result_container.empty()
            st.rerun()

if __name__ == "__main__":
    main()
