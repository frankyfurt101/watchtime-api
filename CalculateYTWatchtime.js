import pkg from 'stream-json';
const { parser } = pkg;

import streamArrayPkg from 'stream-json/streamers/StreamArray.js';
const { StreamArray } = streamArrayPkg;

import { createReadStream } from 'fs';
import path from 'path';

export async function processWatchHistory() {
  return new Promise((resolve, reject) => {
    const filePath = path.join('src', 'data', 'watch-history.json');
    const jsonStream = StreamArray.withParser();

    let totalSecondsWatched = 0;
    let totalVideos = 0;

    createReadStream(filePath)
      .pipe(parser())
      .pipe(jsonStream.input);

    jsonStream.on('data', ({ value }) => {
      if (value.hasOwnProperty('title')) {
        totalVideos++;
      }
    });

    jsonStream.on('end', () => {
      resolve({
        totalSecondsWatched,
        totalVideos
      });
    });

    jsonStream.on('error', (err) => {
      reject(err);
    });
  });
}