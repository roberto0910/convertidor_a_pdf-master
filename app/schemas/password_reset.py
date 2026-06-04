from pydantic import BaseModel, EmailStr, Field


class PasswordRecoveryRequest(BaseModel):
    email: EmailStr


class PasswordRecoveryResponse(BaseModel):
    success: bool = True
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8)


class ResetPasswordResponse(BaseModel):
    success: bool = True
    message: str
