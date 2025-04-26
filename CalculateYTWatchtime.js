import { createReadStream } from 'fs';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

async function processWatchHistory() {
  return new Promise((resolve, reject) => {
    const creatorStats = {};
    let totalVideos = 0;

    const jsonStream = createReadStream('src/data/watch-history.json')
      .pipe(parser())
      .pipe(streamArray());

    jsonStream.on('data', ({ value }) => {
      if (value.subtitles && value.subtitles.length > 0) {
        const creator = value.subtitles[0].name;
        creatorStats[creator] = (creatorStats[creator] || 0) + 1;
      }
      totalVideos++;
    });

    jsonStream.on('end', () => {
      const topCreators = Object.entries(creatorStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `${name}: ${count} videos`)
        .join('\n');

      const summary = `✅ Watchtime Summary:\n\nTotal Videos Watched: ${totalVideos}\n\nTop 5 Creators:\n${topCreators}`;
      resolve(summary);
    });

    jsonStream.on('error', (err) => {
      reject(err);
    });
  });
}

processWatchHistory()
  .then(summary => {
    console.log(summary);
    // You can also write it to a file here if needed
    // fs.writeFileSync('src/data/watchtime_summary.txt', summary, 'utf8');
  })
  .catch(err => {
    console.error('Error processing watch history:', err);
  });