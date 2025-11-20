/**
 * Manages the UI settings panel.
 */
export class UIManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    /**
     * Generates controls for the given pipeline.
     * @param {Pipeline} pipeline 
     */
    updateControls(pipeline) {
        this.container.innerHTML = ''; // Clear existing controls
        const settings = pipeline.getSettings();

        if (settings.length === 0) {
            this.container.innerHTML = '<p class="footer-note">No settings for this mode.</p>';
            return;
        }

        settings.forEach(setting => {
            const group = document.createElement('div');
            group.className = 'control-group';

            const labelRow = document.createElement('div');
            labelRow.className = 'label-row';

            const label = document.createElement('label');
            label.textContent = setting.label;

            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'range-value';
            valueDisplay.textContent = setting.value;

            labelRow.appendChild(label);
            labelRow.appendChild(valueDisplay);

            const rangeWrap = document.createElement('div');
            rangeWrap.className = 'range-wrap';

            const input = document.createElement('input');
            input.type = 'range';
            input.min = setting.min;
            input.max = setting.max;
            input.step = setting.step;
            input.value = setting.value;

            input.addEventListener('input', (e) => {
                const val = e.target.value;
                valueDisplay.textContent = val;
                pipeline.setSetting(setting.name, val);
            });

            rangeWrap.appendChild(input);
            group.appendChild(labelRow);
            group.appendChild(rangeWrap);
            this.container.appendChild(group);
        });
    }
}
