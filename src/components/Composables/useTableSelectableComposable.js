import { ref } from 'vue';

export const selectedRowsList = ref([]);
export const tableHeaderCheckboxModel = ref(false);
export const tableHeaderCheckboxIndeterminate = ref(false);

const useTableSelectableComposable = () => {
  const clearSelectedRows = (tableRef) => {
    if (tableRef && tableRef.value) {
      tableRef.value.selectAllRows();
      tableRef.value.clearSelected();
      selectedRowsList.value = [];
      tableHeaderCheckboxModel.value = false;
    }
  };

  const toggleSelectRow = (tableRef, rowIndex, rowSelected, row) => {
    if (tableRef && rowIndex !== undefined) {
      if (!rowSelected) {
        // Find the index of the object to remove
        const indexToRemove = selectedRowsList.value.findIndex(
          (item) => item.name === row.name,
        );

        // Check if the object exists in the array
        if (indexToRemove !== -1) {
          tableRef.unselectRow(rowIndex);
          // Remove the object from the array
          selectedRowsList.value.splice(indexToRemove, 1);
        }
      } else {
        tableRef.selectRow(rowIndex);
      }
    }
  };

  const onRowSelected = (selectedRows, totalRowsCount) => {
    if (selectedRows && totalRowsCount !== undefined) {
      if (selectedRowsList.value.indexOf(selectedRows) === -1) {
        selectedRowsList.value.push(selectedRows);
      }
      if (selectedRowsList.value.length === 0) {
        tableHeaderCheckboxIndeterminate.value = false;
        tableHeaderCheckboxModel.value = false;
      } else if (selectedRowsList.value.length === totalRowsCount) {
        tableHeaderCheckboxIndeterminate.value = false;
        tableHeaderCheckboxModel.value = true;
      } else {
        tableHeaderCheckboxIndeterminate.value = true;
        tableHeaderCheckboxModel.value = true;
      }
    }
  };

  const onChangeHeaderCheckbox = (tableRef, tableHeaderCheckbox) => {
    tableHeaderCheckboxModel.value = tableHeaderCheckbox;
    if (tableRef) {
      if (tableHeaderCheckboxModel.value) tableRef.selectAllRows();
      else {
        selectedRowsList.value = [];
        tableRef.clearSelected();
      }
    }
  };
  return {
    clearSelectedRows,
    toggleSelectRow,
    onRowSelected,
    onChangeHeaderCheckbox,
    selectedRowsList,
    tableHeaderCheckboxModel,
    tableHeaderCheckboxIndeterminate,
  };
};

export default useTableSelectableComposable;
