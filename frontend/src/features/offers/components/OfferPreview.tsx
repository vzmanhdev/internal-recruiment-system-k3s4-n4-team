import { Card } from "@/components/ui/Card";
export const money = (value?: number | null) =>
  value == null ? "Chưa khai báo" : `${value.toLocaleString("vi-VN")} VNĐ`;
export const offerLabels: Record<string, string> = {
  draft: "Bản nháp",
  pending_approval: "Đang chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Không được duyệt",
  changes_requested: "Cần bổ sung",
  sent: "Đã gửi",
  accepted: "Đã chấp nhận",
  declined: "Đã từ chối",
  expired: "Hết hạn",
};
export function OfferPreview({
  offer,
}: {
  offer: {
    candidate_name?: string;
    position_title: string;
    offered_salary: number;
    start_date: string;
    work_location: string;
    probation_period_months?: number;
    expiration_date?: string | null;
    notes?: string;
  };
}) {
  return (
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
        Tuyển dụng nội bộ · Thư mời nhận việc
      </p>
      <h2 className="mt-4 text-2xl font-black text-slate-950">
        Chào mừng {offer.candidate_name || "bạn"}!
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Chúng tôi trân trọng mời bạn gia nhập đội ngũ tại vị trí{" "}
        <strong>{offer.position_title || "—"}</strong>.
      </p>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        {[
          ["Lương tháng", money(offer.offered_salary)],
          [
            "Ngày nhận việc",
            offer.start_date
              ? new Date(offer.start_date).toLocaleDateString("vi-VN")
              : "—",
          ],
          ["Nơi làm việc", offer.work_location || "—"],
          ["Thử việc", `${offer.probation_period_months ?? 2} tháng`],
          [
            "Hạn phản hồi",
            offer.expiration_date
              ? new Date(offer.expiration_date).toLocaleString("vi-VN")
              : "—",
          ],
        ].map(([name, value]) => (
          <div key={name}>
            <dt className="text-slate-500">{name}</dt>
            <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 whitespace-pre-wrap border-t border-blue-100 pt-4 text-sm leading-7 text-slate-600">
        {offer.notes ||
          "Chi tiết quyền lợi sẽ được trao đổi cùng bộ phận Nhân sự."}
      </p>
    </Card>
  );
}
