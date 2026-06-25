from pydantic import BaseModel


class VehicleCreate(BaseModel):
    vin: str
    plate: str
    brand: str
    model: str
    year: int
    color: str


class VehicleResponse(BaseModel):
    id: str
    dealer_id: str | None = None
    dealer_email: str | None = None
    vin: str
    plate: str
    brand: str
    model: str
    year: int
    color: str
    is_published: bool = False

    class Config:
        from_attributes = True
