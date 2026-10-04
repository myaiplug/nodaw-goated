//#region node_modules/.nitro/vite/services/ssr/assets/types-DyJMjOBu.js
var STEM_ORDER = [
	"vocals",
	"drums",
	"bass",
	"guitar",
	"piano",
	"other"
];
var STEM_LABEL = {
	vocals: "Vocals",
	drums: "Drums",
	bass: "Bass",
	guitar: "Guitar",
	piano: "Piano",
	other: "Other"
};
var STEM_MODELS = [
	{
		id: "htdemucs_6s",
		name: "HTDemucs 6s",
		family: "136 MB · 6 stems",
		note: "Real 6-stem ONNX. Drums, bass, other, vocals, guitar, piano. First run downloads the weights. This device keeps them.",
		hq: true,
		stems: 6
	},
	{
		id: "htdemucs",
		name: "HTDemucs",
		family: "166 MB · 4 stems",
		note: "Standard 4-stem ONNX. Drums, bass, other, vocals. Guitar and piano stay inside other, the way this model was trained.",
		hq: true,
		stems: 4
	},
	{
		id: "htdemucs_ft",
		name: "FT Vocals",
		family: "166 MB · vocal",
		note: "Fine-tuned vocal specialist. Highest vocal isolation of the three. Instrumental is the mix with the vocal removed.",
		hq: true,
		stems: 2
	}
];
/** Old bench ids from the spectral-map era, mapped onto a real engine. */
function normalizeStemModel(id) {
	if (id === "htdemucs" || id === "htdemucs_ft" || id === "htdemucs_6s") return id;
	if (id === "mdx23c") return "htdemucs";
	if (id === "mel_roformer") return "htdemucs_ft";
	return "htdemucs_6s";
}
function makeClip(name, sampleRate, channels) {
	return {
		name,
		sampleRate,
		channels,
		duration: (channels[0]?.length ?? 0) / sampleRate
	};
}
function stereoOf(clip) {
	const l = clip.channels[0] ?? /* @__PURE__ */ new Float32Array(0);
	return [l, clip.channels[1] ?? l];
}
//#endregion
export { normalizeStemModel as a, makeClip as i, STEM_MODELS as n, stereoOf as o, STEM_ORDER as r, STEM_LABEL as t };
