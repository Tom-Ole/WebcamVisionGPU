import { Pipeline } from './Pipeline.js';
import { createTexture, createFramebuffer } from '../core/WebGLUtils.js';
import { GPUPass } from '../core/GPUPass.js';
import { fsInvert } from '../shaders/invert.frag.js';

export class InvertPipeline extends Pipeline {
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
        this.invertTex = createTexture(gl, w, h);
        this.invertFB = createFramebuffer(gl, this.invertTex);
    }

    // Initialize Passes
    initPasses() {
        const gl = this.gl;
        this.invertSepia = new GPUPass(gl, fsInvert);
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



        // FINAL RENDER
        gl.viewport(0, 0, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.invertSepia.bindQuad(this.posBuf, this.texBuf);
        this.invertSepia.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.uniform1i(this.invertSepia.getUniform('uInput'), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
