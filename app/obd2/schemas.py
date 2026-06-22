from datetime import datetime

from pydantic import BaseModel


class ScanCreate(BaseModel):
    vehicle_id: str
    odometer: int
    rpm: int
    coolant_temp: float
    battery_voltage: float
    error_codes: str
    scan_date: datetime


class ScanResponse(BaseModel):
    id: str
    vehicle_id: str
    odometer: int
    rpm: int
    coolant_temp: float
    battery_voltage: float
    error_codes: str
    scan_date: datetime

    class Config:
        from_attributes = True
