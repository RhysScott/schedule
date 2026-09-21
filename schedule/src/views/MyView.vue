<template>
  <div class="my-container">
    <div class="settings-entry" @click="goSettings">
      <Settings />
      <span>设置</span>
    </div>
    <div class="avatar">{{ initial }}</div>
    <div class="name">{{ activeEnrollment.studentName || "未登录" }}</div>
    <div class="sub">{{ activeEnrollment.term }}</div>

    <div class="info-card">
      <div class="info-row">
        <span class="label">学号</span>
        <span class="value">{{ activeEnrollment.studentId || "-" }}</span>
      </div>
      <div class="info-row">
        <span class="label">学期</span>
        <span class="value">{{ activeEnrollment.term || "-" }}</span>
      </div>
      <div class="info-row">
        <span class="label">已选课程</span>
        <span class="value">{{ activeEnrollment.courses.length }} 门</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Settings } from "lucide-vue-next";
import { activeEnrollment } from "@/composables/useTimetable";

const router = useRouter();

const initial = computed(() =>
  (activeEnrollment.value.studentName || "我").charAt(0),
);

function goSettings() {
  router.push("/settings");
}
</script>

<style scoped>
.my-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(94vw, 4.6rem);
  padding-top: 0.4rem;
  font-size: 0.1rem;
  overflow-y: auto;
}

/* 右上角设置入口 */
.settings-entry {
  position: absolute;
  top: 0.08rem;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.02rem;
  padding: 0.04rem 0.08rem;
  color: #666;
  font-size: 0.08rem;
  cursor: pointer;
  border-radius: 0.05rem;

  svg {
    width: 0.18rem;
    height: 0.18rem;
  }

  &:hover {
    background: #f2faf6;
    color: #42b983;
  }
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: #e2f0cb;
  color: #5a8a4e;
  font-size: 0.26rem;
  font-weight: bold;
}

.name {
  margin-top: 0.08rem;
  font-size: 0.14rem;
  font-weight: bold;
  color: #333;
}

.sub {
  margin-top: 0.02rem;
  font-size: 0.08rem;
  color: #999;
}

.info-card {
  width: 82%;
  margin-top: 0.18rem;
  border-radius: 0.08rem;
  background: #fff;
  border: 0.01rem solid #eee;
  padding: 0.04rem 0.1rem;

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.07rem 0;

    &:not(:last-child) {
      border-bottom: 0.01rem solid #f3f3f3;
    }

    .label {
      color: #999;
    }

    .value {
      color: #333;
    }
  }
}
</style>
