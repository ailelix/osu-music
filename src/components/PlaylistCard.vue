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
        icon="open_in_new"
        label="View"
        size="sm"
        @click.stop="$emit('view')"
      />
      <q-btn
        v-if="!playlist.isDefault"
        flat
        color="negative"
        icon="delete"
        label="Delete"
        size="sm"
        @click.stop="$emit('delete')"
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

defineEmits<{
  click: [];
  play: [];
  view: [];
  delete: [];
}>();

const defaultCover = '/icons/favicon-128x128.png';

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
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.08);

    .play-overlay {
      opacity: 1;
    }

    .card-image {
      transform: scale(1.05);
    }
  }
}

.card-image-container {
  position: relative;
  height: 160px;
  overflow: hidden;

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover; // 保证图片完全填充
    object-position: center;
    background: #222;
    transition: transform 0.3s ease;
  }

  .default-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(255, 193, 7, 0.9);
    color: black;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(10px);
  }

  .play-overlay {
    opacity: 0;
    background: rgba(0, 0, 0, 0.3);
    transition: opacity 0.3s ease;

    .play-button {
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.card-content {
  padding: 16px;

  .playlist-name {
    font-size: 16px;
    font-weight: 600;
    color: white;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .playlist-description {
    font-size: 14px;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .stats-row {
    display: flex;
    gap: 16px;
    align-items: center;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;

      .q-icon {
        opacity: 0.7;
      }

      .stat-value {
        font-weight: 500;
      }
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;

    .tag-chip {
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
    }
  }

  .updated-time {
    .text-caption {
      display: flex;
      align-items: center;
      font-size: 11px;
    }
  }
}

.card-actions {
  padding: 8px 16px 16px;
  background: rgba(255, 255, 255, 0.02);

  .q-btn {
    font-size: 12px;
    padding: 4px 12px;
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
      .q-btn {
        padding: 3px 8px;
        font-size: 11px;
      }
    }
  }
}
</style>
