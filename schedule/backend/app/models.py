"""SQLAlchemy ORM 模型：课表 / 课程 / 时间段片段"""

from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(String(64), default="")


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner = Column(String(64), default="")
    student_id = Column(String(64), default="")
    student_name = Column(String(64), default="")
    term = Column(String(64), default="")
    term_start_date = Column(String(10), default="")
    total_weeks = Column(Integer, default=16)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    share_code = Column(String(36), unique=True, index=True, nullable=True)
    # 同步导入：source_id 指向被同步的源课表；None 表示普通/拷贝课表
    source_id = Column(Integer, ForeignKey("timetables.id"), nullable=True)
    sync_enabled = Column(Boolean, default=False, nullable=False)

    courses = relationship(
        "Course",
        back_populates="timetable",
        cascade="all, delete-orphan",
        order_by="Course.id",
    )


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id"), nullable=False)
    student_course_id = Column(String(64), unique=True, index=True)
    course_id = Column(String(64), default="")
    course_name = Column(String(128), default="")
    credit = Column(Float, default=1)
    teacher = Column(String(64), default="")
    campus = Column(String(64), default="")
    enroll_status = Column(String(16), default="normal")
    source_course_id = Column(String(64), nullable=True)
    approve_remark = Column(String(256), default="")

    timetable = relationship("Timetable", back_populates="courses")
    segments = relationship(
        "Segment",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Segment.id",
    )


class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    segment_id = Column(String(64), default="")
    week_start = Column(Integer, default=1)
    week_end = Column(Integer, default=16)
    week_type = Column(String(8), default="all")
    day_of_week = Column(Integer, default=1)
    period_start = Column(Integer, default=1)
    period_end = Column(Integer, default=1)
    room = Column(String(128), default="")
    mode = Column(String(16), default="offline")
    remark = Column(String(256), default="")

    course = relationship("Course", back_populates="segments")


class Organization(Base):
    """组织：有组织码、父子层级、管理员；成员关系在 OrganizationMember"""

    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    org_code = Column(String(16), unique=True, index=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    admin_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(String(64), default="")


class OrganizationMember(Base):
    """组织成员关系：pending 待审核 / approved 已加入 / rejected 已拒绝"""

    __tablename__ = "organization_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(16), default="pending")
    joined_at = Column(String(64), default="")
