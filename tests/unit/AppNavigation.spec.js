import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia, setActivePinia } from 'pinia';
import AppNavigation from '@/components/AppNavigation/AppNavigation.vue';
import { vi } from 'vitest';
import eventBus from '@/eventBus';

describe('AppNavigation.vue', () => {
  let wrapper;

  const router = createRouter({
    history: createWebHistory(),
    routes: [],
  });

  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);

    wrapper = mount(AppNavigation, {
      global: {
        plugins: [router, pinia],
        mocks: {
          $t: (key) => key,
        },
      },
    });
  });

  it('should exist', async () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render correctly', () => {
    expect(wrapper.element).toMatchSnapshot();
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
    wrapper.vm.isNavigationOpen = false;
    eventBus.emit('toggle-navigation');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isNavigationOpen).toBe(true);
    eventBus.emit('toggle-navigation');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isNavigationOpen).toBe(false);
  });
});
