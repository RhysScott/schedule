<template>
  <div class="home-container">
    <div class="top-bar">
      <div class="term">{{ activeEnrollment.term }}</div>
      <div class="week-switcher">
        <UiButton
          variant="ghost"
          circle
          size="sm"
          class="week-btn"
          @click="changeWeek(-1)"
        >
          <template #icon>
            <ChevronLeft />
          </template>
        </UiButton>
        <div class="week-number">第{{ currentWeek }}/{{ currentTotalWeeks }}周</div>
        <UiButton
          variant="ghost"
          circle
          size="sm"
          class="week-btn"
          @click="changeWeek(1)"
        >
          <template #icon>
            <ChevronRight />
          </template>
        </UiButton>
      </div>
      <div class="owner-area">
        <span class="owner-tag">
          {{ currentOwner }}
          <span v-if="activeTimetable?.syncEnabled" class="sync-badge">同步</span>
        </span>
        <UiButton
          variant="ghost"
          circle
          size="sm"
          class="switch-btn"
          title="全部课表"
          @click="goTimetables"
        >
          <template #icon>
            <ArrowLeftRight />
          </template>
        </UiButton>
      </div>
    </div>
    <TimetableHeader
      :days="visibleDays"
      :today-day-of-week="isTodayWeek ? todayDayOfWeek : 0"
    />
    <!-- 主体：节次行 + 午休/晚休行 -->
    <div class="body">
      <template v-for="(row, rIndex) in rowList" :key="rIndex">
        <!-- 午休/晚休行 -->
        <div v-if="row.type === 'break'" class="body-row break-row">
          <span class="break-label">{{ row.label }}</span>
        </div>
        <!-- 节次行：左侧时间列 + 每天一个单元格 -->
        <div v-else class="body-row" :style="{ height: rowHeight }">
          <div class="body-cell time-cell">
            <div class="period-number">
              {{ row.sIndex + 1 }}
            </div>
            <div class="time">
              {{ row.period[0] }}:{{ String(row.period[1]).padStart(2, "0") }}-{{ getEndTime(row.period[0], row.period[1]) }}
            </div>
          </div>
          <TimetableCell
            v-for="(dayItem, dIndex) in visibleDays"
            :key="dIndex"
            :day-item="dayItem"
            :day-of-week="dIndex + 1"
            :s-index="row.sIndex"
            :row-height="rowHeight"
            :hide-border-bottom="isConnectingRow(row.sIndex)"
            :is-today="isTodayWeek && dIndex + 1 === todayDayOfWeek"
            @add="openAdd"
            @edit="openEdit"
          />
        </div>
      </template>
    </div>
    <!-- 右下角悬浮按钮：导入课表（教务在线 / 教务 JSON / 课表码） -->
    <UiButton
      circle
      variant="primary"
      class="fab"
      title="导入课表"
      @click="importShow = true"
    >
      <template #icon>
        <Plus />
      </template>
    </UiButton>
    <ImportModal :show="importShow" @update:show="importShow = $event" @imported="onImported" />
    <!-- 添加/编辑课程弹窗 -->
    <CourseFormModal
      :show="courseModalShow"
      :mode="courseModalMode"
      :initial="courseModalInitial"
      :max-period="maxPeriod"
      :total-weeks="currentTotalWeeks"
      @update:show="courseModalShow = $event"
      @save="handleCourseSave"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { UiButton, uiMessage } from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Plus,
} from "lucide-vue-next";
import TimetableHeader from "@/components/TimetableHeader.vue";
import TimetableCell from "@/components/TimetableCell.vue";
import CourseFormModal from "@/components/CourseFormModal.vue";
import ImportModal from "@/components/ImportModal.vue";
import type { CourseFormPayload } from "@/components/CourseFormModal.vue";
import type { StudentCourse } from "@/types/course";
import {
  useTimetable,
  activeTimetable,
  currentWeek,
  todayWeek,
  todayDayOfWeek,
  activeEnrollment,
  settings,
  currentTotalWeeks,
  changeWeek,
  timetables,
  currentOwner,
  currentTimetableIndex,
  addCourse,
  updateCourse,
} from "@/composables/useTimetable";

const router = useRouter();

const { visibleDays, rowList, getEndTime, weekSchedule, periodList } =
  useTimetable();

// 当前显示周是否包含今天：是才高亮今天列
const isTodayWeek = computed(() => currentWeek.value === todayWeek.value);

// 跳转到全部课表页面选择
function goTimetables() {
  router.push("/timetables");
}

/* ============ 添加 / 编辑课程弹窗 ============ */
interface ModalInitial {
  courseFields?: CourseFormPayload["courseFields"];
  segments?: CourseFormPayload["segments"];
  lockedSegmentIndex?: number | null;
}

const courseModalShow = ref(false);
const courseModalMode = ref<"add" | "edit">("add");
const courseModalInitial = ref<ModalInitial | null>(null);
/** 编辑中的课程 id（用于保存时定位） */
const editingCourseId = ref<string>("");

/** 节次上限 = 上午/下午/晚上总节数 */
const maxPeriod = computed(() => periodList.value.length);

/** 打开添加弹窗：点击空格子时预填星期与节次；FAB 进入时留空表单 */
function openAdd(payload?: { dayOfWeek: number; periodStart: number }) {
  courseModalMode.value = "add";
  editingCourseId.value = "";
  courseModalInitial.value = payload
    ? {
        segments: [
          {
            segmentId: null,
            dayOfWeek: payload.dayOfWeek,
            periodStart: payload.periodStart,
            periodEnd: payload.periodStart,
            weekStart: 1,
            weekEnd: currentTotalWeeks.value,
            weekType: "all",
            mode: "offline",
            room: "",
            remark: "",
          },
        ],
      }
    : null;
  courseModalShow.value = true;
}

/** 打开编辑弹窗：按点击的课程片段预填 */
function openEdit(payload: {
  dayOfWeek: number;
  periodStart: number;
  studentCourseId: string;
}) {
  const course = activeEnrollment.value.courses.find(
    (c) => c.studentCourseId === payload.studentCourseId,
  );
  if (!course) return;
  const clickedIdx = course.segments.findIndex(
    (s) =>
      s.dayOfWeek === payload.dayOfWeek &&
      s.periodStart === payload.periodStart,
  );
  const anchorIdx = clickedIdx >= 0 ? clickedIdx : null;
  courseModalMode.value = "edit";
  editingCourseId.value = course.studentCourseId;
  courseModalInitial.value = {
    courseFields: {
      courseName: course.courseName,
      teacher: course.teacher,
      credit: course.credit,
      enrollStatus: course.enrollStatus,
    },
    segments: course.segments.map((s) => ({
      segmentId: s.segmentId,
      dayOfWeek: s.dayOfWeek,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      weekStart: s.weekStart,
      weekEnd: s.weekEnd,
      weekType: s.weekType,
      mode: s.mode,
      room: s.room,
      remark: s.remark,
    })),
    lockedSegmentIndex: anchorIdx,
  };
  courseModalShow.value = true;
}

/** 保存：新增或修改后写回后端并刷新课表 */
async function handleCourseSave(payload: CourseFormPayload) {
  const idx = currentTimetableIndex.value;
  try {
    if (courseModalMode.value === "add") {
      const course: Partial<StudentCourse> = {
        courseName: payload.courseFields.courseName,
        credit: payload.courseFields.credit,
        teacher: payload.courseFields.teacher,
        campus: "主校区",
        enrollStatus: payload.courseFields.enrollStatus,
        sourceCourseId: null,
        approveRemark: "",
        segments: payload.segments.map((s) => ({
          ...s,
          segmentId: s.segmentId ?? "",
        })),
      };
      timetables.value = await addCourse(idx, course);
      uiMessage.success("课程已添加");
    } else {
      const existing = activeEnrollment.value.courses.find(
        (c) => c.studentCourseId === editingCourseId.value,
      );
      if (!existing) return;
      const course: Partial<StudentCourse> = {
        ...existing,
        courseName: payload.courseFields.courseName,
        credit: payload.courseFields.credit,
        teacher: payload.courseFields.teacher,
        enrollStatus: payload.courseFields.enrollStatus,
        segments: payload.segments.map((s) => ({
          ...s,
          segmentId: s.segmentId ?? "",
        })),
      };
      timetables.value = await updateCourse(idx, existing.studentCourseId, course);
      uiMessage.success("课程已更新");
    }
    courseModalShow.value = false;
  } catch (e) {
    uiMessage.error("保存失败：" + ((e as Error).message ?? String(e)));
  }
}

// 悬浮按钮：打开导入课表弹窗
const importShow = ref(false);

// 导入成功后切换到新导入的课表（导入即新建一张独立课表）
function onImported(index: number) {
  currentTimetableIndex.value = index;
}

// 存在单节课程时增高行，保证卡片文字完整不截断
// 课表异步加载完成后需要重算，因此用 computed
const hasSinglePeriodCourse = computed(() =>
  weekSchedule.value.some((day) =>
    Object.values(day.courseMap).some((c) => c.startPeriod === c.endPeriod),
  ),
);
const mobileRowHeight = computed(() =>
  hasSinglePeriodCourse.value ? "0.55rem" : "0.4rem",
);

/**
 * PC 端（≥1024px）：行高按视口高度弹性均分，
 * 课表正好填满剩余空间，卡片不会过高或过矮
 */
const isDesktop = ref(window.matchMedia("(min-width: 64em)").matches);
const vh = ref(window.innerHeight);

function updateViewport() {
  isDesktop.value = window.matchMedia("(min-width: 64em)").matches;
  vh.value = window.innerHeight;
}
window.addEventListener("resize", updateViewport);
onBeforeUnmount(() => window.removeEventListener("resize", updateViewport));

const rowHeight = computed(() => {
  if (!isDesktop.value) return mobileRowHeight.value;
  const rows = rowList.value.filter((r) => r.type !== "break").length;
  const breakCount = rowList.value.length - rows;
  if (!rows) return "0.4rem";
  // 固定开销：顶栏 + 表头 + 午/晚休行 + 容器留白 + tabbar
  const fixed = 1.35 + breakCount * 0.18 + 0.15;
  const remBase = parseFloat(getComputedStyle(document.documentElement).fontSize) || 170;
  const rem = Math.max(0.22, (vh.value / remBase - fixed) / rows);
  // 必须带 rem 单位：无单位的 height 在 CSS 中无效，会导致行高塌缩、跨节次卡片错位
  return rem.toFixed(3) + "rem";
});

// 连堂：该行处于某门课程的中间（非最后一行）时，隐藏底部边框，使课程视觉连续
const isConnectingRow = (sIndex: number) => {
  const periodNum = sIndex + 1;
  return weekSchedule.value.some((day) =>
    Object.values(day.courseMap).some(
      (c) => c.startPeriod <= periodNum && periodNum < c.endPeriod,
    ),
  );
};
</script>

<style scoped>
.home-container {
  width: min(94vw, 4.6rem);
  height: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  overflow-y: auto;
  /* 底部留白：防止悬浮添加按钮挡住最后一行课表卡片 */
  padding-bottom: 0.7rem;
}

/* 右下角悬浮添加按钮 */
.fab {
  position: fixed;
  right: max(0.15rem, calc((100vw - min(94vw, 4.6rem)) / 2 + 0.1rem));
  bottom: 0.8rem;
  z-index: 20;
  width: 0.5rem;
  height: 0.5rem;
  box-shadow: 0 0.03rem 0.1rem rgba(66, 185, 131, 0.35);

  :deep(.ui-btn__icon svg) {
    width: 0.24rem;
    height: 0.24rem;
  }
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.08rem 0;
  text-align: center;

  .term {
    flex: 1;
    font-size: 0.08rem;
    color: #999;
    text-align: left;
  }

  .week-switcher {
    display: flex;
    align-items: center;
    gap: 0.12rem;

    .week-number {
      font-size: 0.16rem;
      font-weight: bold;
      color: #333;
    }

    .week-btn {
      color: var(--ui-text-2);
    }
  }

  /* 右上角：课表标签 + 切换课表按钮 */
  .owner-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.04rem;

    .owner-tag {
      padding: 0.015rem 0.06rem;
      font-size: 0.08rem;
      color: #42b983;
      background: #eafaf3;
      border-radius: 0.3rem;
      white-space: nowrap;
      max-width: 1.3rem;
      overflow: hidden;
      text-overflow: ellipsis;

      .sync-badge {
        margin-left: 0.03rem;
        font-size: 0.065rem;
        color: #4a7fae;
        background: #e9f2fb;
        border-radius: 0.2rem;
        padding: 0 0.03rem;
      }
    }

    .switch-btn {
      color: var(--ui-text-2);
    }
  }
}
.body {
  display: flex;
  flex-direction: column;
  font-size: 0.1rem;
  .body-row {
    display: flex;
  }
  .break-row {
    align-items: center;
    justify-content: center;
    height: 0.25rem;
    border-bottom: 0.01rem solid #eee;
    background: #f7f7f7;
    color: #999;

    .break-label {
      font-size: 0.11rem;
      letter-spacing: 0.12rem;
      text-indent: 0.12rem; /* 抵消最后一个字的字距，保持居中 */
    }
  }
  .body-cell {
    &.time-cell {
      flex: 0 0 0.4rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.02rem;
      border-right: 0.01rem solid #eee;
      border-bottom: 0.01rem solid #eee; /* 节次列边框始终显示，不受连堂影响 */

      .period-number {
        font-size: 0.12rem;
        font-weight: bold;
        color: #333;
      }

      .time {
        font-size: 0.07rem;
        line-height: 1.2;
        color: #999;
        text-align: center;
        white-space: nowrap;
      }
    }
  }
}

/* 桌面端（≥1024px）：100vw 全屏布局 + 四周留白 */
@media (min-width: 64em) {
  .home-container {
    width: 100vw;
    padding: 0.05rem 0.12rem;
  }
  .fab {
    right: 0.15rem;
    width: 0.34rem;
    height: 0.34rem;
  }
  .fab :deep(.ui-btn__icon svg) {
    width: 0.16rem;
    height: 0.16rem;
  }
}
</style>
