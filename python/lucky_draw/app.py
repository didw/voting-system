import streamlit as st
import random
import time

# 세션 상태 초기화 함수
def initialize_session_state():
    if 'app_status' not in st.session_state:
        st.session_state.app_status = 'INIT'
    
    if 'min_value' not in st.session_state:
        st.session_state.min_value = 1
    if 'max_value' not in st.session_state:
        # 더 많은 숫자를 보여주기 위해 max_value를 늘림
        st.session_state.max_value = 600 
    
    if 'drawn_numbers_history' not in st.session_state:
        st.session_state.drawn_numbers_history = []
        
    if 'last_drawn_number' not in st.session_state:
        st.session_state.last_drawn_number = None
        
    if 'current_animation_idx' not in st.session_state:
        # 애니메이션 시작 인덱스 (display_sequence 기준)
        st.session_state.current_animation_idx = 0

# 번호 변경 애니메이션 및 최종 번호 선택 함수
def run_lottery_animation(number_container, available_numbers):
    if not available_numbers:
        number_container.error("더 이상 추첨할 번호가 없습니다!")
        return None

    # 애니메이션 및 최종 번호 표시에 사용될 정렬된 번호 목록
    display_sequence = sorted(list(available_numbers))
    if not display_sequence: # 방어 코드
        number_container.error("표시할 번호가 없습니다.")
        return None

    # HTML 스타일 (폰트 크기 유지 또는 약간 조정)
    html_style_animation = "text-align: center; font-size:300px; font-weight:bold; white-space: nowrap; padding: 20px;"
    html_style_final = "text-align: center; font-size:350px; font-weight:bold; white-space: nowrap; padding: 20px;"

    # --- 1. 고속 변경 구간 (Fast Spin) ---
    fast_spin_total_duration = random.uniform(2.0, 3.0) # 2~3초간 고속 회전
    fast_spin_start_time = time.time()
    fast_spin_elapsed_time = 0
    
    # 고속 스핀 시 현재 번호 (실제 available_numbers와 무관하게 빠르게 변하는 숫자)
    # 시작은 min_value 또는 마지막 추첨 번호 근처에서. 여기서는 min_value로 시작.
    current_fast_number = st.session_state.min_value
    # 만약 마지막 번호에서 이어가고 싶다면:
    # current_fast_number = st.session_state.last_drawn_number if st.session_state.last_drawn_number is not None else st.session_state.min_value


    while fast_spin_elapsed_time < fast_spin_total_duration:
        # 숫자를 10씩 증가 (max_value를 넘어가면 min_value부터 다시 시작하도록 순환)
        current_fast_number = (current_fast_number - st.session_state.min_value + 10) % \
                              (st.session_state.max_value - st.session_state.min_value + 1) + \
                              st.session_state.min_value
        
        number_container.markdown(f'<div style="{html_style_animation}">{current_fast_number}</div>', unsafe_allow_html=True)
        time.sleep(0.025) # 매우 짧은 sleep으로 빠르게 변화하는 느낌 (0.02 ~ 0.035)
        fast_spin_elapsed_time = time.time() - fast_spin_start_time
    
    # --- 2. 일반 순차 변경 및 최종 번호 결정 구간 (Normal Spin) ---
    # 전체 애니메이션 시간에서 고속 스핀 시간을 제외한, 일반 스핀에 할당될 시간
    # 예: (전체 5~8초 목표 - 고속스핀 2~3초) = 일반스핀 2.5~5초 필요
    normal_spin_total_duration = random.uniform(2.5, 4.0) # 일반 스핀 시간
    
    # 일반 스핀 시작 시 사용할 display_sequence의 인덱스
    current_display_idx = st.session_state.current_animation_idx % len(display_sequence)
    normal_spin_start_time = time.time()
    normal_spin_elapsed_time = 0
    
    while normal_spin_elapsed_time < normal_spin_total_duration:
        num_to_display = display_sequence[current_display_idx]
        number_container.markdown(f'<div style="{html_style_animation}">{num_to_display}</div>', unsafe_allow_html=True)
        
        remaining_time = normal_spin_total_duration - normal_spin_elapsed_time
        
        # 시간에 따라 sleep 간격 조절 (점점 느려지게)
        if remaining_time < 0.8:  # 마지막 0.8초
            sleep_duration = 0.28
        elif remaining_time < 1.8: # 그 전 1초
            sleep_duration = 0.15
        elif remaining_time < 2.8: # 그 전 1초
            sleep_duration = 0.08
        else:  # 초기 (비교적 빠르게, fast spin 보다는 느림)
            sleep_duration = 0.05
            
        time.sleep(sleep_duration)
        
        current_display_idx = (current_display_idx + 1) % len(display_sequence)
        normal_spin_elapsed_time = time.time() - normal_spin_start_time

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

if __name__ == '__main__':
    main()