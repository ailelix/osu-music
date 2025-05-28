<template>
  <q-layout view="lHh LpR fFf" class="main-layout" :class="{ 'platform-mac': isOnMac }">
    <!-- Header -->
    <q-header class="main-header"> 
      <q-toolbar class="header-toolbar-content" :style="toolbarStyle">
        
        <!-- Logo作为抽屉切换按钮 -->
        <div class="header-logo-wrapper q-ml-xs" role="button" aria-label="Toggle Menu"> 
          <AppLogo :is-drawer-open="leftDrawerOpen" @toggle-drawer="toggleLeftDrawer" />
        </div>

        <q-toolbar-title class="header-title draggable-area"> 
          OSU! MUSIC
        </q-toolbar-title>

        <q-btn dense flat round icon="search" aria-label="Search" @click="navigateToSearch" class="non-draggable-area" /> 

        <!-- Windows/Linux 窗口控件 (如果需要) -->
        <div v-if="!isOnMac && showWindowControls" class="window-controls non-draggable-area">
          <q-btn dense flat round icon="remove" @click="minimizeWindow" size="sm"/>
          <q-btn dense flat round :icon="isMaximized ? 'filter_none' : 'crop_square'" @click="toggleMaximizeWindow" size="sm"/>
          <q-btn dense flat round icon="close" @click="closeWindow" size="sm" class="btn-close"/>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Left Drawer (using AppDrawer component) -->
    <AppDrawer v-model:is-open="leftDrawerOpen" />

    <!-- Page Container -->
    <q-page-container class="page-container-bg">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import AppLogo from 'components/AppLogo.vue';
import AppDrawer from 'components/AppDrawer.vue';

const leftDrawerOpen = ref(false);
const router = useRouter();
const isOnMac = ref(false);
const showWindowControls = ref(false); // 控制是否显示自定义的窗口控件
const isMaximized = ref(false); // 追踪窗口是否最大化
const isFullScreen = ref(false); // 新增：追踪全屏状态
const MACOS_TRAFFIC_LIGHT_WIDTH = 78; // 红绿灯宽度估算值

// 动态计算 toolbar 的样式
const toolbarStyle = computed<CSSProperties>(() => {
  if (isOnMac.value && !isFullScreen.value) {
    return { paddingLeft: `${MACOS_TRAFFIC_LIGHT_WIDTH}px` };
  }
  return { paddingLeft: '12px' };
});

let unlistenEnterFullScreen: (() => void) | undefined;
let unlistenLeaveFullScreen: (() => void) | undefined;

onMounted(async () => {
  if (window.electron?.process && window.electron.windowControls && window.electron.ipcRenderer) {
    const platform = window.electron.process.platform;
    isOnMac.value = platform === 'darwin';
    showWindowControls.value = platform !== 'darwin';
    try {
      isFullScreen.value = await window.electron.windowControls.isFullScreen();
      isMaximized.value = await window.electron.ipcRenderer.invoke<boolean>('get-initial-maximize-state');
    } catch (e) {
      console.error("Error getting initial window states:", e);
    }
    unlistenEnterFullScreen = window.electron.windowControls.onEnterFullScreen(() => {
      isFullScreen.value = true;
    });
    unlistenLeaveFullScreen = window.electron.windowControls.onLeaveFullScreen(() => {
      isFullScreen.value = false;
    });
    window.electron.ipcRenderer.on('window-maximized', () => isMaximized.value = true);
    window.electron.ipcRenderer.on('window-unmaximized', () => isMaximized.value = false);
  } else {
    showWindowControls.value = false;
    isOnMac.value = false;
  }
});

onUnmounted(() => {
  if (unlistenEnterFullScreen) unlistenEnterFullScreen();
  if (unlistenLeaveFullScreen) unlistenLeaveFullScreen();
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.removeAllListeners('window-maximized');
    window.electron.ipcRenderer.removeAllListeners('window-unmaximized');
  }
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

async function navigateToSearch() {
  try {
    await router.push({ name: 'search' });
    if (leftDrawerOpen.value) {
      leftDrawerOpen.value = false;
    }
  } catch (error) {
    if (!isNavigationFailure(error, NavigationFailureType.aborted) &&
        !isNavigationFailure(error, NavigationFailureType.cancelled)) {
      console.error('Failed to navigate to search:', error);
    }
  }
}

// --- Electron 窗口控制函数 ---
function minimizeWindow() {
  window.electron?.ipcRenderer?.send('minimize-window');
}
function toggleMaximizeWindow() {
  window.electron?.ipcRenderer?.send('toggle-maximize-window');
}
function closeWindow() {
  window.electron?.ipcRenderer?.send('close-window');
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

$header-bg: #1f1f27 !default;
$dark-page: #121218 !default;
$header-text: #ffffff !default;
$primary: #ff4081 !default; // 确保 $primary 已定义

.main-layout {
  // &.platform-mac .main-header .header-toolbar-content {
    // 对于macOS，如果红绿灯是标准高度，toolbar可能需要整体加高一点点
    // 或者通过 spacer 的高度来调整内容区的起始位置
  // }
}

.page-container-bg {
  background-color: $dark-page;
  color: $header-text; // 假设页面文本也是亮的
}

.main-header {
  background: transparent !important; // 让 q-header 本身透明
  box-shadow: none !important; // 移除 q-header 的默认阴影
  color: $header-text;
  -webkit-app-region: drag; // 默认整个 header 可拖动

  .header-toolbar-content {
    background-color: $header-bg; // 毛玻璃效果的底色
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex; // 确保 toolbar 内容水平排列
    align-items: center; // 垂直居中
    width: 100%;
    padding-right: 12px; // 给右侧按钮一些空间
  }

  .macos-traffic-lights-spacer {
    min-width: 70px; // 根据实际红绿灯宽度调整，通常 70-80px
    height: 30px;   // 根据红绿灯高度调整，或设为 toolbar 高度的一部分
    -webkit-app-region: no-drag; // 这个区域不可拖动
    // background-color: rgba(255,0,0,0.1); // 调试用：给占位符一个颜色看看范围
  }

  .header-logo-wrapper {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px; // 可以调整
    border-radius: 50%;
    -webkit-app-region: no-drag; // Logo 区域不可拖动，以便点击
    margin-left: 0; // 确保在 toolbarStyle 应用的 padding-left 之后正确对齐
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .header-title {
    font-weight: 600;
    letter-spacing: 0.02em;
    margin-left: 8px;
    flex-grow: 1; // 让标题占据剩余空间，成为主要的拖动区域
    text-align: center; // 可以选择让标题居中
    // -webkit-app-region: drag; // 已在 .main-header 设置，这里不需要重复，除非想更精确控制
  }

  // 所有可交互元素设为不可拖动
  .q-btn, .q-toolbar__title:not(.draggable-area), .header-logo-wrapper {
    -webkit-app-region: no-drag;
  }

  .window-controls {
    display: flex;
    margin-left: auto; // 将窗口控件推到最右边
    -webkit-app-region: no-drag;
    .q-btn {
      min-width: 38px;
      color: $header-text; // 确保按钮图标颜色
      border-radius: 0;
      padding: 0 8px; // 调整按钮内边距
      &:hover {
        background-color: rgba(255,255,255,0.15);
      }
      &.btn-close:hover {
        background-color: #e81123;
        color: white;
      }
    }
  }
}

// --- Page Transitions ---
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
