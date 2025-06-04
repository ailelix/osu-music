// 测试音频文件过滤逻辑
const testFiles = [
  'song.mp3',
  'music.MP3',
  'click.wav',
  'hit.WAV',
  'background.ogg',
  'track.flac',
  'sample.m4a',
  'normal-hitwhistle.wav',
  'normal-hitfinish.wav',
  'audio.mp3',
];

// 模拟 beatmap 下载的音频文件过滤逻辑
function filterBeatmapAudioFiles(files) {
  const audioExtensions = ['.mp3']; // 只允许 MP3

  return files.filter((fileName) => {
    const lowerFileName = fileName.toLowerCase();
    const isAudioFile = audioExtensions.some((ext) => lowerFileName.endsWith(ext));

    console.log(`Checking file: ${fileName} (is MP3: ${isAudioFile})`);
    return isAudioFile;
  });
}

// 模拟音乐库扫描的音频文件过滤逻辑
function filterLibraryAudioFiles(files) {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

  return files.filter((fileName) => {
    const lowerFileName = fileName.toLowerCase();
    const isAudioFile = audioExtensions.some((ext) => lowerFileName.endsWith(ext));

    console.log(`Scanning file: ${fileName} (is audio: ${isAudioFile})`);
    return isAudioFile;
  });
}

console.log('=== Beatmap Download (只保留 MP3) ===');
const beatmapFiles = filterBeatmapAudioFiles(testFiles);
console.log('保留的文件:', beatmapFiles);

console.log('\n=== 音乐库扫描 (支持多种格式) ===');
const libraryFiles = filterLibraryAudioFiles(testFiles);
console.log('扫描到的文件:', libraryFiles);

console.log('\n=== 总结 ===');
console.log(`Beatmap 下载: ${beatmapFiles.length} 个文件 (${beatmapFiles.join(', ')})`);
console.log(`音乐库扫描: ${libraryFiles.length} 个文件`);
console.log(
  '跳过的 WAV 音效文件:',
  testFiles.filter((f) => f.toLowerCase().endsWith('.wav')),
);
