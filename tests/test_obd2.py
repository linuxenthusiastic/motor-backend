VEHICLE = {
    "vin": "SCANTEST00001",
    "plate": "SC001",
    "brand": "Honda",
    "model": "Civic",
    "year": 2021,
    "color": "Negro",
}

SCAN = {
    "odometer": 85000,
    "rpm": 800,
    "coolant_temp": 90.5,
    "battery_voltage": 12.65,
    "error_codes": "",
    "scan_date": "2024-01-15T10:30:00",
}


def test_crear_scan_vehicle_inexistente_retorna_403(client, auth_headers):
    resp = client.post("/obd2/scans", json={
        **SCAN,
        "vehicle_id": "00000000-0000-0000-0000-000000000000",
    }, headers=auth_headers)
    assert resp.status_code == 403


def test_crear_scan_exitoso(client, auth_headers):
    vehicle = client.post("/vehicles/", json=VEHICLE, headers=auth_headers).json()
    resp = client.post("/obd2/scans", json={**SCAN, "vehicle_id": vehicle["id"]}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["odometer"] == 85000
    assert data["vehicle_id"] == vehicle["id"]
    assert "id" in data


def test_crear_scan_vehicle_ajeno_retorna_403(client, auth_headers):
    client.post("/auth/register", json={"name": "Otro", "email": "otro@test.com", "password": "pass"})
    otro_token = client.post("/auth/login", json={"email": "otro@test.com", "password": "pass"}).json()["access_token"]
    otro_headers = {"Authorization": f"Bearer {otro_token}"}

    vehicle = client.post("/vehicles/", json={**VEHICLE, "vin": "AJENOSCAN"}, headers=otro_headers).json()
    resp = client.post("/obd2/scans", json={**SCAN, "vehicle_id": vehicle["id"]}, headers=auth_headers)
    assert resp.status_code == 403


def test_crear_scan_sin_token_retorna_401(client, auth_headers):
    vehicle = client.post("/vehicles/", json=VEHICLE, headers=auth_headers).json()
    resp = client.post("/obd2/scans", json={**SCAN, "vehicle_id": vehicle["id"]})
    assert resp.status_code == 401


def test_obtener_scans_de_vehiculo(client, auth_headers):
    vehicle = client.post("/vehicles/", json={**VEHICLE, "vin": "SCANLIST001"}, headers=auth_headers).json()
    client.post("/obd2/scans", json={**SCAN, "vehicle_id": vehicle["id"]}, headers=auth_headers)
    client.post("/obd2/scans", json={**SCAN, "vehicle_id": vehicle["id"], "odometer": 90000}, headers=auth_headers)

    resp = client.get(f"/obd2/scans/{vehicle['id']}")
    assert resp.status_code == 200
    assert len(resp.json()) == 2
