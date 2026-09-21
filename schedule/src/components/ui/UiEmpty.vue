<template>
  <div class="ui-empty">
    <slot name="icon">
      <span class="ui-empty__icon">📭</span>
    </slot>
    <p class="ui-empty__text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
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
  font-size: 0.18rem;
  opacity: 0.6;
}
.ui-empty__text {
  font-size: 0.08rem;
  margin-top: 0.04rem;
}
</style>
