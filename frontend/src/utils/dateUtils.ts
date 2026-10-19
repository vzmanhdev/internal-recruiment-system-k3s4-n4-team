/**
 * Utilities for date and currency handling with proper local timezone support (Vietnam GMT+7)
 */

/**
 * Trả về chuỗi YYYY-MM-DD theo giờ địa phương của client (tránh lệch ngày UTC sáng sớm).
 */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Kiểm tra xem một chuỗi ngày (YYYY-MM-DD) có nằm ở quá khứ so với hôm nay không.
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = dateStr.slice(0, 10);
  return target < getLocalTodayDateString();
}

/**
 * Cộng thêm số ngày vào ngày hiện tại hoặc ngày chỉ định, trả về YYYY-MM-DD local.
 */
export function addDaysToDate(days: number, fromDate?: string): string {
  const base = fromDate ? new Date(`${fromDate.slice(0, 10)}T00:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format số tiền sang định dạng tiền tệ VNĐ (ví dụ: 35.000.000 VNĐ).
 */
export function formatCurrencyVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}
