#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { VideoEncoder } from './encoder.js';
import { findVideos, formatProgress, formatResults } from './utils.js';

const program = new Command();

program
  .name('video-encoder')
  .description('Batch video encoder for H.264 format')
  .version('1.0.0')
  .argument('<videos...>', 'Video files or patterns to encode (supports wildcards)')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-w, --width <pixels>', 'Output width in pixels', '640')
  .option('-h, --height <pixels>', 'Output height in pixels', '480')
  .option('-c, --codec <codec>', 'Video codec to use', 'libx264')
  .option('-f, --format <format>', 'Output format (mp4, mkv, avi)', 'mp4')
  .action(async (videoPaths, options) => {
    console.log(chalk.cyan('\n🎬 Video Encoder - H.264 Batch Processing\n'));
    
    const spinner = ora('Finding video files...').start();
    
    try {
      const videos = await findVideos(videoPaths);
      
      if (videos.length === 0) {
        spinner.fail(chalk.red('No video files found'));
        process.exit(1);
      }
      
      spinner.succeed(chalk.green(`Found ${videos.length} video(s) to process`));
      
      const encoder = new VideoEncoder({
        width: parseInt(options.width),
        height: parseInt(options.height),
        codec: options.codec,
        format: options.format,
        outputDir: options.output
      });
      
      console.log(chalk.gray(`\nOutput settings:`));
      console.log(chalk.gray(`  Resolution: ${options.width}x${options.height}`));
      console.log(chalk.gray(`  Codec: ${options.codec}`));
      console.log(chalk.gray(`  Format: ${options.format}`));
      console.log(chalk.gray(`  Output directory: ${path.resolve(options.output)}\n`));
      
      const progressSpinner = ora('Starting encoding...').start();
      let currentVideo = '';
      
      const results = await encoder.encodeMultiple(videos, (progress) => {
        if (progress.currentFile !== currentVideo) {
          currentVideo = progress.currentFile;
          progressSpinner.text = chalk.yellow(`[${progress.current}/${progress.total}] Encoding ${currentVideo}...`);
        }
        
        if (progress.videoProgress) {
          progressSpinner.text = chalk.yellow(
            `[${progress.current}/${progress.total}] ${currentVideo} - ${formatProgress(progress.videoProgress)}`
          );
        }
      });
      
      progressSpinner.succeed(chalk.green('Encoding complete!'));
      
      console.log(formatResults(results));
      
      const allSuccessful = results.every(r => r.success);
      process.exit(allSuccessful ? 0 : 1);
      
    } catch (error) {
      spinner.fail(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();