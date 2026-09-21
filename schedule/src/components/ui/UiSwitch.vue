<template>
  <button
    type="button"
    class="ui-switch"
    :class="{ 'ui-switch--on': modelValue, 'ui-switch--disabled': disabled }"
    :disabled="disabled"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="ui-switch__dot" />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ modelValue: boolean; disabled?: boolean }>(), {
  disabled: false,
});

const emit = defineEmits<{ "update:modelValue": [v: boolean] }>();
</script>

<style scoped>
.ui-switch {
  width: 0.26rem;
  height: 0.15rem;
  border-radius: 0.08rem;
  border: 0.01rem solid var(--ui-border);
  background: #e5e5e5;
  position: relative;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  padding: 0;
  flex-shrink: 0;
}
.ui-switch__dot {
  position: absolute;
  top: 0.01rem;
  left: 0.02rem;
  width: 0.11rem;
  height: 0.11rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0.01rem 0.02rem rgba(0, 0, 0, 0.2);
  transition: left 0.15s;
}
.ui-switch--on {
  background: var(--ui-primary);
  border-color: var(--ui-primary);
}
.ui-switch--on .ui-switch__dot {
  left: 0.13rem;
}
.ui-switch--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
