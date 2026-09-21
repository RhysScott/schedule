<template>
  <div class="tt-container">
    <div class="tt-header">
      <UiButton variant="ghost" circle size="sm" class="tt-back" @click="goBack">
        <template #icon>
          <ChevronLeft />
        </template>
      </UiButton>
      <span class="tt-title">全部课表</span>
      <UiButton
        variant="ghost"
        circle
        size="sm"
        class="tt-import-btn"
        title="通过课表码导入"
        @click="openImport"
      >
        <template #icon>
          <Download />
        </template>
      </UiButton>
    </div>

    <div class="tt-list">
      <div
        v-for="(t, i) in timetables"
        :key="i"
        class="tt-card"
        :class="{ current: i === currentTimetableIndex }"
        @click="select(i)"
      >
        <div class="tt-avatar">
          {{ (t.enrollment.studentName || t.owner).charAt(0) }}
        </div>
        <div class="tt-info">
          <div class="tt-owner">
            {{ t.owner }}
            <UiTag v-if="t.syncEnabled" type="info" class="tt-sync-tag">同步</UiTag>
            <span v-if="i === currentTimetableIndex" class="tt-current">当前</span>
          </div>
          <div class="tt-sub">
            {{ t.enrollment.studentName || "未填写姓名" }} ·
            {{ t.enrollment.courses.length }} 门课
          </div>
          <div class="tt-sub">{{ t.enrollment.term }}</div>
        </div>
        <div class="tt-actions">
          <UiButton
            variant="ghost"
            circle
            size="tiny"
            class="tt-icon-btn"
            title="导出课表码"
            @click.stop="share(i)"
          >
            <template #icon>
              <Share2 />
            </template>
          </UiButton>
          <UiButton
            variant="ghost"
            circle
            size="tiny"
            class="tt-icon-btn"
            title="删除课表"
            @click.stop="confirmDelete = i"
          >
            <template #icon>
              <Trash2 />
            </template>
          </UiButton>
        </div>
      </div>
    </div>

    <div class="tt-tip">
      点击课表卡片切换查看 · 分享按钮可导出课表码
      <template v-if="!isLoggedIn">未登录时数据仅保存在本机</template>
    </div>

    <!-- 导入课表码弹窗 -->
    <UiModal :show="importShow" title="导入课表" @update:show="(v: boolean) => (importShow = v)">
      <UiInput
        v-model="importCode"
        type="textarea"
        :rows="2"
        placeholder="粘贴对方分享的课表码"
      />
      <div class="import-mode">
        <div class="mode-label">导入方式</div>
        <UiRadioGroup
          v-model="importMode"
          :options="[
            { label: '仅拷贝数据，互不影响', value: 'copy' },
            { label: '同步导入，实时跟随源课表', value: 'sync' },
          ]"
        />
      </div>
      <template #footer>
        <div class="import-footer">
          <UiButton variant="ghost" @click="importShow = false">取消</UiButton>
          <UiButton variant="primary" :disabled="importing" @click="doImport">
            {{ importing ? "导入中…" : "导入" }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- 删除确认弹窗 -->
    <UiModal
      :show="confirmDelete >= 0"
      title="删除课表"
      @update:show="(v: boolean) => (v || (confirmDelete = -1))"
    >
      <p class="tt-confirm-text">
        确定删除「{{ confirmDelete >= 0 ? timetables[confirmDelete]?.owner : "" }}」的课表？
      </p>
      <template #footer>
        <div class="import-footer">
          <UiButton variant="ghost" @click="confirmDelete = -1">取消</UiButton>
          <UiButton variant="danger" @click="doDelete(confirmDelete)">删除</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  UiButton,
  UiInput,
  UiModal,
  UiRadioGroup,
  UiTag,
  uiMessage,
} from "@/components/ui";
import { ChevronLeft, Download, Share2, Trash2 } from "lucide-vue-next";
import {
  timetables,
  currentTimetableIndex,
} from "@/composables/useTimetable";
import { isLoggedIn } from "@/composables/useAuth";
import {
  deleteTimetable,
  fetchShareCode,
  importTimetable,
} from "@/composables/useTimetable";

const router = useRouter();


const importShow = ref(false);
const importCode = ref("");
const importMode = ref<"copy" | "sync">("copy");
const importing = ref(false);
const confirmDelete = ref(-1);

function select(i: number) {
  currentTimetableIndex.value = i;
  router.push("/");
}

function goBack() {
  router.push("/");
}

function openImport() {
  importCode.value = "";
  importShow.value = true;
}

async function share(i: number) {
  try {
    const code = await fetchShareCode(i);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // 兼容无剪贴板权限的环境：textarea + execCommand 兜底
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    uiMessage.success("课表码已复制，分享给好友即可导入");
  } catch (e) {
    uiMessage.error("复制失败：" + ((e as Error).message ?? String(e)));
  }
}

async function doImport() {
  const code = importCode.value.trim();
  if (!code) {
    uiMessage.warning("请粘贴课表码");
    return;
  }
  importing.value = true;
  try {
    const data = await importTimetable(code, importMode.value);
    timetables.value = data.timetables;
    currentTimetableIndex.value = data.index;
    uiMessage.success(
      importMode.value === "sync" ? "同步导入成功，源课表变化会自动更新" : "导入成功，已切换到新课表",
    );
    importShow.value = false;
    router.push("/");
  } catch (e) {
    uiMessage.error("导入失败：" + ((e as Error).message ?? String(e)));
  } finally {
    importing.value = false;
  }
}

async function doDelete(i: number) {
  try {
    timetables.value = await deleteTimetable(i);
    if (currentTimetableIndex.value >= timetables.value.length) {
      currentTimetableIndex.value = timetables.value.length - 1;
    }
    uiMessage.success("课表已删除");
  } catch (e) {
    uiMessage.error("删除失败：" + ((e as Error).message ?? String(e)));
  } finally {
    confirmDelete.value = -1;
  }
}
</script>

<style scoped>
.tt-container {
  display: flex;
  flex-direction: column;
  width: min(94vw, 4.6rem);
  margin: 0 auto;
  font-size: 0.1rem;
}

.tt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.08rem 0;

  .tt-back,
  .tt-import-btn {
    color: var(--ui-text-2);
  }

  .tt-title {
    font-size: 0.14rem;
    font-weight: bold;
    color: #333;
  }
}

.tt-list {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin-top: 0.1rem;
  overflow-y: auto;
}

.tt-card {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.1rem;
  border: 0.01rem solid #eee;
  border-radius: 0.08rem;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #42b983;
  }

  &.current {
    border-color: #42b983;
    background: #f2faf6;
  }

  .tt-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #e2f0cb;
    color: #5a8a4e;
    font-size: 0.2rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .tt-info {
    flex: 1;
    min-width: 0;

    .tt-owner {
      display: flex;
      align-items: center;
      gap: 0.05rem;
      font-size: 0.13rem;
      font-weight: bold;
      color: #333;

      .tt-current {
        padding: 0 0.04rem;
        font-size: 0.07rem;
        font-weight: normal;
        color: #42b983;
        background: #eafaf3;
        border-radius: 0.2rem;
      }
    }

    .tt-sub {
      margin-top: 0.02rem;
      font-size: 0.08rem;
      color: #999;
    }
  }

  .tt-actions {
    display: flex;
    align-items: center;
    gap: 0.02rem;
    flex-shrink: 0;

    .tt-icon-btn {
      color: var(--ui-text-2);
    }
  }
}

.tt-tip {
  margin-top: 0.12rem;
  text-align: center;
  font-size: 0.08rem;
  color: #bbb;
}

.import-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.06rem;
}

.tt-confirm-text {
  font-size: 0.09rem;
  color: var(--ui-text);
  margin: 0.02rem 0;
}

/* 桌面端（≥1024px）：100vw 全屏布局 + 四周留白 */
@media (min-width: 64em) {
  .tt-container {
    width: 100vw;
    padding: 0.05rem 0.12rem;
  }
}
.import-mode {
  margin-top: 0.1rem;
  padding: 0.08rem 0.1rem;
  background: var(--ui-bg);
  border-radius: var(--ui-radius);
}
.mode-label {
  font-size: 0.08rem;
  color: var(--ui-text-3);
  margin-bottom: 0.05rem;
}
</style>
