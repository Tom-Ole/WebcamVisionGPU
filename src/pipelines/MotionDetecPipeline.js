import { Pipeline } from './Pipeline.js';
import { createTexture, createFramebuffer } from '../core/WebGLUtils.js';
import { GPUPass } from '../core/GPUPass.js';
import { fsGray } from '../shaders/grayscale.frag.js';
import { fsMotionOverlay } from '../shaders/motionOverlay.frag.js';
import { fsMotion } from '../shaders/motion.frag.js';

export class MotionDetecPipeline extends Pipeline {
    constructor(gl, width, height, positionBuffer, texCoordBuffer) {
        super(gl, width, height);
        this.posBuf = positionBuffer;
        this.texBuf = texCoordBuffer;

        // Settings
        this.thresholds = {
            threshold: 0.1,
            trailLength: 0.9,
        };

        // Initialize Textures and Framebuffers
        this.initResources();

        // Initialize Passes
        this.initPasses();
    }

    // Initialize Textures and Framebuffers
    initResources() {
        const gl = this.gl;
        const w = this.width;
        const h = this.height;

        // Video Texture
        this.videoTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Intermediate Textures & FBOs
        this.grayTex1 = createTexture(gl, w, h);
        this.grayFB1 = createFramebuffer(gl, this.grayTex1);

        this.grayTex2 = createTexture(gl, w, h);
        this.grayFB2 = createFramebuffer(gl, this.grayTex2);

        
        this.motionTex1 = createTexture(gl, w, h);
        this.motionFB1 = createFramebuffer(gl, this.motionTex1);

        this.motionTex2 = createTexture(gl, w, h);
        this.motionFB2 = createFramebuffer(gl, this.motionTex2);

        this.readIndex = 0;
    }

    // Initialize Passes
    initPasses() {
        const gl = this.gl;
        this.passGray = new GPUPass(gl, fsGray);
        this.passMotion = new GPUPass(gl, fsMotion);
        this.passFinal = new GPUPass(gl, fsMotionOverlay);
    }

    // Bind Video stream frame to video texture buffer
    updateVideoTexture(video) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    getSettings() {
        return [
            { name: 'threshold', label: 'Threshold', type: 'range', min: 0, max: 1, step: 0.01, value: this.thresholds.threshold },
            { name: 'trailLength', label: 'Trail Length', type: 'range', min: 0, max: 0.99, step: 0.001, value: this.thresholds.trailLength }
        ];
    }

    setSetting(name, value) {
        if (this.thresholds.hasOwnProperty(name)) {
            this.thresholds[name] = parseFloat(value);
        }
    }

    render() {
        const gl = this.gl;
        const w = this.width;
        const h = this.height;

        const writeIndex = this.readIndex;
        const readIndex = (this.readIndex + 1) % 2;

        const grayFB = writeIndex === 0 ? this.grayFB1 : this.grayFB2;
        const grayTexCurrent = writeIndex === 0 ? this.grayTex1 : this.grayTex2;
        const grayTexBefore = readIndex === 0 ? this.grayTex1 : this.grayTex2;

        const motionFB = writeIndex === 0 ? this.motionFB1 : this.motionFB2;
        const motionTexCurrent = writeIndex === 0 ? this.motionTex1 : this.motionTex2;
        const motionTexHistory = readIndex === 0 ? this.motionTex1 : this.motionTex2;

        // Gray
        this.passGray.bindQuad(this.posBuf, this.texBuf);
        this.passGray.drawTo(grayFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
            gl.uniform1i(this.passGray.getUniform('uSampler'), 0);
        });

        this.passMotion.bindQuad(this.posBuf, this.texBuf);
        this.passMotion.drawTo(motionFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, grayTexCurrent);
            gl.uniform1i(this.passMotion.getUniform('uCurrent'), 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, grayTexBefore);
            gl.uniform1i(this.passMotion.getUniform('uBefore'), 1);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, motionTexHistory);
            gl.uniform1i(this.passMotion.getUniform('uTrailHistory'), 2);

            gl.uniform1f(this.passMotion.getUniform('uThreshold'), this.thresholds.threshold);
            gl.uniform1f(this.passMotion.getUniform('uTrailLength'), this.thresholds.trailLength);

        });

        // Swap for next frame
        this.readIndex = (this.readIndex + 1) % 2;

        // FINAL RENDER
        gl.viewport(0, 0, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.passFinal.bindQuad(this.posBuf, this.texBuf);
        this.passFinal.use();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.uniform1i(this.passFinal.getUniform('uVideo'), 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, motionTexCurrent);
        gl.uniform1i(this.passFinal.getUniform('uMotion'), 1);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
