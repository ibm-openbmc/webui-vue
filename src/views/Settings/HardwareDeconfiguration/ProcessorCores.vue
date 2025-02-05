<template>
  <BContainer fluid="xl">
    <BRow class="align-items-end">
      <BCol sm="12" class="text-right">
        <table-filter :filters="tableFilters" @filter-change="onFilterChange" />
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="12">
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRowsLists.length"
          @clear-selected="clearSelectedRows(tableHardwareDeconfigurationRef)"
        >
          <template #toolbar-buttons>
            <table-toolbar-export
              :data="selectedRowsLists"
              :file-name="exportFileNameByDate()"
            />
          </template>
        </table-toolbar>
        <b-table
          ref="tableHardwareDeconfigurationRef"
          responsive="md"
          no-select-on-click
          sort-icon-left
          hover
          no-sort-reset
          :sort-by="[{ key: 'status', order: 'asc' }]"
          show-empty
          sticky-header="75vh"
          :no-border-collapse="true"
          :items="filteredCores"
          :fields="fields"
          :per-page="itemPerPage"
          :current-page="currentPageNo"
          :filter="searchFilterInput"
          :empty-text="$t('global.table.emptyMessage')"
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          :busy="isBusy"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, filteredCores.length)"
        >
          <template #cell(functionalState)="{ value }">
            <div v-if="value == 'OK'">
              {{ $t('pageDeconfigurationHardware.configured') }}
            </div>
            <div v-else>
              {{ $t('pageDeconfigurationHardware.deconfigured') }}
            </div>
          </template>
          <template #cell(settings)="row">
            <BFormCheckbox
              v-model="row.item.settings"
              name="switch"
              switch
              :disabled="!isServerOff || isBusy || isReadOnlyUser"
              @change="toggleSettingsSwitch(row)"
            >
              <span v-if="row.item.settings">
                {{ $t('pageDeconfigurationHardware.configure') }}
              </span>
              <span v-else>{{
                $t('pageDeconfigurationHardware.deconfigure')
              }}</span>
            </BFormCheckbox>
          </template>
        </b-table>
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
          <b-form-select
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
          aria-controls="table-sensors"
        />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import TableFilter from '@/components/Global/TableFilter.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableToolbarExport from '@/components/Global/TableToolbarExport.vue';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';
import { HardwareDeconfigurationStore, GlobalStore } from '@/store';

const Toast = useToastComposable();
const { currentPage, perPage, itemsPerPageOptions, getTotalRowCount } =
  usePaginationComposable();
const {
  selectedRowsList,
  clearSelectedRows,
  onRowSelected
  } = useTableSelectableComposable();
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const { getFilteredTableData } = useTableFilterComposable();
const hardwareDeconfigurationStore = HardwareDeconfigurationStore();
const global = GlobalStore();

onBeforeRouteLeave(() => {
  hideLoader();
});

const isBusy = ref(true);
const tableHardwareDeconfigurationRef = ref(null);
const selectedRowsLists = ref(selectedRowsList);
const activeFiltersRows = ref([]);
const currentPageNo = ref(currentPage);
const itemPerPage = ref(perPage);
const searchFilterInput = ref('');
const searchTotalFilteredRows = ref(0);
const fields = ref([
        {
          key: 'processorId',
          sortable: true,
          label: i18n.global.t('pageDeconfigurationHardware.table.id'),
        },
        {
          key: 'id',
          sortable: true,
          label:i18n.global.t('pageDeconfigurationHardware.table.name'),
        },
        {
          key: 'location',
          sortable: true,
          label: i18n.global.t('pageDeconfigurationHardware.table.locationCode'),
        },
        {
          key: 'functionalState',
          sortable: true,
          label: i18n.global.t('pageDeconfigurationHardware.table.functionalState'),
          tdClass: 'text-nowrap',
        },
        {
          key: 'eventID',
          sortable: true,
          label: i18n.global.t('pageDeconfigurationHardware.table.eventId'),
          tdClass: 'text-nowrap',
        },
        {
          key: 'deconfigurationType',
          sortable: true,
          label: i18n.global.t(
            'pageDeconfigurationHardware.table.deconfigurationType',
          ),
        },
        {
          key: 'settings',
          sortable: true,
          label: i18n.global.t('pageDeconfigurationHardware.table.settings'),
        },
      ]);
const tableFilters = ref([
        {
          key: 'deconfigurationType',
          label: i18n.global.t(
            'pageDeconfigurationHardware.table.deconfigurationType',
          ),
          values: [
          i18n.global.t('pageDeconfigurationHardware.table.filter.byAssociation'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.error'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.fatal'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.fcoDeconfigured'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.invalid'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.manual'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.none'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.predictive'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.recovered'),
          i18n.global.t('pageDeconfigurationHardware.table.filter.unknown'),
          ],
        },
      ]);

const allCores = computed(() => {
      return hardwareDeconfigurationStore.coresGetter;
});
const filteredRows = computed(() =>  {
      return searchFilterInput.value
        ? searchTotalFilteredRows.value
        : filteredCores.value.length;
});
const filteredCores = computed(() => {
      return getFilteredTableData(allCores.value, activeFiltersRows.value);
});
const serverStatus = computed(() =>  {
      return global.serverStatusGetter;
});
const isServerOff = computed(() =>  {
      return serverStatus.value === 'off' ? true : false;
});
const isReadOnlyUser = computed(() =>  {
      return global.isReadOnlyUserGetter;
});

onBeforeMount(() =>{
    startLoader();
    hardwareDeconfigurationStore.getProcessors()
    .finally(() => {
        endLoader();
        isBusy.value = false;
      });
});

const onFilterChange = ({ activeFilters }) => {
      activeFiltersRows.value = activeFilters;
};
const onFiltered = (filteredItems) => {
      searchTotalFilteredRows.value = filteredItems.length;
};
const toggleSettingsSwitch = (row) => {
      startLoader();
      hardwareDeconfigurationStore.updateCoresSettingsState({
          uri: row.item.uri,
          settings: row.item.settings,
        })
        .catch(({ message }) => {
          row.item.settings = !row.item.settings;
          Toast.errorToast(message);
        })
        .finally(() => {
          endLoader();
        });
};
</script>
<style lang="scss" scoped>
.text-right {
  text-align: right;
}
</style>
