import { Pipeline } from './Pipeline.js';
import { createTexture, createFramebuffer } from '../core/WebGLUtils.js';
import { GPUPass } from '../core/GPUPass.js';
import { fsFinal } from '../shaders/final.frag.js';
import { fsGray } from '../shaders/grayscale.frag.js';

export class grayPipeline extends Pipeline {
    constructor(gl, width, height, positionBuffer, texCoordBuffer) {
        super(gl, width, height);
        this.posBuf = positionBuffer;
        this.texBuf = texCoordBuffer;

        // Settings
        this.thresholds = {};

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
        this.grayTex = createTexture(gl, w, h);
        this.grayFB = createFramebuffer(gl, this.grayTex);
    }

    // Initialize Passes
    initPasses() {
        const gl = this.gl;
        this.passGray = new GPUPass(gl, fsGray);
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

        // BLUR
        this.passGray.bindQuad(this.posBuf, this.texBuf);
        this.passGray.drawTo(this.grayFB, w, h, () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
            gl.uniform1i(this.passGray.getUniform('uSampler'), 0);
        });


        // FINAL RENDER
        gl.viewport(0, 0, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.passFinal.bindQuad(this.posBuf, this.texBuf);
        this.passFinal.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.grayTex);
        gl.uniform1i(this.passFinal.getUniform('uInput'), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
