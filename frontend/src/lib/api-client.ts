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

export const HTTP_STATUS_MESSAGES_VI: Record<number, string> = {
  400: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin đã gửi.",
  401: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện chức năng này.",
  404: "Không tìm thấy dữ liệu được yêu cầu hoặc dữ liệu không còn tồn tại.",
  405: "Phương thức truy cập này không được hỗ trợ cho chức năng hiện tại.",
  408: "Yêu cầu xử lý quá thời gian cho phép. Vui lòng thử lại.",
  409: "Không thể thực hiện thao tác do dữ liệu hoặc trạng thái hiện tại không phù hợp.",
  410: "Dữ liệu hoặc liên kết này đã hết hiệu lực.",
  412: "Không thể thực hiện vì một số điều kiện bắt buộc chưa được đáp ứng.",
  413: "Tệp tải lên vượt quá dung lượng cho phép.",
  415: "Định dạng dữ liệu hoặc tệp tải lên không được hỗ trợ.",
  422: "Một số thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường được đánh dấu.",
  423: "Tài khoản hoặc dữ liệu hiện đang bị khóa và không thể thao tác.",
  429: "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.",
  500: "Hệ thống đang gặp sự cố trong quá trình xử lý. Vui lòng thử lại sau.",
  501: "Chức năng này hiện chưa được hệ thống hỗ trợ.",
  502: "Không thể kết nối tới dịch vụ xử lý. Vui lòng thử lại sau.",
  503: "Hệ thống đang tạm thời không khả dụng. Vui lòng thử lại sau.",
  504: "Dịch vụ xử lý phản hồi quá chậm. Vui lòng thử lại sau.",
};

interface CustomRequestInit extends RequestInit {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Refresh token expired");
      }

      const data = await response.json();
      if (data.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", data.access_token);
        }
        return data.access_token as string;
      }
      return null;
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_info");
        window.location.href = "/login";
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, init?: CustomRequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 15 seconds timeout to prevent request hanging when Backend is offline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = HTTP_STATUS_MESSAGES_VI[response.status] || "Không thể kết nối đến hệ thống.";
      let fieldErrors: Record<string, string> | undefined = undefined;
      let errorCode: string | undefined = undefined;

      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (typeof errorData.detail === "object") {
            errorDetail = errorData.detail.message || JSON.stringify(errorData.detail);
            errorCode = errorData.detail.code;
          } else {
            errorDetail = errorData.detail;
          }
        }
        if (errorData.field_errors) {
          fieldErrors = errorData.field_errors;
        }
      } catch (e) {
        errorDetail = HTTP_STATUS_MESSAGES_VI[response.status] ?? errorDetail;
      }

      // Handle 401 Unauthorized (Expired or Revoked Token)
      if (response.status === 401 && !init?._retry && path !== "/auth/login" && path !== "/auth/refresh") {
        if (errorCode === "TOKEN_EXPIRED" || errorDetail.includes("hết hạn")) {
          const newToken = await performTokenRefresh();
          if (newToken) {
            return apiRequest<T>(path, { ...init, _retry: true });
          }
        } else if (["SESSION_REVOKED", "SESSION_EXPIRED", "ACCOUNT_INACTIVE", "REFRESH_TOKEN_REUSED"].includes(errorCode || "")) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_info");
            window.location.href = "/login";
          }
        }
      }

      // Handle 423 Account Locked
      if (response.status === 423) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_info");
          window.location.href = "/login";
        }
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
      throw new ApiError(408, HTTP_STATUS_MESSAGES_VI[408]);
    }

    throw new ApiError(503, "Không thể kết nối tới máy chủ Backend (http://localhost:8000). Vui lòng bật dịch vụ Backend trước khi Đăng nhập.");
  }
}


