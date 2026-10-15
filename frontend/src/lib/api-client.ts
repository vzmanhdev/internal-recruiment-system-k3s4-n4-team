export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
    /** Machine-readable code from the backend envelope (error.code), e.g. "HR_WORKSPACE_ACCESS_DENIED". */
    public code?: string,
    public requestId?: string | null,
  ) {
    super(message);
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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

/** Window events the AuthProvider listens to (permission re-sync without logging out). */
export const AUTH_FORBIDDEN_EVENT = "auth:forbidden";

interface CustomRequestInit extends RequestInit {
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

function endLocalSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_info");
  if (!window.location.pathname.startsWith("/login")) {
    const next = window.location.pathname + window.location.search;
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }
}

async function performTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // The refresh token lives only in an HttpOnly cookie; it must be sent cross-origin.
      const callRefresh = () => fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      let response = await callRefresh();
      if (response.status === 409) {
        // Another tab is rotating the same session right now: wait briefly and retry once.
        await new Promise((resolve) => setTimeout(resolve, 400));
        response = await callRefresh();
      }
      if (!response.ok) throw new Error("Refresh token expired");
      const data = await response.json();
      if (data.access_token) {
        if (typeof window !== "undefined") localStorage.setItem("access_token", data.access_token);
        return data.access_token as string;
      }
      return null;
    } catch {
      endLocalSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, init?: CustomRequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // 15 seconds timeout to prevent request hanging when Backend is offline
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = HTTP_STATUS_MESSAGES_VI[response.status] || "Không thể kết nối đến hệ thống.";
      let fieldErrors: Record<string, string> | undefined = undefined;
      let errorCode: string | undefined = undefined;
      const requestId = response.headers.get("X-Request-ID");

      try {
        const errorData = await response.json();
        if (errorData.error && typeof errorData.error === "object") {
          errorCode = errorData.error.code;
          if (errorData.error.message) errorDetail = errorData.error.message;
          if (errorData.error.field_errors) fieldErrors = errorData.error.field_errors;
        }
        if (errorData.detail) {
          if (typeof errorData.detail === "object") {
            errorDetail = errorData.detail.message || errorDetail;
            errorCode = errorData.detail.code || errorCode;
          } else {
            errorDetail = errorData.detail;
          }
        }
        if (errorData.field_errors) fieldErrors = errorData.field_errors;
      } catch {
        errorDetail = HTTP_STATUS_MESSAGES_VI[response.status] ?? errorDetail;
      }

      // 401 = authentication/session failure. An expired access token is refreshed once;
      // any other 401 (revoked, idle, locked, security version changed) ends the local session.
      // 403 (permission denied) NEVER logs the user out: it asks the AuthProvider to re-sync permissions.
      const isAuthEndpoint = path.startsWith("/auth/login") || path.startsWith("/auth/refresh") || path.startsWith("/auth/password-reset");
      if (response.status === 401 && !isAuthEndpoint) {
        if (!init?._retry && errorCode === "TOKEN_EXPIRED") {
          const newToken = await performTokenRefresh();
          if (newToken) return apiRequest<T>(path, { ...init, _retry: true });
        } else {
          endLocalSession();
        }
      }
      if (response.status === 403 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_FORBIDDEN_EVENT, { detail: { path, code: errorCode } }));
      }

      throw new ApiError(response.status, errorDetail, fieldErrors, errorCode, requestId);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new ApiError(408, HTTP_STATUS_MESSAGES_VI[408]);
    throw new ApiError(503, "Không thể kết nối tới máy chủ. Vui lòng kiểm tra dịch vụ Backend và thử lại.");
  }
}
