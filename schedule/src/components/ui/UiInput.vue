<template>
  <div class="ui-input" :class="{ 'ui-input--focused': focused, 'ui-input--disabled': disabled }">
    <input
      v-if="type !== 'textarea'"
      class="ui-input__el"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
    />
    <textarea
      v-else
      class="ui-input__el ui-input__textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    type?: "text" | "password" | "textarea";
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
  }>(),
  { placeholder: "", type: "text", disabled: false, readonly: false, rows: 3 },
);

const emit = defineEmits<{ "update:modelValue": [v: string] }>();

const focused = ref(false);

function onInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLInputElement).value);
}
</script>

<style scoped>
.ui-input {
  display: flex;
  align-items: center;
  background: #fff;
  border: 0.01rem solid var(--ui-border);
  border-radius: var(--ui-radius);
  transition: border-color 0.15s;
  width: 100%;
}
.ui-input--focused {
  border-color: var(--ui-primary);
}
.ui-input--disabled {
  background: #fafafa;
}
.ui-input__el {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.11rem;
  padding: 0.07rem 0.1rem;
  color: var(--ui-text);
  font-family: inherit;
}
.ui-input__el::placeholder {
  color: var(--ui-text-3);
}
.ui-input__textarea {
  resize: none;
  line-height: 1.4;
}
</style>
