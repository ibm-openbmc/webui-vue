export const searchFilter = null;
const useSearchFilterComposable = () => {
  const onChangeSearchInput = (searchValue) => {
    return searchValue;
  };
  const onClearSearchInput = () => {
    return null;
  };
  return {
    onChangeSearchInput,
    onClearSearchInput,
  };
};

export default useSearchFilterComposable;
