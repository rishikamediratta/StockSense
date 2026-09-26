from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/moves", tags=["moves"])


@router.get("", response_model=List[schemas.MoveOut])
def list_moves(
    db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    return db.query(models.Move).order_by(models.Move.date.desc()).all()
