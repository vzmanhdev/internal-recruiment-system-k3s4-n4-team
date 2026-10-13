# 24 — File-Level Impact Analysis: Pagination and Bulk Import

**Written for:** Principal Software Architect, Engineering Leads, QA Automation Team  
**Repository:** `D:/TTCS_CODE_GYM/internal-recruiment-system-k3s4-n4-team`  
**Execution Date:** 2026-10-13  
**Status:** Audit Gate Review (Prior to Implementation)  

---

## 1. Master File-Level Impact Matrix

| Module | Current File | Current Behavior | Identified Problem | Required Change | Priority | Risk |
|---|---|---|---|---|---|---|
| **Pagination Core Utility** | `backend/app/core/pagination.py` *(New)* | Does not exist | Each router reinvents ad-hoc limit/offset logic without standardized parameters | Create standardized generic `PaginationParams`, `PaginatedResponse[T]`, and helper `paginate_query()` | P1 | Low |
| **Admin User API** | `backend/app/api/v1/admin.py` | `list_users` provides offset/limit but hardcodes `created_at desc`; lacks separate `department` filter | Cannot sort by name/email/created_at or filter directly by department (S1-08 AC3) | Add `sort_by`, `sort_order`, `department` query parameters to `list_users` with validation | P1 | Low |
| **Excel Import API (Preview)** | `backend/app/api/v1/admin.py` | Only direct `POST /users/import` exists; commits immediately to DB | Missing preview step; violates S2-01 AC2 ("Xem trước và báo lỗi từng dòng") | Add `POST /users/import/preview` and `GET /users/import/preview/{job_id}` for paginated preview and validation | P1 | Medium |
| **Excel Import API (Batch Commit)** | `backend/app/api/v1/admin.py` | Synchronous loop commits each row; does NOT create `user_roles` entries | Critical RBAC bug: users lack role records; unbounded single transaction crashes on large files | Add `POST /users/import/commit` with chunked batching (50 rows/chunk), duplicate prevention, and `replace_user_roles()` | P1 | High |
| **Excel Template Download** | `backend/app/api/v1/admin.py` | `GET /users/import/template` returns Excel with 3 sample rows | Working, but lacks explicit Department and Status columns corresponding to S1-08 / S2-01 | Enhance sample template headers with Department and role instructions | P2 | Low |
| **Admin Schemas** | `backend/app/schemas/admin.py` | Only `PaginatedUsersResponse` and CRUD schemas exist | Lacks Pydantic models for import preview requests, row-level validation results, and batch commit response | Add `ImportRowPreview`, `ImportPreviewResponse`, `ImportCommitRequest`, `ImportCommitResponse` schemas | P1 | Low |
| **Import Job Model** | `backend/app/models/import_job.py` *(New)* | Does not exist; import state is ephemeral | Cannot track large asynchronous imports, restart interrupted imports, or paginate preview server-side | Add `ImportJob` and `ImportJobRow` models for durable staged preview and progress tracking | P1 | Medium |
| **Database Migrations** | `backend/alembic/versions/f7a1b2c3d4e5_import_jobs.py` *(New)* | Only 6 migrations exist; no import tracking table | Need schema support for staged preview and job progress | Create Alembic migration for `import_jobs` and `import_job_rows` | P1 | Medium |
| **Requisition API** | `backend/app/api/v1/requisitions.py` | `list_requisitions` calls `.all()` on filtered query | Unbounded database query; returns entire table as list | Support optional pagination (`page`, `page_size`, `sort_by`, `sort_order`) while preserving backward compatibility | P2 | Low |
| **Jobs API** | `backend/app/api/v1/jobs.py` | `list_jobs` and `list_all_jobs_for_admin` call `.all()` | Unbounded database query; risk of OOM on large postings | Add optional pagination and sort parameters | P2 | Low |
| **Applications API** | `backend/app/api/v1/applications.py` | `list_applications` calls `.all()`; in-memory sort for match score | Unbounded query; cannot scale beyond small applicant pools | Add database-level pagination, total count, and sorting | P2 | Low |
| **Interviews API** | `backend/app/api/v1/interviews.py` | `list_interviews` calls `.all()` | Unbounded database query | Add optional pagination and sort parameters | P3 | Low |
| **Offers API** | `backend/app/api/v1/offer_onboarding.py` | `list_offers` calls `.all()` | Unbounded database query | Add optional pagination and sort parameters | P3 | Low |
| **Audit Logs API** | `backend/app/api/v1/admin.py` | `list_audit_logs` hardcodes `limit(100)` | No page offset, no total count metadata | Update to standard `PaginatedResponse` | P2 | Low |
| **Email Logs API** | `backend/app/api/v1/email_automation.py` | `get_email_logs` hardcodes `limit(500)` | No page offset, no total count metadata | Update to standard `PaginatedResponse` | P2 | Low |
| **Frontend Pagination Component** | `frontend/src/components/ui/Pagination.tsx` | Fixed `itemsPerPage = 20`, no page size dropdown | User cannot select 10, 20, 50, 100 items per page | Extend `PaginationProps` with `pageSize`, `onPageSizeChange`, and page-size selector | P1 | Low |
| **Frontend Admin Users Page** | `frontend/src/app/admin/users/page.tsx` | Uses `MOCK_USERS_150`; all actions in local React state | Hardcoded mock data in production; completely disconnected from backend API | Replace mock state with real API integration via `apiRequest`, debounce search, server pagination & filters | P1 | Medium |
| **Frontend Excel Import Page** | `frontend/src/app/admin/users/import/page.tsx` | Parses Excel client-side; loops sequential `fetch` calls to localhost:8000 | Inefficient, crashes on large files, increments success on catch error | Rewire to backend `POST /admin/users/import/preview` and `POST /admin/users/import/commit` | P1 | High |
| **Frontend Excel Import Modal** | `frontend/src/app/admin/users/components/ExcelImportModal.tsx` | Completely mocked with `setTimeout` and fake arrays | Misleads user; does not persist imported users | Rewire modal to real import preview and commit flow or redirect to import page | P1 | Medium |
| **Frontend Admin Users Service** | `frontend/src/services/admin-users.service.ts` *(New)* | Does not exist; ad-hoc fetches | Inconsistent API calls across user management | Create typed service encapsulating users CRUD, role management, locking, and bulk import | P1 | Low |

---

## 2. In-Depth Component Analysis & Justification

### 2.1 Backend Pagination Architecture

#### File: `backend/app/core/pagination.py`
- **Why Required**: Currently, `admin.py` manually calculates `ceil(total / page_size)`, while all other routers call `.all()`. A centralized pagination module guarantees uniform parameter parsing, SQL query wrapping, deterministic ordering, and standardized response envelopes (`items`, `total`, `page`, `page_size`, `pages`).
- **Requirement Satisfied**: Global NFR requirement for scalable server-side pagination, searching, and sorting; S1-08 AC4 ("Danh sách phân trang, mặc định 20 dòng").
- **Existing Implementation Reused**: Reuses SQLAlchemy `Query.offset()`, `Query.limit()`, and `Query.count()`. Reuses Pydantic v2 generics.
- **New API Necessary?**: No new router needed; this is a core utility consumed by existing routers.
- **Database Tables Reused**: All existing models.
- **Migration Required?**: No.
- **Tests Affected**: Existing router tests; new unit tests for `paginate_query`.
- **Breaking Risk**: Zero risk if designed with default values (`page=1, page_size=20`).

#### File: `backend/app/api/v1/admin.py` (`list_users`)
- **Why Required**: S1-08 AC3 requires: *"Tìm theo tên, email, phòng ban; lọc theo vai trò và trạng thái"*, and sorting must be flexible (e.g. by `full_name`, `email`, `created_at`).
- **Requirement Satisfied**: S1-08 AC3 & AC4.
- **Existing Implementation Reused**: Modifies existing `list_users` endpoint in place without changing its route path.
- **New API Necessary?**: No.
- **Database Tables Reused**: `users`, `user_roles`, `roles`.
- **Migration Required?**: No.
- **Tests Affected**: `backend/tests/test_session_enforcement.py`, `backend/tests/test_route_access.py`. Backward compatibility is preserved by defaulting `page=1, page_size=20`.

---

### 2.2 Scalable Excel Bulk Import Architecture

#### Files: `backend/app/models/import_job.py`, `backend/alembic/versions/...`, `backend/app/api/v1/admin.py`
- **Why Required**:
  1. **Two-Stage Workflow**: S2-01 requires a preview step with row-level error reporting before committing to the database. Without staging or job tracking, the server cannot paginate preview results for 5,000+ rows, nor can it report progress.
  2. **RBAC Persistence**: The current implementation fails to create `user_roles` records. The fix requires invoking `replace_user_roles(db, user, valid_roles)` for each imported record.
  3. **Batch Commit Performance**: To avoid locking the database for minutes or failing midway with an inconsistent state, processing must be executed in bounded chunks (e.g., 50–100 rows per transaction chunk).
- **Requirement Satisfied**: S2-01 AC1, AC2, AC3; TC-S2-01-01, TC-S2-01-02, TC-S2-01-03, TC-S2-01-X01.
- **Existing Implementation Reused**:
  - Reuses openpyxl file streaming/parsing.
  - Reuses `replace_user_roles()` and `record_audit_log()` from `admin.py`.
  - Reuses `hash_password()` and `generate_secure_random_password()` from `security.py`.
- **New API Necessary?**:
  - `POST /api/v1/admin/users/import/preview`: Accepts Excel/CSV, validates headers and rows, stores staged preview, returns validation metrics and initial preview rows.
  - `GET /api/v1/admin/users/import/preview/{job_id}`: Allows paginated inspection of the previewed rows with status filtering (`all`, `valid`, `error`).
  - `POST /api/v1/admin/users/import/commit`: Confirms import of valid rows from staged preview in bounded batches.
  - Preserves legacy `POST /api/v1/admin/users/import` as a direct batch import for CLI/backward compatibility.
- **Database Tables Reused**: `users`, `user_roles`, `roles`, `audit_logs`.
- **New Database Table**: `import_jobs` (columns: `id`, `job_id`, `filename`, `file_type`, `total_rows`, `valid_rows`, `error_rows`, `imported_rows`, `status`, `stage_data_json`, `created_at`, `created_by_id`).
- **Migration Required?**: Yes, an Alembic migration creating `import_jobs` table (SQLite and PostgreSQL compatible).
- **Tests Affected**: All admin import tests. New tests for preview, error row filtering, batch committing, and duplicate detection.

---

### 2.3 Frontend Integration & Data Table Cleanup

#### File: `frontend/src/app/admin/users/page.tsx`
- **Why Required**: The page currently renders 150 mock users from `components/mockData.ts`. It does not connect to the real database. Any created or modified users disappear on page reload.
- **Requirement Satisfied**: S1-08 AC1, AC2, AC3, AC4; System Design Mandate: *No fake production data*.
- **Existing Implementation Reused**:
  - Reuses the existing UI layout, modal components (`UserFormModal`, `RoleManagementModal`, `LockUnlockModal`).
  - Reuses design system tokens and Tailwind CSS classes.
  - Replaces internal mock state with API data fetched via `apiRequest`.
  - Replaces inline pagination controls with the shared `Pagination.tsx` component.
- **Breaking Risk**: Low. Replaces fake local state with real data while keeping existing modal interactions intact.

#### File: `frontend/src/app/admin/users/import/page.tsx`
- **Why Required**: Currently parses files via SheetJS in the browser and sends individual HTTP POST requests sequentially in a loop.
- **Requirement Satisfied**: S2-01 AC1, AC2, AC3; TC-S2-01-01, TC-S2-01-02, TC-S2-01-03, TC-S2-01-X01.
- **Existing Implementation Reused**:
  - Reuses the visual 4-step wizard interface (Download & Upload -> Preview & Validate -> Importing -> Summary).
  - Replaces browser-side loops with calls to the backend Preview and Batch Commit endpoints.
  - Adds server-side preview pagination so users can browse 1,000+ previewed rows effortlessly.
- **Breaking Risk**: Low. Significantly improves stability and performance.

#### File: `frontend/src/components/ui/Pagination.tsx`
- **Why Required**: Currently hardcodes 20 items per page without an option to switch page size.
- **Requirement Satisfied**: Global server pagination requirement (configurable page sizes: 10, 20, 50, 100).
- **Existing Implementation Reused**: Extends the existing component while preserving 100% backward compatibility with all current props.
