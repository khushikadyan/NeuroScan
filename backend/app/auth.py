# backend/app/auth.py
import os
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGO = "HS256"

# Use PBKDF2-SHA256 instead of bcrypt (no 72-byte cap, pure-Python)
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
    # You can tune rounds if you like, default ~29000 in passlib; higher is slower but stronger
    # pbkdf2_sha256__rounds=320000,  # optional
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def create_token(subject: str, expires_minutes: int = 60*24) -> str:
    payload = {"sub": subject, "exp": datetime.utcnow() + timedelta(minutes=expires_minutes)}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGO)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGO])
        return payload.get("sub")
    except Exception:
        return None
