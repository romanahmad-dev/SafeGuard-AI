from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from backend.database import get_db, User
from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["User Authentication & Role Governance"])

# Pydantic schemas for auth
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    role: Optional[str] = Field("Viewer", description="Viewer, Manager, Safety Officer, or Admin")

class UserLoginSchema(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool

    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_new_user(payload: UserRegister, db: Session = Depends(get_db)):
    """Registers a new safety engineer, operative, or administrator to the workspace."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == payload.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists. Please choose another username."
        )

    # Validate role values
    allowed_roles = ["Viewer", "Manager", "Safety Officer", "Admin"]
    role_to_set = payload.role if payload.role in allowed_roles else "Viewer"

    db_user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
        role=role_to_set,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=TokenResponse)
def login_user_json(payload: UserLoginSchema, db: Session = Depends(get_db)):
    """Authenticate via raw JSON payload and retrieve secure bearer token."""
    db_user = db.query(User).filter(User.username == payload.username).first()
    if not db_user or not verify_password(payload.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credentials supplied are not correct.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": db_user.username})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=db_user.role,
        username=db_user.username
    )

@router.post("/login-form", response_model=TokenResponse, include_in_schema=False)
def login_user_oauth_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Standard form-urlencoded OAuth2 helper to enable Swagger UI lock/unlock controls."""
    db_user = db.query(User).filter(User.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credentials supplied are not correct.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(data={"sub": db_user.username})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=db_user.role,
        username=db_user.username
    )

@router.get("/me", response_model=UserResponse)
def get_authenticated_subject(current_user: User = Depends(get_current_user)):
    """Returns the verified JWT subject, matching scopes and metadata."""
    return current_user
