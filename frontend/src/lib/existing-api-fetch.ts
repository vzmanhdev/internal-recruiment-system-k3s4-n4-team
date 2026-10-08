const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const contracts = new Set(["requisitions", "jobs", "applications", "interviews", "offers", "referrals", "analytics"]);
export function existingApiFetch(input: string, init: RequestInit = {}) {
  const path = input.replace(/^https?:\/\/[^/]+\/api\/v1\//, "").replace(/^\/api\/v1\//, "");
  const headers = new Headers(init.headers);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const prefix = contracts.has(path.split(/[/?]/)[0]) ? "legacy/" : "";
  return fetch(`${base.replace(/\/$/, "")}/${prefix}${path}`, { ...init, headers });
}
