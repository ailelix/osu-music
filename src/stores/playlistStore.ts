// src/stores/playlistStore.ts
import { defineStore } from 'pinia';

export interface PlaylistTrack {
  beatmapsetId: number;
  title: string;
  artist: string;
  duration: number; // 秒
  bpm: number;
  addedAt: string; // ISO 8601 timestamp
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  trackCount: number;
  totalDuration: number; // 秒
  tags: string[];
  tracks: PlaylistTrack[];
}

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  isLoading: boolean;
  error: string | null;
}

export const usePlaylistStore = defineStore('playlist', {
  state: (): PlaylistState => ({
    playlists: [],
    currentPlaylist: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    // 获取默认歌单（我的收藏）
    defaultPlaylist: (state) => state.playlists.find((p) => p.isDefault),

    // 获取自定义歌单
    customPlaylists: (state) => state.playlists.filter((p) => !p.isDefault),

    // 获取所有歌单，默认收藏排在第一位
    allPlaylistsSorted: (state) => {
      return state.playlists.slice().sort((a, b) => {
        // 默认歌单排在最前面
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        // 其他按创建时间排序
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },

    // 获取歌单的动态封面图片
    getPlaylistCover: (state) => (playlistId: string) => {
      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (!playlist || playlist.tracks.length === 0) {
        return '/icons/favicon-128x128.png'; // 默认封面
      }

      // 使用第一首歌的 osu 封面
      const firstTrack = playlist.tracks[0];
      if (firstTrack) {
        return `https://assets.ppy.sh/beatmaps/${firstTrack.beatmapsetId}/covers/cover.jpg`;
      }
      return '/icons/favicon-128x128.png';
    },

    // 根据标签筛选歌单
    getPlaylistsByTag: (state) => (tag: string) =>
      state.playlists.filter((p) => p.tags.includes(tag)),

    // 获取总歌曲数量
    totalTracks: (state) =>
      state.playlists.reduce((total, playlist) => total + playlist.trackCount, 0),

    // 获取总播放时长（分钟）
    totalDurationMinutes: (state) =>
      Math.round(
        state.playlists.reduce((total, playlist) => total + playlist.totalDuration, 0) / 60,
      ),
  },

  actions: {
    /**
     * 加载所有歌单
     */
    async loadPlaylists() {
      this.isLoading = true;
      this.error = null;

      try {
        // 在 Electron 环境中，通过 IPC 加载歌单文件
        if (window.electron?.ipcRenderer) {
          const result: {
            success: boolean;
            playlists?: unknown[];
            error?: string;
          } = await window.electron.ipcRenderer.invoke('load-playlist-files');

          if (!result.success) {
            throw new Error(result.error || 'Failed to load playlist files');
          }

          const loadedPlaylists = (result.playlists || []) as Playlist[];
          console.log(`[PlaylistStore] Loaded ${loadedPlaylists.length} playlists from files`);

          // 如果没有找到任何歌单文件，创建默认的"我的收藏"歌单
          if (loadedPlaylists.length === 0) {
            console.log('[PlaylistStore] No playlist files found, creating default playlist');
            const defaultPlaylist = this.createDefaultPlaylist();
            await this.savePlaylistToFile(defaultPlaylist);
            loadedPlaylists.push(defaultPlaylist);
          }

          this.playlists = loadedPlaylists.sort((a, b) => {
            // 默认歌单排在最前面
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            // 其他按创建时间排序
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        } else {
          // 浏览器环境中的降级处理
          console.warn(
            '[PlaylistStore] Not in Electron environment, creating default playlist only',
          );

          // 在浏览器环境中，我们只创建一个默认歌单
          // 因为不能访问用户的 ~/Music/osu-music/ 目录
          const defaultPlaylist = this.createDefaultPlaylist();
          this.playlists = [defaultPlaylist];
        }

        console.log(`[PlaylistStore] Successfully loaded ${this.playlists.length} playlists`);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load playlists';
        console.error('Error loading playlists:', error);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 设置当前播放的歌单
     */
    setCurrentPlaylist(playlist: Playlist) {
      this.currentPlaylist = playlist;
    },

    /**
     * 根据ID获取歌单
     */
    getPlaylistById(id: string): Playlist | undefined {
      return this.playlists.find((p) => p.id === id);
    },

    /**
     * 添加歌曲到指定歌单
     */
    async addTrackToPlaylist(playlistId: string, track: Omit<PlaylistTrack, 'addedAt'>) {
      const playlist = this.getPlaylistById(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // 检查歌曲是否已存在
      const exists = playlist.tracks.some((t) => t.beatmapsetId === track.beatmapsetId);
      if (exists) {
        throw new Error('Track already exists in playlist');
      }

      const newTrack: PlaylistTrack = {
        ...track,
        addedAt: new Date().toISOString(),
      };

      playlist.tracks.push(newTrack);
      playlist.trackCount = playlist.tracks.length;
      playlist.totalDuration = playlist.tracks.reduce((total, t) => total + t.duration, 0);
      playlist.updatedAt = new Date().toISOString();

      // 保存到文件
      await this.savePlaylistToFile(playlist);
      console.log(`Added track "${track.title}" to playlist "${playlist.name}"`);
    },

    /**
     * 从歌单中移除歌曲
     */
    async removeTrackFromPlaylist(playlistId: string, beatmapsetId: number) {
      const playlist = this.getPlaylistById(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      const trackIndex = playlist.tracks.findIndex((t) => t.beatmapsetId === beatmapsetId);
      if (trackIndex === -1) {
        throw new Error('Track not found in playlist');
      }

      const removedTrack = playlist.tracks.splice(trackIndex, 1)[0];
      if (removedTrack) {
        playlist.trackCount = playlist.tracks.length;
        playlist.totalDuration = playlist.tracks.reduce((total, t) => total + t.duration, 0);
        playlist.updatedAt = new Date().toISOString();

        // 保存到文件
        await this.savePlaylistToFile(playlist);
        console.log(`Removed track "${removedTrack.title}" from playlist "${playlist.name}"`);
      }
    },

    /**
     * 创建新歌单
     */
    async createPlaylist(
      name: string,
      description: string = '',
      tags: string[] = [],
    ): Promise<Playlist> {
      const newPlaylist: Playlist = {
        id: `custom-${Date.now()}`,
        name,
        description,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trackCount: 0,
        totalDuration: 0,
        tags,
        tracks: [],
      };

      this.playlists.push(newPlaylist);

      // 保存到文件
      await this.savePlaylistToFile(newPlaylist);
      console.log(`Created new playlist: "${name}"`);

      return newPlaylist;
    },

    /**
     * 删除歌单
     */
    async deletePlaylist(playlistId: string): Promise<void> {
      const playlist = this.getPlaylistById(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }

      if (playlist.isDefault) {
        throw new Error('Cannot delete default playlist');
      }

      const index = this.playlists.findIndex((p) => p.id === playlistId);
      this.playlists.splice(index, 1);

      if (this.currentPlaylist?.id === playlistId) {
        this.currentPlaylist = null;
      }

      // 删除文件
      if (window.electron?.ipcRenderer) {
        const filename = `${playlist.id}.json`;
        const result: { success: boolean; error?: string } =
          await window.electron.ipcRenderer.invoke('delete-playlist-file', filename);

        if (!result.success) {
          console.error(`Failed to delete playlist file: ${result.error}`);
        }
      }

      console.log(`Deleted playlist: "${playlist.name}"`);
    },

    /**
     * 格式化播放时长
     */
    formatDuration(seconds: number): string {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    /**
     * 格式化总时长
     */
    formatTotalDuration(seconds: number): string {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    },

    /**
     * 创建默认歌单（我的收藏）
     */
    createDefaultPlaylist(): Playlist {
      return {
        id: 'my-favorites',
        name: '我的收藏',
        description: '收藏的音乐',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trackCount: 0,
        totalDuration: 0,
        tags: ['favorites'],
        tracks: [],
      };
    },

    /**
     * 保存歌单到文件
     */
    async savePlaylistToFile(playlist: Playlist): Promise<void> {
      if (window.electron?.ipcRenderer) {
        const filename = `${playlist.id}.json`;
        const result: { success: boolean; error?: string } =
          await window.electron.ipcRenderer.invoke('save-playlist-file', filename, playlist);

        if (!result.success) {
          throw new Error(result.error || 'Failed to save playlist file');
        }

        console.log(`[PlaylistStore] Saved playlist "${playlist.name}" to file: ${filename}`);
      } else {
        console.warn('[PlaylistStore] Not in Electron environment, cannot save playlist to file');
      }
    },
  },
});
