export const fsRaw = `#version 300 es
precision mediump float; 
in vec2 vTexCoord; 
uniform sampler2D uInput; 
out vec4 fragColor; 

void main() { 
    vec2 f = vec2(vTexCoord.x, 1.0 - vTexCoord.y); 
    vec4 color = texture(uInput, f); 
    fragColor = color;
}
`;
