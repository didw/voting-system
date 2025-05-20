import streamlit as st
import time
from contextlib import closing
# Assuming database.py and get_db_connection are correctly set up
# from database import get_db_connection

# Placeholder for database connection if you don't have it running
# To run this example standalone, uncomment the mock functions below
# and comment out the `from database import get_db_connection`
# ---- MOCK DATABASE FUNCTIONS (for standalone testing) ----
import sqlite3
import os

DB_FILE = "temp_vote_app.db"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    # Create tables if they don't exist
    with closing(conn.cursor()) as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT UNIQUE,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vote_results (
                name TEXT PRIMARY KEY,
                score INTEGER
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS judge_results (
                name TEXT PRIMARY KEY,
                score INTEGER
            )
        """)
        conn.commit()
    return conn

def cleanup_db():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
# ---- END MOCK DATABASE FUNCTIONS ----

def reset_scores():
    with get_db_connection() as connection:
        with closing(connection.cursor()) as cursor:
            # For SQLite, to reset auto-increment, we drop and recreate or delete from sqlite_sequence
            # TRUNCATE is not standard SQLite. DELETE FROM is fine for this app's purpose.
            cursor.execute("DELETE FROM votes")
            # If you need to reset auto-increment in SQLite:
            # cursor.execute("DELETE FROM sqlite_sequence WHERE name='votes'")
            connection.commit()

def get_total_score():
    with get_db_connection() as connection:
        with closing(connection.cursor()) as cursor:
            cursor.execute("SELECT COUNT(DISTINCT device_id) AS total_score FROM votes") # Assuming device_id identifies a voter
            result = cursor.fetchone()
    return result['total_score'] if result and result['total_score'] is not None else 0

# Example function to simulate voting (not in original, but useful for testing)
def add_vote(device_id):
    try:
        with get_db_connection() as connection:
            with closing(connection.cursor()) as cursor:
                cursor.execute("INSERT INTO votes (device_id) VALUES (?)", (device_id,))
                connection.commit()
        return True
    except sqlite3.IntegrityError: # Handles duplicate device_id if it's UNIQUE
        # print(f"Device {device_id} already voted.")
        return False


def save_results(name, total_score):
    with get_db_connection() as connection:
        with closing(connection.cursor()) as cursor:
            # For SQLite, REPLACE works as an "upsert"
            cursor.execute("REPLACE INTO vote_results (name, score) VALUES (?, ?)", (name, total_score))
            cursor.execute("REPLACE INTO judge_results (name, score) VALUES (?, ?)", (name, 0)) # Assuming judge score is 0 for now
            connection.commit()

# --- UI Enhancements ---
def apply_custom_css():
    st.markdown("""
        <style>
            /* General page styling */
            .stApp {
                /* background-color: #f0f2f6; /* Light gray background */
            }

            /* Centering content */
            .main-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
            }

            /* Styling for timer and result numbers */
            .metric-display {
                font-size: 200px; /* Large, but not excessively so */
                font-weight: bold;
                text-align: center;
                color: #2c3e50; /* Darker color for text */
                margin: 20px 0;
            }

            .result-display {
                font-size: 250px;
                font-weight: bold;
                text-align: center;
                animation: pulse 1.5s infinite alternate;
                margin: 20px 0;
            }
            
            @keyframes pulse {
                0% {
                    transform: scale(1);
                    color: #e74c3c; /* Reddish */
                }
                50% {
                    transform: scale(1.1);
                    color: #c0392b; /* Darker Red */
                }
                100% {
                    transform: scale(1);
                    color: #e74c3c; /* Reddish */
                }
            }

            /* Input and Button Styling */
            .stTextInput input {
                border-radius: 5px;
                padding: 10px;
                border: 1px solid #bdc3c7; /* Light silver border */
            }
            .stButton button {
                background-color: #3498db; /* Blue */
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                border: none;
                font-size: 16px;
                transition: background-color 0.3s ease;
            }
            .stButton button:hover {
                background-color: #2980b9; /* Darker blue */
            }
            .stButton button:active {
                background-color: #1f618d; /* Even darker blue */
            }
            .home-button button {
                 background-color: #2ecc71; /* Green */
            }
            .home-button button:hover {
                background-color: #27ae60; /* Darker green */
            }

        </style>
    """, unsafe_allow_html=True)

def show_results_page_enhanced(container, total_score):
    container.markdown(
        f"<div class='result-display'>{total_score}</div>",
        unsafe_allow_html=True
    )
    # The CSS animation handles the visual effect, no need for Python loop and sleep

def main():
    apply_custom_css()

    # Initialize session state variables if they don't exist
    if 'page' not in st.session_state:
        st.session_state.page = 'main'
    if 'team_name' not in st.session_state:
        st.session_state.team_name = ""
    if 'start_time' not in st.session_state:
        st.session_state.start_time = 0
    if 'timer_duration' not in st.session_state:
        st.session_state.timer_duration = 10 # Default timer duration
    if 'show_results_processed' not in st.session_state:
        st.session_state.show_results_processed = False

    # Use a main container for better layout control
    main_placeholder = st.empty()

    if st.session_state.page == 'main':
        with main_placeholder.container():
            st.markdown("<div class='main-container'>", unsafe_allow_html=True)
            st.title("🚀 투표 앱 🚀")
            st.session_state.team_name = st.text_input(
                "팀 이름을 입력하세요:",
                value=st.session_state.team_name, # Preserve input on rerun
                placeholder="예: 알파 팀"
            )
            st.session_state.timer_duration = st.number_input(
                "투표 시간 (초):",
                min_value=5,
                max_value=300,
                value=st.session_state.timer_duration, # Preserve value
                step=5
            )

            if st.button("투표 시작 ✨", key="start_vote_button"):
                if st.session_state.team_name.strip():
                    reset_scores()
                    st.session_state.page = 'voting'
                    st.session_state.start_time = time.time()
                    st.session_state.show_results_processed = False # Reset for next round
                    st.rerun()
                else:
                    st.warning("팀 이름을 입력해주세요!")
            st.markdown("</div>", unsafe_allow_html=True)

    elif st.session_state.page == 'voting':
        with main_placeholder.container():
            st.markdown("<div class='main-container'>", unsafe_allow_html=True)
            st.header(f"{st.session_state.team_name} 팀 투표 중...")

            elapsed_time = time.time() - st.session_state.start_time
            remaining_time = max(0, st.session_state.timer_duration - int(elapsed_time))

            st.markdown(
                f"<div class='metric-display'>{remaining_time}</div>",
                unsafe_allow_html=True
            )
            st.progress(remaining_time / st.session_state.timer_duration)
            st.caption("실제 투표는 다른 장치/탭에서 진행됩니다. 이 화면은 카운트다운을 보여줍니다.")

            # --- For testing: add some dummy votes ---
            if remaining_time > 0 and remaining_time % 2 == 0: # Add a vote every 2s
                 add_vote(f"device_{int(time.time())}") # Simulate unique device vote
            # --- End test section ---

            if remaining_time <= 0:
                st.session_state.page = 'results'
                st.rerun() # Go to results page
            else:
                # This makes Streamlit rerun the script roughly every second
                # to update the timer.
                time.sleep(1)
                st.rerun()
            st.markdown("</div>", unsafe_allow_html=True)

    # --- 3. 최종 번호 확정 및 깜빡임 ---
    # 일반 스핀 애니메이션 루프 직후, 화면에 마지막으로 보여졌던 번호가 최종 번호
    final_selected_idx = (current_display_idx - 1 + len(display_sequence)) % len(display_sequence)
    final_selected_number = display_sequence[final_selected_idx]

    # 최종 번호 표시 및 깜빡임
    final_blink_duration_each = 0.5
    num_blinks = 3
    number_container.markdown(f'<div style="{html_style_final}">{final_selected_number}</div>', unsafe_allow_html=True)
    time.sleep(final_blink_duration_each) 
    
    for _ in range(num_blinks):
        number_container.markdown(f'<div style="{html_style_final} color:red;">{final_selected_number}</div>', unsafe_allow_html=True)
        time.sleep(final_blink_duration_each)
        number_container.markdown(f'<div style="{html_style_final}">{final_selected_number}</div>', unsafe_allow_html=True)
        time.sleep(final_blink_duration_each)
        
    # 다음 애니메이션 시작 인덱스 업데이트 (현재 멈춘 번호의 다음 인덱스)
    st.session_state.current_animation_idx = (final_selected_idx + 1) % len(display_sequence)

    return final_selected_number

# Streamlit 앱 메인 함수 (이전과 거의 동일)
def main():
    st.set_page_config(layout="centered", initial_sidebar_state="collapsed")
    initialize_session_state()

    st.title("✨ 행운권 추첨 ✨")

    all_possible_numbers = list(range(st.session_state.min_value, st.session_state.max_value + 1))
    available_numbers = [num for num in all_possible_numbers if num not in st.session_state.drawn_numbers_history]

    number_placeholder = st.empty()

    if st.session_state.app_status == 'INIT':
        with st.form(key="init_form"):
            number_placeholder.markdown(f'<div style="text-align: center; font-size:100px; color:grey; padding: 80px;">추첨 대기중...</div>', unsafe_allow_html=True)
            submitted_init = st.form_submit_button("🚀 추첨 시작!", type="primary", use_container_width=True)
            if submitted_init:
                if not available_numbers:
                    st.session_state.app_status = 'ALL_DONE'
                else:
                    st.session_state.app_status = 'READY_TO_DRAW'
                st.rerun()

    elif st.session_state.app_status == 'READY_TO_DRAW':
        with st.form(key="draw_form"):
            if st.session_state.last_drawn_number is not None:
                number_placeholder.markdown(f'<div style="text-align: center; font-size:200px; font-weight:bold; color:dodgerblue; padding: 60px;">{st.session_state.last_drawn_number}</div>', unsafe_allow_html=True)
                st.success(f"이전 당첨 번호: {st.session_state.last_drawn_number}")
            else:
                number_placeholder.markdown(f'<div style="text-align: center; font-size:80px; color:grey; padding: 80px;">버튼을 눌러 추첨하세요!</div>', unsafe_allow_html=True)
            
            submitted_draw = st.form_submit_button("🎯 행운번호 추첨!", type="primary", use_container_width=True)
            if submitted_draw:
                if not available_numbers:
                    st.session_state.app_status = 'ALL_DONE'
                else:
                    st.session_state.app_status = 'DRAWING'
                st.rerun()
    
    elif st.session_state.app_status == 'DRAWING':
        drawn_number = run_lottery_animation(number_placeholder, available_numbers)
        
        if drawn_number is not None:
            st.session_state.last_drawn_number = drawn_number
            st.session_state.drawn_numbers_history.append(drawn_number)
        
        current_available_numbers_after_draw = [
            num for num in all_possible_numbers 
            if num not in st.session_state.drawn_numbers_history
        ]
        if not current_available_numbers_after_draw:
            st.session_state.app_status = 'ALL_DONE'
        else:
            st.session_state.app_status = 'READY_TO_DRAW'
        st.rerun()

    elif st.session_state.app_status == 'ALL_DONE':
        if st.session_state.last_drawn_number:
            final_message = f"🎉 모든 번호 추첨 완료! 🎉<br><br>마지막 당첨 번호: {st.session_state.last_drawn_number}"
            number_placeholder.markdown(f"<div style='text-align:center; font-size:30px; color:green; padding:50px;'>{final_message}</div>", unsafe_allow_html=True)
        else:
            number_placeholder.markdown("<div style='text-align:center; font-size:30px; color:orange; padding:50px;'>⚠️ 추첨할 번호가 없습니다. (범위 확인)</div>", unsafe_allow_html=True)
        
        with st.form(key="reset_form"):
            submitted_reset = st.form_submit_button("🔄 처음부터 다시 시작 (기록 초기화)", use_container_width=True)
            if submitted_reset:
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                st.rerun()

    elif st.session_state.page == 'results':
        with main_placeholder.container():
            st.markdown("<div class='main-container'>", unsafe_allow_html=True)
            st.header(f"🏆 {st.session_state.team_name} 팀 투표 결과 🏆")

            if not st.session_state.show_results_processed:
                total_score = get_total_score()
                save_results(st.session_state.team_name, total_score)
                st.session_state.current_score_display = total_score # Store for display
                st.session_state.show_results_processed = True # Mark as processed

            # Display the score using the animated CSS
            if 'current_score_display' in st.session_state:
                show_results_page_enhanced(st.container(), st.session_state.current_score_display)
            else:
                st.error("결과를 표시할 수 없습니다.")


            if st.button("🏠 처음으로 돌아가기", key="home_button", help="새로운 투표를 시작합니다."):
                st.session_state.page = 'main'
                # Optionally reset team name or keep it for convenience
                # st.session_state.team_name = ""
                st.session_state.show_results_processed = False
                st.rerun()
            st.markdown("</div>", unsafe_allow_html=True)

if __name__ == "__main__":
    # Ensure DB is clean if using mock for testing, before starting the app
    # cleanup_db() # Call this if you want a fresh DB every time for the mock
    main()