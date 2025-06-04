# 🚀 Git 文件管理指南

本文档说明了 osu! Music 项目的 Git 文件管理策略。

## 📂 文件管理策略

### ✅ 应该提交的文件

- 源代码文件 (`src/`, `public/` 的基础文件)
- 配置文件 (`package.json`, `quasar.config.ts`, `vite.config.ts`)
- 示例文件 (demo 音乐、示例播放列表)
- 文档文件 (`README.md`, 使用说明)
- 构建配置 (`.eslintrc`, `tsconfig.json`)

### ❌ 不应该提交的文件

- 用户音乐文件 (除了 demo 文件)
- 用户播放列表 (除了示例文件)
- API 密钥和 token
- 生成的缓存文件
- 数据库文件
- 构建产物

## 🎵 音乐文件管理

### Demo 音乐文件 (保留)

```
public/music/
├── 1234567-Senbonzakura.mp3          ✅ 保留
├── 2345678-Through_the_Fire_and_Flames.mp3  ✅ 保留
├── 3456789-Blue_Zenith.mp3           ✅ 保留
├── 4567890-Necrofantasia.mp3         ✅ 保留
└── 5678901-FREEDOM_DiVE.mp3          ✅ 保留
```

### 用户音乐文件 (忽略)

```
public/music/
├── user-uploaded-song.mp3            ❌ 被忽略
├── my-favorite-track.mp3             ❌ 被忽略
└── downloaded-beatmap.mp3            ❌ 被忽略
```

## 📋 播放列表管理

### 示例播放列表 (保留)

```
public/playlists/
├── my-favorites.json                 ✅ 保留 (示例)
├── chill-anime.json                  ✅ 保留 (示例)
└── electronic-vibes.json             ✅ 保留 (示例)
```

### 用户播放列表 (忽略)

```
public/playlists/
├── johns-playlist.json               ❌ 被忽略
├── gaming-music.json                 ❌ 被忽略
└── study-playlist.json               ❌ 被忽略
```

## 🔐 安全文件管理

### API 凭据

```bash
# ❌ 永远不要提交这些文件
config/osu-credentials.json
.osu-token
oauth-tokens.json
.env
```

### ✅ 正确的做法

```bash
# 提交示例文件
.env.example                          ✅ 提交
config/app.json                       ✅ 提交 (不含敏感信息)
```

## 🛠️ 常用 Git 命令

### 检查忽略状态

```bash
# 查看被忽略的文件
git status --ignored

# 检查特定文件是否被忽略
git check-ignore path/to/file
```

### 清理已跟踪的文件

```bash
# 如果误提交了应该忽略的文件
git rm --cached filename
git commit -m "Remove ignored file"

# 批量移除目录
git rm -r --cached public/music/user-*
```

### 强制添加被忽略的文件

```bash
# 如果需要强制添加被忽略的文件 (谨慎使用)
git add -f path/to/ignored/file
```

## 📱 移动端特殊处理

### iOS 文件

```
ios/App/build/                        ❌ 构建产物
ios/App/Pods/                         ❌ 依赖包
ios/DerivedData/                      ❌ Xcode 缓存
```

## 🔄 项目设置流程

### 1. 克隆项目后

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑你的配置
nano .env
```

### 2. 添加 osu! API 凭据

```bash
# 在 .env 文件中设置
OSU_CLIENT_ID=你的客户端ID
OSU_CLIENT_SECRET=你的客户端密钥
```

### 3. 验证 gitignore 设置

```bash
# 检查重要文件是否被正确忽略
git check-ignore .env
git check-ignore config/osu-credentials.json
```

## ⚠️ 注意事项

1. **永远不要提交 API 密钥**
2. **定期检查 git status 确保没有误提交敏感文件**
3. **用户数据应该通过应用程序本身管理，而不是 Git**
4. **保持示例文件最新，方便新开发者上手**

## 🆘 紧急处理

### 如果意外提交了敏感文件

```bash
# 1. 立即从 Git 历史中移除
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/sensitive/file' \
  --prune-empty --tag-name-filter cat -- --all

# 2. 强制推送 (危险操作，请确认团队成员)
git push origin --force --all

# 3. 更新 .gitignore 防止再次发生
echo "path/to/sensitive/file" >> .gitignore
git add .gitignore
git commit -m "Update gitignore to prevent sensitive file commits"
```

## 📞 需要帮助？

如果你对 Git 文件管理有疑问，请查看：

- [Git 官方文档](https://git-scm.com/docs)
- [Atlassian Git 教程](https://www.atlassian.com/git/tutorials)
- 项目维护者联系方式
