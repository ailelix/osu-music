<template>
  <div class="all-music-page">
    <!-- 页面标题 -->
    <section class="page-header q-mb-xl">
      <div class="title-section">
        <h4 class="q-mt-none q-mb-md text-h4 text-white">
          <q-icon name="music_note" class="q-mr-sm" />
          🎵 All Music
        </h4>
        <q-separator dark spaced class="q-mb-lg" />
      </div>

      <!-- 统计信息 -->
      <div class="stats-cards row q-col-gutter-md q-mt-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="music_note" size="2rem" color="primary" />
              <div class="text-h6 q-mt-sm">{{ musicStore.totalTracks }}</div>
              <div class="text-caption text-grey-6">Tracks</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="schedule" size="2rem" color="secondary" />
              <div class="text-h6 q-mt-sm">{{ musicStore.totalDurationMinutes }}</div>
              <div class="text-caption text-grey-6">Minutes</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="play_arrow" size="2rem" color="positive" />
              <div class="text-h6 q-mt-sm">{{ musicStore.isPlaying ? '1' : '0' }}</div>
              <div class="text-caption text-grey-6">Playing</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="stat-card">
            <q-card-section class="text-center">
              <q-icon name="star" size="2rem" color="warning" />
              <div class="text-h6 q-mt-sm">{{ favoriteCount }}</div>
              <div class="text-caption text-grey-6">Favorites</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <q-separator spaced="xl" />

    <!-- 操作栏 -->
    <section class="actions-bar q-mb-lg">
      <div class="row items-center justify-between">
        <div class="col-auto">
          <h2 class="text-h5 text-weight-medium q-mb-none text-white">Music Library</h2>
        </div>
        <div class="col-auto">
          <div class="row q-gutter-md no-wrap">
            <q-btn
              icon="refresh"
              label="Scan Music"
              @click="scanMusic"
              :loading="musicStore.isLoading"
              class="lazer-action-btn lazer-bg-pink"
            />
            <q-btn
              icon="shuffle"
              label="Shuffle All"
              @click="shuffleAll"
              :disable="musicStore.totalTracks === 0"
              class="lazer-action-btn lazer-bg-purple"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 搜索和过滤 -->
    <section class="search-section q-mb-lg">
      <div class="row q-gutter-md items-end no-wrap">
        <div class="col">
          <q-input
            v-model="searchQuery"
            label="Search music..."
            outlined
            dark
            clearable
            @update:model-value="onSearchChange"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-auto">
          <q-select
            v-model="sortBy"
            :options="sortOptions"
            option-value="value"
            option-label="label"
            outlined
            dark
            label="Sort by"
            style="min-width: 150px"
            @update:model-value="onSortChange"
          />
        </div>
      </div>
    </section>

    <!-- 加载状态 -->
    <div v-if="musicStore.isLoading" class="loading-section text-center q-py-xl">
      <q-spinner color="primary" size="3rem" />
      <p class="text-subtitle2 text-grey-6 q-mt-md">Scanning music files...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="musicStore.error" class="error-section text-center q-py-xl">
      <q-icon name="error_outline" size="4rem" color="negative" />
      <h5 class="text-negative q-mt-md">Scan Failed</h5>
      <p class="text-grey-6">{{ musicStore.error }}</p>
      <q-btn
        color="primary"
        label="Retry"
        icon="refresh"
        outline
        @click="scanMusic"
        class="q-mt-md"
      />
    </div>

    <!-- 音乐网格/列表 -->
    <section v-else class="music-content">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="music-grid">
        <div v-if="filteredTracks.length > 0" class="row q-col-gutter-lg">
          <div
            v-for="track in filteredTracks"
            :key="track.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <MusicCard
              :track="track"
              @play="playTrack(track)"
              @addToQueue="addTrackToQueue(track)"
              @playNext="playTrackNext(track)"
              @delete="handleDeleteTrack(track)"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state text-center q-py-xl">
          <q-icon name="music_off" size="5rem" color="grey-5" />
          <h5 class="text-grey-5 q-mt-md">
            {{ searchQuery ? 'No matching tracks' : 'No music found' }}
          </h5>
          <p class="text-grey-6">
            {{
              searchQuery
                ? 'Try a different search term'
                : 'Scan your music folder to import tracks'
            }}
          </p>
          <q-btn
            v-if="!searchQuery"
            color="primary"
            label="Scan Music"
            icon="refresh"
            outline
            @click="scanMusic"
            class="q-mt-md"
          />
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="music-list show-scrollbar">
        <q-list v-if="filteredTracks.length > 0" dark separator class="music-list-container">
          <q-item
            v-for="track in filteredTracks"
            :key="track.id"
            clickable
            @click="playTrack(track)"
            class="music-list-item"
          >
            <q-item-section avatar>
              <q-avatar size="50px" rounded>
                <img :src="getSmartCoverUrl(track)" :alt="track.title" @error="onCoverImageError" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-white text-weight-medium">{{ track.title }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{
                track.artist || 'Unknown Artist'
              }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <span class="text-caption text-grey-6">{{ formatDuration(track.duration) }}</span>
                <q-btn
                  flat
                  round
                  size="sm"
                  icon="play_arrow"
                  color="primary"
                  @click.stop="playTrack(track)"
                />
                <!-- 次级菜单按钮 -->
                <q-btn flat round size="sm" icon="more_vert" color="grey-6" @click.stop>
                  <q-menu auto-close>
                    <q-list style="min-width: 180px">
                      <q-item clickable @click="addTrackToQueue(track)">
                        <q-item-section avatar>
                          <q-icon name="queue" />
                        </q-item-section>
                        <q-item-section>Add to Queue</q-item-section>
                      </q-item>

                      <q-item clickable @click="playTrackNext(track)">
                        <q-item-section avatar>
                          <q-icon name="skip_next" />
                        </q-item-section>
                        <q-item-section>Play Next</q-item-section>
                      </q-item>

                      <q-item clickable @click="openAddToPlaylistDialog(track)">
                        <q-item-section avatar>
                          <q-icon name="playlist_add" />
                        </q-item-section>
                        <q-item-section>Add to Playlist</q-item-section>
                      </q-item>

                      <q-item clickable @click="toggleFavorite(track)">
                        <q-item-section avatar>
                          <q-icon
                            :name="isTrackInFavorites(track) ? 'favorite' : 'favorite_border'"
                          />
                        </q-item-section>
                        <q-item-section>
                          {{
                            isTrackInFavorites(track) ? 'Remove from Favorites' : 'Add to Favorites'
                          }}
                        </q-item-section>
                      </q-item>

                      <q-separator />

                      <q-item clickable @click="confirmDeleteTrack(track)" class="text-negative">
                        <q-item-section avatar>
                          <q-icon name="delete" color="negative" />
                        </q-item-section>
                        <q-item-section>Delete Track</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- 空状态 -->
        <div v-else class="empty-state text-center q-py-xl">
          <q-icon name="music_off" size="5rem" color="grey-5" />
          <h5 class="text-grey-5 q-mt-md">
            {{ searchQuery ? 'No matching tracks' : 'No music found' }}
          </h5>
          <p class="text-grey-6">
            {{
              searchQuery
                ? 'Try a different search term'
                : 'Scan your music folder to import tracks'
            }}
          </p>
          <q-btn
            v-if="!searchQuery"
            color="primary"
            label="Scan Music"
            icon="refresh"
            outline
            @click="scanMusic"
            class="q-mt-md"
          />
        </div>
      </div>
    </section>

    <!-- 歌曲信息对话框 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useMusicStore, type MusicTrack } from 'src/stores/musicStore';
import { usePlaylistStore, type PlaylistTrack } from 'src/stores/playlistStore';
import MusicCard from 'src/components/MusicCard.vue';
import AddToPlaylistDialog from 'src/components/AddToPlaylistDialog.vue';

const $q = useQuasar();
const musicStore = useMusicStore();
const playlistStore = usePlaylistStore();

// 响应式数据
const searchQuery = ref('');
const sortBy = ref('title');
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

// 计算属性
const favoriteCount = computed(() => {
  // TODO: 实现收藏功能后返回实际数量
  return Math.floor(musicStore.totalTracks * 0.3);
});

// 根据屏幕比例自动选择视图模式
const viewMode = computed(() => {
  const aspectRatio = windowWidth.value / windowHeight.value;
  // 当宽高比小于 3:4 (0.75) 时使用列表视图（竖屏），否则使用网格视图
  return aspectRatio < 0.75 ? 'list' : 'grid';
});

const filteredTracks = computed(() => {
  let tracks = searchQuery.value ? musicStore.searchTracks(searchQuery.value) : musicStore.tracks;

  // 排序
  switch (sortBy.value) {
    case 'title':
      tracks = [...tracks].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'artist':
      tracks = [...tracks].sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
      break;
    case 'album':
      tracks = [...tracks].sort((a, b) => (a.album || '').localeCompare(b.album || ''));
      break;
    case 'duration':
      tracks = [...tracks].sort((a, b) => (b.duration || 0) - (a.duration || 0));
      break;
    case 'recent':
      tracks = [...tracks].sort(
        (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime(),
      );
      break;
  }

  return tracks;
});

// 选项配置
const sortOptions = [
  { label: 'Title', value: 'title' },
  { label: 'Artist', value: 'artist' },
  { label: 'Album', value: 'album' },
  { label: 'Duration', value: 'duration' },
  { label: 'Recently Added', value: 'recent' },
];

// 方法
const scanMusic = async () => {
  try {
    await musicStore.scanMusicFiles();

    if (musicStore.error) {
      $q.notify({
        message: 'Failed to scan music files',
        icon: 'error',
        color: 'negative',
      });
    } else {
      $q.notify({
        message: `Found ${musicStore.totalTracks} tracks`,
        icon: 'music_note',
        color: 'positive',
      });
    }
  } catch {
    $q.notify({
      message: 'An error occurred while scanning music files',
      icon: 'error',
      color: 'negative',
    });
  }
};

const playTrack = (track: MusicTrack) => {
  // 设置当前播放列表为所有过滤后的音轨
  const playlist = {
    id: 'all-music',
    name: 'All Music',
    tracks: filteredTracks.value,
  };

  musicStore.setCurrentPlaylist(playlist);
  musicStore.playTrack(track);

  $q.notify({
    message: `Now playing: ${track.title}`,
    icon: 'play_arrow',
    color: 'positive',
  });
};

const shuffleAll = () => {
  if (musicStore.totalTracks === 0) return;

  // 启用随机模式
  musicStore.shuffleMode = 'on';

  const randomTrack = musicStore.tracks[Math.floor(Math.random() * musicStore.tracks.length)];
  if (randomTrack) {
    playTrack(randomTrack);

    $q.notify({
      message: 'Shuffle mode activated',
      icon: 'shuffle',
      color: 'info',
    });
  }
};

const addTrackToQueue = (track: MusicTrack) => {
  console.log(`[AllMusicPage] Adding track to queue: ${track.title}`);

  // 检查当前是否有音乐在播放
  const wasEmpty = !musicStore.currentTrack;

  musicStore.addToQueue(track);

  // 如果之前没有音乐在播放，现在立即开始播放
  if (wasEmpty) {
    musicStore.playTrack(track);
    $q.notify({
      message: `Now playing: ${track.title}`,
      icon: 'play_arrow',
      color: 'positive',
    });
  } else {
    $q.notify({
      message: `"${track.title}" added to queue`,
      icon: 'queue',
      color: 'positive',
    });
  }
};

const playTrackNext = (track: MusicTrack) => {
  console.log(`[AllMusicPage] Setting track to play next: ${track.title}`);

  // 检查当前是否有音乐在播放
  const wasEmpty = !musicStore.currentTrack;

  if (wasEmpty) {
    // 如果没有音乐在播放，直接播放这首歌
    musicStore.playTrack(track);
    $q.notify({
      message: `Now playing: ${track.title}`,
      icon: 'play_arrow',
      color: 'positive',
    });
  } else {
    // 如果有音乐在播放，插入到队列下一首
    musicStore.addToQueueNext(track);
    $q.notify({
      message: `"${track.title}" will play next`,
      icon: 'skip_next',
      color: 'secondary',
    });
  }
};

// 删除歌曲处理函数
const handleDeleteTrack = async (track: MusicTrack) => {
  try {
    const result = await musicStore.deleteTrackFile(track);

    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `Successfully deleted "${track.title}"`,
        icon: 'delete',
        position: 'top',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: result.error || 'Failed to delete track',
        icon: 'error',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error deleting track:', error);
    $q.notify({
      type: 'negative',
      message: 'An error occurred while deleting the track',
      icon: 'error',
      position: 'top',
    });
  }
};

// 确认删除歌曲（用于列表视图）
const confirmDeleteTrack = (track: MusicTrack) => {
  $q.dialog({
    title: 'Delete Track',
    message: `Are you sure you want to delete "${track.title}"? This action cannot be undone.`,
    cancel: true,
    persistent: true,
    color: 'negative',
  }).onOk(() => {
    handleDeleteTrack(track);
  });
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

// 检查是否在收藏夹中
const isTrackInFavorites = (track: MusicTrack): boolean => {
  const favPlaylist = playlistStore.defaultPlaylist;
  if (!favPlaylist) return false;
  return favPlaylist.tracks.some((t) => t.beatmapsetId === Number(track.id));
};

// 切换收藏状态
const toggleFavorite = async (track: MusicTrack) => {
  const favPlaylist = playlistStore.defaultPlaylist;
  if (!favPlaylist) {
    $q.notify({
      type: 'negative',
      message: 'Favorites playlist not found',
      position: 'top',
    });
    return;
  }

  try {
    if (isTrackInFavorites(track)) {
      // 从收藏夹移除
      await playlistStore.removeTrackFromPlaylist(favPlaylist.id, Number(track.id));
      $q.notify({
        type: 'info',
        message: 'Removed from Favorites',
        position: 'top',
      });
    } else {
      // 添加到收藏夹
      const playlistTrack = convertToPlaylistTrack(track);
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
  }
};

// 打开添加到播放列表对话框
const openAddToPlaylistDialog = (track: MusicTrack) => {
  $q.dialog({
    component: AddToPlaylistDialog,
    componentProps: {
      track: track,
    },
  });
};

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 智能封面 URL 生成 - 与 MusicCard.vue 保持一致
const getSmartCoverUrl = (track: MusicTrack): string => {
  // 如果有 coverUrl，直接使用
  if (track.coverUrl) {
    return track.coverUrl;
  }

  // 尝试从 beatmapset ID 生成封面 URL
  if (track.id && track.id !== 'unknown') {
    return `https://assets.ppy.sh/beatmaps/${track.id}/covers/card.jpg`;
  }

  // 使用 osu! 默认封面
  return 'https://osu.ppy.sh/images/layout/beatmaps/default-bg.png';
};

// 封面图片错误处理
const onCoverImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  const currentSrc = img.src;
  const defaultCover = 'https://osu.ppy.sh/images/layout/beatmaps/default-bg.png';

  // 从 img 元素找到对应的 track
  const trackTitle = img.alt;
  const track = filteredTracks.value.find((t) => t.title === trackTitle);

  if (!track) {
    // 如果找不到对应 track，直接使用默认封面
    if (currentSrc !== defaultCover) {
      img.src = defaultCover;
    }
    return;
  }

  // 如果当前不是默认封面且还没尝试过其他尺寸
  if (currentSrc !== defaultCover && track.id && track.id !== 'unknown') {
    // 尝试其他封面尺寸
    if (currentSrc.includes('/card.jpg')) {
      // 尝试 list 尺寸
      const listUrl = `https://assets.ppy.sh/beatmaps/${track.id}/covers/list.jpg`;
      img.src = listUrl;
      return;
    } else if (currentSrc.includes('/list.jpg')) {
      // 尝试 cover 尺寸
      const coverUrl = `https://assets.ppy.sh/beatmaps/${track.id}/covers/cover.jpg`;
      img.src = coverUrl;
      return;
    }
  }

  // 最后使用默认封面
  if (currentSrc !== defaultCover) {
    img.src = defaultCover;
  }
};

// 事件处理
const onSearchChange = () => {
  // 搜索逻辑已在计算属性中处理
};

const onSortChange = () => {
  // 排序逻辑已在计算属性中处理
};

// 窗口大小变化处理
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

// 组件挂载
onMounted(() => {
  // 自动扫描音乐文件
  void scanMusic();

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
});

// 组件卸载
onUnmounted(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
.all-music-page {
  background: transparent; // 使用透明背景，避免黑边问题
  color: #c4c9d4; // 保持一致的文字颜色
  min-height: 100vh;
  padding: 24px;

  .page-header {
    .title-section {
      .text-h4 {
        font-weight: 700;
        // osu!lazer 风格的粉紫渐变
        background: linear-gradient(135deg, #ff69b4, #c77dff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        display: inline-flex;
        align-items: center;
        padding-bottom: 4px;

        .q-icon {
          color: #c4c9d4; // 与 PlaylistPage 一致的图标颜色
          margin-right: 12px;
          font-size: 2.5rem;
        }
      }

      // 更新分隔线样式
      .q-separator {
        background-color: rgba(196, 201, 212, 0.2); // 使用主文字颜色的透明版本
        height: 1px;
      }
    }

    .stats-cards {
      .stat-card {
        background: rgba(30, 30, 33, 0.7); // 参考PlaylistCard的更深背景色
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.12); // 与PlaylistCard一致的边框
        border-radius: 8px;
        transition: all 0.25s ease-in-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

        .q-icon {
          color: #ff69b4;
        }

        .text-h6 {
          color: #c4c9d4; // 与 PlaylistPage 一致的主文字颜色
          font-weight: 600;
        }

        .text-caption {
          color: #8b92b8; // 与 PlaylistPage 一致的次要文字颜色
        }

        &:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
          background: rgba(35, 35, 40, 0.8); // 参考PlaylistCard的悬停背景色
          border-color: rgba(255, 105, 180, 0.5);
        }
      }
    }
  }

  .actions-bar {
    padding: 16px 0;

    // 强制横向布局，不响应屏幕大小变化
    .row {
      flex-wrap: nowrap !important;

      .col-auto {
        .row {
          flex-wrap: nowrap !important;
        }
      }
    }

    // 为按钮容器应用强制横向布局样式
    .col-auto .row {
      flex-wrap: nowrap !important;
    }

    // 应用与search-section相同的横向布局样式
    .row:not(.stats-cards .row) {
      flex-wrap: nowrap !important;
    }

    h2 {
      color: #c4c9d4; // 与 PlaylistPage 一致的标题颜色
      font-weight: 600;
      margin-bottom: 0;
    }

    // 新增：Lazer 风格药丸按钮通用样式
    .lazer-action-btn {
      border-radius: 9999px !important; // 使用非常大的值强制药丸形状，并用 !important 提高优先级
      text-transform: none;
      font-weight: 600;
      padding: 8px 22px; // 稍微调整 padding 以适应药丸形状
      color: white !important;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      border: none;
      min-height: 40px; // 确保按钮有一定高度

      .q-icon {
        margin-right: 8px; // 稍微增大图标和文字间距
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
        filter: brightness(1.1);
      }

      &:active {
        transform: translateY(0px);
        filter: brightness(0.9);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      &.q-btn--loading {
        .q-spinner {
          color: white;
        }
      }

      &.q-btn--disable {
        opacity: 0.5;
        filter: grayscale(50%) brightness(0.7);
        box-shadow: none;
        cursor: not-allowed;

        &:hover {
          transform: none;
          box-shadow: none;
          filter: grayscale(50%) brightness(0.7);
        }
      }
    }

    // 新增：特定背景颜色类
    .lazer-bg-pink {
      background: #ff69b4;

      &:hover {
        background: #ff69b4;
      }

      &.q-btn--disable {
        background: #ff69b4 !important;
      }
    }

    .lazer-bg-purple {
      background: #aa79f5;

      &:hover {
        background: #aa79f5;
      }

      &.q-btn--disable {
        background: #aa79f5 !important;
      }
    }

    // 原有的 .q-btn 样式，现在主要作为其他按钮的默认或被覆盖
    .q-btn {
      // &.q-btn--outline 相关的样式可以保留，以备其他地方使用
      &.q-btn--outline {
        border-color: rgba(255, 105, 180, 0.7);
        color: rgba(255, 105, 180, 0.9);
        transition: all 0.2s ease-in-out;
        // 确保这里的 border-radius 不会覆盖 .lazer-action-btn 的设置
        // 如果需要，可以为这类按钮设置不同的 border-radius 或不设置
        border-radius: 6px;

        &:hover {
          background: rgba(255, 105, 180, 0.1);
          color: #ff69b4;
          border-color: #ff69b4;
        }
      }

      &.q-btn--unelevated {
        color: white;
        transition: all 0.2s ease-in-out;
        // 确保这里的 border-radius 不会覆盖 .lazer-action-btn 的设置
        border-radius: 6px;
      }
    }
  }

  .search-section {
    padding-bottom: 20px;

    // 强制横向布局，不响应屏幕大小变化
    .row {
      flex-wrap: nowrap !important;
    }

    .q-input,
    .q-select {
      :deep(.q-field__control) {
        background: rgba(30, 30, 33, 0.7); // 参考PlaylistCard的更深背景色
        backdrop-filter: blur(15px);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #f0f0f0;
        transition: all 0.2s ease-in-out;

        &:hover {
          border-color: rgba(255, 105, 180, 0.5);
          background: rgba(35, 35, 40, 0.8); // 悬停时稍微亮一点的深色
        }
      }

      :deep(.q-field__native),
      :deep(.q-field__label),
      :deep(.q-select__display-value) {
        color: #c4c9d4; // 与 PlaylistPage 一致的文字颜色
      }

      :deep(.q-field__prepend .q-icon) {
        color: #8b92b8; // 与 PlaylistPage 一致的图标颜色
      }
    }

    .q-btn-toggle {
      border-radius: 6px;
      border: 1px solid rgba(255, 105, 180, 0.7);

      :deep(.q-btn) {
        background: transparent;
        color: rgba(255, 105, 180, 0.9);
        transition: background 0.2s ease-in-out;

        &.q-btn--active {
          background: rgba(255, 105, 180, 0.2);
          color: #ff69b4;
        }

        &:hover:not(.q-btn--active) {
          background: rgba(255, 105, 180, 0.1);
        }
      }
    }
  }

  .loading-section,
  .error-section,
  .empty-state {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #8b92b8; // 与 PlaylistPage 一致的次要文字颜色

    .q-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    h5 {
      color: #c4c9d4; // 与 PlaylistPage 一致的主文字颜色
      font-weight: 600;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    p {
      font-size: 0.95rem;
      max-width: 400px;
      line-height: 1.6;
    }

    .q-btn {
      margin-top: 20px;
      border-radius: 6px;
      text-transform: none;
      font-weight: 500;
      padding: 8px 20px;
      border-color: rgba(255, 105, 180, 0.7);
      color: rgba(255, 105, 180, 0.9);
      transition: all 0.2s ease-in-out;

      &:hover {
        background: rgba(255, 105, 180, 0.1);
        color: #ff69b4;
        border-color: #ff69b4;
      }
    }
  }

  .error-section {
    .q-icon {
      color: #ff69b4; // 错误状态使用 lazer 粉色
    }

    h5 {
      color: #ff69b4;
    }
  }

  .music-grid {
    .row {
      margin: 0 -10px; // 调整卡片间距
    }

    // MusicCard 样式将在其组件内部或通过 props 控制，此处确保容器适配
  }

  .music-list {
    max-height: calc(100vh - 420px); // 根据其他元素高度调整，确保滚动区域合理
    overflow-y: auto;
    padding-right: 6px; // 为滚动条留出空间

    &.show-scrollbar::-webkit-scrollbar {
      width: 8px;
    }

    &.show-scrollbar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    &.show-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #ff69b4, #c77dff);
      border-radius: 4px;

      &:hover {
        background: linear-gradient(135deg, #c77dff, #ff69b4);
      }
    }

    .music-list-container {
      background: transparent; // 列表容器背景透明
      border: none; // 移除 Quasar 默认的深色列表分隔线，如果存在
    }

    .music-list-item {
      background: rgba(30, 30, 33, 0.7); // 参考PlaylistCard的更深背景色
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.12); // 与PlaylistCard一致的边框
      border-radius: 6px;
      margin-bottom: 8px;
      padding: 10px 16px;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

      &:hover {
        background: rgba(35, 35, 40, 0.8); // 参考PlaylistCard的悬停背景色
        border-color: rgba(255, 105, 180, 0.4);
        transform: translateY(-1px) scale(1.01);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
      }

      .q-item__section--avatar .q-avatar {
        border-radius: 4px;
      }

      .q-item__label.text-white {
        color: #c4c9d4 !important; // 与 PlaylistPage 一致的标题颜色
        font-weight: 500;
      }

      .q-item__label--caption {
        color: #8b92b8 !important; // 与 PlaylistPage 一致的副标题颜色
      }

      .q-btn {
        color: #8b92b8; // 与 PlaylistPage 一致的按钮默认颜色

        &:hover {
          color: #ff69b4;
        }
      }

      .text-caption.text-grey-6 {
        color: #8b92b8 !important; // 与 PlaylistPage 一致的时长文本颜色
      }

      .q-item__section--side {
        .delete-btn {
          opacity: 0.7;
          transition: all 0.2s ease;

          &:hover {
            opacity: 1;
            color: #ff69b4 !important;
            transform: scale(1.1);
          }
        }
      }
    }
  }

  // 歌曲信息对话框样式
  :deep(.q-dialog) {
    .q-card {
      background-color: #2a2a2e; // 更深的灰色背景，与其他组件一致
      border: 1px solid rgba(196, 201, 212, 0.15); // 使用主文字颜色的透明边框
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      color: #c4c9d4; // 与 PlaylistPage 一致的文字颜色

      .q-card__section--title,
      .text-h6 {
        color: #c4c9d4; // 与 PlaylistPage 一致的标题颜色
        font-weight: 600;
        border-bottom: 1px solid rgba(196, 201, 212, 0.2); // 使用主文字颜色的透明分隔线
        padding-bottom: 12px;
      }

      .q-card__section {
        .text-subtitle1 {
          color: #c4c9d4; // 与 PlaylistPage 一致的主文字颜色
          font-weight: 500;
        }

        .text-body2 {
          color: #8b92b8; // 与 PlaylistPage 一致的次要文字颜色
        }

        .text-caption {
          color: #8b92b8; // 与 PlaylistPage 一致的说明文字颜色
        }

        .q-img {
          border-radius: 6px;
        }
      }

      .q-card__actions {
        border-top: 1px solid rgba(196, 201, 212, 0.2); // 使用主文字颜色的透明分隔线
        padding-top: 12px;
        background-color: rgba(0, 0, 0, 0.1);

        .q-btn--flat {
          color: #8b92b8; // 与 PlaylistPage 一致的按钮颜色

          &:hover {
            color: #c4c9d4;
            background-color: rgba(196, 201, 212, 0.1);
          }
        }

        .q-btn[color='primary'] {
          background: linear-gradient(135deg, #ff69b4, #c77dff);
          color: white;
          border-radius: 6px;
          font-weight: 500;

          &:hover {
            background: linear-gradient(135deg, #e65aa1, #b264e6);
          }
        }
      }
    }
  }

  // 新增：Lazer 风格药丸按钮通用样式
  .lazer-action-btn {
    border-radius: 9999px !important; // 使用非常大的值强制药丸形状，并用 !important 提高优先级
    text-transform: none;
    font-weight: 600;
    padding: 8px 22px; // 稍微调整 padding 以适应药丸形状
    color: white !important;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    border: none;
    min-height: 40px; // 确保按钮有一定高度

    .q-icon {
      margin-right: 8px; // 稍微增大图标和文字间距
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
      filter: brightness(1.1);
    }

    &:active {
      transform: translateY(0px);
      filter: brightness(0.9);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    &.q-btn--loading {
      .q-spinner {
        color: white;
      }
    }

    &.q-btn--disable {
      opacity: 0.5;
      filter: grayscale(50%) brightness(0.7);
      box-shadow: none;
      cursor: not-allowed;

      &:hover {
        transform: none;
        box-shadow: none;
        filter: grayscale(50%) brightness(0.7);
      }
    }
  }

  // 新增：特定背景颜色类
  .lazer-bg-pink {
    background: #ff69b4;

    &:hover {
      background: #ff69b4;
    }

    &.q-btn--disable {
      background: #ff69b4 !important;
    }
  }

  .lazer-bg-purple {
    background: #aa79f5;

    &:hover {
      background: #aa79f5;
    }

    &.q-btn--disable {
      background: #aa79f5 !important;
    }
  }

  // 原有的 .q-btn 样式，现在主要作为其他按钮的默认或被覆盖
  .q-btn {
    // &.q-btn--outline 相关的样式可以保留，以备其他地方使用
    &.q-btn--outline {
      border-color: rgba(255, 105, 180, 0.7);
      color: rgba(255, 105, 180, 0.9);
      transition: all 0.2s ease-in-out;
      // 确保这里的 border-radius 不会覆盖 .lazer-action-btn 的设置
      // 如果需要，可以为这类按钮设置不同的 border-radius 或不设置
      border-radius: 6px;

      &:hover {
        background: rgba(255, 105, 180, 0.1);
        color: #ff69b4;
        border-color: #ff69b4;
      }
    }

    // &.q-btn--unelevated 的特定样式如果不再需要，可以完全移除
    // 或者只保留不与 .lazer-action-btn 冲突的部分
    &.q-btn--unelevated {
      color: white;
      transition: all 0.2s ease-in-out;
      // 确保这里的 border-radius 不会覆盖 .lazer-action-btn 的设置
      border-radius: 6px;
    }
  }
}

// 菜单样式（用于列表视图的次级菜单）
:deep(.q-menu) {
  .q-list {
    background: #0d0d0d !important; // 更深的黑色背景
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    border-radius: 12px;
    padding: 8px 0;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
    min-width: 220px;
  }

  .q-item {
    color: #ffffff !important; // 纯白色文字
    border-radius: 8px;
    margin: 4px 10px;
    padding: 14px 18px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    font-size: 14px;

    &:hover {
      background: rgba(255, 105, 180, 0.15) !important;
      color: #ff69b4 !important;
      transform: translateX(6px);
      box-shadow: 0 4px 12px rgba(255, 105, 180, 0.2);
    }

    .q-icon {
      color: inherit !important;
      margin-right: 14px;
      font-size: 18px;
    }

    // 删除按钮特殊样式
    &.text-negative {
      color: #ff6b6b !important;

      &:hover {
        background: rgba(255, 107, 107, 0.15) !important;
        color: #ff5252 !important;
        box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
      }

      .q-icon {
        color: #ff6b6b !important;
      }
    }
  }

  .q-separator {
    background: rgba(255, 255, 255, 0.1) !important;
    margin: 10px 16px;
    height: 1px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .all-music-page {
    padding: 16px; // 减少移动端的内边距

    .page-header {
      .title-section {
        .text-h4 {
          font-size: 1.8rem;
        }
      }

      .stats-cards {
        .row {
          margin: 0 -8px; // 减少卡片间距
        }

        .stat-card {
          margin-bottom: 12px; // 增加垂直间距
        }
      }
    }

    .actions-bar {
      .row {
        flex-direction: column;
        gap: 16px;
        text-align: center;

        .col-auto {
          width: 100%;
        }
      }
    }

    // 列表视图优化
    .music-list {
      max-height: calc(100vh - 320px); // 为移动端调整高度

      .music-list-item {
        padding: 12px 16px; // 增加触摸区域
        margin-bottom: 10px;

        .q-item__section--side {
          .row {
            gap: 8px; // 增加按钮间距

            .q-btn {
              min-width: 36px; // 确保按钮触摸区域足够大
              min-height: 36px;
            }
          }
        }
      }
    }
  }
}
</style>
