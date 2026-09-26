from datetime import datetime
from typing import List

from pydantic import BaseModel, EmailStr, field_validator

from models import ReceiptStatus, DeliveryStatus


# ---------- Auth ----------
class SignupRequest(BaseModel):
    login_id: str
    email: EmailStr
    password: str

    @field_validator("login_id")
    @classmethod
    def login_id_length(cls, v):
        if not (6 <= len(v) <= 12):
            raise ValueError("Login ID must be 6-12 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v) or not any(c.islower() for c in v):
            raise ValueError("Password must contain upper and lower case letters")
        if not any(not c.isalnum() for c in v):
            raise ValueError("Password must contain a special character")
        return v


class LoginRequest(BaseModel):
    login_id: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    login_id: str
    email: str

    class Config:
        from_attributes = True


# ---------- Product ----------
class ProductCreate(BaseModel):
    code: str
    name: str
    category: str = ""
    unit: str = "pcs"
    cost_per_unit: float = 0.0
    on_hand: float = 0.0
    free_to_use: float = 0.0


class ProductOut(ProductCreate):
    id: int

    class Config:
        from_attributes = True


# ---------- Warehouse / Location ----------
class WarehouseCreate(BaseModel):
    name: str
    short_code: str
    address: str = ""


class WarehouseOut(WarehouseCreate):
    id: int

    class Config:
        from_attributes = True


class LocationCreate(BaseModel):
    name: str
    short_code: str
    warehouse_id: int


class LocationOut(LocationCreate):
    id: int

    class Config:
        from_attributes = True


# ---------- Receipt ----------
class LineIn(BaseModel):
    product_id: int
    qty: float


class ReceiptCreate(BaseModel):
    contact: str
    schedule_date: datetime
    warehouse_id: int
    lines: List[LineIn]


class ReceiptOut(BaseModel):
    id: int
    reference: str
    contact: str
    schedule_date: datetime
    status: ReceiptStatus
    warehouse_id: int

    class Config:
        from_attributes = True


# ---------- Delivery ----------
class DeliveryCreate(BaseModel):
    delivery_address: str
    schedule_date: datetime
    warehouse_id: int
    lines: List[LineIn]


class DeliveryOut(BaseModel):
    id: int
    reference: str
    delivery_address: str
    schedule_date: datetime
    status: DeliveryStatus
    warehouse_id: int

    class Config:
        from_attributes = True


# ---------- Move ----------
class MoveOut(BaseModel):
    id: int
    product_id: int
    from_location: str
    to_location: str
    qty: float
    direction: str
    date: datetime
    source_ref: str

    class Config:
        from_attributes = True
