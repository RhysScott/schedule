import { computed, reactive, ref } from "vue";
import {
  addCourse as apiAddCourse,
  deleteTimetable as apiDeleteTimetable,
  fetchShareCode as apiFetchShareCode,
  fetchTimetables,
  importTimetable as apiImportTimetable,
  updateCourse as apiUpdateCourse,
} from "@/api";
import { isLoggedIn } from "@/composables/useAuth";
import type {
  CourseSegment,
  RenderCourse,
  StudentCourse,
  StudentEnrollment,
  TimetableSettings,
} from "@/types/course";

const SETTINGS_STORAGE_KEY = "timetable-settings-v1";

/** 默认配置 */
function defaultSettings(): TimetableSettings {
  return {
    showWeekend: false,
    // 特殊状态与线上课的显示：true = 置灰 + 状态角标，false = 正常彩色
    specialDisplay: {
      exempt: true,
      replaced: true,
      dropped: true,
      online: true,
      hybrid: false,
    },
  };
}

/** 从 localStorage 读取已保存配置（无则用默认） */
function loadSettings(): TimetableSettings {
  const defaults = defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Partial<TimetableSettings>;
    return {
      ...defaults,
      ...saved,
      specialDisplay: {
        ...defaults.specialDisplay,
        ...(saved.specialDisplay ?? {}),
      },
    };
  } catch {
    return defaults;
  }
}

/** 保存配置到 localStorage */
export function saveSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/** 课表全局配置（响应式：设置页修改后自动生效） */
export const settings = reactive<TimetableSettings>(loadSettings());

/** 今天星期几（1=周一 ... 7=周日），用于高亮 */
export const todayDayOfWeek = (() => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
})();

/** 学生学期课表数据（课程为中心 + 时间段片段 + 选课状态）——后端未启动时的内置回退数据 */
const FALLBACK_ENROLLMENT: StudentEnrollment = {
  studentId: "ST001",
  studentName: "张三",
  term: "2026秋季学期",
  termStartDate: "2026-09-14",
  totalWeeks: 16,
  courses: [
    {
      studentCourseId: "SC001",
      courseId: "C001",
      courseName: "程序设计实验",
      credit: 2,
      teacher: "王老师",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S001",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 1,
          periodStart: 1,
          periodEnd: 3,
          room: "A3-301",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC002",
      courseId: "C002",
      courseName: "数模电",
      credit: 4,
      teacher: "赵文革",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0021",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 1,
          periodStart: 6,
          periodEnd: 6,
          room: "E5-305",
          mode: "offline",
          remark: "",
        },
        {
          segmentId: "S0022",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 3,
          periodStart: 11,
          periodEnd: 11,
          room: "教室位置乱死人",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC003",
      courseId: "C003",
      courseName: "离散",
      credit: 3,
      teacher: "向王炜钰",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0031",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 1,
          periodStart: 8,
          periodEnd: 8,
          room: "E5-215",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC004",
      courseId: "C004",
      courseName: "希佳佳",
      credit: 2,
      teacher: "周孙南",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0041",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 1,
          periodStart: 11,
          periodEnd: 11,
          room: "E5-108",
          mode: "offline",
          remark: "",
        },
        {
          segmentId: "S0042",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 5,
          periodStart: 4,
          periodEnd: 4,
          room: "A6-206",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC005",
      courseId: "C005",
      courseName: "51",
      credit: 4,
      teacher: "张雪松",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0051",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 2,
          periodStart: 1,
          periodEnd: 1,
          room: "A4-105,C3-305",
          mode: "offline",
          remark: "",
        },
        {
          segmentId: "S0052",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 3,
          periodStart: 6,
          periodEnd: 6,
          room: "E5-221,C3-305",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC006",
      courseId: "C006",
      courseName: "Linux",
      credit: 3,
      teacher: "施刚",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0061",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 2,
          periodStart: 8,
          periodEnd: 8,
          room: "A6-205",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC007",
      courseId: "C007",
      courseName: "数学家的故事",
      credit: 1,
      teacher: "",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0071",
          weekStart: 1,
          weekEnd: 8,
          weekType: "all",
          dayOfWeek: 2,
          periodStart: 11,
          periodEnd: 11,
          room: "E5-211",
          mode: "offline",
          remark: "",
        },
        {
          segmentId: "S0072",
          weekStart: 9,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 2,
          periodStart: 11,
          periodEnd: 11,
          room: "",
          mode: "online",
          remark: "线上授课",
        },
      ],
    },
    {
      studentCourseId: "SC008",
      courseId: "C008",
      courseName: "大学物理",
      credit: 3,
      teacher: "刘老师",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0081",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 3,
          periodStart: 1,
          periodEnd: 2,
          room: "B5-201",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC009",
      courseId: "C009",
      courseName: "习概",
      credit: 3,
      teacher: "",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0091",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 4,
          periodStart: 3,
          periodEnd: 3,
          room: "E5-221",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC010",
      courseId: "C010",
      courseName: "毛概",
      credit: 3,
      teacher: "",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0101",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 4,
          periodStart: 6,
          periodEnd: 6,
          room: "E5-208",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC011",
      courseId: "C011",
      courseName: "体育",
      credit: 1,
      teacher: "",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0111",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 4,
          periodStart: 8,
          periodEnd: 8,
          room: "",
          mode: "offline",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC012",
      courseId: "C012",
      courseName: "毛概",
      credit: 2,
      teacher: "",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0121",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 4,
          periodStart: 10,
          periodEnd: 10,
          room: "",
          mode: "online",
          remark: "线上授课",
        },
      ],
    },
    {
      studentCourseId: "SC013",
      courseId: "C013",
      courseName: "大英",
      credit: 4,
      teacher: "方海蘇",
      campus: "主校区",
      enrollStatus: "exempt",
      sourceCourseId: null,
      approveRemark: "已审批免修",
      segments: [
        {
          segmentId: "S0131",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 4,
          periodStart: 11,
          periodEnd: 11,
          room: "",
          mode: "online",
          remark: "",
        },
      ],
    },
    {
      studentCourseId: "SC014",
      courseId: "C014",
      courseName: "习概",
      credit: 2,
      teacher: "",
      campus: "主校区",
      enrollStatus: "normal",
      sourceCourseId: null,
      approveRemark: "",
      segments: [
        {
          segmentId: "S0141",
          weekStart: 1,
          weekEnd: 16,
          weekType: "all",
          dayOfWeek: 5,
          periodStart: 10,
          periodEnd: 10,
          room: "",
          mode: "online",
          remark: "线上授课",
        },
      ],
    },
  ],
};

/** 渲染用：一天的课程数据 */
export interface DaySchedule {
  weekText: string;
  dateText: string;
  courseMap: Record<number, RenderCourse>;
}

const weekTexts = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];

/** 判断某时间段片段是否覆盖当前周（含单双周） */
function isSegmentInWeek(seg: CourseSegment, week: number): boolean {
  if (week < seg.weekStart || week > seg.weekEnd) return false;
  if (seg.weekType === "all") return true;
  if (seg.weekType === "odd") return week % 2 === 1;
  if (seg.weekType === "even") return week % 2 === 0;
  return false;
}

/** 一份课表：owner 是课表标签（如"我的"/"宝宝"），enrollment 是该课表数据 */
export interface TimetableEntry {
  owner: string;
  enrollment: StudentEnrollment;
  /** 同步导入：sourceId 指向被同步的源课表；syncFrom 为源课表信息（后端返回） */
  sourceId?: number | null;
  syncEnabled?: boolean;
  syncFrom?: { id: number; owner: string } | null;
}

/**
 * 多份课表：追加一份就把数据放到这里，
 * 右上角标签 + 切换按钮会自动生效
 */
const FALLBACK_TIMETABLES: TimetableEntry[] = [
  { owner: "我的", enrollment: FALLBACK_ENROLLMENT },
  {
    // TODO: 示例课表，替换成宝宝的真实课表数据
    owner: "宝宝",
    enrollment: {
      studentId: "ST002",
      studentName: "宝宝",
      term: "2026秋季学期",
      termStartDate: "2026-09-14",
      totalWeeks: 16,
      courses: [
        {
          studentCourseId: "SCB01",
          courseId: "CB01",
          courseName: "语言课",
          credit: 2,
          teacher: "陈老师",
          campus: "主校区",
          enrollStatus: "normal",
          sourceCourseId: null,
          approveRemark: "",
          segments: [
            {
              segmentId: "SB011",
              weekStart: 1,
              weekEnd: 16,
              weekType: "all",
              dayOfWeek: 1,
              periodStart: 1,
              periodEnd: 2,
              room: "A-101",
              mode: "offline",
              remark: "",
            },
          ],
        },
        {
          studentCourseId: "SCB02",
          courseId: "CB02",
          courseName: "美术课",
          credit: 2,
          teacher: "林老师",
          campus: "主校区",
          enrollStatus: "normal",
          sourceCourseId: null,
          approveRemark: "",
          segments: [
            {
              segmentId: "SB021",
              weekStart: 1,
              weekEnd: 16,
              weekType: "all",
              dayOfWeek: 2,
              periodStart: 3,
              periodEnd: 3,
              room: "画室",
              mode: "offline",
              remark: "",
            },
          ],
        },
        {
          studentCourseId: "SCB03",
          courseId: "CB03",
          courseName: "数学思维",
          credit: 2,
          teacher: "周老师",
          campus: "主校区",
          enrollStatus: "normal",
          sourceCourseId: null,
          approveRemark: "",
          segments: [
            {
              segmentId: "SB031",
              weekStart: 1,
              weekEnd: 16,
              weekType: "all",
              dayOfWeek: 3,
              periodStart: 1,
              periodEnd: 2,
              room: "B-203",
              mode: "offline",
              remark: "",
            },
          ],
        },
        {
          studentCourseId: "SCB04",
          courseId: "CB04",
          courseName: "体智能",
          credit: 2,
          teacher: "刘教练",
          campus: "主校区",
          enrollStatus: "normal",
          sourceCourseId: null,
          approveRemark: "",
          segments: [
            {
              segmentId: "SB041",
              weekStart: 1,
              weekEnd: 16,
              weekType: "all",
              dayOfWeek: 4,
              periodStart: 4,
              periodEnd: 4,
              room: "操场",
              mode: "offline",
              remark: "",
            },
          ],
        },
        {
          studentCourseId: "SCB05",
          courseId: "CB05",
          courseName: "音乐课",
          credit: 2,
          teacher: "王老师",
          campus: "主校区",
          enrollStatus: "normal",
          sourceCourseId: null,
          approveRemark: "",
          segments: [
            {
              segmentId: "SB051",
              weekStart: 1,
              weekEnd: 16,
              weekType: "all",
              dayOfWeek: 5,
              periodStart: 2,
              periodEnd: 2,
              room: "音乐室",
              mode: "offline",
              remark: "",
            },
          ],
        },
      ],
    },
  },
];

/* ============ 双数据源：未登录本地 / 登录云端 ============ */

/** 空课表模板：不含任何个人信息，新建/删空后使用 */
function emptyTimetable(owner = "我的"): TimetableEntry {
  return {
    owner,
    enrollment: {
      studentId: "",
      studentName: "",
      term: "",
      termStartDate: "",
      totalWeeks: 16,
      courses: [],
    },
  };
}

/**
 * 本地课表持久化 key（未登录模式，数据只存在本地）
 * v2：作废旧版首次使用自动写入的内置张三/宝宝示例数据，
 * 未登录时不再展示任何他人/示例个人信息
 */
const LOCAL_STORAGE_KEY = "timetables-local-v2";

function loadLocalTimetables(): TimetableEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length) return data;
    }
  } catch {
    /* 忽略损坏数据 */
  }
  // 首次使用：空列表（未登录不展示任何他人/示例个人信息）
  return [];
}

function saveLocalTimetables() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localTimetables.value));
}

/** 本地数据 */
const localTimetables = ref<TimetableEntry[]>(loadLocalTimetables());
/** 云端数据（登录后；初始为空，加载完成后填充） */
const cloudTimetables = ref<TimetableEntry[]>([]);

/** 课表列表：登录后走云端，未登录走本地（本地不联网、不上传） */
export const timetables = computed<TimetableEntry[]>({
  get: () => (isLoggedIn.value ? cloudTimetables.value : localTimetables.value),
  set: (v) => {
    if (isLoggedIn.value) cloudTimetables.value = v;
    else {
      localTimetables.value = v;
      saveLocalTimetables();
    }
  },
});

/** 从后端加载全部课表（仅登录后；未登录保持本地数据） */
export async function loadTimetables() {
  if (!isLoggedIn.value) return;
  try {
    const data = await fetchTimetables();
    if (data.length) {
      cloudTimetables.value = data;
      if (currentTimetableIndex.value >= data.length) {
        currentTimetableIndex.value = 0;
      }
    }
  } catch (e) {
    console.warn("云端课表加载失败：", e);
  }
}

/** 登录态切换后校正下标 */
export function syncTimetableSource() {
  if (currentTimetableIndex.value >= timetables.value.length) {
    currentTimetableIndex.value = Math.max(0, timetables.value.length - 1);
  }
}

/** 本地 id 生成（不与云端冲突） */
function genId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${Date.now().toString(36).toUpperCase()}${rand}`;
}

/** 深拷贝当前列表（本地修改基于副本，改完整体写回） */
function cloneList(): TimetableEntry[] {
  return JSON.parse(JSON.stringify(timetables.value)) as TimetableEntry[];
}

/* ---------- 本地模式：zlib 自包含课表码（base64url + deflate + json） ---------- */

async function compressText(text: string): Promise<string> {
  const cs = new CompressionStream("deflate");
  const stream = new Blob([text], { type: "text/plain" })
    .stream()
    .pipeThrough(cs);
  const buf = await new Response(stream).arrayBuffer();
  let bin = "";
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function decompressCode(code: string): Promise<any> {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  const text = await new Response(stream).text();
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.courses)) throw new Error("课表码无效");
  return data;
}

/* ---------- 增删改/导入导出封装（自动路由本地/云端） ---------- */

/** 添加课程 */
export async function addCourse(
  timetableIndex: number,
  course: Partial<StudentCourse>,
): Promise<TimetableEntry[]> {
  if (isLoggedIn.value) return apiAddCourse(timetableIndex, course);
  const list = cloneList();
  const t = list[timetableIndex]!;
  t.enrollment.courses.push({
    studentCourseId: genId("SC"),
    courseId: genId("C"),
    courseName: course.courseName ?? "",
    credit: course.credit ?? 1,
    teacher: course.teacher ?? "",
    campus: course.campus ?? "主校区",
    enrollStatus: course.enrollStatus ?? "normal",
    sourceCourseId: null,
    approveRemark: "",
    segments: (course.segments ?? []).map((s) => ({
      segmentId: s.segmentId || genId("S"),
      weekStart: s.weekStart,
      weekEnd: s.weekEnd,
      weekType: s.weekType,
      dayOfWeek: s.dayOfWeek,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      room: s.room ?? "",
      mode: s.mode ?? "offline",
      remark: s.remark ?? "",
    })),
  });
  timetables.value = list;
  return list;
}

/** 修改课程（按 studentCourseId） */
export async function updateCourse(
  timetableIndex: number,
  studentCourseId: string,
  course: Partial<StudentCourse>,
): Promise<TimetableEntry[]> {
  if (isLoggedIn.value) return apiUpdateCourse(timetableIndex, studentCourseId, course);
  const list = cloneList();
  const t = list[timetableIndex]!;
  const target = t.enrollment.courses.find((c) => c.studentCourseId === studentCourseId);
  if (!target) throw new Error("课程不存在");
  if (course.courseName !== undefined) target.courseName = course.courseName;
  if (course.credit !== undefined) target.credit = course.credit;
  if (course.teacher !== undefined) target.teacher = course.teacher;
  if (course.enrollStatus !== undefined) target.enrollStatus = course.enrollStatus;
  if (course.segments) {
    target.segments = course.segments.map((s) => ({
      segmentId: s.segmentId || genId("S"),
      weekStart: s.weekStart,
      weekEnd: s.weekEnd,
      weekType: s.weekType,
      dayOfWeek: s.dayOfWeek,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      room: s.room ?? "",
      mode: s.mode ?? "offline",
      remark: s.remark ?? "",
    }));
  }
  timetables.value = list;
  return list;
}

/** 删除课表 */
export async function deleteTimetable(timetableIndex: number): Promise<TimetableEntry[]> {
  if (isLoggedIn.value) return apiDeleteTimetable(timetableIndex);
  const list = cloneList();
  list.splice(timetableIndex, 1);
  if (!list.length) {
    list.push(emptyTimetable());
  }
  timetables.value = list;
  return list;
}

/** 导出课表码：登录后导出云端 UUID 码；本地模式导出 zlib 自包含码 */
export async function fetchShareCode(timetableIndex: number): Promise<string> {
  if (isLoggedIn.value) return apiFetchShareCode(timetableIndex);
  const t = timetables.value[timetableIndex]!;
  const payload = {
    owner: t.owner,
    studentId: t.enrollment.studentId,
    studentName: t.enrollment.studentName,
    term: t.enrollment.term,
    courses: t.enrollment.courses,
  };
  return compressText(JSON.stringify(payload));
}

/** 导入课表：登录后走云端（copy 拷贝 / sync 同步）；本地模式仅支持自包含码拷贝 */
export async function importTimetable(
  code: string,
  mode: "copy" | "sync" = "copy",
): Promise<{ timetables: TimetableEntry[]; index: number }> {
  if (isLoggedIn.value) return apiImportTimetable(code, mode);
  if (mode === "sync") throw new Error("同步导入需要登录后使用");
  const data = await decompressCode(code);
  const list = cloneList();
  list.push({
    owner: data.owner || "导入课表",
    enrollment: {
      studentId: data.studentId ?? "",
      studentName: data.studentName ?? "",
      term: data.term ?? "",
      termStartDate: data.termStartDate ?? "",
      totalWeeks: Number(data.totalWeeks) || 16,
      courses: (data.courses ?? []).map((c: any) => ({
        ...c,
        studentCourseId: c.studentCourseId || genId("SC"),
        courseId: c.courseId || genId("C"),
        segments: (c.segments ?? []).map((s: any) => ({
          ...s,
          segmentId: s.segmentId || genId("S"),
        })),
      })),
    },
  });
  timetables.value = list;
  return { timetables: list, index: list.length - 1 };
}

/** 当前展示的课表下标 */
export const currentTimetableIndex = ref(0);

/** 当前课表数据（渲染统一使用它；空列表时回退到空对象避免崩溃） */
export const activeEnrollment = computed<StudentEnrollment>(() => {
  const t = timetables.value[currentTimetableIndex.value];
  if (t) return t.enrollment;
  const first = timetables.value[0];
  return (
    first?.enrollment ?? {
      studentId: "",
      studentName: "",
      term: "",
      termStartDate: "",
      totalWeeks: 16,
      courses: [],
    }
  ) as StudentEnrollment;
});

/* ============ 学期配置跟随当前课表 ============ */

/** 当前课表的学期开始日期（第1周周一），无课表时用默认值 */
export const currentTermStartDate = computed(() => {
  const t = timetables.value[currentTimetableIndex.value];
  return t?.enrollment.termStartDate || "2026-09-14";
});

/** 当前课表的教学周总数 */
export const currentTotalWeeks = computed(() => {
  const t = timetables.value[currentTimetableIndex.value];
  return t?.enrollment.totalWeeks || 16;
});

/** 今天所在的学期周（按当前课表学期推算，不随切换变化） */
export const todayWeek = computed(() => {
  const start = new Date(`${currentTermStartDate.value}T00:00:00`);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), currentTotalWeeks.value);
});

/** 当前显示的周次（可切换，1 ~ 教学周总数） */
export const currentWeek = ref(todayWeek.value);

/** 回到今天所在的周（切换课表/学期变化后调用） */
export function goToTodayWeek() {
  currentWeek.value = todayWeek.value;
}

/** 切换周次：delta = ±1，限制在 1 ~ 教学周总数 */
export function changeWeek(delta: number) {
  currentWeek.value = Math.min(
    Math.max(currentWeek.value + delta, 1),
    currentTotalWeeks.value,
  );
}

/** 当前教学周（第 currentWeek 周）周一至周日的日期 */
function getWeekDates(): string[] {
  const start = new Date(`${currentTermStartDate.value}T00:00:00`);
  const monday = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + (currentWeek.value - 1) * 7,
  );
  const dates = ["", "", "", "", "", "", "", ""];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i - 1,
    );
    dates[i] = `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return dates;
}

/** 当前课表标签 */
export const currentOwner = computed(() => {
  const t = timetables.value[currentTimetableIndex.value];
  return t ? t.owner : (timetables.value[0]?.owner ?? "");
});

/** 当前课表完整对象（含同步标记等元信息） */
export const activeTimetable = computed(
  () => timetables.value[currentTimetableIndex.value] ?? null,
);

/** 切换课表：循环切换；只有一份时不生效 */
export function switchTimetable() {
  if (timetables.value.length < 2) return;
  currentTimetableIndex.value =
    (currentTimetableIndex.value + 1) % timetables.value.length;
}

/**
 * 当前周课表：把所有有时间段的课（含免修/置换/退课）按 currentWeek 展开，
 * 特殊状态由渲染层置灰 + 标记
 */
const weekSchedule = computed<DaySchedule[]>(() => {
  const dates = getWeekDates();
  const days: DaySchedule[] = weekTexts.map((t, i) => ({
    weekText: t,
    dateText: dates[i] ?? "",
    courseMap: {},
  }));
  for (const sc of activeEnrollment.value.courses) {
    for (const seg of sc.segments) {
      if (!isSegmentInWeek(seg, currentWeek.value)) continue;
      const day = days[seg.dayOfWeek]!;
      day.courseMap[seg.periodStart] = {
        studentCourseId: sc.studentCourseId,
        name: sc.courseName,
        teacher: sc.teacher,
        room: seg.room,
        mode: seg.mode,
        remark: seg.remark,
        status: sc.enrollStatus,
        startPeriod: seg.periodStart,
        endPeriod: seg.periodEnd,
      };
    }
  }
  return days;
});

export function useTimetable() {
  /** 可见的天（按设置过滤周末） */
  const visibleDays = computed(() => {
    const days = weekSchedule.value.filter((i) => i.weekText);
    if (settings.showWeekend) return days;
    return days.filter((d) => d.weekText !== "周六" && d.weekText !== "周日");
  });

  /* ---------- 固定节次表（成都东软学院）：每节 40 分钟、课间 10 分钟，
     上午 5 节 08:20 起、下午 5 节 14:00 起、晚上 4 节 19:00 起，共 14 节 ---------- */
  const PERIOD_DURATION = 40;
  const BREAK_DURATION = 10;
  const FIXED_PERIODS: [number, number][] = (() => {
    const list: [number, number][] = [];
    const pushRange = (
      start: { hour: number; minute: number },
      count: number,
    ) => {
      let h = start.hour;
      let m = start.minute;
      for (let i = 0; i < count; i++) {
        list.push([h, m]);
        const total = h * 60 + m + PERIOD_DURATION + BREAK_DURATION;
        h = Math.floor(total / 60);
        m = total % 60;
      }
    };
    pushRange({ hour: 8, minute: 20 }, 5);
    pushRange({ hour: 14, minute: 0 }, 5);
    pushRange({ hour: 19, minute: 0 }, 4);
    return list;
  })();

  const periodList = computed<[number, number][]>(() => FIXED_PERIODS);

  /** 根据开始时分计算下课时间（每节固定 40 分钟） */
  const getEndTime = (startHour: number, startMinute: number) => {
    const totalMin = startHour * 60 + startMinute + PERIOD_DURATION;
    const endHour = Math.floor(totalMin / 60);
    const endMin = totalMin % 60;
    return `${endHour}:${String(endMin).padStart(2, "0")}`;
  };

  /**
   * 行列表：上午节次 + 午休 + 下午节次 + 晚休 + 晚上节次
   * 午休/晚休为跨整行的特殊行
   */
  const rowList = computed<TimetableRow[]>(() => {
    const pl = periodList.value;
    const rows: TimetableRow[] = [];
    const m = 5;
    const a = 5;

    // 上午
    pl.slice(0, m).forEach((p, i) =>
      rows.push({ type: "period", sIndex: i, period: p }),
    );
    // 午休
    rows.push({
      type: "break",
      label: "午休",
    });
    // 下午
    pl.slice(m, m + a).forEach((p, i) =>
      rows.push({ type: "period", sIndex: m + i, period: p }),
    );
    // 晚休
    rows.push({
      type: "break",
      label: "晚休",
    });
    // 晚上
    pl.slice(m + a).forEach((p, i) =>
      rows.push({ type: "period", sIndex: m + a + i, period: p }),
    );
    return rows;
  });

  return { visibleDays, periodList, rowList, getEndTime, weekSchedule };
}

/** 课表行：节次行 或 午休/晚休行 */
export type TimetableRow =
  | { type: "period"; sIndex: number; period: [number, number] }
  | { type: "break"; label: string };
