/**
 * Loading spinner
 */
export const loadingSpinner = () => {
	const spinner = document.createElement('div');
	spinner.style.border = '4px solid var(--background-secondary)';
	spinner.style.borderTop = '3px solid var(--interactive-accent)';
	spinner.style.borderRadius = '50%';
	spinner.style.width = '30px';
	spinner.style.height = '30px';
	spinner.style.animation = 'spin 1s linear infinite';
	spinner.style.margin = 'auto';
	spinner.style.marginTop = '12.5px';
	spinner.style.marginBottom = '12.5ypx';

	//define the spin keyframes
	const spin = document.createElement('style');
	spin.type = 'text/css';
	spin.innerHTML = `
		@keyframes spin {
			0% { transform: rotate(0deg); }
			100% { transform: rotate(360deg); }
		}
	`;

	spinner.appendChild(spin);
	return spinner;
}
