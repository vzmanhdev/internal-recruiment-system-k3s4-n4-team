export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new ApiError(0, "Dịch vụ chưa được cấu hình.");
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { "Content-Type":"application/json", ...init?.headers }, credentials:"include" });
  if (!response.ok) {
    const messages: Record<number,string> = {400:"Dữ liệu chưa hợp lệ.",401:"Vui lòng đăng nhập.",403:"Bạn không có quyền thực hiện thao tác này.",404:"Không tìm thấy dữ liệu.",422:"Vui lòng kiểm tra lại thông tin.",500:"Hệ thống đang gặp sự cố."};
    throw new ApiError(response.status, messages[response.status] ?? "Không thể kết nối đến hệ thống.");
  }
  return response.json() as Promise<T>;
}
