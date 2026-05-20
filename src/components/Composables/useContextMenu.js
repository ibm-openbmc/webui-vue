import { ref, onMounted } from 'vue';
import html2canvas from 'html2canvas';

export function useContextMenu() {
  const visible = ref(false);
  const x = ref(0);
  const y = ref(0);

  // Initialize theme from localStorage on mount
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  });

  const show = (event) => {
    event.preventDefault();
    x.value = event.clientX;
    y.value = event.clientY;
    visible.value = true;
  };

  const hide = () => {
    visible.value = false;
  };

  const handleAction = async (action) => {
    switch (action) {
      case 'cut':
        await handleCut();
        break;
      case 'copy':
        await handleCopy();
        break;
      case 'paste':
        await handlePaste();
        break;
      case 'selectAll':
        handleSelectAll();
        break;
      case 'screenshot':
        await handleScreenshot();
        break;
      case 'inspect':
        handleInspect();
        break;
      case 'theme-light':
        handleThemeChange('light');
        break;
      case 'theme-dark':
        handleThemeChange('dark');
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  const handleThemeChange = (theme) => {
    // Apply theme to the document
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }

    // Show notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0f62fe;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: 'IBM Plex Sans', Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = `✓ ${theme === 'dark' ? 'Dark' : 'Light'} mode activated`;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 2000);
  };

  const handleCut = async () => {
    try {
      const selection = window.getSelection();
      const text = selection.toString();
      if (text) {
        await navigator.clipboard.writeText(text);
        // Try to delete the selected text if in an editable element
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable)
        ) {
          document.execCommand('delete');
        }
      }
    } catch (err) {
      console.error('Failed to cut:', err);
    }
  };

  const handleCopy = async () => {
    try {
      const selection = window.getSelection();
      const text = selection.toString();
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.isContentEditable)
      ) {
        document.execCommand('insertText', false, text);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleSelectAll = () => {
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA')
    ) {
      activeElement.select();
    } else {
      // Select only the content within the page container, excluding header, nav, and context menu
      const pageContent = document.querySelector('.app-content');
      if (pageContent) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(pageContent);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleScreenshot = async () => {
    try {
      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(38, 38, 38, 0.95);
        color: #f4f4f4;
        padding: 20px 32px;
        border-radius: 4px;
        z-index: 10000;
        font-family: 'IBM Plex Sans', Arial, sans-serif;
        font-size: 14px;
      `;
      loadingDiv.textContent = 'Capturing screenshot...';
      document.body.appendChild(loadingDiv);

      // Capture the entire application (header, nav, and content)
      const element = document.querySelector('.app-container');
      if (!element) {
        throw new Error('Application container not found');
      }

      // Use html2canvas to capture the screenshot
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `screenshot-${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Remove loading indicator
        document.body.removeChild(loadingDiv);

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #24a148;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 4px;
          z-index: 10000;
          font-family: 'IBM Plex Sans', Arial, sans-serif;
          font-size: 14px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        `;
        successDiv.textContent = '✓ Screenshot saved';
        document.body.appendChild(successDiv);

        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      });
    } catch (err) {
      console.error('Failed to take screenshot:', err);

      // Remove loading indicator if it exists
      const loadingDiv = document.querySelector(
        'div[style*="Capturing screenshot"]',
      );
      if (loadingDiv) {
        document.body.removeChild(loadingDiv);
      }

      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #da1e28;
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: 'IBM Plex Sans', Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      `;
      errorDiv.textContent = '✗ Screenshot failed';
      document.body.appendChild(errorDiv);

      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 3000);
    }
  };

  const handleInspect = () => {
    // Browsers don't allow programmatic opening of DevTools for security reasons
    // Best we can do is simulate keyboard shortcuts or show instructions

    // Detect OS
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcut = isMac ? 'Cmd+Option+I' : 'Ctrl+Shift+I';
    const inspectShortcut = isMac ? 'Cmd+Shift+C' : 'Ctrl+Shift+C';

    // Try to simulate the keyboard shortcut (this may not work in all browsers)
    try {
      // Create and dispatch keyboard events
      const event = new KeyboardEvent('keydown', {
        key: isMac ? 'i' : 'I',
        code: isMac ? 'KeyI' : 'KeyI',
        ctrlKey: !isMac,
        metaKey: isMac,
        altKey: isMac,
        shiftKey: false,
        bubbles: true,
      });
      document.dispatchEvent(event);
    } catch (err) {
      console.log('Could not simulate keyboard shortcut:', err);
    }

    // Show helpful notification regardless
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #262626;
      color: #f4f4f4;
      padding: 24px 32px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: 'IBM Plex Sans', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      max-width: 400px;
    `;

    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 12px; font-size: 16px;">
        Open Developer Tools
      </div>
      <div style="margin-bottom: 8px;">
        • Press <strong>${shortcut}</strong> to open DevTools
      </div>
      <div style="margin-bottom: 8px;">
        • Press <strong>${inspectShortcut}</strong> to inspect elements
      </div>
      <div style="margin-bottom: 8px;">
        • Or right-click and select "Inspect" from browser menu
      </div>
      <div style="margin-top: 16px; font-size: 12px; color: #c6c6c6;">
        Click anywhere to close
      </div>
    `;

    document.body.appendChild(notification);

    // Remove notification on click
    const removeNotification = () => {
      notification.remove();
      document.removeEventListener('click', removeNotification);
    };

    setTimeout(() => {
      document.addEventListener('click', removeNotification);
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
        document.removeEventListener('click', removeNotification);
      }
    }, 5000);
  };

  return {
    visible,
    x,
    y,
    show,
    hide,
    handleAction,
  };
}

// Made with Bob
