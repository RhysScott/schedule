<template>
  <nav class="tab-bar">
    <router-link to="/" class="tab-item" :class="{ active: route.path === '/' }">
      <Home />
    </router-link>
    <router-link to="/my" class="tab-item" :class="{ active: route.path === '/my' }">
      <User />
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { Home, User } from "lucide-vue-next";

const route = useRoute();
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: stretch;
  height: 0.5rem;
  flex-shrink: 0;
  border-top: 0.01rem solid #eee;
  background: #fff;

  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    text-decoration: none;
    transition: color 0.15s;

    svg {
      width: 0.24rem;
      height: 0.24rem;
    }

    &.active {
      color: #42b983;
    }

    &:active {
      opacity: 0.7;
    }
  }
}

/* 桌面端（≥1024px）：TabBar 收矮、图标收小，避免被 rem 基准放大后过高 */
@media (min-width: 64em) {
  .tab-bar {
    height: 0.32rem;
  }
  .tab-bar .tab-item svg {
    width: 0.16rem;
    height: 0.16rem;
  }
}
</style>
