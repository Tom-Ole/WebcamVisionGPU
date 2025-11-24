export const fsMotionOverlay = `#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uVideo;
uniform sampler2D uMotion;

out vec4 fragColor;

void main() {
    vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
    vec4 videoColor = texture(uVideo, uv);
    float motionValue = texture(uMotion, uv).r;

    vec4 motionColor = vec4(1.0, 0.0, 0.0, 1.0) * motionValue;

    fragColor = videoColor + motionColor ;
}
`;
