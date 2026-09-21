"""Pydantic 请求模型：课程 / 片段 / 课表（字段与前端数据模型驼峰命名对齐）"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SegmentIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    segmentId: Optional[str] = None
    weekStart: int = 1
    weekEnd: int = 16
    weekType: str = "all"
    dayOfWeek: int = 1
    periodStart: int = 1
    periodEnd: int = 1
    room: str = ""
    mode: str = "offline"
    remark: str = ""


class CourseIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    studentCourseId: Optional[str] = None
    courseId: Optional[str] = None
    courseName: str
    credit: float = Field(default=1, ge=0)
    teacher: str = ""
    campus: str = "主校区"
    enrollStatus: str = "normal"
    sourceCourseId: Optional[str] = None
    approveRemark: str = ""
    segments: List[SegmentIn] = Field(default_factory=list)


class CoursePayload(BaseModel):
    course: CourseIn


class TimetableIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    owner: str = ""
    studentId: str = ""
    studentName: str = ""
    term: str = ""
    termStartDate: str = ""
    totalWeeks: int = 16
    userId: Optional[int] = None
    courses: List[CourseIn] = Field(default_factory=list)


class RegisterIn(BaseModel):
    username: str = Field(min_length=2, max_length=32)
    password: str = Field(min_length=4, max_length=64)


class LoginIn(BaseModel):
    username: str
    password: str


class ImportPayload(BaseModel):
    """导入课表码请求"""

    code: str
    mode: str = "copy"  # copy 仅拷贝数据 / sync 同步导入（实时跟随源课表）


class OrgCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    parentId: Optional[int] = None


class OrgJoinIn(BaseModel):
    orgCode: str = Field(min_length=4, max_length=16)


class OrgReviewIn(BaseModel):
    """管理员审核成员申请"""

    userId: int
    action: str = Field(pattern="^(approve|reject)$")
