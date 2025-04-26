import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

async function getVideoDurations(videoIds) 
{
    const batchSize = 50; // API limit per request
    const concurrencyLimit = 30; // Number of batches to query in parallel
    let queriedData = [];

    const queryBatch = async (ids) => {
        console.log(`Querying batch of ${ids.length} videos...`);
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${ids.join(',')}&key=${process.env.YT_API_KEY}&part=contentDetails`);
                const data = await response.json();
                if (!response.ok || !data.items) {
                    throw new Error(`YouTube API error: ${response.statusText}`);
                }
                if (data.items.length !== ids.length) {
                    console.warn(`⚠️ Warning: Only ${data.items.length} of ${ids.length} videos returned durations.`);
                }
                return data.items.map(item => ({
                    id: item.id,
                    durationSeconds: convertISO8601DurationToSeconds(item.contentDetails.duration)
                }));
            } catch (error) {
                console.error(`Attempt ${attempt} failed: ${error.message}`);
                if (attempt < maxRetries) {
                    console.log(`Retrying batch after 3 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
                } else {
                    console.error(`❌ Failed batch after ${maxRetries} attempts.`);
                    return [];
                }
            }
        }
    };

    const batches = [];
    for (let i = 0; i < videoIds.length; i += batchSize) {
        batches.push(videoIds.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i += concurrencyLimit) {
        const currentBatches = batches.slice(i, i + concurrencyLimit);
        const percentComplete = Math.min(100, Math.round(((i + currentBatches.length) / batches.length) * 100));
        console.log(`📦 Processing batches ${i + 1}-${i + currentBatches.length} (${percentComplete}%)`);
        const results = await Promise.all(currentBatches.map(batch => queryBatch(batch)));
        results.forEach(batchResult => {
            queriedData.push(...batchResult);
        });
    }

    return queriedData;
}


// Utility to convert seconds to readable time
function secondsToDhms(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor((seconds % (3600*24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

// Converts ISO8601 duration to seconds
function convertISO8601DurationToSeconds(duration) {
    if (duration === "P0D" || duration.includes("D")) {
        return 0;
    }
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = match && match[1] ? parseInt(match[1]) : 0;
    const minutes = match && match[2] ? parseInt(match[2]) : 0;
    const seconds = match && match[3] ? parseInt(match[3]) : 0;
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Main async function
(async () => {
    try {
        const data = fs.readFileSync('/Users/frankyfernandez/Desktop/Youtube Project/watch-history.json', 'utf8');
        const watchHistory = JSON.parse(data);

        if (!Array.isArray(watchHistory) || watchHistory.length === 0) {
            console.error('No valid watch history data found.');
            process.exit(1);
        }

        console.log(`Loaded ${watchHistory.length} watch history entries.`);

        const videoIds = watchHistory
            .filter(item => item.titleUrl)
            .map(item => {
                const match = item.titleUrl.match(/v=([^&]+)/);
                return match ? match[1] : null;
            })
            .filter(Boolean);

        console.log(`Extracted ${videoIds.length} video IDs from watch history.`);

        const videoDurations = await getVideoDurations(videoIds);

        console.log(`Received ${videoDurations.length} videos with durations from YouTube API.`);

        // Ensure output directory exists
        if (!fs.existsSync('/Users/frankyfernandez/Desktop/Youtube Project')) {
            fs.mkdirSync('/Users/frankyfernandez/Desktop/Youtube Project');
        }

        // ---- Merge durations with metadata and group by year ----
        const mergedData = videoDurations.map(video => {
            const original = watchHistory.find(item => item.titleUrl && item.titleUrl.includes(video.id));
            return {
                id: video.id,
                durationSeconds: video.durationSeconds,
                published: original ? original.time : null,
                title: original ? original.title : 'Unknown',
                channel: original && original.subtitles ? original.subtitles[0].name : 'Unknown'
            };
        });

        // Group by Year
        const yearlyGroups = {};
        mergedData.forEach(video => {
            if (video.published) {
                const year = new Date(video.published).getFullYear();
                if (!yearlyGroups[year]) {
                    yearlyGroups[year] = [];
                }
                yearlyGroups[year].push(video);
            }
        });

        // Create yearly CSVs
        for (const year in yearlyGroups) {
            const csvLines = ['id,title,channel,durationSeconds,published'];
            yearlyGroups[year].forEach(video => {
                const safeTitle = (video.title || '').replace(/,/g, ' ');
                const safeChannel = (video.channel || '').replace(/,/g, ' ');
                csvLines.push(`${video.id},"${safeTitle}","${safeChannel}",${video.durationSeconds},"${video.published}"`);
            });
            fs.writeFileSync(`/Users/frankyfernandez/Desktop/Youtube Project/watchtime_${year}.csv`, csvLines.join('\n'), 'utf8');
            console.log(`📄 Saved: watchtime_${year}.csv (${yearlyGroups[year].length} videos)`);
        }

        const totalSeconds = videoDurations.reduce((acc, video) => acc + (video.durationSeconds || 0), 0);

        console.log(`🎥 Total Videos Processed: ${videoDurations.length}`);
        console.log(`🕒 Total Watch Time: ${secondsToDhms(totalSeconds)}`);

        // ---- Generate and save Summary Report ----
        let summaryLines = [];
        let grandTotalSeconds = 0;
        let grandTotalVideos = 0;

        summaryLines.push("YouTube Watchtime Summary Report:");
        summaryLines.push("-----------------------------------");

        for (const year of Object.keys(yearlyGroups).sort()) {
            const yearTotalSeconds = yearlyGroups[year].reduce((acc, video) => acc + (video.durationSeconds || 0), 0);
            const yearTotalVideos = yearlyGroups[year].length;
            grandTotalSeconds += yearTotalSeconds;
            grandTotalVideos += yearTotalVideos;
            const yearTotalHours = (yearTotalSeconds / 3600).toFixed(2);
            summaryLines.push(`${year} - ${yearTotalVideos} videos - ${yearTotalHours} hours`);
        }

        summaryLines.push("-----------------------------------");
        summaryLines.push(`TOTAL VIDEOS: ${grandTotalVideos}`);
        summaryLines.push(`TOTAL HOURS: ${(grandTotalSeconds / 3600).toFixed(2)}`);

        fs.writeFileSync('/Users/frankyfernandez/Desktop/Youtube Project/watchtime_summary.txt', summaryLines.join('\n'), 'utf8');
        console.log("📝 Saved summary report to watchtime_summary.txt");

    } catch (error) {
        console.error('Error processing watch history:', error);
    }
})();