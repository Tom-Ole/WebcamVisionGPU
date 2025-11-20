/**
 * Math utilities for the application.
 */

/**
 * Creates a 1D Gaussian kernel.
 * @param {number} sigma - The standard deviation of the Gaussian distribution.
 * @returns {Float32Array} The normalized kernel.
 */
export function createGaussianKernel(sigma) {
    const size = 9;
    const halfSize = Math.floor(size / 2);
    const kernel = []; 
    let sum = 0;
    const sigma2 = sigma * sigma;
    const coef = 1.0 / (2.0 * Math.PI * sigma2);
    
    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
            const ii = i - halfSize;
            const jj = j - halfSize;
            const v = coef * Math.exp(-(ii * ii + jj * jj) / (2.0 * sigma2));
            kernel.push(v); 
            sum += v;
        }
    }
    return new Float32Array(kernel.map(v => v / sum));
}

/**
 * 4x4 Identity Matrix.
 */
export const IDENTITY_MATRIX = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);
