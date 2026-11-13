# Tồn Kho Lắp Ráp · 재고 실사 대사 (Thực tế vs ERP)

Công cụ đối chiếu tồn kho thực tế với ERP cho các kho Vật tư, TRAY/BOX, INPUT (AASI) và OUT (AASO).

- Trang chính: `index.html` (một file duy nhất, không cần build)
- `_headers`: cấu hình header cho Cloudflare Pages (luôn tải bản mới nhất)

## Triển khai
Repo được liên kết với **Cloudflare Pages** – mỗi lần commit lên nhánh `main`, Cloudflare tự động cập nhật trang web.

## Cập nhật phiên bản mới
1. Vào file `index.html` trên GitHub → biểu tượng ✏️ / hoặc *Add file → Upload files* để thay file mới (giữ đúng tên `index.html`).
2. Ghi nội dung commit (VD: "Cập nhật tab INPUT theo mẫu mới") → *Commit changes*.
3. Đợi ~1 phút, mở lại trang web.

## Lưu ý dữ liệu
Số liệu kiểm kê được lưu trong trình duyệt của từng máy (hoặc server đồng bộ nếu đã cài) – **không lưu trong repo này**. Không commit file Excel có số liệu nội bộ lên repo.
