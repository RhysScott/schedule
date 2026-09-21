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
      <Transition name="ui-select-fade">
        <div
          v-if="open"
          ref="panelRef"
          class="ui-select__panel"
          :class="{ 'ui-select__panel--up': openUp }"
          :style="{
            top: panelTop + 'px',
            left: panelLeft + 'px',
            minWidth: panelWidth + 'px',
            maxHeight: panelMaxHeight + 'px',
          }"
          @mousedown.prevent
        >
          <div
            v-for="(o, i) in options"
            :key="o.value"
            class="ui-select__option"
            :class="{
              'ui-select__option--active': o.value === modelValue,
              'ui-select__option--hover': i === hoverIndex,
            }"
            @click="pick(o)"
            @mousemove="hoverIndex = i"
          >
            {{ o.label }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

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
const panelRef = ref<HTMLElement | null>(null);
const panelTop = ref(0);
const panelLeft = ref(0);
const panelWidth = ref(0);
const panelMaxHeight = ref(288);
const openUp = ref(false);
const hoverIndex = ref(-1);

const PANEL_MAX = 288; // px，约 1.8rem

const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null);

function toggle() {
  if (props.disabled) return;
  if (!open.value) {
    open.value = true;
    hoverIndex.value = Math.max(
      0,
      props.options.findIndex((o) => o.value === props.modelValue),
    );
    positionPanel();
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeydown);
    nextTickPosition();
  } else {
    close();
  }
}

function positionPanel() {
  const r = rootRef.value!.getBoundingClientRect();
  const vh = window.innerHeight;
  panelLeft.value = r.left;
  panelWidth.value = r.width;
  const itemH = Math.min(props.options.length, 8) * 32 + 8;
  const panelH = Math.min(PANEL_MAX, itemH + 8);
  const spaceBelow = vh - r.bottom - 8;
  if (spaceBelow >= panelH) {
    openUp.value = false;
    panelTop.value = r.bottom + 2;
    panelMaxHeight.value = Math.min(PANEL_MAX, spaceBelow - 2);
  } else {
    // 下方放不下：向上展开
    openUp.value = true;
    panelTop.value = Math.max(8, r.top - panelH - 2);
    panelMaxHeight.value = Math.min(PANEL_MAX, r.top - 10);
  }
}

// Teleport 后等 DOM 挂载再精确测一次面板高度
function nextTickPosition() {
  requestAnimationFrame(() => {
    const panel = panelRef.value;
    if (!panel) return;
    const ph = panel.offsetHeight;
    const r = rootRef.value!.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom + 2 + ph > vh - 8) {
      openUp.value = true;
      panelTop.value = Math.max(8, r.top - ph - 2);
    } else {
      openUp.value = false;
      panelTop.value = r.bottom + 2;
    }
  });
}

function close() {
  if (!open.value) return;
  open.value = false;
  window.removeEventListener("scroll", onScroll, true);
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKeydown);
}

/** 面板内部滚动不关闭，只有页面滚动才关闭 */
function onScroll(e: Event) {
  const t = e.target as Node;
  if (panelRef.value && panelRef.value.contains(t)) return;
  close();
}

function onDocClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) close();
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return;
  if (e.key === "Escape") {
    close();
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    hoverIndex.value = (hoverIndex.value + 1) % props.options.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    hoverIndex.value =
      (hoverIndex.value - 1 + props.options.length) % props.options.length;
  } else if (e.key === "Enter") {
    e.preventDefault();
    const o = props.options[hoverIndex.value];
    if (o) pick(o);
  }
}

function pick(o: UiOption) {
  emit("update:modelValue", o.value);
  close();
}

watch(open, (v) => {
  if (v) nextTickPosition();
});

onBeforeUnmount(close);
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
  box-shadow: 0 0.04rem 0.14rem rgba(0, 0, 0, 0.14);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.02rem;
}
.ui-select__option {
  padding: 0.06rem 0.1rem;
  font-size: 0.09rem;
  color: var(--ui-text);
  cursor: pointer;
  white-space: nowrap;
  border-radius: 0.03rem;
  transition: background 0.1s;
}
.ui-select__option:hover,
.ui-select__option--hover {
  background: #f5f5f5;
}
.ui-select__option--active {
  background: var(--ui-primary-soft);
  color: var(--ui-primary-deep);
}
.ui-select-fade-enter-active,
.ui-select-fade-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.ui-select-fade-enter-from,
.ui-select-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.01rem);
}
.ui-select__panel--up.ui-select-fade-enter-from,
.ui-select__panel--up.ui-select-fade-leave-to {
  transform: translateY(0.01rem);
}
</style>
