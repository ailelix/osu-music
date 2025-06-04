// 测试新的文件名格式
const testBeatmapsets = [
  {
    id: 123456,
    title: 'Hare Hare Yukai',
    title_unicode: 'ハレ晴レユカイ',
    artist: 'Suzumiya Haruhi (CV: Hirano Aya)',
    artist_unicode: '涼宮ハルヒ（平野綾）',
    creator: 'Mapper123',
  },
  {
    id: 789012,
    title: 'FREEDOM DiVE',
    artist: 'xi',
    creator: 'Nakagawa-Kanon',
  },
  {
    id: 345678,
    title: 'Big Black',
    artist: 'The Quick Brown Fox',
    creator: 'Blue Dragon',
  },
  {
    id: 567890,
    title: 'Song with "Special" Characters / & <Symbols>',
    artist: 'Artist: Name | With * Symbols',
    creator: 'TestMapper',
  },
];

const audioFiles = [
  { name: 'audio.mp3', extension: '.mp3' },
  { name: 'background.mp3', extension: '.mp3' },
  { name: 'song.mp3', extension: '.mp3' },
];

// 模拟 sanitizeFileName 函数
function sanitizeFileName(fileName) {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_') // 替换文件系统非法字符
    .replace(/\s+/g, ' ') // 合并多个空格为单个空格
    .trim() // 移除首尾空格
    .replace(/\s/g, '_') // 将空格替换为下划线
    .substring(0, 50); // 限制长度以避免文件名过长
}

// 模拟 getFileExtension 函数
function getFileExtension(fileName) {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot > 0 ? fileName.substring(lastDot) : '';
}

// 生成新的文件名格式
function generateFileName(beatmapset, audioFile) {
  const title = sanitizeFileName(beatmapset.title_unicode || beatmapset.title);
  const artist = sanitizeFileName(
    beatmapset.artist_unicode || beatmapset.artist || beatmapset.creator,
  );
  const extension = getFileExtension(audioFile.name);

  const fileName = `${beatmapset.id}-${title}-${artist}${extension}`;
  const trackId = `beatmap-${beatmapset.id}-${title}-${artist}`;

  return { fileName, trackId };
}

console.log('=== 新的文件名格式测试 ===\n');

testBeatmapsets.forEach((beatmapset, index) => {
  console.log(`${index + 1}. 测试 Beatmapset ID: ${beatmapset.id}`);
  console.log(`   原始标题: "${beatmapset.title}"`);
  if (beatmapset.title_unicode) {
    console.log(`   Unicode标题: "${beatmapset.title_unicode}"`);
  }
  console.log(`   原始艺术家: "${beatmapset.artist || beatmapset.creator}"`);
  if (beatmapset.artist_unicode) {
    console.log(`   Unicode艺术家: "${beatmapset.artist_unicode}"`);
  }

  audioFiles.forEach((audioFile) => {
    const result = generateFileName(beatmapset, audioFile);
    console.log(`   音频文件: ${audioFile.name}`);
    console.log(`   生成文件名: "${result.fileName}"`);
    console.log(`   Track ID: "${result.trackId}"`);
    console.log(`   文件名长度: ${result.fileName.length} 字符`);
  });

  console.log('');
});

console.log('=== 文件名长度和字符处理测试 ===\n');

// 测试长文件名处理
const longTitleBeatmapset = {
  id: 999999,
  title: 'This is a Very Very Very Very Very Long Song Title That Should Be Truncated',
  artist: 'This is Also a Very Very Very Long Artist Name That Should Be Truncated',
  creator: 'LongNameMapper',
};

const longResult = generateFileName(longTitleBeatmapset, { name: 'audio.mp3' });
console.log('长文件名测试:');
console.log(`原始标题长度: ${longTitleBeatmapset.title.length} 字符`);
console.log(`原始艺术家长度: ${longTitleBeatmapset.artist.length} 字符`);
console.log(`处理后文件名: "${longResult.fileName}"`);
console.log(`最终文件名长度: ${longResult.fileName.length} 字符`);
