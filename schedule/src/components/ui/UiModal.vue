<template>
  <Teleport to="body">
    <Transition name="ui-modal">
      <div v-if="show" class="ui-modal">
        <div class="ui-modal__mask" @click="onMask" />
        <div class="ui-modal__card" :style="{ width }">
          <div class="ui-modal__head">
            <span class="ui-modal__title">{{ title }}</span>
            <button class="ui-modal__close" type="button" @click="emit('update:show', false)">
              ✕
            </button>
          </div>
          <div class="ui-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="ui-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    show: boolean;
    title?: string;
    width?: string;
    maskClose?: boolean;
  }>(),
  { title: "", width: "min(92vw, 4.4rem)", maskClose: true },
);

const emit = defineEmits<{ "update:show": [v: boolean] }>();

function onMask() {
  if (maskCloseEnabled()) emit("update:show", false);
}

// maskClose 通过 props 读取（避免闭包问题）
import { getCurrentInstance } from "vue";
function maskCloseEnabled() {
  const p = getCurrentInstance()?.props as { maskClose?: boolean } | undefined;
  return p?.maskClose ?? true;
}
</script>

<style scoped>
.ui-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem;
}
.ui-modal__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}
.ui-modal__card {
  position: relative;
  background: #fff;
  border-radius: 0.1rem;
  box-shadow: 0 0.04rem 0.16rem rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 86vh;
  overflow: hidden;
}
.ui-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.09rem 0.12rem;
  border-bottom: 0.01rem solid #f2f2f2;
  flex-shrink: 0;
}
.ui-modal__title {
  font-size: 0.13rem;
  font-weight: bold;
  color: var(--ui-text);
}
.ui-modal__close {
  border: none;
  background: transparent;
  font-size: 0.11rem;
  color: var(--ui-text-2);
  cursor: pointer;
  padding: 0.02rem;
  line-height: 1;
}
.ui-modal__body {
  overflow-y: auto;
  padding: 0.08rem 0.12rem;
  flex: 1;
  min-height: 0;
}
.ui-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.06rem;
  padding: 0.07rem 0.12rem;
  border-top: 0.01rem solid #f2f2f2;
  flex-shrink: 0;
}

.ui-modal-enter-active,
.ui-modal-leave-active {
  transition: opacity 0.18s;
}
.ui-modal-enter-active .ui-modal__card,
.ui-modal-leave-active .ui-modal__card {
  transition: transform 0.18s;
}
.ui-modal-enter-from,
.ui-modal-leave-to {
  opacity: 0;
}
.ui-modal-enter-from .ui-modal__card,
.ui-modal-leave-to .ui-modal__card {
  transform: translateY(0.04rem) scale(0.98);
}
</style>
