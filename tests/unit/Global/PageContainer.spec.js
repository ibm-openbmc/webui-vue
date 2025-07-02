import { mount } from '@vue/test-utils';
import PageContainer from '@/components/Global/PageContainer.vue';

describe('PageContainer.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(PageContainer, {
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

  it('should render main element', () => {
    expect(wrapper.find('main').exists()).toBe(true);
  });

  it('should render correctly', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
