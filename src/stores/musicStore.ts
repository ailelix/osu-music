import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { audioService } from 'src/services/audioService';

export interface MusicTrack {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  duration?: number | undefined; // 可选
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
  const volume = ref(0.5); // 0~1 (默认50%)
  const seek = ref(0); // 秒
  const currentTime = ref(0); // 当前播放时间（秒）
  const duration = ref(0); // 音频总时长（秒）

  // 初始化音频服务事件监听
  const initAudioEvents = () => {
    audioService.on('play', () => {
      isPlaying.value = true;
    });

    audioService.on('pause', () => {
      isPlaying.value = false;
    });

    audioService.on('ended', () => {
      isPlaying.value = false;
      // 处理播放结束逻辑
      if (repeatMode.value === 'one') {
        // 单曲循环
        if (currentTrack.value) {
          playTrack(currentTrack.value);
        }
      } else {
        // 播放下一曲
        nextTrack();
      }
    });

    audioService.on('timeupdate', (time: number) => {
      currentTime.value = time;
    });

    audioService.on('durationchange', (dur: number) => {
      duration.value = dur;
    });

    audioService.on('error', (error: Error) => {
      console.error('Audio playback error:', error);
      isPlaying.value = false;
      // 可以在这里添加错误处理，比如显示通知
    });
  };

  // 初始化事件监听
  initAudioEvents();

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
  const scanMusicFiles = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // 在 Electron 环境中，通过 IPC 扫描音乐文件夹
      if (window.electron?.ipcRenderer) {
        const result: {
          success: boolean;
          files?: Array<{
            fileName: string;
            filePath: string;
            size: number;
            lastModified: string;
          }>;
          error?: string;
        } = await window.electron.ipcRenderer.invoke('scan-music-folder');

        if (!result.success) {
          throw new Error(result.error || 'Failed to scan music folder');
        }

        const musicFiles = result.files || [];
        console.log(`[MusicStore] Found ${musicFiles.length} music files in folder`);

        // 并发读取所有音频文件的真实时长
        const scannedTracks: MusicTrack[] = await Promise.all(
          musicFiles.map(async (fileInfo) => {
            // 文件名格式：id-title-artist.mp3
            const fileName = fileInfo.fileName;
            const nameWithoutExt = fileName.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '');
            const parts = nameWithoutExt.split('-');
            const id = parts[0]
              ? parts[0]
              : `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            let title = '';
            let artist = '';
            if (parts.length >= 3) {
              // id-title-artist
              artist = String(parts[parts.length - 1] ?? '')
                .replace(/_/g, ' ')
                .trim();
              title = parts
                .slice(1, parts.length - 1)
                .join('-')
                .replace(/_/g, ' ')
                .trim();
            } else if (parts.length === 2) {
              title = parts[1] ? parts[1].replace(/_/g, ' ').trim() : '';
              artist = '';
            } else {
              title = nameWithoutExt;
              artist = '';
            }

            // 通过 Electron IPC 获取真实 duration
            let duration: number | undefined = undefined;
            try {
              duration = await window.electron?.ipcRenderer?.invoke(
                'get-audio-metadata',
                fileInfo.filePath,
              );
            } catch (e) {
              console.warn('Failed to get audio duration for', fileInfo.filePath, e);
            }

            return {
              id,
              title: title || fileName,
              fileName,
              filePath: fileInfo.filePath,
              duration: duration, // 真实时长，单位：秒
              artist: artist || 'Unknown Artist',
              album: 'Unknown Album',
              coverUrl: generateOsuCoverUrl(id || 'unknown'),
              addedDate: fileInfo.lastModified,
            };
          }),
        );

        tracks.value = scannedTracks;
      } else {
        // 浏览器环境中的降级处理（使用模拟数据）
        console.warn('[MusicStore] Not in Electron environment, using mock data');

        // 在浏览器环境中，我们无法访问用户的文件系统，使用示例数据
        const mockFiles = [
          '1234567-Senbonzakura.mp3',
          '2345678-Through_the_Fire_and_Flames.mp3',
          '3456789-Blue_Zenith.mp3',
          '4567890-Necrofantasia.mp3',
          '5678901-FREEDOM_DiVE.mp3',
        ];

        const scannedTracks: MusicTrack[] = mockFiles.map((fileName) => {
          const nameWithoutExt = fileName.replace('.mp3', '');
          const parts = nameWithoutExt.split('-');
          const id = parts[0] ? parts[0] : 'unknown';
          let artist = '';
          let title = '';
          if (parts.length >= 3) {
            artist = String(parts[parts.length - 1] ?? '')
              .replace(/_/g, ' ')
              .trim();
            title = parts
              .slice(1, parts.length - 1)
              .join('-')
              .replace(/_/g, ' ')
              .trim();
          } else if (parts.length === 2) {
            title = parts[1] ? parts[1].replace(/_/g, ' ').trim() : '';
            artist = '';
          } else {
            title = nameWithoutExt;
            artist = '';
          }

          return {
            id,
            title,
            fileName,
            filePath: `/music/${fileName}`,
            duration: Math.floor(Math.random() * 300) + 60,
            artist: artist || 'Unknown Artist',
            album: getRandomAlbum(),
            coverUrl: generateOsuCoverUrl(id || 'unknown'),
            addedDate: getRandomDate(),
          };
        });

        tracks.value = scannedTracks;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to scan music files';
      console.error('Music scan error:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 播放曲目
  const playTrack = async (track: MusicTrack) => {
    try {
      currentTrack.value = track;
      await audioService.loadTrack(track);
      await audioService.play();
      isPlaying.value = true;
      console.log('Playing track:', track.title);
    } catch (error) {
      console.error('Failed to play track:', error);
      isPlaying.value = false;
    }
  };

  // 播放
  const play = async () => {
    try {
      if (currentTrack.value) {
        // 如果已有当前曲目，直接播放
        if (audioService.getCurrentTrack()?.id === currentTrack.value.id) {
          await audioService.play();
        } else {
          await audioService.loadTrack(currentTrack.value);
          await audioService.play();
        }
        isPlaying.value = true;
      } else if (tracks.value.length > 0) {
        // 如果没有当前曲目，播放第一首
        currentTrack.value = tracks.value[0] || null;
        if (currentTrack.value) {
          await audioService.loadTrack(currentTrack.value);
          await audioService.play();
          isPlaying.value = true;
        }
      }
    } catch (error) {
      console.error('Failed to play:', error);
      isPlaying.value = false;
    }
  };

  // 暂停播放
  const pauseTrack = () => {
    audioService.pause();
    isPlaying.value = false;
  };

  // 暂停
  const pause = () => {
    audioService.pause();
    isPlaying.value = false;
  };

  // 停止播放
  const stopTrack = () => {
    audioService.stop();
    currentTrack.value = null;
    isPlaying.value = false;
  };

  // 上一曲
  const previousTrack = async () => {
    if (!currentPlaylist.value || !currentTrack.value) return;
    const idx = currentPlaylist.value.tracks.findIndex((t) => t.id === currentTrack.value?.id);
    if (idx > 0) {
      const prev = currentPlaylist.value.tracks[idx - 1];
      if (prev) {
        await playTrack(prev);
      }
    }
  };

  // 下一曲
  const nextTrack = async () => {
    if (!currentPlaylist.value || !currentTrack.value) return;
    const idx = currentPlaylist.value.tracks.findIndex((t) => t.id === currentTrack.value?.id);
    if (idx >= 0 && idx < currentPlaylist.value.tracks.length - 1) {
      const next = currentPlaylist.value.tracks[idx + 1];
      if (next) {
        await playTrack(next);
      }
    } else if (repeatMode.value === 'all') {
      // 重复播放整个列表
      const firstTrack = currentPlaylist.value.tracks[0];
      if (firstTrack) {
        await playTrack(firstTrack);
      }
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
    audioService.seekTo(value);
  };

  // 设置音量
  const setVolume = (value: number) => {
    volume.value = Math.max(0, Math.min(1, value));
    audioService.setVolume(volume.value);
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

  // 添加新的音轨到库中
  const addTracks = (newTracks: MusicTrack[]) => {
    // 过滤重复的音轨（基于 ID）
    const existingIds = new Set(tracks.value.map((track) => track.id));
    const uniqueNewTracks = newTracks.filter((track) => !existingIds.has(track.id));

    if (uniqueNewTracks.length > 0) {
      tracks.value.push(...uniqueNewTracks);
      console.log(`Added ${uniqueNewTracks.length} new tracks to library`);
    }
  };

  // 根据 ID 移除音轨
  const removeTrack = (trackId: string) => {
    const index = tracks.value.findIndex((track) => track.id === trackId);
    if (index > -1) {
      tracks.value.splice(index, 1);
      console.log(`Removed track with ID: ${trackId}`);
    }
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
    currentTime,
    duration,

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
    addTracks,
    removeTrack,
  };
});

// 辅助函数
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

// 生成 osu! 封面 URL 的辅助函数
function generateOsuCoverUrl(beatmapsetId: string): string {
  // 尝试不同的封面尺寸，优先使用较小的用于卡片显示
  const coverSizes = ['card', 'list', 'cover'];
  const randomSize = coverSizes[Math.floor(Math.random() * coverSizes.length)];
  return `https://assets.ppy.sh/beatmaps/${beatmapsetId}/covers/${randomSize}.jpg`;
}
