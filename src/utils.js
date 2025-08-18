import { glob } from 'glob';
import path from 'path';

export const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg'];

export async function findVideos(inputPaths) {
  const videos = [];
  
  for (const inputPath of inputPaths) {
    if (inputPath.includes('*')) {
      const matches = await glob(inputPath);
      videos.push(...matches.filter(file => 
        videoExtensions.includes(path.extname(file).toLowerCase())
      ));
    } else {
      const ext = path.extname(inputPath).toLowerCase();
      if (videoExtensions.includes(ext)) {
        videos.push(inputPath);
      }
    }
  }
  
  return [...new Set(videos)];
}

export function formatProgress(progress) {
  const percent = progress.percent || 0;
  const time = progress.timemark || '00:00:00';
  return `${percent.toFixed(1)}% - ${time}`;
}

export function formatResults(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  let output = '\n--- Encoding Results ---\n';
  output += `Total: ${results.length} videos\n`;
  output += `Success: ${successful.length}\n`;
  output += `Failed: ${failed.length}\n`;
  
  if (successful.length > 0) {
    output += '\nSuccessfully encoded:\n';
    successful.forEach(r => {
      output += `  ✓ ${path.basename(r.input)} → ${path.basename(r.output)}\n`;
    });
  }
  
  if (failed.length > 0) {
    output += '\nFailed to encode:\n';
    failed.forEach(r => {
      output += `  ✗ ${path.basename(r.input)}: ${r.error}\n`;
    });
  }
  
  return output;
}