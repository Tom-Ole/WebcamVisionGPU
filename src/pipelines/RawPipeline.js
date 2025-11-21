import { Pipeline } from './Pipeline.js';
import { GPUPass } from '../core/GPUPass.js';
import { fsRaw } from '../shaders/raw.frag.js';

export class RawPipeline extends Pipeline {
    constructor(gl, width, height, positionBuffer, texCoordBuffer) {
        super(gl, width, height);
        this.posBuf = positionBuffer;
        this.texBuf = texCoordBuffer;

        // Video Texture
        this.videoTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.passFinal = new GPUPass(gl, fsRaw);
    }

    updateVideoTexture(video) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }

    render() {
        const gl = this.gl;
        const w = this.width;
        const h = this.height;

        gl.viewport(0, 0, w, h);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.passFinal.bindQuad(this.posBuf, this.texBuf);
        this.passFinal.use();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.uniform1i(this.passFinal.getUniform('uInput'), 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
