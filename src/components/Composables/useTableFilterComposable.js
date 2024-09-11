import { includes } from 'lodash';
import { GlobalStore } from '@/store';

export default function useTableFilter() {
  const globalStore = GlobalStore();
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

  const getFilteredTableDataByDate = (
    tableData = [],
    startDate,
    endDate,
    propertyKey = 'date',
  ) => {
    if (!startDate && !endDate) return tableData;
    let startDateInMs = startDate ? startDate.getTime() : 0;
    let endDateInMs = endDate ? endDate.getTime() : Number.POSITIVE_INFINITY;

    const isUtcDisplay = globalStore.getIsUtcDisplay;

    //Offset preference selected
    if (!isUtcDisplay) {
      startDateInMs = startDate
        ? startDate.getTime() + startDate.getTimezoneOffset() * 60000
        : 0;
      endDateInMs = endDate
        ? endDate.getTime() + endDate.getTimezoneOffset() * 60000
        : Number.POSITIVE_INFINITY;
    }

    return tableData.filter((row) => {
      const date = row[propertyKey];
      if (!(date instanceof Date)) return;
      const dateInMs = date.getTime();
      if (dateInMs >= startDateInMs && dateInMs <= endDateInMs) return row;
    });
  };

  return {
    getFilteredTableData,
    getFilteredTableDataByDate,
  };
}
