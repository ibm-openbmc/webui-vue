import event from '../../eventBus';
import { ref } from 'vue';

export default function useLoadingBarComposable() {
  const loading = ref(true);

  function startLoader() {
    event.emit('loader-start');
    loading.value = true;
  }

  function endLoader() {
    event.emit('loader-end');
    event.emit('loading-bar-status', true);
    loading.value = false;
  }

  function hideLoader() {
    event.emit('loader-hide');
  }

  return { startLoader, endLoader, hideLoader };
}
