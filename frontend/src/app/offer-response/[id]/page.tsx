"use client";
import { use, useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import {
  OfferItem,
  respondToOffer,
} from "@/features/offers/services/offer.service";
import {
  OfferPreview,
  offerLabels,
} from "@/features/offers/components/OfferPreview";
import { apiRequest } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CandidateOnboarding } from "@/features/offers/components/CandidateOnboarding";
export default function OfferResponsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [offer, setOffer] = useState<OfferItem | null>(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"accepted" | "declined">("accepted");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    apiRequest<OfferItem>(`/offers/${id}`)
      .then((data) => {
        if (active) setOffer(data);
      })
      .catch((caught) => {
        if (active) setError(caught.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  const expired =
    !!offer?.expiration_date &&
    new Date(offer.expiration_date).getTime() <= now;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setOffer(await respondToOffer(Number(id), decision, notes));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể gửi phản hồi",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceShell
      title="Cổng ứng viên"
      description="Thư mời nhận việc của bạn"
      icon={Gift}
      items={[
        { href: "/candidate/dashboard", label: "Hồ sơ của tôi", icon: Gift },
      ]}
      allowedRoles={[
        "candidate",
        "employee",
        "admin",
        "hr_manager",
        "recruiter",
        "manager",
        "hiring_manager",
        "interviewer",
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-3xl font-black text-slate-950">
          Phản hồi thư mời nhận việc
        </h1>
        {error && <Alert variant="error">{error}</Alert>}
        {offer ? (
          <>
            <OfferPreview offer={offer} />
            {offer.status === "accepted" && (
              <CandidateOnboarding applicationId={offer.application_id} />
            )}
            {offer.status === "sent" && !expired ? (
              <Card>
                <form onSubmit={submit} className="space-y-4">
                  <fieldset>
                    <legend className="mb-3 font-bold">
                      Quyết định của bạn
                    </legend>
                    <div className="flex flex-wrap gap-5">
                      <label className="flex gap-2">
                        <input
                          type="radio"
                          name="decision"
                          checked={decision === "accepted"}
                          onChange={() => setDecision("accepted")}
                        />
                        Chấp nhận
                      </label>
                      <label className="flex gap-2">
                        <input
                          type="radio"
                          name="decision"
                          checked={decision === "declined"}
                          onChange={() => setDecision("declined")}
                        />
                        Từ chối
                      </label>
                    </div>
                  </fieldset>
                  <label className="block text-sm font-semibold">
                    Ghi chú / lời nhắn
                    <textarea
                      rows={4}
                      maxLength={2000}
                      className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                  <Button type="submit" isLoading={busy}>
                    Xác nhận phản hồi
                  </Button>
                </form>
              </Card>
            ) : (
              <Alert variant={offer.status === "accepted" ? "success" : "info"}>
                {expired && offer.status === "sent"
                  ? "Thư mời đã hết hạn. Vui lòng liên hệ Nhân sự."
                  : `Trạng thái: ${offerLabels[offer.status]}.`}
                {offer.response_notes && (
                  <p className="mt-2">
                    Lời nhắn của bạn: {offer.response_notes}
                  </p>
                )}
              </Alert>
            )}
          </>
        ) : (
          !error && <Card>Đang tải thư mời...</Card>
        )}
        <Button href="/candidate/dashboard" variant="outline">
          Về hồ sơ của tôi
        </Button>
      </div>
    </WorkspaceShell>
  );
}
