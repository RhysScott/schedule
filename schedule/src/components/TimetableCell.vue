<template>
  <div
    class="body-cell"
    :class="{ today: isToday }"
    :style="{ borderBottom: hideBorderBottom && hasCourse ? 'none' : '' }"
  >
    <div class="cell-content">
      <CourseCard
        v-if="course"
        :course="course"
        :style="{ height: courseCardHeight }"
      />
      <!-- 空格子：hover 显示添加图标 -->
      <button v-else class="add-btn" title="添加课程">
        <Plus />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import CourseCard from "@/components/CourseCard.vue";
import type { RenderCourse } from "@/types/course";
import type { DaySchedule } from "@/composables/useTimetable";

const props = withDefaults(
  defineProps<{
    dayItem: DaySchedule;
    sIndex: number;
    /** 行高，如 "0.6rem" */
    rowHeight: string;
    /** 连堂中间行：隐藏本格底部边框，使课程视觉连续 */
    hideBorderBottom?: boolean;
    /** 今天所在列：浅色底高亮 */
    isToday?: boolean;
  }>(),
  { hideBorderBottom: false, isToday: false },
);

// 覆盖本行格子的课程（连堂中间行也属于覆盖）
const occupyingCourse = computed<RenderCourse | null>(() => {
  const periodNum = props.sIndex + 1;
  const c = props.dayItem.courseMap?.[periodNum];
  if (!c || c.endPeriod < periodNum) return null;
  return c;
});

// 起始节次等于该行节次时才渲染卡片（连堂卡片跨多行）
const course = computed<RenderCourse | null>(() => {
  const c = occupyingCourse.value;
  if (!c || c.startPeriod !== props.sIndex + 1) return null;
  return c;
});

// 该格有课（含连堂中间行）：连堂时隐藏底边框只针对有课格子
const hasCourse = computed(() => !!occupyingCourse.value);

// 连堂课程跨多行：卡片高度 = 跨行数 × 行高 - 0.01rem，
// 使卡片底部恰好贴在网格线上方，不盖住边框
const courseCardHeight = computed(() => {
  if (!course.value) return "0";
  const span = course.value.endPeriod - course.value.startPeriod + 1;
  const rem = parseFloat(props.rowHeight);
  return `calc(${span * rem}rem - 0.01rem)`;
});
</script>

<style scoped>
.body-cell {
  flex: 1;
  /* min-width: 0 防止卡片内长文本（nowrap）把列撑宽 */
  min-width: 0;
  /* 所有格子（含空格子）显示网格线 */
  border-right: 0.01rem solid #eee;
  border-bottom: 0.01rem solid #eee;
  /* 无内边距：卡片以行高为基准精确对齐网格线 */
  overflow: visible;

  &:last-child {
    border-right: none;
  }

  /* 今天所在列：浅色底高亮 */
  &.today {
    background: rgba(66, 185, 131, 0.06);
  }

  .cell-content {
    width: 100%;
    height: 100%;
    padding: 0.01rem;
    display: flex;
    justify-content: center;
    overflow: visible;
  }

  /* 空格子添加按钮：默认隐藏，hover 格子时浮现 */
  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    color: #42b983;
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.15s, background 0.15s;

    svg {
      width: 0.14rem;
      height: 0.14rem;
    }
  }

  &:hover .add-btn {
    opacity: 1;
    background: rgba(66, 185, 131, 0.05);
  }
}
</style>
