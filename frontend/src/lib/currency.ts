/**
 * Helper utility for formatting, parsing, and converting Vietnamese Dong (VND / ₫) amounts.
 */

export function formatVND(amount: number | null | undefined, showDecimals = false): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0 ₫';
  }
  const val = Number(amount);
  const formatted = val.toLocaleString('vi-VN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ₫`;
}

export function parseVND(input: string | number | null | undefined): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  // Remove non-numeric characters except comma and dot
  // In Vietnamese: 50.000.000,50 -> dot is thousands, comma is decimal
  let cleaned = String(input).replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return 0;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    // Check if dot is thousands separator (3 digits after)
    const parts = cleaned.split('.');
    if (parts.length > 1 && parts.every((p, idx) => idx === 0 || p.length === 3)) {
      cleaned = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes(',')) {
    // If only comma, treat as decimal
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readThreeDigits(triplet: number, showZeroHundred = false): string {
  const hundreds = Math.floor(triplet / 100);
  const remainder = triplet % 100;
  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;
  const words: string[] = [];

  if (hundreds > 0 || showZeroHundred) {
    words.push(`${DIGITS[hundreds]} trăm`);
  }

  if (tens > 1) {
    words.push(`${DIGITS[tens]} mươi`);
    if (ones === 1) words.push('mốt');
    else if (ones === 5) words.push('lăm');
    else if (ones > 0) words.push(DIGITS[ones]);
  } else if (tens === 1) {
    words.push('mười');
    if (ones === 5) words.push('lăm');
    else if (ones > 0) words.push(DIGITS[ones]);
  } else if (ones > 0) {
    if (hundreds > 0 || showZeroHundred) words.push('lẻ');
    words.push(DIGITS[ones]);
  }

  return words.join(' ');
}

export function numberToWordsVietnamese(amount: number): string {
  if (amount === 0) return 'Không đồng';
  if (!amount || isNaN(amount)) return '';

  const integerPart = Math.floor(Math.abs(amount));
  if (integerPart === 0) return 'Không đồng';

  let remaining = integerPart;
  const triplets: number[] = [];
  while (remaining > 0) {
    triplets.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = triplets.length - 1; i >= 0; i--) {
    const triplet = triplets[i];
    if (triplet > 0) {
      const showZeroHundred = i < triplets.length - 1 && parts.length > 0;
      const text = readThreeDigits(triplet, showZeroHundred);
      parts.push(`${text} ${UNITS[i]}`.trim());
    }
  }

  const result = parts.join(' ').replace(/\s+/g, ' ').trim();
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1);
  return `${capitalized} đồng`;
}
