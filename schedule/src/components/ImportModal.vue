<template>
  <UiModal :show="show" title="导入课表" width="min(92vw, 4.6rem)" @update:show="$emit('update:show', $event)">
    <div class="import-modal">
      <div class="tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab"
          :class="{ active: tab === t.key }"
          type="button"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- 教务在线 -->
      <div v-if="tab === 'jw-url'" class="pane">
        <p class="hint">输入成都东软学院教务系统账号，自动抓取本学期课表</p>
        <UiInput v-model="jwUsername" placeholder="学号" />
        <UiInput v-model="jwPassword" type="password" placeholder="密码" />
        <UiButton variant="primary" block :disabled="loading || !jwUsername.trim() || !jwPassword" @click="importByJwLogin">
          {{ loading ? "登录抓取中…" : "登录并导入" }}
        </UiButton>
      </div>

      <!-- 教务 JSON -->
      <div v-else-if="tab === 'jw-json'" class="pane">
        <p class="hint">选择教务系统导出的 JSON 课表文件</p>
        <input ref="fileRef" type="file" accept=".json,application/json" hidden @change="onFileChange" />
        <UiButton variant="soft" block :disabled="loading" @click="fileRef?.click()">
          选择 JSON 文件
        </UiButton>
        <p v-if="fileName" class="file-name">{{ fileName }}</p>
        <p v-if="loading" class="file-name">解析导入中…</p>
      </div>

      <!-- 课表码 -->
      <div v-else class="pane">
        <p class="hint">输入他人课表的课表码导入</p>
        <UiInput v-model="code" placeholder="粘贴课表码" />
        <UiFormItem label="导入方式">
          <UiRadioGroup v-model="mode" :options="modeOptions" />
        </UiFormItem>
        <UiButton variant="primary" block :disabled="loading || !code.trim()" @click="importByCode">
          {{ loading ? "导入中…" : "导入课表" }}
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import UiModal from "@/components/ui/UiModal.vue";
import UiInput from "@/components/ui/UiInput.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiFormItem from "@/components/ui/UiFormItem.vue";
import UiRadioGroup from "@/components/ui/UiRadioGroup.vue";
import { uiMessage } from "@/components/ui";
import { importJwData, importTimetable } from "@/composables/useTimetable";

defineProps<{ show: boolean }>();
const emit = defineEmits<{ "update:show": [v: boolean]; imported: [index: number] }>();

const tabs = [
  { key: "jw-url", label: "教务在线" },
  { key: "jw-json", label: "教务 JSON" },
  { key: "code", label: "课表码" },
];
const tab = ref<string>("jw-url");

const loading = ref(false);
const jwUsername = ref("");
const jwPassword = ref("");
const code = ref("");
const mode = ref<"copy" | "sync">("copy");
const modeOptions = [
  { label: "拷贝数据", value: "copy" },
  { label: "同步更新", value: "sync" },
];
const fileRef = ref<HTMLInputElement | null>(null);
const fileName = ref("");

async function importByJwLogin() {
  loading.value = true;
  try {
    const res = await fetch("/api/jw/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: jwUsername.value.trim(), password: jwPassword.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? "教务抓取失败");
    const r = await importJwData(data);
    uiMessage.success("导入成功");
    emit("imported", r.index);
    emit("update:show", false);
  } catch (e) {
    uiMessage.error("导入失败：" + ((e as Error).message ?? String(e)));
  } finally {
    loading.value = false;
  }
}

function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  fileName.value = file.name;
  loading.value = true;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      let data: any;
      try {
        data = JSON.parse(String(reader.result));
      } catch {
        throw new Error("文件不是有效 JSON");
      }
      const r = await importJwData(data);
      uiMessage.success("导入成功");
      emit("imported", r.index);
      emit("update:show", false);
    } catch (e) {
      uiMessage.error("导入失败：" + ((e as Error).message ?? String(e)));
    } finally {
      loading.value = false;
      input.value = "";
    }
  };
  reader.onerror = () => {
    loading.value = false;
    uiMessage.error("文件读取失败");
    input.value = "";
  };
  reader.readAsText(file);
}

async function importByCode() {
  loading.value = true;
  try {
    const r = await importTimetable(code.value.trim(), mode.value);
    uiMessage.success("导入成功");
    emit("imported", r.index);
    emit("update:show", false);
  } catch (e) {
    uiMessage.error("导入失败：" + ((e as Error).message ?? String(e)));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.import-modal {
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
}

.tabs {
  display: flex;
  background: #f4f5f7;
  border-radius: 0.09rem;
  padding: 0.02rem;
  gap: 0.02rem;
}

.tab {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.075rem;
  padding: 0.05rem 0;
  border-radius: 0.07rem;
  color: #777;
  cursor: pointer;
}

.tab.active {
  background: #fff;
  color: #333;
  font-weight: 600;
  box-shadow: 0 0.01rem 0.03rem rgba(0, 0, 0, 0.06);
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.hint {
  font-size: 0.068rem;
  color: #999;
  margin: 0;
}

.file-name {
  font-size: 0.068rem;
  color: #666;
  margin: 0;
  text-align: center;
}
</style>
