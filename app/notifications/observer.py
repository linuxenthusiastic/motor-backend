from sqlalchemy.orm import Session

from app.notifications.repository import NotificationRepository
from app.shared.events import EventObserver


class NotificationObserver(EventObserver):
    def __init__(self, db: Session):
        self.db = db

    def handle(self, event_type: str, payload: dict) -> None:
        if event_type == "scan_created":
            repo = NotificationRepository(self.db)
            repo.create_notification(
                dealer_id=payload["dealer_id"],
                message=f"Nuevo scan registrado: {payload['odometer']} km",
            )
