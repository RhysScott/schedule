<template>
  <span class="ui-tag" :class="`ui-tag--${type}`">
    {{ text }}
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string;
    type?: "primary" | "success" | "warning" | "info" | "danger" | "muted";
  }>(),
  { type: "muted" },
);
</script>

<style scoped>
.ui-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.065rem;
  padding: 0.015rem 0.05rem;
  border-radius: 0.04rem;
  line-height: 1.4;
  white-space: nowrap;
}
.ui-tag--primary {
  background: var(--ui-primary-soft);
  color: var(--ui-primary-deep);
}
.ui-tag--success {
  background: var(--ui-primary-soft);
  color: var(--ui-primary-deep);
}
.ui-tag--warning {
  background: #fdf3e4;
  color: #b9802f;
}
.ui-tag--info {
  background: #e9f2fb;
  color: #4a7fae;
}
.ui-tag--danger {
  background: #fbeaea;
  color: #c05a5a;
}
.ui-tag--muted {
  background: #f2f2f2;
  color: #999;
}
</style>
