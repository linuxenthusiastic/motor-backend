from pydantic import BaseModel


class CarModelCreate(BaseModel):
    brand: str
    model: str


class CarModelResponse(BaseModel):
    id: str
    brand: str
    model: str
