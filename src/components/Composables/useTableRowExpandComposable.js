import i18n from '@/i18n';
const useTableRowExpandComposable = () => {
  let expandRowLabel = i18n.global.t('global.table.expandTableRow');
  const toggleRowDetails = (row) => {
    row.toggleDetails();
    expandRowLabel = row.detailsShowing
      ? i18n.global.t('global.table.collapseTableRow')
      : i18n.global.t('global.table.expandTableRow');
  };

  return {
    expandRowLabel,
    toggleRowDetails,
  };
};

export default useTableRowExpandComposable;
