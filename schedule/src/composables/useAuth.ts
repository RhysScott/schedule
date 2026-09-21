import { computed, ref } from "vue";
import { loginAccount, registerAccount } from "@/api";

/** 本地账号登录态：localStorage 持久化 user + token */
const STORAGE_KEY = "timetable-auth-v2";

export interface AuthUser {
  id: number;
  username: string;
}

const currentUser = ref<AuthUser | null>(null);
export { currentUser };

/** 供 api 层读取的 token（无需响应式） */
export function getToken(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "";
    return (JSON.parse(raw) as { token?: string }).token ?? "";
  } catch {
    return "";
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { user: AuthUser };
      currentUser.value = data.user ?? null;
    }
  } catch {
    currentUser.value = null;
  }
}
load();

export const isLoggedIn = computed(() => currentUser.value !== null);

export function logout() {
  currentUser.value = null;
  localStorage.removeItem(STORAGE_KEY);
}

export async function login(username: string, password: string) {
  const data = await loginAccount(username, password);
  currentUser.value = data.user;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: data.user, token: data.token }),
  );
  return data.user;
}

export async function register(username: string, password: string) {
  await registerAccount(username, password);
  // 注册成功后自动登录
  return login(username, password);
}

export function useAuth() {
  return { currentUser, isLoggedIn, login, register, logout };
}
