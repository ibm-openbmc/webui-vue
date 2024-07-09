import { includes } from 'lodash';

export default function useTableFilter() {
  const getFilteredTableData = (tableData = [], filters = []) => {
    const filterItems = filters.reduce((arr, filter) => {
      return [...arr, ...filter.values];
    }, []);

    if (filterItems.length === 0) return tableData;

    return tableData.filter((row) => {
      let returnRow = false;
      for (const { key, values } of filters) {
        const rowProperty = row[key];
        if (rowProperty && includes(values, rowProperty)) {
          returnRow = true;
          break;
        }
      }
      return returnRow;
    });
  };

  return {
    getFilteredTableData,
  };
}
