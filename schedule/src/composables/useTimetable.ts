import { computed, reactive, ref } from "vue";
import type {
  CourseSegment,
  RenderCourse,
  StudentEnrollment,
  TimetableSettings,
} from "@/types/course";

const SETTINGS_STORAGE_KEY = "timetable-settings-v1";

/** 默认配置 */
function defaultSettings(): TimetableSettings {
  return {
    durationOfEachPeriod: 40,
    breakDuration: 10,
    numberOfMorningPeriods: 5,
    numberOfAfternoonPeriods: 5,
    numberOfNightPeriods: 4,
    morningFirstStart: { hour: 8, minute: 20 },
    afternoonFirstStart: { hour: 14, minute: 0 },
    nightFirstStart: { hour: 19, minute: 0 },
    showWeekend: false,
    termStartDate: "2026-09-14", // 学期开始日期（第1周周一）
    totalWeeks: 16, // 教学周总数
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

/** 今天所在的学期周（按学期开始日期推算，不随切换变化） */
export const todayWeek = computed(() => {
  const start = new Date(`${settings.termStartDate}T00:00:00`);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), settings.totalWeeks);
});

/** 当前显示的周次（可切换，1 ~ 教学周总数） */
export const currentWeek = ref(todayWeek.value);

/** 回到今天所在的周（设置学期日期后调用） */
export function goToTodayWeek() {
  currentWeek.value = todayWeek.value;
}

/** 切换周次：delta = ±1，限制在 1 ~ 教学周总数 */
export function changeWeek(delta: number) {
  currentWeek.value = Math.min(
    Math.max(currentWeek.value + delta, 1),
    settings.totalWeeks,
  );
}

/** 今天星期几（1=周一 ... 7=周日），用于高亮 */
export const todayDayOfWeek = (() => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
})();

/** 当前教学周（第 currentWeek 周）周一至周日的日期 */
function getWeekDates(): string[] {
  const start = new Date(`${settings.termStartDate}T00:00:00`);
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

/** 学生学期课表数据（课程为中心 + 时间段片段 + 选课状态） */
export const enrollment: StudentEnrollment = {
  studentId: "ST001",
  studentName: "张三",
  term: "2026秋季学期",
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
      courseName: "毛概线上",
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
      courseName: "大英(免修)",
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
      courseName: "习概线上",
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
}

/**
 * 多份课表：追加一份就把数据放到这里，
 * 右上角标签 + 切换按钮会自动生效
 */
export const timetables: TimetableEntry[] = [
  { owner: "我的", enrollment: enrollment },
  {
    // TODO: 示例课表，替换成宝宝的真实课表数据
    owner: "宝宝",
    enrollment: {
      studentId: "ST002",
      studentName: "宝宝",
      term: "2026秋季学期",
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

/** 当前展示的课表下标 */
export const currentTimetableIndex = ref(0);

/** 当前课表数据（渲染统一使用它） */
export const activeEnrollment = computed(
  () => timetables[currentTimetableIndex.value]!.enrollment,
);

/** 当前课表标签 */
export const currentOwner = computed(
  () => timetables[currentTimetableIndex.value]!.owner,
);

/** 切换课表：循环切换；只有一份时不生效 */
export function switchTimetable() {
  if (timetables.length < 2) return;
  currentTimetableIndex.value =
    (currentTimetableIndex.value + 1) % timetables.length;
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

  /** 各节次开始时间，按上午/下午/晚上分段生成 */
  const periodList = computed<[number, number][]>(() => {
    const list: [number, number][] = [];
    const pushRange = (
      start: { hour: number; minute: number },
      count: number,
    ) => {
      let h = start.hour;
      let m = start.minute;
      for (let i = 0; i < count; i++) {
        list.push([h, m]);
        const total =
          h * 60 + m + settings.durationOfEachPeriod + settings.breakDuration;
        h = Math.floor(total / 60);
        m = total % 60;
      }
    };
    pushRange(settings.morningFirstStart, settings.numberOfMorningPeriods);
    pushRange(settings.afternoonFirstStart, settings.numberOfAfternoonPeriods);
    pushRange(settings.nightFirstStart, settings.numberOfNightPeriods);
    return list;
  });

  /** 根据开始时分计算下课时间 */
  const getEndTime = (startHour: number, startMinute: number) => {
    const totalMin =
      startHour * 60 + startMinute + settings.durationOfEachPeriod;
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
    const m = settings.numberOfMorningPeriods;
    const a = settings.numberOfAfternoonPeriods;

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
