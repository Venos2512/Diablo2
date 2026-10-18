// Stand-in for Ashen Crown's synthesized audio: the lab has no sound, so every call is silent.
const SILENT = { stop() {} };
export const Audio = {
	play() {},
	loop() {
		return SILENT;
	},
};
