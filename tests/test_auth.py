def test_register_retorna_dealer(client):
    resp = client.post("/auth/register", json={
        "name": "Juan Pérez",
        "email": "juan@test.com",
        "password": "secret123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "juan@test.com"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_email_duplicado_retorna_400(client):
    payload = {"name": "Ana", "email": "ana@test.com", "password": "pass"}
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 400
    assert "ya registrado" in resp.json()["detail"].lower()


def test_login_correcto_retorna_token(client, registered_dealer):
    resp = client.post("/auth/login", json=registered_dealer)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_password_incorrecta_retorna_401(client, registered_dealer):
    resp = client.post("/auth/login", json={
        "email": registered_dealer["email"],
        "password": "password_incorrecta",
    })
    assert resp.status_code == 401


def test_login_email_inexistente_retorna_401(client):
    resp = client.post("/auth/login", json={
        "email": "noexiste@test.com",
        "password": "cualquiera",
    })
    assert resp.status_code == 401


def test_me_sin_token_retorna_401(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_con_token_retorna_dealer_autenticado(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "dealer@test.com"
