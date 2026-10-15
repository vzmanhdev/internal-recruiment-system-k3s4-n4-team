from math import ceil
from typing import Any, Dict, Generic, List, Optional, Sequence, Type, TypeVar
from fastapi import Query
from pydantic import BaseModel, Field
from sqlalchemy import asc, desc
from sqlalchemy.orm import Query as SAQuery

T = TypeVar("T")


class PaginationParams:
    """Standardized query parameters for server-side pagination, searching, and sorting."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Trang hiện tại (bắt đầu từ 1)"),
        page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Số bản ghi mỗi trang (1-100)"),
        sort_by: Optional[str] = Query(None, alias="sortBy", description="Trường cần sắp xếp"),
        sort_order: str = Query("desc", alias="sortOrder", pattern="^(asc|desc|ASC|DESC)$", description="Thứ tự sắp xếp (asc hoặc desc)"),
        search: Optional[str] = Query(None, description="Từ khóa tìm kiếm"),
    ):
        self.page = page
        self.page_size = page_size
        self.sort_by = sort_by.strip() if sort_by else None
        self.sort_order = sort_order.lower()
        self.search = search.strip() if search else None

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard generic envelope for all paginated lists."""
    items: List[T] = Field(default_factory=list, description="Danh sách các bản ghi thuộc trang hiện tại")
    total: int = Field(..., ge=0, description="Tổng số bản ghi thỏa mãn điều kiện lọc")
    page: int = Field(..., ge=1, description="Trang hiện tại")
    page_size: int = Field(..., ge=1, description="Số bản ghi trên mỗi trang")
    pages: int = Field(..., ge=1, description="Tổng số trang")


def paginate_query(
    query: SAQuery,
    page: int = 1,
    page_size: int = 20,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
    model: Optional[Type[Any]] = None,
    allowed_sort_columns: Optional[Sequence[str]] = None,
    default_sort_column: str = "created_at",
    default_sort_order: str = "desc",
    id_column: str = "id",
) -> Dict[str, Any]:
    """
    Applies deterministic sorting, calculates count, offsets and limits on a SQLAlchemy query.
    Returns a dictionary matching PaginatedResponse structure:
    {"items": [...], "total": int, "page": int, "page_size": int, "pages": int}
    """
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    # Apply sorting
    if model is not None:
        sort_col_attr = None
        normalized_order = sort_order.lower() if sort_order else default_sort_order

        if sort_by and allowed_sort_columns and sort_by in allowed_sort_columns:
            if hasattr(model, sort_by):
                sort_col_attr = getattr(model, sort_by)

        if sort_col_attr is None and hasattr(model, default_sort_column):
            sort_col_attr = getattr(model, default_sort_column)

        if sort_col_attr is not None:
            order_func = asc if normalized_order == "asc" else desc
            # Deterministic ordering: primary sort + secondary id sort
            if hasattr(model, id_column) and sort_by != id_column:
                id_attr = getattr(model, id_column)
                query = query.order_by(order_func(sort_col_attr), desc(id_attr))
            else:
                query = query.order_by(order_func(sort_col_attr))

    # Calculate total count before pagination
    total = query.count()
    pages = max(1, ceil(total / page_size))

    # Apply pagination window
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
