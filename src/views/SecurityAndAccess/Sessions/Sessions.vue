<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.sessions')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="warning" class="mb-4">
          <div class="font-weight-bold">
            {{ $t('pageSessions.alert.heading') }}
          </div>
          <div>
            {{ $t('pageSessions.alert.message') }}
          </div>
        </alert>
      </BCol>
    </BRow>
    <BRow class="align-items-end">
      <BCol sm="6" md="5" xl="4" class="searchStyle">
        <search
          :placeholder="$t('pageSessions.table.searchSessions')"
          data-test-id="sessions-input-searchSessions"
          @change-search="onChangeSearch"
          @clear-search="onClearSearch"
        />
      </BCol>
      <BCol sm="3" md="3" xl="2">
        <table-cell-count
          :filtered-items-count="filteredRows"
          :total-number-of-cells="allConnections.length"
        ></table-cell-count>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRowsLists.length"
          :actions="batchActions"
          @clear-selected="clearSelectedRows(tableSessionsRef)"
          @batch-action="onBatchAction"
        >
        </table-toolbar>
        <BTable
          id="table-session-logs"
          ref="tableSessionsRef"
          responsive="md"
          selectable
          no-select-on-click
          hover
          sticky-header="75vh"
          :sort-by="[{ key: 'clientID', order: 'asc' }]"
          :busy="isBusy"
          show-empty
          :fields="fields"
          :items="allConnections"
          :filter="searchFilterInput"
          :empty-text="$t('global.table.emptyMessage')"
          :per-page="itemPerPage"
          :current-page="currentPageNo"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, allConnections.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckbox"
              data-test-id="sessions-checkbox-selectAll"
              :indeterminate="tableHeaderCheckboxIndeterminated"
              @change="
                onChangeHeaderCheckbox(tableSessionsRef, tableHeaderCheckbox)
              "
              @update:modelValue="toggleAll"
            >
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="sessionsStore.allConnections[row.index].isSelected"
              :data-test-id="`sessions-checkbox-selectRow-${row.index}`"
              @change="
                toggleSelectRow(
                  tableSessionsRef,
                  row.index,
                  sessionsStore.allConnections[row.index].isSelected,
                  row.item,
                )
              "
            ></BFormCheckbox>
          </template>

          <!-- Actions column -->
          <template #cell(actions)="row">
            <table-row-action
              v-for="(action, index) in row.item.actions"
              :key="index"
              :value="action.value"
              :title="action.title"
              :row-data="row.item"
              :btn-icon-only="false"
              :data-test-id="`sessions-button-disconnect-${row.index}`"
              @click-table-action="onTableRowAction($event, row.item)"
            ></table-row-action>
          </template>
        </BTable>
      </BCol>
    </BRow>

    <!-- Table pagination -->
    <BRow>
      <BCol sm="6">
        <BFormGroup
          class="table-pagination-select"
          :label="$t('global.table.itemsPerPage')"
          label-for="pagination-items-per-page"
        >
          <BFormSelect
            id="pagination-items-per-page"
            v-model="itemPerPage"
            :options="itemsPerPageOptions"
          />
        </BFormGroup>
      </BCol>
      <BCol sm="6">
        <b-pagination
          v-model="currentPageNo"
          class="b-pagination"
          first-number
          last-number
          :per-page="itemPerPage"
          :total-rows="getTotalRowCount(filteredRows, itemPerPage)"
          aria-controls="table-session-logs"
        />
      </BCol>
    </BRow>
    <BModal
      v-model="openModal"
      :title="$t('pageSessions.modal.disconnectTitle', { count: count }, count)"
      :ok-title="$t('pageSessions.action.disconnect')"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk"
    >
      <p>
        {{
          $t('pageSessions.modal.disconnectMessage', { count: count }, count)
        }}
      </p>
    </BModal>
  </BContainer>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeMount } from 'vue';
import { SessionsStore } from '@/store';
import { onBeforeRouteLeave } from 'vue-router';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import Search from '@/components/Global/Search.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import Alert from '@/components/Global/Alert.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const { currentPage, perPage, itemsPerPageOptions, getTotalRowCount } =
  usePaginationComposable();
const {
  clearSelectedRows,
  toggleSelectRow,
  onRowSelected,
  onChangeHeaderCheckbox,
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();
const sessionsStore = SessionsStore();
const Toast = useToastComposable();
const tableSessionsRef = ref(null);
const isBusy = ref(true);
const tableHeaderCheckbox = ref(tableHeaderCheckboxModel);
const tableHeaderCheckboxIndeterminated = ref(tableHeaderCheckboxIndeterminate);
const currentPageNo = ref(currentPage);
const itemPerPage = ref(perPage);
const searchTotalFilteredRows = ref(0);
const openModal = ref(false);
const count = ref(0);
const searchFilterInput = ref('');
const isAllSelected = ref(false);
const urisStore = ref();
const selectedRowsLists = ref(selectedRowsList);
const selectedRowsNo = ref(0);
const fields = ref([
  {
    key: 'checkbox',
  },
  {
    key: 'clientID',
    label: i18n.global.t('pageSessions.table.clientID'),
  },
  {
    key: 'username',
    label: i18n.global.t('pageSessions.table.username'),
  },
  {
    key: 'ipAddress',
    label: i18n.global.t('pageSessions.table.ipAddress'),
  },
  {
    key: 'actions',
    label: '',
  },
]);
const batchActions = ref([
  {
    value: 'disconnect',
    label: i18n.global.t('pageSessions.action.disconnect'),
  },
]);
onBeforeRouteLeave(() => {
  hideLoader();
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : allConnections.value.length;
});

const allConnections = computed(() => {
  return sessionsStore.allConnectionsGetter.map((session) => {
    return {
      ...session,
      actions: [
        {
          value: 'disconnect',
          title: i18n.global.t('pageSessions.action.disconnect'),
        },
      ],
    };
  });
});
onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    sessionsStore?.allConnectionsGetter?.map((singleConnection) => {
      singleConnection.isSelected = false;
    });
    clearSelectedRows(tableSessionsRef);
  });
});
onMounted(() => {
  startLoader();
  sessionsStore.getSessionsData().finally(() => {
    isBusy.value = false;
    endLoader();
  });
});
const onFiltered = (filteredItems) => {
  searchTotalFilteredRows.value = filteredItems.length;
};
const onChangeSearch = (event) => {
  searchFilterInput.value = event;
};
const onClearSearch = () => {
  searchFilterInput.value = '';
};
const disconnectSessions = (uris) => {
  sessionsStore.disconnectSessions(uris).then((messages) => {
    messages.forEach(({ type, message }) => {
      if (type === 'success') {
        Toast.successToast(message);
      } else if (type === 'error') {
        Toast.errorToast(message);
      }
    });
  });
};
const onTableRowAction = (action, { uri }) => {
  if (action === 'disconnect') {
    urisStore.value = uri;
    selectedRowsNo.value = selectedRowsLists.value.map((row) => row.uri).length;
    count.value = 1;
    openModal.value = true;
  }
};
const onBatchAction = (action) => {
  if (action === 'disconnect') {
    const uris = selectedRowsLists.value.map((row) => row.uri);
    urisStore.value = uris;
    selectedRowsNo.value = selectedRowsLists.value.map((row) => row.uri).length;
    count.value = selectedRowsNo.value;
    openModal.value = true;
  }
};
const handleOk = () => {
  openModal.value = false;
  if (selectedRowsNo.value > 1) {
    disconnectSessions(urisStore.value);
  } else {
    disconnectSessions([urisStore.value]);
  }
  selectedRowsNo.value = 0;
};
const toggleAll = (checked) => {
  sessionsStore?.allConnections?.map((singleConnection) => {
    singleConnection.isSelected = checked;
  });
  isAllSelected.value = checked;
};
</script>
<style lang="scss" scoped>
#table-session-logs {
  td .btn-link {
    width: auto !important;
  }
}
.searchStyle {
  height: 74px;
}
</style>
