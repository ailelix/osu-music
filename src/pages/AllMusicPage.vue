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
          <h2 class="text-h5 text-weight-medium q-mb-none text-white">
            Music Library
          </h2>
        </div>
        <div class="col-auto">
          <div class="row q-gutter-md">
            <q-btn color="primary" icon="refresh" label="Scan Music" outline @click="scanMusic"
              :loading="musicStore.isLoading" />
            <q-btn color="secondary" icon="shuffle" label="Shuffle All" unelevated @click="shuffleAll"
              :disable="musicStore.totalTracks === 0" />
          </div>
        </div>
      </div>
    </section>

    <!-- 搜索和过滤 -->
    <section class="search-section q-mb-lg">
      <div class="row q-gutter-md items-end">
        <div class="col">
          <q-input v-model="searchQuery" label="Search music..." outlined dark clearable
            @update:model-value="onSearchChange">
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-auto">
          <q-select v-model="sortBy" :options="sortOptions" option-value="value" option-label="label" outlined dark
            label="Sort by" style="min-width: 150px" @update:model-value="onSortChange" />
        </div>
        <div class="col-auto">
          <q-btn-toggle v-model="viewMode" :options="viewModeOptions" color="primary" outline
            @update:model-value="onViewModeChange" />
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
      <q-btn color="primary" label="Retry" icon="refresh" outline @click="scanMusic" class="q-mt-md" />
    </div>

    <!-- 音乐网格/列表 -->
    <section v-else class="music-content">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="music-grid">
        <div v-if="filteredTracks.length > 0" class="row q-col-gutter-lg">
          <div v-for="track in filteredTracks" :key="track.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <MusicCard :track="track" @click="playTrack(track)" @play="playTrack(track)"
              @add-to-playlist="addToPlaylist(track)" @show-info="showTrackInfo(track)" />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state text-center q-py-xl">
          <q-icon name="music_off" size="5rem" color="grey-5" />
          <h5 class="text-grey-5 q-mt-md">
            {{ searchQuery ? 'No matching tracks' : 'No music found' }}
          </h5>
          <p class="text-grey-6">
            {{ searchQuery ? 'Try a different search term' : 'Scan your music folder to import tracks' }}
          </p>
          <q-btn v-if="!searchQuery" color="primary" label="Scan Music" icon="refresh" outline @click="scanMusic"
            class="q-mt-md" />
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="music-list">
        <q-list v-if="filteredTracks.length > 0" dark separator>
          <q-item v-for="track in filteredTracks" :key="track.id" clickable @click="playTrack(track)"
            class="music-list-item">
            <q-item-section avatar>
              <q-avatar size="50px" rounded>
                <img :src="track.coverUrl || '/icons/favicon-96x96.png'" :alt="track.title" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-white text-weight-medium">{{ track.title }}</q-item-label>
              <q-item-label caption class="text-grey-6">{{ track.artist || 'Unknown Artist'
              }}</q-item-label>
              <q-item-label caption class="text-grey-7">{{ track.album || 'Unknown Album'
              }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center q-gutter-sm">
                <span class="text-caption text-grey-6">{{ formatDuration(track.duration) }}</span>
                <q-btn flat round size="sm" icon="play_arrow" color="primary" @click.stop="playTrack(track)" />
                <q-btn flat round size="sm" icon="more_vert" color="grey-6" @click.stop>
                  <q-menu>
                    <q-list dense style="min-width: 150px">
                      <q-item clickable @click="playTrack(track)">
                        <q-item-section avatar><q-icon name="play_arrow" /></q-item-section>
                        <q-item-section>Play</q-item-section>
                      </q-item>
                      <q-item clickable @click="addToPlaylist(track)">
                        <q-item-section avatar><q-icon name="playlist_add" /></q-item-section>
                        <q-item-section>Add to Playlist</q-item-section>
                      </q-item>
                      <q-item clickable @click="showTrackInfo(track)">
                        <q-item-section avatar><q-icon name="info" /></q-item-section>
                        <q-item-section>Info</q-item-section>
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
            {{ searchQuery ? 'Try a different search term' : 'Scan your music folder to import tracks' }}
          </p>
          <q-btn v-if="!searchQuery" color="primary" label="Scan Music" icon="refresh" outline @click="scanMusic"
            class="q-mt-md" />
        </div>
      </div>
    </section>

    <!-- 歌曲信息对话框 -->
    <q-dialog v-model="showInfoDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Track Information</div>
        </q-card-section>

        <q-card-section v-if="selectedTrack" class="q-pt-none">
          <div class="row">
            <div class="col-4">
              <q-img :src="selectedTrack.coverUrl || '/icons/favicon-96x96.png'" :alt="selectedTrack.title"
                style="width: 100px; height: 100px" class="rounded-borders" />
            </div>
            <div class="col-8 q-pl-md">
              <div class="text-subtitle1 text-weight-medium">{{ selectedTrack.title }}</div>
              <div class="text-body2 text-grey-6">{{ selectedTrack.artist || 'Unknown Artist' }}</div>
              <div class="text-body2 text-grey-7">{{ selectedTrack.album || 'Unknown Album' }}</div>
              <div class="text-caption text-grey-6 q-mt-sm">
                Duration: {{ formatDuration(selectedTrack.duration) }}
              </div>
              <div class="text-caption text-grey-6">
                File: {{ selectedTrack.fileName }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" @click="showInfoDialog = false" />
          <q-btn color="primary" label="Play" @click="playSelectedTrack" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useMusicStore, type MusicTrack } from 'src/stores/musicStore';
import MusicCard from 'src/components/MusicCard.vue';

const $q = useQuasar();
const musicStore = useMusicStore();

// 响应式数据
const searchQuery = ref('');
const sortBy = ref('title');
const viewMode = ref('grid');
const showInfoDialog = ref(false);
const selectedTrack = ref<MusicTrack | null>(null);

// 计算属性
const favoriteCount = computed(() => {
  // TODO: 实现收藏功能后返回实际数量
  return Math.floor(musicStore.totalTracks * 0.3);
});

const filteredTracks = computed(() => {
  let tracks = searchQuery.value
    ? musicStore.searchTracks(searchQuery.value)
    : musicStore.tracks;

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
      tracks = [...tracks].sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
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
  { label: 'Recently Added', value: 'recent' }
];

const viewModeOptions = [
  { label: 'Grid', value: 'grid', icon: 'grid_view' },
  { label: 'List', value: 'list', icon: 'view_list' }
];

// 方法
const scanMusic = () => {
  musicStore.scanMusicFiles();

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
};

const playTrack = (track: MusicTrack) => {
  musicStore.playTrack(track);

  $q.notify({
    message: `Now playing: ${track.title}`,
    icon: 'play_arrow',
    color: 'positive',
  });
};

const shuffleAll = () => {
  if (musicStore.totalTracks === 0) return;

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

const addToPlaylist = (track: MusicTrack) => {
  console.log('Add to playlist:', track.title);
  $q.notify({
    message: `${track.title} added to playlist`,
    icon: 'playlist_add',
    color: 'positive',
  });
  // TODO: 实现添加到播放列表功能
};

const showTrackInfo = (track: MusicTrack) => {
  selectedTrack.value = track;
  showInfoDialog.value = true;
};

const playSelectedTrack = () => {
  if (selectedTrack.value) {
    playTrack(selectedTrack.value);
    showInfoDialog.value = false;
  }
};

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 事件处理
const onSearchChange = () => {
  // 搜索逻辑已在计算属性中处理
};

const onSortChange = () => {
  // 排序逻辑已在计算属性中处理
};

const onViewModeChange = () => {
  // 视图模式切换
};

// 组件挂载
onMounted(() => {
  // 自动扫描音乐文件
  scanMusic();
});
</script>

<style lang="scss" scoped>
.all-music-page {
  .page-header {
    .title-section {
      .text-h4 {
        font-weight: 600;
        background: linear-gradient(135deg, #ff6b9d, #ffa500);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        display: flex;
        align-items: center;
      }
    }

    .stats-cards {
      .stat-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }
      }
    }
  }

  .actions-bar {
    h2 {
      color: white;
    }
  }

  .search-section {

    .q-input,
    .q-select {
      :deep(.q-field__control) {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 8px;
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
  }

  .music-grid {
    .row {
      margin: 0 -8px;
    }
  }

  .music-list {
    .music-list-item {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      margin-bottom: 4px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateX(4px);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .all-music-page {
    .page-header {
      .title-section {
        .text-h4 {
          font-size: 1.8rem;
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

    .search-section {
      .row {
        flex-direction: column;
        gap: 16px;

        .col-auto {
          width: 100%;
        }
      }
    }
  }
}
</style>
