export interface JobOpportunity {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  experience: string;
  badges: Array<{ label: string; variant: "primary" | "success" | "warning" | "danger" | "default" }>;
  skills: string[];
  postedDate: string;
  closingDate?: string;
  isBookmarked?: boolean;
}

export interface MetricItem {
  id: string;
  value: string;
  label: string;
  description: string;
}

export interface DevelopmentStep {
  stepNumber: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  quote: string;
}
