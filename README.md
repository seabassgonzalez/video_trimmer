# Video Encoder

A powerful video encoding application that batch processes video files to convert them to specific formats and resolutions. Features both a web-based interface and a command-line tool.

## Features

- **Batch Processing**: Process multiple video files at once
- **Multiple Interfaces**: Web UI with drag-and-drop and CLI tool
- **Real-time Progress**: Live encoding progress tracking
- **Format Support**: MP4, AVI, MOV, MKV, WMV, FLV, WEBM, and more
- **Codec Options**: H.264 (libx264) and H.265 (libx265)
- **Resolution Control**: Resize videos to specific dimensions
- **Aspect Ratio**: Force aspect ratio with automatic cropping

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd video_trimmer
```

2. Install dependencies:
```bash
npm install
```

3. Ensure FFmpeg is installed on your system:
   - **macOS**: `brew install ffmpeg`
   - **Ubuntu/Debian**: `sudo apt install ffmpeg`
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Usage

### Web Interface

1. Start the web server:
```bash
npm run server
```

2. Open your browser and navigate to `http://localhost:3000`

3. Drag and drop video files or click to select them

4. Configure encoding settings:
   - **Dimensions**: Set output video dimensions (default: 640x480)
   - **Codec**: Choose between H.264 or H.265
   - **Format**: Select output format (MP4, MKV, or AVI)

5. Click "Start Encoding" and monitor real-time progress

6. Download encoded videos when complete

### Command Line Interface

Basic usage:
```bash
npm start -- <video-files>
```

Examples:
```bash
# Single file
npm start -- video.mp4

# Multiple files
npm start -- video1.mp4 video2.avi video3.mov

# Using wildcards
npm start -- "*.mp4"

# All videos in a directory
npm start -- "videos/*.mp4"
```

CLI Options:
```bash
npm start -- --help
```

## Configuration

### Default Settings

- **Output Dimensions**: 640x480
- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC
- **Output Format**: MP4
- **Force Aspect Ratio**: Yes (with cropping)

### Output Directories

- **Web Interface**: Encoded files are saved to `/output/` directory
- **CLI Tool**: Encoded files are saved in the same directory as source files with `_encoded` suffix

## Supported Formats

### Input Formats
- MP4, AVI, MOV, MKV, WMV, FLV, WEBM, M4V, MPG, MPEG

### Output Formats
- MP4 (recommended)
- MKV
- AVI

## API Endpoints

The web server exposes the following endpoints:

- `GET /` - Serve the web interface
- `POST /upload` - Upload videos for encoding
- `GET /download/:filename` - Download encoded videos

## WebSocket Events

Real-time progress tracking via Socket.io:

- `encoding-progress` - Per-file encoding progress
- `encoding-complete` - Individual file completion
- `all-complete` - Batch completion with results

## Project Structure

```
video_trimmer/
├── src/
│   ├── server.js      # Express web server
│   ├── encoder.js     # Video encoding engine
│   ├── index.js       # CLI tool
│   └── utils.js       # Helper functions
├── public/
│   ├── index.html     # Web interface
│   ├── app.js         # Client-side JavaScript
│   └── style.css      # Styling
├── uploads/           # Temporary upload storage
├── output/            # Encoded video output
└── package.json       # Dependencies and scripts
```

## Development

### Running in Development Mode

```bash
# Start the web server
npm run server

# Or use the CLI tool
npm start -- <video-files>
```

### Scripts

- `npm run server` - Start the web server
- `npm start` - Run the CLI tool
- `npm test` - Run tests (if available)

## Requirements

- Node.js 14+ (with ES6 module support)
- FFmpeg installed and accessible in PATH
- Modern web browser (for web interface)

## Error Handling

- Invalid video formats are rejected with appropriate error messages
- Failed encodings are reported in the results summary
- Temporary files are automatically cleaned up after 60 seconds

## Performance Considerations

- Videos are processed sequentially to avoid overwhelming system resources
- Large files may take significant time to encode
- Progress tracking helps monitor long-running operations

## License

[Specify your license here]

## Contributing

[Add contribution guidelines if applicable]

## Support

For issues and feature requests, please [create an issue](link-to-issues) in the repository.