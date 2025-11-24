export const fsGray = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uSampler;

out vec4 fragColor;

void main(){
    

    vec4 c = texture(uSampler, vTexCoord);
    float gray = dot(c.rgb, vec3(0.299,0.587,0.114));


    fragColor = vec4(gray, gray, gray, 1.0);
}
`;
