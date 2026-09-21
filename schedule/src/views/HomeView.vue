<template>
  <div class="home-container">
    <div class="top-bar">
      <div class="term">{{ activeEnrollment.term }}</div>
      <div class="week-switcher">
        <NButton
          quaternary
          circle
          size="small"
          class="week-btn"
          @click="changeWeek(-1)"
        >
          <template #icon>
            <ChevronLeft />
          </template>
        </NButton>
        <div class="week-number">第{{ currentWeek }}/{{ settings.totalWeeks }}周</div>
        <NButton
          quaternary
          circle
          size="small"
          class="week-btn"
          @click="changeWeek(1)"
        >
          <template #icon>
            <ChevronRight />
          </template>
        </NButton>
      </div>
      <div class="owner-area">
        <span class="owner-tag">{{ currentOwner }}</span>
        <NButton
          quaternary
          circle
          size="small"
          class="switch-btn"
          title="全部课表"
          @click="goTimetables"
        >
          <template #icon>
            <ArrowLeftRight />
          </template>
        </NButton>
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
              {{ row.period[0] }}:{{ String(row.period[1]).padStart(2, "0") }}<br />
              {{ getEndTime(row.period[0], row.period[1]) }}
            </div>
          </div>
          <TimetableCell
            v-for="(dayItem, dIndex) in visibleDays"
            :key="dIndex"
            :day-item="dayItem"
            :s-index="row.sIndex"
            :row-height="rowHeight"
            :hide-border-bottom="isConnectingRow(row.sIndex)"
            :is-today="isTodayWeek && dIndex + 1 === todayDayOfWeek"
          />
        </div>
      </template>
    </div>
    <!-- 右下角悬浮添加按钮 -->
    <NButton
      circle
      type="primary"
      class="fab"
      title="添加课程"
      :style="{ '--n-icon-size': '0.24rem' }"
      @click="onAddClick"
    >
      <template #icon>
        <Plus />
      </template>
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { NButton, useMessage } from "naive-ui";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Plus,
} from "lucide-vue-next";
import TimetableHeader from "@/components/TimetableHeader.vue";
import TimetableCell from "@/components/TimetableCell.vue";
import {
  useTimetable,
  currentWeek,
  todayWeek,
  todayDayOfWeek,
  activeEnrollment,
  settings,
  changeWeek,
  timetables,
  currentOwner,
} from "@/composables/useTimetable";

const router = useRouter();
const message = useMessage();
const { visibleDays, rowList, getEndTime, weekSchedule } = useTimetable();

// 当前显示周是否包含今天：是才高亮今天列
const isTodayWeek = computed(() => currentWeek.value === todayWeek.value);

// 跳转到全部课表页面选择
function goTimetables() {
  router.push("/timetables");
}

// 悬浮添加按钮：暂为占位提示，后续接添加课程流程
function onAddClick() {
  message.info("添加课程功能开发中");
}

// 存在单节课程时增高行，避免卡片内容放不下
const hasSinglePeriodCourse = weekSchedule.value.some((day) =>
  Object.values(day.courseMap).some((c) => c.startPeriod === c.endPeriod),
);
const rowHeight = hasSinglePeriodCourse ? "0.6rem" : "0.4rem";

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

  svg {
    width: 0.24rem !important;
    height: 0.24rem !important;
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
      --n-icon-size: 0.14rem;
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
    }

    .switch-btn {
      --n-icon-size: 0.13rem;
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
        line-height: 1.4;
        color: #999;
        text-align: center;
      }
    }
  }
}
</style>
