<template>
  <div class="ui-form-item" :class="{ 'ui-form-item--required': required }">
    <label v-if="label" class="ui-form-item__label">{{ label }}</label>
    <div class="ui-form-item__content">
      <slot />
    </div>
    <p v-if="error" class="ui-form-item__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    required?: boolean;
    error?: string;
  }>(),
  { label: "", required: false, error: "" },
);
</script>

<style scoped>
.ui-form-item {
  margin-bottom: 0.07rem;
}
.ui-form-item__label {
  display: block;
  font-size: 0.1rem;
  color: var(--ui-text-2);
  margin-bottom: 0.03rem;
}
.ui-form-item--required .ui-form-item__label::before {
  content: "* ";
  color: var(--ui-danger);
}
.ui-form-item__error {
  font-size: 0.065rem;
  color: var(--ui-danger);
  margin-top: 0.02rem;
}
</style>
