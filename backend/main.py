from __future__ import annotations

import asyncio
import base64
import binascii
import hashlib
import hmac
import json
import logging
import os
import re
import sqlite3
import smtplib
import ssl
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse
from zoneinfo import ZoneInfo

from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

try:
    import psycopg
    from psycopg.rows import dict_row
except (
    ImportError
):  # pragma: no cover - only relevant before dependencies are installed.
    psycopg = None
    dict_row = None

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", "audrey.db"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "audrey")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
SECRET_KEY = os.getenv("SECRET_KEY", "")
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", str(12 * 60 * 60)))
MAX_JSON_BYTES = int(os.getenv("MAX_JSON_BYTES", str(12 * 1024 * 1024)))
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(3 * 1024 * 1024)))
CONTACT_TO_EMAIL = os.getenv("CONTACT_TO_EMAIL", "").strip()
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME).strip()
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() in {"1", "true", "yes"}
SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "true").lower() in {"1", "true", "yes"}
ENABLE_API_DOCS = os.getenv("ENABLE_API_DOCS", "false").lower() in {"1", "true", "yes"}
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
APPOINTMENT_TIMEZONE = ZoneInfo(os.getenv("APPOINTMENT_TIMEZONE", "Europe/Paris"))
RATE_LIMITS = {
    "login": (10, 15 * 60),
    "contact": (5, 15 * 60),
    "comment": (10, 15 * 60),
    "questionnaire": (20, 15 * 60),
    "appointment": (5, 60 * 60),
}
ALLOWED_UPLOAD_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "video/mp4",
    "video/webm",
    "video/quicktime",
}

logger = logging.getLogger(__name__)
rate_limit_state: dict[str, list[float]] = {}

DEFAULT_RESOURCE_STATE = {"overrides": {}, "created": [], "hidden": [], "deleted": []}
DEFAULT_SITE_CONTENT = {
    "homeTitle": "Bienvenue sur L'orthophonie au quotidien",
    "homeBody": (
        "Ce site est destiné aux patients et à leurs aidants.\n\n"
        "Vous y trouverez des informations et des outils sur la maladie de Huntington "
        "et la maladie de Parkinson. Les fiches sont classées par thème et peuvent être "
        "recherchées par mot-clé.\n\n"
        "Vous pouvez aussi laisser un commentaire sur une fiche, demander un rendez-vous "
        "ou contacter Audrey Fabre."
    ),
}
DEFAULT_CONTACT_MESSAGES: list[dict[str, Any]] = []


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not ADMIN_PASSWORD or not SECRET_KEY:
        raise RuntimeError("ADMIN_PASSWORD and SECRET_KEY must be configured")
    if SMTP_HOST and (not SMTP_FROM_EMAIL or not CONTACT_TO_EMAIL):
        raise RuntimeError(
            "SMTP_FROM_EMAIL and CONTACT_TO_EMAIL are required when SMTP is enabled"
        )
    initialize_database()
    yield


app = FastAPI(
    title="API L'orthophonie au quotidien",
    docs_url="/docs" if ENABLE_API_DOCS else None,
    redoc_url="/redoc" if ENABLE_API_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_API_DOCS else None,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next: Any) -> Response:
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=()"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    if not (request.method == "GET" and request.url.path.startswith("/api/files/")):
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; frame-ancestors 'none'"
        )
        response.headers["X-Frame-Options"] = "DENY"
    return response


def use_postgres() -> bool:
    return bool(DATABASE_URL)


def sql_placeholder() -> str:
    return "%s" if use_postgres() else "?"


def get_connection() -> Any:
    if use_postgres():
        if psycopg is None or dict_row is None:
            raise RuntimeError("psycopg is required when DATABASE_URL is set")
        return psycopg.connect(
            DATABASE_URL, row_factory=dict_row, prepare_threshold=None
        )

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
        blob_type = "BYTEA" if use_postgres() else "BLOB"
        connection.execute(
            f"""
            CREATE TABLE IF NOT EXISTS uploaded_files (
              id TEXT PRIMARY KEY,
              filename TEXT NOT NULL,
              content_type TEXT NOT NULL,
              content {blob_type} NOT NULL,
              is_private BOOLEAN NOT NULL DEFAULT FALSE,
              created_at TEXT NOT NULL
            )
            """
        )
        ensure_uploaded_files_private_column(connection)
        ensure_kv(connection, "resource_state", DEFAULT_RESOURCE_STATE)
        ensure_kv(connection, "comments_by_resource_id", {})
        ensure_kv(connection, "appointment_state", create_default_appointment_state())
        ensure_kv(connection, "site_content", DEFAULT_SITE_CONTENT)
        ensure_kv(connection, "questionnaire_responses_by_resource_id", {})
        ensure_kv(connection, "contact_messages", DEFAULT_CONTACT_MESSAGES)


def ensure_uploaded_files_private_column(connection: Any) -> None:
    if use_postgres():
        row = connection.execute(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'uploaded_files'
              AND column_name = 'is_private'
            """
        ).fetchone()
        if not row:
            connection.execute(
                "ALTER TABLE uploaded_files ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT FALSE"
            )
        return

    columns = connection.execute("PRAGMA table_info(uploaded_files)").fetchall()
    if not any(column["name"] == "is_private" for column in columns):
        connection.execute(
            "ALTER TABLE uploaded_files ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT 0"
        )


def ensure_kv(connection: Any, key: str, value: Any) -> None:
    placeholder = sql_placeholder()
    exists = connection.execute(
        f"SELECT 1 FROM kv_store WHERE key = {placeholder}", (key,)
    ).fetchone()
    if exists:
        return

    connection.execute(
        f"INSERT INTO kv_store (key, value, updated_at) VALUES ({placeholder}, {placeholder}, {placeholder})",
        (key, json.dumps(value, ensure_ascii=False), utc_now()),
    )


def read_kv(connection: Any, key: str, fallback: Any) -> Any:
    placeholder = sql_placeholder()
    row = connection.execute(
        f"SELECT value FROM kv_store WHERE key = {placeholder}", (key,)
    ).fetchone()
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


def lock_kv(connection: Any, key: str) -> None:
    if use_postgres():
        connection.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (key,))
    else:
        connection.execute("BEGIN IMMEDIATE")


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
    return (
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )


def create_default_appointment_state() -> dict[str, list[dict[str, Any]]]:
    slots: list[dict[str, Any]] = []
    today = datetime.now(APPOINTMENT_TIMEZONE).date()

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
        encoded_header, encoded_payload, encoded_signature = token.split(
            ".", maxsplit=2
        )
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


def get_optional_admin_payload(
    authorization: str = Header(default=""),
) -> dict[str, Any] | None:
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
        "overrides": value.get("overrides")
        if isinstance(value.get("overrides"), dict)
        else {},
        "created": value.get("created")
        if isinstance(value.get("created"), list)
        else [],
        "hidden": unique_strings(value.get("hidden")),
        "deleted": unique_strings(value.get("deleted")),
    }


def normalize_site_content(value: Any) -> dict[str, str]:
    if not isinstance(value, dict):
        return dict(DEFAULT_SITE_CONTENT)

    home_title = str(value.get("homeTitle", "")).strip()
    home_body = str(value.get("homeBody", "")).strip()
    return {
        "homeTitle": home_title[:200] or DEFAULT_SITE_CONTENT["homeTitle"],
        "homeBody": home_body[:6000] or DEFAULT_SITE_CONTENT["homeBody"],
    }


def normalize_comments_map(value: Any) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(value, dict):
        return {}

    normalized: dict[str, list[dict[str, Any]]] = {}
    for resource_id, comments in value.items():
        if isinstance(resource_id, str) and isinstance(comments, list):
            normalized[resource_id] = [
                comment for comment in comments if isinstance(comment, dict)
            ]

    return normalized


def normalize_questionnaire_responses_map(
    value: Any,
) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(value, dict):
        return {}

    normalized: dict[str, list[dict[str, Any]]] = {}
    for resource_id, responses in value.items():
        if isinstance(resource_id, str) and isinstance(responses, list):
            normalized[resource_id] = [
                response for response in responses if isinstance(response, dict)
            ]

    return normalized


def normalize_questionnaire_response_payload(payload: dict[str, Any]) -> dict[str, Any]:
    raw_answers = payload.get("answers")
    if not isinstance(raw_answers, list) or not raw_answers or len(raw_answers) > 50:
        raise HTTPException(status_code=400, detail="Answers required")

    answers: list[dict[str, Any]] = []
    for raw_answer in raw_answers:
        if not isinstance(raw_answer, dict):
            continue

        question_id = str(raw_answer.get("questionId", "")).strip()[:160]
        prompt = str(raw_answer.get("prompt", "")).strip()[:500]
        raw_value = raw_answer.get("value", "")
        if isinstance(raw_value, list):
            value: str | list[str] = [
                str(item).strip()[:500] for item in raw_value[:20] if str(item).strip()
            ]
        else:
            value = str(raw_value).strip()[:4000]

        if question_id and prompt and value:
            answers.append(
                {"questionId": question_id, "prompt": prompt, "value": value}
            )

    if not answers:
        raise HTTPException(status_code=400, detail="No valid answer")

    return {
        "id": str(uuid.uuid4()),
        "createdAt": utc_now(),
        "answers": answers,
    }


def normalize_appointment_state(value: Any) -> dict[str, list[dict[str, Any]]]:
    if not isinstance(value, dict):
        return create_default_appointment_state()

    slots = [slot for slot in value.get("slots", []) if isinstance(slot, dict)]
    requests = [
        request for request in value.get("requests", []) if isinstance(request, dict)
    ]
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


def public_comments_map(
    comments_by_resource_id: dict[str, list[dict[str, Any]]],
) -> dict[str, list[dict[str, Any]]]:
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


def public_appointment_state(
    state: dict[str, list[dict[str, Any]]],
) -> dict[str, list[dict[str, Any]]]:
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
        slot_datetime = datetime.fromisoformat(slot_start).replace(
            tzinfo=APPOINTMENT_TIMEZONE
        )
        if slot_datetime <= datetime.now(APPOINTMENT_TIMEZONE):
            return False
    except ValueError:
        return False

    return not any(
        request.get("slotId") == slot_id
        and request.get("status") in {"pending", "approved"}
        for request in state["requests"]
    )


def normalize_comment_payload(
    payload: dict[str, Any], is_admin: bool
) -> dict[str, Any]:
    message = str(payload.get("message", "")).strip()[:4000]
    if not message:
        raise HTTPException(status_code=400, detail="Message required")

    parent_id = str(payload.get("parentId", "") or "").strip()[:200]
    author = (
        "Audrey Fabre"
        if payload.get("isReply") and is_admin
        else " ".join(str(payload.get("author", "")).split())[:120]
    )
    if not author:
        author = "Audrey Fabre" if is_admin else "Anonyme"

    return {
        "id": str(uuid.uuid4()),
        "author": author,
        "message": message,
        "createdAt": utc_now(),
        "parentId": parent_id,
        "status": "approved" if is_admin else "pending",
    }


def remove_comment_and_replies(
    comments: list[dict[str, Any]], comment_id: str
) -> list[dict[str, Any]]:
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


def normalize_contact_payload(payload: dict[str, Any]) -> dict[str, str]:
    name = " ".join(str(payload.get("name", "")).split())[:120]
    email = "".join(str(payload.get("email", "")).split())[:254]
    subject = " ".join(str(payload.get("subject", "")).split())[:180]
    message = str(payload.get("message", "")).strip()[:6000]

    if not name or not subject or not message:
        raise HTTPException(status_code=400, detail="Missing contact information")

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    return {"name": name, "email": email, "subject": subject, "message": message}


def get_request_client_key(request: Request, scope: str) -> str:
    forwarded_for = (
        request.headers.get("x-forwarded-for", "").split(",", maxsplit=1)[0].strip()
    )
    client_address = forwarded_for or (
        request.client.host if request.client else "unknown"
    )
    return hashlib.sha256(f"{SECRET_KEY}:{scope}:{client_address}".encode()).hexdigest()


def enforce_rate_limit(request: Request, scope: str) -> None:
    maximum, window_seconds = RATE_LIMITS[scope]
    now = time.time()
    threshold = now - window_seconds
    request_key = get_request_client_key(request, scope)
    recent_requests = [
        timestamp
        for timestamp in rate_limit_state.get(request_key, [])
        if timestamp > threshold
    ]

    if len(recent_requests) >= maximum:
        raise HTTPException(status_code=429, detail="Too many requests")

    recent_requests.append(now)
    rate_limit_state[request_key] = recent_requests


def clear_rate_limit(request: Request, scope: str) -> None:
    rate_limit_state.pop(get_request_client_key(request, scope), None)


def validate_resource_id(resource_id: str) -> str:
    resource_id = str(resource_id).strip()
    if (
        not resource_id
        or len(resource_id) > 200
        or not re.fullmatch(r"[A-Za-z0-9._~-]+", resource_id)
    ):
        raise HTTPException(status_code=400, detail="Invalid resource id")
    return resource_id


def normalize_contact_messages(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [message for message in value if isinstance(message, dict)][:500]


def decode_appointment_attachments(value: Any) -> list[tuple[str, str, bytes]]:
    if value in (None, []):
        return []
    if not isinstance(value, list) or len(value) > 5:
        raise HTTPException(status_code=400, detail="Invalid appointment attachments")

    attachments: list[tuple[str, str, bytes]] = []
    total_size = 0
    for raw_attachment in value:
        if not isinstance(raw_attachment, dict):
            raise HTTPException(
                status_code=400, detail="Invalid appointment attachment"
            )

        filename = (
            " ".join(str(raw_attachment.get("label", "")).split())[:180]
            or "piece-jointe"
        )
        content_type = str(raw_attachment.get("kind", "")).strip().lower()[:120]
        data_url = str(raw_attachment.get("url", ""))
        match = re.fullmatch(r"data:([^;,]+);base64,(.+)", data_url, flags=re.DOTALL)
        if (
            not match
            or content_type not in ALLOWED_UPLOAD_TYPES
            or match.group(1).lower() != content_type
        ):
            raise HTTPException(
                status_code=400, detail="Unsupported appointment attachment"
            )

        try:
            content = base64.b64decode(match.group(2), validate=True)
        except (binascii.Error, ValueError) as exc:
            raise HTTPException(
                status_code=400, detail="Invalid appointment attachment"
            ) from exc

        if not content or len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413, detail="Appointment attachment too large"
            )
        total_size += len(content)
        if total_size > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413, detail="Appointment attachments too large"
            )

        attachments.append((filename, content_type, content))

    return attachments


def decode_uploaded_file(payload: dict[str, Any]) -> tuple[str, str, bytes]:
    filename = " ".join(str(payload.get("filename", "")).split())[:180] or "ressource"
    content_type = str(payload.get("contentType", "")).strip().lower()[:120]
    data_url = str(payload.get("dataUrl", ""))
    match = re.fullmatch(r"data:([^;,]+);base64,(.+)", data_url, flags=re.DOTALL)
    if (
        not match
        or content_type not in ALLOWED_UPLOAD_TYPES
        or match.group(1).lower() != content_type
    ):
        raise HTTPException(status_code=400, detail="Unsupported file")

    try:
        content = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid file") from exc

    if not content or len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large")
    return filename, content_type, content


def get_public_base_url(request: Request) -> str:
    if PUBLIC_BASE_URL:
        return PUBLIC_BASE_URL

    forwarded_proto = (
        request.headers.get("x-forwarded-proto", "").split(",", maxsplit=1)[0].strip()
    )
    forwarded_host = (
        request.headers.get("x-forwarded-host", "").split(",", maxsplit=1)[0].strip()
    )
    if forwarded_proto and forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}".rstrip("/")
    return str(request.base_url).rstrip("/")


def store_uploaded_file(
    connection: Any,
    *,
    filename: str,
    content_type: str,
    content: bytes,
    is_private: bool,
) -> dict[str, Any]:
    file_id = str(uuid.uuid4())
    placeholder = sql_placeholder()
    connection.execute(
        f"INSERT INTO uploaded_files (id, filename, content_type, content, is_private, created_at) "
        f"VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})",
        (file_id, filename, content_type, content, is_private, utc_now()),
    )
    return {
        "id": file_id,
        "label": filename,
        "kind": content_type,
        "local": False,
        "storage": "private-server" if is_private else "server",
        "size": len(content),
    }


def get_managed_file_id(attachment: Any) -> str:
    if (
        not isinstance(attachment, dict)
        or attachment.get("storage") != "private-server"
    ):
        return ""
    path = urlparse(str(attachment.get("url", ""))).path
    match = re.fullmatch(r"/api/files/([0-9a-fA-F-]{36})", path)
    return match.group(1) if match else ""


def send_contact_email(contact: dict[str, str]) -> None:
    if not SMTP_HOST or not SMTP_FROM_EMAIL:
        raise RuntimeError("SMTP is not configured")

    email = EmailMessage()
    email["From"] = SMTP_FROM_EMAIL
    email["To"] = CONTACT_TO_EMAIL
    email["Reply-To"] = contact["email"]
    email["Subject"] = f"[L'orthophonie au quotidien] {contact['subject']}"
    email.set_content(
        "Un message a été envoyé depuis le formulaire de contact du site.\n\n"
        f"Nom : {contact['name']}\n"
        f"Adresse e-mail : {contact['email']}\n\n"
        f"Message :\n{contact['message']}\n"
    )

    context = ssl.create_default_context()
    if SMTP_USE_SSL:
        smtp = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20, context=context)
    else:
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20)

    with smtp:
        if not SMTP_USE_SSL and SMTP_STARTTLS:
            smtp.starttls(context=context)
        if SMTP_USERNAME and SMTP_PASSWORD:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(email)


@app.get("/api/health")
def health() -> dict[str, str]:
    try:
        with get_connection() as connection:
            connection.execute("SELECT 1").fetchone()
    except Exception:
        logger.exception("Database health check failed")
        raise HTTPException(status_code=503, detail="Database unavailable") from None
    return {"status": "ok"}


@app.post("/api/contact")
async def create_contact_message(request: Request) -> dict[str, bool]:
    payload = await read_json_payload(request)

    if str(payload.get("website", "")).strip():
        return {"sent": True}

    contact = normalize_contact_payload(payload)
    enforce_rate_limit(request, "contact")
    message = {
        "id": str(uuid.uuid4()),
        **contact,
        "createdAt": utc_now(),
        "deliveryStatus": "stored",
    }

    with get_connection() as connection:
        lock_kv(connection, "contact_messages")
        messages = normalize_contact_messages(
            read_kv(connection, "contact_messages", [])
        )
        messages.insert(0, message)
        write_kv(connection, "contact_messages", messages[:500])

    sent = False
    if SMTP_HOST and SMTP_FROM_EMAIL:
        try:
            await asyncio.to_thread(send_contact_email, contact)
            sent = True
        except (OSError, RuntimeError, smtplib.SMTPException):
            logger.exception(
                "Contact email delivery failed; message kept in the admin inbox"
            )

    if sent:
        with get_connection() as connection:
            lock_kv(connection, "contact_messages")
            messages = normalize_contact_messages(
                read_kv(connection, "contact_messages", [])
            )
            for stored_message in messages:
                if stored_message.get("id") == message["id"]:
                    stored_message["deliveryStatus"] = "sent"
            write_kv(connection, "contact_messages", messages)

    return {"sent": sent, "stored": True}


@app.post("/api/auth/login")
async def login(request: Request) -> dict[str, Any]:
    enforce_rate_limit(request, "login")
    payload = await read_json_payload(request)
    username = str(payload.get("login", "")).strip()
    password = str(payload.get("password", ""))

    if not (
        hmac.compare_digest(username, ADMIN_USERNAME)
        and hmac.compare_digest(password, ADMIN_PASSWORD)
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    clear_rate_limit(request, "login")
    now = int(time.time())
    token = sign_token(
        {"sub": ADMIN_USERNAME, "iat": now, "exp": now + TOKEN_TTL_SECONDS}
    )
    return {"token": token, "expiresAt": now + TOKEN_TTL_SECONDS}


@app.get("/api/state")
def get_state(
    admin_payload: dict[str, Any] | None = Depends(get_optional_admin_payload),
) -> dict[str, Any]:
    with get_connection() as connection:
        resource_state = normalize_resource_state(
            read_kv(connection, "resource_state", DEFAULT_RESOURCE_STATE)
        )
        comments_by_resource_id = normalize_comments_map(
            read_kv(connection, "comments_by_resource_id", {})
        )
        appointment_state = normalize_appointment_state(
            read_kv(connection, "appointment_state", create_default_appointment_state())
        )
        site_content = normalize_site_content(
            read_kv(connection, "site_content", DEFAULT_SITE_CONTENT)
        )
        questionnaire_responses = normalize_questionnaire_responses_map(
            read_kv(connection, "questionnaire_responses_by_resource_id", {})
        )
        contact_messages = normalize_contact_messages(
            read_kv(connection, "contact_messages", [])
        )

    is_admin = bool(admin_payload)
    return {
        "resourceState": resource_state,
        "commentsByResourceId": comments_by_resource_id
        if is_admin
        else public_comments_map(comments_by_resource_id),
        "appointmentState": appointment_state
        if is_admin
        else public_appointment_state(appointment_state),
        "siteContent": site_content,
        "questionnaireResponsesByResourceId": questionnaire_responses
        if is_admin
        else {},
        "contactMessages": contact_messages if is_admin else [],
        "isAdmin": is_admin,
    }


@app.delete("/api/contact/{message_id}")
def delete_contact_message(
    message_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    with get_connection() as connection:
        lock_kv(connection, "contact_messages")
        messages = normalize_contact_messages(
            read_kv(connection, "contact_messages", [])
        )
        if not any(message.get("id") == message_id for message in messages):
            raise HTTPException(status_code=404, detail="Contact message not found")
        messages = [message for message in messages if message.get("id") != message_id]
        write_kv(connection, "contact_messages", messages)
    return {"messages": messages}


@app.post("/api/files")
async def upload_file(
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    filename, content_type, content = decode_uploaded_file(payload)
    with get_connection() as connection:
        file = store_uploaded_file(
            connection,
            filename=filename,
            content_type=content_type,
            content=content,
            is_private=False,
        )

    base_url = get_public_base_url(request)
    file["url"] = f"{base_url}/api/files/{file.pop('id')}"
    return {"file": file}


@app.get("/api/files/{file_id}")
def get_uploaded_file(
    file_id: str,
    admin_payload: dict[str, Any] | None = Depends(get_optional_admin_payload),
) -> Response:
    placeholder = sql_placeholder()
    with get_connection() as connection:
        row = connection.execute(
            f"SELECT filename, content_type, content, is_private FROM uploaded_files WHERE id = {placeholder}",
            (file_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    if bool(row["is_private"]) and not admin_payload:
        raise HTTPException(status_code=401, detail="Unauthorized")

    content_type = str(row["content_type"])
    disposition = (
        "inline"
        if content_type.startswith(("image/", "video/"))
        or content_type == "application/pdf"
        else "attachment"
    )
    filename = quote(str(row["filename"]))
    return Response(
        content=bytes(row["content"]),
        media_type=content_type,
        headers={"Content-Disposition": f"{disposition}; filename*=UTF-8''{filename}"},
    )


@app.delete("/api/files/{file_id}")
def delete_uploaded_file(
    file_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, bool]:
    placeholder = sql_placeholder()
    with get_connection() as connection:
        connection.execute(
            f"DELETE FROM uploaded_files WHERE id = {placeholder}", (file_id,)
        )
    return {"deleted": True}


@app.put("/api/site-content")
async def update_site_content(
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    site_content = normalize_site_content(payload.get("siteContent"))

    with get_connection() as connection:
        lock_kv(connection, "site_content")
        write_kv(connection, "site_content", site_content)

    return {"siteContent": site_content}


@app.put("/api/resource-state")
async def update_resource_state(
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    resource_state = normalize_resource_state(payload.get("resourceState"))

    with get_connection() as connection:
        lock_kv(connection, "resource_state")
        write_kv(connection, "resource_state", resource_state)

    return {"resourceState": resource_state}


@app.post("/api/comments/{resource_id}")
async def create_comment(
    resource_id: str,
    request: Request,
    admin_payload: dict[str, Any] | None = Depends(get_optional_admin_payload),
) -> dict[str, Any]:
    resource_id = validate_resource_id(resource_id)
    if not admin_payload:
        enforce_rate_limit(request, "comment")
    payload = await read_json_payload(request)
    comment = normalize_comment_payload(payload, bool(admin_payload))

    with get_connection() as connection:
        lock_kv(connection, "comments_by_resource_id")
        comments_by_resource_id = normalize_comments_map(
            read_kv(connection, "comments_by_resource_id", {})
        )
        comments = comments_by_resource_id.setdefault(resource_id, [])
        if comment["parentId"]:
            parent_exists = any(
                item.get("id") == comment["parentId"] for item in comments
            )
            if not admin_payload or not parent_exists:
                raise HTTPException(status_code=400, detail="Invalid parent comment")
        comments.insert(0, comment)
        comments_by_resource_id[resource_id] = comments[:1000]
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comment": comment}


@app.put("/api/comments/{resource_id}")
async def replace_comments(
    resource_id: str,
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    resource_id = validate_resource_id(resource_id)
    payload = await read_json_payload(request)
    comments = payload.get("comments")
    if not isinstance(comments, list):
        raise HTTPException(status_code=400, detail="Comments must be a list")

    with get_connection() as connection:
        lock_kv(connection, "comments_by_resource_id")
        comments_by_resource_id = normalize_comments_map(
            read_kv(connection, "comments_by_resource_id", {})
        )
        comments_by_resource_id[resource_id] = [
            comment for comment in comments if isinstance(comment, dict)
        ][:1000]
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comments": comments_by_resource_id[resource_id]}


@app.post("/api/comments/{resource_id}/{comment_id}/approve")
def approve_comment(
    resource_id: str,
    comment_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    resource_id = validate_resource_id(resource_id)
    with get_connection() as connection:
        lock_kv(connection, "comments_by_resource_id")
        comments_by_resource_id = normalize_comments_map(
            read_kv(connection, "comments_by_resource_id", {})
        )
        comments = comments_by_resource_id.get(resource_id, [])
        found = False
        for comment in comments:
            if comment.get("id") == comment_id:
                comment["status"] = "approved"
                found = True
        if not found:
            raise HTTPException(status_code=404, detail="Comment not found")
        comments_by_resource_id[resource_id] = comments
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comments": comments}


@app.delete("/api/comments/{resource_id}/{comment_id}")
def delete_comment(
    resource_id: str,
    comment_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    resource_id = validate_resource_id(resource_id)
    with get_connection() as connection:
        lock_kv(connection, "comments_by_resource_id")
        comments_by_resource_id = normalize_comments_map(
            read_kv(connection, "comments_by_resource_id", {})
        )
        if not any(
            comment.get("id") == comment_id
            for comment in comments_by_resource_id.get(resource_id, [])
        ):
            raise HTTPException(status_code=404, detail="Comment not found")
        comments = remove_comment_and_replies(
            comments_by_resource_id.get(resource_id, []), comment_id
        )
        comments_by_resource_id[resource_id] = comments
        write_kv(connection, "comments_by_resource_id", comments_by_resource_id)

    return {"comments": comments}


@app.post("/api/questionnaires/{resource_id}/responses")
async def create_questionnaire_response(
    resource_id: str, request: Request
) -> dict[str, Any]:
    resource_id = validate_resource_id(resource_id)
    enforce_rate_limit(request, "questionnaire")
    payload = await read_json_payload(request)
    response = normalize_questionnaire_response_payload(payload)

    with get_connection() as connection:
        lock_kv(connection, "questionnaire_responses_by_resource_id")
        responses_by_resource_id = normalize_questionnaire_responses_map(
            read_kv(connection, "questionnaire_responses_by_resource_id", {})
        )
        responses = responses_by_resource_id.setdefault(resource_id, [])
        responses.insert(0, response)
        responses_by_resource_id[resource_id] = responses[:1000]
        write_kv(
            connection,
            "questionnaire_responses_by_resource_id",
            responses_by_resource_id,
        )

    return {"response": response}


@app.delete("/api/questionnaires/{resource_id}/responses/{response_id}")
def delete_questionnaire_response(
    resource_id: str,
    response_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    resource_id = validate_resource_id(resource_id)
    with get_connection() as connection:
        lock_kv(connection, "questionnaire_responses_by_resource_id")
        responses_by_resource_id = normalize_questionnaire_responses_map(
            read_kv(connection, "questionnaire_responses_by_resource_id", {})
        )
        responses = [
            response
            for response in responses_by_resource_id.get(resource_id, [])
            if response.get("id") != response_id
        ]
        responses_by_resource_id[resource_id] = responses
        write_kv(
            connection,
            "questionnaire_responses_by_resource_id",
            responses_by_resource_id,
        )

    return {"responses": responses}


@app.delete("/api/questionnaires/{resource_id}/responses")
def delete_questionnaire_responses(
    resource_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    resource_id = validate_resource_id(resource_id)
    with get_connection() as connection:
        lock_kv(connection, "questionnaire_responses_by_resource_id")
        responses_by_resource_id = normalize_questionnaire_responses_map(
            read_kv(connection, "questionnaire_responses_by_resource_id", {})
        )
        responses_by_resource_id.pop(resource_id, None)
        write_kv(
            connection,
            "questionnaire_responses_by_resource_id",
            responses_by_resource_id,
        )

    return {"responses": []}


@app.put("/api/appointment-state")
async def update_appointment_state(
    request: Request,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, Any]:
    payload = await read_json_payload(request)
    appointment_state = normalize_appointment_state(payload.get("appointmentState"))

    with get_connection() as connection:
        lock_kv(connection, "appointment_state")
        write_kv(connection, "appointment_state", appointment_state)

    return {"appointmentState": appointment_state}


@app.post("/api/appointments/requests")
async def create_appointment_request(request: Request) -> dict[str, Any]:
    enforce_rate_limit(request, "appointment")
    payload = await read_json_payload(request)
    appointment_request = payload.get("request")

    if not isinstance(appointment_request, dict):
        raise HTTPException(status_code=400, detail="Appointment request required")

    slot_id = str(appointment_request.get("slotId", "")).strip()[:200]
    patient_name = " ".join(str(appointment_request.get("patientName", "")).split())[
        :120
    ]
    phone = " ".join(str(appointment_request.get("phone", "")).split())[:40]
    email = "".join(str(appointment_request.get("email", "")).split())[:254]

    if not slot_id or not patient_name or not (phone or email):
        raise HTTPException(status_code=400, detail="Missing appointment information")
    if email and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    decoded_attachments = decode_appointment_attachments(
        appointment_request.get("attachments")
    )
    appointment_request = {
        "id": str(uuid.uuid4()),
        "slotId": slot_id,
        "patientName": patient_name,
        "phone": phone,
        "email": email,
        "reason": str(appointment_request.get("reason", "")).strip()[:2000],
        "attachments": [],
        "status": "pending",
        "createdAt": utc_now(),
    }

    with get_connection() as connection:
        lock_kv(connection, "appointment_state")
        appointment_state = normalize_appointment_state(
            read_kv(connection, "appointment_state", create_default_appointment_state())
        )
        if not is_slot_bookable(appointment_state, slot_id):
            raise HTTPException(status_code=409, detail="Slot is not available")

        base_url = get_public_base_url(request)
        for filename, content_type, content in decoded_attachments:
            attachment = store_uploaded_file(
                connection,
                filename=filename,
                content_type=content_type,
                content=content,
                is_private=True,
            )
            attachment["url"] = f"{base_url}/api/files/{attachment.pop('id')}"
            appointment_request["attachments"].append(attachment)

        appointment_state["requests"].insert(0, appointment_request)
        write_kv(connection, "appointment_state", appointment_state)

    return {"request": appointment_request}


@app.delete("/api/appointments/requests/{request_id}")
def delete_appointment_request(
    request_id: str,
    _: dict[str, Any] = Depends(get_admin_payload),
) -> dict[str, bool]:
    placeholder = sql_placeholder()
    with get_connection() as connection:
        lock_kv(connection, "appointment_state")
        appointment_state = normalize_appointment_state(
            read_kv(connection, "appointment_state", create_default_appointment_state())
        )
        appointment_request = next(
            (
                item
                for item in appointment_state["requests"]
                if item.get("id") == request_id
            ),
            None,
        )
        if not appointment_request:
            raise HTTPException(status_code=404, detail="Appointment request not found")

        for attachment in appointment_request.get("attachments", []):
            file_id = get_managed_file_id(attachment)
            if file_id:
                connection.execute(
                    f"DELETE FROM uploaded_files WHERE id = {placeholder} AND is_private = {placeholder}",
                    (file_id, True),
                )

        appointment_state["requests"] = [
            item
            for item in appointment_state["requests"]
            if item.get("id") != request_id
        ]
        write_kv(connection, "appointment_state", appointment_state)

    return {"deleted": True}
