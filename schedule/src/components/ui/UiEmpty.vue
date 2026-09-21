<template>
  <div class="ui-empty">
    <slot name="icon">
      <Inbox class="ui-empty__icon" />
    </slot>
    <p class="ui-empty__text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { Inbox } from "lucide-vue-next";
withDefaults(defineProps<{ text?: string }>(), { text: "暂无数据" });
</script>

<style scoped>
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.16rem 0;
  color: var(--ui-text-3);
}
.ui-empty__icon {
  width: 0.18rem;
  height: 0.18rem;
  opacity: 0.6;
}
.ui-empty__text {
  font-size: 0.08rem;
  margin-top: 0.04rem;
}
</style>
