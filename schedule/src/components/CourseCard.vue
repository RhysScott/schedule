<template>
  <div class="course-card" :class="{ muted: isSpecial }" :style="cardStyle" @click="emit('click')">
    <span v-if="isSpecial" class="status-badge">{{ statusText }}</span>
    <div class="course-name">
      {{ course.name }}
    </div>
    <div v-if="roomText" class="course-meta">@{{ roomText }}</div>
    <div v-if="course.teacher" class="course-meta">{{ course.teacher }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RenderCourse } from "@/types/course";
import { settings } from "@/composables/useTimetable";

const props = defineProps<{
  course: RenderCourse;
}>();

const emit = defineEmits<{
  click: [];
}>();

// 显示维度：选课状态（免修/置换/退课）优先，其次授课方式（线上/混合）
const displayKey = computed(() => {
  if (props.course.status !== "normal") return props.course.status;
  if (props.course.mode !== "offline") return props.course.mode;
  return null;
});

// 按设置决定是否置灰 + 标记
const isSpecial = computed(() => {
  if (!displayKey.value) return false;
  return settings.specialDisplay[displayKey.value] ?? false;
});

const statusText = computed(() => {
  switch (displayKey.value) {
    case "exempt":
      return "免修";
    case "replaced":
      return "置换";
    case "dropped":
      return "退课";
    case "online":
      return "线上";
    case "hybrid":
      return "混合";
    default:
      return "";
  }
});

// 教室为空时按授课方式显示：线上 / 混合（置灰角标已表明时不再重复）
const roomText = computed(() => {
  if (props.course.room) return props.course.room;
  if (isSpecial.value) return "";
  if (props.course.mode === "online") return "线上";
  if (props.course.mode === "hybrid") return "线上+线下";
  return "";
});

// 你原来的卡片配色
const colors = [
  "#ffb7b2", // 蜜桃粉
  "#ff9aa2", // 浅玫瑰
  "#ffdac1", // 奶油杏
  "#e2f0cb", // 浅豆绿
  "#b5ead7", // 薄荷青
  "#c7ceea", // 雾蓝
  "#FFE5E5", // 奶白粉
  "#FFF2CC", // 浅奶黄
  "#D9F2E8", // 清浅苔绿
  "#D8E9F7", // 云浅蓝
  "#E8DFF5", // 淡薰衣草
  "#F9E2E8", // 豆沙奶粉
  "#E4F5F7", // 冰水蓝
  "#F7E8D9", // 浅奶茶
  "#DDEED8", // 艾草绿
  "#E1E6F5", // 灰调浅蓝紫
];

// 按选课记录ID稳定分配颜色，同一门课（多个时间段）始终同一个颜色
const cardColor = computed(() => {
  const text = props.course.studentCourseId;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? "#ffb7b2";
});

/** hex 转 HSL */
function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// 文字颜色：与背景同色相，亮度更暗；特殊状态整体置灰
const textColor = computed(() => {
  const { h, s, l } = hexToHsl(cardColor.value);
  return `hsl(${h}, ${s}%, ${Math.max(12, l - 38)}%)`;
});

// 卡片样式：normal 用主题色；特殊状态置灰
const cardStyle = computed(() =>
  isSpecial.value
    ? { backgroundColor: "#f0f0f0", color: "#9a9a9a" }
    : { backgroundColor: cardColor.value, color: textColor.value },
);
</script>

<style scoped>
.course-card {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  /* 顶部对齐：内容超高一侧（底部）溢出，避免上下各裁一半 */
  justify-content: flex-start;
  gap: 0.015rem;
  padding: 0.05rem 0.06rem;
  border-radius: 0.06rem;
  overflow: hidden;
  line-height: 1.3;
  cursor: pointer;
  transition: filter 0.15s;

  &:hover {
    filter: brightness(0.97);
  }
}
/* 文字行不允许被 flex 压缩（压缩会把文字挤成一行后裁剪） */
.course-card .course-name,
.course-card .course-meta {
  flex-shrink: 0;
}
/* 课程名：主信息，略大加粗；空间足够时允许换行，不省略 */
.course-name {
  font-size: 0.1rem;
  font-weight: bold;
  overflow: hidden;
  /* 默认占满整卡宽度；仅当右上角有状态角标时才让位（避免 tag 挤压标题空间） */
  padding-right: 0;
}
.course-card:has(.status-badge) .course-name {
  padding-right: 0.15rem;
}
/* 教室/老师：次信息，小号弱化；空间足够时允许换行，不省略 */
.course-meta {
  font-size: 0.075rem;
  opacity: 0.72;
  overflow: hidden;
}

/* 特殊状态（免修/置换/退课）：灰底 + 右上角状态角标 */
.status-badge {
  position: absolute;
  top: 0.02rem;
  right: 0.02rem;
  padding: 0 0.03rem;
  font-size: 0.06rem;
  font-weight: normal;
  line-height: 1.4;
  border-radius: 0.03rem;
  background: #e0e0e0;
  color: #777;
  white-space: nowrap;
}
.course-card.muted .course-meta {
  opacity: 0.5;
}
</style>
