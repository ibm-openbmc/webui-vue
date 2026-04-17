<template>
  <div class="app-header-search">
    <div
      class="search-container"
      :class="{ 'search-expanded': isSearchActive }"
    >
      <div class="search-input-wrapper">
        <button
          class="search-icon-button"
          :aria-label="$t('appHeader.search.ariaLabel')"
          @click="focusSearch"
        >
          <icon-search class="search-icon" />
        </button>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="search-input"
          :class="{ 'search-input-collapsed': !isSearchActive }"
          :placeholder="$t('appHeader.search.placeholder')"
          :aria-label="$t('appHeader.search.ariaLabel')"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="handleSearch"
          @keydown.down.prevent="navigateResults('down')"
          @keydown.up.prevent="navigateResults('up')"
          @keydown.enter.prevent="selectResult"
          @keydown.esc="closeSearch"
        />
        <BButton
          v-if="searchQuery && isSearchActive"
          variant="link"
          class="clear-button"
          :aria-label="$t('global.ariaLabel.clearSearch')"
          @click="clearSearch"
        >
          <icon-close />
        </BButton>
      </div>

      <!-- Search Results Dropdown -->
      <div
        v-if="showResults && filteredRoutes.length > 0"
        class="search-results"
      >
        <div class="results-header">
          {{ $t('appHeader.search.results', { count: filteredRoutes.length }) }}
        </div>
        <ul class="results-list" role="listbox">
          <li
            v-for="(route, index) in filteredRoutes"
            :key="route.path"
            class="result-item"
            :class="{ 'result-item-active': index === selectedIndex }"
            role="option"
            :aria-selected="index === selectedIndex"
            @click="navigateToRoute(route)"
            @mouseenter="selectedIndex = index"
          >
            <div class="result-content">
              <icon-arrow-right class="result-icon" />
              <div class="result-text">
                <div class="result-title">{{ route.title }}</div>
                <div class="result-path">
                  <span v-if="route.category" class="path-category">
                    {{ route.category }} >
                  </span>
                  <span class="path-page">{{ route.title }}</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- No Results Message -->
      <div
        v-else-if="showResults && searchQuery && filteredRoutes.length === 0"
        class="search-results"
      >
        <div class="no-results">
          {{ $t('appHeader.search.noResults') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import IconSearch from '@carbon/icons-vue/es/search/20';
import IconClose from '@carbon/icons-vue/es/close/20';
import IconArrowRight from '@carbon/icons-vue/es/arrow--right/20';
import { searchContent } from './searchUtils';
import AppNavigationData from '@/components/AppNavigation/AppNavigationData.js';
import stores from '@/store';
import eventBus from '@/eventBus';

const router = useRouter();
const globalStore = stores.GlobalStore();
const { navigationItems } = AppNavigationData();

const searchQuery = ref('');
const isSearchActive = ref(false);
const showResults = ref(false);
const selectedIndex = ref(0);
const searchInput = ref(null);

// Helper function to get category name and ID from route path
const getCategoryFromPath = (path) => {
  // Extract the first segment after the leading slash
  const segments = path.split('/').filter((segment) => segment);
  if (segments.length === 0) return { name: null, id: null };

  const firstSegment = segments[0];

  // Map path segments to navigation categories
  const categoryMap = {
    logs: { name: 'Logs', id: 'logs' },
    'hardware-status': { name: 'Hardware status', id: 'hardware-status' },
    operations: { name: 'Operations', id: 'operations' },
    settings: { name: 'Settings', id: 'settings' },
    'security-and-access': {
      name: 'Security and access',
      id: 'security-and-access',
    },
    'resource-management': {
      name: 'Resource management',
      id: 'resource-management',
    },
  };

  return categoryMap[firstSegment] || { name: null, id: null };
};

// Create a map of route names to route objects for quick lookup
const routeMap = computed(() => {
  const map = new Map();
  const routes = router.getRoutes();

  routes.forEach((route) => {
    if (
      route.name &&
      route.meta?.title &&
      route.path !== '/:pathMatch(.*)*' &&
      !route.path.includes('/login') &&
      !route.path.includes('/console') &&
      !route.path.includes('/change-password')
    ) {
      const categoryInfo = getCategoryFromPath(route.path);
      map.set(route.name, {
        name: route.name,
        path: route.path,
        title: route.meta.title,
        category: categoryInfo.name,
        categoryId: categoryInfo.id,
      });
    }
  });

  return map;
});

// Filter routes based on search query using content-based search from en-US.json
// Filters results based on machine type, HMC status, and user role
const filteredRoutes = computed(() => {
  if (!searchQuery.value.trim()) {
    return [];
  }

  // Get all routes from the router
  const allRoutes = router.getRoutes();

  // Prepare filter context from global store
  const filterContext = {
    modelType: globalStore.modelTypeGetter,
    hmcManaged: globalStore.hmcManagedGetter,
    roleId: globalStore.currentUserGetter?.RoleId,
  };

  // Use the searchContent function from searchUtils with filtering
  // This will automatically filter out routes that are not accessible
  // based on machine type (e.g., Everest vs non-Everest),
  // HMC management status, and user role
  const searchResults = searchContent(
    searchQuery.value,
    allRoutes,
    filterContext,
  );

  // Map search results to route objects with additional metadata
  const results = searchResults
    .map((result) => {
      const route = routeMap.value.get(result.routeName);
      if (route) {
        return {
          ...route,
          score: result.score,
        };
      }
      return null;
    })
    .filter((route) => route !== null)
    .slice(0, 10); // Limit to 10 results

  return results;
});

// Focus search input
const focusSearch = () => {
  searchInput.value?.focus();
};

// Handle search input
const handleSearch = () => {
  showResults.value = true;
  selectedIndex.value = 0;
};

// Handle focus
const handleFocus = () => {
  isSearchActive.value = true;
  if (searchQuery.value) {
    showResults.value = true;
  }
};

// Handle blur with delay to allow click events
const handleBlur = () => {
  setTimeout(() => {
    isSearchActive.value = false;
    showResults.value = false;
  }, 200);
};

// Navigate through results with keyboard
const navigateResults = (direction) => {
  if (filteredRoutes.value.length === 0) return;

  if (direction === 'down') {
    selectedIndex.value =
      (selectedIndex.value + 1) % filteredRoutes.value.length;
  } else if (direction === 'up') {
    selectedIndex.value =
      selectedIndex.value === 0
        ? filteredRoutes.value.length - 1
        : selectedIndex.value - 1;
  }
};

// Select result with Enter key
const selectResult = () => {
  if (filteredRoutes.value.length > 0 && selectedIndex.value >= 0) {
    navigateToRoute(filteredRoutes.value[selectedIndex.value]);
  }
};

// Navigate to selected route
const navigateToRoute = (route) => {
  // Expand matching section routes, collapse all sections for top-level routes
  if (route.categoryId) {
    eventBus.emit('expand-navigation-section', route.categoryId);
  } else {
    eventBus.emit('collapse-navigation-sections');
  }

  router.push(route.path);
  clearSearch();
  searchInput.value?.blur();
};

// Clear search
const clearSearch = () => {
  searchQuery.value = '';
  showResults.value = false;
  selectedIndex.value = 0;
};

// Close search with Escape key
const closeSearch = () => {
  clearSearch();
  searchInput.value?.blur();
};

// Handle click outside to close results
const handleClickOutside = (event) => {
  const searchContainer = event.target.closest('.app-header-search');
  if (!searchContainer) {
    showResults.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Reset selected index when filtered routes change
watch(filteredRoutes, () => {
  selectedIndex.value = 0;
});
</script>

<style lang="scss" scoped>
.app-header-search {
  position: relative;
  display: flex;
  align-items: center;

  @include media-breakpoint-down(md) {
    display: none;
  }
}

.search-container {
  position: relative;
  width: 48px; // Just icon width when collapsed
  transition: width 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);

  &.search-expanded {
    width: 350px;

    @include media-breakpoint-down(lg) {
      width: 280px;
    }
  }
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  transition:
    background-color 110ms,
    border-color 110ms;

  .search-expanded & {
    background-color: #393939;
    border-bottom-color: #393939;

    &:hover {
      background-color: #474747;
      border-bottom-color: #474747;
    }

    &:focus-within {
      background-color: #393939;
      border-bottom-color: #fff;
      outline: 2px solid #fff;
      outline-offset: -2px;
    }
  }
}

.search-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 110ms;

  &:hover {
    background-color: #474747;
  }

  &:focus {
    outline: 2px solid #fff;
    outline-offset: -2px;
  }
}

.search-icon {
  fill: #f4f4f4;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  background: transparent;
  border: none;
  color: #f4f4f4;
  font-size: 0.875rem;
  line-height: 1.28572;
  outline: none;
  opacity: 1;
  transition: opacity 110ms;

  &.search-input-collapsed {
    opacity: 0;
    width: 0;
    padding: 0;
    pointer-events: none;
  }

  &::placeholder {
    color: #c6c6c6;
  }

  &:focus {
    outline: none;
  }
}

.clear-button,
.close-button {
  position: absolute;
  padding: 0.75rem;
  color: #f4f4f4;
  fill: #f4f4f4;
  min-width: auto;
  height: auto;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #474747;
  }

  &:focus {
    outline: 2px solid #fff;
    outline-offset: -2px;
  }
}

.clear-button {
  right: 2.5rem;
}

.close-button {
  right: 0;
}

.search-results {
  position: absolute;
  top: calc(100% + 0.125rem);
  left: 0;
  right: 0;
  background-color: #262626;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.results-header {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: #c6c6c6;
  text-transform: uppercase;
  letter-spacing: 0.32px;
  border-bottom: 1px solid #393939;
}

.results-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.result-item {
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background-color 70ms cubic-bezier(0, 0, 0.38, 0.9);
  border-bottom: 1px solid #393939;
  background-color: #262626;

  &:last-child {
    border-bottom: none;
  }

  &:hover,
  &.result-item-active {
    background-color: #353535;
  }
}

.result-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.result-icon {
  flex-shrink: 0;
  fill: #c6c6c6;
  margin-top: 0.125rem;
}

.result-text {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 0.875rem;
  font-weight: 400;
  color: #f4f4f4;
  margin-bottom: 0.25rem;
  line-height: 1.28572;
}

.result-path {
  font-size: 0.75rem;
  color: #8d8d8d;
  margin-top: 0.25rem;
  line-height: 1.33333;
}

.path-category {
  color: #a8a8a8;
  font-weight: 400;
  margin-right: 0.25rem;
}

.path-page {
  color: #8d8d8d;
  font-weight: 400;
}

.no-results {
  padding: 2rem 1rem;
  text-align: center;
  color: #c6c6c6;
  font-size: 0.875rem;
}
</style>
