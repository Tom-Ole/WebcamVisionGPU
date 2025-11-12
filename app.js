const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const FRAME_RATE = 60;


async function getWebCamStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                frameRate: FRAME_RATE
            }
        });
        return stream;

    } catch (error) {
        console.error("Camera initialization error:", error);
    }

}



function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


function drawScene(gl, programInfo, stream) {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();


    const positions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0,
    ]);

    const texCoords = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        1.0, 0.0
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const identityMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    function render() {
        if (video.readyState >= 2) {

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        }
        gl.clear(gl.COLOR_BUFFER_BIT);


        gl.useProgram(programInfo.program);

        
        const uResolution = gl.getUniformLocation(programInfo.program, "uResolution");
        gl.uniform2f(uResolution, CANVAS_WIDTH, CANVAS_HEIGHT);


        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const vertPosLoc = programInfo.attribLocations.vertexPosition
        gl.vertexAttribPointer(
            vertPosLoc,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(vertPosLoc);

        const texCoordLoc = programInfo.attribLocations.textureCoord;
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);


        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, identityMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, identityMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);


        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


        requestAnimationFrame(render);
    }

    render();
}



async function main() {

    const canvas = document.getElementById("canvas");

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const gl = canvas.getContext("webgl2");

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const stream = await getWebCamStream();

    const vsSource = `#version 300 es
    in vec4 aVertexPosition;
    in vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    out vec2 vTexCoord;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTexCoord = aTextureCoord;
    }


`;

    const fsSource = `#version 300 es
    precision mediump float;

    in vec2 vTexCoord;
    uniform sampler2D uSampler;
    uniform vec2 uResolution;

    out vec4 fragColor;

    const vec2 offsets[9] = vec2[](
        vec2(-1.0, -1.0), vec2( 0.0, -1.0), vec2( 1.0, -1.0),
        vec2(-1.0,  0.0), vec2( 0.0,  0.0), vec2( 1.0,  0.0),
        vec2(-1.0,  1.0), vec2( 0.0,  1.0), vec2( 1.0,  1.0)
    );

    // Sobel kernel X
    const float gx[9] = float[](
        -1.0,  0.0,  1.0,
        -2.0,  0.0,  2.0,
        -1.0,  0.0,  1.0
        );
        
    // Sobel kernel Y
    const float gy[9] = float[](
        -1.0, -2.0, -1.0,
        0.0,  0.0,  0.0,
        1.0,  2.0,  1.0
    );

    void main() {
        vec2 texelSize = 1.0 / uResolution;
        float sx = 0.0;
        float sy = 0.0;

        for (int i = 0; i < 9; i++) {
            vec2 samplePos = vTexCoord + offsets[i] * texelSize;
            float intensity = texture(uSampler, samplePos).r;
            sx += gx[i] * intensity;
            sy += gy[i] * intensity;
        }

        float edge = length(vec2(sx, sy));
        fragColor = vec4(vec3(edge), 1.0);
    }
`;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        },
    };




    drawScene(gl, programInfo, stream);


}

main();