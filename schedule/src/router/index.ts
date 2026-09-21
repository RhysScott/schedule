import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MyView from '../views/MyView.vue'
import TimetablesView from '../views/TimetablesView.vue'
import SettingsView from '../views/SettingsView.vue'
import OrgView from '../views/OrgView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/my',
      name: 'my',
      component: MyView,
    },
    {
      path: '/timetables',
      name: 'timetables',
      component: TimetablesView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/orgs',
      name: 'orgs',
      component: OrgView,
    },
  ],
})

export default router
