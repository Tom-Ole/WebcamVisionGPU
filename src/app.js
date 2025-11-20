import { createGaussianKernel } from './core/MathUtils.js';
import { CannyPipeline } from './pipelines/CannyPipeline.js';
import { RawPipeline } from './pipelines/RawPipeline.js';
import { UIManager } from './ui/UIManager.js';

export async function runApp({ canvasId = 'canvas', width = 1240, height = 720 }) {
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
        canny: new CannyPipeline(gl, width, height, posBuf, texBuf, kernel),
        raw: new RawPipeline(gl, width, height, posBuf, texBuf)
    };

    // UI Manager
    const uiManager = new UIManager('modeSettings');

    // State
    let currentMode = 'canny';
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

    setMode('canny');
    document.getElementById('cannyBtn').addEventListener('click', () => setMode('canny'));
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