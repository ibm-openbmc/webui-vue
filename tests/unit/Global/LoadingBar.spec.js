import { mount } from '@vue/test-utils';
import LoadingBar from '@/components/Global/LoadingBar.vue';

describe('LoadingBar.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(LoadingBar, {
      global: {
        mocks: {
          $t: (key) => key,
        },
      },
    });
  });

  it('should exist', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should show loading bar element', async () => {
    wrapper.vm.isLoadingComplete = false;
    wrapper.vm.loadingIndicatorValue = 100;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isLoadingComplete).toBe(false);
    expect(wrapper.find('.progress').exists()).toBe(true);
  });

  it('should hide loading bar element', async () => {
    wrapper.vm.isLoadingComplete = true;
    wrapper.vm.loadingIndicatorValue = 0;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isLoadingComplete).toBe(true);
    expect(wrapper.find('.progress').exists()).toBe(false);
  });

  it('should render correctly', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
