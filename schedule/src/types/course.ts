/** 周类型：连续周 / 单周 / 双周 */
export type WeekType = "all" | "odd" | "even";

/** 授课方式：线下 / 线上 / 混合 */
export type CourseMode = "offline" | "online" | "hybrid";

/** 选课状态：正常 / 免修 / 置换 / 退课 */
export type EnrollStatus = "normal" | "exempt" | "replaced" | "dropped";

/** 课程时间段片段：一周内的某天某几节，及其覆盖的周次范围 */
export interface CourseSegment {
  segmentId: string;
  weekStart: number;
  weekEnd: number;
  weekType: WeekType; // all连续周 | odd单周 | even双周
  dayOfWeek: number; // 1周一，2周二…7周日
  periodStart: number;
  periodEnd: number;
  room: string; // 教室，线上课可为空
  mode: CourseMode; // offline线下 / online线上 / hybrid混合
  remark: string; // 备注，如"线上授课"
}

/** 学生的一门选课记录（含选课状态、学分等） */
export interface StudentCourse {
  studentCourseId: string;
  courseId: string;
  courseName: string;
  credit: number;
  teacher: string;
  campus: string;
  enrollStatus: EnrollStatus;
  sourceCourseId: string | null;
  approveRemark: string;
  /** 教务系统原始颜色（如 #FFF0CC），导入时透传 */
  color?: string;
  segments: CourseSegment[];
}

/** 学生学期课表：包含该生本学期全部选课 */
export interface StudentEnrollment {
  studentId: string;
  studentName: string;
  term: string;
  /** 学期配置跟随课表：第1周周一日期 */
  termStartDate: string; // "YYYY-MM-DD"
  /** 教学周总数 */
  totalWeeks: number;
  courses: StudentCourse[];
}

/** 渲染用：某周某天上的一门课（由选课记录 + segments 按当前周展开） */
export interface RenderCourse {
  studentCourseId: string;
  name: string;
  teacher: string;
  room: string;
  mode: CourseMode;
  remark?: string;
  status: EnrollStatus; // 渲染时用于特殊状态（免修/置换/退课）置灰标记
  startPeriod: number;
  endPeriod: number;
  /** 教务系统原始颜色，优先于默认调色板 */
  color?: string;
}

/** 特殊状态/授课方式的置灰标记开关 */
export interface SpecialDisplaySettings {
  exempt: boolean; // 免修：置灰 + 标记
  replaced: boolean; // 置换：置灰 + 标记
  dropped: boolean; // 退课：置灰 + 标记
  online: boolean; // 线上课：置灰 + 标记
  hybrid: boolean; // 混合课：置灰 + 标记
}

export interface TimetableSettings {
  showWeekend: boolean;

  /** 特殊状态（免修/置换/退课）与线上/混合课的显示方式 */
  specialDisplay: SpecialDisplaySettings;
}
