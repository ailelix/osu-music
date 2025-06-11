// src/components/AppLogo.vue
<template>
  <div
    class="app-logo-container"
    @click="emitToggleDrawer"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <img
      src="~assets/osu-icon-bg.svg"
      alt="Logo Background"
      class="logo-bg"
      :class="{ 'visible-bg': 背景应该可见, 'animate-bg': isHovering && !isDrawerActuallyOpen }"
      ref="logoBgRef"
    />
    <img
      src="~assets/osu-icon.svg"
      alt="Logo Icon"
      class="logo-icon"
      :class="{ 'animate-icon': isHovering && !isDrawerActuallyOpen }"
      ref="logoIconRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Props 从父组件接收抽屉的实际状态
const props = defineProps<{
  isDrawerOpen: boolean; // MainLayout 中的 leftDrawerOpen
}>();

const emit = defineEmits(['toggle-drawer']); // 定义要发出的事件

const logoBgRef = ref<HTMLImageElement | null>(null);
const logoIconRef = ref<HTMLImageElement | null>(null);
const isHovering = ref(false); // 追踪鼠标是否悬停

// 计算属性，判断背景 SVG 是否应该可见
// 当抽屉打开时，或者鼠标悬停在 Logo 上时（即使抽屉是关闭的）
const 背景应该可见 = computed(() => props.isDrawerOpen || isHovering.value);

// 计算属性，判断抽屉是否真的打开 (用于区分 hover 动画和抽屉打开状态)
const isDrawerActuallyOpen = computed(() => props.isDrawerOpen);

function emitToggleDrawer() {
  emit('toggle-drawer'); // 发出事件给父组件
}

function handleMouseEnter() {
  isHovering.value = true;
}

function handleMouseLeave() {
  isHovering.value = false;
}

// 移除了 AppLogo 内部的 toggleDrawer 和 isDrawerOpen ref，状态由父组件管理
</script>

<style lang="scss" scoped>
.app-logo-container {
  position: relative;
  width: 38px;
  height: 38px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  .logo-bg, // 粉色实心圆
  .logo-icon {
    // 白色 "osu!" + 白色轮廓
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition:
      transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
      opacity 0.3s ease-in-out;
  }
  .logo-bg {
    // 粉色背景圆
    opacity: 0; // 默认不可见
    transform: scale(0.8); // 默认稍微小一点，出现时放大
    // 确保你的 osu-icon-bg.svg 是一个粉色的圆，或者在这里用 CSS 实现
    // background-color: #E91E63; // Osu! 粉色
    // border-radius: 50%;
    // 如果 osu-icon-bg.svg 已经是粉色圆，则不需要上面的 CSS 背景
  }
  .logo-icon {
    // 白色 "osu!" 文字 + 白色轮廓
    opacity: 1; // 始终可见
    z-index: 1; // 确保在背景之上
    // 如果 osu-icon.svg 不是白色的，你可能需要用 filter 或修改 SVG
    // filter: brightness(0) invert(1); // 将黑色SVG变白
  }
  // 当抽屉打开或鼠标悬停时，粉色背景出现并有动画
  & .logo-bg.visible-bg {
    // .visible-bg 类由 <template> 中的 :class 绑定
    opacity: 1;
    transform: scale(1); // 恢复到正常大小
  }
  // 鼠标悬停且抽屉关闭时的额外动画 (可选)
  & .logo-bg.animate-bg {
    // 鼠标悬停在关闭的抽屉按钮上时，背景的动画
    transform: scale(1.1) rotate(5deg); // 悬停时的动画效果
  }
  & .logo-icon.animate-icon {
    // 鼠标悬停在关闭的抽屉按钮上时，前景的动画
    transform: scale(1.05); // 轻微放大前景
  }
  // 当抽屉实际打开时，可以有不同的固定状态 (如果需要)
  // 例如，如果 props.isDrawerOpen 为 true，可以给 .logo-icon 添加一个类
  // .logo-icon.drawer-open-state {
  //   transform: rotate(-90deg); // 示例：图标旋转
  // }
}
</style>
