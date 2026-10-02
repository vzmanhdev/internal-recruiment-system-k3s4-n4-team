"use client";

import * as XLSX from "xlsx";
import {
  Candidate,
  PipelineStage,
  Interview,
  OfferProposal,
  RecruiterJobPosting,
  JobRequisitionInherited,
  EmailTemplate,
  EmailLog,
  InternalNote,
  TimelineEvent,
  RecruiterMetricSummary,
} from "../types/recruiter.types";
import {
  initialCandidates,
  initialJobPostings,
  initialRequisitions,
  initialInterviews,
  initialOffers,
  initialEmailTemplates,
  initialEmailLogs,
  initialRejectReasons,
} from "../data/recruiter-mock-data";

const STORAGE_KEYS = {
  CANDIDATES: "vinatech_recruiter_candidates",
  JOBS: "vinatech_recruiter_jobs",
  REQUISITIONS: "vinatech_recruiter_requisitions",
  INTERVIEWS: "vinatech_recruiter_interviews",
  OFFERS: "vinatech_recruiter_offers",
  EMAIL_TEMPLATES: "vinatech_recruiter_email_templates",
  EMAIL_LOGS: "vinatech_recruiter_email_logs",
};

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

class RecruiterService {
  // CANDIDATES
  getCandidates(): Candidate[] {
    return getStorage<Candidate[]>(STORAGE_KEYS.CANDIDATES, initialCandidates);
  }

  saveCandidates(candidates: Candidate[]): void {
    setStorage(STORAGE_KEYS.CANDIDATES, candidates);
  }

  getCandidateById(id: string): Candidate | undefined {
    return this.getCandidates().find((c) => c.id === id);
  }

  updateCandidateStage(id: string, newStage: PipelineStage, actor = "Phong (Recruiter)"): Candidate | null {
    const candidates = this.getCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return null;

    const oldStage = candidate.stage;
    candidate.stage = newStage;
    candidate.slaDaysInCurrentStage = 0;
    candidate.slaOverdue = false;

    const stageLabels: Record<PipelineStage, string> = {
      new_applied: "Hồ sơ mới",
      screening: "Sàng lọc",
      interviewing: "Phỏng vấn",
      offer_proposed: "Đề xuất Offer",
      hired: "Nhận việc",
      rejected: "Đã loại",
    };

    const newEvent: TimelineEvent = {
      id: `TL-${Date.now()}`,
      type: newStage === "rejected" ? "rejected" : "stage_changed",
      title: `Chuyển giai đoạn: ${stageLabels[newStage]}`,
      description: `Đã chuyển từ '${stageLabels[oldStage]}' sang '${stageLabels[newStage]}'.`,
      actor,
      timestamp: new Date().toLocaleString("vi-VN"),
    };

    candidate.timeline.unshift(newEvent);
    this.saveCandidates(candidates);
    return candidate;
  }

  rejectCandidate(id: string, reason: string, note?: string, actor = "Phong (Recruiter)"): Candidate | null {
    const candidates = this.getCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return null;

    candidate.stage = "rejected";
    candidate.rejectReason = reason;
    candidate.rejectNote = note;

    const newEvent: TimelineEvent = {
      id: `TL-${Date.now()}`,
      type: "rejected",
      title: "Loại hồ sơ ứng viên",
      description: `Lý do: ${reason}${note ? ` (${note})` : ""}`,
      actor,
      timestamp: new Date().toLocaleString("vi-VN"),
    };

    candidate.timeline.unshift(newEvent);
    this.saveCandidates(candidates);
    return candidate;
  }

  updateCandidateRating(id: string, rating: number): void {
    const candidates = this.getCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (candidate) {
      candidate.rating = rating;
      this.saveCandidates(candidates);
    }
  }

  addCandidateNote(id: string, noteContent: string, authorName = "Phong (Recruiter)"): InternalNote | null {
    const candidates = this.getCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) return null;

    const newNote: InternalNote = {
      id: `NOTE-${Date.now()}`,
      authorName,
      authorRole: "Nhân viên tuyển dụng",
      content: noteContent,
      createdAt: new Date().toLocaleString("vi-VN"),
    };

    candidate.notes.unshift(newNote);

    candidate.timeline.unshift({
      id: `TL-NOTE-${Date.now()}`,
      type: "note_added",
      title: "Thêm ghi chú nội bộ",
      description: noteContent.slice(0, 80) + (noteContent.length > 80 ? "..." : ""),
      actor: authorName,
      timestamp: new Date().toLocaleString("vi-VN"),
    });

    this.saveCandidates(candidates);
    return newNote;
  }

  addCandidateTags(id: string, tag: string): void {
    const candidates = this.getCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (candidate && !candidate.tags.includes(tag)) {
      candidate.tags.push(tag);
      this.saveCandidates(candidates);
    }
  }

  removeCandidateTag(id: string, tag: string): void {
    const candidates = this.getCandidates();
    const candidate = candidates.find((c) => c.id === id);
    if (candidate) {
      candidate.tags = candidate.tags.filter((t) => t !== tag);
      this.saveCandidates(candidates);
    }
  }

  checkDuplicateCandidate(email: string, phone: string, excludeId?: string): Candidate | null {
    const candidates = this.getCandidates();
    const cleanPhone = phone.replace(/[\s.-]/g, "");
    return (
      candidates.find((c) => {
        if (excludeId && c.id === excludeId) return false;
        const cPhone = c.phone.replace(/[\s.-]/g, "");
        return (
          c.email.trim().toLowerCase() === email.trim().toLowerCase() ||
          (cleanPhone && cPhone && cleanPhone === cPhone)
        );
      }) ?? null
    );
  }

  addManualCandidate(data: Omit<Candidate, "id" | "timeline" | "notes" | "pastApplications">): Candidate {
    const candidates = this.getCandidates();
    const newCandidate: Candidate = {
      ...data,
      id: `CAN-${Date.now().toString().slice(-4)}`,
      notes: [],
      pastApplications: [],
      timeline: [
        {
          id: `TL-MANUAL-${Date.now()}`,
          type: "applied",
          title: "Thêm hồ sơ thủ công vào hệ thống",
          description: `Được tạo bởi Recruiter từ nguồn ${data.source}.`,
          actor: "Phong (Recruiter)",
          timestamp: new Date().toLocaleString("vi-VN"),
        },
      ],
    };

    candidates.unshift(newCandidate);
    this.saveCandidates(candidates);
    return newCandidate;
  }

  mergeCandidates(primaryId: string, secondaryId: string): Candidate | null {
    const candidates = this.getCandidates();
    const primary = candidates.find((c) => c.id === primaryId);
    const secondary = candidates.find((c) => c.id === secondaryId);
    if (!primary || !secondary) return null;

    // Gộp kỹ năng & tags không trùng
    primary.skills = Array.from(new Set([...primary.skills, ...secondary.skills]));
    primary.tags = Array.from(new Set([...primary.tags, ...secondary.tags, "Đã gộp hồ sơ"]));

    // Gộp ghi chú & timeline
    primary.notes = [...primary.notes, ...secondary.notes];
    primary.timeline = [
      ...primary.timeline,
      {
        id: `TL-MERGE-${Date.now()}`,
        type: "stage_changed",
        title: `Gộp hồ sơ trùng lặp với #${secondary.id}`,
        description: `Gộp hồ sơ từ vị trí '${secondary.jobTitle}' (Nộp ngày ${secondary.appliedDate}).`,
        actor: "Phong (Recruiter)",
        timestamp: new Date().toLocaleString("vi-VN"),
      },
      ...secondary.timeline,
    ];

    // Thêm vị trí của hồ sơ cũ vào lịch sử ứng tuyển
    primary.pastApplications.push({
      id: `PA-${secondary.id}`,
      jobTitle: secondary.jobTitle,
      department: secondary.department,
      appliedDate: secondary.appliedDate,
      finalStage: secondary.stage,
      outcome: secondary.stage === "hired" ? "hired" : "active",
    });

    // Xóa hồ sơ phụ
    const updatedCandidates = candidates.filter((c) => c.id !== secondaryId);
    this.saveCandidates(updatedCandidates);
    return primary;
  }

  // EXPORT TO EXCEL (S6-01)
  exportCandidatesToExcel(candidatesToExport: Candidate[], filenamePrefix = "Danh_sach_ung_vien"): void {
    const stageMap: Record<PipelineStage, string> = {
      new_applied: "Hồ sơ mới",
      screening: "Sàng lọc",
      interviewing: "Phỏng vấn",
      offer_proposed: "Đề xuất Offer",
      hired: "Nhận việc",
      rejected: "Đã loại",
    };

    const rows = candidatesToExport.map((c, index) => ({
      "STT": index + 1,
      "Mã ứng viên": c.id,
      "Họ và tên": c.fullName,
      "Email": c.email,
      "Số điện thoại": c.phone,
      "Vị trí ứng tuyển": c.jobTitle,
      "Phòng ban": c.department,
      "Giai đoạn": stageMap[c.stage] || c.stage,
      "Nguồn": c.source,
      "Số năm KN": c.experienceYears,
      "Đánh giá sao": `${c.rating}/5`,
      "Điểm sàng lọc": `${c.matchScore}%`,
      "Ngày nộp": c.appliedDate,
      "Lý do loại (nếu có)": c.rejectReason || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ứng viên");

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(workbook, `${filenamePrefix}_${todayStr}.xlsx`);
  }

  // INTERVIEWS (S6-02, S6-04, S6-06)
  getInterviews(): Interview[] {
    return getStorage<Interview[]>(STORAGE_KEYS.INTERVIEWS, initialInterviews);
  }

  saveInterviews(interviews: Interview[]): void {
    setStorage(STORAGE_KEYS.INTERVIEWS, interviews);
  }

  checkInterviewConflict(
    scheduledAt: string,
    durationMinutes: number,
    interviewers: string[],
    locationOrLink: string,
    excludeId?: string
  ): { hasConflict: boolean; reason?: string } {
    const interviews = this.getInterviews();
    const newStart = new Date(scheduledAt).getTime();
    const newEnd = newStart + durationMinutes * 60 * 1000;

    for (const item of interviews) {
      if (excludeId && item.id === excludeId) continue;
      if (item.status === "cancelled") continue;

      const itemStart = new Date(item.scheduledAt).getTime();
      const itemEnd = itemStart + item.durationMinutes * 60 * 1000;

      // Kiểm tra trùng khung giờ
      const isOverlap = newStart < itemEnd && newEnd > itemStart;
      if (isOverlap) {
        // Trùng người phỏng vấn
        const commonInterviewers = item.interviewers.filter((i) => interviewers.includes(i));
        if (commonInterviewers.length > 0) {
          return {
            hasConflict: true,
            reason: `Phỏng vấn viên '${commonInterviewers.join(", ")}' đã có lịch phỏng vấn khác cho ứng viên '${item.candidateName}' vào lúc ${new Date(item.scheduledAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}!`,
          };
        }
        // Trùng phòng họp trực tiếp
        if (
          locationOrLink.toLowerCase().includes("phòng") &&
          item.locationOrLink.toLowerCase().includes("phòng") &&
          locationOrLink.trim().toLowerCase() === item.locationOrLink.trim().toLowerCase()
        ) {
          return {
            hasConflict: true,
            reason: `Phòng họp '${locationOrLink}' đang bận buổi phỏng vấn khác vào khung giờ này!`,
          };
        }
      }
    }

    return { hasConflict: false };
  }

  scheduleInterview(
    candidateId: string,
    round: Interview["round"],
    scheduledAt: string,
    durationMinutes: number,
    format: "online" | "in_person",
    locationOrLink: string,
    interviewers: string[],
    notes?: string
  ): Interview {
    const interviews = this.getInterviews();
    const candidate = this.getCandidateById(candidateId);

    const newInterview: Interview = {
      id: `INT-${Date.now().toString().slice(-4)}`,
      candidateId,
      candidateName: candidate?.fullName ?? "Ứng viên",
      jobTitle: candidate?.jobTitle ?? "Vị trí tuyển dụng",
      round,
      scheduledAt,
      durationMinutes,
      format,
      locationOrLink,
      interviewers,
      status: "scheduled",
      notes,
    };

    interviews.unshift(newInterview);
    this.saveInterviews(interviews);

    // Cập nhật timeline ứng viên & chuyển sang giai đoạn phỏng vấn nếu đang ở screening
    if (candidate) {
      if (candidate.stage === "new_applied" || candidate.stage === "screening") {
        this.updateCandidateStage(candidateId, "interviewing");
      } else {
        const candidates = this.getCandidates();
        const cand = candidates.find((c) => c.id === candidateId);
        if (cand) {
          cand.timeline.unshift({
            id: `TL-INT-${Date.now()}`,
            type: "interview_scheduled",
            title: `Đặt lịch ${round}`,
            description: `Thời gian: ${new Date(scheduledAt).toLocaleString("vi-VN")} · Hình thức: ${format === "online" ? "Trực tuyến" : "Trực tiếp"}`,
            actor: "Phong (Recruiter)",
            timestamp: new Date().toLocaleString("vi-VN"),
          });
          this.saveCandidates(candidates);
        }
      }
    }

    return newInterview;
  }

  cancelInterview(interviewId: string, reason: string): boolean {
    const interviews = this.getInterviews();
    const interview = interviews.find((i) => i.id === interviewId);
    if (!interview) return false;

    interview.status = "cancelled";
    interview.cancelReason = reason;
    this.saveInterviews(interviews);
    return true;
  }

  // OFFERS (S7-04, S7-07)
  getOffers(): OfferProposal[] {
    return getStorage<OfferProposal[]>(STORAGE_KEYS.OFFERS, initialOffers);
  }

  saveOffers(offers: OfferProposal[]): void {
    setStorage(STORAGE_KEYS.OFFERS, offers);
  }

  createOffer(data: Omit<OfferProposal, "id" | "createdAt" | "updatedAt">): OfferProposal {
    const offers = this.getOffers();
    const newOffer: OfferProposal = {
      ...data,
      id: `OFF-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      updatedAt: new Date().toLocaleDateString("vi-VN"),
    };

    offers.unshift(newOffer);
    this.saveOffers(offers);

    // Cập nhật candidate stage -> offer_proposed
    this.updateCandidateStage(data.candidateId, "offer_proposed");

    return newOffer;
  }

  updateOfferStatus(offerId: string, status: OfferProposal["status"], rejectReason?: string): void {
    const offers = this.getOffers();
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;

    offer.status = status;
    if (rejectReason) offer.rejectReason = rejectReason;
    offer.updatedAt = new Date().toLocaleDateString("vi-VN");
    this.saveOffers(offers);

    // Nếu ứng viên đồng ý -> chuyển sang hired
    if (status === "accepted") {
      this.updateCandidateStage(offer.candidateId, "hired");
    }
  }

  // JOB REQUISITIONS & POSTINGS (S3-09, S4-08)
  getRequisitions(): JobRequisitionInherited[] {
    return getStorage<JobRequisitionInherited[]>(STORAGE_KEYS.REQUISITIONS, initialRequisitions);
  }

  getJobPostings(): RecruiterJobPosting[] {
    return getStorage<RecruiterJobPosting[]>(STORAGE_KEYS.JOBS, initialJobPostings);
  }

  saveJobPostings(jobs: RecruiterJobPosting[]): void {
    setStorage(STORAGE_KEYS.JOBS, jobs);
  }

  createJobPostingFromRequisition(
    requisitionId: string,
    data: Omit<RecruiterJobPosting, "id" | "requisitionId" | "totalApplicants" | "updatedAt">
  ): RecruiterJobPosting {
    const postings = this.getJobPostings();
    const newPosting: RecruiterJobPosting = {
      ...data,
      id: `JOB-${Date.now().toString().slice(-4)}`,
      requisitionId,
      totalApplicants: 0,
      updatedAt: new Date().toLocaleDateString("vi-VN"),
    };

    postings.unshift(newPosting);
    this.saveJobPostings(postings);
    return newPosting;
  }

  toggleJobPostingStatus(jobId: string): RecruiterJobPosting | null {
    const postings = this.getJobPostings();
    const job = postings.find((j) => j.id === jobId);
    if (!job) return null;

    job.status = job.status === "published" ? "closed" : "published";
    job.updatedAt = new Date().toLocaleDateString("vi-VN");
    this.saveJobPostings(postings);
    return job;
  }

  // EMAIL TEMPLATES & LOGS (S7-09, S8-02)
  getEmailTemplates(): EmailTemplate[] {
    return getStorage<EmailTemplate[]>(STORAGE_KEYS.EMAIL_TEMPLATES, initialEmailTemplates);
  }

  getEmailLogs(): EmailLog[] {
    return getStorage<EmailLog[]>(STORAGE_KEYS.EMAIL_LOGS, initialEmailLogs);
  }

  sendBulkEmail(
    candidateIds: string[],
    templateId: string,
    customSubject?: string,
    customContent?: string
  ): number {
    const templates = this.getEmailTemplates();
    const template = templates.find((t) => t.id === templateId);
    const candidates = this.getCandidates().filter((c) => candidateIds.includes(c.id));
    const logs = this.getEmailLogs();

    let sentCount = 0;
    for (const c of candidates) {
      const subject = customSubject || template?.subject || "Thông báo từ VinaTech";
      const replacedSubject = subject.replace(/{{job_title}}/g, c.jobTitle).replace(/{{candidate_name}}/g, c.fullName);

      logs.unshift({
        id: `LOG-${Date.now()}-${sentCount}`,
        candidateId: c.id,
        candidateName: c.fullName,
        candidateEmail: c.email,
        templateName: template?.name || "Thư tùy chỉnh",
        subject: replacedSubject,
        sentAt: new Date().toLocaleString("vi-VN"),
        status: "success",
      });
      sentCount++;
    }

    setStorage(STORAGE_KEYS.EMAIL_LOGS, logs);
    return sentCount;
  }

  // METRICS SUMMARY FOR DASHBOARD
  getMetricsSummary(): RecruiterMetricSummary {
    const candidates = this.getCandidates();
    const jobs = this.getJobPostings();
    const interviews = this.getInterviews();
    const offers = this.getOffers();

    const todayStr = new Date().toISOString().slice(0, 10);
    const interviewsToday = interviews.filter(
      (i) => i.status === "scheduled" && i.scheduledAt.startsWith(todayStr)
    ).length;

    return {
      activeJobsCount: jobs.filter((j) => j.status === "published" || j.status === "closing_soon").length,
      totalCandidatesCount: candidates.length,
      newAppliedCount: candidates.filter((c) => c.stage === "new_applied").length,
      interviewsTodayCount: interviewsToday,
      offersPendingCount: offers.filter((o) => o.status === "pending_approval" || o.status === "sent_to_candidate").length,
      slaOverdueCount: candidates.filter((c) => c.slaOverdue).length,
    };
  }

  getRejectReasons(): string[] {
    return initialRejectReasons;
  }
}

export const recruiterService = new RecruiterService();
