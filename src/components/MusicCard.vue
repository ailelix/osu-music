<template>
  <q-card class="music-card" bordered flat @click="$emit('click', track)">
    <div class="card-content">
      <!-- 封面图片 -->
      <div class="cover-section">
        <div class="cover-image-container">
          <img :src="track.coverUrl || '/icons/favicon-96x96.png'" :alt="track.title" class="cover-image"
            @error="onImageError" />
          <div class="play-overlay">
            <q-btn round color="primary" icon="play_arrow" size="md" @click.stop="$emit('play', track)"
              class="play-button" />
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
          <p class="track-album text-caption text-grey-7">
            {{ track.album || 'Unknown Album' }}
          </p>
        </div>

        <!-- 底部信息 -->
        <div class="track-meta row items-center justify-between q-mt-sm">
          <div class="duration text-caption text-grey-6">
            {{ formatDuration(track.duration) }}
          </div>
          <div class="actions">
            <q-btn flat round size="sm" icon="more_vert" color="grey-6" @click.stop="$emit('menu', track)">
              <q-menu>
                <q-list dense style="min-width: 150px">
                  <q-item clickable @click="$emit('play', track)">
                    <q-item-section avatar>
                      <q-icon name="play_arrow" />
                    </q-item-section>
                    <q-item-section>Play</q-item-section>
                  </q-item>
                  <q-item clickable @click="$emit('addToPlaylist', track)">
                    <q-item-section avatar>
                      <q-icon name="playlist_add" />
                    </q-item-section>
                    <q-item-section>Add to Playlist</q-item-section>
                  </q-item>
                  <q-item clickable @click="$emit('showInfo', track)">
                    <q-item-section avatar>
                      <q-icon name="info" />
                    </q-item-section>
                    <q-item-section>Info</q-item-section>
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
import { type MusicTrack } from 'src/stores/musicStore';

// Props
defineProps<{
  track: MusicTrack;
}>();

// Events
defineEmits<{
  click: [track: MusicTrack];
  play: [track: MusicTrack];
  menu: [track: MusicTrack];
  addToPlaylist: [track: MusicTrack];
  showInfo: [track: MusicTrack];
}>();

// 处理图片加载错误
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = '/icons/favicon-96x96.png';
};

// 格式化时长
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
</script>

<style lang="scss" scoped>
.music-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 280px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.08);

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

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
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
        color: white;
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

      .track-artist,
      .track-album {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-bottom: 2px;
      }
    }

    .track-meta {
      margin-top: 8px;

      .duration {
        font-family: 'JetBrains Mono', monospace;
      }
    }
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
