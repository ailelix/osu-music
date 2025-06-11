<template>
  <Transition name="mini-player" appear>
    <div
      v-if="shouldShowMiniPlayer"
      class="mini-player-container"
      :class="{ collapsed: isCollapsed }"
    >
      <!-- 收起状态下的触发区域 -->
      <div
        v-if="isCollapsed"
        class="collapsed-trigger-area"
        @mouseenter="handleTriggerAreaEnter"
        @mouseleave="handleTriggerAreaLeave"
      ></div>

      <!-- 收起按钮 -->
      <transition name="fade-button">
        <div v-if="showCollapseButton" class="collapse-button-container">
          <q-btn
            round
            flat
            :icon="isCollapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'"
            size="sm"
            @click.stop="toggleCollapse"
            class="collapse-btn"
          />
        </div>
      </transition>

      <div class="mini-player" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <!-- 背景模糊层 -->
        <div class="background-blur" :style="backgroundStyle"></div>

        <!-- 主要内容 -->
        <div class="mini-player-content" @click="openPlayer">
          <!-- 旋转封面 -->
          <div class="rotating-cover-container">
            <div class="rotating-cover" :class="{ spinning: isPlaying }">
              <q-img
                v-if="currentTrack?.coverUrl"
                :src="currentTrack.coverUrl"
                class="cover-image"
                fit="cover"
                :ratio="1"
              />
              <div v-else class="cover-placeholder">
                <q-icon name="music_note" size="24px" color="white" />
              </div>
            </div>
            <!-- 中心播放指示器 -->
            <div class="center-dot"></div>
          </div>

          <!-- 音乐信息和进度 -->
          <div class="track-section">
            <div class="track-info">
              <div class="track-title">{{ currentTrack?.title || 'No track selected' }}</div>
              <div class="track-artist">{{ currentTrack?.artist || 'Unknown Artist' }}</div>
            </div>

            <!-- 进度条 -->
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${progressPercent * 100}%` }"></div>
              </div>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="control-section">
            <q-btn
              round
              flat
              :icon="isPlaying ? 'pause' : 'play_arrow'"
              size="md"
              @click.stop="togglePlayPause"
              class="play-btn"
            />
            <q-btn
              round
              flat
              icon="skip_next"
              size="sm"
              @click.stop="nextTrack"
              class="control-btn"
            />
          </div>

          <!-- 音量控制 -->
          <div class="volume-section">
            <q-btn
              round
              flat
              :icon="volumeIcon"
              size="sm"
              @click.stop="toggleMute"
              class="volume-btn"
            />
            <q-slider
              v-model="localVolume"
              :min="0"
              :max="100"
              color="primary"
              track-color="rgba(255,255,255,0.2)"
              @update:model-value="onVolumeChange"
              class="volume-slider-inline"
            />
          </div>
        </div>

        <!-- OSU! 风格的装饰元素 -->
        <div class="osu-decorations">
          <div class="osu-circle" :class="{ pulsing: isPlaying }"></div>
          <div class="osu-triangle"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMusicStore } from 'src/stores/musicStore';

const router = useRouter();
const route = useRoute();
const musicStore = useMusicStore();

// 本地音量状态
const localVolume = ref(Math.round(musicStore.volume * 100));
const isMuted = ref(false);
const previousVolume = ref(50); // 静音前的音量
const isCollapsed = ref(false); // 收起状态
const showCollapseButton = ref(false); // 收起按钮显示状态
const hideButtonTimer = ref<NodeJS.Timeout | null>(null); // 隐藏按钮的定时器

// 计算属性
const currentTrack = computed(() => musicStore.currentTrack);
const isPlaying = computed(() => musicStore.isPlaying);
const currentTime = computed(() => musicStore.currentTime);
const duration = computed(() => musicStore.duration);
const volume = computed(() => musicStore.volume);

// 检查是否在PlayerPage，如果是则隐藏MiniPlayer
const shouldShowMiniPlayer = computed(() => {
  return currentTrack.value && route.name !== 'player';
});

const progressPercent = computed(() => {
  if (!duration.value || duration.value === 0) return 0;
  return currentTime.value / duration.value;
});

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return 'volume_off';
  if (volume.value < 0.3) return 'volume_down';
  if (volume.value < 0.7) return 'volume_up';
  return 'volume_up';
});

const backgroundStyle = computed(() => {
  if (currentTrack.value?.coverUrl) {
    return {
      backgroundImage: `url(${currentTrack.value.coverUrl})`,
    };
  }
  return {};
});

// 方法
const togglePlayPause = () => {
  if (isPlaying.value) {
    musicStore.pause();
  } else {
    musicStore.play();
  }
};

const nextTrack = () => {
  musicStore.nextTrack();
};

const toggleMute = () => {
  if (volume.value > 0) {
    previousVolume.value = localVolume.value > 0 ? localVolume.value : 50;
    musicStore.setVolume(0);
    isMuted.value = true;
  } else {
    musicStore.setVolume(previousVolume.value / 100);
    isMuted.value = false;
  }
};

const openPlayer = () => {
  router.push('/player');
};

// 收起/展开小播放器
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 鼠标进入小播放器区域
const handleMouseEnter = () => {
  if (hideButtonTimer.value) {
    clearTimeout(hideButtonTimer.value);
    hideButtonTimer.value = null;
  }
  showCollapseButton.value = true;
};

// 鼠标离开小播放器区域
const handleMouseLeave = () => {
  // 对于正常状态，给一个短暂的延时
  hideButtonTimer.value = setTimeout(() => {
    showCollapseButton.value = false;
  }, 1200); // 1.2秒后隐藏
};

// 触发区域专用的鼠标进入事件
const handleTriggerAreaEnter = () => {
  if (hideButtonTimer.value) {
    clearTimeout(hideButtonTimer.value);
    hideButtonTimer.value = null;
  }
  showCollapseButton.value = true;
};

// 触发区域专用的鼠标离开事件
const handleTriggerAreaLeave = () => {
  // 立即隐藏按钮
  showCollapseButton.value = false;
};

// 监听store中的音量变化
watch(
  () => musicStore.volume,
  (newVolume) => {
    localVolume.value = Math.round(newVolume * 100);
    isMuted.value = newVolume === 0;
  },
);

// 音量控制方法
const onVolumeChange = (value: number | null) => {
  if (value !== null) {
    musicStore.setVolume(value / 100);
  }
};

// 组件卸载时清理定时器
onUnmounted(() => {
  if (hideButtonTimer.value) {
    clearTimeout(hideButtonTimer.value);
  }
});
</script>

<style lang="scss" scoped>
.mini-player-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: calc(100% - 40px);
  max-width: 800px;
  pointer-events: none;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* 确保音量滑杆区域能够正确显示 */
  overflow: visible;

  &.collapsed {
    transform: translateX(-50%) translateY(calc(100% + 20px));
  }
}

.collapsed-trigger-area {
  position: absolute;
  bottom: -135px; /* 向上移动到覆盖按钮位置上方1个半径 */
  left: 50%;
  transform: translateX(-50%);
  width: 180px; /* 6倍按钮直径 (30px * 6) 作为圆形直径 */
  height: 180px;
  border-radius: 50%; /* 使其成为圆形 */
  pointer-events: auto;
  /* 调试用，生产环境可以注释掉 */
  /* background: rgba(255, 0, 0, 0.1); */
}

.collapse-button-container {
  position: absolute;
  top: -45px; /* 向上移动一个按钮直径 (30px) */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  pointer-events: auto;
}

.collapse-btn {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  width: 30px;
  height: 30px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    color: white;
    transform: scale(1.1);
  }
}

.mini-player {
  position: relative;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden; /* 保持隐藏以维持圆角效果 */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: all;
  width: auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

.background-blur {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(40px) brightness(0.3);
  opacity: 0.6;
  z-index: -1;
}

.mini-player-content {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 16px;
  position: relative;
}

.rotating-cover-container {
  position: relative;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rotating-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s ease;

  &.spinning {
    animation: rotate 8s linear infinite;
  }

  &:hover {
    transform: scale(1.05);
  }
}

.cover-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.track-section {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.track-info {
  margin-bottom: 6px;
}

.track-title {
  color: white;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.track-artist {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.progress-bar-container {
  width: 100%;
}

.progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b, #ff8e53, #ff6b6b);
  background-size: 200% 100%;
  animation: gradient-shift 3s ease-in-out infinite;
  border-radius: 2px;
  transition: width 0.1s ease;
  box-shadow: 0 0 8px rgba(255, 107, 107, 0.4);
}

.control-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.play-btn {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 1s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
  }
}

.control-btn {
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }
}

.volume-section {
  flex-shrink: 0;
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;

  .volume-btn {
    color: rgba(255, 255, 255, 0.8);
    transition: color 0.2s ease;

    &:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .volume-slider-inline {
    width: 80px;

    :deep(.q-slider__track) {
      background: rgba(255, 255, 255, 0.2);
      height: 3px;
      transition: none !important;
    }

    :deep(.q-slider__track-container) {
      transition: none !important;
    }

    :deep(.q-slider__thumb) {
      background: white;
      border: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      width: 12px !important;
      height: 12px !important;
      border-radius: 50% !important;
      transition: none !important;
    }

    :deep(.q-slider__track--active) {
      background: linear-gradient(90deg, #ff6b6b, #ff8e53);
      height: 3px;
      transition: none !important;
    }

    :deep(.q-slider__thumb-container) {
      transition: none !important;
    }
  }
}

.osu-decorations {
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.osu-circle {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 107, 107, 0.3);
  border-radius: 50%;
  opacity: 0.6;

  &.pulsing {
    animation: osu-pulse 2s ease-in-out infinite;
  }
}

.osu-triangle {
  position: absolute;
  bottom: 5px;
  right: 15px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 12px solid rgba(255, 142, 83, 0.4);
  opacity: 0.7;
  transform: rotate(45deg);
}

// 动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

@keyframes osu-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
}

// 进入/离开动画
.mini-player-enter-active,
.mini-player-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.mini-player-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.95);
}

.mini-player-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.95);
}

// 收起按钮动画
.fade-button-enter-active,
.fade-button-leave-active {
  transition: all 0.2s ease;
}

.fade-button-enter-from,
.fade-button-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-5px) scale(0.8);
}

.fade-button-enter-to,
.fade-button-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

// 响应式设计
@media (max-width: 768px) {
  .mini-player-container {
    bottom: 15px;
    width: calc(100% - 20px);

    &.collapsed {
      transform: translateX(-50%) translateY(calc(100% + 15px));
    }
  }

  .collapsed-trigger-area {
    bottom: -117px; /* 移动端调整位置，覆盖按钮位置上方1个半径 */
    width: 156px; /* 移动端6倍按钮直径 (26px * 6) */
    height: 156px;
    border-radius: 50%;
  }

  .collapse-button-container {
    top: -38px; /* 移动端向上移动一个按钮直径 (26px) */
  }

  .collapse-btn {
    width: 26px;
    height: 26px;
  }

  .mini-player-content {
    padding: 10px 16px;
    gap: 12px;
  }

  .rotating-cover-container {
    width: 45px;
    height: 45px;
  }

  .track-title {
    font-size: 14px;
  }

  .track-artist {
    font-size: 12px;
  }

  .control-section {
    gap: 6px;
  }

  .osu-decorations {
    width: 50px;
  }
}
</style>
