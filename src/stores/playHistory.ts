// src/stores/playHistoryStore.ts
import { defineStore } from 'pinia';
import { api as osuApi } from 'boot/axios'; // 假设你的 axios 实例已导出
import type { AxiosError } from 'axios';
import { useAuthStore } from 'src/services/auth'; // 用于获取当前用户ID和token

// --- 接口定义 ---
// 你需要根据 Osu! API 的实际响应来精确定义这些接口
// 例如，Beatmapset 可能有 `covers` 对象包含不同尺寸的封面图
export interface CoverImages {
  cover: string;
  'cover@2x': string;
  card: string;
  'card@2x': string;
  list: string;
  'list@2x': string;
  slimcover: string;
  'slimcover@2x': string;
}

export interface Beatmapset {
  id: number;
  artist: string;
  artist_unicode?: string;
  title: string;
  title_unicode?: string;
  creator: string; // mapper username
  user_id: number; // mapper user_id
  source?: string;
  tags?: string;
  status: string; // ranked, approved, qualified, loved, pending, wip, graveyard
  covers: CoverImages; // 谱面封面图
  // ... 其他谱面集信息 (如 ranked_date, last_updated, bpm, play_count, favourite_count)
}

export interface Beatmap {
  id: number;
  beatmapset_id: number;
  difficulty_rating: number; // 星级 (Star Rating)
  mode: string; // osu, taiko, fruits, mania
  status: string; // ranked, approved, etc. (同 Beatmapset)
  total_length: number; // 秒
  cs: number;
  drain: number; // HP
  accuracy: number; // OD
  ar: number;
  bpm: number;
  count_circles: number;
  count_sliders: number;
  count_spinners: number;
  url: string; // 谱面链接，例如 https://osu.ppy.sh/beatmaps/xxxxxxxx
  version: string; // 难度名 (Diffname)
  // 通常 Osu! API v2 在 Score 对象中嵌套的 beatmap 对象不直接包含 beatmapset，
  // 而是 beatmapset 对象与 beatmap 平级或者在 score.beatmapset。
  // 这里为了 Score 接口的完整性，我假设 beatmapset 在 Score 对象中是独立的。
  // 如果API直接在Beatmap内返回Beatmapset，则取消下面一行的注释。
  // beatmapset?: Beatmapset; // 如果API这样返回
  // ... 其他谱面难度信息 (如 max_combo)
}

export interface ScoreStatistics {
  count_300: number;
  count_100: number;
  count_50: number;
  count_miss: number;
  count_geki?: number; // For mania mode (equivalent to 300g)
  count_katu?: number; // For mania mode (equivalent to 100k)
  // ... 其他统计
}

export interface Score {
  id: number; // Score ID (通常是 score ID on a specific beatmap, not a global unique ID across all scores)
  best_id?: number; // ID of this score if it's the user's best score on the map, otherwise null
  user_id: number;
  accuracy: number; // 0.0 to 1.0
  mods: string[]; // 例如 ["HD", "DT"]
  score: number;
  max_combo: number;
  perfect: boolean; // True if Cperfect combo (no misses, no slider breaks)
  statistics: ScoreStatistics;
  passed: boolean; // True if the score is a pass
  pp: number | null;
  rank: string; // XH, X, SH, S, A, B, C, D
  created_at: string; // ISO 8601 timestamp
  mode: string; // osu, taiko, fruits, mania
  mode_int: number; // 0 for osu, 1 for taiko, 2 for catch, 3 for mania
  replay: boolean; // If a replay is available for the score
  // API v2 通常会将 beatmap 和 beatmapset 对象作为 score 的顶级属性返回
  beatmap: Beatmap;
  beatmapset: Beatmapset;
  // user?: OsuUserProfile; // 有时 API 也会嵌套用户信息
  // weight?: { percentage: number; pp: number }; // 如果是获取 top scores，可能会有权重信息
}
// --- 接口定义结束 ---

interface PlayHistoryState {
  scores: Score[];
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  error: string | null;
  nextCursorParams: Record<string, unknown> | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const ALL_MODES = ['osu', 'taiko', 'fruits', 'mania'];

export const usePlayHistoryStore = defineStore('playHistory', {
  state: (): PlayHistoryState => ({
    scores: [],
    isLoadingInitial: false,
    isLoadingMore: false,
    error: null,
    nextCursorParams: null,
    hasMore: true,
  }),
  actions: {
    /**
     * 获取指定用户最近的游玩记录。
     * 如果不提供 userId，则尝试获取当前已登录用户的记录。
     */
    async fetchScores(
      userId?: number,
      mode: string = 'osu',
      limit: number = DEFAULT_LIMIT,
      includeFails: boolean = true,
      cursorParams?: Record<string, unknown>,
    ) {
      const isLoadingMoreRequest = !!cursorParams;
      if (isLoadingMoreRequest) {
        this.isLoadingMore = true;
      } else {
        this.isLoadingInitial = true;
        this.scores = [];
        this.nextCursorParams = null;
        this.hasMore = true;
      }
      this.error = null;
      const authStore = useAuthStore();
      let targetUserId = userId;
      if (!targetUserId) {
        if (authStore.isAuthenticated && authStore.user) targetUserId = authStore.user.id;
        else {
          this.error = 'User not authenticated.';
          this.isLoadingInitial = this.isLoadingMore = false;
          return;
        }
      }
      if (!authStore.accessToken) {
        this.error = 'Access token missing.';
        this.isLoadingInitial = this.isLoadingMore = false;
        return;
      }
      try {
        let allScores: Score[] = [];
        if (mode === 'all') {
          // 并发请求所有模式
          const requests = ALL_MODES.map((m) => {
            const params: Record<string, unknown> = {
              mode: m,
              limit: limit,
              include_fails: includeFails ? 1 : 0,
              ...cursorParams,
            };
            return osuApi
              .get<Score[]>(`/users/${targetUserId}/scores/recent`, {
                params,
                headers: { Authorization: `Bearer ${authStore.accessToken}` },
              })
              .then((res) => res.data)
              .catch(() => []);
          });
          const results = await Promise.all(requests);
          allScores = results.flat();
          // 按时间降序排序
          allScores.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
          this.scores = allScores;
          // 多模式下分页暂不支持
          this.hasMore = false;
          this.nextCursorParams = null;
          console.log(`[PlayHistoryStore] Fetched (all modes) ${allScores.length} scores.`);
        } else {
          const params: Record<string, unknown> = {
            mode: mode,
            limit: limit,
            include_fails: includeFails ? 1 : 0,
            ...cursorParams,
          };
          const response = await osuApi.get<Score[]>(`/users/${targetUserId}/scores/recent`, {
            params,
            headers: { Authorization: `Bearer ${authStore.accessToken}` },
          });
          const newScores = response.data;
          if (isLoadingMoreRequest) {
            if (newScores.length > 0 && this.scores.length > 0) {
              const lastExisting = this.scores[this.scores.length - 1];
              const firstNew = newScores[0];
              // 检查时间逆序
              if (
                firstNew &&
                lastExisting &&
                new Date(firstNew.created_at) >= new Date(lastExisting.created_at)
              ) {
                this.error =
                  '检测到API分页异常：新页数据时间未递减，可能已达到osu! API限制，无法继续加载更多。';
                this.hasMore = false;
                this.nextCursorParams = null;
                return;
              }
              let firstNewScoreId: number | undefined = undefined;
              if (firstNew) {
                firstNewScoreId = firstNew.id;
              }
              if (
                firstNewScoreId !== undefined &&
                this.scores.some((s) => s.id === firstNewScoreId)
              ) {
                console.warn(
                  '[PlayHistoryStore] Load more returned duplicate data. Assuming no more new scores.',
                );
                this.hasMore = false;
                this.nextCursorParams = null;
                // 不追加重复数据
              } else {
                this.scores.push(...newScores);
              }
            } else if (newScores.length > 0) {
              this.scores.push(...newScores);
            }
          } else {
            this.scores = newScores;
          }
          // --- 判断是否还有更多数据 ---
          if (newScores.length === 0 || newScores.length < limit) {
            this.hasMore = false;
            this.nextCursorParams = null;
          } else if (this.hasMore && newScores.length > 0) {
            const lastScore = newScores[newScores.length - 1];
            if (lastScore && lastScore.created_at && lastScore.id !== undefined) {
              this.nextCursorParams = {
                'cursor[created_at]': lastScore.created_at,
                'cursor[id]': lastScore.id.toString(),
              };
              this.hasMore = true;
            } else {
              this.hasMore = false;
              this.nextCursorParams = null;
            }
          }
          console.log(
            `[PlayHistoryStore] Fetched ${newScores.length} scores. HasMore: ${this.hasMore}, NextCursor:`,
            this.nextCursorParams,
          );
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string; error?: string }>;
        this.error =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          axiosError.message ||
          'Failed to fetch scores.';
        if (!isLoadingMoreRequest) this.scores = [];
      } finally {
        if (isLoadingMoreRequest) {
          this.isLoadingMore = false;
        } else {
          this.isLoadingInitial = false;
        }
      }
    },

    // 如果你需要实现“加载更多”功能
    async loadMoreRecentScores(
      userId?: number,
      mode: string = 'osu',
      includeFails: boolean = true,
    ) {
      if (!this.hasMore || this.isLoadingInitial || this.isLoadingMore) {
        return;
      }
      if (!this.nextCursorParams) {
        this.hasMore = false;
        return;
      }
      await this.fetchScores(userId, mode, DEFAULT_LIMIT, includeFails, this.nextCursorParams);
    },

    /**
     * 清除当前存储的游玩记录和错误状态。
     * 通常在用户登出或切换筛选条件（如游戏模式）时调用。
     */
    clearScores() {
      this.scores = [];
      this.error = null;
      this.isLoadingInitial = false;
      this.isLoadingMore = false;
      this.nextCursorParams = null;
      this.hasMore = true;
    },
  },
});
