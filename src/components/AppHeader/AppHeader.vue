<template>
  <div>
    <header id="page-header">
      <a
        class="link-skip-nav btn btn-light"
        href="#main-content"
        @click="setFocus($event)"
      >
        {{ $t('appHeader.skipToContent') }}
      </a>

      <BNavbar type="dark" :aria-label="$t('appHeader.applicationHeader')">
        <!-- Left aligned nav items -->
        <BButton
          id="app-header-trigger"
          class="nav-trigger"
          aria-hidden="true"
          type="button"
          variant="link"
          :class="{ open: isNavigationOpen }"
          @click="toggleNavigation()"
        >
          <icon-close
            v-if="isNavigationOpen"
            :title="$t('appHeader.titleHideNavigation')"
          />
          <icon-menu
            v-if="!isNavigationOpen"
            :title="$t('appHeader.titleShowNavigation')"
          />
        </BButton>
        <BNavbarNav>
          <BNavbarBrand
            class="me-0 logo-header"
            to="/"
            data-test-id="appHeader-container-overview"
          >
            <img
              width="50px"
              class="header-logo"
              src="@/assets/images/logo-header.svg"
              :alt="altLogo"
            />
            <!-- :src="getImageUrl()" -->
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
            to="/logs/event-logs"
            data-test-id="appHeader-container-health"
          >
            <status-icon :status="healthStatusIcon" />
            {{ $t('appHeader.health') }}
          </BNavItem>
          <BNavItem
            to="/operations/server-power-operations"
            data-test-id="appHeader-container-power"
          >
            <status-icon :status="serverStatusIcon" />
            {{ $t('appHeader.power') }}
          </BNavItem>
          <!-- Using LI elements instead of BNavItem to support semantic button elements -->
          <li class="nav-item">
            <BButton
              id="app-header-refresh"
              variant="link"
              data-test-id="appHeader-button-refresh"
              @click="refresh"
            >
              <icon-renew :title="$t('appHeader.titleRefresh')" />
              <span class="responsive-text">{{ $t('appHeader.refresh') }}</span>
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
                <icon-avatar :title="$t('appHeader.titleProfile')" />
                <span class="responsive-text">{{ username }}</span>
              </template>
              <BDropdownItem
                to="/profile-settings"
                data-test-id="appHeader-link-profile"
                >{{ $t('appHeader.profileSettings') }}
              </BDropdownItem>
              <BDropdownItem
                data-test-id="appHeader-link-logout"
                @click="logout"
              >
                {{ $t('appHeader.logOut') }}
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
import { computed, ref, watch, onMounted, onBeforeMount } from 'vue';
import IconAvatar from '@carbon/icons-vue/es/user--avatar/20';
import IconClose from '@carbon/icons-vue/es/close/20';
import IconMenu from '@carbon/icons-vue/es/menu/20';
import IconRenew from '@carbon/icons-vue/es/renew/20';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import useToast from '@/components/Composables/useToastComposable';
import stores from '@/store';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import { useRouter } from 'vue-router';

const { errorToast } = useToast();
const router = useRouter();

const authenticationStore = stores.AuthenticationStore();
const global = stores.GlobalStore();
const eventLogStore = stores.EventLogStore();

const props = defineProps({
  routerKey: {
    type: Number,
    default: 0,
  },
});

const isNavigationOpen = ref(false);
const altLogo = ref(import.meta.env.VUE_APP_COMPANY_NAME || 'Built on OpenBMC');
const headerText = ref('ASMI');

onBeforeMount(() => {
  // Reset auth state to check if user is authenticated based
  // on available browser cookies
  authenticationStore.resetStoreState();
  getSystemInfo();
  getEvents();
});

onMounted(() => {
  eventBus.on(
    'change-is-navigation-open',
    (isNavigationOpenVal) => (isNavigationOpen.value = isNavigationOpenVal),
  );
});

const isNavTagPresent = computed(() => {
  return assetTag.value || modelType.value || serialNumber.value;
});
const assetTag = computed(() => {
  return global.assetTagGetter;
});
const modelType = computed(() => {
  return global.modelTypeGetter;
});
const serialNumber = computed(() => {
  return global.serialNumberGetter;
});
const isAuthorized = computed(() => {
  return global.isAuthorizedGetter;
});
const serverStatus = computed(() => {
  return global.serverStatusGetter;
});
const healthStatus = computed(() => {
  return eventLogStore.healthStatus;
});
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
  return global.usernameGetter;
});

watch(isAuthorized, (value) => {
  if (value === false) {
    errorToast(i18n.global.t('global.toast.unAuthDescription'), {
      title: i18n.global.t('global.toast.unAuthTitle'),
    });
  }
});

const getSystemInfo = () => {
  global.getSystemInfo();
};
const getEvents = () => {
  eventLogStore.getEventLogData();
};
const refresh = () => {
  eventBus.emit('refresh-application');
};
const logout = () => {
  authenticationStore.logout().then(() => {
    router.push('/login');
  });
};
const toggleNavigation = () => {
  eventBus.emit('toggle-navigation');
};
const setFocus = (event) => {
  event.preventDefault();
  eventBus.emit('skip-navigation');
};
// const getImageUrl = () => {
//       let pathName = location.pathname !== '/' ? location.pathname : '';
//       return (
//         location.origin + pathName + require('@/assets/images/logo-header.svg')
//       );
//     };
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
    // transition: $duration--moderate-01 $exit-easing--expressive;
    transition: 150ms cubic-bezier(0.4, 0.14, 1, 1);
    &:focus {
      top: 0.5rem;
      // transition-timing-function: $entrance-easing--expressive;
      transition-timing-function: cubic-bezier(0, 0, 0.3, 1);
    }
  }
  .navbar-text,
  .nav-link,
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
  }
}

.navbar-brand {
  padding: math.div($spacer, 2);
  height: $header-height;
  line-height: 1;
  &:focus {
    box-shadow:
      inset 0 0 0 3px $navbar-color,
      inset 0 0 0 5px white;
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
