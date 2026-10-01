import os
import sys
import shutil
import argparse
from pathlib import Path
from typing import List, Tuple, Set

# Đảm bảo mã hóa UTF-8 khi in ra console trên Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if sys.stderr.encoding != 'utf-8':
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass


# Danh sách tên tập tin rác phổ biến
JUNK_FILENAMES = {
    ".ds_store",
    "thumbs.db",
    "desktop.ini",
    "ehthumbs.db",
    "npm-debug.log",
    "yarn-debug.log",
    "yarn-error.log",
}

# Danh sách phần mở rộng tập tin rác / tạm thời
JUNK_EXTENSIONS = {
    ".tmp",
    ".temp",
    ".bak",
    ".swp",
    ".swo",
    "~",
    ".pyc",
    ".pyo",
}

# Danh sách thư mục rác phổ biến (có thể xóa toàn bộ thư mục)
JUNK_DIRNAMES = {
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".cache",
}

# Các thư mục hệ thống / quan trọng cần bảo vệ, KHÔNG quét sâu vào trừ khi có chỉ định
DEFAULT_IGNORED_DIRS = {
    ".git",
    "node_modules",
    ".next",
    "venv",
    ".venv",
    "env",
    ".env",
}

# Các tập tin 0-byte đặc biệt quan trọng trong lập trình cần giữ lại theo mặc định
PRESERVED_EMPTY_FILES = {
    "__init__.py",  # Đánh dấu package trong Python
    ".gitkeep",     # Giữ thư mục trong Git
    ".gitignore",   # File cấu hình Git
}


def is_junk_file(filename: str) -> bool:
    name_lower = filename.lower()
    if name_lower in JUNK_FILENAMES:
        return True
    for ext in JUNK_EXTENSIONS:
        if name_lower.endswith(ext):
            return True
    return False


def is_junk_dir(dirname: str) -> bool:
    return dirname.lower() in JUNK_DIRNAMES


def clean_directory(
    root_path: str,
    dry_run: bool = True,
    delete_empty_files: bool = True,
    delete_junk: bool = True,
    delete_empty_dirs: bool = False,
    preserve_special_empty: bool = True,
    ignored_dirs: Set[str] = None
) -> dict:
    if ignored_dirs is None:
        ignored_dirs = DEFAULT_IGNORED_DIRS

    root = Path(root_path).resolve()
    if not root.exists() or not root.is_dir():
        raise ValueError(f"Đường dẫn không hợp lệ hoặc không phải thư mục: {root_path}")

    stats = {
        "scanned_files": 0,
        "scanned_dirs": 0,
        "empty_files": [],
        "preserved_empty_files": [],
        "junk_files": [],
        "junk_dirs": [],
        "empty_dirs": [],
        "deleted_files_count": 0,
        "deleted_dirs_count": 0,
    }

    # 1. Quét tìm thư mục rác cần xóa trước (tránh duyệt sâu vào trong)
    # 2. Duyệt đệ quy các tập tin
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        current_dir = Path(dirpath)
        stats["scanned_dirs"] += 1

        # Lọc bỏ thư mục được bảo vệ khỏi duyệt tiếp
        dirnames[:] = [d for d in dirnames if d not in ignored_dirs]

        # Kiểm tra các thư mục rác
        dirs_to_remove = []
        for d in dirnames:
            if delete_junk and is_junk_dir(d):
                junk_dir_path = current_dir / d
                stats["junk_dirs"].append(junk_dir_path)
                dirs_to_remove.append(d)

        # Không duyệt vào các thư mục rác đã đánh dấu xóa
        for d in dirs_to_remove:
            dirnames.remove(d)

        for f in filenames:
            stats["scanned_files"] += 1
            file_path = current_dir / f

            try:
                # Kiểm tra file có phải junk không
                if delete_junk and is_junk_file(f):
                    stats["junk_files"].append(file_path)
                    continue

                # Kiểm tra dung lượng file
                size = file_path.stat().st_size
                if size == 0 and delete_empty_files:
                    if preserve_special_empty and f in PRESERVED_EMPTY_FILES:
                        stats["preserved_empty_files"].append(file_path)
                    else:
                        stats["empty_files"].append(file_path)
            except (OSError, PermissionError) as e:
                print(f"[CẢNH BÁO] Không thể đọc {file_path}: {e}", file=sys.stderr)

    # 3. Thực hiện xóa hoặc mô phỏng (dry-run)
    # Xóa tập tin rác
    for fp in stats["junk_files"]:
        if not dry_run:
            try:
                fp.unlink(missing_ok=True)
                stats["deleted_files_count"] += 1
            except Exception as e:
                print(f"[LỖI XÓA FILE] {fp}: {e}", file=sys.stderr)

    # Xóa tập tin 0-byte
    for fp in stats["empty_files"]:
        if not dry_run:
            try:
                fp.unlink(missing_ok=True)
                stats["deleted_files_count"] += 1
            except Exception as e:
                print(f"[LỖI XÓA FILE 0-BYTE] {fp}: {e}", file=sys.stderr)

    # Xóa thư mục rác
    for dp in stats["junk_dirs"]:
        if not dry_run:
            try:
                shutil.rmtree(dp, ignore_errors=True)
                stats["deleted_dirs_count"] += 1
            except Exception as e:
                print(f"[LỖI XÓA THƯ MỤC] {dp}: {e}", file=sys.stderr)

    # 4. Xóa thư mục rỗng (nếu yêu cầu, duyệt từ dưới lên)
    if delete_empty_dirs:
        for dirpath, dirnames, filenames in os.walk(root, topdown=False):
            dp = Path(dirpath)
            if dp == root:
                continue
            if dp.name in ignored_dirs:
                continue
            try:
                # Kiểm tra thư mục có rỗng không
                if not any(dp.iterdir()):
                    stats["empty_dirs"].append(dp)
                    if not dry_run:
                        dp.rmdir()
                        stats["deleted_dirs_count"] += 1
            except (OSError, PermissionError):
                pass

    return stats


def print_report(stats: dict, dry_run: bool):
    print("=" * 70)
    mode_str = "[CHẾ ĐỘ MÔ PHỎNG - DRY RUN] (Chưa có file nào bị xóa thật)" if dry_run else "[CHẾ ĐỘ THỰC THI - LIVE] (ĐÃ XÓA FILE/FOLDER)"
    print(f"BÁO CÁO DỌN DẸP HỆ THỐNG: {mode_str}")
    print("=" * 70)
    print(f"- Số thư mục đã quét: {stats['scanned_dirs']}")
    print(f"- Số tập tin đã quét: {stats['scanned_files']}")
    print("-" * 70)

    print(f"\n1. TẬP TIN 0-BYTE CẦN XÓA ({len(stats['empty_files'])}):")
    if stats["empty_files"]:
        for f in stats["empty_files"]:
            print(f"   [0-BYTE] {f}")
    else:
        print("   (Không có tập tin 0-byte nào cần xóa)")

    if stats["preserved_empty_files"]:
        print(f"\n* TẬP TIN 0-BYTE ĐẶC BIỆT ĐƯỢC GIỮ LẠI ({len(stats['preserved_empty_files'])}):")
        for f in stats["preserved_empty_files"]:
            print(f"   [GIỮ LẠI] {f}")

    print(f"\n2. TẬP TIN RÁC / KHÔNG CẦN THIẾT ({len(stats['junk_files'])}):")
    if stats["junk_files"]:
        for f in stats["junk_files"]:
            print(f"   [RÁC] {f}")
    else:
        print("   (Không có tập tin rác nào)")

    print(f"\n3. THƯ MỤC RÁC CẦN DỌN DẸP ({len(stats['junk_dirs'])}):")
    if stats["junk_dirs"]:
        for d in stats["junk_dirs"]:
            print(f"   [DIR RÁC] {d}")
    else:
        print("   (Không có thư mục rác nào)")

    if stats["empty_dirs"]:
        print(f"\n4. THƯ MỤC RỖNG ({len(stats['empty_dirs'])}):")
        for d in stats["empty_dirs"]:
            print(f"   [DIR RỖNG] {d}")

    print("=" * 70)
    if dry_run:
        total_actions = len(stats["empty_files"]) + len(stats["junk_files"]) + len(stats["junk_dirs"]) + len(stats["empty_dirs"])
        print(f"TỔNG SỐ ĐỐI TƯỢNG SẼ ĐƯỢC XÓA KHI CHẠY THẬT (--apply): {total_actions}")
        print("Để thực thi xóa thật, chạy lệnh với tham số: --apply")
    else:
        print(f"ĐÃ XÓA THÀNH CÔNG: {stats['deleted_files_count']} tập tin, {stats['deleted_dirs_count']} thư mục.")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Dọn dẹp tập tin rác và tập tin 0-byte đệ quy.")
    parser.add_argument(
        "root_path",
        nargs="?",
        default=".",
        help="Đường dẫn gốc thư mục cần quét (mặc định: thư mục hiện tại)"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Thực hiện xóa thật (mặc định nếu không có cờ này là Dry Run - chỉ xem trước)"
    )
    parser.add_argument(
        "--force-empty",
        action="store_true",
        help="Xóa tất cả file 0-byte kể cả __init__.py và .gitkeep"
    )
    parser.add_argument(
        "--remove-empty-dirs",
        action="store_true",
        help="Xóa các thư mục rỗng sau khi dọn dẹp tập tin"
    )

    args = parser.parse_args()

    dry_run = not args.apply
    preserve_special = not args.force_empty

    try:
        stats = clean_directory(
            root_path=args.root_path,
            dry_run=dry_run,
            delete_empty_files=True,
            delete_junk=True,
            delete_empty_dirs=args.remove_empty_dirs,
            preserve_special_empty=preserve_special,
        )
        print_report(stats, dry_run=dry_run)
    except Exception as e:
        print(f"[LỖI]: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
