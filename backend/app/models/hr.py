from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.db.session import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "code": self.code, "parent_id": self.parent_id, "sort_order": self.sort_order, "is_active": self.is_active}

class JobTitle(Base):
    __tablename__ = "job_titles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    level = Column(String(60), nullable=False)
    min_salary = Column(Float, nullable=False)
    max_salary = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "department_id": self.department_id, "level": self.level, "min_salary": self.min_salary, "max_salary": self.max_salary, "description": self.description, "is_active": self.is_active}

class Competency(Base):
    __tablename__ = "competencies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(80), nullable=False)
    description = Column(Text, nullable=True)
    required_level = Column(Integer, default=3, nullable=False)
    weight = Column(Float, default=0, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "category": self.category, "description": self.description, "required_level": self.required_level, "weight": self.weight, "sort_order": self.sort_order, "is_active": self.is_active}

class SharedCategory(Base):
    __tablename__ = "shared_categories"
    id = Column(Integer, primary_key=True, index=True)
    category_type = Column(String(60), nullable=False)
    name = Column(String(120), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def to_dict(self):
        return {"id": self.id, "category_type": self.category_type, "name": self.name, "sort_order": self.sort_order, "is_active": self.is_active}
