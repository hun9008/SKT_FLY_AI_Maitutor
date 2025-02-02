const localVideo = document.getElementById('localVideo');
const ocrTextElement = document.getElementById('ocr-text');
const errorMessageElement = document.getElementById('error-message');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const resetButton = document.getElementById('resetButton');
const sendButton = document.getElementById('sendButton');
let localStream;
let ws;

startButton.addEventListener('click', () => {
    init();
});

stopButton.addEventListener('click', () => {
    stopStreaming();
});

resetButton.addEventListener('click', () => {
    resetStreaming();
});

sendButton.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        captureFrame();
    } else {
        errorMessageElement.textContent = 'WebSocket connection is not open.';
    }
});

async function init() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        localVideo.srcObject = localStream;

        ws = new WebSocket('ws://localhost:8000/ws');
        ws.onopen = () => {
            console.log('WebSocket connection opened');
            errorMessageElement.textContent = '';
        };
        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (data.type === 'ocr-result' && data.text.trim() !== '') {
                ocrTextElement.textContent = data.text;
            }
        };
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            errorMessageElement.textContent = 'WebSocket error occurred. Check console for details.';
        };
        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
    } catch (error) {
        console.error('Error accessing media devices:', error);
        errorMessageElement.textContent = 'Error accessing media devices. Check console for details.';
    }
}

function stopStreaming() {
    if (ws) {
        ws.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localVideo.srcObject = null;
    ocrTextElement.textContent = '';
    errorMessageElement.textContent = '';
}

function resetStreaming() {
    stopStreaming();
    init();
}

async function captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = localVideo.videoWidth;
    canvas.height = localVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(localVideo, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL('image/jpeg').split(',')[1];
    ws.send(JSON.stringify({ type: 'video-frame', payload: frame }));
}