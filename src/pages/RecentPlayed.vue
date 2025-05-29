// src/pages/RecentPlaysPage.vue
<template>
  <q-page padding class="recent-plays-page text-page-text">
    <div class="page-content-container q-mx-auto">
      <!-- 页面头部 -->
      <div class="row items-center justify-between q-mb-lg">
        <h4 class="q-my-none text-h4 page-title">Recent Plays - 24 Hours</h4>
        <q-btn
          flat
          dense
          round
          icon="refresh"
          @click="refreshScores"
          :loading="playHistoryStore.isLoadingInitial && playHistoryStore.scores.length === 0"
          color="primary"
          aria-label="Refresh scores"
        >
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="playHistoryStore.isLoadingInitial && playHistoryStore.scores.length === 0"
        class="loading-state"
      >
        <q-spinner-gears color="primary" size="3.5rem" />
        <p class="q-mt-md text-body1 text-grey-5">Loading your recent plays...</p>
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="playHistoryStore.error && playHistoryStore.scores.length === 0"
        class="error-state"
      >
        <q-icon name="error_outline" color="negative" size="3rem" />
        <p class="q-mt-sm text-h6 text-negative">Oops! Something went wrong.</p>
        <p class="text-body2 text-grey-5">{{ playHistoryStore.error }}</p>
        <q-btn
          label="Try Again"
          @click="refreshScores"
          color="negative"
          unelevated
          class="q-mt-md"
        />
      </div>

      <!-- 无数据状态 -->
      <div
        v-else-if="!playHistoryStore.isLoadingInitial && playHistoryStore.scores.length === 0"
        class="empty-state"
      >
        <q-icon name="sentiment_very_dissatisfied" color="grey-7" size="3.5rem" />
        <p class="q-mt-sm text-h6 text-grey-6">No Recent Plays Found</p>
        <p class="text-body2 text-grey-5">
          It seems you haven't played recently in this mode, or we couldn't fetch your scores.
        </p>
      </div>

      <!-- 无限滚动得分列表 -->
      <q-infinite-scroll
        v-if="playHistoryStore.scores.length > 0"
        @load="onLoadMore"
        :offset="250"
        :disable="!playHistoryStore.hasMore || playHistoryStore.isLoadingMore"
      >
        <q-list bordered separator class="score-list bg-dark-elevated rounded-borders">
          <ScoreListItem v-for="score in playHistoryStore.scores" :key="score.id" :score="score" />
        </q-list>
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>

      <!-- 加载更多失败提示 -->
      <div
        v-if="playHistoryStore.isLoadingMore && playHistoryStore.error"
        class="text-center text-negative q-my-md"
      >
        Failed to load more: {{ playHistoryStore.error }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { usePlayHistoryStore } from 'src/stores/playHistory';
import { useAuthStore } from 'src/services/auth';
import ScoreListItem from 'src/components/ScoreListItem.vue';
const playHistoryStore = usePlayHistoryStore();
const authStore = useAuthStore();

const refreshScores = () => {
  if (authStore.user?.id) {
    void playHistoryStore.fetchScores(authStore.user.id, 'osu');
  } else {
    playHistoryStore.clearScores();
    playHistoryStore.error = 'Please login to view your recent plays.';
  }
};

// 无限滚动加载更多
const onLoadMore = async (index: number, done: (stop?: boolean) => void) => {
  if (!authStore.user?.id || !playHistoryStore.hasMore) {
    done(true); // 没有用户或没有更多数据，停止
    return;
  }
  await playHistoryStore.loadMoreRecentScores(authStore.user.id, 'osu');
  done(!playHistoryStore.hasMore); // 如果还有更多数据，不停止；否则停止
};

onMounted(() => {
  if (authStore.isAuthenticated && authStore.user) {
    if (
      playHistoryStore.scores.length === 0 &&
      !playHistoryStore.isLoadingInitial &&
      !playHistoryStore.error
    ) {
      refreshScores();
    }
  } else {
    playHistoryStore.clearScores();
    playHistoryStore.error = 'Login required to see your recent plays.';
  }
});

watch(
  () => authStore.isAuthenticated,
  (isAuth, wasAuth) => {
    if (isAuth && authStore.user) {
      if (
        (!wasAuth || playHistoryStore.scores.length === 0) &&
        !playHistoryStore.isLoadingInitial &&
        !playHistoryStore.error
      ) {
        refreshScores();
      }
    } else if (!isAuth) {
      playHistoryStore.clearScores();
      playHistoryStore.error = 'Login required to see your recent plays.';
    }
  },
  { immediate: false },
);
</script>

<style lang="scss" scoped>
@use 'sass:color'; // 确保在 scss 文件顶部导入，如果变量依赖它

// 从 quasar.variables.scss 导入变量 (如果它们没有被全局注入)
// 或者直接使用你在 quasar.variables.scss 中定义的 CSS 变量 (如果 Quasar 配置了)
// 为简化，我们假设 $primary, $dark-page, $page-text 等变量在此作用域可用
// 如果不可用，你可能需要 @import '../css/quasar.variables.scss'; (调整路径)
// 或者直接使用硬编码的颜色值，但不推荐。

.recent-plays-page {
  // 页面背景色已由 MainLayout 的 .page-container-bg 设置为 $dark-page
  // 文本颜色已由 class="text-page-text" 设置
}

.page-content-container {
  max-width: 900px; // 限制内容最大宽度，使其在大屏幕上更易读
}

.page-title {
  // 可以添加与你的 AppLogo 标题相似的样式
  font-weight: 600;
  letter-spacing: 0.02em;
}

.mode-selector {
  // Quasar 的 dark 属性会自动处理大部分深色主题下的样式
  // 你可以通过 :deep() 或 slot 来自定义下拉菜单的样式
  // .q-field__control { background-color: lighten($dark-page, 5%); }
  // .q-field__native, .q-field__append .q-icon { color: $page-text; }
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 300px; // 给一些最小高度，使其在内容少时也能居中
  padding: var(--q-gutter-xl, 32px); // 使用 Quasar 的 gutter 变量
  // background-color: color.adjust($dark-page, $lightness: 3%); // 轻微不同的背景
  // border-radius: $border-radius-root;
  // margin-top: var(--q-gutter-md, 16px);
}

.score-list {
  // background-color: color.adjust($dark-page, $lightness: 5%); // 与 SettingsPage 的卡片背景类似
  // border-color: rgba(255, 255, 255, 0.1) !important; // 确保边框颜色在深色背景下可见
}

// 如果你想让 q-select 的下拉菜单也应用深色主题中定义的颜色
// 你可以在 q-select 上使用 popup-content-class 属性
// 例如: popup-content-class="bg-dark-elevated text-page-text"
// 然后定义 .bg-dark-elevated:
// .bg-dark-elevated { background-color: color.adjust($dark-page, $lightness: 8%); }
// (已经在 <q-select> 的 popup-content-class 中添加了)
</style>
