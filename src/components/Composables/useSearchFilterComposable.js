export const searchFilterMixin = {
  data() {
    return {
      searchFilter: null,
    };
  },
  methods: {
    onChangeSearchInput(searchValue) {
      this.searchFilter = searchValue;
    },
    onClearSearchInput() {
      this.searchFilter = null;
    },
  },
};

export default searchFilterMixin;
