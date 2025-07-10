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
    //Updating ID with a blank string to avoid regeneration of a new one everytime test script is run
    wrapper.element.querySelectorAll('[id]').forEach(el => {
      if (el.id.startsWith('__BVID__')) {
        el.id = '';
      }
    });
    expect(wrapper.element).toMatchSnapshot();
  });
});