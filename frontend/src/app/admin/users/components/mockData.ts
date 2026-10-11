import { UserItem } from "./types";

const FIRST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ",
  "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đinh", "Đoàn", "Mai"
];

const MIDDLE_NAMES = [
  "Văn", "Thị", "Hồng", "Minh", "Đức", "Thanh", "Ngọc", "Quang", "Anh",
  "Hải", "Tuấn", "Hoàng", "Bảo", "Xuân", "Thành", "Phương", "Diệu", "Tùng"
];

const LAST_NAMES = [
  "An", "Bình", "Cường", "Dũng", "Em", "Giang", "Hà", "Hải", "Khánh", "Linh",
  "Minh", "Nam", "Oanh", "Phúc", "Quân", "Sơn", "Tâm", "Thắng", "Uyên", "Vinh",
  "Tú", "Hương", "Huy", "Khoa", "Nguyên", "Trang", "Trọng", "Huyền", "Việt", "Đạt"
];

const DEPARTMENTS = [
  "Khối Công nghệ & Kỹ thuật",
  "Phòng Quản trị Nhân sự (HR)",
  "Phòng Tuyển dụng & Đào tạo",
  "Khối Kinh doanh & Phát triển",
  "Phòng Tài chính - Kế toán",
  "Khối Vận hành & Hệ thống",
  "Ban Giám đốc & Điều hành",
];

const AVATAR_COLORS = [
  "bg-blue-600 text-white",
  "bg-purple-600 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
  "bg-indigo-600 text-white",
  "bg-cyan-600 text-white",
  "bg-teal-600 text-white",
];

const MULTI_ROLE_PATTERNS: string[][] = [
  ["admin", "hiring_manager"],
  ["hiring_manager", "interviewer"],
  ["recruiter", "interviewer"],
  ["recruiter"],
  ["hiring_manager"],
  ["interviewer"],
  ["employee"],
  ["employee", "interviewer"],
  ["admin"],
  ["employee"],
];

function removeVietnameseTones(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Generate exactly 150 rich mock user records
export const MOCK_USERS_150: UserItem[] = Array.from({ length: 150 }, (_, i) => {
  const id = i + 1;
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const middleName = MIDDLE_NAMES[(i * 3) % MIDDLE_NAMES.length];
  const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
  const fullName = `${firstName} ${middleName} ${lastName}`;

  const cleanLast = removeVietnameseTones(lastName);
  const cleanFirst = removeVietnameseTones(firstName);
  const cleanMiddle = removeVietnameseTones(middleName).charAt(0);
  const email = id === 1
    ? "admin@company.com"
    : id === 2
    ? "hrmanager@company.com"
    : id === 3
    ? "recruiter@company.com"
    : id === 4
    ? "manager@company.com"
    : id === 5
    ? "interviewer@company.com"
    : `${cleanLast}.${cleanFirst}${cleanMiddle}${id > 30 ? id : ""}@company.com`;

  const codeNum = String(id).padStart(3, "0");
  const employeeCode = `NV-${codeNum}`;
  const phone = `09${Math.floor(10000000 + (i * 987654) % 89999999)}`;
  const department = DEPARTMENTS[i % DEPARTMENTS.length];
  const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];

  // Specific role sets for top users
  let roles: string[];
  if (id === 1) roles = ["admin", "hiring_manager"];
  else if (id === 2) roles = ["recruiter", "hiring_manager"];
  else if (id === 3) roles = ["recruiter"];
  else if (id === 4) roles = ["hiring_manager", "interviewer"];
  else if (id === 5) roles = ["interviewer"];
  else {
    roles = MULTI_ROLE_PATTERNS[i % MULTI_ROLE_PATTERNS.length];
  }

  // Around 12-15 users are locked for realistic enterprise demo
  const isLocked = i === 5 || i === 18 || i === 33 || i === 47 || i === 68 || i === 89 || i === 112 || i === 135;
  const lockReasons = [
    "Chuyển công tác & bàn giao quyền hạn",
    "Tạm khóa theo yêu cầu phòng Nhân sự",
    "Nghỉ phép dài hạn / thai sản",
    "Vi phạm quy tắc bảo mật mật khẩu nội bộ",
    "Hết hạn hợp đồng thử việc",
  ];

  return {
    id,
    employee_code: employeeCode,
    full_name: id === 1 ? "Nguyễn Văn Quản Trị (Admin)" : fullName,
    email,
    phone,
    department,
    role: roles[0],
    roles,
    is_active: !isLocked,
    account_status: isLocked ? "locked" : "active",
    lock_reason: isLocked ? lockReasons[i % lockReasons.length] : undefined,
    created_at: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    avatar_color: avatarColor,
  };
});
