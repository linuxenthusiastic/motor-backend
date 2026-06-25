VEHICLE = {
    "vin": "1HGBH41JXMN109186",
    "plate": "AA123BB",
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2022,
    "color": "Blanco",
}


def test_crear_vehiculo_sin_token_retorna_401(client):
    resp = client.post("/vehicles/", json=VEHICLE)
    assert resp.status_code == 401


def test_crear_vehiculo_con_token_valido(client, auth_headers):
    resp = client.post("/vehicles/", json=VEHICLE, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["vin"] == VEHICLE["vin"]
    assert data["brand"] == "Toyota"
    assert data["is_published"] is False


def test_mis_vehiculos_sin_token_retorna_401(client):
    resp = client.get("/vehicles/my")
    assert resp.status_code == 401


def test_mis_vehiculos_retorna_solo_los_del_dealer(client, auth_headers):
    client.post("/vehicles/", json=VEHICLE, headers=auth_headers)
    resp = client.get("/vehicles/my", headers=auth_headers)
    assert resp.status_code == 200
    vehicles = resp.json()
    assert len(vehicles) == 1
    assert vehicles[0]["vin"] == VEHICLE["vin"]


def test_catalogo_muestra_solo_publicados(client, auth_headers):
    v1 = client.post("/vehicles/", json=VEHICLE, headers=auth_headers).json()
    client.post("/vehicles/", json={**VEHICLE, "vin": "UNPUB0000"}, headers=auth_headers)

    client.patch(f"/vehicles/{v1['id']}/publish", headers=auth_headers)

    catalog = client.get("/vehicles/catalog").json()
    assert len(catalog) == 1
    assert catalog[0]["id"] == v1["id"]


def test_publicar_vehiculo_cambia_estado(client, auth_headers):
    vehicle = client.post("/vehicles/", json=VEHICLE, headers=auth_headers).json()
    assert vehicle["is_published"] is False

    resp = client.patch(f"/vehicles/{vehicle['id']}/publish", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["is_published"] is True


def test_publicar_vehiculo_ajeno_retorna_404(client, auth_headers):
    client.post("/auth/register", json={"name": "Otro", "email": "otro@test.com", "password": "pass"})
    otro_token = client.post("/auth/login", json={"email": "otro@test.com", "password": "pass"}).json()["access_token"]
    otro_headers = {"Authorization": f"Bearer {otro_token}"}

    vehicle = client.post("/vehicles/", json={**VEHICLE, "vin": "AJENO001"}, headers=otro_headers).json()
    resp = client.patch(f"/vehicles/{vehicle['id']}/publish", headers=auth_headers)
    assert resp.status_code == 404


def test_catalogo_incluye_email_del_dealer(client, auth_headers):
    vehicle = client.post("/vehicles/", json=VEHICLE, headers=auth_headers).json()
    client.patch(f"/vehicles/{vehicle['id']}/publish", headers=auth_headers)

    catalog = client.get("/vehicles/catalog").json()
    assert catalog[0]["dealer_email"] == "dealer@test.com"
