from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    vehicle_id: str


class FavoriteResponse(BaseModel):
    id: str
    dealer_id: str
    vehicle_id: str

    class Config:
        from_attributes = True
