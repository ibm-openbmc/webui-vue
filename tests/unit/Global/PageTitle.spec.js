import { mount } from '@vue/test-utils';
import PageTitle from '@/components/Global/PageTitle.vue';

describe('PageTitle.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(PageTitle, {
      props: {
        description: 'A page title test description',
      },
      global: {
        mocks: {
          $t: (key) => key,
          $route: {
            meta: {
              title: 'Page Title',
            },
          },
        },
      },
    });
  });

  it('should exist', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render h1 element', () => {
    expect(wrapper.find('h1').exists()).toBe(true);
  });

  it('should render p element', () => {
    expect(wrapper.find('p').exists()).toBe(true);
  });

  it('should render correctly', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
