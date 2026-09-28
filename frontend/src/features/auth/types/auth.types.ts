export interface LoginRequest { identifier:string; password:string; rememberMe:boolean; }
export interface RegisterRequest { fullName:string; employeeCode:string; companyEmail:string; department:string; password:string; confirmPassword:string; }
export type FormStatus = "idle"|"submitting"|"success"|"error";
