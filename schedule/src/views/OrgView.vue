<template>
  <div class="org-container">
    <div class="top-bar">
      <UiButton variant="ghost" circle size="sm" @click="router.back()">
        <template #icon>
          <ChevronLeft />
        </template>
      </UiButton>
      <span class="title">组织</span>
      <div class="actions">
        <UiButton size="sm" @click="openJoin">
          <template #icon>
            <UserPlus />
          </template>
          加入
        </UiButton>
        <UiButton size="sm" variant="primary" @click="openCreate()">
          <template #icon>
            <Plus />
          </template>
          创建
        </UiButton>
      </div>
    </div>

    <div v-if="!isLoggedIn" class="login-hint">
      <UiEmpty text="登录后即可管理组织" />
    </div>

    <template v-else>
      <div v-if="pending.length" class="section">
        <div class="section-title">待审核</div>
        <div
          v-for="org in pending"
          :key="'p' + org.id"
          class="org-card"
          @click="openDetail(org)"
        >
          <div class="org-card__main">
            <div class="org-card__name">
              <Building2 class="org-icon" />
              <span>{{ org.name }}</span>
            </div>
            <div class="org-card__meta">
              组织码 <b>{{ org.orgCode }}</b>
            </div>
          </div>
          <UiTag type="warning">审核中</UiTag>
        </div>
      </div>

      <div class="section">
        <div class="section-title">我的组织</div>
        <div v-if="!myOrgs.length" class="empty-wrap">
          <UiEmpty text="还没有加入组织，点右上角创建或加入" />
        </div>
        <div
          v-for="org in myOrgs"
          :key="org.id"
          class="org-card"
          @click="openDetail(org)"
        >
          <div class="org-card__main">
            <div class="org-card__name">
              <Building2 class="org-icon" />
              <span>{{ org.name }}</span>
              <UiTag v-if="org.status === 'pending'" type="warning">审核中</UiTag>
              <UiTag v-else-if="org.adminUserId === currentUser?.id" type="primary">
                管理员
              </UiTag>
              <UiTag v-else>成员</UiTag>
            </div>
            <div class="org-card__meta">
              组织码 <b>{{ org.orgCode }}</b>
              <span v-if="org.parentName" class="parent-name">
                隶属于 {{ org.parentName }}
              </span>
            </div>
          </div>
          <ChevronRight class="chevron" />
        </div>
      </div>
    </template>

    <!-- 创建组织 -->
    <UiModal :show="createShow" title="创建组织" @update:show="createShow = $event">
      <UiFormItem label="组织名称">
        <UiInput v-model="createForm.name" placeholder="如：数学学院" />
      </UiFormItem>
      <UiFormItem label="父组织（可选）">
        <UiSelect
          v-model="createForm.parentId"
          :options="parentOptions"
          placeholder="顶级组织"
        />
      </UiFormItem>
      <template #footer>
        <div class="footer">
          <UiButton variant="ghost" @click="createShow = false">取消</UiButton>
          <UiButton variant="primary" :loading="creating" @click="submitCreate">
            创建
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- 加入组织 -->
    <UiModal :show="joinShow" title="加入组织" @update:show="joinShow = $event">
      <UiFormItem label="组织码">
        <UiInput
          v-model="joinCode"
          placeholder="输入组织码"
          :disabled="joining"
        />
      </UiFormItem>
      <p class="hint">申请后需组织管理员审核通过</p>
      <template #footer>
        <div class="footer">
          <UiButton variant="ghost" @click="joinShow = false">取消</UiButton>
          <UiButton variant="primary" :loading="joining" @click="submitJoin">
            申请加入
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- 组织详情 -->
    <UiModal
      :show="detailShow"
      :title="detail?.name ?? '组织详情'"
      @update:show="detailShow = $event"
    >
      <div v-if="detail" class="detail">
        <div class="detail-info">
          <div class="info-row">
            <span class="info-label">组织码</span>
            <span class="info-value code">{{ detail.orgCode }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">管理员</span>
            <span class="info-value">{{ detail.adminName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">父组织</span>
            <span class="info-value">{{ detail.parentName ?? "无（顶级组织）" }}</span>
          </div>
        </div>

        <div v-if="pendingMembers.length" class="detail-section">
          <div class="detail-title">待审核申请</div>
          <div v-for="m in pendingMembers" :key="m.userId" class="member-row">
            <span class="member-name">{{ m.username }}</span>
            <span class="member-actions">
              <UiButton
                v-if="detail.isAdmin"
                size="sm"
                variant="primary"
                @click="review(m, 'approve')"
              >
                同意
              </UiButton>
              <UiButton
                v-if="detail.isAdmin"
                size="sm"
                @click="review(m, 'reject')"
              >
                拒绝
              </UiButton>
            </span>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">成员（{{ detail.members.length }}）</div>
          <div v-if="!detail.members.length" class="detail-empty">暂无成员</div>
          <div v-for="m in approvedMembers" :key="m.userId" class="member-row">
            <span class="member-name">{{ m.username }}</span>
            <span class="member-right">
              <UiTag v-if="m.role === 'admin'" type="primary">管理员</UiTag>
              <UiButton
                v-if="detail.isAdmin && m.role !== 'admin'"
                size="xs"
                variant="ghost"
                class="remove-btn"
                @click="remove(m)"
              >
                <Trash2 />
              </UiButton>
            </span>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">
            <span>子组织（{{ detail.children.length }}）</span>
            <UiButton
              size="sm"
              class="child-btn"
              @click="openCreate(detail)"
            >
              <Plus />
              创建子组织
            </UiButton>
          </div>
          <div v-if="!detail.children.length" class="detail-empty">暂无子组织</div>
          <div
            v-for="child in detail.children"
            :key="child.id"
            class="member-row"
            @click="openDetail(child)"
          >
            <span class="member-name">
              <Building2 class="org-icon sm" />
              {{ child.name }}
            </span>
            <span class="info-value code">{{ child.orgCode }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="footer">
          <UiButton block variant="ghost" @click="detailShow = false">关闭</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-vue-next";
import {
  UiButton,
  UiEmpty,
  UiFormItem,
  UiInput,
  UiModal,
  UiSelect,
  UiTag,
  uiMessage,
} from "@/components/ui";
import {
  createOrg,
  fetchMyOrgs,
  fetchOrgDetail,
  joinOrg,
  removeMember,
  reviewMember,
} from "@/api";
import type { OrgDetail, OrgInfo, OrgMember } from "@/api";
import { currentUser, isLoggedIn } from "@/composables/useAuth";

const router = useRouter();

/* ---------- 数据加载 ---------- */
const created = ref<OrgInfo[]>([]);
const joined = ref<OrgInfo[]>([]);
const pending = ref<OrgInfo[]>([]);

/** 我创建的组织同时也在成员列表里，按 id 去重 */
const myOrgs = computed<OrgInfo[]>(() => {
  const seen = new Set<number>();
  return [...created.value, ...joined.value].filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
});

async function load() {
  try {
    const data = await fetchMyOrgs();
    created.value = data.created;
    joined.value = data.joined;
    pending.value = data.pending;
  } catch (e) {
    uiMessage.error("加载组织失败：" + ((e as Error).message ?? String(e)));
  }
}

onMounted(() => {
  if (isLoggedIn.value) load();
});

/* ---------- 创建组织 ---------- */
const createShow = ref(false);
const creating = ref(false);
const createForm = reactive<{ name: string; parentId: number | null }>({
  name: "",
  parentId: null,
});

const parentOptions = computed(() =>
  myOrgs.value
    .filter((o) => o.status !== "pending")
    .map((o) => ({ label: o.name, value: o.id })),
);

function openCreate(parent?: OrgInfo | OrgDetail) {
  createForm.name = "";
  createForm.parentId = parent ? parent.id : null;
  createShow.value = true;
}

async function submitCreate() {
  const name = createForm.name.trim();
  if (!name) {
    uiMessage.warning("请输入组织名称");
    return;
  }
  creating.value = true;
  try {
    await createOrg(name, createForm.parentId);
    uiMessage.success("组织已创建");
    createShow.value = false;
    await load();
    if (createForm.parentId !== null) {
      const org = myOrgs.value.find(
        (o) => o.id === createForm.parentId,
      );
      if (org) await openDetail(org);
    }
  } catch (e) {
    uiMessage.error("创建失败：" + ((e as Error).message ?? String(e)));
  } finally {
    creating.value = false;
  }
}

/* ---------- 加入组织 ---------- */
const joinShow = ref(false);
const joining = ref(false);
const joinCode = ref("");

function openJoin() {
  joinCode.value = "";
  joinShow.value = true;
}

async function submitJoin() {
  const code = joinCode.value.trim();
  if (!code) {
    uiMessage.warning("请输入组织码");
    return;
  }
  joining.value = true;
  try {
    await joinOrg(code);
    uiMessage.success("申请已提交，等待管理员审核");
    joinShow.value = false;
    await load();
  } catch (e) {
    uiMessage.error("加入失败：" + ((e as Error).message ?? String(e)));
  } finally {
    joining.value = false;
  }
}

/* ---------- 组织详情 ---------- */
const detailShow = ref(false);
const detail = ref<OrgDetail | null>(null);

const pendingMembers = computed(() =>
  (detail.value?.members ?? []).filter((m) => m.status === "pending"),
);
const approvedMembers = computed(() =>
  (detail.value?.members ?? []).filter(
    (m) => m.status === "approved" || m.status === "rejected",
  ),
);

async function openDetail(org: OrgInfo) {
  try {
    detail.value = await fetchOrgDetail(org.id);
    detailShow.value = true;
  } catch (e) {
    uiMessage.error("加载详情失败：" + ((e as Error).message ?? String(e)));
  }
}

async function review(m: OrgMember, action: "approve" | "reject") {
  try {
    await reviewMember(detail.value!.id, m.userId, action);
    uiMessage.success(action === "approve" ? "已通过" : "已拒绝");
    detail.value = await fetchOrgDetail(detail.value!.id);
    await load();
  } catch (e) {
    uiMessage.error("操作失败：" + ((e as Error).message ?? String(e)));
  }
}

async function remove(m: OrgMember) {
  try {
    await removeMember(detail.value!.id, m.userId);
    uiMessage.success("已移除成员");
    detail.value = await fetchOrgDetail(detail.value!.id);
    await load();
  } catch (e) {
    uiMessage.error("移除失败：" + ((e as Error).message ?? String(e)));
  }
}
</script>

<style scoped>
.org-container {
  width: min(94vw, 4.6rem);
  height: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  overflow-y: auto;
  padding-bottom: 0.5rem;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0.08rem 0;

  .title {
    flex: 1;
    font-size: 0.15rem;
    font-weight: bold;
    color: var(--ui-text);
    text-align: left;
  }

  .actions {
    display: flex;
    gap: 0.06rem;
  }
}

.login-hint {
  margin-top: 0.2rem;
}

.section {
  margin-top: 0.12rem;

  .section-title {
    font-size: 0.09rem;
    color: var(--ui-text-3);
    margin-bottom: 0.06rem;
  }
}

.empty-wrap {
  padding: 0.2rem 0;
}

.org-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 0.01rem solid var(--ui-border);
  border-radius: var(--ui-radius-lg);
  padding: 0.1rem 0.12rem;
  margin-bottom: 0.08rem;
  cursor: pointer;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 0.02rem 0.08rem rgba(0, 0, 0, 0.06);
  }

  .org-card__main {
    min-width: 0;
  }

  .org-card__name {
    display: flex;
    align-items: center;
    gap: 0.05rem;
    font-size: 0.11rem;
    font-weight: bold;
    color: var(--ui-text);

    .org-icon {
      width: 0.13rem;
      height: 0.13rem;
      color: var(--ui-primary);
    }
  }

  .org-card__meta {
    display: flex;
    align-items: center;
    gap: 0.06rem;
    margin-top: 0.03rem;
    font-size: 0.08rem;
    color: var(--ui-text-3);

    b {
      color: var(--ui-text-2);
      letter-spacing: 0.01rem;
    }

    .parent-name {
      color: var(--ui-text-3);
    }
  }

  .chevron {
    width: 0.14rem;
    height: 0.14rem;
    color: var(--ui-text-3);
  }
}

.hint {
  font-size: 0.08rem;
  color: var(--ui-text-3);
  margin: 0.04rem 0 0;
}

.detail {
  .detail-info {
    background: var(--ui-bg);
    border-radius: var(--ui-radius);
    padding: 0.06rem 0.1rem;

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.035rem 0;

      .info-label {
        font-size: 0.085rem;
        color: var(--ui-text-3);
      }

      .info-value {
        font-size: 0.085rem;
        color: var(--ui-text);

        &.code {
          font-family: ui-monospace, monospace;
          letter-spacing: 0.02rem;
          color: var(--ui-primary);
          font-weight: bold;
        }
      }
    }
  }

  .detail-section {
    margin-top: 0.12rem;

    .detail-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.09rem;
      color: var(--ui-text-2);
      margin-bottom: 0.04rem;

      .child-btn {
        color: var(--ui-primary);
      }
    }

    .detail-empty {
      font-size: 0.08rem;
      color: var(--ui-text-3);
      padding: 0.08rem 0;
      text-align: center;
    }

    .member-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.06rem 0.02rem;
      border-bottom: 0.01rem solid var(--ui-border-light);

      &:last-child {
        border-bottom: none;
      }

      .member-name {
        display: flex;
        align-items: center;
        gap: 0.04rem;
        font-size: 0.09rem;
        color: var(--ui-text);
      }

      .member-actions,
      .member-right {
        display: flex;
        align-items: center;
        gap: 0.04rem;
      }

      .remove-btn {
        color: var(--ui-danger);
      }
    }
  }
}

.org-icon.sm {
  width: 0.11rem;
  height: 0.11rem;
  color: var(--ui-text-3);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.06rem;
}

/* 桌面端：100vw 全屏 + 四周留白 */
@media (min-width: 64em) {
  .org-container {
    width: 100vw;
    padding: 0.05rem 0.12rem;
  }
}
</style>
