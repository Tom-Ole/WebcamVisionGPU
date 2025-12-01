export const fsHarris = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;
out vec4 fragColor;

float det(vec4 m) {
    return m.r * m.b - (m.g * m.g);
}

float trace(vec4 m) {
    return m.r + m.b;
}

void main(){
    vec2 t = 1.0/uResolution;
   
    vec4 c = texture(uSampler, vTexCoord); // vec4(I_x^2, I_x*I_y, I_y^2, 1)

    float d = det(c);
    float tr = trace(c);

    float k = 0.04;
    
    float R = d - k * (tr * tr);

    float R_vis = clamp(R * 1e7, 0.0, 1.0);
    fragColor = vec4(R_vis, R_vis, R_vis, 1.0);

    //fragColor = vec4(R, R, R, 1.0); 
}
`;


export const fsStructureTensor = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;
out vec4 fragColor;


void main(){
    vec2 t = 1.0/uResolution;
   
    vec4 c = texture(uSampler ,vTexCoord); // vec4(mag, ang, sx, sy)

    float offset = 0.1;
    float Ix = c.b * 2.0 * offset - offset;
    float Iy = c.a * 2.0 * offset - offset;

    fragColor = vec4(Ix * Ix, Ix * Iy, Iy * Iy, 1.0);


}
`;