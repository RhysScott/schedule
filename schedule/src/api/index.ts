import type { StudentCourse } from "@/types/course";
import type { TimetableEntry } from "@/composables/useTimetable";
import { getToken } from "@/composables/useAuth";

/** 课表 API 封装：FastAPI 后端（vite 代理 /api → localhost:8010） */

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`请求失败 ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json() as Promise<T>;
}

/** 统一请求头：带 Bearer token */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...(extra ?? {}) };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** 获取全部课表（后端为权威数据源） */
export async function fetchTimetables(): Promise<TimetableEntry[]> {
  const res = await fetch("/api/timetables", { headers: authHeaders() });
  return handle<TimetableEntry[]>(res);
}

/** 添加课程（timetableIndex 为课表下标），返回更新后的全部课表 */
export async function addCourse(
  timetableIndex: number,
  course: Partial<StudentCourse>,
): Promise<TimetableEntry[]> {
  const res = await fetch(`/api/timetables/${timetableIndex}/courses`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ course }),
  });
  return handle<TimetableEntry[]>(res);
}

/** 修改课程（按 studentCourseId），返回更新后的全部课表 */
export async function updateCourse(
  timetableIndex: number,
  studentCourseId: string,
  course: Partial<StudentCourse>,
): Promise<TimetableEntry[]> {
  const res = await fetch(
    `/api/timetables/${timetableIndex}/courses/${studentCourseId}`,
    {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ course }),
    },
  );
  return handle<TimetableEntry[]>(res);
}

/** 导出课表码 */
export async function fetchShareCode(timetableIndex: number): Promise<string> {
  const res = await fetch(`/api/timetables/${timetableIndex}/code`);
  const data = await handle<{ code: string }>(res);
  return data.code;
}

/** 用课表码导入课表
 * mode=copy 仅拷贝数据（独立课表，之后互不影响）
 * mode=sync 同步导入（引用源课表，源课表变化实时跟随）
 */
export async function importTimetable(
  code: string,
  mode: "copy" | "sync" = "copy",
): Promise<{
  timetables: TimetableEntry[];
  index: number;
}> {
  const res = await fetch("/api/timetables/import", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ code, mode }),
  });
  return handle<{ timetables: TimetableEntry[]; index: number }>(res);
}

/** 注册账号 */
export async function registerAccount(
  username: string,
  password: string,
): Promise<{ user: { id: number; username: string } }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ username, password }),
  });
  return handle<{ user: { id: number; username: string } }>(res);
}

/** 登录账号 */
export async function loginAccount(
  username: string,
  password: string,
): Promise<{ token: string; user: { id: number; username: string } }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ username, password }),
  });
  return handle<{ token: string; user: { id: number; username: string } }>(res);
}

/** 删除课表 */
export async function deleteTimetable(
  timetableIndex: number,
): Promise<TimetableEntry[]> {
  const res = await fetch(`/api/timetables/${timetableIndex}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle<TimetableEntry[]>(res);
}

/* ================= 组织系统 ================= */

export interface OrgInfo {
  id: number;
  name: string;
  orgCode: string;
  parentId: number | null;
  parentName: string | null;
  adminUserId: number;
  adminName: string;
  createdAt: string;
  status?: "approved" | "pending" | "rejected";
}

export interface OrgMember {
  userId: number;
  username: string;
  orgId: number;
  status: "approved" | "pending" | "rejected";
  role: "admin" | "member";
  joinedAt: string;
}

export interface OrgDetail extends OrgInfo {
  isAdmin: boolean;
  members: OrgMember[];
  children: OrgInfo[];
}

export interface OrgTreeNode extends OrgInfo {
  children: OrgTreeNode[];
}

/** 我的组织：我创建的 + 已加入的 + 待审核的 */
export async function fetchMyOrgs(): Promise<{
  created: OrgInfo[];
  joined: OrgInfo[];
  pending: OrgInfo[];
}> {
  const res = await fetch("/api/orgs/mine", { headers: authHeaders() });
  return handle<{ created: OrgInfo[]; joined: OrgInfo[]; pending: OrgInfo[] }>(res);
}

/** 组织树（我相关组织所在整棵树） */
export async function fetchOrgTree(): Promise<OrgTreeNode[]> {
  const res = await fetch("/api/orgs/tree", { headers: authHeaders() });
  return handle<OrgTreeNode[]>(res);
}

/** 组织详情（成员 + 子组织） */
export async function fetchOrgDetail(orgId: number): Promise<OrgDetail> {
  const res = await fetch(`/api/orgs/${orgId}`, { headers: authHeaders() });
  return handle<OrgDetail>(res);
}

/** 创建组织（parentId 可选，为 null 表示顶级组织） */
export async function createOrg(
  name: string,
  parentId: number | null = null,
): Promise<OrgInfo> {
  const res = await fetch("/api/orgs/create", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, parentId }),
  });
  return handle<OrgInfo>(res);
}

/** 通过组织码加入组织（需管理员审核） */
export async function joinOrg(orgCode: string): Promise<OrgInfo> {
  const res = await fetch("/api/orgs/join", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ orgCode }),
  });
  return handle<OrgInfo>(res);
}

/** 审核成员：action = approve | reject */
export async function reviewMember(
  orgId: number,
  userId: number,
  action: "approve" | "reject",
): Promise<OrgMember> {
  const res = await fetch(`/api/orgs/${orgId}/review`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ userId, action }),
  });
  return handle<OrgMember>(res);
}

/** 移除成员（管理员） */
export async function removeMember(
  orgId: number,
  userId: number,
): Promise<void> {
  const res = await fetch(`/api/orgs/${orgId}/members/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle<void>(res);
}
