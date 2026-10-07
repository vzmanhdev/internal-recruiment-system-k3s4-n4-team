export class ApiError extends Error {
  constructor(
    public status: number, 
    message: string, 
    public fieldErrors?: Record<string, string>
  ) { 
    super(message); 
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 5 seconds timeout to prevent request hanging when Backend is offline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = "Không thể kết nối đến hệ thống.";
      let fieldErrors: Record<string, string> | undefined = undefined;

      try {
        const errorData = await response.json();
        // Support standardized JSON contract: {"success": false, "error": {"code": "...", "message": "..."}}
        if (errorData?.error?.message) {
          errorDetail = errorData.error.message;
        } else if (errorData?.detail) {
          errorDetail = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }

        if (errorData?.error?.details && typeof errorData.error.details === "object") {
          fieldErrors = errorData.error.details;
        } else if (errorData?.field_errors) {
          fieldErrors = errorData.field_errors;
        }
      } catch (e) {
        const defaultMessages: Record<number, string> = {
          400: "Dữ liệu chưa hợp lệ hoặc bị trùng lặp.",
          401: "Vui lòng đăng nhập lại.",
          403: "Bạn không có quyền thực hiện thao tác này.",
          404: "Không tìm thấy dữ liệu.",
          422: "Thông tin nhập vào chưa đúng định dạng.",
          500: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."
        };
        errorDetail = defaultMessages[response.status] ?? errorDetail;
      }

      throw new ApiError(response.status, errorDetail, fieldErrors);
    }

    return await response.json() as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === "AbortError") {
      throw new ApiError(0, "Kết nối bị quá thời gian (Timeout). Vui lòng đảm bảo dịch vụ Backend (http://localhost:8000) đã được bật.");
    }

    throw new ApiError(0, "Không thể kết nối tới máy chủ Backend (http://localhost:8000). Vui lòng bật dịch vụ Backend trước khi Đăng nhập.");
  }
}
