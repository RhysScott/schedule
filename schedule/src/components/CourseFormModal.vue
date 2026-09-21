<template>
  <UiModal
    :show="show"
    :title="mode === 'add' ? '添加课程' : '修改课程'"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <div class="modal-body">
      <div class="form-section">基本信息</div>
        <UiFormItem label="课程名称" required>
          <UiInput v-model="form.courseName" placeholder="如：高等数学" />
        </UiFormItem>
        <div class="form-row">
          <UiFormItem label="授课老师" class="half">
            <UiInput v-model="form.teacher" placeholder="选填" />
          </UiFormItem>
          <UiFormItem label="学分" class="half">
            <UiInputNumber v-model="form.credit" :min="0" :max="20" />
          </UiFormItem>
        </div>
        <UiFormItem label="状态">
          <UiSelect v-model="form.enrollStatus" :options="statusOptions" />
        </UiFormItem>

      <div class="form-section">上课时间，可添加多个时间段</div>
      <div
        v-for="(seg, idx) in form.segments"
        :key="idx"
        class="seg-block"
      >
        <div class="seg-head">
          <span class="seg-title">时间段 {{ idx + 1 }}</span>
          <UiButton
            v-if="form.segments.length > 1"
            variant="ghost"
            circle
            size="tiny"
            title="删除该时间段"
            @click="removeSegment(idx)"
          >
            <template #icon>
              <Trash2 />
            </template>
          </UiButton>
        </div>
        <div class="form-row">
          <UiFormItem label="开始节次" class="half">
            <UiSelect
              v-model="seg.periodStart"
              :options="periodOptions"
              :disabled="isLocked(idx)"
            />
          </UiFormItem>
          <UiFormItem label="结束节次" class="half">
            <UiSelect v-model="seg.periodEnd" :options="periodOptions" />
          </UiFormItem>
        </div>
        <div class="form-row">
          <UiFormItem label="起始周" class="half">
            <UiInputNumber v-model="seg.weekStart" :min="1" :max="totalWeeks" />
          </UiFormItem>
          <UiFormItem label="结束周" class="half">
            <UiInputNumber v-model="seg.weekEnd" :min="1" :max="totalWeeks" />
          </UiFormItem>
        </div>
        <div class="form-row">
          <UiFormItem label="周类型" class="half">
            <UiRadioGroup v-model="seg.weekType" :options="weekTypeOptions" />
          </UiFormItem>
          <UiFormItem label="授课方式" class="half">
            <UiSelect v-model="seg.mode" :options="modeOptions" />
          </UiFormItem>
        </div>
        <UiFormItem label="教室">
          <UiInput v-model="seg.room" placeholder="线上课可留空" />
        </UiFormItem>
        <UiFormItem label="备注">
          <UiInput v-model="seg.remark" placeholder="如：线上授课" />
        </UiFormItem>
      </div>
      <UiButton dashed block class="add-seg" @click="addSegment">
        <template #icon>
          <Plus />
        </template>
        添加时间段
      </UiButton>
    </div>
    <template #footer>
      <div class="footer">
        <UiButton variant="ghost" @click="emit('update:show', false)">取消</UiButton>
        <UiButton variant="primary" @click="handleSubmit">
          {{ mode === "add" ? "添加" : "保存" }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  UiButton,
  UiFormItem,
  UiInput,
  UiInputNumber,
  UiModal,
  UiRadioGroup,
  UiSelect,
  uiMessage,
} from "@/components/ui";
import { Plus, Trash2 } from "lucide-vue-next";
import type { CourseMode, EnrollStatus, WeekType } from "@/types/course";

/** 一个时间段（与 CourseSegment 字段对齐，segmentId 可空由后端生成） */
export interface CourseFormSegment {
  segmentId?: string | null;
  dayOfWeek: number;
  periodStart: number;
  periodEnd: number;
  weekStart: number;
  weekEnd: number;
  weekType: WeekType;
  mode: CourseMode;
  room: string;
  remark: string;
}

export interface CourseFormPayload {
  courseFields: {
    courseName: string;
    teacher: string;
    credit: number;
    enrollStatus: EnrollStatus;
  };
  segments: CourseFormSegment[];
}

const props = withDefaults(
  defineProps<{
    show: boolean;
    mode: "add" | "edit";
    /** 预填：编辑时传课程全部时间段；lockedSegmentIndex 为点击进入的那段（星期几锁定） */
    initial?: {
      courseFields?: {
        courseName: string;
        teacher: string;
        credit: number;
        enrollStatus: EnrollStatus;
      };
      segments?: CourseFormSegment[];
      lockedSegmentIndex?: number | null;
    } | null;
    /** 节次上限（总节数） */
    maxPeriod: number;
    /** 教学周总数 */
    totalWeeks: number;
  }>(),
  { initial: null },
);

const emit = defineEmits<{
  "update:show": [v: boolean];
  save: [payload: CourseFormPayload];
}>();



const statusOptions = [
  { label: "正常", value: "normal" },
  { label: "免修", value: "exempt" },
  { label: "置换", value: "replaced" },
  { label: "退课", value: "dropped" },
];

const modeOptions = [
  { label: "线下", value: "offline" },
  { label: "线上", value: "online" },
  { label: "混合", value: "hybrid" },
];


const weekTypeOptions = [
  { label: "连续周", value: "all" },
  { label: "单周", value: "odd" },
  { label: "双周", value: "even" },
];

const periodOptions = computed(() =>
  Array.from({ length: Math.max(props.maxPeriod, 1) }, (_, i) => ({
    label: `第${i + 1}节`,
    value: i + 1,
  })),
);

function defaultSegment(): CourseFormSegment {
  return {
    segmentId: null,
    dayOfWeek: 1,
    periodStart: 1,
    periodEnd: 1,
    weekStart: 1,
    weekEnd: props.totalWeeks,
    weekType: "all",
    mode: "offline",
    room: "",
    remark: "",
  };
}

const form = reactive<{
  courseName: string;
  teacher: string;
  credit: number;
  enrollStatus: EnrollStatus;
  segments: CourseFormSegment[];
}>({
  courseName: "",
  teacher: "",
  credit: 1,
  enrollStatus: "normal",
  segments: [],
});

const lockedIndexes = ref<number[]>([]);

/** 打开时预填 */
watch(
  () => props.show,
  (v) => {
    if (!v) return;
    const init = props.initial;
    form.courseName = init?.courseFields?.courseName ?? "";
    form.teacher = init?.courseFields?.teacher ?? "";
    form.credit = init?.courseFields?.credit ?? 1;
    form.enrollStatus = init?.courseFields?.enrollStatus ?? "normal";
    form.segments =
      init?.segments && init.segments.length > 0
        ? init.segments.map((s) => ({ ...s }))
        : [defaultSegment()];
    lockedIndexes.value =
      props.mode === "edit" && init?.segments && init.segments.length > 0
        ? init.segments.map((_, i) => i)
        : [];
  },
);

/** 编辑模式：已有时间段的位置（星期几/起始节次）由点击确定，全部锁定；新增段不锁 */
function isLocked(idx: number) {
  return lockedIndexes.value.includes(idx);
}

function addSegment() {
  const last = form.segments[form.segments.length - 1];
  form.segments.push({
    ...defaultSegment(),
    dayOfWeek: last?.dayOfWeek ?? 1,
    periodStart: (last?.periodEnd ?? 0) + 1,
    periodEnd: (last?.periodEnd ?? 0) + 1,
    segmentId: null,
  });
}

function removeSegment(idx: number) {
  form.segments.splice(idx, 1);
  lockedIndexes.value = lockedIndexes.value
    .filter((x) => x !== idx)
    .map((x) => (x > idx ? x - 1 : x));
}

function handleSubmit() {
  if (!form.courseName.trim()) {
    uiMessage.warning("请输入课程名称");
    return;
  }
  for (const s of form.segments) {
    if (s.periodEnd < s.periodStart) {
      uiMessage.warning("时间段中存在结束节次早于开始节次");
      return;
    }
    if (s.weekEnd < s.weekStart) {
      uiMessage.warning("时间段中存在结束周早于起始周");
      return;
    }
  }
  emit("save", {
    courseFields: {
      courseName: form.courseName.trim(),
      teacher: form.teacher.trim(),
      credit: form.credit || 1,
      enrollStatus: form.enrollStatus,
    },
    segments: form.segments.map((s) => ({
      ...s,
      room: s.room.trim(),
      remark: s.remark.trim(),
    })),
  });
}
</script>

<style scoped>
.modal-body {
  overflow-y: auto;
  max-height: calc(86vh - 2.2rem);
  padding-right: 0.02rem;
}

.form-section {
  font-size: 0.14rem;
  font-weight: bold;
  color: #333;
  margin: 0.02rem 0 0.06rem;
  padding-left: 0.06rem;
  border-left: 0.02rem solid #42b983;
}

.form-row {
  /* 移动端一行一个组件，避免并排太挤 */
  display: flex;
  flex-direction: column;
  gap: 0.02rem;

  .half {
    flex: 1;
  }
}

@media (min-width: 64em) {
  .form-row {
    flex-direction: row;
    gap: 0.08rem;
  }
}

.seg-block {
  border: 0.01rem solid #eee;
  border-radius: 0.06rem;
  background: #fafafa;
  padding: 0.04rem 0.06rem 0;
  margin-bottom: 0.08rem;

  .seg-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.02rem;

    .seg-title {
      font-size: 0.1rem;
      font-weight: bold;
      color: #555;
    }
  }

  .lock-tip {
    font-size: 0.065rem;
    color: #999;
    margin-left: 0.05rem;
  }
}

.add-seg {
  margin-top: 0.02rem;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.06rem;
}
</style>
