// really slow
export const fsMedian = `#version 300 es
precision mediump float;

#define KERNEL_SIZE 13

in vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;
out vec4 fragColor;

const int MAX_KERNEL = KERNEL_SIZE * KERNEL_SIZE;

float rList[MAX_KERNEL];
float gList[MAX_KERNEL];
float bList[MAX_KERNEL];

void sortFloatArray(inout float arr[MAX_KERNEL]) {
    for (int i = 0; i < MAX_KERNEL; i++) {
        for (int j = i + 1; j < MAX_KERNEL; j++) {
            if (arr[j] < arr[i]) {
                float t = arr[i];
                arr[i] = arr[j];
                arr[j] = t;
            }
        }
    }
}

void main() {
    vec2 texel = 1.0 / uResolution;
    int halfSize = (KERNEL_SIZE - 1) / 2;

    int idx = 0;

    for (int j = -halfSize; j <= halfSize; j++) {
        for (int i = -halfSize; i <= halfSize; i++) {
            vec2 f = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            vec3 c = texture(uSampler, f + vec2(float(i), float(j)) * texel).rgb;
            rList[idx] = c.r;
            gList[idx] = c.g;
            bList[idx] = c.b;
            idx++;
        }
    }

    sortFloatArray(rList);
    sortFloatArray(gList);
    sortFloatArray(bList);

    int mid = MAX_KERNEL / 2;

    vec3 median = vec3(
        rList[mid],
        gList[mid],
        bList[mid]
    );

    fragColor = vec4(median, 1.0);
}
`;


// more optimized
export const fsMedian3 = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;

out vec4 fragColor;


void cswap(inout float a, inout float b) {
    if (a > b) {
        float t = a; 
        a = b; 
        b = t;
    }
}

void sort3(
    inout float a, inout float b, inout float c
){
    cswap(a,b);
    cswap(b,c);
    cswap(a,b);
}

void main() {
    vec2 t = 1.0 / uResolution;

    float r[9];
    float g[9];
    float b[9];

    int k = 0;

    for(int j=-1; j<=1; j++){
        for(int i=-1; i<=1; i++){
            vec2 f = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            vec3 c = texture(uSampler, f + vec2(float(i),float(j))*t).rgb;
            r[k] = c.r;
            g[k] = c.g;
            b[k] = c.b;
            k++;
        }
    }


    cswap(r[1], r[2]); cswap(g[1], g[2]); cswap(b[1], b[2]);
    cswap(r[4], r[5]); cswap(g[4], g[5]); cswap(b[4], b[5]);
    cswap(r[7], r[8]); cswap(g[7], g[8]); cswap(b[7], b[8]);

    cswap(r[0], r[1]); cswap(g[0], g[1]); cswap(b[0], b[1]);
    cswap(r[3], r[4]); cswap(g[3], g[4]); cswap(b[3], b[4]);
    cswap(r[6], r[7]); cswap(g[6], g[7]); cswap(b[6], b[7]);

    cswap(r[1], r[2]); cswap(g[1], g[2]); cswap(b[1], b[2]);
    cswap(r[4], r[5]); cswap(g[4], g[5]); cswap(b[4], b[5]);
    cswap(r[7], r[8]); cswap(g[7], g[8]); cswap(b[7], b[8]);

    cswap(r[0], r[3]); cswap(g[0], g[3]); cswap(b[0], b[3]);
    cswap(r[5], r[8]); cswap(g[5], g[8]); cswap(b[5], b[8]);

    cswap(r[0], r[6]); cswap(g[0], g[6]); cswap(b[0], b[6]);
    cswap(r[3], r[6]); cswap(g[3], g[6]); cswap(b[3], b[6]);

    cswap(r[1], r[4]); cswap(g[1], g[4]); cswap(b[1], b[4]);
    cswap(r[2], r[5]); cswap(g[2], g[5]); cswap(b[2], b[5]);

    cswap(r[2], r[4]); cswap(g[2], g[4]); cswap(b[2], b[4]);
    cswap(r[4], r[6]); cswap(g[4], g[6]); cswap(b[4], b[6]);
    cswap(r[2], r[4]); cswap(g[2], g[4]); cswap(b[2], b[4]);

    float R = r[4];
    float G = g[4];
    float B = b[4];

    fragColor = vec4(R,G,B,1.0);
}
`;


export const fsMedian5 = `#version 300 es
precision mediump float;

in vec2 vTexCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;

out vec4 fragColor;

void cswap(inout float a, inout float b) {
    if (a > b) {
        float t = a;
        a = b;
        b = t;
    }
}

// Sort 5 values and return median (index 2)
float median5(float v[5]) {
    cswap(v[0], v[1]);
    cswap(v[3], v[4]);
    cswap(v[0], v[3]);
    cswap(v[1], v[4]);
    cswap(v[1], v[2]);
    cswap(v[2], v[3]);
    cswap(v[1], v[2]);
    return v[2];
}

void main() {
    vec2 t = 1.0 / uResolution;

    float rRow[5];
    float gRow[5];
    float bRow[5];

    for (int row = 0; row < 5; row++) {

        float r[5];
        float g[5];
        float b[5];

        int j = row - 2; // -2..+2

        for (int i = 0; i < 5; i++) {
            int ii = i - 2; // -2..+2
            vec2 f = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
            vec3 c = texture(uSampler, f + vec2(float(ii), float(j)) * t).rgb;

            r[i] = c.r;
            g[i] = c.g;
            b[i] = c.b;
        }

        rRow[row] = median5(r);
        gRow[row] = median5(g);
        bRow[row] = median5(b);
    }

    float R = median5(rRow);
    float G = median5(gRow);
    float B = median5(bRow);

    fragColor = vec4(R, G, B, 1.0);
}
`;
