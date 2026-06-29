import os
from typing import Optional
from datetime import datetime

from dotenv import load_dotenv
from sqlmodel import SQLModel, Field, Session, create_engine

load_dotenv()  # loads DATABASE_URL, etc.

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,  # avoid stale connections
)

class Doctor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    full_name: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    dob: str
    mrn: str = Field(index=True, unique=True)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="doctor.id")
    image_filename: str
    result_label: str
    probability: float
    report_path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    return Session(engine)
