import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: 'src/css/quasar.variables.scss',
    }),
  ],
  // server: {
  //   // HMR 端口配置 (如果之前改过，保持或调整)
  //   // hmr: {
  //   //   port: 9301
  //   // },
  //   proxy: {
  //     // 代理所有以 /osu-api 开头的请求
  //     // 例如，你的前端代码请求 /osu-api/users/xxx/scores/recent
  //     // Vite Dev Server 会将其转发到 https://osu.ppy.sh/api/v2/users/xxx/scores/recent
  //     '/osu-api': {
  //       target: 'https://osu.ppy.sh/api/v2', // Osu! API v2 的基础 URL
  //       changeOrigin: true, // 必须设置为 true，这样目标服务器才会认为请求来自同源
  //       rewrite: (path) => path.replace(/^\/osu-api/, ''), // 移除路径中的 /osu-api 前缀
  //     },
  //   },
  // },
});
