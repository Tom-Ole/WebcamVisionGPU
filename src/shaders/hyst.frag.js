export const fsHyst = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uInput;
uniform vec2 uResolution;
out vec4 fragColor;

void main() {
    vec2 t = 1.0/uResolution;
    float v = texture(uInput, vTexCoord).r;
    if(v == 0.5) {
        bool s=false;
        for(int y=-1; y <= 1; y++) { 
            for(int x=-1; x <= 1; x++) {
                if(x==0&&y==0) continue;
                float n = texture(uInput, vTexCoord + t*vec2(float(x),float(y))).r;
                if(n==1.0){ 
                    s=true; break; 
                }
            } 
            if(s) break;
        } 

        fragColor = vec4(s?1.0:0.0,0.0,0.0,1.0); 

    } else { 
        fragColor = vec4(v==1.0?1.0:0.0,0.0,0.0,1.0);
    }
}
`;
