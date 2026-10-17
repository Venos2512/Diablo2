import './styles.css';
import { App } from './app/App.js';

const app = new App();
app.start().catch((error) => {
	console.error(error);
	const boot = document.getElementById('boot');
	boot.hidden = false;
	boot.classList.add('error');
	document.getElementById('boot-status').textContent = `Startup failed: ${error.message}`;
});
