import { reactive } from 'vue';

const state = reactive({
  selectedRows: [],
  tableHeaderCheckboxModel: false,
  tableHeaderCheckboxIndeterminate: false,
});

const useTableSelectableComposable = () => {
  const clearSelectedRows = (tableRef) => {
    if (tableRef) tableRef.clearSelected();
    state.selectedRows = [];
    state.tableHeaderCheckboxModel = false;
    state.tableHeaderCheckboxIndeterminate = false;
  };

  const toggleSelectRow = (tableRef, rowIndex) => {
    if (tableRef && rowIndex !== undefined) {
      if (tableRef.isRowSelected(rowIndex)) {
        tableRef.unselectRow(rowIndex);
        state.selectedRows = state.selectedRows.filter((index) => index !== rowIndex);
      } else {
        tableRef.selectRow(rowIndex);
        state.selectedRows.push(rowIndex);
      }
      onRowSelected(state.selectedRows, tableRef.totalRowsCount);
    }
  };

  const onRowSelected = (selectedRowsArray, totalRowsCount) => {
    if (selectedRowsArray && totalRowsCount !== undefined) {
      if (selectedRowsArray.length === 0) {
        state.tableHeaderCheckboxIndeterminate = false;
        state.tableHeaderCheckboxModel = false;
      } else if (selectedRowsArray.length === totalRowsCount) {
        state.tableHeaderCheckboxIndeterminate = false;
        state.tableHeaderCheckboxModel = true;
      } else {
        state.tableHeaderCheckboxIndeterminate = true;
        state.tableHeaderCheckboxModel = true;
      }
    }
  };

  return {
    clearSelectedRows,
    toggleSelectRow,
    onRowSelected,
  };
};

export default useTableSelectableComposable;
