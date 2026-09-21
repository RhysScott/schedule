<template>
  <div class="my-container">
    <div class="settings-entry" @click="goSettings">
      <Settings />
      <span>设置</span>
    </div>

    <!-- 账号卡片 -->
    <div class="account-card">
      <div class="account-avatar">{{ accountInitial }}</div>
      <div class="account-info">
        <template v-if="isLoggedIn">
          <div class="account-name">{{ currentUser?.username }}</div>
          <div class="account-sub">已登录</div>
        </template>
        <template v-else>
          <div class="account-name">未登录</div>
          <div class="account-sub">登录后可标记课表归属</div>
        </template>
      </div>
      <UiButton
        v-if="isLoggedIn"
        variant="ghost"
        size="sm"
        class="account-btn"
        @click="doLogout"
      >
        退出
      </UiButton>
      <UiButton
        v-else
        variant="primary"
        size="sm"
        class="account-btn"
        @click="openAuth('login')"
      >
        登录 / 注册
      </UiButton>
    </div>

    <!-- 当前课表信息卡：课表归属与账号区区分开，避免身份混淆 -->
    <div class="tt-card">
      <div class="tt-card__head">
        <span class="tt-badge">{{ activeOwner }}</span>
        <span class="tt-label">当前课表</span>
      </div>
      <div class="tt-card__body">
        <div class="avatar">{{ initial }}</div>
        <div class="tt-main">
          <div class="name">{{ activeEnrollment.studentName || "未命名课表" }}</div>
          <div class="sub">{{ activeEnrollment.term || "未设置学期" }}</div>
        </div>
      </div>
      <div class="info-card">
        <div class="info-row">
          <span class="label">学号</span>
          <span class="value">{{ activeEnrollment.studentId || "-" }}</span>
        </div>
        <div class="info-row">
          <span class="label">学期</span>
          <span class="value">{{ activeEnrollment.term || "-" }}</span>
        </div>
        <div class="info-row">
          <span class="label">已选课程</span>
          <span class="value">{{ activeEnrollment.courses.length }} 门</span>
        </div>
      </div>
    </div>

    <!-- 登录 / 注册弹窗 -->
    <UiModal
      :show="authShow"
      :title="authMode === 'login' ? '登录' : '注册账号'"
      width="min(92vw, 3.6rem)"
      @update:show="(v: boolean) => (authShow = v)"
    >
      <UiFormItem label="用户名" required>
        <UiInput v-model="authUsername" placeholder="请输入用户名" />
      </UiFormItem>
      <UiFormItem label="密码" required>
        <UiInput
          v-model="authPassword"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="submitAuth"
        />
      </UiFormItem>
      <UiFormItem v-if="authMode === 'register'" label="确认密码" required>
        <UiInput
          v-model="authConfirm"
          type="password"
          placeholder="请再次输入密码"
          @keyup.enter="submitAuth"
        />
      </UiFormItem>
      <div class="auth-switch">
        <span
          v-if="authMode === 'login'"
          class="auth-link"
          @click="openAuth('register')"
        >
          没有账号？去注册
        </span>
        <span
          v-else
          class="auth-link"
          @click="openAuth('login')"
        >
          已有账号？去登录
        </span>
      </div>
      <template #footer>
        <div class="auth-footer">
          <UiButton variant="ghost" @click="authShow = false">取消</UiButton>
          <UiButton variant="primary" :disabled="authLoading" @click="submitAuth">
            {{ authLoading ? "处理中…" : authMode === "login" ? "登录" : "注册" }}
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { UiButton, UiFormItem, UiInput, UiModal, uiMessage } from "@/components/ui";
import { Settings } from "lucide-vue-next";
import { activeEnrollment, activeOwner } from "@/composables/useTimetable";
import { currentUser, isLoggedIn, login, logout, register } from "@/composables/useAuth";

const router = useRouter();


const authShow = ref(false);
const authMode = ref<"login" | "register">("login");
const authUsername = ref("");
const authPassword = ref("");
const authConfirm = ref("");
const authLoading = ref(false);

const initial = computed(() =>
  (activeEnrollment.value.studentName || "我").charAt(0),
);

const accountInitial = computed(() =>
  (currentUser.value?.username || "未").charAt(0).toUpperCase(),
);

function goSettings() {
  router.push("/settings");
}

function openAuth(mode: "login" | "register") {
  authMode.value = mode;
  authUsername.value = "";
  authPassword.value = "";
  authConfirm.value = "";
  authShow.value = true;
}

async function submitAuth() {
  const username = authUsername.value.trim();
  const password = authPassword.value;
  if (!username || !password) {
    uiMessage.warning("请输入用户名和密码");
    return;
  }
  if (authMode.value === "register" && password !== authConfirm.value) {
    uiMessage.warning("两次输入的密码不一致");
    return;
  }
  authLoading.value = true;
  try {
    if (authMode.value === "login") {
      await login(username, password);
      uiMessage.success(`欢迎回来，${username}`);
    } else {
      await register(username, password);
      uiMessage.success(`注册成功，已登录 ${username}`);
    }
    authShow.value = false;
  } catch (e) {
    uiMessage.error((e as Error).message ?? String(e));
  } finally {
    authLoading.value = false;
  }
}

async function doLogout() {
  logout();
  uiMessage.success("已退出登录");
}
</script>

<style scoped>
.my-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(94vw, 4.6rem);
  padding-top: 0.4rem;
  font-size: 0.1rem;
  overflow-y: auto;
}

/* 右上角设置入口 */
.settings-entry {
  position: absolute;
  top: 0.08rem;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.02rem;
  padding: 0.04rem 0.08rem;
  color: #666;
  font-size: 0.08rem;
  cursor: pointer;
  border-radius: 0.05rem;

  svg {
    width: 0.18rem;
    height: 0.18rem;
  }

  &:hover {
    background: #f2faf6;
    color: #42b983;
  }
}

/* 账号卡片 */
.account-card {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  width: 82%;
  padding: 0.08rem 0.1rem;
  border-radius: 0.08rem;
  background: #fff;
  border: 0.01rem solid #eee;

  .account-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 0.34rem;
    height: 0.34rem;
    border-radius: 50%;
    background: #d8e9f7;
    color: #3a6ea5;
    font-size: 0.16rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .account-info {
    flex: 1;
    min-width: 0;

    .account-name {
      font-size: 0.12rem;
      font-weight: bold;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .account-sub {
      margin-top: 0.01rem;
      font-size: 0.075rem;
      color: #999;
    }
  }
}

.tt-card {
  width: 86%;
  margin: 0.14rem auto 0;
  background: #fff;
  border: 0.01rem solid #eee;
  border-radius: 0.1rem;
  overflow: hidden;

  .tt-card__head {
    display: flex;
    align-items: center;
    gap: 0.05rem;
    padding: 0.06rem 0.12rem;
    background: #fafbfc;
    border-bottom: 0.01rem solid #f1f1f1;
  }

  .tt-badge {
    font-size: 0.08rem;
    color: #42b983;
    background: #e8f7ef;
    border-radius: 0.04rem;
    padding: 0.01rem 0.05rem;
    font-weight: bold;
  }

  .tt-label {
    font-size: 0.08rem;
    color: #999;
  }

  .tt-card__body {
    display: flex;
    align-items: center;
    gap: 0.1rem;
    padding: 0.12rem;
  }
}
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.56rem;
  height: 0.56rem;
  border-radius: 50%;
  background: #e2f0cb;
  color: #5a8a4e;
  font-size: 0.24rem;
  font-weight: bold;
  flex-shrink: 0;
}
.tt-main {
  min-width: 0;
}
.name {
  font-size: 0.15rem;
  font-weight: bold;
  color: #333;
}
.sub {
  margin-top: 0.03rem;
  font-size: 0.085rem;
  color: #999;
}
.info-card {
  border-top: 0.01rem solid #f2f2f2;
  padding: 0.02rem 0.12rem;

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 0.32rem;
    padding: 0.03rem 0;

    &:not(:last-child) {
      border-bottom: 0.01rem solid #f7f7f7;
    }

    .label {
      color: #999;
      font-size: 0.09rem;
    }

    .value {
      color: #333;
      font-size: 0.09rem;
    }
  }
}



.auth-switch {
  margin-top: -0.04rem;
  text-align: right;

  .auth-link {
    font-size: 0.08rem;
    color: #42b983;
    cursor: pointer;
  }
}

.auth-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.06rem;
}

/* 桌面端（≥1024px）：100vw 全屏布局 + 四周留白 */
@media (min-width: 64em) {
  .my-container {
    width: 100vw;
    padding: 0.05rem 0.12rem;
  }
}
</style>
