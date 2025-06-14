<template>
  <q-layout view="lHh LpR fFf" class="main-layout" :class="{ 'platform-mac': isOnMac }">
    <!-- Header -->
    <q-header class="main-header">
      <q-toolbar class="header-toolbar-content" :style="toolbarStyle">
        <!-- 所有平台都使用自定义红绿灯区域 -->
        <div
          class="logo-traffic-area q-ml-xs"
          @mouseenter="handleLogoAreaEnter"
          @mouseleave="handleLogoAreaLeave"
        >
          <AppLogo :is-drawer-open="leftDrawerOpen" @toggle-drawer="toggleLeftDrawer" />
          <CustomTrafficLights :isVisible="showTrafficLights" />
        </div>

        <q-toolbar-title class="header-title draggable-area"></q-toolbar-title>

        <q-btn
          dense
          flat
          round
          icon="queue_music"
          aria-label="Play Queue"
          @click="togglePlayQueue"
          class="non-draggable-area"
        />
      </q-toolbar>
    </q-header>

    <!-- Left Drawer (using AppDrawer component) -->
    <AppDrawer v-model:is-open="leftDrawerOpen" />

    <!-- Play Queue -->
    <PlayQueue
      :visible="playQueueOpen"
      :queue="playQueueData"
      :current-track="currentTrackData"
      @play-track="handlePlayTrack"
      @remove-from-queue="handleRemoveFromQueue"
      @clear-queue="handleClearQueue"
    />

    <!-- Page Container -->
    <q-page-container class="page-container-bg">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <!-- Mini Player -->
      <MiniPlayer />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMusicStore, type MusicTrack } from 'src/stores/musicStore';
import AppLogo from 'components/AppLogo.vue';
import AppDrawer from 'components/AppDrawer.vue';
import MiniPlayer from 'components/MiniPlayer.vue';
import CustomTrafficLights from 'components/CustomTrafficLights.vue';
import PlayQueue from 'components/PlayQueue.vue';

// 定义 Track 类型 - 与 PlayQueue 组件保持一致
interface Track {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  coverUrl?: string;
  beatmapsetId?: number;
}

const leftDrawerOpen = ref(false);
const playQueueOpen = ref(false);
const route = useRoute();
const isOnMac = ref(false);
const isFullScreen = ref(false); // 新增：追踪全屏状态
const showTrafficLights = ref(false); // 控制红绿灯显示
const musicStore = useMusicStore();

// 将 MusicTrack 转换为 PlayQueue 组件期望的 Track 类型
const convertToTrack = (musicTrack: MusicTrack): Track => {
  const track: Track = {
    id: musicTrack.id,
    title: musicTrack.title,
  };

  if (musicTrack.artist) track.artist = musicTrack.artist;
  if (musicTrack.duration) track.duration = musicTrack.duration;
  if (musicTrack.coverUrl) track.coverUrl = musicTrack.coverUrl;

  const beatmapsetId = parseInt(musicTrack.id);
  if (!isNaN(beatmapsetId)) track.beatmapsetId = beatmapsetId;

  return track;
};

// 转换播放队列数据
const playQueueData = computed(() => musicStore.playQueue.map(convertToTrack));
const currentTrackData = computed(() =>
  musicStore.currentTrack ? convertToTrack(musicStore.currentTrack) : null,
);

// 监听路由变化，切换到 player 页面时自动收起抽屉
watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName === 'player' && leftDrawerOpen.value) {
      leftDrawerOpen.value = false;
    }
  },
  { immediate: true },
);

// 动态计算 toolbar 的样式
const toolbarStyle = computed<CSSProperties>(() => {
  const baseStyle: CSSProperties = { paddingLeft: '12px' };

  // 如果在 PlayerPage 页面且抽屉收起，则让 header 透明
  if (route.name === 'player' && !leftDrawerOpen.value) {
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      backdropFilter: 'none',
      borderBottom: 'none',
    };
  }

  // 如果在 PlayerPage 页面且抽屉展开，则显示半透明背景
  if (route.name === 'player' && leftDrawerOpen.value) {
    return {
      ...baseStyle,
      backgroundColor: 'rgba(31, 31, 39, 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    };
  }

  return baseStyle;
});

let unlistenEnterFullScreen: (() => void) | undefined;
let unlistenLeaveFullScreen: (() => void) | undefined;

onMounted(async () => {
  if (window.electron?.process && window.electron.windowControls && window.electron.ipcRenderer) {
    const platform = window.electron.process.platform;
    isOnMac.value = platform === 'darwin';
    try {
      isFullScreen.value = await window.electron.windowControls.isFullScreen();
    } catch (e) {
      console.error('Error getting initial window states:', e);
    }
    unlistenEnterFullScreen = window.electron.windowControls.onEnterFullScreen(() => {
      isFullScreen.value = true;
    });
    unlistenLeaveFullScreen = window.electron.windowControls.onLeaveFullScreen(() => {
      isFullScreen.value = false;
    });
  } else {
    isOnMac.value = false;
  }
});

onUnmounted(() => {
  if (unlistenEnterFullScreen) unlistenEnterFullScreen();
  if (unlistenLeaveFullScreen) unlistenLeaveFullScreen();
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// 播放队列相关方法
function togglePlayQueue() {
  playQueueOpen.value = !playQueueOpen.value;
}

function handlePlayTrack(track: Track) {
  // 在播放队列中找到歌曲索引并播放
  const trackIndex = musicStore.playQueue.findIndex((t) => t.id === track.id);
  if (trackIndex >= 0) {
    musicStore.playFromQueue(trackIndex);
  }
  console.log('Playing track:', track.title);
}

function handleRemoveFromQueue(index: number) {
  musicStore.removeFromQueue(index);
}

function handleClearQueue() {
  musicStore.clearPlayQueue();
}

// 红绿灯区域鼠标事件处理（所有平台都启用）
function handleLogoAreaEnter() {
  showTrafficLights.value = true;
}

function handleLogoAreaLeave() {
  showTrafficLights.value = false;
}
</script>

<style lang="scss" scoped>
@use 'sass:color';

$header-bg: #1f1f27 !default;
$dark-page: #121218 !default;
$header-text: #ffffff !default;
$primary: #ff4081 !default; // 确保 $primary 已定义

// 移除空的样式规则以避免 lint 错误
// .main-layout 样式在需要时可以在这里添加

.page-container-bg {
  background-color: $dark-page;
  color: $header-text; // 假设页面文本也是亮的
  padding-bottom: calc(env(safe-area-inset-bottom) + 60px); // 适配 iOS 底部安全区 + MiniPlayer 高度
  position: relative;
}

.main-header {
  background: transparent !important; // 让 q-header 本身透明
  box-shadow: none !important; // 移除 q-header 的默认阴影
  color: $header-text;
  -webkit-app-region: drag; // 默认整个 header 可拖动
  padding-top: env(safe-area-inset-top); // 关键：顶部安全区适配

  .header-toolbar-content {
    background-color: $header-bg; // 毛玻璃效果的底色
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex; // 确保 toolbar 内容水平排列
    align-items: center; // 垂直居中
    width: 100%;
    padding-right: 12px; // 给右侧按钮一些空间
    transition: all 0.3s ease; // 添加过渡动画
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

  .logo-traffic-area {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 4px;
    padding-right: 80px; // 为红绿灯区域预留空间
    -webkit-app-region: no-drag; // 整个区域不可拖动，以便点击
    margin-left: 0;
    border-radius: 50px 20px 20px 50px; // 圆角设计，左侧更圆
    position: relative;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
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
  .q-btn,
  .q-toolbar__title:not(.draggable-area),
  .header-logo-wrapper {
    -webkit-app-region: no-drag;
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
