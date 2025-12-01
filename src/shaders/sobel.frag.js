export const fsSobel = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;
out vec4 fragColor;

const float gx[9] = float[](-1.0,0.0,1.0,-2.0,0.0,2.0,-1.0,0.0,1.0);
const float gy[9] = float[](-1.0,-2.0,-1.0,0.0,0.0,0.0,1.0,2.0,1.0);

void main(){
    vec2 t = 1.0/uResolution;
    int idx=0; float sx=0.0;

    float sy=0.0; for(int j=-1; j<=1; j++) {
        for(int i=-1;i<=1;i++) {
            float v = texture(uSampler, vTexCoord + t*vec2(float(i),float(j))).r;
            sx += gx[idx]*v; sy += gy[idx]*v; idx++; 
        }
    }

    float mag = length(vec2(sx,sy));
    float ang = degrees(atan(sy,sx));

    const float offset = 0.1; 

    float sx_norm = (sx + offset) / (2.0 * offset);
    float sy_norm = (sy + offset) / (2.0 * offset);

    float ang_norm = ang + 180.0 / 360.0;

    fragColor = vec4(mag, ang_norm, sx_norm, sy_norm); 
}
`;
