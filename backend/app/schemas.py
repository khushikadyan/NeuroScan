from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class DoctorCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: constr(min_length=8, max_length=256)  # adjustable

class DoctorLogin(BaseModel):
    email: EmailStr
    password: constr(min_length=8, max_length=256)  # adjustable

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    dob: str
    mrn: str
    notes: Optional[str] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[str] = None
    mrn: Optional[str] = None
    notes: Optional[str] = None
