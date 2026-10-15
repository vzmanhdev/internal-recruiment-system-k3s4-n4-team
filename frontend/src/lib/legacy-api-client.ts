import { apiRequest as canonicalRequest } from "./api-client";
export { ApiError } from "./api-client";
export function apiRequest<T>(path:string, init?:RequestInit):Promise<T>{return canonicalRequest<T>(`/legacy${path}`,init);}
