export const fsBlur = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uKernel[81]; // 9x9 Kernel
out vec4 fragColor;

void main(){
    vec2 t = 1.0 / uResolution;
    int halfSize = 4; 
    int idx = 0;
    float outv = 0.0;

    for(int j=-halfSize; j<=halfSize; j++) {
        for(int i=-halfSize; i<=halfSize; i++) {
            vec4 c = texture(uSampler, vTexCoord + vec2(float(i),float(j))*t);
            float gray = dot(c.rgb, vec3(0.299,0.587,0.114));
            outv += gray * uKernel[idx++];
        }
    }

    fragColor = vec4(outv, outv, outv, 1.0);
}
`;
