<template>
  <div class="header">
    <div class="header-cell time-cell">节次</div>
    <div
      class="header-cell"
      :class="{ today: index + 1 === todayDayOfWeek }"
      v-for="(item, index) in days"
      :key="index"
    >
      <div class="day-of-week">{{ item.weekText }}</div>
      <div class="date">{{ item.dateText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DaySchedule } from "@/composables/useTimetable";

defineProps<{
  days: DaySchedule[];
  /** 1=周一 ... 7=周日，对应列高亮 */
  todayDayOfWeek: number;
}>();
</script>

<style scoped>
.header {
  display: flex;
  font-size: 0.1rem;
  border-bottom: 0.01rem solid #cccccc;

  .header-cell {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.03rem;
    padding: 0.08rem 0;

    .day-of-week {
      font-size: 0.12rem;
      font-weight: bold;
      color: #333;
    }

    .date {
      font-size: 0.08rem;
      color: #999;
    }

    /* 今天高亮 */
    &.today {
      background: #e7f6ef;
      .day-of-week {
        color: #1e8e60;
      }
      .date {
        color: #2da875;
        font-weight: bold;
      }
    }

    &.time-cell {
      flex: 0 0 0.4rem;
      font-size: 0.08rem;
      color: #999;
      border-right: 0.01rem solid #eee;
    }
  }
}
</style>
