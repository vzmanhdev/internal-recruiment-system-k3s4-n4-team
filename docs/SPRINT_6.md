# Sprint 6 — Đặt lịch phỏng vấn và phiếu đánh giá

## Các trang sử dụng

- Recruiter / HR: `/hr/interviews`. Chọn một hoặc nhiều ứng viên, hội đồng, phòng họp hoặc link họp. Chọn giờ bắt đầu, thời lượng và thời gian nghỉ để xem trước các khe liên tiếp.
- Ứng viên: `/interview-response?token=...`. Mở từ email để xác nhận, từ chối hoặc đề nghị thời gian mới kèm lý do; không cần đăng nhập. Liên kết ký có hiệu lực 14 ngày. Lịch đã đóng hoặc bắt đầu không nhận phản hồi.
- Hiring Manager / Interviewer: `/interviewer`. Xem lịch được phân công, nhập điểm 1–5, đề xuất và nhận xét. Bảng so sánh tổng hợp phiếu theo ứng viên, có bộ lọc vị trí.
- HR khai báo tiêu chí tại `/hr/master-data/competencies` (dữ liệu thật). Tổng trọng số của mỗi khung cần bằng 100%.

## Hành vi

- Server chặn lịch trùng người phỏng vấn hoặc phòng họp (hình thức trực tiếp). Kiểm tra lại khi tạo hoặc đổi lịch.
- Tạo hàng loạt lưu trong một transaction: khi bất kỳ khe nào lỗi, toàn bộ nhóm được hoàn tác.
- Giờ chọn trong trình duyệt được chuyển UTC khi gửi; API trả thời gian có `Z` để hiển thị đúng múi giờ người xem.
- Recruiter có thể chấp nhận giờ ứng viên đề nghị, hệ thống kiểm tra trùng lịch và chuyển phản hồi về chờ xác nhận.
- Hội đồng được xem các ứng viên được phân công; Hiring Manager cũng xem ứng viên thuộc yêu cầu mình tạo. Admin, HR và Recruiter có quyền tổng hợp.
- Nộp lại phiếu của cùng người đánh giá cập nhật phiếu hiện có, không tăng số phiếu và làm sai điểm trung bình.
- Recruiter chọn khung năng lực và đánh dấu **Đây là vòng phỏng vấn cuối** khi đặt lịch. Có thể đánh dấu vòng cuối cho lịch hiện có.
- Phiếu ở `/interviewer` tải các tiêu chí, mô tả, mức yêu cầu và trọng số từ khung đã chọn. Mỗi tiêu chí có điểm 1–5 và nhận xét bắt buộc tối thiểu 5 ký tự.
- JavaScript cộng điểm tiêu chí, tính điểm có trọng số trên thang 5 và quy đổi thang 100 ngay khi thay đổi điểm. Backend tính lại từ trọng số đã lưu, không tin điểm tổng từ trình duyệt.
- Phiếu lưu bản chụp tên tiêu chí, trọng số, điểm và nhận xét theo từng lịch/người đánh giá; sửa khung về sau không thay đổi phiếu đã lưu.
- Lưới mặc định **Chỉ ứng viên vào vòng cuối** tổng hợp phiếu gắn với lịch đã đánh dấu vòng cuối, bỏ lịch hủy và hồ sơ chưa có phiếu vòng cuối. Có thể chuyển sang tất cả vòng; có bộ lọc vị trí và cột điểm từng tiêu chí.

## Email

Nhấn **Gửi lời mời** để gửi email có liên kết phản hồi. Backend đọc `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_APP_PASSWORD` (hoặc `SMTP_PASSWORD`), `SMTP_USE_TLS` và `FRONTEND_URL` từ `backend/.env`.

Khi SMTP chưa được cấu hình hoặc gửi thất bại, giao diện báo rõ lỗi. Nút **Sao chép liên kết email** vẫn dùng được để gửi liên kết thủ công. Cần đặt `FRONTEND_URL` thành địa chỉ ứng viên có thể truy cập khi triển khai.

## Kiểm tra

Chạy `pytest tests/test_sprint6_scorecards.py tests/test_interview_flow.py tests/test_referral_eval_flow.py` trong thư mục backend với database thử nghiệm riêng. Bao gồm token công khai, đổi lịch, xung đột người/phòng, hoàn tác batch, quyền truy cập, lời mời email (mock SMTP), tiêu chí động, tính lại điểm, kiểm tra dữ liệu thiếu/sai, cập nhật phiếu, lưu khung cũ và lọc vòng cuối.
