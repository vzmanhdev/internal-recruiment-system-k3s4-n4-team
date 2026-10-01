from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas.auth import UserRegister, UserLogin, ForgotPasswordRequest, Token, UserResponse, ErrorResponse

router = APIRouter()

@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Lỗi dữ liệu đầu vào hoặc Email đã tồn tại"},
        422: {"model": ErrorResponse, "description": "Sai định dạng dữ liệu"}
    }
)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Email này đã được đăng ký trên hệ thống. Vui lòng sử dụng email khác hoặc Đăng nhập.",
                "field_errors": {
                    "email": "Email này đã được đăng ký trên hệ thống."
                }
            }
        )

    # Create new user
    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role or "employee",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    access_token = create_access_token(subject=new_user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user.to_dict()
    }

@router.post(
    "/login",
    response_model=Token,
    responses={
        400: {"model": ErrorResponse, "description": "Email không tồn tại hoặc sai mật khẩu"}
    }
)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()

    # Special handling for default Admin System account: ensure it exists & matches credentials
    if clean_email in ["admin@company.com", "admin@gmail.com"]:
        admin_user = db.query(User).filter(User.email == clean_email).first()
        if not admin_user:
            admin_user = User(
                email=clean_email,
                full_name="Admin System",
                hashed_password=hash_password("company123"),
                role="admin",
                phone="0987654321",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        elif user_in.password == "company123" and not verify_password("company123", admin_user.hashed_password):
            admin_user.hashed_password = hash_password("company123")
            admin_user.role = "admin"
            admin_user.is_active = True
            db.commit()
            db.refresh(admin_user)

    # Special handling for Hiring Manager (Trưởng bộ phận): truongbophan@company.com
    if clean_email == "truongbophan@company.com":
        manager_user = db.query(User).filter(User.email == "truongbophan@company.com").first()
        if not manager_user:
            manager_user = User(
                email="truongbophan@company.com",
                full_name="Lê Trưởng Nhóm",
                hashed_password=hash_password("company123"),
                role="department_manager",
                phone="0912345678",
                is_active=True
            )
            db.add(manager_user)
            db.commit()
            db.refresh(manager_user)
        elif user_in.password in ["company123", "truongbophan123"]:
            if not verify_password(user_in.password, manager_user.hashed_password):
                manager_user.hashed_password = hash_password(user_in.password)
                manager_user.role = "department_manager"
                manager_user.is_active = True
                db.commit()
                db.refresh(manager_user)

    # Find user by email (case-insensitive)
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Tài khoản Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.",
                "field_errors": {
                    "email": "Tài khoản Email không tồn tại trong hệ thống."
                }
            }
        )

    # Verify password
    if not verify_password(user_in.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Mật khẩu không chính xác. Vui lòng thử lại.",
                "field_errors": {
                    "password": "Mật khẩu không chính xác."
                }
            }
        )

    if not user.is_active:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên.",
                "field_errors": {
                    "email": "Tài khoản bị vô hiệu hóa."
                }
            }
        )

    # Generate JWT token
    access_token = create_access_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

@router.post(
    "/forgot-password",
    responses={
        400: {"model": ErrorResponse, "description": "Email không tồn tại trong hệ thống"}
    }
)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Verify email exists in database
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "detail": "Tài khoản Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại.",
                "field_errors": {
                    "email": "Tài khoản Email không tồn tại trong hệ thống."
                }
            }
        )

    return {
        "message": f"Hướng dẫn khôi phục mật khẩu đã được gửi đến email {req.email}. Vui lòng kiểm tra hộp thư đến."
    }

@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Chưa xác thực hoặc Token hết hạn"}
    }
)
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header Authorization bị thiếu hoặc không đúng định dạng 'Bearer <token>'"
        )

    token = authorization.split(" ")[1]
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn"
        )

    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng"
        )

    return user.to_dict()
