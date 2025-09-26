import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import AppNavigation from '@/components/AppNavigation/AppNavigation.vue';
import eventBus from '@/eventBus';
import stores from '@/store';

vi.mock('@/components/AppNavigation/AppNavigationData', () => {
  return () => ({
    navigationItems: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        icon: 'icon-dashboard',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'icon-settings',
        children: [
          {
            id: 'users',
            label: 'Users',
            route: '/settings/users',
          },
          {
            id: 'network',
            label: 'Network',
            route: '/settings/network',
          },
        ],
      },
    ],
  });
});
describe('AppNavigation.vue', () => {
  let wrapper;
  let globalStore;
  const router = createRouter({
    history: createWebHistory(),
    routes: [],
  });
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    globalStore = stores.GlobalStore();
    vi.spyOn(globalStore, 'modelTypeGetter', 'get').mockReturnValue(
      'TestModel',
    );
    vi.spyOn(globalStore, 'hmcManagedGetter', 'get').mockReturnValue(true);
    vi.spyOn(globalStore, 'currentUserGetter', 'get').mockReturnValue({
      username: 'testuser',
    });
    wrapper = mount(AppNavigation, {
      global: {
        plugins: [router, pinia],
        stubs: {
          'icon-dashboard': true,
          'icon-settings': true,
          'icon-chevron-up': true,
        },
        mocks: {
          $t: (key) => key,
        },
      },
    });
  });
  it('should exist', () => {
    expect(wrapper.exists()).toBe(true);
  });
  it('should render correctly', () => {
    expect(wrapper.find('.nav-container').exists()).toBe(true);
  });
  it('should render with nav-container open', () => {
    wrapper.vm.isNavigationOpen = true;
    expect(wrapper.element).toMatchSnapshot();
  });

  it('Nav Overlay click should emit change-is-navigation-open event', async () => {
    wrapper.vm.isNavigationOpen = true;
    await wrapper.vm.$nextTick();
    const navOverlay = wrapper.find('#nav-overlay');
    expect(navOverlay.exists()).toBe(true);
    const spy = vi.spyOn(eventBus, 'emit');
    await navOverlay.trigger('click');
    await wrapper.vm.$nextTick();
    expect(spy).toHaveBeenCalledWith('change-is-navigation-open', false);
    spy.mockRestore();
  });

  it('toggle-navigation event should toggle isNavigation data prop value', async () => {
    eventBus.emit('loading-bar-status', true);
    await wrapper.vm.$nextTick();
    eventBus.emit('toggle-navigation');
    await wrapper.vm.$nextTick();
    const navOverlay = wrapper.find('#nav-overlay');
    expect(navOverlay.exists()).toBe(true);
    const spy = vi.spyOn(eventBus, 'emit');
    await navOverlay.trigger('click');
    await wrapper.vm.$nextTick();
    expect(spy).toHaveBeenCalledWith('change-is-navigation-open', false);
    spy.mockRestore();
  });
});
