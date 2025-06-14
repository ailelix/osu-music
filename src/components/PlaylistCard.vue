<template>
  <q-card class="playlist-card cursor-pointer" @click="$emit('click')" flat bordered>
    <!-- 封面图片 -->
    <div class="card-image-container">
      <q-img
        :src="dynamicCoverImage"
        :alt="`${playlist.name} cover`"
        class="card-image"
        fit="cover"
        :ratio="1.8"
        @error="onImageError"
        style="object-fit: cover; object-position: center; background: #222"
      >
        <template #loading>
          <div class="absolute-full flex flex-center">
            <q-spinner color="white" size="2em" />
          </div>
        </template>
      </q-img>

      <!-- 默认标签 -->
      <div v-if="playlist.isDefault" class="default-badge">
        <q-icon name="star" />
        Default
      </div>

      <!-- 播放按钮叠加层 -->
      <div class="play-overlay absolute-full flex flex-center">
        <q-btn
          fab
          color="primary"
          icon="play_arrow"
          size="md"
          class="play-button"
          @click.stop="$emit('play')"
        />
      </div>
    </div>

    <!-- 卡片内容 -->
    <q-card-section class="card-content">
      <!-- 歌单名称和描述 -->
      <div class="playlist-info">
        <h6 class="playlist-name q-ma-none">
          {{ playlist.name }}
        </h6>
        <p class="playlist-description text-grey-6 q-ma-none q-mt-xs">
          {{ playlist.description || 'No description' }}
        </p>
      </div>

      <!-- 歌单统计 -->
      <div class="stats-row q-mt-md">
        <div class="stat-item">
          <q-icon name="music_note" size="16px" />
          <span class="stat-value">{{ playlist.trackCount }} tracks</span>
        </div>
        <div class="stat-item">
          <q-icon name="schedule" size="16px" />
          <span class="stat-value">{{ formatTotalDuration(playlist.totalDuration) }}</span>
        </div>
      </div>

      <!-- 最近更新时间 -->
      <div class="updated-time q-mt-sm">
        <p class="text-caption text-grey-7 q-ma-none">
          <q-icon name="update" size="12px" class="q-mr-xs" />
          {{ formatUpdateTime(playlist.updatedAt) }}
        </p>
      </div>
    </q-card-section>

    <!-- 操作按钮 -->
    <q-card-actions align="right" class="card-actions">
      <q-btn
        flat
        color="primary"
        icon="play_arrow"
        label="Play"
        size="sm"
        @click.stop="$emit('play')"
      />
      <q-btn
        flat
        color="secondary"
        icon="queue"
        label="Add to Queue"
        size="sm"
        @click.stop="handleAddToQueue"
      />
      <q-btn
        v-if="!playlist.isDefault"
        flat
        color="negative"
        icon="delete"
        label="Delete"
        size="sm"
        @click.stop="handleDeletePlaylist"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Playlist } from 'src/stores/playlistStore';

interface Props {
  playlist: Playlist;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [];
  play: [];
  view: [];
  delete: [];
  addToQueue: [];
}>();

const defaultCover = '/icons/favicon-128x128.png';

// 事件处理函数（带日志）
const handleAddToQueue = () => {
  console.log(`[PlaylistCard] Add to Queue clicked for: ${props.playlist.name}`);
  emit('addToQueue');
};

const handleDeletePlaylist = () => {
  console.log(`[PlaylistCard] Delete Playlist clicked for: ${props.playlist.name}`);
  emit('delete');
};

// 动态封面图片 - 使用第一首歌的封面
const dynamicCoverImage = computed(() => {
  if (props.playlist.tracks.length === 0) {
    return defaultCover;
  }
  const firstTrack = props.playlist.tracks[0];
  if (firstTrack) {
    // 优先使用 card 尺寸的封面图片，适合卡片显示
    return `https://assets.ppy.sh/beatmaps/${firstTrack.beatmapsetId}/covers/card.jpg`;
  }
  return defaultCover;
});

// 图片加载错误处理
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = defaultCover;
};

// 格式化总时长
const formatTotalDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// 格式化更新时间
const formatUpdateTime = (dateString: string): string => {
  try {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: enUS,
    });
  } catch (e) {
    console.warn(`Failed to parse date: ${dateString}`, e);
    return 'Unknown time';
  }
};
</script>

<style lang="scss" scoped>
.playlist-card {
  background: rgba(30, 30, 33, 0.7); // 更深的 osu!lazer 风格背景
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.12); // 细致的边框
  border-radius: 8px; // 稍锐利的圆角
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); // 更柔和的阴影

  &:hover {
    transform: translateY(-5px) scale(1.03);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45); // 增强阴影
    background: rgba(35, 35, 40, 0.8);
    border-color: rgba(255, 105, 180, 0.55); // 增强边框高亮

    .play-overlay {
      opacity: 1;
      background: rgba(0, 0, 0, 0.5); // 悬停时叠加层更明显
    }

    .card-image {
      transform: scale(1.1); // 图片放大效果
    }
  }
}

.card-image-container {
  position: relative;
  height: 180px; // 稍微增加高度以获得更好的视觉比例
  overflow: hidden;
  background-color: #18181a; // 图片加载时的深色背景

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); // 更平滑的过渡
  }

  .default-badge {
    position: absolute;
    top: 10px; // 调整位置
    left: 10px;
    padding: 5px 10px;
    border-radius: 6px; // 统一圆角
    font-size: 11px;
    font-weight: 600;
    background: linear-gradient(135deg, #ff69b4, #c77dff); // lazer 粉紫渐变
    color: white;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35); // 增强阴影
    text-transform: uppercase; // 文本大写
    letter-spacing: 0.5px;
    border: 1px solid rgba(255, 255, 255, 0.15); // 添加细微边框

    .q-icon {
      font-size: 14px; // 调整图标大小
    }
  }

  .play-overlay {
    opacity: 0;
    background: rgba(0, 0, 0, 0.4); // 稍微调暗叠加层
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .play-button {
      background: linear-gradient(135deg, #ff69b4, #c77dff); // lazer 粉紫渐变
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); // 使用 cubic-bezier

      &:hover {
        transform: scale(1.12); // 稍微增大悬停缩放
        box-shadow: 0 7px 18px rgba(0, 0, 0, 0.45); // 增强阴影
        background: linear-gradient(135deg, #ff7cc0, #d28eff); // 悬停时颜色变亮
      }

      &:active {
        transform: scale(1.05); // 点击时缩小反馈
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
      }
    }
  }
}

.card-content {
  padding: 16px;
  background-color: rgba(20, 20, 23, 0.5); // 内容区域的深色背景

  .playlist-name {
    font-size: 1.1rem; // 调整字体大小
    font-weight: 600;
    color: #f0f0f0; // 亮白色
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); // 轻微文本阴影
  }

  .playlist-description {
    font-size: 0.8rem;
    line-height: 1.4;
    color: #a0a0a0; // 柔和的灰色
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(1.4em * 2); // 确保描述区域至少有两行的高度
  }

  .stats-row {
    display: flex;
    gap: 16px;
    align-items: center;
    color: #b0b0b0; // 统计信息文本颜色
    font-size: 0.75rem;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px; // 调整图标和文本间距

      .q-icon {
        opacity: 0.8;
        font-size: 14px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)); // 添加阴影
      }

      .stat-value {
        font-weight: 500;
      }
    }
  }

  .updated-time {
    .text-caption {
      display: flex;
      align-items: center;
      font-size: 0.7rem;
      color: #808080; // 更新时间文本颜色
      margin-top: 8px;

      .q-icon {
        font-size: 12px;
        margin-right: 4px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3)); // 添加阴影
      }
    }
  }
}

.card-actions {
  padding: 12px 16px; // 调整内边距
  background: rgba(20, 20, 23, 0.7); // 与内容区域背景协调或略深
  border-top: 1px solid rgba(255, 255, 255, 0.08); // 细微的顶部边框

  .q-btn {
    font-size: 0.75rem;
    padding: 6px 12px;
    border-radius: 6px;
    text-transform: none;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); // 使用 cubic-bezier

    &[color='primary'] {
      color: #ff69b4;
      background: transparent;

      &:hover {
        background: rgba(255, 105, 180, 0.15); // 悬停背景更明显
        color: #ff55a8;
        transform: translateY(-1px); // 轻微上移
      }

      &:active {
        background: rgba(255, 105, 180, 0.2);
        transform: translateY(0px);
      }
    }

    &[color='negative'] {
      color: #ff7675;
      background: transparent;

      &:hover {
        background: rgba(255, 118, 117, 0.15);
        color: #ff6363;
        transform: translateY(-1px);
      }

      &:active {
        background: rgba(255, 118, 117, 0.2);
        transform: translateY(0px);
      }
    }

    &[color='secondary'] {
      color: #64b5f6;
      background: transparent;

      &:hover {
        background: rgba(100, 181, 246, 0.15);
        color: #42a5f5;
        transform: translateY(-1px);
      }

      &:active {
        background: rgba(100, 181, 246, 0.2);
        transform: translateY(0px);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .playlist-card {
    .card-image-container {
      height: 140px;
    }

    .stats-row {
      gap: 12px;

      .stat-item {
        font-size: 11px;
      }
    }

    .card-actions {
      padding: 8px 12px;
      flex-wrap: wrap;
      gap: 4px;

      .q-btn {
        padding: 3px 8px;
        font-size: 10px;
        min-width: auto;
        white-space: nowrap;
      }
    }
  }
}
</style>
