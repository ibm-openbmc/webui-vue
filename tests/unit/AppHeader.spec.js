import { mount } from '@vue/test-utils';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import stores from '@/store';
import AppHeader from '@/components/AppHeader/AppHeader.vue';
import eventBus from '@/eventBus';

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
    }),
  };
});

describe('AppHeader.vue', () => {
  let wrapper;
  let globalStore;
  let eventLogStore;
  let authStore;
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    globalStore = stores.GlobalStore();
    eventLogStore = stores.EventLogStore();
    authStore = stores.AuthenticationStore();
    globalStore.getSystemInfo = vi.fn();
    eventLogStore.getEventLogData = vi.fn();
    authStore.resetStoreState = vi.fn();
    wrapper = mount(AppHeader, {
      global: {
        plugins: [pinia],
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
    expect(wrapper.element).toMatchSnapshot();
  });

  it('refresh button click should emit refresh event', async () => {
    const spy = vi.spyOn(eventBus, 'emit');
    await wrapper.get('#app-header-refresh').trigger('click');
    await wrapper.vm.$nextTick();
    expect(spy).toHaveBeenCalledWith('refresh-application');
    spy.mockRestore();
  });

  it('nav-trigger button click should emit toggle-navigation event', async () => {
    const spy = vi.spyOn(eventBus, 'emit');
    const triggerBtn = wrapper.get('#app-header-trigger');
    await triggerBtn.trigger('click');
    await wrapper.vm.$nextTick();
    expect(spy).toHaveBeenCalledWith('toggle-navigation');
    spy.mockRestore();
  });

  it('logout button should dispatch authentication/logout', async () => {
    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue();
    wrapper.get('[data-test-id="appHeader-link-logout"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(logoutSpy).toHaveBeenCalled();
    logoutSpy.mockRestore();
    expect(wrapper.exists()).toBe(true);
  });

  it('change:isNavigationOpen event should set isNavigationOpen prop to false', async () => {
    wrapper.vm.$root.$emit('change-is-navigation-open', false);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isNavigationOpen).toBe(false);
  });

  describe('Created lifecycle hook', () => {
    it('getSystemInfo should dispatch global/getSystemInfo', () => {
      wrapper.vm.getSystemInfo();
      expect(globalStore.getSystemInfo).toHaveBeenCalled();
    });
    it('getEvents should dispatch eventLog/getEventLogData', () => {
      wrapper.vm.getEvents();
      expect(eventLogStore.getEventLogData).toHaveBeenCalled();
    });
  });
});
