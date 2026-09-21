<template>
  <input
    type="time"
    class="ui-time"
    :value="modelValue"
    :disabled="disabled"
    @input="onInput"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ "update:modelValue": [v: string] }>();

function onInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLInputElement).value);
}
</script>

<style scoped>
.ui-time {
  width: 1.25rem;
  height: 0.26rem;
  border: 0.01rem solid var(--ui-border);
  border-radius: var(--ui-radius);
  padding: 0 0.06rem;
  font-size: 0.09rem;
  color: var(--ui-text);
  background: #fff;
  outline: none;
  font-family: inherit;
}
.ui-time:focus {
  border-color: var(--ui-primary);
}
</style>
