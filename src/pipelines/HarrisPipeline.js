import { Pipeline } from './Pipeline.js';
import { createTexture, createFramebuffer } from '../core/WebGLUtils.js';
import { GPUPass } from '../core/GPUPass.js';
import { fsBlur, fsTensorBlur } from '../shaders/blur.frag.js';
import { fsNMS } from '../shaders/nms.frag.js';
import { fsHarris, fsStructureTensor } from '../shaders/harris.frag.js';
import { fsSobel } from '../shaders/sobel.frag.js';
import { fsOverlay } from '../shaders/overlay.frag.js';

export class HarrisPipeline extends Pipeline {
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
        this.tensorBlurTex = createTexture(gl, w, h, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.tensorBlurFB = createFramebuffer(gl, this.tensorBlurTex);
        this.sobelTex = createTexture(gl, w, h, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.sobelFB = createFramebuffer(gl, this.sobelTex);
        this.structureTensorTex = createTexture(gl, w, h, gl.RGBA32F, gl.RGBA, gl.FLOAT);
        this.structureTensorFB = createFramebuffer(gl, this.structureTensorTex);
        this.harrisTex = createTexture(gl, w, h);
        this.harrisFB = createFramebuffer(gl, this.harrisTex);
        this.nmsTex = createTexture(gl, w, h);
        this.nmsFB = createFramebuffer(gl, this.nmsTex);
    }

    // Initialize Passes
    initPasses() {
        const gl = this.gl;
        this.passBlur = new GPUPass(gl, fsBlur);
        this.passTensorBlur = new GPUPass(gl, fsTensorBlur);
        this.passSobel = new GPUPass(gl, fsSobel);
        this.passStructureTensor = new GPUPass(gl, fsStructureTensor);
        this.passHarris = new GPUPass(gl, fsHarris);
        this.passNMS = new GPUPass(gl, fsNMS);
        this.passFinal = new GPUPass(gl, fsOverlay);
    }

    // Bind Video stream frame to video texture buffer
    updateVideoTexture(video) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    getSettings() {
        return [
            { name: 'low', label: 'Low Threshold', type: 'range', min: 0, max: 1, step: 0.001, value: this.thresholds.low },
            { name: 'high', label: 'High Threshold', type: 'range', min: 0, max: 1, step: 0.001, value: this.thresholds.high }
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

        // BLUR
        this.passBlur.bindQuad(this.posBuf, this.texBuf);
        this.passBlur.drawTo(this.blurFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
            gl.uniform1i(this.passBlur.getUniform('uSampler'), 0);
            gl.uniform2f(this.passBlur.getUniform('uResolution'), w, h);
            gl.uniform1fv(this.passBlur.getUniform('uKernel'), this.kernel);
        });

        // Sobel
        this.passSobel.bindQuad(this.posBuf, this.texBuf);
        this.passSobel.drawTo(this.sobelFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.blurTex);
            gl.uniform1i(this.passSobel.getUniform('uSampler'), 0);
            gl.uniform2f(this.passSobel.getUniform('uResolution'), w, h);
        });

        // Structure Tensor
        this.passStructureTensor.bindQuad(this.posBuf, this.texBuf);
        this.passStructureTensor.drawTo(this.structureTensorFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.sobelTex);
            gl.uniform1i(this.passStructureTensor.getUniform('uSampler'), 0);
            gl.uniform2f(this.passStructureTensor.getUniform('uResolution'), w, h);
        });

        // tensor Blur
        this.passTensorBlur.bindQuad(this.posBuf, this.texBuf);
        this.passTensorBlur.drawTo(this.tensorBlurFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.structureTensorTex);
            gl.uniform1i(this.passTensorBlur.getUniform('uSampler'), 0);
            gl.uniform2f(this.passTensorBlur.getUniform('uResolution'), w, h);
            gl.uniform1fv(this.passTensorBlur.getUniform('uKernel'), this.kernel);
        });

        // Harris
        this.passHarris.bindQuad(this.posBuf, this.texBuf);
        this.passHarris.drawTo(this.harrisFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tensorBlurTex);
            gl.uniform1i(this.passHarris.getUniform('uSampler'), 0);
            gl.uniform2f(this.passHarris.getUniform('uResolution'), w, h);
        });

        // NMS
        this.passNMS.bindQuad(this.posBuf, this.texBuf);
        this.passNMS.drawTo(this.nmsFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.harrisTex);
            gl.uniform1i(this.passNMS.getUniform('uInput'), 0);
            gl.uniform2f(this.passNMS.getUniform('uResolution'), w, h);
            gl.uniform1f(this.passNMS.getUniform('uLow'), this.thresholds.low);
            gl.uniform1f(this.passNMS.getUniform('uHigh'), this.thresholds.high);
        });


        // FINAL RENDER
        gl.viewport(0, 0, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.passFinal.bindQuad(this.posBuf, this.texBuf);
        this.passFinal.use();
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.nmsTex);
        gl.uniform1i(this.passFinal.getUniform('uOverlay'), 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.uniform1i(this.passFinal.getUniform('uVideo'), 1);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
