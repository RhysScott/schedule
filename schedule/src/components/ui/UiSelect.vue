<template>
  <div class="ui-select" ref="rootRef">
    <button
      class="ui-select__trigger"
      type="button"
      :class="{ 'ui-select__trigger--open': open }"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="ui-select__value" :class="{ 'ui-select__value--placeholder': !selected }">
        {{ selected ? selected.label : placeholder }}
      </span>
      <span class="ui-select__arrow" :class="{ 'ui-select__arrow--open': open }">▾</span>
    </button>
    <Teleport to="body">
      <div
        v-if="open"
        class="ui-select__panel"
        :style="{ top: panelTop + 'px', left: panelLeft + 'px', minWidth: panelWidth + 'px' }"
      >
        <div
          v-for="o in options"
          :key="o.value"
          class="ui-select__option"
          :class="{ 'ui-select__option--active': o.value === modelValue }"
          @click="pick(o)"
        >
          {{ o.label }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export interface UiOption {
  label: string;
  value: string | number;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null;
    options: UiOption[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  { placeholder: "请选择", disabled: false },
);

const emit = defineEmits<{ "update:modelValue": [v: string | number] }>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const panelTop = ref(0);
const panelLeft = ref(0);
const panelWidth = ref(0);

const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null);

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) {
    const r = rootRef.value!.getBoundingClientRect();
    panelTop.value = r.bottom + 2;
    panelLeft.value = r.left;
    panelWidth.value = r.width;
    window.addEventListener("scroll", close, true);
    document.addEventListener("click", onDocClick);
  }
}

function close() {
  open.value = false;
  window.removeEventListener("scroll", close, true);
  document.removeEventListener("click", onDocClick);
}

function onDocClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) close();
}

function pick(o: UiOption) {
  emit("update:modelValue", o.value);
  close();
}

onBeforeUnmount(close);
onMounted(() => {
  // 确保点击选择器外的区域能关闭（初次挂载注册）
});
</script>

<style scoped>
.ui-select {
  position: relative;
  width: 100%;
}
.ui-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: 0.01rem solid var(--ui-border);
  border-radius: var(--ui-radius);
  background: #fff;
  padding: 0.07rem 0.1rem;
  font-size: 0.11rem;
  cursor: pointer;
  color: var(--ui-text);
  font-family: inherit;
  transition: border-color 0.15s;
}
.ui-select__trigger:disabled {
  background: #fafafa;
  cursor: not-allowed;
  opacity: 0.7;
}
.ui-select__trigger--open {
  border-color: var(--ui-primary);
}
.ui-select__value--placeholder {
  color: var(--ui-text-3);
}
.ui-select__arrow {
  font-size: 0.07rem;
  color: var(--ui-text-3);
  transition: transform 0.15s;
  flex-shrink: 0;
}
.ui-select__arrow--open {
  transform: rotate(180deg);
}
.ui-select__panel {
  position: fixed;
  z-index: 3000;
  background: #fff;
  border: 0.01rem solid var(--ui-border);
  border-radius: var(--ui-radius);
  box-shadow: 0 0.03rem 0.1rem rgba(0, 0, 0, 0.12);
  overflow: hidden;
  max-height: 1.8rem;
  overflow-y: auto;
}
.ui-select__option {
  padding: 0.055rem 0.1rem;
  font-size: 0.09rem;
  color: var(--ui-text);
  cursor: pointer;
  white-space: nowrap;
}
.ui-select__option:hover {
  background: #f5f5f5;
}
.ui-select__option--active {
  background: var(--ui-primary-soft);
  color: var(--ui-primary-deep);
}
</style>
