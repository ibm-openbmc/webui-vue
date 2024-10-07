import i18n from '@/i18n';
export const currentPage = 1;
export const perPage = 20;
export const itemsPerPageOptions = [
  {
    value: 10,
    text: '10',
  },
  {
    value: 20,
    text: '20',
  },
  {
    value: 30,
    text: '30',
  },
  {
    value: 40,
    text: '40',
  },
  {
    value: 0,
    text: i18n.global.t('global.table.viewAll'),
  },
];
const usePaginationComposable = () => {
  const getTotalRowCount = (count, itemPerPage) => {
    return itemPerPage === 0 ? 1 : count;
  };

  return {
    getTotalRowCount,
    currentPage,
    perPage,
    itemsPerPageOptions,
  };
};

export default usePaginationComposable;
