/**
 * Creates a texture with the specified width and height.
 * @param {WebGL2RenderingContext} gl 
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {number} internalFormat - Internal format (default: gl.RGBA)
 * @param {number} format - Texture format (default: gl.RGBA)
 * @param {number} type - Texture type (default: gl.UNSIGNED_BYTE)
 * @param {number} filter - Texture filter (default: gl.LINEAR)
 * @returns {WebGLTexture}
 */
export function createTexture(gl, w, h, internalFormat = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE, filter = gl.LINEAR) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
}

/**
 * Creates a framebuffer attached to the given texture.
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLTexture} texture 
 * @returns {WebGLFramebuffer}
 */
export function createFramebuffer(gl, texture) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (fbStatus !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer incomplete:', fbStatus);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fb;
}

/**
 * Compiles a shader from source.
 * @param {WebGL2RenderingContext} gl 
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} src - Shader source code
 * @returns {WebGLShader}
 */
export function compileShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        throw new Error('Shader compile failed');
    }
    return s;
}

/**
 * Links a vertex and fragment shader into a program.
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLShader} vs - Vertex Shader
 * @param {WebGLShader} fs - Fragment Shader
 * @returns {WebGLProgram}
 */
export function linkProgram(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p));
        gl.deleteProgram(p);
        throw new Error('Program link failed');
    }
    return p;
}
