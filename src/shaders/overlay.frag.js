export const fsOverlay = `#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uVideo;
uniform sampler2D uOverlay;

out vec4 fragColor;

void main() {
    vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

    vec4 videoColor = texture(uVideo, uv);
    float overlayAlpha = texture(uOverlay, uv).r;

    vec4 overlayColor = vec4(1.0, 0.0, 0.0, overlayAlpha);

    fragColor = mix(videoColor, overlayColor, overlayAlpha);
}
`;


export const fsMotionOverlay = `#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uVideo;
uniform sampler2D uOverlay; 

out vec4 fragColor;

void main() {
    vec2 uv = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
    vec4 videoColor = texture(uVideo, uv);
    float overlayValue = texture(uOverlay, uv).r;

    vec4 OverlayColor = vec4(1.0, 0.0, 0.0, 1.0) * overlayValue;

    fragColor = videoColor + OverlayColor ;
}
`;