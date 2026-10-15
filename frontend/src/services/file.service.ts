import { ApiError, HTTP_STATUS_MESSAGES_VI } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface UploadedFile {
  id: string;
  kind: "cv" | "avatar";
  original_name: string;
  content_type: string;
  size_bytes: number;
  url: string;
  parsed?: { status: "parsed" | "failed"; full_name?: string | null; email?: string | null; phone?: string | null };
}

/** Multipart upload (type and size are validated by the server from the file bytes). */
export async function uploadFile(kind: "cv" | "avatar", file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", file);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: "POST",
    body: form,
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let message = HTTP_STATUS_MESSAGES_VI[res.status] || "Tải tệp thất bại.";
    try {
      const data = await res.json();
      message = data?.error?.message || (typeof data?.detail === "string" ? data.detail : data?.detail?.message) || message;
    } catch {
      /* keep default message */
    }
    throw new ApiError(res.status, message);
  }
  return res.json();
}

export const fileUrl = (path: string) => (path.startsWith("/api/") ? API_BASE_URL.replace(/\/api\/v1$/, "") + path : path);

/** Open a protected file (CV) in a new tab: fetched with the user's token, never exposed as a public URL. */
export async function openProtectedFile(path: string): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const res = await fetch(fileUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, "Không mở được tệp hoặc bạn không có quyền xem.");
  const url = URL.createObjectURL(await res.blob());
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
