<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.sessions')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="warning" class="mb-4">
          <div class="fw-bold">
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
          :table="tableSessionsRef"
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
          show-empty
          :fields="fields"
          :items="allConnections"
          :filter="searchFilterInput"
          :per-page="
            itemPerPage === 0 ? allConnections.length || 1 : itemPerPage
          "
          :current-page="currentPageNo"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, allConnections.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckbox"
              aria-label="checkbox-head"
              data-test-id="sessions-checkbox-selectAll"
              :indeterminate="tableHeaderCheckboxIndeterminated"
              @change="
                onChangeHeaderCheckbox(tableSessionsRef, tableHeaderCheckbox)
              "
              @update:model-value="toggleAll"
            >
              <span class="visually-hidden">checkbox-head</span>
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="sessionsStore.allConnections[row.index].isSelected"
              aria-label="checkbox"
              :data-test-id="`sessions-checkbox-selectRow-${row.index}`"
              @change="
                toggleSelectRow(
                  tableSessionsRef,
                  row.index,
                  sessionsStore.allConnections[row.index].isSelected,
                  row.item,
                )
              "
            >
              <span class="visually-hidden">checkbox</span>
            </BFormCheckbox>
          </template>

          <!-- Actions column -->
          <template #cell(actions)="row">
            <table-row-action
              v-for="(action, index) in row.item.actions"
              :key="index"
              class="buttonStyle"
              :value="action.value"
              :title="action.title"
              :row-data="row.item"
              :btn-icon-only="false"
              :data-test-id="`sessions-button-disconnect-${row.index}`"
              @click-table-action="onTableRowAction($event, row.item)"
            ></table-row-action>
          </template>
          <template #empty>
            <span v-if="isBusy">
              {{ $t('global.table.loading') }}
            </span>
            <span v-else-if="searchFilterInput">
              {{ $t('global.table.emptySearchMessage') }}
            </span>
            <span v-else>
              {{ $t('global.table.emptyMessage') }}
            </span>
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
          :per-page="
            itemPerPage === 0 ? allConnections.length || 1 : itemPerPage
          "
          :total-rows="getTotalRowCount(filteredRows)"
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
import stores from '@/store';
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
const Toast = useToastComposable();

const sessionsStore = stores.SessionsStore();

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
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'clientID',
    label: i18n.global.t('pageSessions.table.clientID'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'username',
    label: i18n.global.t('pageSessions.table.username'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'ipAddress',
    label: i18n.global.t('pageSessions.table.ipAddress'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'actions',
    label: '',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);
const batchActions = ref([
  {
    value: 'disconnect',
    label: i18n.global.t('pageSessions.action.disconnect'),
  },
]);

onBeforeRouteLeave(() => {
  eventBus.emit('clear-selected');
  hideLoader();
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

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : allConnections.value.length;
});

const allConnections = computed(() => {
  if (!sessionsStore.allConnectionsGetter) return [];
  let data = sessionsStore.allConnectionsGetter.map((session) => ({
    ...session,
    actions: [
      {
        value: 'disconnect',
        title: i18n.global.t('pageSessions.action.disconnect'),
      },
    ],
  }));
  if (searchFilterInput.value) {
    const search = searchFilterInput.value.toLowerCase();
    const allowedKeys = fields.value.map((item) => item.key);
    data = data.filter((item) => {
      const searchableFields = allowedKeys
        .filter((key) => key in item)
        .map((key) => item[key]);
      return searchableFields.some((field) =>
        String(field || '')
          .toLowerCase()
          .includes(search),
      );
    });
  }
  return data;
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
.buttonStyle {
  :deep(.btn-link) {
    width: auto !important;
  }
}
.searchStyle {
  height: 74px;
}
</style>
