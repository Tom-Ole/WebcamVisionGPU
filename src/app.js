import { createGaussianKernel } from './core/MathUtils.js';
import { BlurPipeline } from './pipelines/BlurPipeline.js';
import { CannyPipeline } from './pipelines/CannyPipeline.js';
import { GrayPipeline } from './pipelines/GrayPipeline.js';
import { InvertPipeline } from './pipelines/InvertPipeline.js';
import { MotionDetecPipeline } from './pipelines/MotionDetecPipeline.js';
import { RawPipeline } from './pipelines/RawPipeline.js';
import { SepiaPipeline } from './pipelines/sepiaPipeline.js';
import { SobelPipeline } from './pipelines/SobelPipeline.js';
import { UIManager } from './ui/UIManager.js';

export async function run({ canvasId = 'canvas', width = 1240, height = 720 }) {
    const canvas = document.getElementById(canvasId);
    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        console.error("WebGL2 not supported");
        return;
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Quad Buffers (Shared)
    const positions = new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]);
    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    // Video Stream
    let video;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width, height, frameRate: 60 } });
        video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
    } catch (err) {
        console.error("Error accessing webcam:", err);
        alert("Could not access webcam. Please allow camera access.");
        return;
    }

    // Initialize Pipelines
    const kernel = createGaussianKernel(5);
    const pipelines = {
        gray: new GrayPipeline(gl, width, height, posBuf, texBuf),
        blur: new BlurPipeline(gl, width, height, posBuf, texBuf, kernel),
        sobel: new SobelPipeline(gl, width, height, posBuf, texBuf, kernel),
        canny: new CannyPipeline(gl, width, height, posBuf, texBuf, kernel),
        motion: new MotionDetecPipeline(gl, width, height, posBuf, texBuf),
        sepia: new SepiaPipeline(gl, width, height, posBuf, texBuf),
        invert: new InvertPipeline(gl, width, height, posBuf, texBuf),
        raw: new RawPipeline(gl, width, height, posBuf, texBuf)
    };

    // UI Manager
    const uiManager = new UIManager('modeSettings');

    // State
    let currentMode = 'raw';
    let activePipeline = pipelines[currentMode];
    let raf = null;

    // Mode Switching
    function setMode(mode) {
        if (!pipelines[mode]) return;
        currentMode = mode;
        activePipeline = pipelines[mode];

        // Update UI
        uiManager.updateControls(activePipeline);

        document.querySelectorAll('.mode-row button').forEach(btn => btn.classList.remove('active'));
        const btn = document.getElementById(mode + 'Btn');
        if (btn) btn.classList.add('active');
    }

    setMode('raw');
    document.getElementById('grayBtn').addEventListener('click', () => setMode('gray'));
    document.getElementById('blurBtn').addEventListener('click', () => setMode('blur'));
    document.getElementById('sobelBtn').addEventListener('click', () => setMode('sobel'));
    document.getElementById('cannyBtn').addEventListener('click', () => setMode('canny'));
    document.getElementById('motionBtn').addEventListener('click', () => setMode('motion'));
    document.getElementById('sepiaBtn').addEventListener('click', () => setMode('sepia'));
    document.getElementById('invertBtn').addEventListener('click', () => setMode('invert'));
    document.getElementById('rawBtn').addEventListener('click', () => setMode('raw'));


    function loop() {
        if (video.readyState >= 2) {
            activePipeline.updateVideoTexture(video);
            activePipeline.render();
        }
        raf = requestAnimationFrame(loop);
    }

    loop();
}