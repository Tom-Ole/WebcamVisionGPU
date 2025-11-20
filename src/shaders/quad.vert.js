export const quadVS = `#version 300 es
in vec4 aVertexPosition;
in vec2 aTextureCoord;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
out vec2 vTexCoord;

void main() { 
    vTexCoord = aTextureCoord; 
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`;
