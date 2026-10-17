// Wait until the GPU has finished all submitted work (used by benchmarks to time bursts of frames).
// WebGL2: a fence polled without blocking (results only update between tasks, like timer queries).

export function glFence(gl) {
	const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
	gl.flush();
	return new Promise((resolve) => {
		const poll = () => {
			const status = gl.clientWaitSync(sync, 0, 0);
			if (status === gl.TIMEOUT_EXPIRED) {
				setTimeout(poll, 0);
				return;
			}
			gl.deleteSync(sync);
			resolve();
		};
		poll();
	});
}
