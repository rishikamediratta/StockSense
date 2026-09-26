import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.UserOut)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.login_id == payload.login_id).first():
        raise HTTPException(400, "Login ID already exists")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(400, "Email already exists")

    user = models.User(
        login_id=payload.login_id,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.login_id == payload.login_id).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Login Id or Password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.post("/forgot-password/request", response_model=schemas.MessageResponse)
def forgot_password_request(payload: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    otp = f"{random.randint(100000, 999999)}"
    user.reset_otp = hash_password(otp)
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    return {"message": "Verification code has been sent", "otp": otp}


@router.post("/forgot-password/verify", response_model=schemas.MessageResponse)
def forgot_password_verify(payload: schemas.PasswordResetVerify, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.reset_otp:
        raise HTTPException(status_code=400, detail="No password reset requested")

    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")

    if not verify_password(payload.otp, user.reset_otp):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    return {"message": "OTP verified successfully"}


@router.post("/forgot-password/confirm", response_model=schemas.MessageResponse)
def forgot_password_confirm(payload: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.reset_otp:
        raise HTTPException(status_code=400, detail="No password reset requested")

    if user.reset_otp_expires_at and user.reset_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")

    if not verify_password(payload.otp, user.reset_otp):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.password_hash = hash_password(payload.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()
    return {"message": "Password reset complete. You can now sign in."}

