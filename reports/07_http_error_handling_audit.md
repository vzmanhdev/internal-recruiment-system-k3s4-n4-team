# 07 — HTTP Error Handling & Vietnamese Messages

Written for: the engineering team (backend + frontend).

## Executive summary

Errors were inconsistent (`detail` as string, dict or JSON-in-string), raw exception text was returned on 500, permission/session failures sometimes used the wrong status, and the frontend logged users out on some 401 codes but not others. A uniform error envelope, request IDs and a single 401/403 policy are now in place, keeping `detail` unchanged so existing frontend code keeps working.

## Error contract (implemented in `app/main.py`)

```json
{
  "success": false,
  "detail": "<original detail, string or {code,message}> (kept for backward compatibility)",
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Bạn không có quyền thực hiện chức năng này.",
    "details": null,
    "field_errors": [{"field": "email", "message": "Địa chỉ Email không đúng định dạng (Ví dụ: name@company.com)."}]
  },
  "request_id": "req_3f2a9c1d0b7e4a51"
}
```

`field_errors` is also returned as the legacy `{field: message}` object on 422. Every error response carries an `X-Request-ID` header.

## Status semantics

| Status | Code(s) | Used for | Status |
|---|---|---|---|
| 400 | BAD_REQUEST | invalid business input (legacy endpoints), login failure | in use |
| 401 | TOKEN_INVALID, TOKEN_EXPIRED, SESSION_REVOKED, SESSION_EXPIRED, SESSION_IDLE_EXPIRED, SECURITY_VERSION_MISMATCH, ACCOUNT_LOCKED/INACTIVE, REFRESH_TOKEN_* | authentication/session failure only | PASS |
| 403 | PERMISSION_DENIED | authenticated but not allowed / out of object scope | PASS (`test_permission_failure_is_403_not_401`) |
| 404 | NOT_FOUND | missing resource, unknown route (Vietnamese message) | PASS |
| 405 | METHOD_NOT_ALLOWED | wrong method | PASS |
| 409 | CONFLICT, DATA_CONFLICT, DUPLICATE_APPLICATION, INTERVIEW_CONFLICT, ACTIVE_CANDIDATES_IN_PIPELINE, REFRESH_IN_PROGRESS | state conflicts, duplicates, concurrent updates, `IntegrityError` | PASS (was 500 for IntegrityError) |
| 413 / 415 | — | no upload endpoint exists | n/a (F-039) |
| 422 | VALIDATION_ERROR | Pydantic + business validation (required comments, past dates, salary justification) | PASS |
| 423 | — | locked accounts currently return 400 (login) / 401 (session) | OPEN — PO/FE decide |
| 429 | RATE_LIMITED | password reset email/IP limits | PASS (no `Retry-After` header yet — OPEN) |
| 500 | INTERNAL_ERROR | unhandled exceptions — generic message, no `str(exc)` | PASS (`test_unhandled_errors_do_not_leak_exception_text`) |
| 502–504 | — | SMTP failures are recorded on the email log, not surfaced as 5xx | by design |

Remaining inconsistencies: some legacy endpoints still use 400 where 409/422 fit better (e.g. requisition "already decided" returns 400 because a team test asserts it); admin import returns `str(err)` per row (F-045); messages are Vietnamese everywhere except a few Pydantic pass-through messages ("Input should be …").

## Frontend handling (`src/lib/api-client.ts`)

| Response | Behaviour |
|---|---|
| 401 `TOKEN_EXPIRED` | one silent refresh (`credentials: "include"`), then retry once |
| any other 401 on non-auth endpoints | clear local session, go to `/login` |
| 409 on refresh (`REFRESH_IN_PROGRESS`) | wait 400 ms, retry refresh once |
| 403 | **never** logs out — error shown by the page |
| 422 | `ApiError.fieldErrors` from legacy object |
| network / timeout | 503 / 408 Vietnamese messages |

Not browser-tested in this session.
