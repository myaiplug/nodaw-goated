import { o as __toESM } from "../_runtime.mjs";
import { s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as clipToAudioBuffer, p as getAudioContext } from "./tool-header-Ud05aUy4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-transport-GMPhlbKb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var Transport = class {
	source = null;
	gain = null;
	startedAt = 0;
	offset = 0;
	playing = false;
	clip = null;
	loop = false;
	region = null;
	raf = 0;
	listeners = /* @__PURE__ */ new Set();
	get isPlaying() {
		return this.playing;
	}
	get current() {
		if (!this.playing || !this.clip) return this.offset;
		const ctx = getAudioContext();
		const t = this.offset + (ctx.currentTime - this.startedAt);
		const end = this.region?.end ?? this.clip.duration;
		const start = this.region?.start ?? 0;
		if (this.loop) {
			const span = Math.max(.05, end - start);
			return start + (t - start) % span;
		}
		return Math.min(end, t);
	}
	subscribe(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}
	tick = () => {
		this.listeners.forEach((fn) => fn(this.current));
		if (this.playing) this.raf = requestAnimationFrame(this.tick);
	};
	async play(clip, opts = {}) {
		this.stopGraph();
		const ctx = getAudioContext();
		if (ctx.state === "suspended") await ctx.resume();
		this.clip = clip;
		this.loop = Boolean(opts.loop);
		const start = opts.start ?? 0;
		const end = opts.end ?? clip.duration;
		this.region = {
			start,
			end
		};
		this.offset = start;
		const buffer = clipToAudioBuffer(clip);
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		src.loop = this.loop;
		if (this.loop) {
			src.loopStart = start;
			src.loopEnd = end;
		}
		const gain = ctx.createGain();
		src.connect(gain);
		gain.connect(ctx.destination);
		const dur = Math.max(.01, end - start);
		src.start(0, start, this.loop ? void 0 : dur);
		src.onended = () => {
			if (this.source === src) {
				this.playing = false;
				this.offset = this.loop ? start : end;
				opts.onEnd?.();
				this.listeners.forEach((fn) => fn(this.current));
			}
		};
		this.source = src;
		this.gain = gain;
		this.startedAt = ctx.currentTime;
		this.playing = true;
		cancelAnimationFrame(this.raf);
		this.raf = requestAnimationFrame(this.tick);
	}
	stop() {
		this.stopGraph();
		this.offset = this.region?.start ?? 0;
		this.playing = false;
		this.listeners.forEach((fn) => fn(this.current));
	}
	pause() {
		if (!this.playing) return;
		this.offset = this.current;
		this.stopGraph();
		this.playing = false;
		this.listeners.forEach((fn) => fn(this.current));
	}
	seek(t) {
		const clip = this.clip;
		if (!clip) {
			this.offset = t;
			return;
		}
		const start = this.region?.start ?? 0;
		const end = this.region?.end ?? clip.duration;
		this.offset = Math.max(start, Math.min(end, t));
		if (this.playing) this.play(clip, {
			loop: this.loop,
			start,
			end
		});
		else this.listeners.forEach((fn) => fn(this.offset));
	}
	setGain(v) {
		if (this.gain) this.gain.gain.value = v;
	}
	stopGraph() {
		cancelAnimationFrame(this.raf);
		try {
			this.source?.stop();
		} catch {}
		this.source?.disconnect();
		this.gain?.disconnect();
		this.source = null;
		this.gain = null;
	}
	dispose() {
		this.stopGraph();
		this.listeners.clear();
		this.playing = false;
	}
};
function useTransport() {
	const ref = (0, import_react.useRef)(null);
	const [current, setCurrent] = (0, import_react.useState)(0);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = new Transport();
		ref.current = t;
		const unsub = t.subscribe((v) => {
			setCurrent(v);
			setPlaying(t.isPlaying);
		});
		return () => {
			unsub();
			t.dispose();
			ref.current = null;
		};
	}, []);
	return {
		current,
		playing,
		play: async (clip, opts) => {
			await ref.current?.play(clip, opts);
			setPlaying(true);
		},
		pause: () => {
			ref.current?.pause();
			setPlaying(false);
		},
		stop: () => {
			ref.current?.stop();
			setPlaying(false);
		},
		seek: (t) => ref.current?.seek(t)
	};
}
//#endregion
export { useTransport as t };
