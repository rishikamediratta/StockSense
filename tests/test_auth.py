import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from database import Base, get_db
from main import app

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_valid_signup():
    response = client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "tester01@example.com",
            "password": "Password@123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["login_id"] == "tester01"
    assert data["email"] == "tester01@example.com"
    assert "id" in data
    assert "password_hash" not in data


def test_duplicate_login_id():
    client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "tester01@example.com",
            "password": "Password@123",
        },
    )
    response = client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "tester02@example.com",
            "password": "Password@123",
        },
    )
    assert response.status_code == 400
    assert "Login ID already exists" in response.json()["detail"]


def test_duplicate_email():
    client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "same@example.com",
            "password": "Password@123",
        },
    )
    response = client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester02",
            "email": "same@example.com",
            "password": "Password@123",
        },
    )
    assert response.status_code == 400
    assert "Email already exists" in response.json()["detail"]


def test_login_id_length_validation():
    # Less than 6 characters
    res_short = client.post(
        "/api/auth/signup",
        json={
            "login_id": "short",
            "email": "short@example.com",
            "password": "Password@123",
        },
    )
    assert res_short.status_code == 422

    # More than 12 characters
    res_long = client.post(
        "/api/auth/signup",
        json={
            "login_id": "toolongloginid",
            "email": "long@example.com",
            "password": "Password@123",
        },
    )
    assert res_long.status_code == 422


def test_password_strength_validation():
    # Less than 8 characters
    res = client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "t1@example.com",
            "password": "Aa@1",
        },
    )
    assert res.status_code == 422

    # No uppercase
    res = client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "t2@example.com",
            "password": "password@123",
        },
    )
    assert res.status_code == 422

    # No lowercase
    res = client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "t3@example.com",
            "password": "PASSWORD@123",
        },
    )
    assert res.status_code == 422

    # No special char
    res = client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "t4@example.com",
            "password": "Password123",
        },
    )
    assert res.status_code == 422


def test_valid_login():
    client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "tester01@example.com",
            "password": "Password@123",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={
            "login_id": "tester01",
            "password": "Password@123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_invalid_login():
    client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "tester01@example.com",
            "password": "Password@123",
        },
    )
    # Wrong password
    res_wrong_pw = client.post(
        "/api/auth/login",
        json={
            "login_id": "tester01",
            "password": "WrongPassword@123",
        },
    )
    assert res_wrong_pw.status_code == 401
    assert res_wrong_pw.json()["detail"] == "Invalid Login Id or Password"

    # Non-existent login id
    res_wrong_user = client.post(
        "/api/auth/login",
        json={
            "login_id": "nonexistent",
            "password": "Password@123",
        },
    )
    assert res_wrong_user.status_code == 401
    assert res_wrong_user.json()["detail"] == "Invalid Login Id or Password"


def test_me_endpoint_with_valid_and_invalid_token():
    client.post(
        "/api/auth/signup",
        json={
            "login_id": "tester01",
            "email": "tester01@example.com",
            "password": "Password@123",
        },
    )
    login_res = client.post(
        "/api/auth/login",
        json={
            "login_id": "tester01",
            "password": "Password@123",
        },
    )
    token = login_res.json()["access_token"]

    # Valid token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["login_id"] == "tester01"
    assert me_res.json()["email"] == "tester01@example.com"

    # Invalid token
    invalid_res = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token_xyz"},
    )
    assert invalid_res.status_code == 401

    # Missing token
    missing_res = client.get("/api/auth/me")
    assert missing_res.status_code == 401 or missing_res.status_code == 403


def test_otp_password_reset_flow():
    # 1. Signup
    client.post(
        "/api/auth/signup",
        json={
            "login_id": "resetuser",
            "email": "reset@example.com",
            "password": "OldPassword@123",
        },
    )

    # 2. Request password reset
    req_res = client.post(
        "/api/auth/forgot-password/request",
        json={"email": "reset@example.com"},
    )
    assert req_res.status_code == 200
    otp = req_res.json().get("otp")
    assert otp is not None
    assert len(otp) == 6

    # Request with non-existent email
    fail_req = client.post(
        "/api/auth/forgot-password/request",
        json={"email": "nobody@example.com"},
    )
    assert fail_req.status_code == 404

    # 3. Verify invalid OTP
    bad_verify = client.post(
        "/api/auth/forgot-password/verify",
        json={"email": "reset@example.com", "otp": "000000"},
    )
    assert bad_verify.status_code == 400

    # Verify valid OTP
    good_verify = client.post(
        "/api/auth/forgot-password/verify",
        json={"email": "reset@example.com", "otp": otp},
    )
    assert good_verify.status_code == 200

    # 4. Confirm password reset
    confirm_res = client.post(
        "/api/auth/forgot-password/confirm",
        json={
            "email": "reset@example.com",
            "otp": otp,
            "new_password": "NewPassword@2026",
        },
    )
    assert confirm_res.status_code == 200

    # 5. Verify old password fails
    old_login = client.post(
        "/api/auth/login",
        json={
            "login_id": "resetuser",
            "password": "OldPassword@123",
        },
    )
    assert old_login.status_code == 401

    # 6. Verify new password succeeds
    new_login = client.post(
        "/api/auth/login",
        json={
            "login_id": "resetuser",
            "password": "NewPassword@2026",
        },
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()
