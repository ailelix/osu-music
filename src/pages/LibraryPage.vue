<template>
  <q-page class="library-page">
    <!-- 胶囊切换栏 -->
    <div class="capsule-switch-bar q-mb-xl flex flex-center">
      <div class="capsule-switch">
        <q-btn-toggle v-model="activeTab" toggle-color="primary" color="dark" text-color="primary" unelevated rounded
          spread class="capsule-toggle" :options="[
            { label: 'Playlists', value: 'playlists' },
            { label: 'All Music', value: 'allmusic' }
          ]" />
        <!-- Removed @update:model-value="onTabChange" for now -->
      </div>
    </div>

    <!-- 内容区域，移除过渡效果 -->
    <div class="library-content-container">
      <!-- Playlists 内容 -->
      <div v-if="activeTab === 'playlists'" class="playlist-content-area page-content">
        <!-- 页面标题和统计卡片 -->
        <section class="page-header q-mb-xl">
          <div class="title-section">
            <h4 class="q-mt-none q-mb-md text-h4 text-white">
              <q-icon name="library_music" class="q-mr-sm" />
              🎵 My Playlists
            </h4>
            <q-separator dark spaced class="q-mb-lg" />
          </div>
          <div class="stats-cards row q-col-gutter-md q-mt-lg">
            <div class="col-12 col-sm-6 col-md-3">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="queue_music" size="2rem" color="primary" />
                  <div class="text-h6 q-mt-sm">{{ playlistStore.playlists.length }}</div>
                  <div class="text-caption text-grey-6">Playlists</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="music_note" size="2rem" color="secondary" />
                  <div class="text-h6 q-mt-sm">{{ playlistStore.totalTracks }}</div>
                  <div class="text-caption text-grey-6">Tracks</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="schedule" size="2rem" color="positive" />
                  <div class="text-h6 q-mt-sm">{{ playlistStore.totalDurationMinutes }}</div>
                  <div class="text-caption text-grey-6">Minutes</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-card flat bordered class="stat-card">
                <q-card-section class="text-center">
                  <q-icon name="star" size="2rem" color="warning" />
                  <div class="text-h6 q-mt-sm">1</div>
                  <div class="text-caption text-grey-6">Favorites</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </section>
        <q-separator spaced="xl" />
        <!-- 播放列表页面 -->
        <section class="content-area">
          <div class="playlists-content">
            <!-- 操作栏 -->
            <div class="actions-bar q-mb-lg">
              <div class="row items-center justify-between">
                <div class="col-auto">
                  <h2 class="text-h5 text-weight-medium q-mb-none">
                    My Playlists
                  </h2>
                </div>
                <div class="col-auto">
                  <q-btn color="primary" icon="add" label="Create Playlist" unelevated rounded
                    @click="showCreatePlaylistDialog = true" />
                </div>
              </div>
            </div>
            <!-- 加载/错误/空/歌单网格 -->
            <div v-if="playlistStore.isLoading" class="loading-section text-center q-py-xl">
              <q-spinner color="primary" size="3rem" />
              <p class="text-subtitle2 text-grey-6 q-mt-md">Loading playlists...</p>
            </div>
            <div v-else-if="playlistStore.error" class="error-section text-center q-py-xl">
              <q-icon name="error_outline" size="4rem" color="negative" />
              <h5 class="text-negative q-mt-md">Loading Failed</h5>
              <p class="text-grey-6">{{ playlistStore.error }}</p>
              <q-btn color="primary" label="Retry" icon="refresh" outline @click="loadPlaylists" class="q-mt-md" />
            </div>
            <div v-else class="playlists-grid">
              <div v-if="playlistStore.allPlaylistsSorted.length > 0" class="all-playlists">
                <div class="row q-col-gutter-lg">
                  <div v-for="playlist in playlistStore.allPlaylistsSorted" :key="playlist.id"
                    class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <PlaylistCard :playlist="playlist" @click="openPlaylistDetails(playlist)"
                      @play="playPlaylist(playlist)" @view="openPlaylistDetails(playlist)"
                      @delete="confirmDeletePlaylist(playlist)" />
                  </div>
                </div>
              </div>
              <div v-else class="empty-state text-center q-py-xl">
                <q-icon name="queue_music" size="5rem" color="grey-5" />
                <h5 class="text-grey-5 q-mt-md">No playlists yet</h5>
                <p class="text-grey-6">Create your first playlist to start collecting music!</p>
                <q-btn color="primary" label="Create Playlist" icon="add" unelevated rounded
                  @click="showCreatePlaylistDialog = true" class="q-mt-md" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- All Music 内容 -->
      <div v-else-if="activeTab === 'allmusic'" class="allmusic-content-area page-content">
        <AllMusicPage />
      </div>
    </div>

    <!-- 创建歌单对话框 -->
    <q-dialog v-model="showCreatePlaylistDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create New Playlist</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input v-model="newPlaylistName" label="Playlist Name" outlined autofocus
            :rules="[val => !!val || 'Please enter playlist name']" />
          <q-input v-model="newPlaylistDescription" label="Description (Optional)" type="textarea" outlined rows="3"
            class="q-mt-md" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeCreatePlaylistDialog" />
          <q-btn color="primary" label="Create" :disable="!newPlaylistName.trim()" @click="createNewPlaylist" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 删除确认对话框 -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Are you sure you want to delete playlist "{{ playlistToDelete?.name }}"?
          <br />
          <span class="text-negative">This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showDeleteDialog = false" />
          <q-btn color="negative" label="Delete" @click="deletePlaylist" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'; // Removed unused 'watch'
import { useQuasar } from 'quasar';
import { usePlaylistStore, type Playlist } from 'src/stores/playlistStore';
import PlaylistCard from 'src/components/PlaylistCard.vue';
import AllMusicPage from 'src/pages/AllMusicPage.vue';

const $q = useQuasar();
const playlistStore = usePlaylistStore();

const activeTab = ref('playlists');
// const transitionName = ref('slide-left'); // Commented out for troubleshooting
// const previousTab = ref('playlists'); // Commented out for troubleshooting

const showCreatePlaylistDialog = ref(false);
const showDeleteDialog = ref(false);
const newPlaylistName = ref('');
const newPlaylistDescription = ref('');
const playlistToDelete = ref<Playlist | null>(null);

const loadPlaylists = async () => {
  try {
    await playlistStore.loadPlaylists();
  } catch (error) {
    console.error('Failed to load playlists:', error);
  }
};

const openPlaylistDetails = (playlist: Playlist) => {
  console.log('Opening playlist details:', playlist.name);
  $q.notify({
    message: `Open playlist: ${playlist.name}`,
    icon: 'open_in_new',
    color: 'info',
  });
  // TODO: 导航到歌单详情页面
  // router.push({ name: 'playlistDetails', params: { id: playlist.id } });
};

const playPlaylist = (playlist: Playlist) => {
  console.log('Playing playlist:', playlist.name);
  playlistStore.setCurrentPlaylist(playlist);
  $q.notify({
    message: `Now playing: ${playlist.name}`,
    icon: 'play_arrow',
    color: 'positive',
  });
  // TODO: 实现播放逻辑
};

const confirmDeletePlaylist = (playlist: Playlist) => {
  if (playlist.isDefault) {
    $q.notify({
      message: 'Default playlist cannot be deleted',
      icon: 'warning',
      color: 'warning',
    });
    return;
  }
  playlistToDelete.value = playlist;
  showDeleteDialog.value = true;
};

const deletePlaylist = async () => {
  if (!playlistToDelete.value) return;
  try {
    await playlistStore.deletePlaylist(playlistToDelete.value.id);
    $q.notify({
      message: `Deleted playlist: ${playlistToDelete.value.name}`,
      icon: 'delete',
      color: 'negative',
    });
  } catch (error) {
    console.error('Failed to delete playlist:', error);
    $q.notify({
      message: 'Delete failed',
      icon: 'error',
      color: 'negative',
    });
  } finally {
    showDeleteDialog.value = false;
    playlistToDelete.value = null;
  }
};

const createNewPlaylist = async () => {
  if (!newPlaylistName.value.trim()) return;
  try {
    const newPlaylist = await playlistStore.createPlaylist(
      newPlaylistName.value.trim(),
      newPlaylistDescription.value.trim(),
      []
    );
    $q.notify({
      message: `Playlist created: ${newPlaylist.name}`,
      icon: 'playlist_add',
      color: 'positive',
    });
    closeCreatePlaylistDialog();
  } catch (error) {
    console.error('Failed to create playlist:', error);
    $q.notify({
      message: 'Failed to create playlist',
      icon: 'error',
      color: 'negative',
    });
  }
};

const closeCreatePlaylistDialog = () => {
  showCreatePlaylistDialog.value = false;
  newPlaylistName.value = '';
  newPlaylistDescription.value = '';
};

// const onTabChange = (newTab: string) => {
//   if (newTab === 'allmusic' && previousTab.value === 'playlists') {
//     transitionName.value = 'slide-left';
//   } else if (newTab === 'playlists' && previousTab.value === 'allmusic') {
//     transitionName.value = 'slide-right';
//   } else {
//     transitionName.value = ''; // No transition if same tab or unexpected change
//   }
//   previousTab.value = newTab;
// };

// watch(activeTab, (newVal, oldVal) => {
//   if (oldVal !== undefined) {
//     previousTab.value = oldVal;
//   }
// }, { immediate: true });

onMounted(() => {
  void loadPlaylists();
});
</script>

<style lang="scss" scoped>
.library-page {
  .capsule-switch-bar {
    margin-top: 24px;
    margin-bottom: 32px;
  }

  .capsule-switch {
    background: #18181c;
    border-radius: 999px;
    padding: 4px;
    display: inline-block;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .capsule-toggle {
    border-radius: 999px;
    overflow: hidden;

    .q-btn {
      border-radius: 999px !important;
      min-width: 120px;
      font-weight: 600;
      font-size: 1.1rem;
      transition: background 0.2s, color 0.2s;
    }
  }

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

  .navigation-tabs {
    .library-tabs {
      :deep(.q-tab) {
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
      }

      :deep(.q-tab--active) {
        color: white;
      }

      :deep(.q-tabs__content) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
    }
  }

  .content-area {

    .playlists-content,
    .allmusic-content {
      min-height: 400px;
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

  .default-playlist,
  .custom-playlists,
  .all-playlists {
    h3 {
      color: white;
      display: flex;
      align-items: center;
      border-bottom: 2px solid $primary;
      padding-bottom: calc(8px);
      margin-bottom: calc(24px);
    }
  }

  .playlist-content-area {
    padding: 24px;
  }

  .library-content-container {
    position: relative; // Needed for absolute positioning of transitioning elements
    overflow-x: hidden; // Prevent scrollbars during transition
    min-height: 400px; // Example: ensure container has height
  }

  .page-content {
    // These styles will be applied by the global CSS for transitions
    // but we ensure they are block-level and take full width if needed.
    width: 100%;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .library-page {
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
  }
}
</style>
