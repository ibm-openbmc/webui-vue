import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest';
import Search from '@/components/Global/Search.vue'

describe('Search.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(Search, {
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

  it('should emit clear-search on triggering onClearSearch', async () => {
    wrapper.vm.filter = 'true';
    await wrapper.vm.$nextTick();
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('clear-search')).toHaveLength(1);
  });

  it('should render correctly', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});