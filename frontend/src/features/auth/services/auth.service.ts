import type { LoginRequest, RegisterRequest } from "../types/auth.types";

// TODO: Thay mô phỏng bằng apiRequest khi Backend công bố auth routes và contract chính thức.
async function simulateSubmit(): Promise<void> { await new Promise(resolve=>setTimeout(resolve,700)); }
export const authService: {
  login(payload: LoginRequest): Promise<void>;
  register(payload: RegisterRequest): Promise<void>;
} = { login:()=>simulateSubmit(), register:()=>simulateSubmit() };
