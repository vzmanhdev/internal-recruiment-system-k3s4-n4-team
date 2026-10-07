import { CompetencyFramework, InterviewQuestion } from "@/components/CompetencyManagementView";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const competencyService = {
  // 1. GET ALL FRAMEWORKS
  async getFrameworks(): Promise<CompetencyFramework[]> {
    const res = await fetch(`${API_BASE_URL}/competencies/frameworks`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể lấy danh sách khung năng lực từ CSDL.");
    }
    return res.json();
  },

  // 2. CREATE FRAMEWORK
  async createFramework(data: Partial<CompetencyFramework>): Promise<CompetencyFramework> {
    const res = await fetch(`${API_BASE_URL}/competencies/frameworks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể tạo mới khung năng lực.");
    }
    return res.json();
  },

  // 3. UPDATE FRAMEWORK
  async updateFramework(id: string, data: Partial<CompetencyFramework>): Promise<CompetencyFramework> {
    const res = await fetch(`${API_BASE_URL}/competencies/frameworks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể cập nhật khung năng lực.");
    }
    return res.json();
  },

  // 4. DELETE FRAMEWORK
  async deleteFramework(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/competencies/frameworks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể xóa khung năng lực.");
    }
  },

  // 5. GET ALL QUESTIONS
  async getQuestions(): Promise<InterviewQuestion[]> {
    const res = await fetch(`${API_BASE_URL}/competencies/questions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể lấy danh sách câu hỏi từ CSDL.");
    }
    return res.json();
  },

  // 6. CREATE QUESTION
  async createQuestion(data: Partial<InterviewQuestion>): Promise<InterviewQuestion> {
    const res = await fetch(`${API_BASE_URL}/competencies/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể tạo mới câu hỏi phỏng vấn.");
    }
    return res.json();
  },

  // 7. UPDATE QUESTION
  async updateQuestion(id: string, data: Partial<InterviewQuestion>): Promise<InterviewQuestion> {
    const res = await fetch(`${API_BASE_URL}/competencies/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể cập nhật câu hỏi phỏng vấn.");
    }
    return res.json();
  },

  // 8. DELETE QUESTION
  async deleteQuestion(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/competencies/questions/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Không thể xóa câu hỏi phỏng vấn.");
    }
  },
};
