<template>
  <button
    class="ui-btn"
    :class="[
      `ui-btn--${variant}`,
      `ui-btn--${size}`,
      { 'ui-btn--block': block, 'ui-btn--circle': circle, 'ui-btn--dashed': dashed },
    ]"
    :disabled="disabled"
    :type="htmlType"
    @click="emit('click', $event)"
  >
    <span v-if="$slots.icon" class="ui-btn__icon">
      <slot name="icon" />
    </span>
    <span v-if="$slots.default" class="ui-btn__text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "soft" | "ghost" | "danger" | "text";
    size?: "xs" | "lg" | "md" | "sm" | "tiny";
    block?: boolean;
    circle?: boolean;
    dashed?: boolean;
    disabled?: boolean;
    htmlType?: "button" | "submit";
  }>(),
  { variant: "soft", size: "md", block: false, circle: false, dashed: false, disabled: false, htmlType: "button" },
);

const emit = defineEmits<{ click: [e: MouseEvent] }>();
</script>

<style scoped>
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.02rem;
  border: 0.01rem solid transparent;
  border-radius: var(--ui-radius);
  font-size: 0.09rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.055rem 0.11rem;
  transition: opacity 0.15s, transform 0.05s;
  font-family: inherit;
  white-space: nowrap;
}
.ui-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.ui-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ui-btn__icon {
  display: inline-flex;
  align-items: center;
}
.ui-btn__icon :deep(svg) {
  width: 0.1rem;
  height: 0.1rem;
}
.ui-btn--lg {
  font-size: 0.1rem;
  padding: 0.07rem 0.14rem;
}
.ui-btn--lg .ui-btn__icon :deep(svg) {
  width: 0.11rem;
  height: 0.11rem;
}
.ui-btn--sm {
  font-size: 0.08rem;
  padding: 0.045rem 0.09rem;
}
.ui-btn--sm .ui-btn__icon :deep(svg) {
  width: 0.09rem;
  height: 0.09rem;
}
.ui-btn--tiny {
  font-size: 0.07rem;
  padding: 0.035rem 0.07rem;
}
.ui-btn--tiny .ui-btn__icon :deep(svg) {
  width: 0.08rem;
  height: 0.08rem;
}

.ui-btn--block {
  display: flex;
  width: 100%;
}
.ui-btn--circle {
  border-radius: 50%;
  padding: 0.05rem;
}

.ui-btn--primary {
  background: var(--ui-primary);
  color: #fff;
}
.ui-btn--soft {
  background: var(--ui-primary-soft);
  color: var(--ui-primary-deep);
}
.ui-btn--ghost {
  background: var(--ui-bg);
  color: var(--ui-text);
  border-color: var(--ui-border);
}
.ui-btn--danger {
  background: var(--ui-danger);
  color: #fff;
}
.ui-btn--text {
  background: transparent;
  color: var(--ui-primary-deep);
  padding-left: 0.04rem;
  padding-right: 0.04rem;
}
.ui-btn--dashed {
  border-style: dashed;
}
</style>
