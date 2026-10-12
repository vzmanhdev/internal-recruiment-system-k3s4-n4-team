import { apiRequest } from "@/lib/api-client";

export interface RubricScale {
  [level: string]: string;
}

export interface CompetencyCriteria {
  id?: number;
  framework_id?: number;
  code?: string;
  name: string;
  category: string;
  weight: number; // %
  required_level: number; // 1 to 5
  description?: string;
  rubric_scale?: RubricScale;
  interview_questions?: string[];
  sort_order?: number;
}

export interface CompetencyFramework {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  job_titles: string[];
  status: "active" | "draft" | "archived";
  created_at?: string;
  updated_at?: string;
  criteria: CompetencyCriteria[];
  total_weight: number;
}

export interface CreateFrameworkInput {
  code?: string;
  name: string;
  category?: string;
  description?: string;
  job_titles: string[];
  criteria: {
    code?: string;
    name: string;
    category?: string;
    weight: number;
    required_level: number;
    description?: string;
    rubric_scale?: RubricScale;
    interview_questions?: string[];
    sort_order?: number;
  }[];
}

export interface UpdateFrameworkInput {
  code?: string;
  name?: string;
  category?: string;
  description?: string;
  job_titles?: string[];
  criteria?: {
    code?: string;
    name: string;
    category?: string;
    weight: number;
    required_level: number;
    description?: string;
    rubric_scale?: RubricScale;
    interview_questions?: string[];
    sort_order?: number;
  }[];
  status?: string;
}

export interface JobTitleItem {
  id: number;
  name: string;
}

export interface InterviewScorecardPreview {
  scorecard_id: string;
  framework_name: string;
  framework_code: string;
  target_job_title: string;
  candidate_name: string;
  evaluation_date: string;
  total_criteria: number;
  total_weight: number;
  criteria: {
    id?: number;
    code: string;
    name: string;
    category: string;
    weight: number;
    required_level: number;
    rubric_scale?: RubricScale;
    suggested_questions?: string[];
    default_score: number;
  }[];
  scoring_instruction: string;
  generated_for_sprint: string;
}

export const competencyService = {
  /**
   * Lấy danh sách khung năng lực
   */
  async getCompetencies(params?: { search?: string; job_title?: string }): Promise<CompetencyFramework[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.job_title) searchParams.set("job_title", params.job_title);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest<CompetencyFramework[]>(`/hr/competencies${query}`);
  },

  /**
   * Lấy chi tiết một khung năng lực
   */
  async getCompetency(id: number): Promise<CompetencyFramework> {
    return apiRequest<CompetencyFramework>(`/hr/competencies/${id}`);
  },

  /**
   * Khai báo khung năng lực mới (Story S2-06)
   */
  async createCompetency(data: CreateFrameworkInput): Promise<CompetencyFramework> {
    return apiRequest<CompetencyFramework>("/hr/competencies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Cập nhật khung năng lực
   */
  async updateCompetency(id: number, data: UpdateFrameworkInput): Promise<CompetencyFramework> {
    return apiRequest<CompetencyFramework>(`/hr/competencies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Xóa khung năng lực
   */
  async deleteCompetency(id: number): Promise<{ message: string; id: number }> {
    return apiRequest<{ message: string; id: number }>(`/hr/competencies/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Lấy danh mục chức danh chuẩn trong hệ thống
   */
  async getJobTitles(): Promise<JobTitleItem[]> {
    return apiRequest<JobTitleItem[]>("/hr/job-titles");
  },

  /**
   * Sinh mẫu phiếu đánh giá phỏng vấn Sprint 6 dựa trên khung năng lực (S2-06-AC04)
   */
  async getInterviewScorecard(
    id: number,
    params?: { job_title?: string; candidate_name?: string }
  ): Promise<InterviewScorecardPreview> {
    const searchParams = new URLSearchParams();
    if (params?.job_title) searchParams.set("job_title", params.job_title);
    if (params?.candidate_name) searchParams.set("candidate_name", params.candidate_name);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest<InterviewScorecardPreview>(`/hr/competencies/${id}/interview-scorecard${query}`);
  },
};
