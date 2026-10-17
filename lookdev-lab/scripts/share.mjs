// Share the lab from this machine over the Internet with a Cloudflare quick tunnel (no account, no
// router setup): starts the single-page server on localhost, runs `cloudflared tunnel --url`, prints
// the https://….trycloudflare.com link. Ctrl+C stops both. HTTPS means WebGPU works for viewers.
//
//   npm run share            (or double-click share-lab.bat on Windows)
//   node scripts/share.mjs --port 4175 --file ../Sanctuary_Lookdev_Lab.html
//
// Requires cloudflared:  Windows: winget install --id Cloudflare.cloudflared
//                        macOS:   brew install cloudflared
//                        Linux:   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
import { spawn } from 'node:child_process';
import path from 'node:path';
import { startServer, parseArgs } from './serve.mjs';

const args = parseArgs(process.argv.slice(2));
const mb = (n) => (n / 1048576).toFixed(1) + ' MB';

let server;
try {
	// The tunnel connects locally: no need to listen on the LAN (and no firewall prompt).
	server = await startServer({ port: 4175, ...args, host: '127.0.0.1' });
} catch (error) {
	console.error(error.code === 'EADDRINUSE' ? `Port ${args.port || 4175} is busy — close the other server or pass --port 4180.` : error.message || error);
	process.exit(1);
}
console.log(`Serving ${path.basename(server.file)} (${mb(server.size)}, ${mb(server.gzipSize)} gzipped) on http://127.0.0.1:${server.port}`);
console.log('Starting a Cloudflare quick tunnel…');

const tunnel = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${server.port}`], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let announced = false;
const watch = (chunk) => {
	const text = chunk.toString();
	const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
	if (match && !announced) {
		announced = true;
		const line = '─'.repeat(match[0].length + 4);
		console.log(`\n┌${line}┐\n│  ${match[0]}  │\n└${line}┘`);
		console.log('Share this link. It works while this window stays open (a new link every run).');
		console.log('The first visit downloads the whole lab once; Ctrl+C stops sharing.\n');
	}
	if (/error|failed/i.test(text) && !/retrying/i.test(text)) process.stderr.write(text.split('\n').filter((l) => /error|failed/i.test(l)).join('\n') + '\n');
};
tunnel.stdout.on('data', watch);
tunnel.stderr.on('data', watch);
tunnel.on('error', (error) => {
	if (error.code === 'ENOENT') {
		console.error('\ncloudflared is not installed. Install it once, then run this again:');
		console.error('  Windows:  winget install --id Cloudflare.cloudflared   (then open a new terminal)');
		console.error('  macOS:    brew install cloudflared');
		console.error('  Linux:    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/');
		console.error(`\nThe lab is still served locally on http://127.0.0.1:${server.port} — Ctrl+C to stop.`);
	} else console.error(error.message || error);
});
tunnel.on('exit', (code) => {
	if (code !== null && code !== 0) console.error(`cloudflared exited (${code}).`);
	server.server.close();
	process.exit(code || 0);
});
const stop = () => {
	tunnel.kill();
	server.server.close();
	setTimeout(() => process.exit(0), 300);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
