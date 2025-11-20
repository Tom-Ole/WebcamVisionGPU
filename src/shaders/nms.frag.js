export const fsNMS = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uSobel;
uniform vec2 uResolution;
uniform float uLow;
uniform float uHigh;
out vec4 fragColor;

void main(){ 
    vec2 t = 1.0/uResolution;
    vec4 c = texture(uSobel, vTexCoord);
    float mag = c.r;
    float ang = c.g;
    if(ang<0.0) ang+=180.0;
    float m1=0.0; 
    float m2=0.0;

    if(ang<22.5 || ang>=157.5) {
        m1 = texture(uSobel, vTexCoord + vec2(-t.x,0)).r;
        m2 = texture(uSobel, vTexCoord + vec2(t.x,0)).r; 
    } else if(ang<67.5) {
        m1 = texture(uSobel, vTexCoord + vec2(t.x,-t.y)).r;
        m2 = texture(uSobel, vTexCoord + vec2(-t.x,t.y)).r; 
    } else if(ang<112.5) { 
        m1 = texture(uSobel, vTexCoord + vec2(0,-t.y)).r;
        m2 = texture(uSobel, vTexCoord + vec2(0,t.y)).r; 
    } else {
        m1 = texture(uSobel, vTexCoord + vec2(-t.x,-t.y)).r;
        m2 = texture(uSobel, vTexCoord + vec2(t.x,t.y)).r; 
    } 


    float nms = (mag>=m1&&mag>=m2) ? mag : 0.0;
    float dt = nms <= uLow ? 0.0 : (nms <= uHigh ? 0.5 : 1.0);

    fragColor = vec4(dt,0.0,0.0,1.0);
}
`;
