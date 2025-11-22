import { Pipeline } from './Pipeline.js';
import { createTexture, createFramebuffer } from '../core/WebGLUtils.js';
import { GPUPass } from '../core/GPUPass.js';
import { fsBlur } from '../shaders/blur.frag.js';
import { fsSobel } from '../shaders/sobel.frag.js';
import { fsFinal } from '../shaders/final.frag.js';

export class SobelPipeline extends Pipeline {
    constructor(gl, width, height, positionBuffer, texCoordBuffer, gaussianKernel) {
        super(gl, width, height);
        this.posBuf = positionBuffer;
        this.texBuf = texCoordBuffer;
        this.kernel = gaussianKernel;

        // Settings
        this.thresholds = {
            low: 0.1,
            high: 0.2
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
        this.blurTex = createTexture(gl, w, h);
        this.blurFB = createFramebuffer(gl, this.blurTex);
        this.sobelTex = createTexture(gl, w, h);
        this.sobelFB = createFramebuffer(gl, this.sobelTex);
    }

    // Initialize Passes
    initPasses() {
        const gl = this.gl;
        this.passBlur = new GPUPass(gl, fsBlur);
        this.passSobel = new GPUPass(gl, fsSobel);
        this.passFinal = new GPUPass(gl, fsFinal);
    }

    // Bind Video stream frame to video texture buffer
    updateVideoTexture(video) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    getSettings() {
        return [];
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

        // 1. BLUR
        this.passBlur.bindQuad(this.posBuf, this.texBuf);
        this.passBlur.drawTo(this.blurFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
            gl.uniform1i(this.passBlur.getUniform('uSampler'), 0);
            gl.uniform2f(this.passBlur.getUniform('uResolution'), w, h);
            gl.uniform1fv(this.passBlur.getUniform('uKernel'), this.kernel);
        });

        // 2. SOBEL
        this.passSobel.bindQuad(this.posBuf, this.texBuf);
        this.passSobel.drawTo(this.sobelFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.blurTex);
            gl.uniform1i(this.passSobel.getUniform('uSampler'), 0);
            gl.uniform2f(this.passSobel.getUniform('uResolution'), w, h);
        });


        // 3. FINAL RENDER
        gl.viewport(0, 0, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.passFinal.bindQuad(this.posBuf, this.texBuf);
        this.passFinal.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sobelTex);
        gl.uniform1i(this.passFinal.getUniform('uInput'), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
