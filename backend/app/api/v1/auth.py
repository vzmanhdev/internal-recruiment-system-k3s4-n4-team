from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas.auth import ChangePasswordRequest, RegistrationResponse, UserRegister, UserLogin, ForgotPasswordRequest, Token, UserResponse, ErrorResponse

router = APIRouter()

@router.post(
    "/register",
    response_model=RegistrationResponse,
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
        # Public registration always creates a normal employee account.
        # Elevated roles must be assigned separately by an administrator.
        role="employee",
        is_active=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Yêu cầu đăng ký đã được gửi. Tài khoản sẽ sử dụng được sau khi Quản trị viên phê duyệt.",
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
    # Find user by email
    user = db.query(User).filter(User.email == user_in.email).first()
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
                "detail": "Tài khoản đang chờ Quản trị viên phê duyệt. Vui lòng thử lại sau khi yêu cầu được chấp nhận.",
                "field_errors": {
                    "email": "Tài khoản đang chờ phê duyệt."
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

@router.post(
    "/change-password",
    responses={
        400: {"model": ErrorResponse, "description": "Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ"},
        401: {"model": ErrorResponse, "description": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"}
    }
)
def change_password(
    payload: ChangePasswordRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    user_id = decode_access_token(authorization.split(" ", 1)[1])
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng")

    if not verify_password(payload.current_password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Mật khẩu hiện tại không chính xác.", "field_errors": {"current_password": "Mật khẩu hiện tại không chính xác."}}
        )

    if verify_password(payload.new_password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Mật khẩu mới phải khác mật khẩu hiện tại.", "field_errors": {"new_password": "Mật khẩu mới phải khác mật khẩu hiện tại."}}
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công."}

def require_admin(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Vui lòng đăng nhập bằng tài khoản Quản trị viên")
    user_id = decode_access_token(authorization.split(" ", 1)[1])
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn")
    admin = db.query(User).filter(User.id == int(user_id)).first()
    if not admin or admin.role != "admin" or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Chỉ Quản trị viên mới có quyền phê duyệt tài khoản")
    return admin

@router.get("/pending-users", response_model=list[UserResponse])
def list_pending_users(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_admin(authorization, db)
    return [user.to_dict() for user in db.query(User).filter(User.is_active.is_(False)).order_by(User.created_at.desc()).all()]

@router.post("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_admin(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy yêu cầu đăng ký")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user.to_dict()

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
