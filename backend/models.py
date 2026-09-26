import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship

from database import Base


class ReceiptStatus(str, enum.Enum):
    Draft = "Draft"
    Ready = "Ready"
    Done = "Done"
    Canceled = "Canceled"


class DeliveryStatus(str, enum.Enum):
    Draft = "Draft"
    Waiting = "Waiting"
    Ready = "Ready"
    Done = "Done"
    Canceled = "Canceled"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_code = Column(String, unique=True, nullable=False)
    address = Column(String, default="")
    receipt_counter = Column(Integer, default=0)
    delivery_counter = Column(Integer, default=0)

    locations = relationship("Location", back_populates="warehouse")


class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_code = Column(String, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)

    warehouse = relationship("Warehouse", back_populates="locations")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    category = Column(String, default="")
    unit = Column(String, default="pcs")
    cost_per_unit = Column(Float, default=0.0)
    on_hand = Column(Float, default=0.0)
    free_to_use = Column(Float, default=0.0)


class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, nullable=False)
    contact = Column(String, nullable=False)
    schedule_date = Column(DateTime, nullable=False)
    status = Column(Enum(ReceiptStatus), default=ReceiptStatus.Draft)
    responsible_id = Column(Integer, ForeignKey("users.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    lines = relationship(
        "ReceiptLine", back_populates="receipt", cascade="all, delete-orphan"
    )


class ReceiptLine(Base):
    __tablename__ = "receipt_lines"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    qty = Column(Float, nullable=False)

    receipt = relationship("Receipt", back_populates="lines")
    product = relationship("Product")


class Delivery(Base):
    __tablename__ = "deliveries"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, nullable=False)
    delivery_address = Column(String, nullable=False)
    schedule_date = Column(DateTime, nullable=False)
    status = Column(Enum(DeliveryStatus), default=DeliveryStatus.Draft)
    responsible_id = Column(Integer, ForeignKey("users.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    lines = relationship(
        "DeliveryLine", back_populates="delivery", cascade="all, delete-orphan"
    )


class DeliveryLine(Base):
    __tablename__ = "delivery_lines"
    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    qty = Column(Float, nullable=False)

    delivery = relationship("Delivery", back_populates="lines")
    product = relationship("Product")


class Move(Base):
    __tablename__ = "moves"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    from_location = Column(String, default="")
    to_location = Column(String, default="")
    qty = Column(Float, nullable=False)
    direction = Column(String, nullable=False)  # "in" or "out"
    date = Column(DateTime, default=datetime.utcnow)
    source_ref = Column(String, nullable=False)

    product = relationship("Product")
