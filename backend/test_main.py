from __future__ import annotations

import base64
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ADMIN_PASSWORD", "test-password-that-is-not-used-in-production")
os.environ.setdefault(
    "SECRET_KEY", "test-secret-key-with-at-least-thirty-two-characters"
)
os.environ.setdefault("ENABLE_API_DOCS", "false")
os.environ.setdefault("CORS_ORIGINS", "https://nicolasdibot.github.io")
sys.path.insert(0, str(Path(__file__).parent))

import main  # noqa: E402


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(main, "DATABASE_URL", "")
    monkeypatch.setattr(main, "DATABASE_PATH", tmp_path / "test.db")
    monkeypatch.setattr(main, "SMTP_HOST", "")
    monkeypatch.setattr(main, "SMTP_FROM_EMAIL", "")
    monkeypatch.setattr(main, "CONTACT_TO_EMAIL", "")
    monkeypatch.setattr(main, "PUBLIC_BASE_URL", "https://api.example.test")
    main.rate_limit_state.clear()
    with TestClient(main.app, base_url="https://api.example.test") as test_client:
        yield test_client


def login(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/login",
        json={"login": main.ADMIN_USERNAME, "password": main.ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_health_security_headers_and_docs_are_closed(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["strict-transport-security"].startswith("max-age=")
    assert (
        response.headers["content-security-policy"]
        == "default-src 'none'; frame-ancestors 'none'"
    )
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404

    cors = client.options(
        "/api/state",
        headers={
            "Origin": "https://nicolasdibot.github.io",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert cors.status_code == 200
    assert (
        cors.headers["access-control-allow-origin"] == "https://nicolasdibot.github.io"
    )

    rejected_cors = client.options(
        "/api/state",
        headers={
            "Origin": "https://example.invalid",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert rejected_cors.status_code == 400
    assert "access-control-allow-origin" not in rejected_cors.headers


def test_login_rejects_invalid_credentials(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"login": main.ADMIN_USERNAME, "password": "incorrect"},
    )
    assert response.status_code == 401
    assert login(client)["Authorization"].startswith("Bearer ")


def test_contact_message_is_persisted_and_only_visible_to_admin(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/contact",
        json={
            "name": "Personne test",
            "email": "personne@example.test",
            "subject": "Question générale",
            "message": "Bonjour, ceci est un test.",
        },
    )
    assert response.status_code == 200
    assert response.json() == {"sent": False, "stored": True}
    assert client.get("/api/state").json()["contactMessages"] == []

    headers = login(client)
    messages = client.get("/api/state", headers=headers).json()["contactMessages"]
    assert len(messages) == 1
    assert messages[0]["email"] == "personne@example.test"
    assert messages[0]["deliveryStatus"] == "stored"

    deleted = client.delete(f"/api/contact/{messages[0]['id']}", headers=headers)
    assert deleted.status_code == 200
    assert client.get("/api/state", headers=headers).json()["contactMessages"] == []


def test_comments_require_moderation_and_admin_replies_follow_parent(
    client: TestClient,
) -> None:
    resource_id = "resource-test"
    created = client.post(
        f"/api/comments/{resource_id}",
        json={"author": "Visiteur", "message": "Commentaire à valider"},
    )
    assert created.status_code == 200
    comment = created.json()["comment"]
    assert comment["status"] == "pending"
    assert (
        client.get("/api/state").json()["commentsByResourceId"].get(resource_id, [])
        == []
    )

    headers = login(client)
    approved = client.post(
        f"/api/comments/{resource_id}/{comment['id']}/approve",
        headers=headers,
    )
    assert approved.status_code == 200

    reply = client.post(
        f"/api/comments/{resource_id}",
        headers=headers,
        json={
            "author": "Nom falsifié",
            "message": "Réponse professionnelle",
            "parentId": comment["id"],
            "isReply": True,
        },
    )
    assert reply.status_code == 200
    assert reply.json()["comment"]["author"] == "Audrey Fabre"

    public_comments = client.get("/api/state").json()["commentsByResourceId"][
        resource_id
    ]
    assert {item["id"] for item in public_comments} == {
        comment["id"],
        reply.json()["comment"]["id"],
    }


def test_public_resource_upload_and_authenticated_deletion(client: TestClient) -> None:
    headers = login(client)
    png = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    uploaded = client.post(
        "/api/files",
        headers=headers,
        json={
            "filename": "illustration.png",
            "contentType": "image/png",
            "dataUrl": f"data:image/png;base64,{base64.b64encode(png).decode()}",
        },
    )
    assert uploaded.status_code == 200
    file = uploaded.json()["file"]
    assert file["storage"] == "server"
    assert file["url"].startswith("https://api.example.test/api/files/")

    public_file = client.get(urlparse(file["url"]).path)
    assert public_file.status_code == 200
    assert public_file.content == png
    assert public_file.headers["content-type"].startswith("image/png")

    file_id = urlparse(file["url"]).path.rsplit("/", 1)[-1]
    assert client.delete(f"/api/files/{file_id}").status_code == 401
    assert client.delete(f"/api/files/{file_id}", headers=headers).status_code == 200
    assert client.get(f"/api/files/{file_id}").status_code == 404


def test_appointment_data_is_private_and_slot_cannot_be_requested_twice(
    client: TestClient,
) -> None:
    public_state = client.get("/api/state").json()["appointmentState"]
    slot = max(
        (slot for slot in public_state["slots"] if slot.get("enabled", True)),
        key=lambda item: (item["date"], item["start"]),
    )
    attachment_bytes = b"document de test sans donnee medicale"
    request_payload = {
        "request": {
            "slotId": slot["id"],
            "patientName": "Personne test",
            "email": "personne@example.test",
            "phone": "",
            "reason": "Demande de test",
            "attachments": [
                {
                    "label": "demande.txt",
                    "kind": "text/plain",
                    "url": f"data:text/plain;base64,{base64.b64encode(attachment_bytes).decode()}",
                }
            ],
        }
    }
    created = client.post("/api/appointments/requests", json=request_payload)
    assert created.status_code == 200

    public_request = client.get("/api/state").json()["appointmentState"]["requests"][0]
    assert set(public_request) == {"id", "slotId", "status"}

    headers = login(client)
    private_request = client.get("/api/state", headers=headers).json()[
        "appointmentState"
    ]["requests"][0]
    attachment = private_request["attachments"][0]
    assert attachment["storage"] == "private-server"
    attachment_path = urlparse(attachment["url"]).path
    assert client.get(attachment_path).status_code == 401
    private_file = client.get(attachment_path, headers=headers)
    assert private_file.status_code == 200
    assert private_file.content == attachment_bytes

    duplicate = client.post("/api/appointments/requests", json=request_payload)
    assert duplicate.status_code == 409

    deleted = client.delete(
        f"/api/appointments/requests/{private_request['id']}",
        headers=headers,
    )
    assert deleted.status_code == 200
    assert client.get(attachment_path, headers=headers).status_code == 404
    admin_requests = client.get("/api/state", headers=headers).json()[
        "appointmentState"
    ]["requests"]
    assert all(item["id"] != private_request["id"] for item in admin_requests)


def test_unsupported_upload_is_rejected(client: TestClient) -> None:
    headers = login(client)
    response = client.post(
        "/api/files",
        headers=headers,
        json={
            "filename": "danger.svg",
            "contentType": "image/svg+xml",
            "dataUrl": "data:image/svg+xml;base64,PHN2Zy8+",
        },
    )
    assert response.status_code == 400
