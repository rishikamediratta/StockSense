from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    total_products = db.query(models.Product).count()
    low_stock_items = db.query(models.Product).filter(models.Product.on_hand <= 5).count()

    pending_receipts = db.query(models.Receipt).filter(
        models.Receipt.status.in_(
            [models.ReceiptStatus.Draft, models.ReceiptStatus.Ready]
        )
    ).count()
    pending_deliveries = db.query(models.Delivery).filter(
        models.Delivery.status.in_([
            models.DeliveryStatus.Draft,
            models.DeliveryStatus.Waiting,
            models.DeliveryStatus.Ready,
        ])
    ).count()

    now = datetime.utcnow()
    late_receipts = db.query(models.Receipt).filter(
        models.Receipt.schedule_date < now,
        models.Receipt.status.notin_(
            [models.ReceiptStatus.Done, models.ReceiptStatus.Canceled]
        ),
    ).count()
    late_deliveries = db.query(models.Delivery).filter(
        models.Delivery.schedule_date < now,
        models.Delivery.status.notin_([
            models.DeliveryStatus.Done, models.DeliveryStatus.Canceled
        ]),
    ).count()

    return {
        "total_products": total_products,
        "low_stock_items": low_stock_items,
        "pending_receipts": pending_receipts,
        "pending_deliveries": pending_deliveries,
        "late_receipts": late_receipts,
        "late_deliveries": late_deliveries,
    }
