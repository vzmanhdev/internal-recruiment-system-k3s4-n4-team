import { apiRequest } from "@/lib/api-client";

export interface PublicCompanyContent {
  title: string;
  body: string;
  image?: string;
}

export function fetchPublicCompanyContent(): Promise<PublicCompanyContent> {
  return apiRequest<PublicCompanyContent>("/hr/company-content/public");
}
