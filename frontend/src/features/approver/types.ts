export interface ApprovalTimelineItem {
  id: string | number;
  step_name: string;
  approver_name: string;
  approver_role: string;
  approver_email?: string;
  action: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'renegotiate';
  comment?: string;
  created_at: string;
  avatar_url?: string;
}

export interface RequisitionApprovalItem {
  id: number;
  code: string;
  title: string;
  department: string;
  quantity: number;
  reason: 'expansion' | 'replacement' | 'seasonal' | string;
  reason_detail?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  employment_type: string;
  work_location: string;
  salary_range: string;
  min_salary?: number;
  max_salary?: number;
  target_onboard_date?: string;
  job_description?: string;
  requirements?: string;
  benefits?: string;
  created_by: string;
  created_by_role?: string;
  created_at: string;
  status: 'pending_manager' | 'pending_hr' | 'pending_board' | 'approved' | 'rejected' | 'changes_requested';
  current_approval_step: 'manager' | 'hr' | 'board' | 'completed';
  timeline: ApprovalTimelineItem[];
}

export interface OfferApprovalItem {
  id: number;
  code: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  job_title: string;
  department: string;
  offered_salary: number; // VND
  standard_salary_min: number; // VND
  standard_salary_max: number; // VND
  is_over_budget: boolean;
  over_percentage: number; // e.g. 15 (%)
  probation_salary_percentage: number; // e.g. 85 (%)
  probation_duration_months: number; // e.g. 2
  start_date: string;
  work_location: string;
  notes?: string;
  created_by: string;
  created_by_role?: string;
  created_at: string;
  status: 'pending' | 'sent' | 'accepted' | 'declined' | 'rejected' | 'changes_requested';
  timeline: ApprovalTimelineItem[];
}
