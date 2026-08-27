<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.sessions')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="warning" class="mb-4">
          <h5 class="fw-bold">
            {{ $t('pageSessions.alert.heading') }}
          </h5>
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
          :filtered-items-count="totalItems"
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
          :items="paginatedSessions"
          @row-selected="onRowSelected($event, paginatedSessions.length)"
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
              :model-value="selectedSessions.has(row.item.uri)"
              aria-label="checkbox"
              :data-test-id="`sessions-checkbox-selectRow-${row.index}`"
              @update:model-value="
                (checked) => {
                  if (checked) {
                    selectedSessions.add(row.item.uri);
                  } else {
                    selectedSessions.delete(row.item.uri);
                  }
                  toggleSelectRow(
                    tableSessionsRef,
                    row.index,
                    checked,
                    row.item,
                  );
                }
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
          :tabindex="currentPageNo - 1"
          first-number
          last-number
          :per-page="
            itemPerPage === 0 ? allConnections.length || 1 : itemPerPage
          "
          :total-rows="getTotalRowCount(totalItems)"
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
import { ref, computed, watch, onBeforeMount, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import { useSessions } from '@/api/composables/useSessions';
import { usePaginatedData } from '@/api/composables/shared/usePaginatedData';
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
const { perPage, itemsPerPageOptions, getTotalRowCount } =
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

const { sessions, isLoading, isFetching, disconnectSessions } = useSessions();

// Track selection state separately to avoid circular dependencies
const selectedSessions = ref(new Set());

const tableSessionsRef = ref(null);
const tableHeaderCheckbox = ref(tableHeaderCheckboxModel);
const tableHeaderCheckboxIndeterminated = ref(tableHeaderCheckboxIndeterminate);
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
    selectedSessions.value.clear();
    clearSelectedRows(tableSessionsRef);
  });
});

// Loading bar automatically shows/hides based on fetch state
watch(
  () => isLoading.value,
  (loading) => {
    if (loading) startLoader();
    else endLoader();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  hideLoader();
});

const isBusy = computed(() => isLoading.value || isFetching.value);

// All connections with selection state merged in
const allConnections = computed(() => {
  if (!sessions.value) return [];
  return sessions.value.map((session) => ({
    ...session,
    isSelected: selectedSessions.value.has(session.uri),
  }));
});

// Filtered data (memoized) – used as the source for pagination
const filteredSessionsData = computed(() => {
  if (!allConnections.value.length) return [];
  if (!searchFilterInput.value) return allConnections.value;

  const search = searchFilterInput.value.toLowerCase();
  const allowedKeys = fields.value.map((item) => item.key);
  return allConnections.value.filter((item) => {
    const searchableFields = allowedKeys
      .filter((key) => key in item)
      .map((key) => item[key]);
    return searchableFields.some((field) =>
      String(field || '')
        .toLowerCase()
        .includes(search),
    );
  });
});

// Pagination via usePaginatedData (same as Sensors)
const itemPerPage = ref(perPage);

const pagination = usePaginatedData({
  data: filteredSessionsData,
  pageSize: itemPerPage.value,
  initialPage: 1,
});

watch(itemPerPage, (newSize) => {
  pagination.pageSize.value = newSize;
});

const paginatedSessions = pagination.paginatedData;
const currentPageNo = pagination.currentPage;
const totalItems = pagination.totalItems;

const onChangeSearch = (event) => {
  searchFilterInput.value = event;
};
const onClearSearch = () => {
  searchFilterInput.value = '';
};

const onTableRowAction = (action, { uri }) => {
  if (action === 'disconnect') {
    urisStore.value = uri;
    selectedRowsNo.value = 1;
    count.value = 1;
    openModal.value = true;
  }
};
const onBatchAction = (action) => {
  if (action === 'disconnect') {
    const uris = selectedRowsLists.value.map((row) => row.uri);
    urisStore.value = uris;
    selectedRowsNo.value = uris.length;
    count.value = selectedRowsNo.value;
    openModal.value = true;
  }
};
const handleOk = () => {
  openModal.value = false;
  if (selectedRowsNo.value > 1) {
    disconnectSessions(urisStore.value).then((messages) => {
      messages.forEach(({ type, message }) => {
        if (type === 'success') {
          Toast.successToast(message);
        } else if (type === 'error') {
          Toast.errorToast(message);
        }
      });
      eventBus.emit('clear-selected');
    });
  } else {
    disconnectSessions([urisStore.value]).then((messages) => {
      messages.forEach(({ type, message }) => {
        if (type === 'success') {
          Toast.successToast(message);
        } else if (type === 'error') {
          Toast.errorToast(message);
        }
      });
      eventBus.emit('clear-selected');
    });
  }
  selectedRowsNo.value = 0;
};
const toggleAll = (checked) => {
  if (checked) {
    allConnections.value.forEach((session) => {
      selectedSessions.value.add(session.uri);
    });
  } else {
    selectedSessions.value.clear();
  }
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
