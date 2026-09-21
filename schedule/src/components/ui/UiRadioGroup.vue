<template>
  <div class="ui-radio" :class="{ 'ui-radio--disabled': disabled }">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="ui-radio__btn"
      :class="{ 'ui-radio__btn--active': o.value === modelValue }"
      :disabled="disabled"
      @click="pick(o)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface UiRadioOption {
  label: string;
  value: string | number;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    options: UiRadioOption[];
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ "update:modelValue": [v: string | number] }>();

function pick(o: UiRadioOption) {
  if (props.disabled) return;
  emit("update:modelValue", o.value);
}
</script>

<style scoped>
.ui-radio {
  display: flex;
  flex-wrap: wrap;
  gap: 0.04rem;
}
.ui-radio__btn {
  border: 0.01rem solid var(--ui-border);
  background: #fff;
  border-radius: var(--ui-radius);
  font-size: 0.08rem;
  padding: 0.04rem 0.08rem;
  cursor: pointer;
  color: var(--ui-text-2);
  transition: all 0.15s;
  font-family: inherit;
}
.ui-radio__btn--active {
  background: var(--ui-primary);
  border-color: var(--ui-primary);
  color: #fff;
}
.ui-radio__btn:disabled {
  cursor: not-allowed;
}
.ui-radio--disabled .ui-radio__btn {
  opacity: 0.5;
}
.ui-radio--disabled .ui-radio__btn--active {
  opacity: 0.7;
}
</style>
