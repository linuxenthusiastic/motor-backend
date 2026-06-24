from pydantic import BaseModel


class NotificationCreate(BaseModel):
    dealer_id: str
    message: str


class NotificationResponse(BaseModel):
    id: str
    dealer_id: str
    message: str
    read: bool
