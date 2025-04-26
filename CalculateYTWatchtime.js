import pkg from 'stream-json';
const { parser } = pkg;

import streamArrayPkg from 'stream-json/streamers/StreamArray.js';
const { StreamArray } = streamArrayPkg;

import { readFile } from 'fs/promises';
import path from 'path';