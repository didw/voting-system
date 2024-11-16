from database import get_db_connection
import streamlit as st
import pandas as pd
import random
import time


if 'rank_name' not in st.session_state:
    st.session_state.rank_name = {}

def get_participants():
    """참가자 목록을 데이터베이스에서 가져옵니다."""
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT vr.name, (vr.score + jr.score) AS total_score
                FROM vote_results vr
                INNER JOIN judge_results jr ON vr.name = jr.name
                ORDER BY total_score DESC
            """)
            result = cursor.fetchall()
    return [row['name'] for row in result]

def show_winner(position):
    """등수에 따라 우승자를 화면에 표시합니다."""
    participants = get_participants()
    
    # 화면에 랜덤 참가자 이름을 일정 시간 동안 표시합니다.
    name_container = st.empty()
    for i in range(20):
        random_name = random.choice(participants)
        name_container.markdown(f"<h1 style='font-size: 100px;'>{random_name}</h1>", unsafe_allow_html=True)
        if i > 17:
            time.sleep(0.4)
        elif i > 13:
            time.sleep(0.3)
        elif i > 7:
            time.sleep(0.2)
        else:
            time.sleep(0.1)
    
    # 등수에 따라 우승자를 화면에 표시합니다.
    winner = participants[position - 1]
    for _ in range(3):
        name_container.markdown(f"<h1 style='font-size: 100px;color:red;'>{winner}</h1>", unsafe_allow_html=True)
        time.sleep(0.5)
        name_container.markdown(f"<h1 style='font-size: 100px;'>{winner}</h1>", unsafe_allow_html=True)
        time.sleep(0.5)
    name_container.empty()
    st.session_state.rank_name[position] = winner
    st.rerun()

def main():
    for position, winner in sorted(st.session_state.rank_name.items()):
        st.markdown(f"<h1 style='font-size: 100px;'>{position}등: {winner}</h1>", unsafe_allow_html=True)

    if st.button('1등 발표하기'):
        show_winner(1)
    if st.button('2등 발표하기'):
        show_winner(2)
    if st.button('3등 발표하기'):
        show_winner(3)


if __name__ == "__main__":
    main()
