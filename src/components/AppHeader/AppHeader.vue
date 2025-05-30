<!-- Work Requird -->
<template>
  <div>
    <header id="page-header">
      <a
        class="link-skip-nav btn btn-light"
        href="#main-content"
        @click="setFocus"
      >
        {{ t('appHeader.skipToContent') }}
      </a>

      <BNavbar variant="dark" :aria-label="t('appHeader.applicationHeader')">
        <!-- Left aligned nav items -->
        <BButton
          id="app-header-trigger"
          class="nav-trigger"
          aria-hidden="true"
          type="button"
          variant="link"
          :class="{ open: isNavigationOpen }"
          @click="handleToggleNavigation"
        >
          <icon-close
            v-if="isNavigationOpen"
            :title="t('appHeader.titleHideNavigation')"
          />
          <icon-menu
            v-if="!isNavigationOpen"
            :title="t('appHeader.titleShowNavigation')"
          />
        </BButton>
        <BNavbarNav>
          <BNavbarBrand
            class="me-0 logo-header"
            href="/"
            data-test-id="appHeader-container-overview"
          >
            <img
              width="50px"
              class="header-logo"
              src="@/assets/images/logo-header.svg"
              :alt="altLogo"
            />
            <span class="ps-1 nav-tags header-text">{{ headerText }}</span>
          </BNavbarBrand>
          <div v-if="isNavTagPresent" :key="routerKey" class="ps-2 nav-tags">
            <span>|</span>
            <span class="ps-3 asset-tag">{{ assetTag }}</span>
            <span class="ps-3">{{ modelType }}</span>
            <span class="ps-3">{{ serialNumber }}</span>
          </div>
        </BNavbarNav>
        <!-- Right aligned nav items -->
        <BNavbarNav class="ms-auto helper-menu">
          <BNavItem
            to="/logs/eventBus-logs"
            data-test-id="appHeader-container-health"
          >
            <status-icon :status="healthStatusIcon" />
            {{ t('appHeader.health') }}
          </BNavItem>
          <BNavItem
            to="/operations/server-power-operations"
            data-test-id="appHeader-container-power"
          >
            <status-icon :status="serverStatusIcon" />
            {{ t('appHeader.power') }}
          </BNavItem>
          <!-- Using LI elements instead of b-nav-item to support semantic button elements -->
          <li class="nav-item">
            <BButton
              id="app-header-refresh"
              variant="link"
              data-test-id="appHeader-button-refresh"
              @click="handleRefresh"
            >
              <icon-renew :title="t('appHeader.titleRefresh')" />
              <span class="responsive-text">{{ t('appHeader.refresh') }}</span>
            </BButton>
          </li>
          <li class="nav-item">
            <BDropdown
              id="app-header-user"
              variant="link"
              right
              data-test-id="appHeader-container-user"
            >
              <template #button-content>
                <icon-avatar :title="t('appHeader.titleProfile')" />
                <span class="responsive-text">{{ username }}</span>
              </template>
              <BDropdownItem
                to="/profile-settings"
                data-test-id="appHeader-link-profile"
                >{{ t('appHeader.profileSettings') }}
              </BDropdownItem>
              <BDropdownItem
                data-test-id="appHeader-link-logout"
                @click="logout"
              >
                {{ t('appHeader.logOut') }}
              </BDropdownItem>
            </BDropdown>
          </li>
        </BNavbarNav>
      </BNavbar>
    </header>
    <loading-bar />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, defineEmits } from 'vue';
// import BVToastMixin from '@/components/Mixins/BVToastMixin';
import IconAvatar from '@carbon/icons-vue/es/user--avatar/20';
import IconClose from '@carbon/icons-vue/es/close/20';
import IconMenu from '@carbon/icons-vue/es/menu/20';
import IconRenew from '@carbon/icons-vue/es/renew/20';
import StatusIcon from '../Global/StatusIcon.vue';
import LoadingBar from '../Global/LoadingBar.vue';
import { AuthenticationStore, GlobalStore, EventLogStore } from '@/store';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useToastComposable from '@/components/Composables/useToastComposable';
import eventBus from '@/eventBus';

const { t } = useI18n();
const props = defineProps({
  routerKey: {
    type: Number,
    default: 0,
  },
});

const { errorToast } = useToastComposable();
const router = useRouter();
const authenticationStore = AuthenticationStore();
const globalStore = GlobalStore();
const eventLogStore = EventLogStore();
const isNavigationOpen = ref(false);
// const loadingStatus = ref(null);
const altLogo = 'Built on OpenBMC';
const headerText = 'ASMI';
const emit = defineEmits(['refresh']);
const routerKey = ref(props.routerKey);
const getSystemInfo = () => {
  globalStore.getSystemInfo();
};
const getEvents = () => {
  eventLogStore.getEventLogData();
};
//commented due to cookies values are not getting
authenticationStore.resetStoreState();
getSystemInfo();
getEvents();

const assetTag = computed(() => globalStore.assetTag);
const isNavTagPresent = computed(
  () => assetTag.value || globalStore.modelType || globalStore.serialNumber,
);
const modelType = computed(() => globalStore.modelType);
const serialNumber = computed(() => globalStore.serialNumber);
const isAuthorized = computed(() => globalStore.isAuthorized);
// const userPrivilege = computed(() => globalStore.userPrivilege);
const serverStatus = computed(() => globalStore.serverStatus);
const healthStatus = computed(() => eventLogStore.getHealthStatus);
const serverStatusIcon = computed(() => {
  switch (serverStatus.value) {
    case 'on':
      return 'success';
    case 'error':
      return 'danger';
    case 'diagnosticMode':
      return 'warning';
    case 'off':
    default:
      return 'secondary';
  }
});
const healthStatusIcon = computed(() => {
  switch (healthStatus.value) {
    case 'OK':
      return 'success';
    case 'Warning':
      return 'warning';
    case 'Critical':
      return 'danger';
    default:
      return 'secondary';
  }
});
const username = computed(() => {
  return globalStore.username;
});
const consoleWindow = computed(() => authenticationStore.consoleWindow);
onMounted(() => {
  watch('consoleWindow', () => {
    if (consoleWindow.value === false) this.$eventBus.$consoleWindow.close();
  });
  watch(isAuthorized, (newValue) => {
    if (newValue === false) {
      errorToast(t('global.toast.unAuthDescription'), {
        title: t('global.toast.unAuthTitle'),
      });
    }
  });
  eventBus.on('change-is-navigation-open', (value) => {
    isNavigationOpen.value = value;
  });
});

const handleToggleNavigation = () => {
  isNavigationOpen.value = !isNavigationOpen.value;
  eventBus.emit('toggle-navigation', () => {
    isNavigationOpen;
  });
};
const logout = () => {
  authenticationStore.logout().then(() => {
    router.push('/login');
  });
};

const handleRefresh = () => {
  // Emit a custom eventBus to notify the Applayout component
  emit('refresh');
};
const setFocus = (event) => {
  event.preventDefault();
  this.$root.$emit('skip-navigation');
};
// const getImageUrl = () => {
//   let pathName = location.pathname !== '/' ? location.pathname : '';
//   return location.origin + pathName + require('@/assets/images/logo-header.svg');
// };
</script>

<style lang="scss">
@mixin focus-box-shadow($padding-color: $navbar-color, $outline-color: $white) {
  box-shadow:
    inset 0 0 0 3px $padding-color,
    inset 0 0 0 5px $outline-color;
}
.app-header {
  .link-skip-nav {
    position: absolute;
    top: -60px;
    left: 0.5rem;
    z-index: $zindex-popover;
    transition: 150ms cubic-bezier(0.4, 0.14, 1, 1);
    &:focus {
      top: 0.5rem;
      transition-timing-function: cubic-bezier(0, 0, 0.3, 1);
    }
  }
  .navbar-text .nav-link,
  .btn-link {
    color: #fff !important;
    fill: currentColor;
    padding: 0.68rem 1rem !important;

    &:hover {
      background-color: shift-color($light, 80%);
    }
    &:active {
      background-color: shift-color($light, 72%);
    }
    &:focus {
      @include focus-box-shadow;
      outline: 0;
    }
  }

  .nav-item {
    fill: $light;
  }

  .navbar {
    padding: 0;
    background-color: $navbar-color;
    @include media-breakpoint-up($responsive-layout-bp) {
      height: $header-height;
    }

    .helper-menu {
      @include media-breakpoint-down(md) {
        background-color: $gray-800;
        width: 100%;
        justify-content: flex-end;
        .nav-link .btn {
          padding: calc(#{$spacer} / 1.125) calc($spacer / 2);
        }
        .nav-link:focus,
        .btn:focus {
          @include focus-box-shadow($gray-800);
        }
      }

      .responsive-text {
        @include media-breakpoint-down(sm) {
          @include visually-hidden;
        }
      }
    }
  }

  .navbar-nav {
    @include media-breakpoint-up($responsive-layout-bp) {
      padding: 0 $spacer;
    }
    align-items: center;

    .navbar-brand,
    .nav-link {
      color: #fff;
      fill: $light;
      transition: $focus-transition;
    }
    .nav-tags {
      color: #b9b9b9 !important;
      @include media-breakpoint-down(sm) {
        @include visually-hidden;
      }
      .asset-tag {
        @include media-breakpoint-down(xl) {
          @include visually-hidden;
        }
      }
    }
  }

  .nav-trigger {
    fill: $light;
    width: $header-height;
    height: $header-height;
    transition: none;
    display: inline-flex;
    flex: 0 0 20px;
    align-items: center;

    svg {
      margin: 0;
    }

    &:hover {
      fill: $light;
      background-color: shift-color($light, 80%);
    }

    &.open {
      background-color: $gray-800;
    }

    @include media-breakpoint-up($responsive-layout-bp) {
      display: none;
    }
  }

  .dropdown-menu {
    margin-top: 0;

    @include media-breakpoint-only(md) {
      margin-top: 4px;
    }
  }

  .navbar-expand {
    @include media-breakpoint-down(md) {
      flex-flow: wrap;
    }
    // .navbar-nav .nav-link {
    //   color: color('white') !important;
    // }
  }
}

.navbar-brand {
  padding: math.div($spacer, 2);
  height: $header-height;
  line-height: 1;
  &:focus {
    box-shadow:
      inset 0 0 0 3px $navbar-color,
      inset 0 0 0 5px $white;
    outline: 0;
  }
}
.logo-header {
  display: flex;
  align-items: center;
}

.header-text {
  font-size: 22px;
}
.header-logo {
  width: 50px !important;
}
#page-header .container-fluid {
  --bs-gutter-x: 0 !important;
  justify-content: flex-start;
}
</style>
