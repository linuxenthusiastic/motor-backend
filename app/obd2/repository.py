from sqlalchemy.orm import Session

from app.obd2.models import OBD2Scan
from app.vehicles.vehicles import Vehicle


class OBD2Repository:
    def __init__(self, db: Session):
        self.db = db

    def create_scan(
        self,
        vehicle_id: str,
        odometer: int,
        rpm: int,
        coolant_temp: float,
        battery_voltage: float,
        error_codes: str,
        scan_date,
    ):
        nuevo_scan = OBD2Scan(
            vehicle_id=vehicle_id,
            odometer=odometer,
            rpm=rpm,
            coolant_temp=coolant_temp,
            battery_voltage=battery_voltage,
            error_codes=error_codes,
            scan_date=scan_date,
        )

        self.db.add(nuevo_scan)
        self.db.commit()
        self.db.refresh(nuevo_scan)
        return nuevo_scan

    def get_scans_by_vehicle(
        self,
        vehicle_id: str,
    ):
        return (
            self.db.query(OBD2Scan)
            .filter(OBD2Scan.vehicle_id == vehicle_id)
            .order_by(OBD2Scan.scan_date)
            .all()
        )
