"""Best-effort CV field extraction (S4-04). Never raises: a parsing failure must not break the application."""
import io
import re
import zipfile
import zlib
from typing import List, Optional

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?:\+?84|0)(?:[\s.-]?\d){9,10}")

COMMON_SKILLS = [
    "Python", "FastAPI", "Django", "Flask", "Java", "Spring Boot", "JavaScript", "TypeScript",
    "React", "Vue", "Next.js", "Node.js", "Express", "HTML", "CSS", "Tailwind", "SQL",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Git", "Linux",
    "CI/CD", "Figma", "C#", ".NET", "Golang", "PHP", "Laravel", "Swift", "Kotlin", "Flutter",
]

HEADER_SKIP_WORDS = {
    "cv", "curriculum vitae", "resume", "thông tin cá nhân", "profile", "so yeu ly lich", "sơ yếu lý lịch",
}


def _unescape_pdf_bytes(b: bytes) -> str:
    """Unescape standard PDF escapes: \\(, \\), \\\\, octal escapes."""
    def replace_octal(match):
        try:
            return bytes([int(match.group(1), 8)])
        except Exception:
            return b""
    b = re.sub(rb"\\([0-7]{1,3})", replace_octal, b)
    b = b.replace(rb"\(", b"(").replace(rb"\)", b")").replace(rb"\\", b"\\")
    b = b.replace(rb"\r", b"\r").replace(rb"\n", b"\n").replace(rb"\t", b"\t")
    try:
        return b.decode("utf-8")
    except UnicodeDecodeError:
        return b.decode("latin-1", errors="ignore")


def _docx_text(data: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    xml = re.sub(r"</w:p>", "\n", xml)
    return re.sub(r"<[^>]+>", "", xml)


def _pdf_text(data: bytes) -> str:
    """Extract text from FlateDecode/plain/A85 content streams (no external library available)."""
    chunks = []
    for m in re.finditer(rb"stream[\r\n]+(.*?)[\r\n]*endstream", data, re.S):
        raw = m.group(1).strip()
        if raw.endswith(b"~>"):
            try:
                import base64
                raw = base64.a85decode(raw)
            except Exception:
                pass
        try:
            raw = zlib.decompress(raw)
        except zlib.error:
            pass
        for t in re.findall(rb"\(((?:\\.|[^\\)])*)\)\s*Tj", raw):
            chunks.append(_unescape_pdf_bytes(t) + "\n")
        for arr in re.findall(rb"\[(.*?)\]\s*TJ", raw, re.S):
            chunks.append("".join(_unescape_pdf_bytes(p) for p in re.findall(rb"\(((?:\\.|[^\\)])*)\)", arr)) + "\n")
        chunks.append("\n")
    return "".join(chunks)


def parse_cv(data: bytes, content_type: str) -> dict:
    """S4-04: Parse CV text for basic contact info and skills. Never raises."""
    try:
        if content_type == "application/pdf":
            text = _pdf_text(data)
        else:
            text = _docx_text(data)
    except Exception:
        return {
            "status": "failed",
            "full_name": None,
            "email": None,
            "phone": None,
            "skills": [],
            "education": None,
        }

    if not text or not text.strip():
        return {
            "status": "failed",
            "full_name": None,
            "email": None,
            "phone": None,
            "skills": [],
            "education": None,
        }

    email_match = EMAIL_RE.search(text)
    phone_match = PHONE_RE.search(text)
    email_val = email_match.group(0).lower() if email_match else None
    phone_val = re.sub(r"[\s.-]", "", phone_match.group(0)) if phone_match else None

    # Candidate Name extraction: inspect top lines
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    name: Optional[str] = None
    for ln in lines[:12]:
        lower_ln = ln.lower()
        if lower_ln in HEADER_SKIP_WORDS:
            continue
        # Name should be 2 to 6 words, no email, no numbers, length <= 60
        if 2 <= len(ln.split()) <= 6 and not EMAIL_RE.search(ln) and not any(ch.isdigit() for ch in ln) and len(ln) <= 60:
            name = ln
            break

    # Skills extraction
    skills: List[str] = []
    text_lower = text.lower()
    for s in COMMON_SKILLS:
        # Match as whole word
        pattern = r"\b" + re.escape(s.lower()) + r"\b"
        if re.search(pattern, text_lower):
            skills.append(s)

    # Education extraction: basic detection
    education: Optional[str] = None
    edu_inst_keywords = [
        "đại học", "dai hoc", "cao đẳng", "cao dang", "học viện", "hoc vien",
        "university", "college", "trường đại học", "truong dai hoc"
    ]
    edu_degree_keywords = [
        "cử nhân", "cu nhan", "thạc sĩ", "thac si", "tiến sĩ", "tien si",
        "bachelor", "master", "phd"
    ]
    for ln in lines:
        lower_ln = ln.lower()
        if any(kw in lower_ln for kw in edu_inst_keywords):
            if len(ln) <= 100:
                education = ln
                break
    if not education:
        for ln in lines:
            lower_ln = ln.lower()
            if any(kw in lower_ln for kw in edu_degree_keywords):
                if len(ln) <= 100:
                    education = ln
                    break

    found = any([email_val, phone_val, name])
    return {
        "status": "parsed" if found else "failed",
        "full_name": name,
        "email": email_val,
        "phone": phone_val,
        "skills": skills[:8],
        "education": education,
    }
