const host = () => document.getElementById('toasts');

export function toast(message, kind = 'info', ms = 3200) {
	const el = document.createElement('div');
	el.className = `toast ${kind}`;
	el.textContent = message;
	host()?.appendChild(el);
	setTimeout(() => el.remove(), ms);
	return el;
}
