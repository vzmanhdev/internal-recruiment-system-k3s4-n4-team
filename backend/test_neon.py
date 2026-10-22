
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Chưa cấu hình DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

try:
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT current_database(), current_user")
        ).fetchone()

        print("Kết nối Neon thành công!")
        print("Database:", result[0])
        print("User:", result[1])

except Exception as e:
    print("Kết nối thất bại:", e)

finally:
    engine.dispose()
