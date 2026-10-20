import unicodedata
from typing import List, Any
from sqlalchemy import func, or_, case
from sqlalchemy.sql.elements import BinaryExpression, Case

def unaccent_vn(s: Any) -> str:
    """
    Normalizes a string by stripping Vietnamese diacritics and converting to lowercase.
    Handles 'đ' -> 'd', 'Đ' -> 'd'.
    """
    if s is None:
        return ""
    text = str(s)
    # NFKD separates combining characters
    n = unicodedata.normalize("NFKD", text)
    res = "".join(c for c in n if not unicodedata.combining(c))
    return res.replace("đ", "d").replace("Đ", "d").lower().strip()


def db_unaccent(column):
    """
    Returns SQL expression to unaccent the given column.
    For SQLite: uses the custom registered unaccent_vn function.
    For PostgreSQL: uses func.unaccent(column).
    """
    return func.unaccent_vn(column)


def build_search_filter(columns: List[Any], search_term: str) -> BinaryExpression:
    """
    Builds a case-insensitive and accent-insensitive SQLAlchemy filter condition
    across multiple columns.
    Matches if:
    1. Lowercase exact search_term is in lowercase column OR
    2. Unaccented search_term is in unaccented column
    """
    term_raw = search_term.strip()
    term_exact = f"%{term_raw.lower()}%"
    term_unaccent = f"%{unaccent_vn(term_raw)}%"

    conditions = []
    for col in columns:
        # Match either exact accent (case-insensitive) or unaccented
        conditions.append(func.lower(col).like(term_exact))
        conditions.append(func.unaccent_vn(col).like(term_unaccent))

    return or_(*conditions)


def build_search_score(columns: List[Any], search_term: str) -> Case:
    """
    Builds an SQLAlchemy CASE statement to score matches for relevancy ranking:
    - Score 100: Exact accented substring match (e.g. searching 'Mạnh' matches '...Mạnh...')
    - Score 80: Accented prefix match (e.g. searching 'Nguyễn' matches 'Nguyễn...')
    - Score 60: Unaccented prefix match (e.g. searching 'nguyen' matches 'Nguyễn...')
    - Score 40: Unaccented substring match (e.g. searching 'manh' matches '...Mạnh...')
    - Score 10: Fallback match
    """
    term_raw = search_term.strip()
    exact_lower = term_raw.lower()
    unaccent_lower = unaccent_vn(term_raw)

    case_whens = []
    for col in columns:
        # Exact accented prefix: Score 90
        case_whens.append((func.lower(col).like(f"{exact_lower}%"), 90))
        # Exact accented substring: Score 85
        case_whens.append((func.lower(col).like(f"%{exact_lower}%"), 85))
        # Unaccented prefix: Score 60
        case_whens.append((func.unaccent_vn(col).like(f"{unaccent_lower}%"), 60))
        # Unaccented substring: Score 40
        case_whens.append((func.unaccent_vn(col).like(f"%{unaccent_lower}%"), 40))

    return case(*case_whens, else_=10)


def compute_ranking_score(target: str, query: str) -> int:
    """
    Computes a python-side relevancy score for a target string against a search query:
    - 100: Exact accented match (case-insensitive)
    - 80: Accented prefix match
    - 60: Accented substring match
    - 40: Unaccented exact match
    - 30: Unaccented prefix match
    - 20: Unaccented substring match
    - 0: No match
    """
    if not target or not query:
        return 0
    t_clean = target.strip()
    q_clean = query.strip()
    t_lower = t_clean.lower()
    q_lower = q_clean.lower()

    if t_lower == q_lower:
        return 100
    if t_lower.startswith(q_lower):
        return 80
    if q_lower in t_lower:
        return 60

    t_norm = unaccent_vn(t_clean)
    q_norm = unaccent_vn(q_clean)

    if t_norm == q_norm:
        return 40
    if t_norm.startswith(q_norm):
        return 30
    if q_norm in t_norm:
        return 20
    return 0

