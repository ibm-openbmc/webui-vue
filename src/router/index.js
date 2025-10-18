import { createRouter, createWebHashHistory } from 'vue-router';
import routes from './routes';
import stores from '@/store';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  linkExactActiveClass: 'nav-link--current',
});

router.beforeEach((to, from, next) => {
  const authenticationStore = stores.AuthenticationStore();
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (authenticationStore.isLoggedIn) {
      next();
      return;
    }
    next('/login');
  } else {
    next();
  }
});

export default router;
