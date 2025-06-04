<template>
  <q-page class="player-page">
    <div class="player-container">
      <!-- 当前播放的音乐信息 -->
      <div class="now-playing-section">
        <div class="track-info">
          <div class="album-art">
            <q-img v-if="currentTrack?.coverUrl" :src="currentTrack.coverUrl" class="album-image" fit="cover" />
            <div v-else class="album-placeholder">
              <q-icon name="music_note" size="4rem" color="grey-5" />
            </div>
          </div>

          <div class="track-details">
            <h4 class="track-title">
              {{ currentTrack?.title || 'No track selected' }}
            </h4>
            <p class="track-artist">
              {{ currentTrack?.artist || 'Select a track to start playing' }}
            </p>
            <p class="track-album text-grey-6">
              {{ currentTrack?.album || '' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="player-controls">
        <div class="progress-section">
          <span class="time-current">{{ formatTime(currentTime) }}</span>
          <q-slider v-model="currentTime" :max="duration" color="primary" track-color="grey-7" class="progress-slider"
            @change="onSeek" />
          <span class="time-total">{{ formatTime(duration) }}</span>
        </div>

        <div class="control-buttons">
          <q-btn round flat icon="skip_previous" size="lg" @click="previousTrack" :disable="!hasPrevious" />

          <q-btn round unelevated :icon="isPlaying ? 'pause' : 'play_arrow'" color="primary" size="xl"
            @click="togglePlayPause" class="play-pause-btn" />

          <q-btn round flat icon="skip_next" size="lg" @click="nextTrack" :disable="!hasNext" />
        </div>

        <div class="additional-controls">
          <q-btn round flat :icon="shuffleMode ? 'shuffle' : 'shuffle'" :color="shuffleMode ? 'primary' : 'grey-6'"
            @click="toggleShuffle" />

          <q-btn round flat icon="volume_up" @click="showVolumeControl = !showVolumeControl" />

          <q-btn round flat :icon="getRepeatIcon()" :color="repeatMode !== 'off' ? 'primary' : 'grey-6'"
            @click="toggleRepeat" />
        </div>

        <!-- 音量控制 -->
        <div v-if="showVolumeControl" class="volume-control">
          <q-slider v-model="volume" :min="0" :max="100" color="primary" track-color="grey-7" @change="onVolumeChange"
            class="volume-slider" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMusicStore } from 'src/stores/musicStore';

const musicStore = useMusicStore();

// 播放状态
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(80);
const showVolumeControl = ref(false);

// 计算属性
const currentTrack = computed(() => musicStore.currentTrack);
const isPlaying = computed(() => musicStore.isPlaying);
const shuffleMode = computed(() => musicStore.shuffleMode);
const repeatMode = computed(() => musicStore.repeatMode);
const hasPrevious = computed(() => musicStore.currentPlaylist && musicStore.currentPlaylist.tracks.length > 1);
const hasNext = computed(() => musicStore.currentPlaylist && musicStore.currentPlaylist.tracks.length > 1);

// 方法
const togglePlayPause = () => {
  if (isPlaying.value) {
    musicStore.pause();
  } else {
    musicStore.play();
  }
};

const previousTrack = () => {
  musicStore.previousTrack();
};

const nextTrack = () => {
  musicStore.nextTrack();
};

const toggleShuffle = () => {
  musicStore.toggleShuffle();
};

const toggleRepeat = () => {
  musicStore.toggleRepeat();
};

const onSeek = (value: number) => {
  musicStore.seekTo(value);
};

const onVolumeChange = (value: number) => {
  musicStore.setVolume(value / 100);
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getRepeatIcon = (): string => {
  switch (repeatMode.value) {
    case 'one':
      return 'repeat_one';
    case 'all':
      return 'repeat';
    default:
      return 'repeat';
  }
};
</script>

<style lang="scss" scoped>
.player-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.player-container {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
}

.now-playing-section {
  text-align: center;
  margin-bottom: 3rem;

  .track-info {
    .album-art {
      margin-bottom: 2rem;

      .album-image {
        width: 300px;
        height: 300px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        margin: 0 auto;
      }

      .album-placeholder {
        width: 300px;
        height: 300px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
      }
    }

    .track-details {
      .track-title {
        font-size: 2rem;
        font-weight: 600;
        color: white;
        margin: 0 0 0.5rem 0;
        line-height: 1.2;
      }

      .track-artist {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 0.25rem 0;
      }

      .track-album {
        font-size: 1rem;
        margin: 0;
      }
    }
  }
}

.player-controls {
  .progress-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;

    .time-current,
    .time-total {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      min-width: 40px;
      text-align: center;
    }

    .progress-slider {
      flex: 1;
    }
  }

  .control-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;

    .play-pause-btn {
      width: 64px;
      height: 64px;
    }
  }

  .additional-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .volume-control {
    margin-top: 1rem;

    .volume-slider {
      max-width: 200px;
      margin: 0 auto;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .player-container {
    padding: 1rem;
  }

  .now-playing-section {
    .track-info {
      .album-art {

        .album-image,
        .album-placeholder {
          width: 250px;
          height: 250px;
        }
      }

      .track-details {
        .track-title {
          font-size: 1.5rem;
        }

        .track-artist {
          font-size: 1rem;
        }
      }
    }
  }

  .player-controls {
    .control-buttons {
      gap: 1rem;

      .play-pause-btn {
        width: 56px;
        height: 56px;
      }
    }
  }
}
</style>
