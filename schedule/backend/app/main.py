"""课表 FastAPI 后端：SQLite + SQLAlchemy + Pydantic
提供课表列表、课程新增/修改、课表码导出/导入接口
"""

import base64
import hashlib
import json
import os
import secrets
import uuid
import zlib
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session, sessionmaker

from .models import (
    Base,
    Course,
    Organization,
    OrganizationMember,
    Segment,
    Timetable,
    User,
)
from .schemas import (
    CoursePayload,
    ImportPayload,
    LoginIn,
    OrgCreateIn,
    OrgJoinIn,
    OrgReviewIn,
    RegisterIn,
    TimetableIn,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEGACY_DATA_FILE = os.path.join(BASE_DIR, "data.json")

# MySQL（root/kissme，库名 timetable）
DB_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://root:kissme@127.0.0.1:3306/timetable?charset=utf8mb4",
)

engine = create_engine(DB_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base.metadata.create_all(engine)


def _backfill_share_codes() -> None:
    """给已有课表补 UUID 分享码"""
    with SessionLocal() as db:
        rows = db.scalars(select(Timetable)).all()
        changed = False
        for t in rows:
            if not t.share_code:
                t.share_code = str(uuid.uuid4())
                changed = True
        if changed:
            db.commit()


_backfill_share_codes()

app = FastAPI(title="课表 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- 工具 ----------------

def _gen_id(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:6].upper()}"


def _gen_org_code() -> str:
    """组织码：6 位可读短码，排除易混字符 0O1I"""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        code = "".join(secrets.choice(alphabet) for _ in range(6))
        with SessionLocal() as db:
            exists = db.scalar(select(Organization).where(Organization.org_code == code))
        if exists is None:
            return code


def _ensure_ids(course: Course) -> None:
    """课程/片段缺失或为空 id 时自动生成"""
    if not course.student_course_id:
        course.student_course_id = _gen_id("SC")
    if not course.course_id:
        course.course_id = _gen_id("C")
    for seg in course.segments:
        if not seg.segment_id:
            seg.segment_id = _gen_id("S")


# ---------------- 序列化 ----------------

def _segment_to_dict(seg: Segment) -> Dict[str, Any]:
    return {
        "segmentId": seg.segment_id,
        "weekStart": seg.week_start,
        "weekEnd": seg.week_end,
        "weekType": seg.week_type,
        "dayOfWeek": seg.day_of_week,
        "periodStart": seg.period_start,
        "periodEnd": seg.period_end,
        "room": seg.room,
        "mode": seg.mode,
        "remark": seg.remark,
    }


def _course_to_dict(course: Course) -> Dict[str, Any]:
    return {
        "studentCourseId": course.student_course_id,
        "courseId": course.course_id,
        "courseName": course.course_name,
        "credit": course.credit,
        "teacher": course.teacher,
        "campus": course.campus,
        "enrollStatus": course.enroll_status,
        "sourceCourseId": course.source_course_id,
        "approveRemark": course.approve_remark,
        "segments": [_segment_to_dict(s) for s in course.segments],
    }


def _timetable_to_dict(t: Timetable, db: Session) -> Dict[str, Any]:
    """序列化课表；同步导入（sync_enabled）时课程实时取自源课表"""
    courses = t.courses
    sync_from = None
    if t.sync_enabled and t.source_id:
        src = db.get(Timetable, t.source_id)
        if src is not None:
            courses = src.courses
            sync_from = {"id": src.id, "owner": src.owner}
    return {
        "id": t.id,
        "userId": t.user_id,
        "owner": t.owner,
        "shareCode": t.share_code or "",
        "sourceId": t.source_id,
        "syncEnabled": bool(t.sync_enabled),
        "syncFrom": sync_from,
        "enrollment": {
            "studentId": t.student_id,
            "studentName": t.student_name,
            "term": t.term,
            "courses": [_course_to_dict(c) for c in courses],
        },
    }


def _apply_course(db: Session, timetable: Timetable, payload: Any, course: Course | None = None) -> Course:
    """把请求数据落到 Course 行（新建或更新）；片段全量替换"""
    if course is None:
        course = Course()
        course.timetable = timetable
        db.add(course)  # 显式入 session，否则 cascade 可能不生效
    course.course_name = payload.courseName
    course.credit = payload.credit
    course.teacher = payload.teacher
    course.campus = payload.campus
    course.enroll_status = payload.enrollStatus
    course.source_course_id = payload.sourceCourseId
    course.approve_remark = payload.approveRemark
    course.course_id = payload.courseId or course.course_id
    _ensure_ids(course)

    course.segments.clear()
    for s in payload.segments:
        course.segments.append(
            Segment(
                segment_id=s.segmentId or _gen_id("S"),
                week_start=s.weekStart,
                week_end=s.weekEnd,
                week_type=s.weekType,
                day_of_week=s.dayOfWeek,
                period_start=s.periodStart,
                period_end=s.periodEnd,
                room=s.room,
                mode=s.mode,
                remark=s.remark,
            )
        )
    return course


# ---------------- 数据迁移（data.json → SQLite） ----------------

def _migrate_legacy(db: Session) -> None:
    count = db.scalar(select(Timetable).limit(1))
    if count is not None or not os.path.exists(LEGACY_DATA_FILE):
        return
    with open(LEGACY_DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    for entry in data:
        t = Timetable(
            owner=entry.get("owner", "我的"),
            student_id=entry.get("enrollment", {}).get("studentId", ""),
            student_name=entry.get("enrollment", {}).get("studentName", ""),
            term=entry.get("enrollment", {}).get("term", ""),
        )
        for c in entry.get("enrollment", {}).get("courses", []):
            t.courses.append(
                Course(
                    student_course_id=c.get("studentCourseId", _gen_id("SC")),
                    course_id=c.get("courseId", _gen_id("C")),
                    course_name=c.get("courseName", ""),
                    credit=c.get("credit", 1),
                    teacher=c.get("teacher", ""),
                    campus=c.get("campus", "主校区"),
                    enroll_status=c.get("enrollStatus", "normal"),
                    source_course_id=c.get("sourceCourseId"),
                    approve_remark=c.get("approveRemark", ""),
                )
            )
            for s in c.get("segments", []):
                t.courses[-1].segments.append(
                    Segment(
                        segment_id=s.get("segmentId", _gen_id("S")),
                        week_start=s.get("weekStart", 1),
                        week_end=s.get("weekEnd", 16),
                        week_type=s.get("weekType", "all"),
                        day_of_week=s.get("dayOfWeek", 1),
                        period_start=s.get("periodStart", 1),
                        period_end=s.get("periodEnd", 1),
                        room=s.get("room", ""),
                        mode=s.get("mode", "offline"),
                        remark=s.get("remark", ""),
                    )
                )
        db.add(t)
    db.commit()


with SessionLocal() as db:
    _migrate_legacy(db)


# ---------------- 课表码 ----------------

def _encode_code(timetable: Timetable) -> str:
    """把课表编码为课表码：紧凑 JSON → zlib 压缩 → base64url"""
    payload = {
        "owner": timetable.owner,
        "studentId": timetable.student_id,
        "studentName": timetable.student_name,
        "term": timetable.term,
        "courses": [_course_to_dict(c) for c in timetable.courses],
    }
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    compressed = zlib.compress(raw.encode("utf-8"), 9)
    return base64.urlsafe_b64encode(compressed).decode("ascii")


def _decode_code(code: str) -> Dict[str, Any]:
    """课表码解码为字典；失败抛 400"""
    try:
        compressed = base64.urlsafe_b64decode(code.encode("ascii"))
        raw = zlib.decompress(compressed).decode("utf-8")
        data = json.loads(raw)
        if not isinstance(data, dict) or "courses" not in data:
            raise ValueError("缺少 courses")
        return data
    except Exception:
        raise HTTPException(status_code=400, detail="课表码无效")


# ---------------- 账号 ----------------

_tokens: Dict[str, str] = {}  # token -> username（本地应用，内存态即可）


def _hash_password(pwd: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", pwd.encode("utf-8"), bytes.fromhex(salt), 100_000
    ).hex()
    return f"{salt}${digest}"


def _verify_password(pwd: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
        calc = hashlib.pbkdf2_hmac(
            "sha256", pwd.encode("utf-8"), bytes.fromhex(salt), 100_000
        ).hex()
        return secrets.compare_digest(calc, digest)
    except Exception:
        return False


def _user_to_dict(u: User) -> Dict[str, Any]:
    return {"id": u.id, "username": u.username}


@app.post("/api/auth/register")
def register(payload: RegisterIn) -> Dict[str, Any]:
    username = payload.username.strip()
    with SessionLocal() as db:
        exists = db.scalar(select(User).where(User.username == username))
        if exists is not None:
            raise HTTPException(status_code=409, detail="用户名已存在")
        user = User(
            username=username,
            password_hash=_hash_password(payload.password),
            created_at=str(uuid.uuid4()),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"user": _user_to_dict(user)}


@app.post("/api/auth/login")
def login(payload: LoginIn) -> Dict[str, Any]:
    username = payload.username.strip()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == username))
        if user is None or not _verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        token = secrets.token_urlsafe(24)
        _tokens[token] = username
        return {"token": token, "user": _user_to_dict(user)}


@app.get("/api/timetables")
def list_timetables() -> List[Dict[str, Any]]:
    with SessionLocal() as db:
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        return [_timetable_to_dict(t, db) for t in rows]


@app.post("/api/timetables")
def create_timetable(payload: TimetableIn) -> List[Dict[str, Any]]:
    """新建课表（可带课程，用于课表码导入）"""
    with SessionLocal() as db:
        t = Timetable(
            owner=payload.owner or "新课表",
            student_id=payload.studentId,
            student_name=payload.studentName,
            term=payload.term,
            user_id=payload.userId,
        )
        for c in payload.courses:
            _apply_course(db, t, c)
        db.add(t)
        db.commit()
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        return [_timetable_to_dict(x, db) for x in rows]


@app.delete("/api/timetables/{index}")
def delete_timetable(index: int) -> List[Dict[str, Any]]:
    with SessionLocal() as db:
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        if index < 0 or index >= len(rows):
            raise HTTPException(status_code=404, detail="课表不存在")
        db.delete(rows[index])
        db.commit()
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        return [_timetable_to_dict(x, db) for x in rows]


@app.post("/api/timetables/{index}/courses")
def add_course(index: int, payload: CoursePayload) -> List[Dict[str, Any]]:
    with SessionLocal() as db:
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        if index < 0 or index >= len(rows):
            raise HTTPException(status_code=404, detail="课表不存在")
        _apply_course(db, rows[index], payload.course)
        db.commit()
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        return [_timetable_to_dict(x, db) for x in rows]


@app.put("/api/timetables/{index}/courses/{student_course_id}")
def update_course(
    index: int, student_course_id: str, payload: CoursePayload
) -> List[Dict[str, Any]]:
    with SessionLocal() as db:
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        if index < 0 or index >= len(rows):
            raise HTTPException(status_code=404, detail="课表不存在")
        target = None
        for c in rows[index].courses:
            if c.student_course_id == student_course_id:
                target = c
                break
        if target is None:
            raise HTTPException(status_code=404, detail="课程不存在")
        _apply_course(db, rows[index], payload.course, target)
        db.commit()
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        return [_timetable_to_dict(x, db) for x in rows]


@app.get("/api/timetables/{index}/code")
def share_code(index: int) -> Dict[str, str]:
    """导出课表码（UUID，持久化在 share_code 字段）"""
    with SessionLocal() as db:
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        if index < 0 or index >= len(rows):
            raise HTTPException(status_code=404, detail="课表不存在")
        t = rows[index]
        if not t.share_code:
            t.share_code = str(uuid.uuid4())
            db.commit()
        return {"code": t.share_code}


@app.post("/api/timetables/import")
def import_timetable(payload: ImportPayload) -> Dict[str, Any]:
    """用课表码（UUID）导入：
    mode=copy 仅拷贝数据（独立课表）
    mode=sync 同步导入（引用源课表，实时跟随更新）
    """
    code = payload.code.strip()
    mode = payload.mode or "copy"
    with SessionLocal() as db:
        src = db.scalar(select(Timetable).where(Timetable.share_code == code))
        if src is None:
            # 兼容旧版 base64url 自包含码（只能拷贝）
            try:
                data = _decode_code(code)
            except HTTPException:
                raise HTTPException(status_code=404, detail="课表码不存在")
            t = Timetable(
                owner=data.get("owner") or "导入课表",
                student_id=data.get("studentId", ""),
                student_name=data.get("studentName", ""),
                term=data.get("term", ""),
                share_code=str(uuid.uuid4()),
            )
            from .schemas import CourseIn

            for c in data.get("courses", []):
                _apply_course(db, t, CourseIn.model_validate(c))
        elif mode == "sync":
            # 同步导入：不复制课程，记录源表引用，读取时实时展开
            t = Timetable(
                owner=(src.owner or "同步课表") + "·同步",
                student_id=src.student_id,
                student_name=src.student_name,
                term=src.term,
                share_code=str(uuid.uuid4()),
                source_id=src.id,
                sync_enabled=True,
            )
        else:
            # 仅拷贝：复制源课表为新课表（独立数据）
            t = Timetable(
                owner=src.owner or "导入课表",
                student_id=src.student_id,
                student_name=src.student_name,
                term=src.term,
                share_code=str(uuid.uuid4()),
            )
            for c in src.courses:
                _apply_course(db, t, CourseIn.model_validate(_course_to_dict(c)))
        db.add(t)
        db.commit()
        rows = db.scalars(select(Timetable).order_by(Timetable.id)).all()
        return {
            "timetables": [_timetable_to_dict(x, db) for x in rows],
            "index": len(rows) - 1,
        }


# ---------------- 组织系统 ----------------

def _current_user(request: Request) -> User:
    """从 Authorization: Bearer token 解析当前用户；未登录 401"""
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    username = _tokens.get(token)
    if not username:
        raise HTTPException(status_code=401, detail="请先登录")
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == username))
        if user is None:
            raise HTTPException(status_code=401, detail="账号不存在")
        return user


def _org_to_dict(o: Organization, db: Session) -> Dict[str, Any]:
    parent = db.get(Organization, o.parent_id) if o.parent_id else None
    admin = db.get(User, o.admin_user_id)
    return {
        "id": o.id,
        "name": o.name,
        "orgCode": o.org_code,
        "parentId": o.parent_id,
        "parentName": parent.name if parent else None,
        "adminUserId": o.admin_user_id,
        "adminName": admin.username if admin else "",
        "createdAt": o.created_at,
    }


def _member_to_dict(m: OrganizationMember, db: Session) -> Dict[str, Any]:
    user = db.get(User, m.user_id)
    org = db.get(Organization, m.org_id)
    is_admin = org is not None and org.admin_user_id == m.user_id
    return {
        "userId": m.user_id,
        "username": user.username if user else "",
        "orgId": m.org_id,
        "status": m.status,
        "role": "admin" if is_admin else "member",
        "joinedAt": m.joined_at,
    }


@app.post("/api/orgs/create")
def create_org(payload: OrgCreateIn, request: Request) -> Dict[str, Any]:
    user = _current_user(request)
    with SessionLocal() as db:
        parent = None
        if payload.parentId is not None:
            parent = db.get(Organization, payload.parentId)
            if parent is None:
                raise HTTPException(status_code=404, detail="父组织不存在")
            # 只有父组织管理员或成员可以创建子组织
            rel = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.org_id == parent.id,
                    OrganizationMember.user_id == user.id,
                )
            )
            if parent.admin_user_id != user.id and rel is None:
                raise HTTPException(status_code=403, detail="需要先加入父组织")
        org = Organization(
            name=payload.name.strip(),
            org_code=_gen_org_code(),
            parent_id=parent.id if parent else None,
            admin_user_id=user.id,
            created_at=str(uuid.uuid4()),
        )
        db.add(org)
        db.flush()
        db.add(
            OrganizationMember(
                org_id=org.id,
                user_id=user.id,
                status="approved",
                joined_at=str(uuid.uuid4()),
            )
        )
        db.commit()
        return _org_to_dict(org, db)


@app.get("/api/orgs/mine")
def my_orgs(request: Request) -> Dict[str, Any]:
    user = _current_user(request)
    with SessionLocal() as db:
        created = [
            _org_to_dict(o, db)
            for o in db.scalars(
                select(Organization).where(Organization.admin_user_id == user.id)
            ).all()
        ]
        rows = db.scalars(
            select(OrganizationMember).where(OrganizationMember.user_id == user.id)
        ).all()
        joined: List[Dict[str, Any]] = []
        pending: List[Dict[str, Any]] = []
        for m in rows:
            org = db.get(Organization, m.org_id)
            if org is None:
                continue
            d = _org_to_dict(org, db)
            d["status"] = m.status
            if m.status == "approved":
                joined.append(d)
            elif m.status == "pending":
                pending.append(d)
        return {"created": created, "joined": joined, "pending": pending}


@app.get("/api/orgs/tree")
def org_tree(request: Request) -> List[Dict[str, Any]]:
    """组织树：我创建/已加入的组织所在整棵树（含父子层级）"""
    user = _current_user(request)
    with SessionLocal() as db:
        all_orgs = db.scalars(select(Organization).order_by(Organization.id)).all()
        by_id = {o.id: o for o in all_orgs}
        related = set()
        for o in all_orgs:
            if o.admin_user_id == user.id:
                related.add(o.id)
        for m in db.scalars(
            select(OrganizationMember).where(OrganizationMember.user_id == user.id)
        ).all():
            if m.status == "approved":
                related.add(m.org_id)
        if not related:
            return []
        roots: set[int] = set()
        for rid in related:
            cur = by_id[rid]
            while cur.parent_id in by_id:
                cur = by_id[cur.parent_id]
            roots.add(cur.id)

        def build(oid: int) -> Dict[str, Any]:
            o = by_id[oid]
            node = _org_to_dict(o, db)
            node["children"] = [
                build(c.id) for c in all_orgs if c.parent_id == o.id
            ]
            return node

        return [build(r) for r in sorted(roots)]


@app.get("/api/orgs/{org_id}")
def org_detail(org_id: int, request: Request) -> Dict[str, Any]:
    user = _current_user(request)
    with SessionLocal() as db:
        org = db.get(Organization, org_id)
        if org is None:
            raise HTTPException(status_code=404, detail="组织不存在")
        members = db.scalars(
            select(OrganizationMember)
            .where(OrganizationMember.org_id == org_id)
            .order_by(OrganizationMember.id)
        ).all()
        children = db.scalars(
            select(Organization).where(Organization.parent_id == org_id)
        ).all()
        return {
            **_org_to_dict(org, db),
            "isAdmin": org.admin_user_id == user.id,
            "members": [_member_to_dict(m, db) for m in members],
            "children": [_org_to_dict(c, db) for c in children],
        }


@app.post("/api/orgs/join")
def join_org(payload: OrgJoinIn, request: Request) -> Dict[str, Any]:
    user = _current_user(request)
    code = payload.orgCode.strip().upper()
    with SessionLocal() as db:
        org = db.scalar(
            select(Organization).where(Organization.org_code == code)
        )
        if org is None:
            raise HTTPException(status_code=404, detail="组织码不存在")
        if org.admin_user_id == user.id:
            raise HTTPException(status_code=409, detail="你是该组织的管理员，无需加入")
        existing = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.org_id == org.id,
                OrganizationMember.user_id == user.id,
            )
        )
        if existing is not None:
            if existing.status == "approved":
                raise HTTPException(status_code=409, detail="已在该组织中")
            if existing.status == "pending":
                raise HTTPException(status_code=409, detail="申请已提交，等待审核")
            existing.status = "pending"
            db.commit()
            return _org_to_dict(org, db)
        db.add(
            OrganizationMember(
                org_id=org.id,
                user_id=user.id,
                status="pending",
                joined_at=str(uuid.uuid4()),
            )
        )
        db.commit()
        return _org_to_dict(org, db)


@app.post("/api/orgs/{org_id}/review")
def review_member(org_id: int, payload: OrgReviewIn, request: Request) -> Dict[str, Any]:
    user = _current_user(request)
    with SessionLocal() as db:
        org = db.get(Organization, org_id)
        if org is None:
            raise HTTPException(status_code=404, detail="组织不存在")
        if org.admin_user_id != user.id:
            raise HTTPException(status_code=403, detail="仅组织管理员可审核")
        member = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.org_id == org_id,
                OrganizationMember.user_id == payload.userId,
            )
        )
        if member is None:
            raise HTTPException(status_code=404, detail="申请不存在")
        if member.status != "pending":
            raise HTTPException(status_code=409, detail="该申请已处理")
        member.status = "approved" if payload.action == "approve" else "rejected"
        if member.status == "approved":
            member.joined_at = str(uuid.uuid4())
        db.commit()
        return _member_to_dict(member, db)


@app.delete("/api/orgs/{org_id}/members/{user_id}")
def remove_member(org_id: int, user_id: int, request: Request) -> Dict[str, Any]:
    user = _current_user(request)
    with SessionLocal() as db:
        org = db.get(Organization, org_id)
        if org is None:
            raise HTTPException(status_code=404, detail="组织不存在")
        if org.admin_user_id != user.id:
            raise HTTPException(status_code=403, detail="仅组织管理员可移除成员")
        if org.admin_user_id == user_id:
            raise HTTPException(status_code=409, detail="不能移除管理员")
        member = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.org_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        )
        if member is None:
            raise HTTPException(status_code=404, detail="成员不存在")
        db.delete(member)
        db.commit()
        return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8010, reload=True)
