import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { VideoEncoder } from './encoder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

const activeJobs = new Map();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Video encoder server is running' });
});

app.post('/api/upload', upload.array('videos', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const jobId = Date.now().toString();
    const settings = {
      width: parseInt(req.body.width) || 640,
      height: parseInt(req.body.height) || 480,
      codec: req.body.codec || 'libx264',
      format: req.body.format || 'mp4',
      outputDir: path.join(__dirname, '..', 'output', jobId)
    };

    const encoder = new VideoEncoder(settings);
    const videoPaths = req.files.map(file => file.path);
    
    activeJobs.set(jobId, {
      status: 'processing',
      totalFiles: videoPaths.length,
      processedFiles: 0,
      results: []
    });

    res.json({ 
      jobId, 
      message: 'Upload successful, processing started',
      totalFiles: videoPaths.length 
    });

    const results = await encoder.encodeMultiple(videoPaths, (progress) => {
      const job = activeJobs.get(jobId);
      if (job) {
        job.processedFiles = progress.current - 1;
        job.currentFile = progress.currentFile;
        job.currentProgress = progress.videoProgress;
        
        io.emit(`progress-${jobId}`, {
          current: progress.current,
          total: progress.total,
          currentFile: progress.currentFile,
          videoProgress: progress.videoProgress
        });
      }
    });

    const job = activeJobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.results = results;
      job.processedFiles = results.length;
    }

    io.emit(`complete-${jobId}`, { results });

    setTimeout(async () => {
      for (const videoPath of videoPaths) {
        try {
          await fs.unlink(videoPath);
        } catch (err) {
          console.error('Error deleting uploaded file:', err);
        }
      }
    }, 60000);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/job/:jobId', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

app.get('/api/download/:jobId/:filename', async (req, res) => {
  try {
    const { jobId, filename } = req.params;
    const filePath = path.join(__dirname, '..', 'output', jobId, filename);
    
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/output', express.static(path.join(__dirname, '..', 'output')));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Video encoder server running at http://localhost:${PORT}`);
});