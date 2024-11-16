import pymysql

def get_db_connection():
    try:
        connection = pymysql.connect(
            host='localhost',  # 데이터베이스 서버 주소
            user='jyyang',  # 데이터베이스 사용자 이름
            password='didwhdduf',  # 사용자 비밀번호
            db='votedb',  # 데이터베이스 이름
            charset='utf8mb4',  # 문자 인코딩 설정
            cursorclass=pymysql.cursors.DictCursor  # 쿼리 결과를 사전 형태로 반환받기 위한 설정
        )
        return connection
    except pymysql.err.OperationalError as e:
        print(f"연결 에러 발생: {e}")
        return None
