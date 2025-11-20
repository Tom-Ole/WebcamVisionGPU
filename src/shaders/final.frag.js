export const fsFinal = `#version 300 es
precision mediump float; 
in vec2 vTexCoord; 
uniform sampler2D uInput; 
out vec4 fragColor; 

void main() { 
    vec2 f = vec2(vTexCoord.x, 1.0 - vTexCoord.y); 
    float v = texture(uInput, f).r; 
    fragColor = vec4(vec3(v),1.0); 
}
`;
