# HỆ THỐNG QUẢN LÝ CAFE POKER CLUB (ROYAL POKER MANAGEMENT SYSTEM)

Hệ thống quản lý toàn diện chuyên biệt dành cho mô hình **Cafe Thể Thao Trí Tuệ & Poker Tournament Club**.

---

## 🌟 TỔNG QUAN HỆ THỐNG

Ứng dụng được thiết kế và triển khai với giao diện người dùng cao cấp, kết hợp phong cách **Modern SaaS Dashboard** với tính thẩm mỹ **Royal Poker Club** (màu xanh bàn poker Emerald, vàng ánh kim Gold và nền than đen Navy).

Toàn bộ nhãn, nội dung và thông báo trên giao diện đều được Việt hóa 100%, chuẩn thuật ngữ Poker và POS Cafe chuyên nghiệp.

---

## 🚀 CÔNG NGHỆ SỬ DỤNG (TECH STACK)

- **Frontend Core**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS với custom Poker Design Tokens, Glassmorphism và hiệu ứng ánh sáng (Glow effects)
- **Icons**: Lucide React
- **Routing & Phân Quyền**: React Router v7 với hệ thống Role-based Protected Routes
- **Quản Lý State & Lưu Trữ**: Zustand với đồng bộ dữ liệu `localStorage`
- **Biểu Đồ Phân Tích**: Recharts (AreaChart, BarChart, PieChart)
- **Tiện Ích Ngày & Giờ**: date-fns (Việt hóa)
- **Hiệu Ứng Âm Thanh**: Web Audio API Synthesizer (tự tạo âm chuông Crystal Chime, Beep cảnh báo đếm ngược và chuông Break mà không cần file MP3 ngoài)
- **Hiệu Ứng Vô Địch**: canvas-confetti

---

## 👥 VAI TRÒ & TÀI KHOẢN DEMO KIỂM THỬ

Hệ thống hỗ trợ chuyển đổi nhanh tài khoản 1-click tại trang Đăng nhập và thanh Header:

| Vai Trò | Tên Đăng Nhập | Mật Khẩu | Họ Tên & Chức Danh | Quyền Hạn |
|---|---|---|---|---|
| **ADMIN** | `admin` | `admin123` | **Nguyễn Văn Quản Lý** (Giám đốc Điều hành) | Toàn quyền kiểm soát 8 phân hệ |
| **CASHIER** | `cashier` | `cashier123` | **Trần Thị Thu Ngân** (Thu ngân trưởng) | Cafe POS, Quản lý ca, Điều hành Tour, Đề xuất điểm |
| **PLAYER** | `player` | `player123` | **Lê Hoàng Poker** (Hội viên VIP Diamond) | Cổng hội viên cá nhân, xem điểm, BXH, Spectator Clock |

---

## 📦 CHI TIẾT 8 PHÂN HỆ CHỨC NĂNG

### 1. Phân Hệ Xác Thực & Phân Quyền (Authentication & Roles)
- Đăng nhập với tài khoản mật khẩu hoặc chọn nhanh 1-click demo role.
- Điều hướng thông minh theo vai trò: Admin vào Tổng quan, Cashier vào Cafe POS, Player vào Cổng Hội viên.
- Trang Hồ sơ cá nhân (Profile) cập nhật họ tên, SĐT, avatar và đổi mật khẩu.
- Bảo vệ định tuyến (Protected Routes) ngăn chặn truy cập trái phép.

### 2. Quản Lý Vai Trò & Ma Trận Quyền (Role & Permissions)
- Ma trận phân quyền chi tiết cho Admin, Cashier và Player.
- Nhóm quyền theo phân hệ (POS, Tour, Điểm, Tài khoản, Ca trực, Báo cáo).
- Thay đổi quyền hạn cập nhật ngay tức thì vào thanh điều hướng Sidebar.
- Ghi nhận nhật ký kiểm toán (Audit Trail) lịch sử điều chỉnh phân quyền.

### 3. Quản Lý Tài Khoản (Account Management)
- Danh sách tài khoản quản trị viên, thu ngân và người chơi với bộ lọc vai trò, trạng thái.
- Tạo mới tài khoản, chỉnh sửa thông tin người dùng.
- Khóa / Mở khóa tài khoản với hộp thoại xác nhận.
- Cấp lại mật khẩu ngẫu nhiên cho nhân viên/hội viên.

### 4. Cafe POS Bán Hàng & Order Bàn
- **Bố cục 3 cột chuẩn POS chuyên nghiệp**:
  - Cột trái: Danh mục món (Cà phê, Trà, Nước ép & Tăng lực, Món ăn nóng, Snack Poker, Combo All-In).
  - Cột giữa: Lưới thẻ món ăn đồ uống với hình ảnh, giá VND, số lượng tồn kho và thêm nhanh vào giỏ.
  - Cột phải: Hóa đơn đơn hàng, chọn vị trí bàn (Bàn Cafe, Bàn Poker 1, 2, Bàn VIP 1...), tên khách, ghi chú từng món, thanh trượt giảm giá hội viên.
- **Phương thức thanh toán**:
  - **Tiền mặt (Cash)**: Phím chọn nhanh tiền khách đưa (50k, 100k, 200k, 500k, Đủ tiền), tự động tính tiền thối lại.
  - **Chuyển khoản (VietQR)**: Tạo mã QR ngân hàng chuẩn MB Bank kèm cú pháp chuyển khoản và nút xác nhận nhận tiền.
- **In hóa đơn**: Xem trước hóa đơn nhiệt chuẩn nhà hàng in ngay tại quầy.
- Quản lý CRUD món ăn đồ uống và đổi giá linh hoạt.
- Tự động liên kết các hóa đơn vào **Ca làm việc đang mở** của thu ngân.

### 5. Quản Lý Điểm Thưởng Hội Viên (Player Points)
- Quản lý điểm thành tích thể thao phong trào của câu lạc bộ.
- **Quy trình phê duyệt (Approval Workflow)**:
  - Thu ngân/Hệ thống tạo yêu cầu thưởng/phạt điểm (Trạng thái: PENDING).
  - Điểm đang chờ duyệt **KHÔNG** làm thay đổi số dư chính thức.
  - Quản trị viên (Admin) xem xét và phê duyệt (APPROVED) hoặc từ chối kèm lý do (REJECTED).
  - Sau khi duyệt, hệ thống tự động ghi nhật ký biến động điểm và cập nhật bảng xếp hạng.
- **Bảng Xếp Hạng (Leaderboard)**: Bục vinh danh Top 3 (Quán Quân Vàng, Á Quân Bạc, Quý Quân Đồng) cùng tỷ lệ thắng (Win Rate) và cấp bậc (Diamond, Platinum, Gold, Silver, Bronze).
- *Cam kết quy chế thể thao*: Điểm Poker là điểm xếp hạng phong trào, không quy đổi thành tiền mặt hoặc hiện vật.

### 6. Quản Lý Giải Đấu & Đồng Hồ Tournament Clock
- **Cấu Trúc Blind Configurator**:
  - Tùy chỉnh danh sách Level, Small Blind, Big Blind, Ante.
  - Thiết lập thời lượng Level trước Break (20 phút) và sau Break (15 phút).
  - Thêm nhiều quãng nghỉ Break (Break 1, Break 2...) với thời lượng riêng biệt.
  - Di chuyển, sắp xếp thứ tự và nạp các mẫu cấu trúc chuẩn (Tiêu chuẩn, Turbo, Deepstack).
- **Đồng Hồ Tournament Clock Chuyên Nghiệp**:
  - Giao diện đồng hồ đếm ngược kích thước lớn độ tương phản cao cho màn hình TV/Projector.
  - Chế độ toàn màn hình Fullscreen (F11/TV).
  - **Thuật toán đếm giờ theo Timestamp**: Đảm bảo thời gian chạy chính xác 100% theo thời gian thực, không bị trôi khi chuyển tab hoặc tải lại trình duyệt.
  - Tự động chuyển Level khi đồng hồ về 00:00 và tự động chuyển sang Break nghỉ giải lao.
  - Phát âm thanh chuông báo (Web Audio Synthesizer) khi chuyển Level hoặc tới giờ Break.
  - Nút điều khiển: Bắt đầu, Tạm dừng, Chuyển vòng, Lùi vòng, Đặt lại Timer (kèm xác nhận).
  - Quản lý số chip và ghi nhận thứ hạng loại của từng người chơi tại bàn.
  - **Tự động đề xuất điểm thưởng**: Khi kết thúc giải, hệ thống tự động tính thứ hạng Top đầu và tạo đề xuất thưởng điểm cho Admin duyệt!

### 7. Quản Lý Ca Làm Việc & Bàn Giao Két (Shift Management)
- Quản lý các ca trực: Ca Sáng (08:00–14:00), Ca Chiều (14:00–20:00), Ca Đêm (20:00–02:00 hôm sau qua đêm).
- Mở ca với số tiền mặt đầu ca trong két.
- Trang theo dõi Ca đang hoạt động (`/shifts/active`) cập nhật doanh thu thời gian thực.
- Đóng ca và đối soát tiền mặt: So sánh Tiền thực tế kiểm đếm với Tiền lý thuyết (Đầu ca + Doanh thu bill tiền mặt), tính toán chênh lệch (Thừa / Thiếu / Khớp 100%) và lưu biên bản bàn giao.

### 8. Báo Cáo Doanh Thu & Thống Kê (Revenue Analytics)
- Thống kê doanh thu theo ngày, theo tháng, theo ca làm việc, theo nhân viên thu ngân.
- Biểu đồ xu hướng doanh thu Recharts (Area Chart).
- Biểu đồ phân bổ phương thức thanh toán Tiền mặt vs VietQR (Pie Chart).
- Thống kê top món ăn đồ uống bán chạy nhất (Bar Chart).
- Bộ lọc thời gian (7 ngày, 30 ngày, Tháng này).
- Xuất dữ liệu báo cáo ra file Excel / CSV tải về máy.

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY ỨNG DỤNG

### 1. Khởi chạy môi trường phát triển (Dev Server)
```bash
# Cài đặt gói thư viện (nếu chưa cài)
npm install

# Khởi chạy Vite dev server
npm run dev
```
Truy cập trình duyệt tại địa chỉ: `http://localhost:5173/`

### 2. Biên dịch Production Build
```bash
npm run build
```
Thư mục xuất bản: `dist/`
