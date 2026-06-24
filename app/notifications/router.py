from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import get_current_dealer
from app.notifications.repository import NotificationRepository
from app.notifications.schemas import NotificationResponse
from app.shared.db.session import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = NotificationRepository(db)
    return repo.get_notifcations_by_dealer_id(dealer_id=current_dealer.id)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_dealer=Depends(get_current_dealer),
):
    repo = NotificationRepository(db)
    notification = repo.mark_as_read_notification(notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification
