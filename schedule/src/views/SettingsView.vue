<template>
  <div class="settings-container">
    <div class="settings-header">
      <UiButton variant="ghost" circle size="sm" class="back-btn" @click="goBack">
        <template #icon>
          <ChevronLeft />
        </template>
      </UiButton>
      <span class="title">设置</span>
      <UiButton variant="text" class="save-btn" @click="onSave">
        保存
      </UiButton>
    </div>

    <div class="group">
      <div class="group-title">显示设置</div>
      <div class="row">
        <span class="label">显示周末</span>
        <UiSwitch v-model="settings.showWeekend" class="ctrl" />
      </div>
    </div>

    <div class="group">
      <div class="group-title">特殊状态显示方式</div>
      <div class="row">
        <span class="label">免修</span>
        <UiSwitch v-model="settings.specialDisplay.exempt" class="ctrl" />
      </div>
      <div class="row">
        <span class="label">置换</span>
        <UiSwitch v-model="settings.specialDisplay.replaced" class="ctrl" />
      </div>
      <div class="row">
        <span class="label">退课</span>
        <UiSwitch v-model="settings.specialDisplay.dropped" class="ctrl" />
      </div>
      <div class="row">
        <span class="label">线上课</span>
        <UiSwitch v-model="settings.specialDisplay.online" class="ctrl" />
      </div>
      <div class="row">
        <span class="label">混合课</span>
        <UiSwitch v-model="settings.specialDisplay.hybrid" class="ctrl" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { UiButton, UiSwitch, uiMessage } from "@/components/ui";
import { ChevronLeft } from "lucide-vue-next";
import { settings, saveSettings } from "@/composables/useTimetable";

const router = useRouter();

function goBack() {
  router.back();
}

function onSave() {
  saveSettings();
  uiMessage.success("设置已保存");
}
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  width: min(94vw, 4.6rem);
  margin: 0 auto;
  font-size: 0.1rem;
  overflow-y: auto;
  padding-bottom: 0.4rem;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.1rem 0;

  .back-btn {
    color: var(--ui-text-2);
  }

  .title {
    font-size: 0.15rem;
    font-weight: bold;
    color: #333;
  }

  .save-btn {
    font-size: 0.1rem;
    font-weight: bold;
  }
}

.group {
  margin-top: 0.1rem;
  padding: 0.02rem 0.12rem;
  border: 0.01rem solid #eee;
  border-radius: 0.1rem;
  background: #fff;

  .group-title {
    padding: 0.08rem 0 0.06rem;
    font-size: 0.09rem;
    color: #42b983;
    font-weight: bold;
    border-bottom: 0.01rem solid #f3f3f3;
    margin-bottom: 0.02rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 0.34rem;
    padding: 0.03rem 0;

    &:not(:last-child) {
      border-bottom: 0.01rem solid #f7f7f7;
    }

    .label {
      font-size: 0.09rem;
      color: #555;
    }

    /* 统一控件尺寸 */
    .ctrl {
      width: 1.25rem;
    }

    .ctrl-wrap {
      display: flex;
      align-items: center;
      gap: 0.03rem;

      .unit {
        font-size: 0.08rem;
        color: #999;
      }
    }
  }
}

/* 日期输入：与 naive 控件视觉统一 */
.date-input {
  width: 1.25rem;
  height: 0.26rem;
  box-sizing: border-box;
  border: 0.01rem solid #d9d9d9;
  border-radius: 0.04rem;
  padding: 0 0.06rem;
  font-size: 0.09rem;
  color: #333;
  background: #fff;
  outline: none;

  &:focus {
    border-color: #42b983;
  }
}

/* 桌面端（≥1024px）：100vw 全屏布局 + 四周留白 */
@media (min-width: 64em) {
  .settings-container {
    width: 100vw;
    padding: 0.05rem 0.12rem;
  }
}
</style>
