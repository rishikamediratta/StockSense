from datetime import datetime
from typing import List

from pydantic import BaseModel, EmailStr, Field, field_validator

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
        if len(v) <= 8:
            raise ValueError("Password must be more than 8 characters")
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


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp: str


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, value):
        if len(value) <= 8:
            raise ValueError("Password must be more than 8 characters")
        if not any(char.isupper() for char in value) or not any(char.islower() for char in value):
            raise ValueError("Password must contain upper and lower case letters")
        if not any(not char.isalnum() for char in value):
            raise ValueError("Password must contain a special character")
        return value


class MessageResponse(BaseModel):
    message: str
    otp: str | None = None


# ---------- Product ----------
class ProductCreate(BaseModel):
    code: str = Field(min_length=1, max_length=40, pattern=r"^[A-Za-z0-9._-]+$")
    name: str = Field(min_length=1, max_length=160)
    category: str = ""
    unit: str = "pcs"
    cost_per_unit: float = 0.0
    on_hand: float = 0.0
    free_to_use: float = 0.0
    reorder_point: float = 0.0

    @field_validator("on_hand", "free_to_use", "cost_per_unit", "reorder_point")
    @classmethod
    def non_negative_amount(cls, value):
        if value < 0:
            raise ValueError("Values cannot be negative")
        return value


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
    location_id: int | None = None
    qty: float = Field(gt=0)


class LineOut(BaseModel):
    product_id: int
    location_id: int | None = None
    qty: float

    class Config:
        from_attributes = True


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
    responsible_id: int | None = None
    lines: List[LineOut] = []

    class Config:
        from_attributes = True


# ---------- Delivery ----------
class DeliveryCreate(BaseModel):
    contact: str = ""
    delivery_address: str
    schedule_date: datetime
    warehouse_id: int
    lines: List[LineIn]


class DeliveryOut(BaseModel):
    id: int
    reference: str
    delivery_address: str
    contact: str = ""
    schedule_date: datetime
    status: DeliveryStatus
    warehouse_id: int
    responsible_id: int | None = None
    lines: List[LineOut] = []

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


class TransferCreate(BaseModel):
    product_id: int
    source_location_id: int
    destination_location_id: int
    qty: float = Field(gt=0)


class TransferOut(BaseModel):
    id: int
    reference: str
    product_id: int
    source_location_id: int
    destination_location_id: int
    qty: float
    responsible_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdjustmentCreate(BaseModel):
    product_id: int
    location_id: int
    counted_quantity: float = Field(ge=0)


class AdjustmentOut(BaseModel):
    id: int
    reference: str
    product_id: int
    location_id: int
    recorded_quantity: float
    counted_quantity: float
    delta: float
    responsible_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
