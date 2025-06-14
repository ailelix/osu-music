<template>
  <q-card class="music-card" bordered flat @click="$emit('click', track)">
    <div class="card-content">
      <!-- 封面图片 -->
      <div class="cover-section">
        <div class="cover-image-container">
          <img
            :src="smartCoverUrl"
            :alt="track.title"
            class="cover-image"
            @error="onImageError"
            draggable="false"
          />
          <div class="play-overlay">
            <q-btn
              round
              color="primary"
              icon="play_arrow"
              size="md"
              @click.stop="$emit('play', track)"
              class="play-button"
            />
          </div>
        </div>
      </div>

      <!-- 音乐信息 -->
      <div class="info-section">
        <div class="track-info">
          <h6 class="track-title text-weight-medium q-mb-xs">
            {{ track.title }}
          </h6>
          <p class="track-artist text-caption text-grey-6 q-mb-xs">
            {{ track.artist || 'Unknown Artist' }}
          </p>
        </div>

        <!-- 底部信息 -->
        <div class="track-meta row items-center justify-between q-mt-sm">
          <div class="duration text-caption text-grey-6">
            {{ formatDuration(track.duration) }}
          </div>
          <div class="actions row items-center">
            <!-- 快速收藏按钮 -->
            <q-btn
              flat
              round
              size="sm"
              :icon="isInFavorites ? 'favorite' : 'favorite_border'"
              :color="isInFavorites ? 'pink' : 'grey-6'"
              @click.stop="toggleFavorite"
              :loading="isAddingToFavorites"
              class="q-mr-xs"
            >
              <q-tooltip>{{
                isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'
              }}</q-tooltip>
            </q-btn>

            <!-- 快速添加到播放列表按钮 -->
            <q-btn
              flat
              round
              size="sm"
              icon="playlist_add"
              color="grey-6"
              @click.stop="openAddToPlaylistDialog"
              class="q-mr-xs"
            >
              <q-tooltip>Add to Playlist</q-tooltip>
            </q-btn>

            <!-- 更多选项菜单 -->
            <q-btn
              flat
              round
              size="sm"
              icon="more_vert"
              color="grey-6"
              @click.stop="handleMenuButtonClick"
            >
              <q-menu v-model="showMenu" class="track-menu">
                <q-list dense style="min-width: 180px">
                  <q-item clickable v-close-popup @click="handlePlayNow">
                    <q-item-section avatar>
                      <q-icon name="play_arrow" />
                    </q-item-section>
                    <q-item-section>Play Now</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="handleAddToQueue">
                    <q-item-section avatar>
                      <q-icon name="queue" />
                    </q-item-section>
                    <q-item-section>Add to Queue</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="handlePlayNext">
                    <q-item-section avatar>
                      <q-icon name="skip_next" />
                    </q-item-section>
                    <q-item-section>Play Next</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="toggleFavorite">
                    <q-item-section avatar>
                      <q-icon :name="isInFavorites ? 'favorite' : 'favorite_border'" />
                    </q-item-section>
                    <q-item-section>{{
                      isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'
                    }}</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="openAddToPlaylistDialog">
                    <q-item-section avatar>
                      <q-icon name="playlist_add" />
                    </q-item-section>
                    <q-item-section>Add to Playlist</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="handleShowInfo">
                    <q-item-section avatar>
                      <q-icon name="info" />
                    </q-item-section>
                    <q-item-section>Track Info</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { type MusicTrack } from 'src/stores/musicStore';
import { usePlaylistStore, type PlaylistTrack } from 'src/stores/playlistStore';
import AddToPlaylistDialog from './AddToPlaylistDialog.vue';

// Props
const props = defineProps<{
  track: MusicTrack;
}>();

// Events
const emit = defineEmits<{
  click: [track: MusicTrack];
  play: [track: MusicTrack];
  addToPlaylist: [track: MusicTrack];
  showInfo: [track: MusicTrack];
  addToQueue: [track: MusicTrack];
  playNext: [track: MusicTrack];
}>();

// Composables
const $q = useQuasar();
const playlistStore = usePlaylistStore();

// State
const isAddingToFavorites = ref(false);
const showMenu = ref(false);

// 使用 osu! ppy 的默认封面
const defaultCover = 'https://osu.ppy.sh/images/layout/beatmaps/default-bg.png';

// 智能封面 URL 生成
const smartCoverUrl = computed(() => {
  // 如果有 coverUrl，直接使用
  if (props.track.coverUrl) {
    return props.track.coverUrl;
  }

  // 尝试从 beatmapset ID 生成封面 URL
  if (props.track.id && props.track.id !== 'unknown') {
    return `https://assets.ppy.sh/beatmaps/${props.track.id}/covers/card.jpg`;
  }

  // 使用默认封面
  return defaultCover;
});

// 检查是否在收藏夹中
const isInFavorites = computed(() => {
  const favPlaylist = playlistStore.defaultPlaylist;
  if (!favPlaylist) return false;
  return favPlaylist.tracks.some((t) => t.beatmapsetId === Number(props.track.id));
});

const coverSrc = ref(smartCoverUrl.value);

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  const currentSrc = img.src;

  // 如果当前不是默认封面且还没尝试过其他尺寸
  if (currentSrc !== defaultCover && props.track.id && props.track.id !== 'unknown') {
    // 尝试其他封面尺寸
    if (currentSrc.includes('/card.jpg')) {
      // 尝试 list 尺寸
      const listUrl = `https://assets.ppy.sh/beatmaps/${props.track.id}/covers/list.jpg`;
      img.src = listUrl;
      coverSrc.value = listUrl;
      return;
    } else if (currentSrc.includes('/list.jpg')) {
      // 尝试 cover 尺寸
      const coverUrl = `https://assets.ppy.sh/beatmaps/${props.track.id}/covers/cover.jpg`;
      img.src = coverUrl;
      coverSrc.value = coverUrl;
      return;
    }
  }

  // 最后使用默认封面
  if (currentSrc !== defaultCover) {
    img.src = defaultCover;
    coverSrc.value = defaultCover;
  }
};

// 转换为播放列表歌曲格式
const convertToPlaylistTrack = (track: MusicTrack): Omit<PlaylistTrack, 'addedAt'> => {
  return {
    beatmapsetId: Number(track.id) || 0,
    title: track.title,
    artist: track.artist || 'Unknown Artist',
    duration: track.duration || 0,
    bpm: 120, // 默认 BPM，因为 MusicTrack 中没有这个字段
  };
};

// 切换收藏状态
const toggleFavorite = async () => {
  const favPlaylist = playlistStore.defaultPlaylist;
  if (!favPlaylist) {
    $q.notify({
      type: 'negative',
      message: 'Favorites playlist not found',
      position: 'top',
    });
    return;
  }

  isAddingToFavorites.value = true;
  try {
    if (isInFavorites.value) {
      // 从收藏夹移除
      await playlistStore.removeTrackFromPlaylist(favPlaylist.id, Number(props.track.id));
      $q.notify({
        type: 'info',
        message: 'Removed from Favorites',
        position: 'top',
      });
    } else {
      // 添加到收藏夹
      const playlistTrack = convertToPlaylistTrack(props.track);
      await playlistStore.addTrackToPlaylist(favPlaylist.id, playlistTrack);
      $q.notify({
        type: 'positive',
        message: 'Added to Favorites!',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update favorites',
      position: 'top',
    });
  } finally {
    isAddingToFavorites.value = false;
  }
};

// 打开添加到播放列表对话框
const openAddToPlaylistDialog = () => {
  $q.dialog({
    component: AddToPlaylistDialog,
    componentProps: {
      track: props.track,
    },
  });
};

// 格式化时长
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 事件处理函数（带日志）
const handleMenuButtonClick = () => {
  console.log(`[MusicCard] Menu button clicked for track: ${props.track.title}`);
  showMenu.value = true;
};

const handlePlayNow = () => {
  console.log(`[MusicCard] Play Now clicked for track: ${props.track.title}`);
  emit('play', props.track);
};

const handleAddToQueue = () => {
  console.log(`[MusicCard] Add to Queue clicked for track: ${props.track.title}`);
  emit('addToQueue', props.track);
};

const handlePlayNext = () => {
  console.log(`[MusicCard] Play Next clicked for track: ${props.track.title}`);
  emit('playNext', props.track);
};

const handleShowInfo = () => {
  console.log(`[MusicCard] Show Info clicked for track: ${props.track.title}`);
  emit('showInfo', props.track);
};
</script>

<style lang="scss" scoped>
.music-card {
  background: rgba(255, 255, 255, 0.05); // 与 PlaylistPage 一致的卡片背景
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1); // 与 PlaylistPage 一致的边框
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 280px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.08); // 悬停时稍微亮一点
    border-color: rgba(255, 105, 180, 0.3); // 悬停时边框高亮

    .play-overlay {
      opacity: 1;
    }
  }

  .card-content {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .cover-section {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;

    .cover-image-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: block; // Ensure block display
      overflow: hidden; // Add overflow hidden here as well

      .cover-image {
        display: block; // Ensure block display for the image itself
        width: 100%;
        height: 100%;
        object-fit: cover; // 保证图片完全填充且不留空白
        object-position: center;
        background: #222; // 防止图片加载失败时有空白
        transition: transform 0.3s ease;
        user-select: none;
      }

      .play-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: opacity 0.3s ease;

        .play-button {
          transform: scale(1);
          transition: transform 0.2s ease;

          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }
  }

  .info-section {
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .track-info {
      .track-title {
        color: #ffffff; // 与 PlaylistPage 一致的主文字颜色
        font-size: 14px;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        margin-bottom: 4px;
      }

      .track-artist {
        color: #8b92b8; // 与 PlaylistPage 一致的次要文字颜色
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 2px;
      }
    }

    .track-meta {
      margin-top: 8px;

      .actions {
        display: flex;
        align-items: center;
        gap: 4px;

        .q-btn {
          z-index: 10; // 确保按钮在上层
          position: relative; // 确保 z-index 生效
        }
      }

      .duration {
        color: #8b92b8; // 与 PlaylistPage 一致的次要文字颜色
        font-family: 'JetBrains Mono', monospace;
      }
    }
  }
}

// 菜单样式
.track-menu {
  z-index: 9999; // 确保菜单在最顶层

  .q-list {
    background: rgba(40, 40, 50, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 4px 0;
  }

  .q-item {
    color: #ffffff;
    border-radius: 6px;
    margin: 2px 6px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 105, 180, 0.15);
      color: #ff69b4;
    }

    .q-icon {
      color: inherit;
    }
  }

  .q-separator {
    background: rgba(255, 255, 255, 0.1);
    margin: 4px 0;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .music-card {
    height: 260px;

    .cover-section {
      height: 160px;
    }

    .info-section {
      padding: 10px;

      .track-info {
        .track-title {
          font-size: 13px;
        }
      }
    }
  }
}
</style>
