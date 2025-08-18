import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { promises as fs } from 'fs';

export class VideoEncoder {
  constructor(options = {}) {
    this.outputWidth = options.width || 640;
    this.outputHeight = options.height || 480;
    this.outputFormat = options.format || 'mp4';
    this.outputCodec = options.codec || 'libx264';
    this.outputDir = options.outputDir || './output';
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }

  async encodeVideo(inputPath, progressCallback) {
    await this.ensureOutputDir();
    
    const filename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(this.outputDir, `${filename}_encoded.${this.outputFormat}`);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .videoCodec(this.outputCodec)
        .audioCodec('aac')
        .outputOptions([
          '-vf', `scale=${this.outputWidth}:${this.outputHeight}:force_original_aspect_ratio=increase,crop=${this.outputWidth}:${this.outputHeight}`,
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-max_muxing_queue_size', '1024'
        ]);
      
      if (this.outputFormat === 'mp4') {
        command.outputOptions('-movflags', 'faststart');
      }
      
      command
        .on('start', (commandLine) => {
          console.log('Spawned FFmpeg with command: ' + commandLine);
        })
        .on('progress', (progress) => {
          if (progressCallback) {
            progressCallback(progress);
          }
        })
        .on('end', () => {
          resolve({
            input: inputPath,
            output: outputPath,
            success: true
          });
        })
        .on('error', (err) => {
          reject({
            input: inputPath,
            error: err.message,
            success: false
          });
        })
        .save(outputPath);
    });
  }

  async encodeMultiple(videoPaths, onProgress) {
    const results = [];
    
    for (let i = 0; i < videoPaths.length; i++) {
      const videoPath = videoPaths[i];
      try {
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: videoPaths.length,
            currentFile: path.basename(videoPath),
            phase: 'encoding'
          });
        }
        
        const result = await this.encodeVideo(videoPath, (progress) => {
          if (onProgress) {
            onProgress({
              current: i + 1,
              total: videoPaths.length,
              currentFile: path.basename(videoPath),
              phase: 'encoding',
              videoProgress: progress
            });
          }
        });
        
        results.push(result);
      } catch (error) {
        results.push({
          input: videoPath,
          error: error.error || error.message,
          success: false
        });
      }
    }
    
    return results;
  }
}