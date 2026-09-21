<template>
  <n-message-provider>
    <div class="container">
      <main class="content">
        <router-view />
      </main>
      <TabBar class="tab-bar" />
    </div>
  </n-message-provider>
</template>

<script setup lang="ts">
import TabBar from './components/TabBar.vue';

const designWidth = 375; // pixel
const html = document.documentElement;
html.style.fontSize = (html.clientWidth / designWidth) * 100 + 'px';
addEventListener('resize', () => {
  html.style.fontSize = (html.clientWidth / designWidth) * 100 + 'px';
})
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
