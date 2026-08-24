from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.models.models import User
from backend.app.schemas.schemas import UserCreate, UserResponse, UserLogin, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


def seed_default_admin(db: Session):
    """Seed default SOC admin and analyst users if missing."""
    if db.query(User).count() == 0:
        admin = User(
            name="SOC Lead Administrator",
            email="admin@cybersentinel.ai",
            password_hash=get_password_hash("Admin123!"),
            role="admin"
        )
        analyst = User(
            name="Senior SOC Analyst",
            email="analyst@cybersentinel.ai",
            password_hash=get_password_hash("Analyst123!"),
            role="analyst"
        )
        db.add(admin)
        db.add(analyst)
        db.commit()


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role or "analyst"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    seed_default_admin(db)
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=user.email)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db)):
    seed_default_admin(db)
    user = db.query(User).first()
    return user
