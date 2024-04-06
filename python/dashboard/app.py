# python/dashboard/app.py

import streamlit as st
import time
from database import get_db_connection

def reset_vote_counts():
    connection = get_db_connection()
    cursor = connection.cursor()
    query = "TRUNCATE TABLE votes"
    cursor.execute(query)
    connection.commit()
    cursor.close()
    connection.close()

def get_vote_counts():
    connection = get_db_connection()
    cursor = connection.cursor()
    query = """
        SELECT candidate_id, COUNT(*) as vote_count
        FROM votes
        GROUP BY candidate_id
        ORDER BY vote_count DESC
        LIMIT 5
    """
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    return results

def main():
    st.title("실시간 투표 결과")

    if st.button("투표 시작"):
        reset_vote_counts()
        st.success("투표가 시작되었습니다.")
        start_time = time.time()
        timer_duration = 30  # 30초 타이머

        while True:
            elapsed_time = time.time() - start_time
            remaining_time = max(0, timer_duration - int(elapsed_time))

            if remaining_time == 0:
                st.warning("투표가 마감되었습니다.")
                break

            st.write(f"투표 마감까지 남은 시간: {remaining_time}초")

            vote_counts = get_vote_counts()
            display_results(vote_counts)

            time.sleep(1)  # 1초마다 업데이트

    else:
        vote_counts = get_vote_counts()
        display_results(vote_counts)

def display_results(vote_counts):
    st.write("## 실시간 투표 순위")
    for i, (candidate_id, vote_count) in enumerate(vote_counts, start=1):
        st.write(f"{i}. 후보 {candidate_id}: {vote_count}표")

if __name__ == "__main__":
    main()