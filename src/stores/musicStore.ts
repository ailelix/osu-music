import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface MusicTrack {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  duration?: number;
  artist?: string;
  album?: string;
  coverUrl?: string;
  addedDate: string;
}

// 播放模式类型
type ShuffleMode = 'off' | 'on';
type RepeatMode = 'off' | 'one' | 'all';

// 歌单类型
type Playlist = {
  id: string;
  name: string;
  tracks: MusicTrack[];
};

export const useMusicStore = defineStore('music', () => {
  // 状态
  const tracks = ref<MusicTrack[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentTrack = ref<MusicTrack | null>(null);
  const isPlaying = ref(false);

  // 新增状态
  const shuffleMode = ref<ShuffleMode>('off');
  const repeatMode = ref<RepeatMode>('off');
  const currentPlaylist = ref<Playlist | null>(null);
  const volume = ref(1); // 0~1
  const seek = ref(0); // 秒

  // 计算属性
  const totalTracks = computed(() => tracks.value.length);
  const totalDurationMinutes = computed(() => {
    const totalSeconds = tracks.value.reduce((total, track) => {
      return total + (track.duration || 0);
    }, 0);
    return Math.round(totalSeconds / 60);
  });

  // 按标题排序的曲目
  const tracksSorted = computed(() => {
    return [...tracks.value].sort((a, b) => a.title.localeCompare(b.title));
  });

  // 最近添加的曲目
  const recentTracks = computed(() => {
    return [...tracks.value]
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, 20);
  });

  // 扫描音乐文件
  const scanMusicFiles = () => {
    isLoading.value = true;
    error.value = null;

    try {
      // 模拟扫描音乐文件夹
      const musicFiles = [
        '1234567-Senbonzakura.mp3',
        '2345678-Through_the_Fire_and_Flames.mp3',
        '3456789-Blue_Zenith.mp3',
        '4567890-Necrofantasia.mp3',
        '5678901-FREEDOM_DiVE.mp3',
      ];

      const scannedTracks: MusicTrack[] = musicFiles.map((fileName) => {
        const [id, ...titleParts] = fileName.replace('.mp3', '').split('-');
        const title = titleParts.join('-').replace(/_/g, ' ');

        return {
          id: id || 'unknown',
          title,
          fileName,
          filePath: `/music/${fileName}`,
          duration: Math.floor(Math.random() * 300) + 60, // 随机时长 1-6分钟
          artist: getRandomArtist(),
          album: getRandomAlbum(),
          coverUrl: `https://assets.ppy.sh/beatmaps/${id}/covers/cover.jpg`,
          addedDate: getRandomDate(),
        };
      });

      tracks.value = scannedTracks;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to scan music files';
      console.error('Music scan error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 播放曲目
  const playTrack = (track: MusicTrack) => {
    currentTrack.value = track;
    isPlaying.value = true;
    console.log('Playing track:', track.title);
  };

  // 播放
  const play = () => {
    if (currentTrack.value) {
      isPlaying.value = true;
    } else if (tracks.value.length > 0) {
      currentTrack.value = tracks.value[0] || null;
      isPlaying.value = true;
    }
  };

  // 暂停播放
  const pauseTrack = () => {
    isPlaying.value = false;
  };

  // 暂停
  const pause = () => {
    isPlaying.value = false;
  };

  // 停止播放
  const stopTrack = () => {
    currentTrack.value = null;
    isPlaying.value = false;
  };

  // 上一曲
  const previousTrack = () => {
    if (!currentPlaylist.value || !currentTrack.value) return;
    const idx = currentPlaylist.value.tracks.findIndex((t) => t.id === currentTrack.value?.id);
    if (idx > 0) {
      const prev = currentPlaylist.value.tracks[idx - 1];
      currentTrack.value = prev ? prev : null;
      isPlaying.value = !!prev;
    }
  };

  // 下一曲
  const nextTrack = () => {
    if (!currentPlaylist.value || !currentTrack.value) return;
    const idx = currentPlaylist.value.tracks.findIndex((t) => t.id === currentTrack.value?.id);
    if (idx >= 0 && idx < currentPlaylist.value.tracks.length - 1) {
      const next = currentPlaylist.value.tracks[idx + 1];
      currentTrack.value = next ? next : null;
      isPlaying.value = !!next;
    }
  };

  // 切换随机模式
  const toggleShuffle = () => {
    shuffleMode.value = shuffleMode.value === 'off' ? 'on' : 'off';
  };

  // 切换重复模式
  const toggleRepeat = () => {
    if (repeatMode.value === 'off') repeatMode.value = 'all';
    else if (repeatMode.value === 'all') repeatMode.value = 'one';
    else repeatMode.value = 'off';
  };

  // 跳转到指定时间
  const seekTo = (value: number) => {
    seek.value = value;
  };

  // 设置音量
  const setVolume = (value: number) => {
    volume.value = Math.max(0, Math.min(1, value));
  };

  // 设置当前歌单
  const setCurrentPlaylist = (playlist: Playlist) => {
    currentPlaylist.value = playlist;
    if (playlist.tracks.length > 0) {
      currentTrack.value = playlist.tracks[0] || null;
      isPlaying.value = true;
    }
  };

  // 搜索曲目
  const searchTracks = (query: string) => {
    if (!query.trim()) return tracks.value;

    const lowercaseQuery = query.toLowerCase();
    return tracks.value.filter(
      (track) =>
        track.title.toLowerCase().includes(lowercaseQuery) ||
        track.artist?.toLowerCase().includes(lowercaseQuery) ||
        track.album?.toLowerCase().includes(lowercaseQuery),
    );
  };

  return {
    // 状态
    tracks,
    isLoading,
    error,
    currentTrack,
    isPlaying,
    shuffleMode,
    repeatMode,
    currentPlaylist,
    volume,
    seek,

    // 计算属性
    totalTracks,
    totalDurationMinutes,
    tracksSorted,
    recentTracks,

    // 方法
    scanMusicFiles,
    playTrack,
    pauseTrack,
    stopTrack,
    play,
    pause,
    previousTrack,
    nextTrack,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    setVolume,
    setCurrentPlaylist,
    searchTracks,
  };
});

// 辅助函数
function getRandomArtist(): string {
  const artists = [
    'Hatsune Miku',
    'DragonForce',
    'xi',
    'ZUN',
    '4Minute',
    'Camellia',
    'Kobaryo',
    'LeaF',
    'UNDEAD CORPORATION',
    'Team Grimoire',
  ];
  return artists[Math.floor(Math.random() * artists.length)] || 'Unknown Artist';
}

function getRandomAlbum(): string {
  const albums = [
    'Vocaloid Collection',
    'Inhuman Rampage',
    'Parousia',
    'Touhou Project',
    'Electronic Beats',
    'Melodic Dubstep',
    'Hardcore Heaven',
    'Rhythm Game Classics',
  ];
  return albums[Math.floor(Math.random() * albums.length)] || 'Unknown Album';
}

function getRandomDate(): string {
  const start = new Date('2023-01-01');
  const end = new Date();
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString();
}
