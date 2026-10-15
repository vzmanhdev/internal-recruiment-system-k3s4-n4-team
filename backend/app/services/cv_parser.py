"""Best-effort CV field extraction (S4-04). Never raises: a parsing failure must not break the application."""
import io
import re
import zipfile
import zlib
from typing import Optional

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?:\+?84|0)(?:[\s.-]?\d){9,10}")


def _docx_text(data: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    xml = re.sub(r"</w:p>", "\n", xml)
    return re.sub(r"<[^>]+>", "", xml)


def _pdf_text(data: bytes) -> str:
    """Extract text from FlateDecode/plain content streams (no external library available)."""
    chunks = []
    for m in re.finditer(rb"stream\r?\n(.*?)\r?\nendstream", data, re.S):
        raw = m.group(1)
        try:
            raw = zlib.decompress(raw)
        except zlib.error:
            pass
        for t in re.findall(rb"\(((?:\\.|[^\\)])*)\)\s*Tj", raw):
            chunks.append(t.decode("latin-1", errors="ignore") + "\n")  # one text operation per line
        for arr in re.findall(rb"\[(.*?)\]\s*TJ", raw, re.S):
            chunks.append("".join(p.decode("latin-1", errors="ignore") for p in re.findall(rb"\(((?:\\.|[^\\)])*)\)", arr)) + "\n")
        chunks.append("\n")
    return "".join(chunks)


def parse_cv(data: bytes, content_type: str) -> dict:
    try:
        if content_type == "application/pdf":
            text = _pdf_text(data)
        else:
            text = _docx_text(data)
    except Exception:
        return {"status": "failed", "full_name": None, "email": None, "phone": None}
    email = EMAIL_RE.search(text)
    phone = PHONE_RE.search(text)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    name: Optional[str] = None
    for ln in lines[:8]:
        if 2 <= len(ln.split()) <= 6 and not EMAIL_RE.search(ln) and not any(ch.isdigit() for ch in ln) and len(ln) <= 60:
            name = ln
            break
    found = any([email, phone, name])
    return {
        "status": "parsed" if found else "failed",
        "full_name": name,
        "email": email.group(0) if email else None,
        "phone": re.sub(r"[\s.-]", "", phone.group(0)) if phone else None,
    }
