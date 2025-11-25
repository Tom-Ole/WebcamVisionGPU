export const fsSepia = `#version 300 es
precision mediump float; 
in vec2 vTexCoord; 
uniform sampler2D uInput; 
out vec4 fragColor; 

void main() { 
    vec2 f = vec2(vTexCoord.x, 1.0 - vTexCoord.y); 
    vec4 color = texture(uInput, f);
    float r = dot(color.rgb, vec3(0.393, 0.769, 0.189));
    float g = dot(color.rgb, vec3(0.349, 0.686, 0.168));
    float b = dot(color.rgb, vec3(0.272, 0.534, 0.131));

    fragColor = vec4(vec3(r, g, b),1.0); 
}
`;
