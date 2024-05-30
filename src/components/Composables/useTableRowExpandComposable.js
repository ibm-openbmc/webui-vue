import i18n from '@/i18n';

export const tableRowExpandMixin = {
  data() {
    return {
      expandRowLabel: i18n.global.t('global.table.expandTableRow'),
    };
  },
  methods: {
    toggleRowDetails(row) {
      row.toggleDetails();
      this.expandRowLabel = row.detailsShowing
        ? i18n.global.t('global.table.collapseTableRow')
        : i18n.global.t('global.table.expandTableRow');
    },
  },
};

export default tableRowExpandMixin;
