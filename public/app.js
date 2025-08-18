const socket = io();
let selectedFiles = [];
let currentJobId = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileList = document.getElementById('fileList');
const fileListItems = document.getElementById('fileListItems');
const clearBtn = document.getElementById('clearBtn');
const encodeBtn = document.getElementById('encodeBtn');
const progressSection = document.getElementById('progressSection');
const resultsSection = document.getElementById('resultsSection');
const currentFileSection = document.getElementById('currentFileSection');

uploadArea.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    fileInput.value = '';
    updateFileList();
});

encodeBtn.addEventListener('click', startEncoding);

function handleFiles(files) {
    const videoFiles = Array.from(files).filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg'].includes(ext);
    });
    
    selectedFiles = [...selectedFiles, ...videoFiles];
    updateFileList();
}

function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.style.display = 'none';
        return;
    }
    
    fileList.style.display = 'block';
    fileListItems.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
        `;
        fileListItems.appendChild(li);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function startEncoding() {
    if (selectedFiles.length === 0) return;
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('videos', file);
    });
    
    formData.append('width', document.getElementById('width').value);
    formData.append('height', document.getElementById('height').value);
    formData.append('codec', document.getElementById('codec').value);
    formData.append('format', document.getElementById('format').value);
    
    encodeBtn.disabled = true;
    progressSection.style.display = 'block';
    resultsSection.style.display = 'none';
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentJobId = data.jobId;
            setupProgressTracking(data.jobId, data.totalFiles);
        } else {
            alert('Error: ' + data.error);
            resetUI();
        }
    } catch (error) {
        alert('Upload failed: ' + error.message);
        resetUI();
    }
}

function setupProgressTracking(jobId, totalFiles) {
    document.getElementById('progressCount').textContent = `0/${totalFiles}`;
    
    socket.on(`progress-${jobId}`, (data) => {
        updateProgress(data, totalFiles);
    });
    
    socket.on(`complete-${jobId}`, (data) => {
        showResults(data.results);
        resetUI();
    });
}

function updateProgress(data, totalFiles) {
    const overallPercent = ((data.current - 1) / totalFiles) * 100;
    document.getElementById('overallProgress').style.width = overallPercent + '%';
    document.getElementById('progressCount').textContent = `${data.current}/${totalFiles}`;
    
    if (data.currentFile) {
        currentFileSection.style.display = 'block';
        document.getElementById('currentFileName').textContent = data.currentFile;
    }
    
    if (data.videoProgress) {
        const filePercent = data.videoProgress.percent || 0;
        document.getElementById('fileProgress').style.width = filePercent + '%';
        document.getElementById('fileProgressText').textContent = filePercent.toFixed(1) + '%';
    }
}

function showResults(results) {
    resultsSection.style.display = 'block';
    progressSection.style.display = 'none';
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    document.getElementById('successCount').textContent = successful.length;
    document.getElementById('failedCount').textContent = failed.length;
    
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = '';
    
    successful.forEach(result => {
        const div = document.createElement('div');
        div.className = 'result-item success';
        const filename = result.output.split('/').pop();
        div.innerHTML = `
            <div>
                <div class="result-filename">✓ ${result.input.split('/').pop()}</div>
                <div>→ ${filename}</div>
            </div>
            <button class="download-btn" onclick="downloadFile('${currentJobId}', '${filename}')">
                Download
            </button>
        `;
        resultsList.appendChild(div);
    });
    
    failed.forEach(result => {
        const div = document.createElement('div');
        div.className = 'result-item failed';
        div.innerHTML = `
            <div>
                <div class="result-filename">✗ ${result.input.split('/').pop()}</div>
                <div class="error-message">${result.error}</div>
            </div>
        `;
        resultsList.appendChild(div);
    });
}

function downloadFile(jobId, filename) {
    window.open(`/api/download/${jobId}/${filename}`, '_blank');
}

function resetUI() {
    encodeBtn.disabled = false;
    selectedFiles = [];
    fileInput.value = '';
    updateFileList();
    currentFileSection.style.display = 'none';
    document.getElementById('overallProgress').style.width = '0%';
    document.getElementById('fileProgress').style.width = '0%';
}