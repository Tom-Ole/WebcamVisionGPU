import { compileShader, linkProgram } from './WebGLUtils.js';
import { IDENTITY_MATRIX } from './MathUtils.js';
import { quadVS } from '../shaders/quad.vert.js';

export class GPUPass {
    /**
     * @param {WebGL2RenderingContext} gl 
     * @param {string} fsSource - Fragment shader source
     */
    constructor(gl, fsSource) {
        this.gl = gl;
        const vs = compileShader(gl, gl.VERTEX_SHADER, quadVS);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
        this.program = linkProgram(gl, vs, fs);

        this.attribs = {
            aVertexPosition: gl.getAttribLocation(this.program, 'aVertexPosition'),
            aTextureCoord: gl.getAttribLocation(this.program, 'aTextureCoord'),
        };
        this.uniforms = {};
    }

    /**
     * Activates the shader program.
     */
    use() {
        this.gl.useProgram(this.program);
    }

    /**
     * Gets the location of a uniform.
     * @param {string} name 
     * @returns {WebGLUniformLocation}
     */
    getUniform(name) {
        if (!this.uniforms[name]) {
            this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
        }
        return this.uniforms[name];
    }

    /**
     * Binds the quad geometry buffers and sets up attributes.
     * Also sets default projection/modelview matrices.
     * @param {WebGLBuffer} positionBuffer 
     * @param {WebGLBuffer} texCoordBuffer 
     */
    bindQuad(positionBuffer, texCoordBuffer) {
        const gl = this.gl;
        this.use();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(this.attribs.aVertexPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribs.aVertexPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(this.attribs.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribs.aTextureCoord);

        // common matrices
        const pm = this.getUniform('uProjectionMatrix');
        if (pm) gl.uniformMatrix4fv(pm, false, IDENTITY_MATRIX);

        const mv = this.getUniform('uModelViewMatrix');
        if (mv) gl.uniformMatrix4fv(mv, false, IDENTITY_MATRIX);
    }

    /**
     * Draws the quad to the specified framebuffer.
     * @param {WebGLFramebuffer} fb - Target framebuffer (null for screen)
     * @param {number} width 
     * @param {number} height 
     * @param {Function} cb - Callback to set uniforms before drawing
     */
    drawTo(fb, width, height, cb) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.use();

        if (cb) cb();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}
