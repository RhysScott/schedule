<template>
  <div class="tt-container">
    <div class="tt-header">
      <NButton quaternary circle size="small" class="tt-back" @click="goBack">
        <template #icon>
          <ChevronLeft />
        </template>
      </NButton>
      <span class="tt-title">全部课表</span>
      <span class="tt-spacer" />
    </div>

    <div class="tt-list">
      <div
        v-for="(t, i) in timetables"
        :key="i"
        class="tt-card"
        :class="{ current: i === currentTimetableIndex }"
        @click="select(i)"
      >
        <div class="tt-avatar">
          {{ (t.enrollment.studentName || t.owner).charAt(0) }}
        </div>
        <div class="tt-info">
          <div class="tt-owner">
            {{ t.owner }}
            <span v-if="i === currentTimetableIndex" class="tt-current">当前</span>
          </div>
          <div class="tt-sub">
            {{ t.enrollment.studentName || "未填写姓名" }} ·
            {{ t.enrollment.courses.length }} 门课
          </div>
          <div class="tt-sub">{{ t.enrollment.term }}</div>
        </div>
        <ChevronRight class="tt-arrow" />
      </div>
    </div>

    <div class="tt-tip">点击课表卡片即可切换查看</div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { NButton } from "naive-ui";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import {
  timetables,
  currentTimetableIndex,
} from "@/composables/useTimetable";

const router = useRouter();

function select(i: number) {
  currentTimetableIndex.value = i;
  router.push("/");
}

function goBack() {
  router.push("/");
}
</script>

<style scoped>
.tt-container {
  display: flex;
  flex-direction: column;
  width: min(94vw, 4.6rem);
  margin: 0 auto;
  font-size: 0.1rem;
}

.tt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.08rem 0;

  .tt-back {
    --n-icon-size: 0.16rem;
  }

  .tt-title {
    font-size: 0.14rem;
    font-weight: bold;
    color: #333;
  }

  .tt-spacer {
    width: 0.28rem;
  }
}

.tt-list {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-top: 0.1rem;
  overflow-y: auto;
}

.tt-card {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.1rem;
  border: 0.01rem solid #eee;
  border-radius: 0.08rem;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #42b983;
  }

  &.current {
    border-color: #42b983;
    background: #f2faf6;
  }

  .tt-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #e2f0cb;
    color: #5a8a4e;
    font-size: 0.2rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .tt-info {
    flex: 1;
    min-width: 0;

    .tt-owner {
      display: flex;
      align-items: center;
      gap: 0.05rem;
      font-size: 0.13rem;
      font-weight: bold;
      color: #333;

      .tt-current {
        padding: 0 0.04rem;
        font-size: 0.07rem;
        font-weight: normal;
        color: #42b983;
        background: #eafaf3;
        border-radius: 0.2rem;
      }
    }

    .tt-sub {
      margin-top: 0.02rem;
      font-size: 0.08rem;
      color: #999;
    }
  }

  .tt-arrow {
    color: #ccc;
    flex-shrink: 0;
  }
}

.tt-tip {
  margin-top: 0.12rem;
  text-align: center;
  font-size: 0.08rem;
  color: #bbb;
}
</style>
