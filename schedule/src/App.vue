<template>
  <div class="container">
    <main class="content">
      <router-view />
    </main>
    <TabBar class="tab-bar" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import TabBar from './components/TabBar.vue';
import { loadTimetables } from './composables/useTimetable';

const designWidth = 375; // pixel
const html = document.documentElement;
// 桌面端（≥1024px）按 100vw/100vh 全屏布局：rem 基准封顶防止无限放大；
// 移动端按 375 设计稿等比缩放
const isDesktop = () => html.clientWidth >= 1024;
function setRem() {
  const ratio = html.clientWidth / designWidth;
  const capped = Math.min(ratio, isDesktop() ? 1.7 : Number.POSITIVE_INFINITY);
  html.style.fontSize = capped * 100 + 'px';
}
setRem();
addEventListener('resize', setRem);

// 启动时从 FastAPI 后端加载课表（失败回退内置数据）
onMounted(() => {
  loadTimetables();
});
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* 页面内容居中 */
  display: flex;
  justify-content: center;
}

.tab-bar {
  flex-shrink: 0;
}
</style>
