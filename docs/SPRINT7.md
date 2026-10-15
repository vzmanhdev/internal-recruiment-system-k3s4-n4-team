# Sprint 7: Quyết định tuyển, offer và onboarding

## Các màn hình

- `/interviewer`: lịch tuần cá nhân, danh sách buổi sắp tới, panel câu hỏi gợi ý từ khung năng lực và đánh dấu đã hỏi. Dấu tích lưu riêng cho từng người trong hội đồng.
- `/hr/offers`: tổng hợp toàn bộ phiếu đánh giá, soạn/sửa bản nháp, xem trước thư mời và chuỗi phê duyệt.
- `/candidate/dashboard`: ứng viên mở thư mời của mình qua nút **Xem thư mời & phản hồi**.
- `/offer-response/[id]`: ứng viên đăng nhập để chấp nhận/từ chối và để lại ghi chú. Backend chặn phản hồi trùng, sai chủ hồ sơ hoặc quá hạn.
- `/hr/onboarding`: checklist 5 mục, tiến độ 0–100%, bộ lọc và phân trang; các thay đổi lưu vào database.

## Quy trình và quyền

1. Admin, HR Manager hoặc Recruiter soạn bản nháp. Chọn ứng viên để lấy dải lương và tổng hợp đánh giá, kể cả khi tin đã dừng nhận hồ sơ.
2. Lương ngoài dải phải có giải trình ít nhất 10 ký tự. Ngày nhận việc và hạn phản hồi phải ở tương lai; hạn phản hồi không sau ngày nhận việc.
3. Trình duyệt theo thứ tự **Trưởng bộ phận → HR Manager**. Với lương ngoài dải, thêm **Ban phê duyệt ngoại lệ (`approver`)**. Trưởng bộ phận chỉ duyệt hồ sơ thuộc yêu cầu mình tạo; Admin có thể xử lý từng cấp tuần tự.
4. Từ chối/yêu cầu bổ sung phải có ý kiến ít nhất 5 ký tự. HR sửa offer cần bổ sung và trình lại; lịch sử các lần duyệt được giữ lại.
5. Sau khi duyệt đủ cấp, HR/Recruiter gửi thư mời vào tài khoản ứng viên. Hiện thao tác này **không gửi email SMTP tự động**.
6. Ứng viên chấp nhận thì hồ sơ chuyển sang đã tuyển và tạo checklist nhận việc. Ghi chú phản hồi được lưu riêng, không ghi đè điều khoản offer.

Admin có thể cấp vai trò **Người phỏng vấn** hoặc **Ban phê duyệt ngoại lệ** tại trang Quản lý tài khoản. Checkbox onboarding là xác nhận công việc đã thực hiện; không tự gửi email hay cấp thiết bị/tài khoản.

API cũ `/api/v1/legacy/offers` dùng chung quy trình và quyền với API mới; không còn gửi hay chấp nhận offer bằng quyền HR để bỏ qua phê duyệt/phản hồi ứng viên.

## Kiểm tra

- Các ca tự động trong `backend/tests/test_sprint7_workflow.py` kiểm tra quyền, thứ tự duyệt, lương ngoài dải, yêu cầu bổ sung, ngày giờ, hạn phản hồi, ghi chú, onboarding và câu đã hỏi.
- Chạy kèm kiểm thử Sprint 6, interview, offer, candidate/employee và full recruitment lifecycle.
- Frontend: TypeScript, ESLint cho các tệp mới/sửa, production build bằng `npx next build --webpack`.
- Khi backend khởi động, các cột Sprint 7 được bổ sung tương thích với database hiện có. Không cần thay database để dùng chức năng mới.
