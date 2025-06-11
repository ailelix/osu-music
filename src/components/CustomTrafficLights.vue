<template>
  <div class="traffic-lights-container" :class="{ visible: isVisible }">
    <div class="traffic-light red" @click="closeWindow" title="关闭">
      <div class="traffic-light-inner"></div>
    </div>
    <div class="traffic-light yellow" @click="minimizeWindow" title="最小化">
      <div class="traffic-light-inner"></div>
    </div>
    <div class="traffic-light green" @click="maximizeWindow" title="全屏">
      <div class="traffic-light-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
defineProps<{
  isVisible: boolean;
}>();

// 窗口控制函数
function closeWindow() {
  if (window.electron?.windowControls) {
    window.electron.windowControls.closeWindow();
  }
}

function minimizeWindow() {
  if (window.electron?.windowControls) {
    window.electron.windowControls.minimizeWindow();
  }
}

function maximizeWindow() {
  if (window.electron?.windowControls) {
    window.electron.windowControls.toggleMaximize();
  }
}
</script>

<style lang="scss" scoped>
.traffic-lights-container {
  position: absolute;
  right: -10%; // 减小间距，让红绿灯更接近OSU按钮
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 6px; // 增加红绿灯按钮间距，接近macOS原生
  opacity: 0;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 10;
  padding: 8px 16px 8px 4px; // 减少左侧padding，避免覆盖OSU按钮点击区域
  pointer-events: none; // 默认不接收鼠标事件，避免阻挡OSU按钮

  &.visible {
    right: 0px; // 滑入时的位置，减小与OSU按钮的间距
    opacity: 1;
    pointer-events: auto; // 可见时接收鼠标事件
  }

  // 当鼠标在红绿灯区域时保持显示
  &:hover {
    opacity: 1 !important;
  }

  .traffic-light {
    width: 13px; // 稍微增大尺寸，更接近macOS原生
    height: 13px;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease;
    border: 0.5px solid rgba(255, 255, 255, 0.1); // 减淡边框
    pointer-events: auto; // 确保红绿灯按钮始终可以接收点击事件

    &:hover {
      transform: scale(1.1);
      filter: brightness(1.15);
      box-shadow: 0 0 6px rgba(255, 255, 255, 0.15);
    }

    .traffic-light-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    &.red {
      background: linear-gradient(135deg, #ff5f56, #ff453a);
      box-shadow: 0 1px 2px rgba(255, 95, 86, 0.35);

      &:hover .traffic-light-inner {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    &.yellow {
      background: linear-gradient(135deg, #ffbd2e, #ff9f0a);
      box-shadow: 0 1px 2px rgba(255, 189, 46, 0.35);

      &:hover .traffic-light-inner {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    &.green {
      background: linear-gradient(135deg, #27c93f, #30d158);
      box-shadow: 0 1px 2px rgba(39, 201, 63, 0.35);

      &:hover .traffic-light-inner {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }
}
</style>
