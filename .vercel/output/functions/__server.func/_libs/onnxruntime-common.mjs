import { t as __commonJSMin } from "../_runtime.mjs";
//#region node_modules/onnxruntime-common/dist/cjs/backend-impl.js
var require_backend_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.resolveBackendAndExecutionProviders = exports.registerBackend = void 0;
	var backends = /* @__PURE__ */ new Map();
	var backendsSortedByPriority = [];
	/**
	* Register a backend.
	*
	* @param name - the name as a key to lookup as an execution provider.
	* @param backend - the backend object.
	* @param priority - an integer indicating the priority of the backend. Higher number means higher priority. if priority
	* < 0, it will be considered as a 'beta' version and will not be used as a fallback backend by default.
	*
	* @ignore
	*/
	var registerBackend = (name, backend, priority) => {
		if (backend && typeof backend.init === "function" && typeof backend.createInferenceSessionHandler === "function") {
			const currentBackend = backends.get(name);
			if (currentBackend === void 0) backends.set(name, {
				backend,
				priority
			});
			else if (currentBackend.priority > priority) return;
			else if (currentBackend.priority === priority) {
				if (currentBackend.backend !== backend) throw new Error(`cannot register backend "${name}" using priority ${priority}`);
			}
			if (priority >= 0) {
				const i = backendsSortedByPriority.indexOf(name);
				if (i !== -1) backendsSortedByPriority.splice(i, 1);
				for (let i = 0; i < backendsSortedByPriority.length; i++) if (backends.get(backendsSortedByPriority[i]).priority <= priority) {
					backendsSortedByPriority.splice(i, 0, name);
					return;
				}
				backendsSortedByPriority.push(name);
			}
			return;
		}
		throw new TypeError("not a valid backend");
	};
	exports.registerBackend = registerBackend;
	/**
	* Try to resolve and initialize a backend.
	*
	* @param backendName - the name of the backend.
	* @returns the backend instance if resolved and initialized successfully, or an error message if failed.
	*/
	var tryResolveAndInitializeBackend = async (backendName) => {
		const backendInfo = backends.get(backendName);
		if (!backendInfo) return "backend not found.";
		if (backendInfo.initialized) return backendInfo.backend;
		else if (backendInfo.aborted) return backendInfo.error;
		else {
			const isInitializing = !!backendInfo.initPromise;
			try {
				if (!isInitializing) backendInfo.initPromise = backendInfo.backend.init(backendName);
				await backendInfo.initPromise;
				backendInfo.initialized = true;
				return backendInfo.backend;
			} catch (e) {
				if (!isInitializing) {
					backendInfo.error = `${e}`;
					backendInfo.aborted = true;
				}
				return backendInfo.error;
			} finally {
				delete backendInfo.initPromise;
			}
		}
	};
	/**
	* Resolve execution providers from the specific session options.
	*
	* @param options - the session options object.
	* @returns a promise that resolves to a tuple of an initialized backend instance and a session options object with
	* filtered EP list.
	*
	* @ignore
	*/
	var resolveBackendAndExecutionProviders = async (options) => {
		const eps = options.executionProviders || [];
		const backendHints = eps.map((i) => typeof i === "string" ? i : i.name);
		const backendNames = backendHints.length === 0 ? backendsSortedByPriority : backendHints;
		let backend;
		const errors = [];
		const availableBackendNames = /* @__PURE__ */ new Set();
		for (const backendName of backendNames) {
			const resolveResult = await tryResolveAndInitializeBackend(backendName);
			if (typeof resolveResult === "string") errors.push({
				name: backendName,
				err: resolveResult
			});
			else {
				if (!backend) backend = resolveResult;
				if (backend === resolveResult) availableBackendNames.add(backendName);
			}
		}
		if (!backend) throw new Error(`no available backend found. ERR: ${errors.map((e) => `[${e.name}] ${e.err}`).join(", ")}`);
		for (const { name, err } of errors) if (backendHints.includes(name)) console.warn(`removing requested execution provider "${name}" from session options because it is not available: ${err}`);
		const filteredEps = eps.filter((i) => availableBackendNames.has(typeof i === "string" ? i : i.name));
		return [backend, new Proxy(options, { get: (target, prop) => {
			if (prop === "executionProviders") return filteredEps;
			return Reflect.get(target, prop);
		} })];
	};
	exports.resolveBackendAndExecutionProviders = resolveBackendAndExecutionProviders;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/backend.js
var require_backend = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.registerBackend = void 0;
	var backend_impl_js_1 = require_backend_impl();
	Object.defineProperty(exports, "registerBackend", {
		enumerable: true,
		get: function() {
			return backend_impl_js_1.registerBackend;
		}
	});
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/version.js
var require_version = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.version = void 0;
	exports.version = "1.18.0";
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/env-impl.js
var require_env_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.env = void 0;
	var version_js_1 = require_version();
	var logLevelValue = "warning";
	exports.env = {
		wasm: {},
		webgl: {},
		webgpu: {},
		versions: { common: version_js_1.version },
		set logLevel(value) {
			if (value === void 0) return;
			if (typeof value !== "string" || [
				"verbose",
				"info",
				"warning",
				"error",
				"fatal"
			].indexOf(value) === -1) throw new Error(`Unsupported logging level: ${value}`);
			logLevelValue = value;
		},
		get logLevel() {
			return logLevelValue;
		}
	};
	Object.defineProperty(exports.env, "logLevel", { enumerable: true });
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/env.js
var require_env = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.env = void 0;
	/**
	* Represent a set of flags as a global singleton.
	*/
	exports.env = require_env_impl().env;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor-conversion-impl.js
var require_tensor_conversion_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.tensorToImageData = exports.tensorToDataURL = void 0;
	/**
	* implementation of Tensor.toDataURL()
	*/
	var tensorToDataURL = (tensor, options) => {
		const canvas = typeof document !== "undefined" ? document.createElement("canvas") : new OffscreenCanvas(1, 1);
		canvas.width = tensor.dims[3];
		canvas.height = tensor.dims[2];
		const pixels2DContext = canvas.getContext("2d");
		if (pixels2DContext != null) {
			let width;
			let height;
			if (options?.tensorLayout !== void 0 && options.tensorLayout === "NHWC") {
				width = tensor.dims[2];
				height = tensor.dims[3];
			} else {
				width = tensor.dims[3];
				height = tensor.dims[2];
			}
			const inputformat = options?.format !== void 0 ? options.format : "RGB";
			const norm = options?.norm;
			let normMean;
			let normBias;
			if (norm === void 0 || norm.mean === void 0) normMean = [
				255,
				255,
				255,
				255
			];
			else if (typeof norm.mean === "number") normMean = [
				norm.mean,
				norm.mean,
				norm.mean,
				norm.mean
			];
			else {
				normMean = [
					norm.mean[0],
					norm.mean[1],
					norm.mean[2],
					0
				];
				if (norm.mean[3] !== void 0) normMean[3] = norm.mean[3];
			}
			if (norm === void 0 || norm.bias === void 0) normBias = [
				0,
				0,
				0,
				0
			];
			else if (typeof norm.bias === "number") normBias = [
				norm.bias,
				norm.bias,
				norm.bias,
				norm.bias
			];
			else {
				normBias = [
					norm.bias[0],
					norm.bias[1],
					norm.bias[2],
					0
				];
				if (norm.bias[3] !== void 0) normBias[3] = norm.bias[3];
			}
			const stride = height * width;
			let rTensorPointer = 0, gTensorPointer = stride, bTensorPointer = stride * 2, aTensorPointer = -1;
			if (inputformat === "RGBA") {
				rTensorPointer = 0;
				gTensorPointer = stride;
				bTensorPointer = stride * 2;
				aTensorPointer = stride * 3;
			} else if (inputformat === "RGB") {
				rTensorPointer = 0;
				gTensorPointer = stride;
				bTensorPointer = stride * 2;
			} else if (inputformat === "RBG") {
				rTensorPointer = 0;
				bTensorPointer = stride;
				gTensorPointer = stride * 2;
			}
			for (let i = 0; i < height; i++) for (let j = 0; j < width; j++) {
				const R = (tensor.data[rTensorPointer++] - normBias[0]) * normMean[0];
				const G = (tensor.data[gTensorPointer++] - normBias[1]) * normMean[1];
				const B = (tensor.data[bTensorPointer++] - normBias[2]) * normMean[2];
				const A = aTensorPointer === -1 ? 255 : (tensor.data[aTensorPointer++] - normBias[3]) * normMean[3];
				pixels2DContext.fillStyle = "rgba(" + R + "," + G + "," + B + "," + A + ")";
				pixels2DContext.fillRect(j, i, 1, 1);
			}
			if ("toDataURL" in canvas) return canvas.toDataURL();
			else throw new Error("toDataURL is not supported");
		} else throw new Error("Can not access image data");
	};
	exports.tensorToDataURL = tensorToDataURL;
	/**
	* implementation of Tensor.toImageData()
	*/
	var tensorToImageData = (tensor, options) => {
		const pixels2DContext = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : new OffscreenCanvas(1, 1).getContext("2d");
		let image;
		if (pixels2DContext != null) {
			let width;
			let height;
			let channels;
			if (options?.tensorLayout !== void 0 && options.tensorLayout === "NHWC") {
				width = tensor.dims[2];
				height = tensor.dims[1];
				channels = tensor.dims[3];
			} else {
				width = tensor.dims[3];
				height = tensor.dims[2];
				channels = tensor.dims[1];
			}
			const inputformat = options !== void 0 ? options.format !== void 0 ? options.format : "RGB" : "RGB";
			const norm = options?.norm;
			let normMean;
			let normBias;
			if (norm === void 0 || norm.mean === void 0) normMean = [
				255,
				255,
				255,
				255
			];
			else if (typeof norm.mean === "number") normMean = [
				norm.mean,
				norm.mean,
				norm.mean,
				norm.mean
			];
			else {
				normMean = [
					norm.mean[0],
					norm.mean[1],
					norm.mean[2],
					255
				];
				if (norm.mean[3] !== void 0) normMean[3] = norm.mean[3];
			}
			if (norm === void 0 || norm.bias === void 0) normBias = [
				0,
				0,
				0,
				0
			];
			else if (typeof norm.bias === "number") normBias = [
				norm.bias,
				norm.bias,
				norm.bias,
				norm.bias
			];
			else {
				normBias = [
					norm.bias[0],
					norm.bias[1],
					norm.bias[2],
					0
				];
				if (norm.bias[3] !== void 0) normBias[3] = norm.bias[3];
			}
			const stride = height * width;
			if (options !== void 0) {
				if (options.format !== void 0 && channels === 4 && options.format !== "RGBA" || channels === 3 && options.format !== "RGB" && options.format !== "BGR") throw new Error("Tensor format doesn't match input tensor dims");
			}
			const step = 4;
			let rImagePointer = 0, gImagePointer = 1, bImagePointer = 2, aImagePointer = 3;
			let rTensorPointer = 0, gTensorPointer = stride, bTensorPointer = stride * 2, aTensorPointer = -1;
			if (inputformat === "RGBA") {
				rTensorPointer = 0;
				gTensorPointer = stride;
				bTensorPointer = stride * 2;
				aTensorPointer = stride * 3;
			} else if (inputformat === "RGB") {
				rTensorPointer = 0;
				gTensorPointer = stride;
				bTensorPointer = stride * 2;
			} else if (inputformat === "RBG") {
				rTensorPointer = 0;
				bTensorPointer = stride;
				gTensorPointer = stride * 2;
			}
			image = pixels2DContext.createImageData(width, height);
			for (let i = 0; i < height * width; rImagePointer += step, gImagePointer += step, bImagePointer += step, aImagePointer += step, i++) {
				image.data[rImagePointer] = (tensor.data[rTensorPointer++] - normBias[0]) * normMean[0];
				image.data[gImagePointer] = (tensor.data[gTensorPointer++] - normBias[1]) * normMean[1];
				image.data[bImagePointer] = (tensor.data[bTensorPointer++] - normBias[2]) * normMean[2];
				image.data[aImagePointer] = aTensorPointer === -1 ? 255 : (tensor.data[aTensorPointer++] - normBias[3]) * normMean[3];
			}
		} else throw new Error("Can not access image data");
		return image;
	};
	exports.tensorToImageData = tensorToImageData;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor-factory-impl.js
var require_tensor_factory_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.tensorFromPinnedBuffer = exports.tensorFromGpuBuffer = exports.tensorFromTexture = exports.tensorFromImage = exports.bufferToTensor = void 0;
	var tensor_impl_js_1 = require_tensor_impl();
	/**
	* Create a new tensor object from image object
	*
	* @param buffer - Extracted image buffer data - assuming RGBA format
	* @param imageFormat - input image configuration - required configurations height, width, format
	* @param tensorFormat - output tensor configuration - Default is RGB format
	*/
	var bufferToTensor = (buffer, options) => {
		if (buffer === void 0) throw new Error("Image buffer must be defined");
		if (options.height === void 0 || options.width === void 0) throw new Error("Image height and width must be defined");
		if (options.tensorLayout === "NHWC") throw new Error("NHWC Tensor layout is not supported yet");
		const { height, width } = options;
		const norm = options.norm ?? {
			mean: 255,
			bias: 0
		};
		let normMean;
		let normBias;
		if (typeof norm.mean === "number") normMean = [
			norm.mean,
			norm.mean,
			norm.mean,
			norm.mean
		];
		else normMean = [
			norm.mean[0],
			norm.mean[1],
			norm.mean[2],
			norm.mean[3] ?? 255
		];
		if (typeof norm.bias === "number") normBias = [
			norm.bias,
			norm.bias,
			norm.bias,
			norm.bias
		];
		else normBias = [
			norm.bias[0],
			norm.bias[1],
			norm.bias[2],
			norm.bias[3] ?? 0
		];
		const inputformat = options.format !== void 0 ? options.format : "RGBA";
		const outputformat = options.tensorFormat !== void 0 ? options.tensorFormat !== void 0 ? options.tensorFormat : "RGB" : "RGB";
		const stride = height * width;
		const float32Data = outputformat === "RGBA" ? new Float32Array(stride * 4) : new Float32Array(stride * 3);
		let step = 4, rImagePointer = 0, gImagePointer = 1, bImagePointer = 2, aImagePointer = 3;
		let rTensorPointer = 0, gTensorPointer = stride, bTensorPointer = stride * 2, aTensorPointer = -1;
		if (inputformat === "RGB") {
			step = 3;
			rImagePointer = 0;
			gImagePointer = 1;
			bImagePointer = 2;
			aImagePointer = -1;
		}
		if (outputformat === "RGBA") aTensorPointer = stride * 3;
		else if (outputformat === "RBG") {
			rTensorPointer = 0;
			bTensorPointer = stride;
			gTensorPointer = stride * 2;
		} else if (outputformat === "BGR") {
			bTensorPointer = 0;
			gTensorPointer = stride;
			rTensorPointer = stride * 2;
		}
		for (let i = 0; i < stride; i++, rImagePointer += step, bImagePointer += step, gImagePointer += step, aImagePointer += step) {
			float32Data[rTensorPointer++] = (buffer[rImagePointer] + normBias[0]) / normMean[0];
			float32Data[gTensorPointer++] = (buffer[gImagePointer] + normBias[1]) / normMean[1];
			float32Data[bTensorPointer++] = (buffer[bImagePointer] + normBias[2]) / normMean[2];
			if (aTensorPointer !== -1 && aImagePointer !== -1) float32Data[aTensorPointer++] = (buffer[aImagePointer] + normBias[3]) / normMean[3];
		}
		return outputformat === "RGBA" ? new tensor_impl_js_1.Tensor("float32", float32Data, [
			1,
			4,
			height,
			width
		]) : new tensor_impl_js_1.Tensor("float32", float32Data, [
			1,
			3,
			height,
			width
		]);
	};
	exports.bufferToTensor = bufferToTensor;
	/**
	* implementation of Tensor.fromImage().
	*/
	var tensorFromImage = async (image, options) => {
		const isHTMLImageEle = typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement;
		const isImageDataEle = typeof ImageData !== "undefined" && image instanceof ImageData;
		const isImageBitmap = typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap;
		const isString = typeof image === "string";
		let data;
		let bufferToTensorOptions = options ?? {};
		const createCanvas = () => {
			if (typeof document !== "undefined") return document.createElement("canvas");
			else if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(1, 1);
			else throw new Error("Canvas is not supported");
		};
		const createCanvasContext = (canvas) => {
			if (canvas instanceof HTMLCanvasElement) return canvas.getContext("2d");
			else if (canvas instanceof OffscreenCanvas) return canvas.getContext("2d");
			else return null;
		};
		if (isHTMLImageEle) {
			const canvas = createCanvas();
			canvas.width = image.width;
			canvas.height = image.height;
			const pixels2DContext = createCanvasContext(canvas);
			if (pixels2DContext != null) {
				let height = image.height;
				let width = image.width;
				if (options !== void 0 && options.resizedHeight !== void 0 && options.resizedWidth !== void 0) {
					height = options.resizedHeight;
					width = options.resizedWidth;
				}
				if (options !== void 0) {
					bufferToTensorOptions = options;
					if (options.tensorFormat !== void 0) throw new Error("Image input config format must be RGBA for HTMLImageElement");
					else bufferToTensorOptions.tensorFormat = "RGBA";
					bufferToTensorOptions.height = height;
					bufferToTensorOptions.width = width;
				} else {
					bufferToTensorOptions.tensorFormat = "RGBA";
					bufferToTensorOptions.height = height;
					bufferToTensorOptions.width = width;
				}
				pixels2DContext.drawImage(image, 0, 0);
				data = pixels2DContext.getImageData(0, 0, width, height).data;
			} else throw new Error("Can not access image data");
		} else if (isImageDataEle) {
			let height;
			let width;
			if (options !== void 0 && options.resizedWidth !== void 0 && options.resizedHeight !== void 0) {
				height = options.resizedHeight;
				width = options.resizedWidth;
			} else {
				height = image.height;
				width = image.width;
			}
			if (options !== void 0) bufferToTensorOptions = options;
			bufferToTensorOptions.format = "RGBA";
			bufferToTensorOptions.height = height;
			bufferToTensorOptions.width = width;
			if (options !== void 0) {
				const tempCanvas = createCanvas();
				tempCanvas.width = width;
				tempCanvas.height = height;
				const pixels2DContext = createCanvasContext(tempCanvas);
				if (pixels2DContext != null) {
					pixels2DContext.putImageData(image, 0, 0);
					data = pixels2DContext.getImageData(0, 0, width, height).data;
				} else throw new Error("Can not access image data");
			} else data = image.data;
		} else if (isImageBitmap) {
			if (options === void 0) throw new Error("Please provide image config with format for Imagebitmap");
			const canvas = createCanvas();
			canvas.width = image.width;
			canvas.height = image.height;
			const pixels2DContext = createCanvasContext(canvas);
			if (pixels2DContext != null) {
				const height = image.height;
				const width = image.width;
				pixels2DContext.drawImage(image, 0, 0, width, height);
				data = pixels2DContext.getImageData(0, 0, width, height).data;
				bufferToTensorOptions.height = height;
				bufferToTensorOptions.width = width;
				return (0, exports.bufferToTensor)(data, bufferToTensorOptions);
			} else throw new Error("Can not access image data");
		} else if (isString) return new Promise((resolve, reject) => {
			const canvas = createCanvas();
			const context = createCanvasContext(canvas);
			if (!image || !context) return reject();
			const newImage = new Image();
			newImage.crossOrigin = "Anonymous";
			newImage.src = image;
			newImage.onload = () => {
				canvas.width = newImage.width;
				canvas.height = newImage.height;
				context.drawImage(newImage, 0, 0, canvas.width, canvas.height);
				const img = context.getImageData(0, 0, canvas.width, canvas.height);
				bufferToTensorOptions.height = canvas.height;
				bufferToTensorOptions.width = canvas.width;
				resolve((0, exports.bufferToTensor)(img.data, bufferToTensorOptions));
			};
		});
		else throw new Error("Input data provided is not supported - aborted tensor creation");
		if (data !== void 0) return (0, exports.bufferToTensor)(data, bufferToTensorOptions);
		else throw new Error("Input data provided is not supported - aborted tensor creation");
	};
	exports.tensorFromImage = tensorFromImage;
	/**
	* implementation of Tensor.fromTexture().
	*/
	var tensorFromTexture = (texture, options) => {
		const { width, height, download, dispose } = options;
		const dims = [
			1,
			height,
			width,
			4
		];
		return new tensor_impl_js_1.Tensor({
			location: "texture",
			type: "float32",
			texture,
			dims,
			download,
			dispose
		});
	};
	exports.tensorFromTexture = tensorFromTexture;
	/**
	* implementation of Tensor.fromGpuBuffer().
	*/
	var tensorFromGpuBuffer = (gpuBuffer, options) => {
		const { dataType, dims, download, dispose } = options;
		return new tensor_impl_js_1.Tensor({
			location: "gpu-buffer",
			type: dataType ?? "float32",
			gpuBuffer,
			dims,
			download,
			dispose
		});
	};
	exports.tensorFromGpuBuffer = tensorFromGpuBuffer;
	/**
	* implementation of Tensor.fromPinnedBuffer().
	*/
	var tensorFromPinnedBuffer = (type, buffer, dims) => new tensor_impl_js_1.Tensor({
		location: "cpu-pinned",
		type,
		data: buffer,
		dims: dims ?? [buffer.length]
	});
	exports.tensorFromPinnedBuffer = tensorFromPinnedBuffer;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor-impl-type-mapping.js
var require_tensor_impl_type_mapping = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.checkTypedArray = exports.NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP = exports.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP = void 0;
	exports.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP = /* @__PURE__ */ new Map([
		["float32", Float32Array],
		["uint8", Uint8Array],
		["int8", Int8Array],
		["uint16", Uint16Array],
		["int16", Int16Array],
		["int32", Int32Array],
		["bool", Uint8Array],
		["float64", Float64Array],
		["uint32", Uint32Array]
	]);
	exports.NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP = /* @__PURE__ */ new Map([
		[Float32Array, "float32"],
		[Uint8Array, "uint8"],
		[Int8Array, "int8"],
		[Uint16Array, "uint16"],
		[Int16Array, "int16"],
		[Int32Array, "int32"],
		[Float64Array, "float64"],
		[Uint32Array, "uint32"]
	]);
	var isTypedArrayChecked = false;
	var checkTypedArray = () => {
		if (!isTypedArrayChecked) {
			isTypedArrayChecked = true;
			const isBigInt64ArrayAvailable = typeof BigInt64Array !== "undefined" && BigInt64Array.from;
			const isBigUint64ArrayAvailable = typeof BigUint64Array !== "undefined" && BigUint64Array.from;
			const isFloat16ArrayAvailable = typeof Float16Array !== "undefined" && Float16Array.from;
			if (isBigInt64ArrayAvailable) {
				exports.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("int64", BigInt64Array);
				exports.NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(BigInt64Array, "int64");
			}
			if (isBigUint64ArrayAvailable) {
				exports.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("uint64", BigUint64Array);
				exports.NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(BigUint64Array, "uint64");
			}
			if (isFloat16ArrayAvailable) {
				exports.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("float16", Float16Array);
				exports.NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(Float16Array, "float16");
			} else exports.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("float16", Uint16Array);
		}
	};
	exports.checkTypedArray = checkTypedArray;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor-utils-impl.js
var require_tensor_utils_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.tensorReshape = exports.calculateSize = void 0;
	var tensor_impl_js_1 = require_tensor_impl();
	/**
	* calculate size from dims.
	*
	* @param dims the dims array. May be an illegal input.
	*/
	var calculateSize = (dims) => {
		let size = 1;
		for (let i = 0; i < dims.length; i++) {
			const dim = dims[i];
			if (typeof dim !== "number" || !Number.isSafeInteger(dim)) throw new TypeError(`dims[${i}] must be an integer, got: ${dim}`);
			if (dim < 0) throw new RangeError(`dims[${i}] must be a non-negative integer, got: ${dim}`);
			size *= dim;
		}
		return size;
	};
	exports.calculateSize = calculateSize;
	/**
	* implementation of Tensor.reshape()
	*/
	var tensorReshape = (tensor, dims) => {
		switch (tensor.location) {
			case "cpu": return new tensor_impl_js_1.Tensor(tensor.type, tensor.data, dims);
			case "cpu-pinned": return new tensor_impl_js_1.Tensor({
				location: "cpu-pinned",
				data: tensor.data,
				type: tensor.type,
				dims
			});
			case "texture": return new tensor_impl_js_1.Tensor({
				location: "texture",
				texture: tensor.texture,
				type: tensor.type,
				dims
			});
			case "gpu-buffer": return new tensor_impl_js_1.Tensor({
				location: "gpu-buffer",
				gpuBuffer: tensor.gpuBuffer,
				type: tensor.type,
				dims
			});
			default: throw new Error(`tensorReshape: tensor location ${tensor.location} is not supported`);
		}
	};
	exports.tensorReshape = tensorReshape;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor-impl.js
var require_tensor_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Tensor = void 0;
	var tensor_conversion_impl_js_1 = require_tensor_conversion_impl();
	var tensor_factory_impl_js_1 = require_tensor_factory_impl();
	var tensor_impl_type_mapping_js_1 = require_tensor_impl_type_mapping();
	var tensor_utils_impl_js_1 = require_tensor_utils_impl();
	/**
	* the implementation of Tensor interface.
	*
	* @ignore
	*/
	var Tensor = class {
		/**
		* implementation.
		*/
		constructor(arg0, arg1, arg2) {
			(0, tensor_impl_type_mapping_js_1.checkTypedArray)();
			let type;
			let dims;
			if (typeof arg0 === "object" && "location" in arg0) {
				this.dataLocation = arg0.location;
				type = arg0.type;
				dims = arg0.dims;
				switch (arg0.location) {
					case "cpu-pinned": {
						const expectedTypedArrayConstructor = tensor_impl_type_mapping_js_1.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.get(type);
						if (!expectedTypedArrayConstructor) throw new TypeError(`unsupported type "${type}" to create tensor from pinned buffer`);
						if (!(arg0.data instanceof expectedTypedArrayConstructor)) throw new TypeError(`buffer should be of type ${expectedTypedArrayConstructor.name}`);
						this.cpuData = arg0.data;
						break;
					}
					case "texture":
						if (type !== "float32") throw new TypeError(`unsupported type "${type}" to create tensor from texture`);
						this.gpuTextureData = arg0.texture;
						this.downloader = arg0.download;
						this.disposer = arg0.dispose;
						break;
					case "gpu-buffer":
						if (type !== "float32" && type !== "float16" && type !== "int32" && type !== "int64" && type !== "uint32" && type !== "uint8" && type !== "bool") throw new TypeError(`unsupported type "${type}" to create tensor from gpu buffer`);
						this.gpuBufferData = arg0.gpuBuffer;
						this.downloader = arg0.download;
						this.disposer = arg0.dispose;
						break;
					default: throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`);
				}
			} else {
				let data;
				let maybeDims;
				if (typeof arg0 === "string") {
					type = arg0;
					maybeDims = arg2;
					if (arg0 === "string") {
						if (!Array.isArray(arg1)) throw new TypeError("A string tensor's data must be a string array.");
						data = arg1;
					} else {
						const typedArrayConstructor = tensor_impl_type_mapping_js_1.NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.get(arg0);
						if (typedArrayConstructor === void 0) throw new TypeError(`Unsupported tensor type: ${arg0}.`);
						if (Array.isArray(arg1)) {
							if (arg0 === "float16" && typedArrayConstructor === Uint16Array) throw new TypeError("Creating a float16 tensor from number array is not supported. Please use Uint16Array as data.");
							else if (arg0 === "uint64" || arg0 === "int64") data = typedArrayConstructor.from(arg1, BigInt);
							else data = typedArrayConstructor.from(arg1);
						} else if (arg1 instanceof typedArrayConstructor) data = arg1;
						else throw new TypeError(`A ${type} tensor's data must be type of ${typedArrayConstructor}`);
					}
				} else {
					maybeDims = arg1;
					if (Array.isArray(arg0)) {
						if (arg0.length === 0) throw new TypeError("Tensor type cannot be inferred from an empty array.");
						const firstElementType = typeof arg0[0];
						if (firstElementType === "string") {
							type = "string";
							data = arg0;
						} else if (firstElementType === "boolean") {
							type = "bool";
							data = Uint8Array.from(arg0);
						} else throw new TypeError(`Invalid element type of data array: ${firstElementType}.`);
					} else {
						const mappedType = tensor_impl_type_mapping_js_1.NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.get(arg0.constructor);
						if (mappedType === void 0) throw new TypeError(`Unsupported type for tensor data: ${arg0.constructor}.`);
						type = mappedType;
						data = arg0;
					}
				}
				if (maybeDims === void 0) maybeDims = [data.length];
				else if (!Array.isArray(maybeDims)) throw new TypeError("A tensor's dims must be a number array");
				dims = maybeDims;
				this.cpuData = data;
				this.dataLocation = "cpu";
			}
			const size = (0, tensor_utils_impl_js_1.calculateSize)(dims);
			if (this.cpuData && size !== this.cpuData.length) throw new Error(`Tensor's size(${size}) does not match data length(${this.cpuData.length}).`);
			this.type = type;
			this.dims = dims;
			this.size = size;
		}
		static async fromImage(image, options) {
			return (0, tensor_factory_impl_js_1.tensorFromImage)(image, options);
		}
		static fromTexture(texture, options) {
			return (0, tensor_factory_impl_js_1.tensorFromTexture)(texture, options);
		}
		static fromGpuBuffer(gpuBuffer, options) {
			return (0, tensor_factory_impl_js_1.tensorFromGpuBuffer)(gpuBuffer, options);
		}
		static fromPinnedBuffer(type, buffer, dims) {
			return (0, tensor_factory_impl_js_1.tensorFromPinnedBuffer)(type, buffer, dims);
		}
		toDataURL(options) {
			return (0, tensor_conversion_impl_js_1.tensorToDataURL)(this, options);
		}
		toImageData(options) {
			return (0, tensor_conversion_impl_js_1.tensorToImageData)(this, options);
		}
		get data() {
			this.ensureValid();
			if (!this.cpuData) throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");
			return this.cpuData;
		}
		get location() {
			return this.dataLocation;
		}
		get texture() {
			this.ensureValid();
			if (!this.gpuTextureData) throw new Error("The data is not stored as a WebGL texture.");
			return this.gpuTextureData;
		}
		get gpuBuffer() {
			this.ensureValid();
			if (!this.gpuBufferData) throw new Error("The data is not stored as a WebGPU buffer.");
			return this.gpuBufferData;
		}
		async getData(releaseData) {
			this.ensureValid();
			switch (this.dataLocation) {
				case "cpu":
				case "cpu-pinned": return this.data;
				case "texture":
				case "gpu-buffer":
					if (!this.downloader) throw new Error("The current tensor is not created with a specified data downloader.");
					if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
					try {
						this.isDownloading = true;
						const data = await this.downloader();
						this.downloader = void 0;
						this.dataLocation = "cpu";
						this.cpuData = data;
						if (releaseData && this.disposer) {
							this.disposer();
							this.disposer = void 0;
						}
						return data;
					} finally {
						this.isDownloading = false;
					}
				default: throw new Error(`cannot get data from location: ${this.dataLocation}`);
			}
		}
		dispose() {
			if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
			if (this.disposer) {
				this.disposer();
				this.disposer = void 0;
			}
			this.cpuData = void 0;
			this.gpuTextureData = void 0;
			this.gpuBufferData = void 0;
			this.downloader = void 0;
			this.isDownloading = void 0;
			this.dataLocation = "none";
		}
		ensureValid() {
			if (this.dataLocation === "none") throw new Error("The tensor is disposed.");
		}
		reshape(dims) {
			this.ensureValid();
			if (this.downloader || this.disposer) throw new Error("Cannot reshape a tensor that owns GPU resource.");
			return (0, tensor_utils_impl_js_1.tensorReshape)(this, dims);
		}
	};
	exports.Tensor = Tensor;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor.js
var require_tensor = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Tensor = void 0;
	exports.Tensor = require_tensor_impl().Tensor;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/trace.js
var require_trace = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TRACE_FUNC_END = exports.TRACE_FUNC_BEGIN = exports.TRACE = void 0;
	var env_impl_js_1 = require_env_impl();
	/**
	* @ignore
	*/
	var TRACE = (deviceType, label) => {
		if (typeof env_impl_js_1.env.trace === "undefined" ? !env_impl_js_1.env.wasm.trace : !env_impl_js_1.env.trace) return;
		console.timeStamp(`${deviceType}::ORT::${label}`);
	};
	exports.TRACE = TRACE;
	var TRACE_FUNC = (msg, extraMsg) => {
		const stack = (/* @__PURE__ */ new Error()).stack?.split(/\r\n|\r|\n/g) || [];
		let hasTraceFunc = false;
		for (let i = 0; i < stack.length; i++) {
			if (hasTraceFunc && !stack[i].includes("TRACE_FUNC")) {
				let label = `FUNC_${msg}::${stack[i].trim().split(" ")[1]}`;
				if (extraMsg) label += `::${extraMsg}`;
				(0, exports.TRACE)("CPU", label);
				return;
			}
			if (stack[i].includes("TRACE_FUNC")) hasTraceFunc = true;
		}
	};
	/**
	* @ignore
	*/
	var TRACE_FUNC_BEGIN = (extraMsg) => {
		if (typeof env_impl_js_1.env.trace === "undefined" ? !env_impl_js_1.env.wasm.trace : !env_impl_js_1.env.trace) return;
		TRACE_FUNC("BEGIN", extraMsg);
	};
	exports.TRACE_FUNC_BEGIN = TRACE_FUNC_BEGIN;
	/**
	* @ignore
	*/
	var TRACE_FUNC_END = (extraMsg) => {
		if (typeof env_impl_js_1.env.trace === "undefined" ? !env_impl_js_1.env.wasm.trace : !env_impl_js_1.env.trace) return;
		TRACE_FUNC("END", extraMsg);
	};
	exports.TRACE_FUNC_END = TRACE_FUNC_END;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/inference-session-impl.js
var require_inference_session_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.InferenceSession = void 0;
	var backend_impl_js_1 = require_backend_impl();
	var tensor_js_1 = require_tensor();
	var trace_js_1 = require_trace();
	exports.InferenceSession = class InferenceSession {
		constructor(handler) {
			this.handler = handler;
		}
		async run(feeds, arg1, arg2) {
			(0, trace_js_1.TRACE_FUNC_BEGIN)();
			const fetches = {};
			let options = {};
			if (typeof feeds !== "object" || feeds === null || feeds instanceof tensor_js_1.Tensor || Array.isArray(feeds)) throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
			let isFetchesEmpty = true;
			if (typeof arg1 === "object") {
				if (arg1 === null) throw new TypeError("Unexpected argument[1]: cannot be null.");
				if (arg1 instanceof tensor_js_1.Tensor) throw new TypeError("'fetches' cannot be a Tensor");
				if (Array.isArray(arg1)) {
					if (arg1.length === 0) throw new TypeError("'fetches' cannot be an empty array.");
					isFetchesEmpty = false;
					for (const name of arg1) {
						if (typeof name !== "string") throw new TypeError("'fetches' must be a string array or an object.");
						if (this.outputNames.indexOf(name) === -1) throw new RangeError(`'fetches' contains invalid output name: ${name}.`);
						fetches[name] = null;
					}
					if (typeof arg2 === "object" && arg2 !== null) options = arg2;
					else if (typeof arg2 !== "undefined") throw new TypeError("'options' must be an object.");
				} else {
					let isFetches = false;
					const arg1Keys = Object.getOwnPropertyNames(arg1);
					for (const name of this.outputNames) if (arg1Keys.indexOf(name) !== -1) {
						const v = arg1[name];
						if (v === null || v instanceof tensor_js_1.Tensor) {
							isFetches = true;
							isFetchesEmpty = false;
							fetches[name] = v;
						}
					}
					if (isFetches) {
						if (typeof arg2 === "object" && arg2 !== null) options = arg2;
						else if (typeof arg2 !== "undefined") throw new TypeError("'options' must be an object.");
					} else options = arg1;
				}
			} else if (typeof arg1 !== "undefined") throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
			for (const name of this.inputNames) if (typeof feeds[name] === "undefined") throw new Error(`input '${name}' is missing in 'feeds'.`);
			if (isFetchesEmpty) for (const name of this.outputNames) fetches[name] = null;
			const results = await this.handler.run(feeds, fetches, options);
			const returnValue = {};
			for (const key in results) if (Object.hasOwnProperty.call(results, key)) {
				const result = results[key];
				if (result instanceof tensor_js_1.Tensor) returnValue[key] = result;
				else returnValue[key] = new tensor_js_1.Tensor(result.type, result.data, result.dims);
			}
			(0, trace_js_1.TRACE_FUNC_END)();
			return returnValue;
		}
		async release() {
			return this.handler.dispose();
		}
		static async create(arg0, arg1, arg2, arg3) {
			(0, trace_js_1.TRACE_FUNC_BEGIN)();
			let filePathOrUint8Array;
			let options = {};
			if (typeof arg0 === "string") {
				filePathOrUint8Array = arg0;
				if (typeof arg1 === "object" && arg1 !== null) options = arg1;
				else if (typeof arg1 !== "undefined") throw new TypeError("'options' must be an object.");
			} else if (arg0 instanceof Uint8Array) {
				filePathOrUint8Array = arg0;
				if (typeof arg1 === "object" && arg1 !== null) options = arg1;
				else if (typeof arg1 !== "undefined") throw new TypeError("'options' must be an object.");
			} else if (arg0 instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && arg0 instanceof SharedArrayBuffer) {
				const buffer = arg0;
				let byteOffset = 0;
				let byteLength = arg0.byteLength;
				if (typeof arg1 === "object" && arg1 !== null) options = arg1;
				else if (typeof arg1 === "number") {
					byteOffset = arg1;
					if (!Number.isSafeInteger(byteOffset)) throw new RangeError("'byteOffset' must be an integer.");
					if (byteOffset < 0 || byteOffset >= buffer.byteLength) throw new RangeError(`'byteOffset' is out of range [0, ${buffer.byteLength}).`);
					byteLength = arg0.byteLength - byteOffset;
					if (typeof arg2 === "number") {
						byteLength = arg2;
						if (!Number.isSafeInteger(byteLength)) throw new RangeError("'byteLength' must be an integer.");
						if (byteLength <= 0 || byteOffset + byteLength > buffer.byteLength) throw new RangeError(`'byteLength' is out of range (0, ${buffer.byteLength - byteOffset}].`);
						if (typeof arg3 === "object" && arg3 !== null) options = arg3;
						else if (typeof arg3 !== "undefined") throw new TypeError("'options' must be an object.");
					} else if (typeof arg2 !== "undefined") throw new TypeError("'byteLength' must be a number.");
				} else if (typeof arg1 !== "undefined") throw new TypeError("'options' must be an object.");
				filePathOrUint8Array = new Uint8Array(buffer, byteOffset, byteLength);
			} else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");
			const [backend, optionsWithValidatedEPs] = await (0, backend_impl_js_1.resolveBackendAndExecutionProviders)(options);
			const handler = await backend.createInferenceSessionHandler(filePathOrUint8Array, optionsWithValidatedEPs);
			(0, trace_js_1.TRACE_FUNC_END)();
			return new InferenceSession(handler);
		}
		startProfiling() {
			this.handler.startProfiling();
		}
		endProfiling() {
			this.handler.endProfiling();
		}
		get inputNames() {
			return this.handler.inputNames;
		}
		get outputNames() {
			return this.handler.outputNames;
		}
	};
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/inference-session.js
var require_inference_session = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.InferenceSession = void 0;
	exports.InferenceSession = require_inference_session_impl().InferenceSession;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor-conversion.js
var require_tensor_conversion = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/tensor-factory.js
var require_tensor_factory = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/onnx-model.js
var require_onnx_model = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/onnx-value.js
var require_onnx_value = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/training-session-impl.js
var require_training_session_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TrainingSession = void 0;
	var backend_impl_js_1 = require_backend_impl();
	var tensor_js_1 = require_tensor();
	var noBackendErrMsg = "Training backend could not be resolved. Make sure you're using the correct configuration & WebAssembly files.";
	exports.TrainingSession = class TrainingSession {
		constructor(handler, hasOptimizerModel, hasEvalModel) {
			this.handler = handler;
			this.hasOptimizerModel = hasOptimizerModel;
			this.hasEvalModel = hasEvalModel;
		}
		get trainingInputNames() {
			return this.handler.inputNames;
		}
		get trainingOutputNames() {
			return this.handler.outputNames;
		}
		get evalInputNames() {
			if (this.hasEvalModel) return this.handler.evalInputNames;
			else throw new Error("This training session has no evalModel loaded.");
		}
		get evalOutputNames() {
			if (this.hasEvalModel) return this.handler.evalOutputNames;
			else throw new Error("This training session has no evalModel loaded.");
		}
		static async create(trainingOptions, sessionOptions) {
			const evalModel = trainingOptions.evalModel || "";
			const optimizerModel = trainingOptions.optimizerModel || "";
			const options = sessionOptions || {};
			const [backend, optionsWithValidatedEPs] = await (0, backend_impl_js_1.resolveBackendAndExecutionProviders)(options);
			if (backend.createTrainingSessionHandler) {
				const handler = await backend.createTrainingSessionHandler(trainingOptions.checkpointState, trainingOptions.trainModel, evalModel, optimizerModel, optionsWithValidatedEPs);
				return new TrainingSession(handler, !!trainingOptions.optimizerModel, !!trainingOptions.evalModel);
			} else throw new Error(noBackendErrMsg);
		}
		/**
		* Helper function for runTrainStep and future runStep methods that handles the type-narrowing conversion from
		* the given parameters to SessionHandler.FetchesType and RunOptions.
		*
		* @param inputNames the feeds object is checked that they contain all input names in the provided list of input
		* names.
		* @param outputNames the fetches object is checked that their keys match up with valid names in the list of output
		* names.
		* @param feeds the required input
		* @param arg1 narrowed & converted into the SessionHandler.FetchesType or RunOptions object
		* @param arg2 optional RunOptions object.
		* @returns
		*/
		typeNarrowingForRunStep(inputNames, outputNames, feeds, arg1, arg2) {
			const fetches = {};
			let options = {};
			if (typeof feeds !== "object" || feeds === null || feeds instanceof tensor_js_1.Tensor || Array.isArray(feeds)) throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
			let isFetchesEmpty = true;
			if (typeof arg1 === "object") {
				if (arg1 === null) throw new TypeError("Unexpected argument[1]: cannot be null.");
				if (arg1 instanceof tensor_js_1.Tensor) throw new TypeError("'fetches' cannot be a Tensor");
				if (Array.isArray(arg1)) {
					if (arg1.length === 0) throw new TypeError("'fetches' cannot be an empty array.");
					isFetchesEmpty = false;
					for (const name of arg1) {
						if (typeof name !== "string") throw new TypeError("'fetches' must be a string array or an object.");
						if (outputNames.indexOf(name) === -1) throw new RangeError(`'fetches' contains invalid output name: ${name}.`);
						fetches[name] = null;
					}
					if (typeof arg2 === "object" && arg2 !== null) options = arg2;
					else if (typeof arg2 !== "undefined") throw new TypeError("'options' must be an object.");
				} else {
					let isFetches = false;
					const arg1Keys = Object.getOwnPropertyNames(arg1);
					for (const name of outputNames) if (arg1Keys.indexOf(name) !== -1) {
						const v = arg1[name];
						if (v === null || v instanceof tensor_js_1.Tensor) {
							isFetches = true;
							isFetchesEmpty = false;
							fetches[name] = v;
						}
					}
					if (isFetches) {
						if (typeof arg2 === "object" && arg2 !== null) options = arg2;
						else if (typeof arg2 !== "undefined") throw new TypeError("'options' must be an object.");
					} else options = arg1;
				}
			} else if (typeof arg1 !== "undefined") throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
			for (const name of inputNames) if (typeof feeds[name] === "undefined") throw new Error(`input '${name}' is missing in 'feeds'.`);
			if (isFetchesEmpty) for (const name of outputNames) fetches[name] = null;
			return [fetches, options];
		}
		/**
		* Helper method for runTrainStep and any other runStep methods. Takes the ReturnType result from the SessionHandler
		* and changes it into a map of Tensors.
		*
		* @param results
		* @returns
		*/
		convertHandlerReturnTypeToMapOfTensors(results) {
			const returnValue = {};
			for (const key in results) if (Object.hasOwnProperty.call(results, key)) {
				const result = results[key];
				if (result instanceof tensor_js_1.Tensor) returnValue[key] = result;
				else returnValue[key] = new tensor_js_1.Tensor(result.type, result.data, result.dims);
			}
			return returnValue;
		}
		async lazyResetGrad() {
			await this.handler.lazyResetGrad();
		}
		async runTrainStep(feeds, arg1, arg2) {
			const [fetches, options] = this.typeNarrowingForRunStep(this.trainingInputNames, this.trainingOutputNames, feeds, arg1, arg2);
			const results = await this.handler.runTrainStep(feeds, fetches, options);
			return this.convertHandlerReturnTypeToMapOfTensors(results);
		}
		async runOptimizerStep(options) {
			if (this.hasOptimizerModel) await this.handler.runOptimizerStep(options || {});
			else throw new Error("This TrainingSession has no OptimizerModel loaded.");
		}
		async runEvalStep(feeds, arg1, arg2) {
			if (this.hasEvalModel) {
				const [fetches, options] = this.typeNarrowingForRunStep(this.evalInputNames, this.evalOutputNames, feeds, arg1, arg2);
				const results = await this.handler.runEvalStep(feeds, fetches, options);
				return this.convertHandlerReturnTypeToMapOfTensors(results);
			} else throw new Error("This TrainingSession has no EvalModel loaded.");
		}
		async getParametersSize(trainableOnly = true) {
			return this.handler.getParametersSize(trainableOnly);
		}
		async loadParametersBuffer(array, trainableOnly = true) {
			const paramsSize = await this.getParametersSize(trainableOnly);
			if (array.length !== 4 * paramsSize) throw new Error("Size of the buffer passed into loadParametersBuffer must match the number of parameters in the model. Please use getParametersSize method to check.");
			return this.handler.loadParametersBuffer(array, trainableOnly);
		}
		async getContiguousParameters(trainableOnly = true) {
			return this.handler.getContiguousParameters(trainableOnly);
		}
		async release() {
			return this.handler.dispose();
		}
	};
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/training-session.js
var require_training_session = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TrainingSession = void 0;
	exports.TrainingSession = require_training_session_impl().TrainingSession;
}));
//#endregion
//#region node_modules/onnxruntime-common/dist/cjs/index.js
var require_cjs = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	/**
	* # ONNX Runtime JavaScript API
	*
	* ONNX Runtime JavaScript API is a unified API for all JavaScript usages, including the following NPM packages:
	*
	* - [onnxruntime-node](https://www.npmjs.com/package/onnxruntime-node)
	* - [onnxruntime-web](https://www.npmjs.com/package/onnxruntime-web)
	* - [onnxruntime-react-native](https://www.npmjs.com/package/onnxruntime-react-native)
	*
	* See also:
	* - [Get Started](https://onnxruntime.ai/docs/get-started/with-javascript/)
	* - [Inference examples](https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js)
	*
	* @packageDocumentation
	*/
	__exportStar(require_backend(), exports);
	__exportStar(require_env(), exports);
	__exportStar(require_inference_session(), exports);
	__exportStar(require_tensor(), exports);
	__exportStar(require_tensor_conversion(), exports);
	__exportStar(require_tensor_factory(), exports);
	__exportStar(require_trace(), exports);
	__exportStar(require_onnx_model(), exports);
	__exportStar(require_onnx_value(), exports);
	__exportStar(require_training_session(), exports);
}));
//#endregion
export { require_cjs as t };
