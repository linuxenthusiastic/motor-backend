from sqlalchemy.orm import Session
from sqlalchemy.types import Boolean

from app.notifications.models import Notification


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(self, dealer_id: str, message: str):

        new_notification = Notification(dealer_id=dealer_id, message=message)

        self.db.add(new_notification)
        self.db.commit()
        self.db.refresh(new_notification)
        return new_notification

    def get_notifcations_by_dealer_id(self, dealer_id: str):
        return (
            self.db.query(Notification)
            .filter(Notification.dealer_id == dealer_id)
            .all()
        )

    def mark_as_read_notification(self, notification_id: str):
        notification = self.db.query(Notification).filter_by(id=notification_id).first()
        if notification is None:
            return None

        notification.read = True  # type: ignore[assignment]
        self.db.commit()
        self.db.refresh(notification)
        return notification
