
export class Pipeline {
    constructor(gl, width, height) {
        this.gl = gl;
        this.width = width;
        this.height = height;
    }

    /**
     * Updates the source video texture.
     * @param {HTMLVideoElement} video 
     */
    updateVideoTexture(video) {
    }

    /**
     * Renders the pipeline effect.
     */
    render() {
    }

    /**
     * Returns a list of settings controls for this pipeline.
     * @returns {Array} Array of setting objects { name, label, type, min, max, step, value }
     */
    getSettings() {
        return [];
    }

    /**
     * Updates a specific setting.
     * @param {string} name 
     * @param {any} value 
     */
    setSetting(name, value) {
    }
}
