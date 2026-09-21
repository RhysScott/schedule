<template>
  <div class="ui-num">
    <button class="ui-num__btn" type="button" :disabled="disabled || modelValue <= min" @click="step(-1)">
      −
    </button>
    <input
      class="ui-num__el"
      type="text"
      inputmode="numeric"
      :value="String(modelValue ?? '')"
      :disabled="disabled"
      @input="onInput"
      @blur="normalize"
    />
    <button class="ui-num__btn" type="button" :disabled="disabled || modelValue >= max" @click="step(1)">
      +
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    disabled?: boolean;
  }>(),
  { min: 0, max: 999, disabled: false },
);

const emit = defineEmits<{ "update:modelValue": [v: number] }>();

function clamp(v: number) {
  if (Number.isNaN(v)) return props.min;
  return Math.min(props.max, Math.max(props.min, Math.round(v)));
}

function step(d: number) {
  emit("update:modelValue", clamp(props.modelValue + d));
}

function onInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value);
  emit("update:modelValue", Number.isNaN(v) ? props.modelValue : v);
}

function normalize() {
  emit("update:modelValue", clamp(props.modelValue));
}
</script>

<style scoped>
.ui-num {
  display: flex;
  align-items: center;
  border: 0.01rem solid var(--ui-border);
  border-radius: var(--ui-radius);
  background: #fff;
  overflow: hidden;
  width: 100%;
}
.ui-num__btn {
  border: none;
  background: #fafafa;
  font-size: 0.1rem;
  line-height: 1;
  width: 0.15rem;
  height: 0.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--ui-text-2);
  flex-shrink: 0;
}
.ui-num__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.ui-num__btn:active:not(:disabled) {
  background: #eef;
}
.ui-num__el {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  text-align: center;
  font-size: 0.09rem;
  padding: 0.05rem 0.02rem;
  color: var(--ui-text);
  background: transparent;
  font-family: inherit;
}
</style>
