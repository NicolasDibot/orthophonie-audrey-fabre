from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sqlite3
import time
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:  # pragma: no cover - only relevant before dependencies are installed.
    psycopg = None
    dict_row = None

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "audrey.db"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "audrey")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "neuro2026")
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", str(12 * 60 * 60)))
MAX_JSON_BYTES = int(os.getenv("MAX_JSON_BYTES", str(12 * 1024 * 1024)))

DEFAULT_RESOURCE_STATE = {"overrides": {}, "created": [], "hidden": [], "deleted": []}

app = FastAPI(title="API Cabinet d'Orthophonie d'Audrey Fabre")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
def startup() -> None:
    initialize_database()


def use_postgres() -> bool:
    return bool(DATABASE_URL)


def sql_placeholder() -> str:
    return "%s" if use_postgres() else "?"


def get_connection() -> Any:
    if use_postgres():
        if psycopg is None or dict_row is None:
            raise RuntimeError("psycopg is required when DATABASE_URL is set")
        return psycopg.connect(DATABASE_URL, row_factory=dict_row)

    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS kv_store (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
            """
        )
        ensure_kv(connection, "resource_state", DEFAULT_RESOURCE_STATE)
        ensure_kv(connection, "comments_by_resource_id", {})
        ensure_kv(connection, "appointment_state", create_default_appointment_state())


def ensure_kv(connection: Any, key: str, value: Any) -> None:
    placeholder = sql_placeholder()
    exists = connection.execute(f"SELECT 1 FROM kv_store WHERE key = {placeholder}", (key,)).fetchone()
    if exists:
        return

    connection.execute(
        f"INSERT INTO kv_store (key, value, updated_at) VALUES ({placeholder}, {placeholder}, {placeholder})",
        (key, json.dumps(value, ensure_ascii=False), utc_now()),
    )


def read_kv(connection: Any, key: str, fallback: Any) -> Any:
    placeholder = sql_placeholder()
    row = connection.execute(f"SELECT value FROM kv_store WHERE key = {placeholder}", (key,)).fetchone()
    if not row:
        return fallback

    try:
        return json.loads(row["value"])
    except json.JSONDecodeError:
        return fallback


def write_kv(connection: Any, key: str, value: Any) -> None:
    placeholder = sql_placeholder()
    connection.execute(
        f"""
        INSERT INTO kv_store (key, value, updated_at)
        VALUES ({placeholder}, {placeholder}, {placeholder})
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        """,
        (key, json.dumps(value, ensure_ascii=False), utc_now()),
    )


async def read_json_payload(request: Request) -> dict[str, Any]:
    body = await request.body()
    if len(body) > MAX_JSON_BYTES:
        raise HTTPException(status_code=413, detail="Payload too large")

    try:
        payload = json.loads(body or b"{}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload must be an object")

    return payload


def utc_now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def create_default_appointment_state() -> dict[str, list[dict[str, Any]]]:
    slots: list[dict[str, Any]] = []
    today = date.today()

    for day_offset in range(28):
        current = today + timedelta(days=day_offset)
        weekday = current.weekday()

        if weekday in (0, 2):
            slots.extend(
                [
                    create_slot(current.isoformat(), "09:00", 45),
                    create_slot(current.isoformat(), "10:30", 45),
                    create_slot(current.isoformat(), "14:00", 45),
                ]
            )

        if weekday == 4:
            slots.append(create_slot(current.isoformat(), "11:00", 45))

    return {"slots": slots, "requests": []}


def create_slot(slot_date: str, start: str, duration: int) -> dict[str, Any]:
    return {
        "id": f"slot-{slot_date}-{start.replace(':', '')}-{uuid.uuid4().hex[:8]}",
        "date": slot_date,
        "start": start,
        "end": add_minutes_to_time(start, duration),
        "enabled": True,
    }


def add_minutes_to_time(value: str, minutes: int) -> str:
    hour, minute = [int(part) for part in value.split(":", maxsplit=1)]
    total = hour * 60 + minute + minutes
    return f"{(total // 60) % 24:02d}:{total % 60:02d}"


def sign_token(payload: dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = encode_json_segment(header)
    encoded_payload = encode_json_segment(payload)
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        f"{encoded_header}.{encoded_payload}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{base64url_encode(signature)}"


def encode_json_segment(value: dict[str, Any]) -> str:
    return base64url_encode(json.dumps(value, separators=(",", ":")).encode("utf-8"))


def base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def verify_token(token: str) -> dict[str, Any] | None:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".", maxsplit=2)
        expected_signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            f"{encoded_header}.{encoded_payload}".encode("utf-8"),
            hashlib.sha256,
        ).digest()
        signature = base64url_decode(encoded_signature)
        if not hmac.compare_digest(signature, expected_signature):
            return None

        payload = json.loads(base64url_decode(encoded_payload))
    except Exception:
        return None

    if payload.get("sub") != ADMIN_USERNAME:
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None

    return payload


def get_admin_payload(authorization: str = Header(default="")) -> dict[str, Any]:
    token = extract_bearer_token(authorization)
    payload = verify_token(token) if token else None
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return payload


def get_optional_admin_payload(authorization: str = Header(default="")) -> dict[str, Any] | None:
    token = extract_bearer_token(authorization)
    return verify_token(token) if token else None


def extract_bearer_token(authorization: str) -> str:
    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return ""
    return authorization[len(prefix) :].strip()


def normalize_resource_state(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return dict(DEFAULT_RESOURCE_STATE)

    return {
        "overrides": value.get("overrides") if isinstance(value.get("overrides"), dict) else {},
        "created": value.get("created") if isinstance(value.get("created"), list) else [],
        "hidden": unique_strings(value.get("hidden")),
        "deleted": unique_strings(value.get("deleted")),
    }


def normalize_comments_map(value: Any) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(value, dict):
        return {}

    normalized: dict[str, list[dict[str, Any]]] = {}
    for resource_id, comments in value.items():
        if isinstance(resource_id, str) and isinstance(comments, list):
            normalized[resource_id] = [comment for comment in comments if isinstance(comment, dict)]

    return normalized


def normalize_appointment_state(value: Any) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(value, dict):
        return create_default_appointment_state()

    slots = [slot for slot in value.get("slots", []) if isinstance(slot, dict)]
    requests = [request for request in value.get("requests", []) if isinstance(request, dict)]
    return {"slots": slots, "requests": requests}


def unique_strings(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    seen: set[str] = set()
    items: list[str] = []
    for item in value:
        if isinstance(item, str) and item not in seen:
            seen.add(item)
            items.append(item)

    return items


def public_comments_map(comments_by_resource_id: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    return {
        resource_id: public_comments(comments)
        for resource_id, comments in comments_by_resource_id.items()
    }


def public_comments(comments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id = {comment.get("id"): comment for comment in comments if comment.get("id")}

    def has_approved_lineage(comment: dict[str, Any]) -> bool:
        if comment.get("status") != "approved":
            return False

        visited: set[str] = set()
        parent_id = comment.get("parentId") or ""
        while parent_id:
            if parent_id in visited:
                return False
            visited.add(parent_id)
            parent = by_id.get(parent_id)
            if not parent or parent.get("status") != "approved":
                return False
            parent_id = parent.get("parentId") or ""

        return True

    return [comment for comment in comments if has_approved_lineage(comment)]


def public_appointment_state(state: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    return {
        "slots": state["slots"],
        "requests": [
            {
                "id": request.get("id", ""),
                "slotId": request.get("slotId", ""),
                "status": request.get("status", "pending"),
            }
            for request in state["requests"]
            if request.get("status") in {"pending", "approved"}
        ],
    }


def is_slot_bookable(state: dict[str, list[dict[str, Any]]], slot_id: str) -> bool:
    slot = next((item for item in state["slots"] if item.get("id") == slot_id), None)
    if not slot or slot.get("enabled") is False:
        return False

    slot_start = f"{slot.get('date', '')}T{slot.get('start', '')}:00"
    try:
        if datetime.fromisoformat(slot_start).timestamp() <= time.time():
            return False
    except ValueError:
        return False

    return not any(
        request.get("slotId") == slot_id and request.get("status") in {"pending", "approved"}
        for request in state["requests"]
    )


def normalize_comment_payload(payload: dict[str, Any], is_admin: bool) -> dict[str, Any]:
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message required")

    parent_id = str(payload.get("parentId", "") or "").strip()
    author = "Audrey Fabre" if payload.get("isReply") and is_admin else str(payload.get("author", "")).strip()
    if not author:
        author = "Audrey Fabre" if is_admin else "Anonyme"

    return {
        "id": str(payload.get("id") or uuid.uuid4()),
        "author": author,
        "message": message,
        "createdAt": str(payload.get("createdAt") or utc_now()),
        "parentId": parent_id,
        "status": "approved" if is_admin else "pending",
    }


def remove_comment_and_replies(comments: list[dict[str, Any]], comment_id: str) -> list[dict[str, Any]]:
    ids_to_remove = {comment_id}
    changed = True

    while changed:
        changed = False
        for comment in comments:
            parent_id = comment.get("parentId")
            comment_identifier = comment.get("id")
            if parent_id in ids_to_remove and comment_identifier not in ids_to_remove:
                ids_to_remove.add(comment_identifier)
                changed = True

    return [comment for comment in comments if comment.get("id") not in ids_to_remove]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login")
async def login(request: Request) -> dict[str, Any]:
    payload = await read_json_payload(request)
    username = str(payload.get("login", "")).strip()
    password = str(payload.get("password", ""))

    if not (
        hmac.compare_digest(username, ADMIN_USERNAME)
        and hmac.compare_digest(password, ADMIN_PASSWORD)
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    now = int(time.time())
    token = sign_token({"sub": ADMIN_USERNAME, "iat": now, "exp": now + TOKEN_TTL_SECONDS})
    return {"token": token, "expiresAt": now + TOKEN_TTL_SECONDS}


@app.get("/api/state")
def get_state(admin_payload: dict[str, Any] | None = Depends(get_optional_admin_payload)) -> dict[str, Any]:
    with get_connection() as connection:
        resource_state = normalize_resource_state(read_kv(connection, "resource_state", DEFAULT_RESOURCE_STATE))
        comments_by_resource_id = normalize_comments_map(read_kv(connection, "comments_by_resource_id", {}))
        appointment_state = normalize_appointment_state(read_kv(connection, "appointment_state", create_default_appointment_state()))

    is_admin = bool(admin_payload)
    return {
        "resourceState": resource_state,
        "commentsByResourceId": comments_by_resource_id if is_admin else public_comments_map(comments_by_resource_id),
        "appointmentState": appointment_state if is_admin else public_appointment_state(appointment_state),
        "isAdmin": is_admin,
    }


@app.put("/api/resource-state")
async def update_resource_state(
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    resource_state = normalize_resource_state(payload.get("resourceState"))

    with get_connection() as connection:
        write_kv(connection, "resource_state", resource_state)

    return {"resourceState": resource_state}


@app.post("/api/comments/{resource_id}")
async def create_comment(
    resource_id: str,
    request: Request,
    admin_payload: dict[str, Any] | None = Depends(get_optional_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    comment = normalize_comment_payload(payload, bool(admin_payload))

    with get_connection() as connection:
        comments_by_resource_id = normalize_comments_map(read_kv(connection, "comments_by_resource_id", {}))
        comments = comments_by_resource_id.setdefault(resource_id, [])
        comments.insert(0, comment)
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comment": comment}


@app.put("/api/comments/{resource_id}")
async def replace_comments(
    resource_id: str,
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    comments = payload.get("comments")
    if not isinstance(comments, list):
        raise HTTPException(status_code=400, detail="Comments must be a list")

    with get_connection() as connection:
        comments_by_resource_id = normalize_comments_map(read_kv(connection, "comments_by_resource_id", {}))
        comments_by_resource_id[resource_id] = [comment for comment in comments if isinstance(comment, dict)]
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comments": comments_by_resource_id[resource_id]}


@app.post("/api/comments/{resource_id}/{comment_id}/approve")
def approve_comment(
    resource_id: str,
    comment_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    with get_connection() as connection:
        comments_by_resource_id = normalize_comments_map(read_kv(connection, "comments_by_resource_id", {}))
        comments = comments_by_resource_id.get(resource_id, [])
        for comment in comments:
            if comment.get("id") == comment_id:
                comment["status"] = "approved"
        comments_by_resource_id[resource_id] = comments
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comments": comments}


@app.delete("/api/comments/{resource_id}/{comment_id}")
def delete_comment(
    resource_id: str,
    comment_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    with get_connection() as connection:
        comments_by_resource_id = normalize_comments_map(read_kv(connection, "comments_by_resource_id", {}))
        comments = remove_comment_and_replies(comments_by_resource_id.get(resource_id, []), comment_id)
        comments_by_resource_id[resource_id] = comments
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comments": comments}


@app.put("/api/appointment-state")
async def update_appointment_state(
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    appointment_state = normalize_appointment_state(payload.get("appointmentState"))

    with get_connection() as connection:
        write_kv(connection, "appointment_state", appointment_state)

    return {"appointmentState": appointment_state}


@app.post("/api/appointments/requests")
async def create_appointment_request(request: Request) -> dict[str, Any]:
    payload = await read_json_payload(request)
    appointment_request = payload.get("request")

    if not isinstance(appointment_request, dict):
        raise HTTPException(status_code=400, detail="Appointment request required")

    slot_id = str(appointment_request.get("slotId", ""))
    patient_name = str(appointment_request.get("patientName", "")).strip()
    phone = str(appointment_request.get("phone", "")).strip()
    email = str(appointment_request.get("email", "")).strip()

    if not slot_id or not patient_name or not (phone or email):
        raise HTTPException(status_code=400, detail="Missing appointment information")

    appointment_request = {
        "id": str(appointment_request.get("id") or uuid.uuid4()),
        "slotId": slot_id,
        "patientName": patient_name,
        "phone": phone,
        "email": email,
        "reason": str(appointment_request.get("reason", "")).strip(),
        "attachments": appointment_request.get("attachments")
        if isinstance(appointment_request.get("attachments"), list)
        else [],
        "status": "pending",
        "createdAt": str(appointment_request.get("createdAt") or utc_now()),
    }

    with get_connection() as connection:
        appointment_state = normalize_appointment_state(read_kv(connection, "appointment_state", create_default_appointment_state()))
        if not is_slot_bookable(appointment_state, slot_id):
            raise HTTPException(status_code=409, detail="Slot is not available")

        appointment_state["requests"].insert(0, appointment_request)
        write_kv(connection, "appointment_state", appointment_state)

    return {"request": appointment_request}
