<template>
  <q-page class="index-page q-pa-md">
    <!-- Welcome Section -->
    <section class="welcome-section text-center q-py-xl">
      <!-- User Profile Header -->
      <div v-if="authStore.isAuthenticated && authStore.user" class="user-profile-header q-mb-lg">
        <div class="user-avatar-container">
          <q-avatar size="120px" class="user-avatar">
            <img :src="authStore.user.avatar_url" :alt="authStore.user.username" />
            <div class="avatar-ring"></div>
          </q-avatar>
          <div class="online-indicator"></div>
        </div>
        <div class="user-info q-mt-md">
          <h2 class="text-h4 text-weight-bold q-mb-xs user-name">
            {{ authStore.user.username }}
          </h2>
          <div class="user-badges q-mb-sm">
            <q-chip
              v-if="authStore.user.is_supporter"
              color="pink"
              text-color="white"
              icon="favorite"
              size="sm"
              class="supporter-badge"
            >
              Supporter
            </q-chip>
            <q-chip
              :label="authStore.user.country_code"
              color="primary"
              text-color="white"
              size="sm"
              class="country-badge"
            >
              <q-avatar size="18px" class="q-mr-xs">
                <img
                  :src="`https://osu.ppy.sh/images/flags/${authStore.user.country_code.toLowerCase()}.png`"
                  :alt="authStore.user.country_code"
                />
              </q-avatar>
            </q-chip>
          </div>
          <div class="text-overline text-primary">Welcome Back!</div>
        </div>
      </div>

      <!-- Default Welcome for Non-authenticated Users -->
      <div v-else class="default-welcome">
        <div class="text-overline text-primary q-mb-sm">Welcome!</div>
        <div class="welcome-icon q-mb-md">
          <q-icon name="music_note" size="80px" color="primary" class="animated-icon" />
        </div>
      </div>

      <h1 class="text-h2 text-weight-bold q-mb-md animated-greeting">{{ greeting }}</h1>
      <p
        class="text-subtitle1 text-grey-7 q-mb-lg"
        style="max-width: 500px; margin-left: auto; margin-right: auto"
      >
        Your Osu! music hub. Discover, listen, and enjoy.
      </p>
      <div class="text-center">
        <q-btn
          to="/browse"
          label="Explore Music Library"
          color="primary"
          size="lg"
          unelevated
          rounded
          icon-right="eva-arrow-ios-forward-outline"
          class="q-px-xl q-py-sm explore-btn"
        ></q-btn>
      </div>
    </section>

    <q-separator spaced="xl" inset />

    <!-- Recommendations Grid -->
    <section class="recommendations-grid q-mt-xl">
      <div class="row q-col-gutter-lg">
        <!-- OSU! Community Picks -->
        <div class="col-12 col-md-4">
          <h2 class="text-h5 text-weight-medium q-mb-md section-title">
            <q-icon name="groups" class="q-mr-sm text-primary" />
            Community Hot Picks
          </h2>
          <div class="recommend-section">
            <q-card flat bordered class="placeholder-card">
              <q-card-section class="text-center">
                <q-icon name="whatshot" size="lg" color="deep-orange" class="q-mb-sm" />
                <div class="text-subtitle2">Top tracks from the Osu! community.</div>
                <div class="text-caption text-grey-6 q-mt-xs">(Coming Soon)</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <!-- Recommended for You -->
        <div class="col-12 col-md-4">
          <h2 class="text-h5 text-weight-medium q-mb-md section-title">
            <q-icon name="person_pin" class="q-mr-sm text-primary" />
            Just For You
          </h2>
          <div class="recommend-section">
            <q-card flat bordered class="placeholder-card">
              <q-card-section class="text-center">
                <q-icon name="album" size="lg" color="light-blue" class="q-mb-sm" />
                <div class="text-subtitle2">Personalized based on your listening.</div>
                <div class="text-caption text-grey-6 q-mt-xs">(Coming Soon)</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <!-- Tag-based Recommendations -->
        <div class="col-12 col-md-4">
          <h2 class="text-h5 text-weight-medium q-mb-md section-title">
            <q-icon name="sell" class="q-mr-sm text-primary" />
            Explore by Tags
          </h2>
          <div class="recommend-section">
            <q-card flat bordered class="placeholder-card">
              <q-card-section class="text-center">
                <q-icon name="tag" size="lg" color="green" class="q-mb-sm" />
                <div class="text-subtitle2">Discover music through popular tags.</div>
                <div class="text-caption text-grey-6 q-mt-xs">(Coming Soon)</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section class="q-py-xl text-center">
      <q-btn
        to="/auth-settings"
        label="Setup Osu! Authentication"
        color="secondary"
        outline
        rounded
        icon="account_circle"
        class="q-px-lg q-mr-md"
      />
      <q-btn
        to="/settings"
        label="General Settings"
        color="grey-7"
        outline
        rounded
        icon="settings"
        class="q-px-lg"
      />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from 'src/services/auth';

const authStore = useAuthStore();

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
});
</script>

<style lang="scss" scoped>
.welcome-section {
  .user-profile-header {
    .user-avatar-container {
      position: relative;
      display: inline-block;

      .user-avatar {
        border: 4px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        position: relative;

        &:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        img {
          border-radius: 50%;
        }
      }

      .avatar-ring {
        position: absolute;
        top: -6px;
        left: -6px;
        right: -6px;
        bottom: -6px;
        border: 2px solid $primary;
        border-radius: 50%;
        opacity: 0;
        animation: pulse-ring 2s infinite;
      }

      .online-indicator {
        position: absolute;
        bottom: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: #4caf50;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        animation: pulse-dot 2s infinite;
      }
    }

    .user-info {
      .user-name {
        background: linear-gradient(45deg, $primary, #ff6b9d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradient-shift 3s ease-in-out infinite;
      }

      .user-badges {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;

        .supporter-badge {
          animation: sparkle 2s ease-in-out infinite;
        }

        .country-badge {
          transition: transform 0.2s ease;

          &:hover {
            transform: scale(1.1);
          }
        }
      }
    }
  }

  .default-welcome {
    .welcome-icon {
      .animated-icon {
        animation: float 3s ease-in-out infinite;
      }
    }
  }

  .animated-greeting {
    animation: fadeInDown 0.8s ease-out;
  }

  .explore-btn {
    transition:
      transform 0.2s ease-out,
      box-shadow 0.2s ease-out;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  border-bottom: 2px solid $primary;
  padding-bottom: 8px;
  margin-bottom: 24px;
}

.recommend-section {
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 2rem;
}

.placeholder-card {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    box-shadow 0.3s ease-in-out,
    transform 0.3s ease-in-out;
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
  }
}

// 动画定义
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

@keyframes pulse-dot {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

@keyframes gradient-shift {
  0%,
  100% {
    background: linear-gradient(45deg, $primary, #ff6b9d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  50% {
    background: linear-gradient(45deg, #ff6b9d, $primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
