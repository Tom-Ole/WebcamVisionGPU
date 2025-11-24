export const fsMotion = `#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform float uThreshold;
uniform float uTrailLength;

uniform sampler2D uCurrent;
uniform sampler2D uBefore;
uniform sampler2D uTrailHistory;

out vec4 fragColor;

void main(){
    
    vec4 currentC = texture(uCurrent, vTexCoord);
    vec4 beforeC = texture(uBefore, vTexCoord);

    float d = abs(beforeC.r - currentC.r);
    if (d < uThreshold) d = 0.0;    

    float history = texture(uTrailHistory, vTexCoord).r;
    float finalValue = max(d, history * uTrailLength);

    fragColor = vec4(finalValue, finalValue, finalValue, 1.0);
}
`;
