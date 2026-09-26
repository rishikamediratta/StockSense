import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
import models, schemas
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db, new_id

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.UserOut)
def signup(payload: schemas.SignupRequest, db=Depends(get_db)):
    if db.users.find_one({"$or": [{"login_id": payload.login_id}, {"email": str(payload.email)}]}):
        if db.users.find_one({"login_id": payload.login_id}):
            raise HTTPException(400, "Login ID already exists")
        raise HTTPException(400, "Email already exists")
    user = {"id": new_id(db, "users"), "login_id": payload.login_id, "email": str(payload.email), "password_hash": hash_password(payload.password), "created_at": datetime.utcnow()}
    db.users.insert_one(user)
    return user


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db=Depends(get_db)):
    user = db.users.find_one({"login_id": payload.login_id})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Login Id or Password")
    return {"access_token": create_access_token({"sub": str(user["id"])})}


@router.get("/me", response_model=schemas.UserOut)
def me(user=Depends(get_current_user)):
    return user


def find_reset_user(db, email):
    return db.users.find_one({"email": str(email)})


@router.post("/forgot-password/request", response_model=schemas.MessageResponse)
def forgot_password_request(payload: schemas.PasswordResetRequest, db=Depends(get_db)):
    user = find_reset_user(db, payload.email)
    if not user:
        raise HTTPException(404, "Email not found")
    otp = f"{secrets.randbelow(900000) + 100000}"
    db.users.update_one({"id": user["id"]}, {"$set": {"reset_otp": hash_password(otp), "reset_otp_expires_at": datetime.utcnow() + timedelta(minutes=10)}})
    response = {"message": "Verification code has been sent"}
    if os.getenv("APP_ENV", "development").lower() != "production":
        response["otp"] = otp
    return response


def valid_reset_otp(payload, db):
    user = find_reset_user(db, payload.email)
    if not user or not user.get("reset_otp"):
        raise HTTPException(400, "No password reset requested")
    if user.get("reset_otp_expires_at") and user["reset_otp_expires_at"] < datetime.utcnow():
        raise HTTPException(400, "Verification code expired")
    if not verify_password(payload.otp, user["reset_otp"]):
        raise HTTPException(400, "Invalid verification code")
    return user


@router.post("/forgot-password/verify", response_model=schemas.MessageResponse)
def forgot_password_verify(payload: schemas.PasswordResetVerify, db=Depends(get_db)):
    valid_reset_otp(payload, db)
    return {"message": "OTP verified successfully"}


@router.post("/forgot-password/confirm", response_model=schemas.MessageResponse)
def forgot_password_confirm(payload: schemas.PasswordResetConfirm, db=Depends(get_db)):
    user = valid_reset_otp(payload, db)
    db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_password(payload.new_password)}, "$unset": {"reset_otp": "", "reset_otp_expires_at": ""}})
    return {"message": "Password reset complete. You can now sign in."}
