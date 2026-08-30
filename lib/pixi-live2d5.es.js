import { Assets, EventEmitter, ExtensionType, Matrix, ObservablePoint, Point, Transform, ViewContainer, extensions } from "pixi.js";
//#region src/cubism-common/constants.ts
var LOGICAL_WIDTH = 2;
var LOGICAL_HEIGHT = 2;
//#endregion
//#region src/config.ts
var LOG_LEVEL_VERBOSE = 0;
var LOG_LEVEL_WARNING = 1;
var LOG_LEVEL_ERROR = 2;
var LOG_LEVEL_NONE = 999;
var DEFAULT_VERSION = "dev";
var globalFlags = globalThis;
var isDev = typeof globalFlags.__DEV__ === "boolean" ? globalFlags.__DEV__ : false;
var version = typeof globalFlags.__VERSION__ === "string" ? globalFlags.__VERSION__ : DEFAULT_VERSION;
/**
* Global configs.
*/
var config = {
	LOG_LEVEL_VERBOSE,
	LOG_LEVEL_WARNING,
	LOG_LEVEL_ERROR,
	LOG_LEVEL_NONE,
	/**
	* Global log level.
	* @default config.LOG_LEVEL_WARNING
	*/
	logLevel: isDev ? LOG_LEVEL_VERBOSE : LOG_LEVEL_WARNING,
	/**
	* Enabling sound for motions.
	*/
	sound: true,
	/**
	* Deferring motion and corresponding sound until both are loaded.
	*/
	motionSync: true,
	/**
	* Default fading duration for motions without such value specified.
	*/
	motionFadingDuration: 500,
	/**
	* Default fading duration for idle motions without such value specified.
	*/
	idleMotionFadingDuration: 2e3,
	/**
	* Default fading duration for expressions without such value specified.
	*/
	expressionFadingDuration: 500,
	/**
	* If false, expression will be reset to default when playing non-idle motions.
	*/
	preserveExpressionOnMotion: true,
	/**
	* Public directory containing the 13 external shaders required by Cubism SDK for Web R5.
	* This must be configured before the first Cubism 5 model is rendered.
	*/
	cubism5ShaderPath: "/cubism5/shaders/",
	cubism5: { logLevel: 3 }
};
/**
* Consistent with the `version` in package.json.
*/
var VERSION = version;
//#endregion
//#region src/utils/log.ts
/**
* A simple tagged logger.
*
* You can replace the methods with your own ones.
*
* ```js
* import { logger } from 'pixi-live2d5';
*
* logger.log = (tag, ...messages) => {
*     console.log(tag, 'says:', ...messages);
* };
* ```
*/
var logger = {
	log(tag, ...messages) {
		if (config.logLevel <= config.LOG_LEVEL_VERBOSE) console.log(`[${tag}]`, ...messages);
	},
	warn(tag, ...messages) {
		if (config.logLevel <= config.LOG_LEVEL_WARNING) console.warn(`[${tag}]`, ...messages);
	},
	error(tag, ...messages) {
		if (config.logLevel <= config.LOG_LEVEL_ERROR) console.error(`[${tag}]`, ...messages);
	}
};
//#endregion
//#region src/utils/math.ts
/**
* These functions can be slightly faster than the ones in Lodash.
* @packageDocumentation
*/
function clamp(num, lower, upper) {
	return num < lower ? lower : num > upper ? upper : num;
}
function rand(min, max) {
	return Math.random() * (max - min) + min;
}
//#endregion
//#region src/utils/obj.ts
/**
* Copies a property at only if it matches the `type`.
* @param type - Type expected to match `typeof` on the property.
* @param from - Source object.
* @param to - Destination object.
* @param fromKey - Key of the property in source object.
* @param toKey - Key of the property in destination object.
*/
function copyProperty(type, from, to, fromKey, toKey) {
	const value = from[fromKey];
	if (value !== null && typeof value === type) to[toKey] = value;
}
/**
* Copies an array at `key`, filtering the items that match the `type`.
* @param type - Type expected to match `typeof` on the items.
* @param from - Source object.
* @param to - Destination object.
* @param fromKey - Key of the array property in source object.
* @param toKey - Key of the array property in destination object.
*/
function copyArray(type, from, to, fromKey, toKey) {
	const array = from[fromKey];
	if (Array.isArray(array)) to[toKey] = array.filter((item) => item !== null && typeof item === type);
}
/**
* @see {@link https://www.typescriptlang.org/docs/handbook/mixins.html}
*/
function applyMixins(derivedCtor, baseCtors) {
	baseCtors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			if (name !== "constructor") Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
		});
	});
}
//#endregion
//#region src/utils/string.ts
/**
* Gets the name of parent folder in a url.
* @param url - URL of a file.
* @return Name of the parent folder, or the file itself if it has no parent folder.
*/
function folderName(url) {
	let lastSlashIndex = url.lastIndexOf("/");
	if (lastSlashIndex != -1) url = url.slice(0, lastSlashIndex);
	lastSlashIndex = url.lastIndexOf("/");
	if (lastSlashIndex !== -1) url = url.slice(lastSlashIndex + 1);
	return url;
}
//#endregion
//#region src/utils/array.ts
/**
* Remove an element from array.
*/
function remove(array, item) {
	const index = array.indexOf(item);
	if (index !== -1) array.splice(index, 1);
}
//#endregion
//#region src/utils/url.ts
/**
* Resolves a relative URL/path against a base URL/path.
*
* This is a small replacement for Pixi v7's deprecated `utils.url.resolve`.
* It intentionally preserves "path-like" inputs (e.g. `/foo/bar.json`) by returning a path
* instead of a full absolute URL with an origin.
*/
function resolveUrl(base, path) {
	if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(base)) return new URL(path, base).toString();
	const resolved = new URL(path, new URL(base, "http://pixi-live2d.local"));
	const resolvedPath = `${resolved.pathname}${resolved.search}${resolved.hash}`;
	if (base.startsWith("/")) return resolvedPath;
	return resolvedPath.replace(/^\/+/, "");
}
//#endregion
//#region \0@oxc-project+runtime@0.139.0/helpers/esm/asyncToGenerator.js
function asyncGeneratorStep(n, t, e, r, o, a, c) {
	try {
		var i = n[a](c), u = i.value;
	} catch (n) {
		e(n);
		return;
	}
	i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
	return function() {
		var t = this, e = arguments;
		return new Promise(function(r, o) {
			var a = n.apply(t, e);
			function _next(n) {
				asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
			}
			function _throw(n) {
				asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
			}
			_next(void 0);
		});
	};
}
//#endregion
//#region src/cubism-common/ExpressionManager.ts
/**
* Abstract expression manager.
* Emits the expression manager event set.
*/
var ExpressionManager = class extends EventEmitter {
	constructor(settings, options) {
		super();
		this.expressions = [];
		this.reserveExpressionIndex = -1;
		this.destroyed = false;
		this.settings = settings;
		this.tag = `ExpressionManager(${settings.name})`;
	}
	/**
	* Should be called in the constructor of derived class.
	*/
	init() {
		this.defaultExpression = this.createExpression({}, void 0);
		this.currentExpression = this.defaultExpression;
		this.stopAllExpressions();
	}
	/**
	* Loads an Expression. Errors in this method will not be thrown,
	* but be emitted with an "expressionLoadError" event.
	* @param index - Index of the expression in definitions.
	* @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
	* Emits `expressionLoaded` on success and `expressionLoadError` when loading fails.
	*/
	loadExpression(index) {
		var _this = this;
		return _asyncToGenerator(function* () {
			if (!_this.definitions[index]) {
				logger.warn(_this.tag, `Undefined expression at [${index}]`);
				return;
			}
			if (_this.expressions[index] === null) {
				logger.warn(_this.tag, `Cannot set expression at [${index}] because it's already failed in loading.`);
				return;
			}
			if (_this.expressions[index]) return _this.expressions[index];
			const expression = yield _this._loadExpression(index);
			_this.expressions[index] = expression;
			return expression;
		})();
	}
	/**
	* Loads the Expression. Will be implemented by Live2DFactory in order to avoid circular dependency.
	* @ignore
	*/
	_loadExpression(index) {
		throw new Error("Not implemented.");
	}
	/**
	* Sets a random Expression that differs from current one.
	* @return Promise that resolves with true if succeeded, with false otherwise.
	*/
	setRandomExpression() {
		var _this2 = this;
		return _asyncToGenerator(function* () {
			if (_this2.definitions.length) {
				const availableIndices = [];
				for (let i = 0; i < _this2.definitions.length; i++) if (_this2.expressions[i] !== null && _this2.expressions[i] !== _this2.currentExpression && i !== _this2.reserveExpressionIndex) availableIndices.push(i);
				if (availableIndices.length) {
					const index = Math.floor(Math.random() * availableIndices.length);
					return _this2.setExpression(index);
				}
			}
			return false;
		})();
	}
	/**
	* Resets model's expression using {@link ExpressionManager#defaultExpression}.
	*/
	resetExpression() {
		this._setExpression(this.defaultExpression);
	}
	/**
	* Restores model's expression to {@link currentExpression}.
	*/
	restoreExpression() {
		this._setExpression(this.currentExpression);
	}
	/**
	* Sets an Expression.
	* @param index - Either the index, or the name of the expression.
	* @return Promise that resolves with true if succeeded, with false otherwise.
	*/
	setExpression(index) {
		var _this3 = this;
		return _asyncToGenerator(function* () {
			if (typeof index !== "number") index = _this3.getExpressionIndex(index);
			if (!(index > -1 && index < _this3.definitions.length)) return false;
			if (index === _this3.expressions.indexOf(_this3.currentExpression)) return false;
			_this3.reserveExpressionIndex = index;
			const expression = yield _this3.loadExpression(index);
			if (!expression || _this3.reserveExpressionIndex !== index) return false;
			_this3.reserveExpressionIndex = -1;
			_this3.currentExpression = expression;
			_this3._setExpression(expression);
			return true;
		})();
	}
	/**
	* Updates parameters of the core model.
	* @return True if the parameters are actually updated.
	*/
	update(model, now) {
		if (!this.isFinished()) return this.updateParameters(model, now);
		return false;
	}
	/**
	* Destroys the instance.
	* Emits `destroy`.
	*/
	destroy() {
		this.destroyed = true;
		this.emit("destroy");
		const self = this;
		self.definitions = void 0;
		self.expressions = void 0;
	}
};
//#endregion
//#region src/cubism-common/FocusController.ts
var EPSILON = .01;
var MAX_SPEED = 40 / 7.5;
var ACCELERATION_TIME = 1 / (.15 * 1e3);
/**
* Interpolates the transition of focus position.
*/
var FocusController = class {
	constructor() {
		this.targetX = 0;
		this.targetY = 0;
		this.x = 0;
		this.y = 0;
		this.vx = 0;
		this.vy = 0;
	}
	/**
	* Sets the focus position.
	* @param x - X position in range `[-1, 1]`.
	* @param y - Y position in range `[-1, 1]`.
	* @param instant - Should the focus position be instantly applied.
	*/
	focus(x, y, instant = false) {
		this.targetX = clamp(x, -1, 1);
		this.targetY = clamp(y, -1, 1);
		if (instant) {
			this.x = this.targetX;
			this.y = this.targetY;
		}
	}
	/**
	* Updates the interpolation.
	* @param dt - Delta time in milliseconds.
	*/
	update(dt) {
		const dx = this.targetX - this.x;
		const dy = this.targetY - this.y;
		if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) return;
		const d = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		const maxSpeed = MAX_SPEED / (1e3 / dt);
		let ax = maxSpeed * (dx / d) - this.vx;
		let ay = maxSpeed * (dy / d) - this.vy;
		const a = Math.sqrt(Math.pow(ax, 2) + Math.pow(ay, 2));
		const maxA = maxSpeed * ACCELERATION_TIME * dt;
		if (a > maxA) {
			ax *= maxA / a;
			ay *= maxA / a;
		}
		this.vx += ax;
		this.vy += ay;
		const v = Math.sqrt(Math.pow(this.vx, 2) + Math.pow(this.vy, 2));
		const maxV = .5 * (Math.sqrt(Math.pow(maxA, 2) + 8 * maxA * d) - maxA);
		if (v > maxV) {
			this.vx *= maxV / v;
			this.vy *= maxV / v;
		}
		this.x += this.vx;
		this.y += this.vy;
	}
};
//#endregion
//#region src/cubism-common/ModelSettings.ts
/**
* Parses, and provides access to the settings JSON.
*/
var ModelSettings = class {
	/**
	* @param json - The settings JSON object.
	* @param json.url - The `url` field must be defined to specify the settings file's URL.
	*/
	constructor(json) {
		this.json = json;
		const url = json.url;
		if (typeof url !== "string") throw new TypeError("The `url` field in settings JSON must be defined as a string.");
		this.url = url;
		this.name = folderName(this.url);
	}
	/**
	* Resolves a relative path using the {@link url}. This is used to resolve the resource files
	* defined in the settings.
	* @param path - Relative path.
	* @return Resolved path.
	*/
	resolveURL(path) {
		return resolveUrl(this.url, path);
	}
	/**
	* Replaces the resource files by running each file through the `replacer`.
	* @param replacer - Invoked with two arguments: `(file, path)`, where `file` is the file definition,
	* and `path` is its property path in the ModelSettings instance. A string must be returned to be the replacement.
	*
	* ```js
	* modelSettings.replaceFiles((file, path) => {
	*     // file = "foo.moc", path = "moc"
	*     // file = "foo.png", path = "textures[0]"
	*     // file = "foo.mtn", path = "motions.idle[0].file"
	*     // file = "foo.motion3.json", path = "motions.idle[0].File"
	*
	*     return "bar/" + file;
	* });
	* ```
	*/
	replaceFiles(replacer) {
		this.moc = replacer(this.moc, "moc");
		if (this.pose !== void 0) this.pose = replacer(this.pose, "pose");
		if (this.physics !== void 0) this.physics = replacer(this.physics, "physics");
		for (let i = 0; i < this.textures.length; i++) this.textures[i] = replacer(this.textures[i], `textures[${i}]`);
	}
	/**
	* Retrieves all resource files defined in the settings.
	* @return A flat array of the paths of all resource files.
	*
	* ```js
	* modelSettings.getDefinedFiles();
	* // returns: ["foo.moc", "foo.png", ...]
	* ```
	*/
	getDefinedFiles() {
		const files = [];
		this.replaceFiles((file) => {
			files.push(file);
			return file;
		});
		return files;
	}
	/**
	* Validates that the files defined in the settings exist in given files. Each file will be
	* resolved by {@link resolveURL} before comparison.
	* @param files - A flat array of file paths.
	* @return All the files which are defined in the settings and also exist in given files,
	* *including the optional files*.
	* @throws Error if any *essential* file is defined in settings but not included in given files.
	*/
	validateFiles(files) {
		const assertFileExists = (expectedFile, shouldThrow) => {
			const actualPath = this.resolveURL(expectedFile);
			if (!files.includes(actualPath)) {
				if (shouldThrow) throw new Error(`File "${expectedFile}" is defined in settings, but doesn't exist in given files`);
				return false;
			}
			return true;
		};
		[this.moc, ...this.textures].forEach((texture) => assertFileExists(texture, true));
		return this.getDefinedFiles().filter((file) => assertFileExists(file, false));
	}
};
//#endregion
//#region src/cubism-common/MotionState.ts
/**
* Indicates the motion priority.
*/
var MotionPriority = /* @__PURE__ */ function(MotionPriority) {
	/** States that the model is currently not playing any motion. This priority cannot be applied to a motion. */
	MotionPriority[MotionPriority["NONE"] = 0] = "NONE";
	/** Low priority, used when starting idle motions automatically. */
	MotionPriority[MotionPriority["IDLE"] = 1] = "IDLE";
	/** Medium priority. */
	MotionPriority[MotionPriority["NORMAL"] = 2] = "NORMAL";
	/** High priority. Motions as this priority will always be played regardless of the current priority. */
	MotionPriority[MotionPriority["FORCE"] = 3] = "FORCE";
	return MotionPriority;
}({});
/**
* Handles the state of a MotionManager.
*/
var MotionState = class {
	constructor() {
		this.debug = false;
		this.currentPriority = 0;
		this.reservePriority = 0;
	}
	/**
	* Reserves the playback for a motion.
	* @param group - The motion group.
	* @param index - Index in the motion group.
	* @param priority - The priority to be applied.
	* @return True if the reserving has succeeded.
	*/
	reserve(group, index, priority) {
		if (priority <= 0) {
			logger.log(this.tag, `Cannot start a motion with MotionPriority.NONE.`);
			return false;
		}
		if (group === this.currentGroup && index === this.currentIndex) {
			logger.log(this.tag, `Motion is already playing.`, this.dump(group, index));
			return false;
		}
		if (group === this.reservedGroup && index === this.reservedIndex || group === this.reservedIdleGroup && index === this.reservedIdleIndex) {
			logger.log(this.tag, `Motion is already reserved.`, this.dump(group, index));
			return false;
		}
		if (priority === 1) {
			if (this.currentPriority !== 0) {
				logger.log(this.tag, `Cannot start idle motion because another motion is playing.`, this.dump(group, index));
				return false;
			}
			if (this.reservedIdleGroup !== void 0) {
				logger.log(this.tag, `Cannot start idle motion because another idle motion has reserved.`, this.dump(group, index));
				return false;
			}
			this.setReservedIdle(group, index);
		} else {
			if (priority < 3) {
				if (priority <= this.currentPriority) {
					logger.log(this.tag, "Cannot start motion because another motion is playing as an equivalent or higher priority.", this.dump(group, index));
					return false;
				}
				if (priority <= this.reservePriority) {
					logger.log(this.tag, "Cannot start motion because another motion has reserved as an equivalent or higher priority.", this.dump(group, index));
					return false;
				}
			}
			this.setReserved(group, index, priority);
		}
		return true;
	}
	/**
	* Requests the playback for a motion.
	* @param motion - The Motion, can be undefined.
	* @param group - The motion group.
	* @param index - Index in the motion group.
	* @param priority - The priority to be applied.
	* @return True if the request has been approved, i.e. the motion is allowed to play.
	*/
	start(motion, group, index, priority) {
		if (priority === 1) {
			this.setReservedIdle(void 0, void 0);
			if (this.currentPriority !== 0) {
				logger.log(this.tag, "Cannot start idle motion because another motion is playing.", this.dump(group, index));
				return false;
			}
		} else {
			if (group !== this.reservedGroup || index !== this.reservedIndex) {
				logger.log(this.tag, "Cannot start motion because another motion has taken the place.", this.dump(group, index));
				return false;
			}
			this.setReserved(void 0, void 0, 0);
		}
		if (!motion) return false;
		this.setCurrent(group, index, priority);
		return true;
	}
	/**
	* Notifies the motion playback has finished.
	*/
	complete() {
		this.setCurrent(void 0, void 0, 0);
	}
	/**
	* Sets the current motion.
	*/
	setCurrent(group, index, priority) {
		this.currentPriority = priority;
		this.currentGroup = group;
		this.currentIndex = index;
	}
	/**
	* Sets the reserved motion.
	*/
	setReserved(group, index, priority) {
		this.reservePriority = priority;
		this.reservedGroup = group;
		this.reservedIndex = index;
	}
	/**
	* Sets the reserved idle motion.
	*/
	setReservedIdle(group, index) {
		this.reservedIdleGroup = group;
		this.reservedIdleIndex = index;
	}
	/**
	* Checks if a Motion is currently playing or has reserved.
	* @return True if active.
	*/
	isActive(group, index) {
		return group === this.currentGroup && index === this.currentIndex || group === this.reservedGroup && index === this.reservedIndex || group === this.reservedIdleGroup && index === this.reservedIdleIndex;
	}
	/**
	* Resets the state.
	*/
	reset() {
		this.setCurrent(void 0, void 0, 0);
		this.setReserved(void 0, void 0, 0);
		this.setReservedIdle(void 0, void 0);
	}
	/**
	* Checks if an idle motion should be requests to play.
	*/
	shouldRequestIdleMotion() {
		return this.currentGroup === void 0 && this.reservedIdleGroup === void 0;
	}
	/**
	* Checks if the model's expression should be overridden by the motion.
	*/
	shouldOverrideExpression() {
		return !config.preserveExpressionOnMotion && this.currentPriority > 1;
	}
	/**
	* Dumps the state for debugging.
	*/
	dump(requestedGroup, requestedIndex) {
		if (this.debug) return `\n<Requested> group = "${requestedGroup}", index = ${requestedIndex}\n` + [
			"currentPriority",
			"reservePriority",
			"currentGroup",
			"currentIndex",
			"reservedGroup",
			"reservedIndex",
			"reservedIdleGroup",
			"reservedIdleIndex"
		].map((key) => "[" + key + "] " + this[key]).join("\n");
		return "";
	}
};
//#endregion
//#region src/cubism-common/SoundManager.ts
var _SoundManager;
var TAG$2 = "SoundManager";
var VOLUME = .5;
/**
* Manages all the sounds.
*/
var SoundManager = class {
	/**
	* Global volume that applies to all the sounds.
	*/
	static get volume() {
		return this._volume;
	}
	static set volume(value) {
		this._volume = (value > 1 ? 1 : value < 0 ? 0 : value) || 0;
		this.audios.forEach((audio) => audio.volume = this._volume);
	}
	/**
	* Creates an audio element and adds it to the {@link audios}.
	* @param file - URL of the sound file.
	* @param onFinish - Callback invoked when the playback has finished.
	* @param onError - Callback invoked when error occurs.
	* @return Created audio element.
	*/
	static add(file, onFinish, onError) {
		const audio = new Audio(file);
		audio.volume = this._volume;
		audio.preload = "auto";
		audio.addEventListener("ended", () => {
			this.dispose(audio);
			onFinish === null || onFinish === void 0 || onFinish();
		});
		audio.addEventListener("error", (e) => {
			this.dispose(audio);
			logger.warn(TAG$2, `Error occurred on "${file}"`, e.error);
			onError === null || onError === void 0 || onError(e.error);
		});
		this.audios.push(audio);
		return audio;
	}
	/**
	* Plays the sound.
	* @param audio - An audio element.
	* @return Promise that resolves when the audio is ready to play, rejects when error occurs.
	*/
	static play(audio) {
		return new Promise((resolve, reject) => {
			var _audio$play;
			(_audio$play = audio.play()) === null || _audio$play === void 0 || _audio$play.catch((e) => {
				audio.dispatchEvent(new ErrorEvent("error", { error: e }));
				reject(e);
			});
			if (audio.readyState === audio.HAVE_ENOUGH_DATA) resolve();
			else audio.addEventListener("canplaythrough", resolve);
		});
	}
	/**
	* Disposes an audio element and removes it from {@link audios}.
	* @param audio - An audio element.
	*/
	static dispose(audio) {
		audio.pause();
		audio.removeAttribute("src");
		remove(this.audios, audio);
	}
	/**
	* Destroys all managed audios.
	*/
	static destroy() {
		for (let i = this.audios.length - 1; i >= 0; i--) this.dispose(this.audios[i]);
	}
};
_SoundManager = SoundManager;
_SoundManager.audios = [];
_SoundManager._volume = VOLUME;
//#endregion
//#region src/cubism-common/MotionManager.ts
/**
* Indicates how the motions will be preloaded.
*/
var MotionPreloadStrategy = /* @__PURE__ */ function(MotionPreloadStrategy) {
	/** Preload all the motions. */
	MotionPreloadStrategy["ALL"] = "ALL";
	/** Preload only the idle motions. */
	MotionPreloadStrategy["IDLE"] = "IDLE";
	/** No preload. */
	MotionPreloadStrategy["NONE"] = "NONE";
	return MotionPreloadStrategy;
}({});
/**
* Handles the motion playback.
* Emits the motion manager event set.
*/
var MotionManager = class extends EventEmitter {
	constructor(settings, options) {
		super();
		this.motionGroups = {};
		this.state = new MotionState();
		this.playing = false;
		this.destroyed = false;
		this.settings = settings;
		this.tag = `MotionManager(${settings.name})`;
		this.state.tag = this.tag;
	}
	/**
	* Should be called in the constructor of derived class.
	*/
	init(options) {
		if (options === null || options === void 0 ? void 0 : options.idleMotionGroup) this.groups.idle = options.idleMotionGroup;
		this.setupMotions(options);
		this.stopAllMotions();
	}
	/**
	* Sets up motions from the definitions, and preloads them according to the preload strategy.
	*/
	setupMotions(options) {
		for (const group of Object.keys(this.definitions)) this.motionGroups[group] = [];
		let groups;
		switch (options === null || options === void 0 ? void 0 : options.motionPreload) {
			case "NONE": return;
			case "ALL":
				groups = Object.keys(this.definitions);
				break;
			default:
				groups = [this.groups.idle];
				break;
		}
		for (const group of groups) if (this.definitions[group]) for (let i = 0; i < this.definitions[group].length; i++) this.loadMotion(group, i).then();
	}
	/**
	* Loads a Motion in a motion group. Errors in this method will not be thrown,
	* but be emitted with a "motionLoadError" event.
	* @param group - The motion group.
	* @param index - Index in the motion group.
	* @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
	* Emits `motionLoaded` on success and `motionLoadError` when loading fails.
	*/
	loadMotion(group, index) {
		var _this = this;
		return _asyncToGenerator(function* () {
			var _this$definitions$gro;
			if (!((_this$definitions$gro = _this.definitions[group]) === null || _this$definitions$gro === void 0 ? void 0 : _this$definitions$gro[index])) {
				logger.warn(_this.tag, `Undefined motion at "${group}"[${index}]`);
				return;
			}
			if (_this.motionGroups[group][index] === null) {
				logger.warn(_this.tag, `Cannot start motion at "${group}"[${index}] because it's already failed in loading.`);
				return;
			}
			if (_this.motionGroups[group][index]) return _this.motionGroups[group][index];
			const motion = yield _this._loadMotion(group, index);
			if (_this.destroyed) return;
			_this.motionGroups[group][index] = motion !== null && motion !== void 0 ? motion : null;
			return motion;
		})();
	}
	/**
	* Loads the Motion. Will be implemented by Live2DFactory in order to avoid circular dependency.
	* @ignore
	*/
	_loadMotion(group, index) {
		throw new Error("Not implemented.");
	}
	/**
	* Starts a motion as given priority.
	* @param group - The motion group.
	* @param index - Index in the motion group.
	* @param priority - The priority to be applied.
	* @return Promise that resolves with true if the motion is successfully started, with false otherwise.
	*/
	startMotion(_x, _x2) {
		var _this2 = this;
		return _asyncToGenerator(function* (group, index, priority = MotionPriority.NORMAL) {
			var _this$definitions$gro2;
			if (!_this2.state.reserve(group, index, priority)) return false;
			const definition = (_this$definitions$gro2 = _this2.definitions[group]) === null || _this$definitions$gro2 === void 0 ? void 0 : _this$definitions$gro2[index];
			if (!definition) return false;
			if (_this2.currentAudio) SoundManager.dispose(_this2.currentAudio);
			let audio;
			if (config.sound) {
				const soundURL = _this2.getSoundFile(definition);
				if (soundURL) try {
					audio = SoundManager.add(_this2.settings.resolveURL(soundURL), () => _this2.currentAudio = void 0, () => _this2.currentAudio = void 0);
					_this2.currentAudio = audio;
				} catch (e) {
					logger.warn(_this2.tag, "Failed to create audio", soundURL, e);
				}
			}
			const motion = yield _this2.loadMotion(group, index);
			if (audio) {
				const readyToPlay = SoundManager.play(audio).catch((e) => logger.warn(_this2.tag, "Failed to play audio", audio.src, e));
				if (config.motionSync) yield readyToPlay;
			}
			if (!_this2.state.start(motion, group, index, priority)) {
				if (audio) {
					SoundManager.dispose(audio);
					_this2.currentAudio = void 0;
				}
				return false;
			}
			logger.log(_this2.tag, "Start motion:", _this2.getMotionName(definition));
			_this2.emit("motionStart", group, index, audio);
			if (_this2.state.shouldOverrideExpression()) _this2.expressionManager && _this2.expressionManager.resetExpression();
			_this2.playing = true;
			_this2._startMotion(motion);
			return true;
		}).apply(this, arguments);
	}
	/**
	* Starts a random Motion as given priority.
	* @param group - The motion group.
	* @param priority - The priority to be applied.
	* @return Promise that resolves with true if the motion is successfully started, with false otherwise.
	*/
	startRandomMotion(group, priority) {
		var _this3 = this;
		return _asyncToGenerator(function* () {
			const groupDefs = _this3.definitions[group];
			if (groupDefs === null || groupDefs === void 0 ? void 0 : groupDefs.length) {
				const availableIndices = [];
				for (let i = 0; i < groupDefs.length; i++) if (_this3.motionGroups[group][i] !== null && !_this3.state.isActive(group, i)) availableIndices.push(i);
				if (availableIndices.length) {
					const index = Math.floor(Math.random() * availableIndices.length);
					return _this3.startMotion(group, availableIndices[index], priority);
				}
			}
			return false;
		})();
	}
	/**
	* Stops all playing motions as well as the sound.
	*/
	stopAllMotions() {
		this._stopAllMotions();
		this.state.reset();
		if (this.currentAudio) {
			SoundManager.dispose(this.currentAudio);
			this.currentAudio = void 0;
		}
	}
	/**
	* Updates parameters of the core model.
	* @param model - The core model.
	* @param now - Current time in milliseconds.
	* @return True if the parameters have been actually updated.
	*/
	update(model, now) {
		if (this.isFinished()) {
			if (this.playing) {
				this.playing = false;
				this.emit("motionFinish");
			}
			if (this.state.shouldOverrideExpression()) {
				var _this$expressionManag;
				(_this$expressionManag = this.expressionManager) === null || _this$expressionManag === void 0 || _this$expressionManag.restoreExpression();
			}
			this.state.complete();
			if (this.state.shouldRequestIdleMotion()) this.startRandomMotion(this.groups.idle, MotionPriority.IDLE);
		}
		return this.updateParameters(model, now);
	}
	/**
	* Destroys the instance.
	* Emits `destroy`.
	*/
	destroy() {
		var _this$expressionManag2;
		this.destroyed = true;
		this.emit("destroy");
		this.stopAllMotions();
		(_this$expressionManag2 = this.expressionManager) === null || _this$expressionManag2 === void 0 || _this$expressionManag2.destroy();
		const self = this;
		self.definitions = void 0;
		self.motionGroups = void 0;
	}
};
//#endregion
//#region src/cubism-common/InternalModel.ts
var tempBounds = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};
/**
* A wrapper that manages the states of a Live2D core model, and delegates all operations to it.
* Emits the internal model event set.
*/
var InternalModel = class extends EventEmitter {
	constructor(..._args) {
		super(..._args);
		this.focusController = new FocusController();
		this.originalWidth = 0;
		this.originalHeight = 0;
		this.width = 0;
		this.height = 0;
		this.localTransform = new Matrix();
		this.drawingMatrix = new Matrix();
		this.hitAreas = {};
		this.textureFlipY = false;
		this.viewport = [
			0,
			0,
			0,
			0
		];
		this.destroyed = false;
	}
	/**
	* Should be called in the constructor of derived class.
	*/
	init() {
		this.setupLayout();
		this.setupHitAreas();
	}
	/**
	* Sets up the model's size and local transform by the model's layout.
	*/
	setupLayout() {
		const self = this;
		const size = this.getSize();
		self.originalWidth = size[0];
		self.originalHeight = size[1];
		const layout = Object.assign({
			width: 2,
			height: 2
		}, this.getLayout());
		this.localTransform.scale(layout.width / 2, layout.height / 2);
		self.width = this.originalWidth * this.localTransform.a;
		self.height = this.originalHeight * this.localTransform.d;
		const offsetX = layout.x !== void 0 && layout.x - layout.width / 2 || layout.centerX !== void 0 && layout.centerX || layout.left !== void 0 && layout.left - layout.width / 2 || layout.right !== void 0 && layout.right + layout.width / 2 || 0;
		const offsetY = layout.y !== void 0 && layout.y - layout.height / 2 || layout.centerY !== void 0 && layout.centerY || layout.top !== void 0 && layout.top - layout.height / 2 || layout.bottom !== void 0 && layout.bottom + layout.height / 2 || 0;
		this.localTransform.translate(this.width * offsetX, -this.height * offsetY);
	}
	/**
	* Sets up the hit areas by their definitions in settings.
	*/
	setupHitAreas() {
		const definitions = this.getHitAreaDefs().filter((hitArea) => hitArea.index >= 0);
		for (const def of definitions) this.hitAreas[def.name] = def;
	}
	/**
	* Hit-test on the model.
	* @param x - Position in model canvas.
	* @param y - Position in model canvas.
	* @return The names of the *hit* hit areas. Can be empty if none is hit.
	*/
	hitTest(x, y) {
		return Object.keys(this.hitAreas).filter((hitAreaName) => this.isHit(hitAreaName, x, y));
	}
	/**
	* Hit-test for a single hit area.
	* @param hitAreaName - The hit area's name.
	* @param x - Position in model canvas.
	* @param y - Position in model canvas.
	* @return True if hit.
	*/
	isHit(hitAreaName, x, y) {
		if (!this.hitAreas[hitAreaName]) return false;
		const drawIndex = this.hitAreas[hitAreaName].index;
		const bounds = this.getDrawableBounds(drawIndex, tempBounds);
		return bounds.x <= x && x <= bounds.x + bounds.width && bounds.y <= y && y <= bounds.y + bounds.height;
	}
	/**
	* Gets a drawable's bounds.
	* @param index - Index of the drawable.
	* @param bounds - Object to store the output values.
	* @return The bounds in model canvas space.
	*/
	getDrawableBounds(index, bounds) {
		var _bounds;
		const vertices = this.getDrawableVertices(index);
		let left = vertices[0];
		let right = vertices[0];
		let top = vertices[1];
		let bottom = vertices[1];
		for (let i = 0; i < vertices.length; i += 2) {
			const vx = vertices[i];
			const vy = vertices[i + 1];
			left = Math.min(vx, left);
			right = Math.max(vx, right);
			top = Math.min(vy, top);
			bottom = Math.max(vy, bottom);
		}
		(_bounds = bounds) !== null && _bounds !== void 0 || (bounds = {});
		bounds.x = left;
		bounds.y = top;
		bounds.width = right - left;
		bounds.height = bottom - top;
		return bounds;
	}
	/**
	* Updates the model's transform.
	* @param transform - The world transform.
	*/
	updateTransform(transform) {
		this.drawingMatrix.copyFrom(transform).append(this.localTransform);
	}
	/**
	* Updates the model's parameters.
	* @param dt - Elapsed time in milliseconds from last frame.
	* @param now - Current time in milliseconds.
	*/
	update(dt, now) {
		this.focusController.update(dt);
	}
	/**
	* Destroys the model and all related resources.
	* Emits `destroy`.
	*/
	destroy() {
		this.destroyed = true;
		this.emit("destroy");
		this.motionManager.destroy();
		this.motionManager = void 0;
	}
	/** Releases resources owned by this model for a Pixi renderer context. */
	releaseWebGLContext(_gl) {}
};
//#endregion
//#region src/factory/XHRLoader.ts
var _XHRLoader;
var TAG$1 = "XHRLoader";
var NetworkError = class extends Error {
	constructor(message, url, status, aborted = false) {
		super(message);
		this.url = url;
		this.status = status;
		this.aborted = aborted;
	}
};
/**
* The basic XHR loader.
*
* A network error will be thrown with the following properties:
* - `url` - The request URL.
* - `status` - The HTTP status.
* - `aborted` - True if the error is caused by aborting the XHR.
*/
var XHRLoader = class XHRLoader {
	/**
	* Creates a managed XHR.
	* @param target - If provided, the XHR will be canceled when receiving an "destroy" event from the target.
	* @param url - The URL.
	* @param type - The XHR response type.
	* @param onload - Load listener.
	* @param onerror - Error handler.
	*/
	static createXHR(target, url, type, onload, onerror) {
		const xhr = new XMLHttpRequest();
		XHRLoader.allXhrSet.add(xhr);
		if (target) {
			let xhrSet = XHRLoader.xhrMap.get(target);
			if (!xhrSet) {
				xhrSet = /* @__PURE__ */ new Set([xhr]);
				XHRLoader.xhrMap.set(target, xhrSet);
			} else xhrSet.add(xhr);
			if (!target.listeners("destroy").includes(XHRLoader.cancelXHRs)) target.once("destroy", XHRLoader.cancelXHRs);
		}
		xhr.open("GET", url);
		xhr.responseType = type;
		xhr.onload = () => {
			if ((xhr.status === 200 || xhr.status === 0) && xhr.response) onload(xhr.response);
			else xhr.onerror();
		};
		xhr.onerror = () => {
			logger.warn(TAG$1, `Failed to load resource as ${xhr.responseType} (Status ${xhr.status}): ${url}`);
			onerror(new NetworkError("Network error.", url, xhr.status));
		};
		xhr.onabort = () => onerror(new NetworkError("Aborted.", url, xhr.status, true));
		xhr.onloadend = () => {
			XHRLoader.allXhrSet.delete(xhr);
			if (target) {
				var _XHRLoader$xhrMap$get;
				(_XHRLoader$xhrMap$get = XHRLoader.xhrMap.get(target)) === null || _XHRLoader$xhrMap$get === void 0 || _XHRLoader$xhrMap$get.delete(xhr);
			}
		};
		return xhr;
	}
	/**
	* Cancels all XHRs related to this target.
	*/
	static cancelXHRs() {
		var _XHRLoader$xhrMap$get2;
		(_XHRLoader$xhrMap$get2 = XHRLoader.xhrMap.get(this)) === null || _XHRLoader$xhrMap$get2 === void 0 || _XHRLoader$xhrMap$get2.forEach((xhr) => {
			xhr.abort();
			XHRLoader.allXhrSet.delete(xhr);
		});
		XHRLoader.xhrMap.delete(this);
	}
	/**
	* Release all XHRs.
	*/
	static release() {
		XHRLoader.allXhrSet.forEach((xhr) => xhr.abort());
		XHRLoader.allXhrSet.clear();
		XHRLoader.xhrMap = /* @__PURE__ */ new WeakMap();
	}
};
_XHRLoader = XHRLoader;
_XHRLoader.xhrMap = /* @__PURE__ */ new WeakMap();
_XHRLoader.allXhrSet = /* @__PURE__ */ new Set();
_XHRLoader.loader = (context, next) => {
	return new Promise((resolve, reject) => {
		_XHRLoader.createXHR(context.target, context.settings ? context.settings.resolveURL(context.url) : context.url, context.type, (data) => {
			context.result = data;
			resolve();
		}, reject).send();
	});
};
//#endregion
//#region src/utils/middleware.ts
/**
* Run middlewares with given context.
* @see https://github.com/koajs/compose/blob/master/index.js
*
* @param middleware
* @param context
*/
function runMiddlewares(middleware, context) {
	let index = -1;
	return dispatch(0);
	function dispatch(i, err) {
		if (err) return Promise.reject(err);
		if (i <= index) return Promise.reject(/* @__PURE__ */ new Error("next() called multiple times"));
		index = i;
		const fn = middleware[i];
		if (!fn) return Promise.resolve();
		try {
			return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
		} catch (err) {
			return Promise.reject(err);
		}
	}
}
//#endregion
//#region src/factory/Live2DLoader.ts
var _Live2DLoader;
var Live2DLoader = class {
	/**
	* Loads a resource.
	* @return Promise that resolves with the loaded data in a format that's consistent with the specified `type`.
	*/
	static load(context) {
		return runMiddlewares(this.middlewares, context).then(() => context.result);
	}
};
_Live2DLoader = Live2DLoader;
_Live2DLoader.middlewares = [XHRLoader.loader];
//#endregion
//#region src/factory/texture.ts
var textureLoadQueue = Promise.resolve();
function createTexture(url, options = {}) {
	const loadTexture = function() {
		var _ref = _asyncToGenerator(function* () {
			var _Assets$loader$parser, _Assets$loader;
			const previousCrossOrigins = ((_Assets$loader$parser = (_Assets$loader = Assets.loader) === null || _Assets$loader === void 0 ? void 0 : _Assets$loader.parsers) !== null && _Assets$loader$parser !== void 0 ? _Assets$loader$parser : []).filter((parser) => (parser === null || parser === void 0 ? void 0 : parser.config) && "crossOrigin" in parser.config).map((parser) => ({
				parser,
				crossOrigin: parser.config.crossOrigin
			}));
			if (options.crossOrigin !== void 0) Assets.setPreferences({ crossOrigin: options.crossOrigin });
			try {
				return yield Assets.load(url);
			} finally {
				previousCrossOrigins.forEach(({ parser, crossOrigin }) => {
					parser.config.crossOrigin = crossOrigin;
				});
			}
		});
		return function loadTexture() {
			return _ref.apply(this, arguments);
		};
	}();
	const queuedLoad = textureLoadQueue.then(loadTexture, loadTexture);
	textureLoadQueue = queuedLoad.then(() => void 0, () => void 0);
	return queuedLoad;
}
//#endregion
//#region src/factory/model-middlewares.ts
var TAG = "Live2DFactory";
/**
* A middleware that converts the source from a URL to a settings JSON object.
*/
var urlToJSON = function() {
	var _ref = _asyncToGenerator(function* (context, next) {
		if (typeof context.source === "string") {
			const textData = yield Live2DLoader.load({
				url: context.source,
				type: "text",
				target: context.live2dModel
			});
			const data = JSON.parse(textData);
			data.url = context.source;
			context.source = data;
			context.live2dModel.emit("settingsJSONLoaded", data);
		}
		return next();
	});
	return function urlToJSON(_x, _x2) {
		return _ref.apply(this, arguments);
	};
}();
/**
* A middleware that converts the source from a settings JSON object to a ModelSettings instance.
*/
var jsonToSettings = function() {
	var _ref2 = _asyncToGenerator(function* (context, next) {
		if (context.source instanceof ModelSettings) {
			context.settings = context.source;
			return next();
		} else if (typeof context.source === "object") {
			const runtime = Live2DFactory.findRuntime(context.source);
			if (runtime) {
				const settings = runtime.createModelSettings(context.source);
				context.settings = settings;
				context.live2dModel.emit("settingsLoaded", settings);
				return next();
			}
		}
		throw new TypeError("Unknown settings format.");
	});
	return function jsonToSettings(_x3, _x4) {
		return _ref2.apply(this, arguments);
	};
}();
var waitUntilReady = (context, next) => {
	if (context.settings) {
		const runtime = Live2DFactory.findRuntime(context.settings);
		if (runtime) return runtime.ready().then(next);
	}
	return next();
};
/**
* A middleware that populates the Live2DModel with optional resources.
* Requires InternalModel in context when all the subsequent middlewares have finished.
*/
var setupOptionals = function() {
	var _ref3 = _asyncToGenerator(function* (context, next) {
		yield next();
		const internalModel = context.internalModel;
		if (internalModel) {
			const settings = context.settings;
			const runtime = Live2DFactory.findRuntime(settings);
			if (runtime) {
				const tasks = [];
				const loadType = "json";
				if (settings.pose) tasks.push(Live2DLoader.load({
					settings,
					url: settings.pose,
					type: loadType,
					target: internalModel
				}).then((data) => {
					internalModel.pose = runtime.createPose(internalModel.coreModel, data);
					context.live2dModel.emit("poseLoaded", internalModel.pose);
				}).catch((e) => {
					context.live2dModel.emit("poseLoadError", e);
					logger.warn(TAG, "Failed to load pose.", e);
				}));
				if (settings.physics) tasks.push(Live2DLoader.load({
					settings,
					url: settings.physics,
					type: loadType,
					target: internalModel
				}).then((data) => {
					internalModel.physics = runtime.createPhysics(internalModel.coreModel, data);
					context.live2dModel.emit("physicsLoaded", internalModel.physics);
				}).catch((e) => {
					context.live2dModel.emit("physicsLoadError", e);
					logger.warn(TAG, "Failed to load physics.", e);
				}));
				if (tasks.length) yield Promise.all(tasks);
			}
		}
	});
	return function setupOptionals(_x5, _x6) {
		return _ref3.apply(this, arguments);
	};
}();
/**
* A middleware that populates the Live2DModel with essential resources.
* Requires ModelSettings in context immediately, and InternalModel in context
* when all the subsequent middlewares have finished.
*/
var setupEssentials = function() {
	var _ref4 = _asyncToGenerator(function* (context, next) {
		if (context.settings) {
			const live2DModel = context.live2dModel;
			const loadingTextures = Promise.all(context.settings.textures.map((tex) => {
				return createTexture(context.settings.resolveURL(tex), { crossOrigin: context.options.crossOrigin });
			}));
			loadingTextures.catch(() => {});
			yield next();
			if (context.internalModel) {
				live2DModel.internalModel = context.internalModel;
				live2DModel.emit("modelLoaded", context.internalModel);
			} else throw new TypeError("Missing internal model.");
			live2DModel.textures = yield loadingTextures;
			live2DModel.emit("textureLoaded", live2DModel.textures);
		} else throw new TypeError("Missing settings.");
	});
	return function setupEssentials(_x7, _x8) {
		return _ref4.apply(this, arguments);
	};
}();
/**
* A middleware that creates the InternalModel. Requires ModelSettings in context.
*/
var createInternalModel = function() {
	var _ref5 = _asyncToGenerator(function* (context, next) {
		const settings = context.settings;
		if (settings instanceof ModelSettings) {
			const runtime = Live2DFactory.findRuntime(settings);
			if (!runtime) throw new TypeError("Unknown model settings.");
			const modelData = yield Live2DLoader.load({
				settings,
				url: settings.moc,
				type: "arraybuffer",
				target: context.live2dModel
			});
			if (!runtime.isValidMoc(modelData)) throw new Error("Invalid moc data");
			const coreModel = runtime.createCoreModel(modelData, context.options);
			context.internalModel = runtime.createInternalModel(coreModel, settings, context.options);
			return next();
		}
		throw new TypeError("Missing settings.");
	});
	return function createInternalModel(_x9, _x10) {
		return _ref5.apply(this, arguments);
	};
}();
//#endregion
//#region src/factory/ZipLoader.ts
var _ZipLoader;
/**
* Experimental loader to load resources from a zip file.
*
* Though named as a "Loader", this class has nothing to do with Live2DLoader,
* it only contains a middleware for the Live2DFactory.
*/
var ZipLoader = class ZipLoader {
	static unzip(reader, settings) {
		return _asyncToGenerator(function* () {
			const filePaths = yield ZipLoader.getFilePaths(reader);
			const requiredFilePaths = [];
			for (const definedFile of settings.getDefinedFiles()) {
				const actualPath = decodeURI(resolveUrl(settings.url, definedFile));
				if (filePaths.includes(actualPath)) requiredFilePaths.push(actualPath);
			}
			const files = yield ZipLoader.getFiles(reader, requiredFilePaths);
			for (let i = 0; i < files.length; i++) {
				const path = requiredFilePaths[i];
				const file = files[i];
				Object.defineProperty(file, "webkitRelativePath", { value: path });
			}
			return files;
		})();
	}
	static createSettings(reader) {
		return _asyncToGenerator(function* () {
			const settingsFilePath = (yield ZipLoader.getFilePaths(reader)).find((path) => path.endsWith("model.json") || path.endsWith("model3.json"));
			if (!settingsFilePath) throw new Error("Settings file not found");
			const settingsText = yield ZipLoader.readText(reader, settingsFilePath);
			if (!settingsText) throw new Error("Empty settings file: " + settingsFilePath);
			const settingsJSON = JSON.parse(settingsText);
			settingsJSON.url = settingsFilePath;
			const runtime = ZipLoader.live2dFactory.findRuntime(settingsJSON);
			if (!runtime) throw new Error("Unknown settings JSON");
			return runtime.createModelSettings(settingsJSON);
		})();
	}
	static zipReader(data, url) {
		return _asyncToGenerator(function* () {
			throw new Error("Not implemented");
		})();
	}
	static getFilePaths(reader) {
		return _asyncToGenerator(function* () {
			throw new Error("Not implemented");
		})();
	}
	static getFiles(reader, paths) {
		return _asyncToGenerator(function* () {
			throw new Error("Not implemented");
		})();
	}
	static readText(reader, path) {
		return _asyncToGenerator(function* () {
			throw new Error("Not implemented");
		})();
	}
	static releaseReader(reader) {}
};
_ZipLoader = ZipLoader;
_ZipLoader.ZIP_PROTOCOL = "zip://";
_ZipLoader.uid = 0;
_ZipLoader.factory = function() {
	var _ref = _asyncToGenerator(function* (context, next) {
		const source = context.source;
		let sourceURL;
		let zipBlob;
		let settings;
		let localSourceURL = false;
		if (typeof source === "string" && (source.endsWith(".zip") || source.startsWith(_ZipLoader.ZIP_PROTOCOL))) {
			if (source.startsWith(_ZipLoader.ZIP_PROTOCOL)) sourceURL = source.slice(_ZipLoader.ZIP_PROTOCOL.length);
			else sourceURL = source;
			zipBlob = yield Live2DLoader.load({
				url: sourceURL,
				type: "blob",
				target: context.live2dModel
			});
		} else if (Array.isArray(source) && source.length === 1 && source[0] instanceof File && source[0].name.endsWith(".zip")) {
			zipBlob = source[0];
			sourceURL = URL.createObjectURL(zipBlob);
			localSourceURL = true;
			settings = source.settings;
		}
		if (zipBlob) {
			let reader;
			let primaryError;
			let primaryFailed = false;
			let cleanupError;
			let cleanupFailed = false;
			try {
				if (!zipBlob.size) throw new Error("Empty zip file");
				reader = yield _ZipLoader.zipReader(zipBlob, sourceURL);
				if (!settings) settings = yield _ZipLoader.createSettings(reader);
				settings._objectURL = _ZipLoader.ZIP_PROTOCOL + _ZipLoader.uid++ + "/" + settings.url;
				const files = yield _ZipLoader.unzip(reader, settings);
				files.settings = settings;
				context.source = files;
			} catch (error) {
				primaryError = error;
				primaryFailed = true;
			} finally {
				try {
					if (reader) _ZipLoader.releaseReader(reader);
				} catch (error) {
					cleanupError = error;
					cleanupFailed = true;
					if (primaryFailed) logger.warn("ZipLoader", "Failed to release ZIP reader.", error);
				} finally {
					if (localSourceURL) URL.revokeObjectURL(sourceURL);
				}
			}
			if (primaryFailed) throw primaryError;
			if (cleanupFailed) throw cleanupError;
		}
		return next();
	});
	return function(_x, _x2) {
		return _ref.apply(this, arguments);
	};
}();
//#endregion
//#region src/factory/FileLoader.ts
var _FileLoader;
/**
* Experimental loader to load resources from uploaded files.
*
* This loader relies on
* [webkitRelativePath](https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath)
* to recognize the file path.
*
* Though named as a "Loader", this class has nothing to do with Live2DLoader,
* it only contains a middleware for the Live2DFactory.
*/
var FileLoader = class FileLoader {
	/**
	* Resolves the path of a resource file to the object URL.
	* @param settingsURL - Object URL of the settings file.
	* @param filePath - Resource file path.
	* @return Resolved object URL.
	*/
	static resolveURL(settingsURL, filePath) {
		var _FileLoader$filesMap$;
		const resolved = (_FileLoader$filesMap$ = FileLoader.filesMap[settingsURL]) === null || _FileLoader$filesMap$ === void 0 ? void 0 : _FileLoader$filesMap$[filePath];
		if (resolved === void 0) throw new Error("Cannot find this file from uploaded files: " + filePath);
		return resolved;
	}
	static cleanup(objectURL) {
		if (objectURL.startsWith("blob:")) URL.revokeObjectURL(objectURL);
		const fileMap = FileLoader.filesMap[objectURL];
		if (fileMap) for (const resourceObjectURL of Object.values(fileMap)) URL.revokeObjectURL(resourceObjectURL);
		delete FileLoader.filesMap[objectURL];
	}
	/**
	* Consumes the files by storing their object URLs. Files not defined in the settings will be ignored.
	*/
	static upload(files, settings) {
		return _asyncToGenerator(function* () {
			const fileMap = {};
			try {
				for (const definedFile of settings.getDefinedFiles()) {
					const actualPath = decodeURI(resolveUrl(settings.url, definedFile));
					const actualFile = files.find((file) => file.webkitRelativePath === actualPath);
					if (actualFile) fileMap[definedFile] = URL.createObjectURL(actualFile);
				}
			} catch (error) {
				for (const resourceObjectURL of Object.values(fileMap)) URL.revokeObjectURL(resourceObjectURL);
				throw error;
			}
			FileLoader.filesMap[settings._objectURL] = fileMap;
		})();
	}
	/**
	* Creates a ModelSettings by given files.
	* @return Promise that resolves with the created ModelSettings.
	*/
	static createSettings(files) {
		return _asyncToGenerator(function* () {
			const settingsFile = files.find((file) => file.name.endsWith("model.json") || file.name.endsWith("model3.json"));
			if (!settingsFile) throw new TypeError("Settings file not found");
			const settingsText = yield FileLoader.readText(settingsFile);
			const settingsJSON = JSON.parse(settingsText);
			settingsJSON.url = settingsFile.webkitRelativePath;
			const runtime = Live2DFactory.findRuntime(settingsJSON);
			if (!runtime) throw new Error("Unknown settings JSON");
			const settings = runtime.createModelSettings(settingsJSON);
			settings._objectURL = URL.createObjectURL(settingsFile);
			return settings;
		})();
	}
	/**
	* Reads a file as text in UTF-8.
	*/
	static readText(file) {
		return _asyncToGenerator(function* () {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result);
				reader.onerror = reject;
				reader.readAsText(file, "utf8");
			});
		})();
	}
};
_FileLoader = FileLoader;
_FileLoader.filesMap = {};
_FileLoader.factory = function() {
	var _ref = _asyncToGenerator(function* (context, next) {
		if (Array.isArray(context.source) && context.source[0] instanceof File) {
			const files = context.source;
			let settings = files.settings;
			if (!settings) settings = yield _FileLoader.createSettings(files);
			else if (!settings._objectURL) throw new Error("\"_objectURL\" must be specified in ModelSettings");
			const objectURL = settings._objectURL;
			let cleaned = false;
			const cleanup = () => {
				if (cleaned) return;
				cleaned = true;
				_FileLoader.cleanup(objectURL);
			};
			context.live2dModel.once("destroy", cleanup);
			try {
				settings.validateFiles(files.map((file) => encodeURI(file.webkitRelativePath)));
				yield _FileLoader.upload(files, settings);
				settings.resolveURL = function(url) {
					return _FileLoader.resolveURL(this._objectURL, url);
				};
				context.source = settings;
				return yield next();
			} catch (error) {
				cleanup();
				throw error;
			}
		}
		return next();
	});
	return function(_x, _x2) {
		return _ref.apply(this, arguments);
	};
}();
//#endregion
//#region src/factory/Live2DFactory.ts
var _Live2DFactory;
/**
* Handles all the network load tasks.
*
* - Model creation: requested by {@link Live2DModel.from}.
* - Motion loading: implements the load method of MotionManager.
* - Expression loading: implements the load method of ExpressionManager.
*/
var Live2DFactory = class Live2DFactory {
	/**
	* Registers a Live2DRuntime.
	*/
	static registerRuntime(runtime) {
		Live2DFactory.runtimes.push(runtime);
		Live2DFactory.runtimes.sort((a, b) => b.version - a.version);
	}
	/**
	* Finds a runtime that matches given source.
	* @param source - Either a settings JSON object or a ModelSettings instance.
	* @return The Live2DRuntime, or undefined if not found.
	*/
	static findRuntime(source) {
		for (const runtime of Live2DFactory.runtimes) if (runtime.test(source)) return runtime;
	}
	/**
	* Sets up a Live2DModel, populating it with all defined resources.
	* @param live2dModel - The Live2DModel instance.
	* @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
	* @param options - Options for the process.
	* @return Promise that resolves when all resources have been loaded, rejects when error occurs.
	*/
	static setupLive2DModel(live2dModel, source, options) {
		return _asyncToGenerator(function* () {
			const textureLoaded = new Promise((resolve) => live2dModel.once("textureLoaded", resolve));
			const modelLoaded = new Promise((resolve) => live2dModel.once("modelLoaded", resolve));
			const readyEventEmitted = Promise.all([textureLoaded, modelLoaded]).then(() => live2dModel.emit("ready"));
			try {
				yield runMiddlewares(Live2DFactory.live2DModelMiddlewares, {
					live2dModel,
					source,
					options: options || {}
				});
				yield readyEventEmitted;
				live2dModel.emit("load");
			} catch (error) {
				if (!live2dModel.destroyed) try {
					live2dModel.destroy();
				} catch (cleanupError) {
					logger.warn(live2dModel.tag, "Failed to clean up after model creation failed.", cleanupError);
				}
				throw error;
			}
		})();
	}
	/**
	* Loads a Motion and registers the task to {@link motionTasksMap}. The task will be automatically
	* canceled when its owner - the MotionManager instance - has been destroyed.
	* @param motionManager - MotionManager that owns this Motion.
	* @param group - The motion group.
	* @param index - Index in the motion group.
	* @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
	*/
	static loadMotion(motionManager, group, index) {
		const handleError = (e) => motionManager.emit("motionLoadError", group, index, e);
		try {
			var _motionManager$defini, _taskGroup, _taskGroup$index;
			const definition = (_motionManager$defini = motionManager.definitions[group]) === null || _motionManager$defini === void 0 ? void 0 : _motionManager$defini[index];
			if (!definition) return Promise.resolve(void 0);
			if (!motionManager.listeners("destroy").includes(Live2DFactory.releaseTasks)) motionManager.once("destroy", Live2DFactory.releaseTasks);
			let tasks = Live2DFactory.motionTasksMap.get(motionManager);
			if (!tasks) {
				tasks = {};
				Live2DFactory.motionTasksMap.set(motionManager, tasks);
			}
			let taskGroup = tasks[group];
			if (!taskGroup) {
				taskGroup = [];
				tasks[group] = taskGroup;
			}
			const path = motionManager.getMotionFile(definition);
			(_taskGroup$index = (_taskGroup = taskGroup)[index]) !== null && _taskGroup$index !== void 0 || (_taskGroup[index] = Live2DLoader.load({
				url: path,
				settings: motionManager.settings,
				type: motionManager.motionDataType,
				target: motionManager
			}).then((data) => {
				var _Live2DFactory$motion;
				const taskGroup = (_Live2DFactory$motion = Live2DFactory.motionTasksMap.get(motionManager)) === null || _Live2DFactory$motion === void 0 ? void 0 : _Live2DFactory$motion[group];
				if (taskGroup) delete taskGroup[index];
				const motion = motionManager.createMotion(data, group, definition);
				motionManager.emit("motionLoaded", group, index, motion);
				return motion;
			}).catch((e) => {
				logger.warn(motionManager.tag, `Failed to load motion: ${path}\n`, e);
				handleError(e);
			}));
			return taskGroup[index];
		} catch (e) {
			logger.warn(motionManager.tag, `Failed to load motion at "${group}"[${index}]\n`, e);
			handleError(e);
		}
		return Promise.resolve(void 0);
	}
	/**
	* Loads an Expression and registers the task to {@link expressionTasksMap}. The task will be automatically
	* canceled when its owner - the ExpressionManager instance - has been destroyed.
	* @param expressionManager - ExpressionManager that owns this Expression.
	* @param index - Index of the Expression.
	* @return Promise that resolves with the Expression, or with undefined if it can't be loaded.
	*/
	static loadExpression(expressionManager, index) {
		const handleError = (e) => expressionManager.emit("expressionLoadError", index, e);
		try {
			var _runtime$expressionDa, _tasks, _tasks$index;
			const definition = expressionManager.definitions[index];
			if (!definition) return Promise.resolve(void 0);
			if (!expressionManager.listeners("destroy").includes(Live2DFactory.releaseTasks)) expressionManager.once("destroy", Live2DFactory.releaseTasks);
			let tasks = Live2DFactory.expressionTasksMap.get(expressionManager);
			if (!tasks) {
				tasks = [];
				Live2DFactory.expressionTasksMap.set(expressionManager, tasks);
			}
			const path = expressionManager.getExpressionFile(definition);
			const runtime = Live2DFactory.findRuntime(expressionManager.settings);
			const loadType = (_runtime$expressionDa = runtime === null || runtime === void 0 ? void 0 : runtime.expressionDataType) !== null && _runtime$expressionDa !== void 0 ? _runtime$expressionDa : "json";
			(_tasks$index = (_tasks = tasks)[index]) !== null && _tasks$index !== void 0 || (_tasks[index] = Live2DLoader.load({
				url: path,
				settings: expressionManager.settings,
				type: loadType,
				target: expressionManager
			}).then((data) => {
				const tasks = Live2DFactory.expressionTasksMap.get(expressionManager);
				if (tasks) delete tasks[index];
				const expression = expressionManager.createExpression(data, definition);
				expressionManager.emit("expressionLoaded", index, expression);
				return expression;
			}).catch((e) => {
				logger.warn(expressionManager.tag, `Failed to load expression: ${path}\n`, e);
				handleError(e);
			}));
			return tasks[index];
		} catch (e) {
			logger.warn(expressionManager.tag, `Failed to load expression at [${index}]\n`, e);
			handleError(e);
		}
		return Promise.resolve(void 0);
	}
	static releaseTasks() {
		if (this instanceof MotionManager) Live2DFactory.motionTasksMap.delete(this);
		else Live2DFactory.expressionTasksMap.delete(this);
	}
};
_Live2DFactory = Live2DFactory;
_Live2DFactory.runtimes = [];
_Live2DFactory.urlToJSON = urlToJSON;
_Live2DFactory.jsonToSettings = jsonToSettings;
_Live2DFactory.waitUntilReady = waitUntilReady;
_Live2DFactory.setupOptionals = setupOptionals;
_Live2DFactory.setupEssentials = setupEssentials;
_Live2DFactory.createInternalModel = createInternalModel;
_Live2DFactory.live2DModelMiddlewares = [
	ZipLoader.factory,
	FileLoader.factory,
	urlToJSON,
	jsonToSettings,
	waitUntilReady,
	setupOptionals,
	setupEssentials,
	createInternalModel
];
_Live2DFactory.motionTasksMap = /* @__PURE__ */ new WeakMap();
_Live2DFactory.expressionTasksMap = /* @__PURE__ */ new WeakMap();
MotionManager.prototype["_loadMotion"] = function(group, index) {
	return Live2DFactory.loadMotion(this, group, index);
};
ExpressionManager.prototype["_loadExpression"] = function(index) {
	return Live2DFactory.loadExpression(this, index);
};
FileLoader["live2dFactory"] = Live2DFactory;
ZipLoader["live2dFactory"] = Live2DFactory;
//#endregion
//#region src/Automator.ts
var Automator = class Automator {
	get ticker() {
		return this._ticker;
	}
	set ticker(ticker) {
		if (this._ticker) this._ticker.remove(onTickerUpdate, this);
		this._ticker = ticker;
		if (this._autoUpdate) {
			var _this$_ticker;
			(_this$_ticker = this._ticker) === null || _this$_ticker === void 0 || _this$_ticker.add(onTickerUpdate, this);
		}
	}
	/**
	* @see {@link AutomatorOptions.autoUpdate}
	*/
	get autoUpdate() {
		return this._autoUpdate;
	}
	set autoUpdate(autoUpdate) {
		if (this.destroyed) return;
		if (autoUpdate) if (this._ticker) {
			this._ticker.add(onTickerUpdate, this);
			this._autoUpdate = true;
		} else logger.warn(this.model.tag, "No Ticker to be used for automatic updates. Either set option.ticker when creating Live2DModel, or expose PIXI to global scope (window.PIXI = PIXI).");
		else {
			var _this$_ticker2;
			(_this$_ticker2 = this._ticker) === null || _this$_ticker2 === void 0 || _this$_ticker2.remove(onTickerUpdate, this);
			this._autoUpdate = false;
		}
	}
	/**
	* @see {@link AutomatorOptions.autoHitTest}
	*/
	get autoHitTest() {
		return this._autoHitTest;
	}
	set autoHitTest(autoHitTest) {
		if (autoHitTest !== this.autoHitTest) {
			if (autoHitTest) this.model.on("pointertap", onTap, this);
			else this.model.off("pointertap", onTap, this);
			this._autoHitTest = autoHitTest;
		}
	}
	/**
	* @see {@link AutomatorOptions.autoFocus}
	*/
	get autoFocus() {
		return this._autoFocus;
	}
	set autoFocus(autoFocus) {
		if (autoFocus !== this.autoFocus) {
			if (autoFocus) this.model.on("globalpointermove", onPointerMove, this);
			else this.model.off("globalpointermove", onPointerMove, this);
			this._autoFocus = autoFocus;
		}
	}
	/**
	* @see {@link AutomatorOptions.autoInteract}
	*/
	get autoInteract() {
		return this._autoHitTest && this._autoFocus;
	}
	set autoInteract(autoInteract) {
		this.autoHitTest = autoInteract;
		this.autoFocus = autoInteract;
	}
	constructor(model, { autoUpdate = true, autoHitTest = true, autoFocus = true, autoInteract, ticker } = {}) {
		this.destroyed = false;
		this._autoUpdate = false;
		this._autoHitTest = false;
		this._autoFocus = false;
		if (!ticker) {
			if (Automator.defaultTicker) ticker = Automator.defaultTicker;
			else if (typeof PIXI !== "undefined") ticker = PIXI.Ticker.shared;
		}
		if (autoInteract !== void 0) {
			autoHitTest = autoInteract;
			autoFocus = autoInteract;
			logger.warn(model.tag, "options.autoInteract is deprecated since v0.5.0, use autoHitTest and autoFocus instead.");
		}
		this.model = model;
		this.ticker = ticker;
		this.autoUpdate = autoUpdate;
		this.autoHitTest = autoHitTest;
		this.autoFocus = autoFocus;
		if (autoHitTest || autoFocus) this.model.eventMode = "static";
	}
	onTickerUpdate() {
		const deltaMS = this.ticker.deltaMS;
		this.model.update(deltaMS);
	}
	onTap(event) {
		this.model.tap(event.global.x, event.global.y);
	}
	onPointerMove(event) {
		this.model.focus(event.global.x, event.global.y);
	}
	destroy() {
		this.autoFocus = false;
		this.autoHitTest = false;
		this.autoUpdate = false;
		this.ticker = void 0;
		this.destroyed = true;
	}
};
function onTickerUpdate() {
	this.onTickerUpdate();
}
function onTap(event) {
	this.onTap(event);
}
function onPointerMove(event) {
	this.onPointerMove(event);
}
//#endregion
//#region src/WebGLContextLifecycle.ts
var _Live2DWebGLContextSystem;
var rendererContextStates = /* @__PURE__ */ new WeakMap();
var lifecycleListeners = /* @__PURE__ */ new Set();
function registerWebGLContextLifecycleListener(listener) {
	lifecycleListeners.add(listener);
	return () => lifecycleListeners.delete(listener);
}
function getWebGLRendererContextState(renderer) {
	let state = rendererContextStates.get(renderer);
	if (!state) {
		state = createRendererContextState(renderer);
		state.gl = renderer.gl;
		state.initialized = Boolean(state.gl);
		rendererContextStates.set(renderer, state);
		const canvas = renderer.canvas;
		if (canvas) {
			state.fallbackContextLost = () => {
				for (const releaseOwner of [...state.owners]) releaseOwner(state);
				state.owners.clear();
			};
			state.fallbackContextRestored = () => {
				const gl = renderer.gl;
				if (gl) advanceContext(state, gl);
			};
			canvas.addEventListener("webglcontextlost", state.fallbackContextLost);
			canvas.addEventListener("webglcontextrestored", state.fallbackContextRestored);
		}
	}
	return state;
}
function beginFallbackWebGLFrame(state) {
	var _listener$prerender;
	if (state.managedByPixiSystem || !state.gl) return;
	for (const listener of lifecycleListeners) (_listener$prerender = listener.prerender) === null || _listener$prerender === void 0 || _listener$prerender.call(listener, state.gl);
}
function endFallbackWebGLFrame(state) {
	var _listener$postrender;
	if (state.managedByPixiSystem || !state.gl) return;
	for (const listener of lifecycleListeners) (_listener$postrender = listener.postrender) === null || _listener$postrender === void 0 || _listener$postrender.call(listener, state.gl);
}
function createRendererContextState(renderer) {
	return {
		renderer,
		owners: /* @__PURE__ */ new Set(),
		epoch: {},
		generation: 0,
		initialized: false,
		managedByPixiSystem: false
	};
}
function advanceContext(state, gl) {
	if (state.initialized) {
		state.generation++;
		state.epoch = {};
	}
	state.gl = gl;
	state.initialized = true;
	for (const listener of lifecycleListeners) {
		var _listener$contextChan;
		(_listener$contextChan = listener.contextChange) === null || _listener$contextChan === void 0 || _listener$contextChan.call(listener, gl, state.epoch);
	}
}
function destroyRendererContext(state) {
	const gl = state.gl;
	for (const releaseOwner of [...state.owners]) releaseOwner(state);
	state.owners.clear();
	if (gl) for (const listener of lifecycleListeners) {
		var _listener$destroy;
		(_listener$destroy = listener.destroy) === null || _listener$destroy === void 0 || _listener$destroy.call(listener, gl);
	}
	const canvas = state.renderer.canvas;
	if (canvas && state.fallbackContextLost) canvas.removeEventListener("webglcontextlost", state.fallbackContextLost);
	if (canvas && state.fallbackContextRestored) canvas.removeEventListener("webglcontextrestored", state.fallbackContextRestored);
	rendererContextStates.delete(state.renderer);
	state.gl = void 0;
}
var Live2DWebGLContextSystem = class {
	constructor(renderer) {
		var _rendererContextState;
		this.renderer = renderer;
		this.state = (_rendererContextState = rendererContextStates.get(renderer)) !== null && _rendererContextState !== void 0 ? _rendererContextState : createRendererContextState(renderer);
		this.state.managedByPixiSystem = true;
		rendererContextStates.set(renderer, this.state);
	}
	contextChange(gl) {
		advanceContext(this.state, gl);
	}
	prerender() {
		if (!this.state.gl) return;
		for (const listener of lifecycleListeners) {
			var _listener$prerender2;
			(_listener$prerender2 = listener.prerender) === null || _listener$prerender2 === void 0 || _listener$prerender2.call(listener, this.state.gl);
		}
	}
	postrender() {
		if (!this.state.gl) return;
		for (const listener of lifecycleListeners) {
			var _listener$postrender2;
			(_listener$postrender2 = listener.postrender) === null || _listener$postrender2 === void 0 || _listener$postrender2.call(listener, this.state.gl);
		}
	}
	destroy() {
		destroyRendererContext(this.state);
		this.renderer = void 0;
	}
};
_Live2DWebGLContextSystem = Live2DWebGLContextSystem;
_Live2DWebGLContextSystem.extension = {
	type: [ExtensionType.WebGLSystem],
	name: "live2dContext"
};
extensions.add(Live2DWebGLContextSystem);
//#endregion
//#region src/Live2DModel.ts
var tempPoint = new Point();
var tempMatrix$1 = new Matrix();
/**
* A wrapper that allows the Live2D model to be used as a DisplayObject in PixiJS.
*
* ```js
* const model = await Live2DModel.from('shizuku.model3.json');
* container.add(model);
* ```
* Emits the Live2D model event set.
*/
var Live2DModel = class extends ViewContainer {
	/**
	* Creates a Live2DModel from given source.
	* @param source - Can be one of: settings file URL, settings JSON object, ModelSettings instance.
	* @param options - Options for the creation.
	* @return Promise that resolves with the Live2DModel.
	*/
	static from(source, options) {
		const model = new this(options);
		return Live2DFactory.setupLive2DModel(model, source, options).then(() => {
			var _options$onLoad;
			options === null || options === void 0 || (_options$onLoad = options.onLoad) === null || _options$onLoad === void 0 || _options$onLoad.call(options);
			return model;
		}).catch((error) => {
			var _options$onError;
			options === null || options === void 0 || (_options$onError = options.onError) === null || _options$onError === void 0 || _options$onError.call(options, error);
			throw error;
		});
	}
	/**
	* Synchronous version of `Live2DModel.from()`. This method immediately returns a Live2DModel instance,
	* whose resources have not been loaded. Therefore this model can't be manipulated or rendered
	* until the "load" event has been emitted.
	*
	* ```js
	* // no `await` here as it's not a Promise
	* const model = Live2DModel.fromSync('shizuku.model3.json');
	*
	* // these will cause errors!
	* // app.stage.addChild(model);
	* // model.motion('tap_body');
	*
	* model.once('load', () => {
	*     // now it's safe
	*     app.stage.addChild(model);
	*     model.motion('tap_body');
	* });
	* ```
	*/
	static fromSync(source, options) {
		const model = new this(options);
		Live2DFactory.setupLive2DModel(model, source, options).then(options === null || options === void 0 ? void 0 : options.onLoad).catch(options === null || options === void 0 ? void 0 : options.onError);
		return model;
	}
	/**
	* Registers the class of `PIXI.Ticker` for auto updating.
	* @deprecated Use the `ticker` creation option instead.
	*/
	static registerTicker(tickerClass) {
		Automator["defaultTicker"] = tickerClass.shared;
	}
	constructor(options) {
		super({ label: "Live2DModel" });
		this.renderPipeId = "customRender";
		this.batched = false;
		this.allowChildren = true;
		this.tag = "Live2DModel(uninitialized)";
		this.textures = [];
		this._anchorObserver = { _onUpdate: () => this.onAnchorChange() };
		this.anchor = new ObservablePoint(this._anchorObserver, 0, 0);
		this.releaseRendererContext = (state) => {
			if (this.rendererContextState !== state) return;
			state.owners.delete(this.releaseRendererContext);
			if (this.glContext) {
				var _this$internalModel;
				(_this$internalModel = this.internalModel) === null || _this$internalModel === void 0 || _this$internalModel.releaseWebGLContext(this.glContext);
			}
			this.glContext = void 0;
			this.rendererContextState = void 0;
			this.rendererContextEpoch = void 0;
		};
		this.glContextID = 0;
		this.elapsedTime = 0;
		this.deltaTime = 0;
		this.automator = new Automator(this, options);
		this.once("modelLoaded", () => this.init(options));
	}
	/**
	* A handler of the "modelLoaded" event, invoked when the internal model has been loaded.
	*/
	init(options) {
		this.tag = `Live2DModel(${this.internalModel.settings.name})`;
		this.onAnchorChange();
	}
	/**
	* A callback that observes `anchor`, invoked when the anchor values change.
	*/
	onAnchorChange() {
		if (!this.internalModel) return;
		this.pivot.set(this.anchor.x * this.internalModel.width, this.anchor.y * this.internalModel.height);
	}
	/**
	* Shorthand to start a motion.
	* @param group - The motion group.
	* @param index - The index in this group. If not presented, a random motion will be started.
	* @param priority - The motion priority. Defaults to `MotionPriority.NORMAL`.
	* @return Promise that resolves with true if the motion is successfully started, with false otherwise.
	*/
	motion(group, index, priority) {
		return index === void 0 ? this.internalModel.motionManager.startRandomMotion(group, priority) : this.internalModel.motionManager.startMotion(group, index, priority);
	}
	/**
	* Shorthand to set an expression.
	* @param id - Either the index, or the name of the expression. If not presented, a random expression will be set.
	* @return Promise that resolves with true if succeeded, with false otherwise.
	*/
	expression(id) {
		if (this.internalModel.motionManager.expressionManager) return id === void 0 ? this.internalModel.motionManager.expressionManager.setRandomExpression() : this.internalModel.motionManager.expressionManager.setExpression(id);
		return Promise.resolve(false);
	}
	/**
	* Updates the focus position. This will not cause the model to immediately look at the position,
	* instead the movement will be interpolated.
	* @param x - Position in world space.
	* @param y - Position in world space.
	* @param instant - Should the focus position be instantly applied.
	*/
	focus(x, y, instant = false) {
		tempPoint.x = x;
		tempPoint.y = y;
		this.toModelPosition(tempPoint, tempPoint, true);
		const tx = tempPoint.x / this.internalModel.originalWidth * 2 - 1;
		const ty = tempPoint.y / this.internalModel.originalHeight * 2 - 1;
		const radian = Math.atan2(ty, tx);
		this.internalModel.focusController.focus(Math.cos(radian), -Math.sin(radian), instant);
	}
	/**
	* Tap on the model. This will perform a hit-testing, and emit a "hit" event
	* if at least one of the hit areas is hit.
	* @param x - Position in world space.
	* @param y - Position in world space.
	* Emits `hit` when at least one hit area matches.
	*/
	tap(x, y) {
		const hitAreaNames = this.hitTest(x, y);
		if (hitAreaNames.length) {
			logger.log(this.tag, `Hit`, hitAreaNames);
			this.emit("hit", hitAreaNames);
		}
	}
	/**
	* Hit-test on the model.
	* @param x - Position in world space.
	* @param y - Position in world space.
	* @return The names of the *hit* hit areas. Can be empty if none is hit.
	*/
	hitTest(x, y) {
		tempPoint.x = x;
		tempPoint.y = y;
		this.toModelPosition(tempPoint, tempPoint);
		return this.internalModel.hitTest(tempPoint.x, tempPoint.y);
	}
	/**
	* Calculates the position in the canvas of original, unscaled Live2D model.
	* @param position - A Point in world space.
	* @param result - A Point to store the new value. Defaults to a new Point.
	* @param skipUpdate - True to skip the update transform.
	* @return The Point in model canvas space.
	*/
	toModelPosition(position, result = position.clone(), skipUpdate) {
		this.toLocal(position, void 0, result, skipUpdate);
		this.internalModel.localTransform.applyInverse(result, result);
		return result;
	}
	/** @internal */
	updateBounds() {
		this._bounds.clear();
		if (!this.internalModel) return;
		this._bounds.addFrame(0, 0, this.internalModel.width, this.internalModel.height);
	}
	/**
	* Updates the model. Note this method just updates the timer,
	* and the actual update will be done right before rendering the model.
	* @param dt - The elapsed time in milliseconds since last frame.
	*/
	update(dt) {
		this.deltaTime += dt;
		this.elapsedTime += dt;
	}
	render(renderer) {
		var _renderer$context;
		if (!this.internalModel) return;
		const gl = renderer.gl;
		if (!gl) throw new Error("Cubism SDK for Web R5 requires a Pixi WebGL 2 renderer; no WebGL context is active.");
		const webGLVersion = (_renderer$context = renderer.context) === null || _renderer$context === void 0 ? void 0 : _renderer$context.webGLVersion;
		if (!(webGLVersion === 2 || webGLVersion === void 0 && typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext)) throw new Error("Cubism SDK for Web R5 requires WebGL 2; the active Pixi renderer is using WebGL 1.");
		const webGL2 = gl;
		if (webGL2.isContextLost()) return;
		const savedState = this.captureWebGLState(webGL2);
		this.internalModel.viewport = [...savedState.viewport];
		let fallbackFrameState;
		try {
			var _renderer$shader, _renderer$shader$rese, _renderer$geometry, _renderer$geometry$re, _renderer$state, _renderer$state$reset, _renderer$stencil, _renderer$stencil$res, _renderer$globalUnifo;
			(_renderer$shader = renderer.shader) === null || _renderer$shader === void 0 || (_renderer$shader$rese = _renderer$shader.resetState) === null || _renderer$shader$rese === void 0 || _renderer$shader$rese.call(_renderer$shader);
			(_renderer$geometry = renderer.geometry) === null || _renderer$geometry === void 0 || (_renderer$geometry$re = _renderer$geometry.resetState) === null || _renderer$geometry$re === void 0 || _renderer$geometry$re.call(_renderer$geometry);
			(_renderer$state = renderer.state) === null || _renderer$state === void 0 || (_renderer$state$reset = _renderer$state.resetState) === null || _renderer$state$reset === void 0 || _renderer$state$reset.call(_renderer$state);
			(_renderer$stencil = renderer.stencil) === null || _renderer$stencil === void 0 || (_renderer$stencil$res = _renderer$stencil.resetState) === null || _renderer$stencil$res === void 0 || _renderer$stencil$res.call(_renderer$stencil);
			const rendererContextState = getWebGLRendererContextState(renderer);
			if (!rendererContextState.managedByPixiSystem) {
				beginFallbackWebGLFrame(rendererContextState);
				fallbackFrameState = rendererContextState;
			}
			if (this.glContext !== webGL2 || this.rendererContextState !== rendererContextState || this.rendererContextEpoch !== rendererContextState.epoch) {
				var _this$rendererContext;
				(_this$rendererContext = this.rendererContextState) === null || _this$rendererContext === void 0 || _this$rendererContext.owners.delete(this.releaseRendererContext);
				rendererContextState.owners.add(this.releaseRendererContext);
				this.glContext = webGL2;
				this.rendererContextState = rendererContextState;
				this.rendererContextEpoch = rendererContextState.epoch;
				this.glContextID++;
				try {
					this.internalModel.updateWebGLContext(webGL2, this.glContextID, rendererContextState.epoch);
				} catch (error) {
					this.internalModel.releaseWebGLContext(webGL2);
					rendererContextState.owners.delete(this.releaseRendererContext);
					this.glContext = void 0;
					this.rendererContextState = void 0;
					this.rendererContextEpoch = void 0;
					throw error;
				}
			}
			for (let i = 0; i < this.textures.length; i++) {
				const texture = this.textures[i];
				webGL2.pixelStorei(webGL2.UNPACK_FLIP_Y_WEBGL, this.internalModel.textureFlipY);
				renderer.texture.bind(texture, 0);
				const glTexture = renderer.texture.getGlSource(texture.source).texture;
				this.internalModel.bindTexture(i, glTexture);
			}
			if (this.deltaTime) {
				this.internalModel.update(this.deltaTime, this.elapsedTime);
				this.deltaTime = 0;
			}
			const projectionMatrix = (_renderer$globalUnifo = renderer.globalUniforms) === null || _renderer$globalUnifo === void 0 || (_renderer$globalUnifo = _renderer$globalUnifo.globalUniformData) === null || _renderer$globalUnifo === void 0 ? void 0 : _renderer$globalUnifo.projectionMatrix;
			if (!projectionMatrix) return;
			const internalTransform = tempMatrix$1.copyFrom(projectionMatrix).append(this.worldTransform);
			this.internalModel.updateTransform(internalTransform);
			this.internalModel.draw(webGL2);
		} finally {
			try {
				if (fallbackFrameState) endFallbackWebGLFrame(fallbackFrameState);
			} finally {
				this.restorePixiWebGLState(renderer, webGL2, savedState);
			}
		}
	}
	captureWebGLState(gl) {
		const viewport = gl.getParameter(gl.VIEWPORT);
		const clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
		return {
			drawFramebuffer: gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),
			readFramebuffer: gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),
			viewport: [
				viewport[0],
				viewport[1],
				viewport[2],
				viewport[3]
			],
			clearColor: [
				clearColor[0],
				clearColor[1],
				clearColor[2],
				clearColor[3]
			]
		};
	}
	restorePixiWebGLState(renderer, gl, state) {
		var _renderer$state2, _renderer$state2$rese, _renderer$texture, _renderer$texture$res, _renderer$shader2, _renderer$shader2$res, _renderer$geometry2, _renderer$geometry2$r, _renderer$stencil2, _renderer$stencil2$re, _renderer$colorMask, _renderer$colorMask$r, _renderer$buffer, _renderer$buffer$rese;
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, state.drawFramebuffer);
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, state.readFramebuffer);
		gl.viewport(...state.viewport);
		gl.clearColor(...state.clearColor);
		(_renderer$state2 = renderer.state) === null || _renderer$state2 === void 0 || (_renderer$state2$rese = _renderer$state2.resetState) === null || _renderer$state2$rese === void 0 || _renderer$state2$rese.call(_renderer$state2);
		(_renderer$texture = renderer.texture) === null || _renderer$texture === void 0 || (_renderer$texture$res = _renderer$texture.resetState) === null || _renderer$texture$res === void 0 || _renderer$texture$res.call(_renderer$texture);
		(_renderer$shader2 = renderer.shader) === null || _renderer$shader2 === void 0 || (_renderer$shader2$res = _renderer$shader2.resetState) === null || _renderer$shader2$res === void 0 || _renderer$shader2$res.call(_renderer$shader2);
		(_renderer$geometry2 = renderer.geometry) === null || _renderer$geometry2 === void 0 || (_renderer$geometry2$r = _renderer$geometry2.resetState) === null || _renderer$geometry2$r === void 0 || _renderer$geometry2$r.call(_renderer$geometry2);
		(_renderer$stencil2 = renderer.stencil) === null || _renderer$stencil2 === void 0 || (_renderer$stencil2$re = _renderer$stencil2.resetState) === null || _renderer$stencil2$re === void 0 || _renderer$stencil2$re.call(_renderer$stencil2);
		(_renderer$colorMask = renderer.colorMask) === null || _renderer$colorMask === void 0 || (_renderer$colorMask$r = _renderer$colorMask.resetState) === null || _renderer$colorMask$r === void 0 || _renderer$colorMask$r.call(_renderer$colorMask);
		(_renderer$buffer = renderer.buffer) === null || _renderer$buffer === void 0 || (_renderer$buffer$rese = _renderer$buffer.resetState) === null || _renderer$buffer$rese === void 0 || _renderer$buffer$rese.call(_renderer$buffer);
	}
	/**
	* Destroys the model and all related resources. This takes the same options and also
	* behaves the same as `PIXI.Container#destroy`.
	* @param options - Options parameter. A boolean will act as if all options
	*  have been set to that value
	* @param [options.children=false] - if set to true, all the children will have their destroy
	*  method called as well. 'options' will be passed on to those calls.
	* @param [options.texture=false] - Only used for child Sprites if options.children is set to true
	*  Should it destroy the texture of the child sprite
	* @param [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
	*  Should it destroy the base texture of the child sprite
	*/
	destroy(options) {
		var _this$rendererContext2, _this$internalModel2;
		this.emit("destroy");
		(_this$rendererContext2 = this.rendererContextState) === null || _this$rendererContext2 === void 0 || _this$rendererContext2.owners.delete(this.releaseRendererContext);
		this.rendererContextState = void 0;
		this.rendererContextEpoch = void 0;
		this.glContext = void 0;
		if (typeof options === "object" && (options === null || options === void 0 ? void 0 : options.texture)) {
			var _options$textureSourc;
			const destroySource = Boolean((_options$textureSourc = options.textureSource) !== null && _options$textureSourc !== void 0 ? _options$textureSourc : options.baseTexture);
			this.textures.forEach((texture) => texture.destroy(destroySource));
		}
		this.automator.destroy();
		(_this$internalModel2 = this.internalModel) === null || _this$internalModel2 === void 0 || _this$internalModel2.destroy();
		super.destroy(options);
	}
};
//#endregion
//#region src/Live2DTransform.ts
/**
* Useless class. May be useful in the future.
*/
var Live2DTransform = class extends Transform {};
//#endregion
//#region src/cubism5/check-runtime.ts
if (!window.Live2DCubismCore) throw new Error("Could not find Cubism runtime. This plugin requires live2dcubismcore.js to be loaded.");
//#endregion
//#region cubism/src/id/cubismid.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* パラメータ名・パーツ名・Drawable名を保持
*
* パラメータ名・パーツ名・Drawable名を保持するクラス。
*
* @note 指定したID文字列からCubismIdを取得する際はこのクラスの生成メソッドを呼ばず、
*       CubismIdManager().getId(id)を使用してください
*/
var CubismId = class CubismId {
	/**
	* 内部で使用するCubismIdクラス生成メソッド
	*
	* @param id ID文字列
	* @return CubismId
	* @note 指定したID文字列からCubismIdを取得する際は
	*       CubismIdManager().getId(id)を使用してください
	*/
	static createIdInternal(id) {
		return new CubismId(id);
	}
	/**
	* ID名を取得する
	*/
	getString() {
		return this._id;
	}
	/**
	* idを比較
	* @param c 比較するid
	* @return 同じならばtrue,異なっていればfalseを返す
	*/
	isEqual(c) {
		if (typeof c === "string") return this._id == c;
		else if (c instanceof CubismId) return this._id == c._id;
		return false;
	}
	/**
	* idを比較
	* @param c 比較するid
	* @return 同じならばtrue,異なっていればfalseを返す
	*/
	isNotEqual(c) {
		if (typeof c == "string") return !(this._id == c);
		else if (c instanceof CubismId) return !(this._id == c._id);
		return false;
	}
	/**
	* プライベートコンストラクタ
	*
	* @note ユーザーによる生成は許可しません
	*/
	constructor(id) {
		this._id = id;
	}
};
var Live2DCubismFramework$29;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismId = CubismId;
})(Live2DCubismFramework$29 || (Live2DCubismFramework$29 = {}));
//#endregion
//#region cubism/src/id/cubismidmanager.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* ID名の管理
*
* ID名を管理する。
*/
var CubismIdManager = class {
	/**
	* コンストラクタ
	*/
	constructor() {
		this._ids = new Array();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		for (let i = 0; i < this._ids.length; ++i) this._ids[i] = void 0;
		this._ids = null;
	}
	/**
	* ID名をリストから登録
	*
	* @param ids ID名リスト
	* @param count IDの個数
	*/
	registerIds(ids) {
		for (let i = 0; i < ids.length; i++) this.registerId(ids[i]);
	}
	/**
	* ID名を登録
	*
	* @param id ID名
	*/
	registerId(id) {
		let result = null;
		if ("string" == typeof id) {
			if ((result = this.findId(id)) != null) return result;
			result = CubismId.createIdInternal(id);
			this._ids.push(result);
		} else return this.registerId(id);
		return result;
	}
	/**
	* ID名からIDを取得する
	*
	* @param id ID名
	*/
	getId(id) {
		return this.registerId(id);
	}
	/**
	* ID名からIDの確認
	*
	* @return true 存在する
	* @return false 存在しない
	*/
	isExist(id) {
		if ("string" == typeof id) return this.findId(id) != null;
		return this.isExist(id);
	}
	/**
	* ID名からIDを検索する。
	*
	* @param id ID名
	* @return 登録されているID。なければNULL。
	*/
	findId(id) {
		for (let i = 0; i < this._ids.length; ++i) if (this._ids[i].getString() == id) return this._ids[i];
		return null;
	}
};
var Live2DCubismFramework$28;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismIdManager = CubismIdManager;
})(Live2DCubismFramework$28 || (Live2DCubismFramework$28 = {}));
//#endregion
//#region cubism/src/math/cubismvector2.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* 2次元ベクトル型
*
* 2次元ベクトル型の機能を提供する。
*/
var CubismVector2 = class CubismVector2 {
	/**
	* コンストラクタ
	*/
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.x = x == void 0 ? 0 : x;
		this.y = y == void 0 ? 0 : y;
	}
	/**
	* ベクトルの加算
	*
	* @param vector2 加算するベクトル値
	* @return 加算結果 ベクトル値
	*/
	add(vector2) {
		const ret = new CubismVector2(0, 0);
		ret.x = this.x + vector2.x;
		ret.y = this.y + vector2.y;
		return ret;
	}
	/**
	* ベクトルの減算
	*
	* @param vector2 減算するベクトル値
	* @return 減算結果 ベクトル値
	*/
	substract(vector2) {
		const ret = new CubismVector2(0, 0);
		ret.x = this.x - vector2.x;
		ret.y = this.y - vector2.y;
		return ret;
	}
	/**
	* ベクトルの乗算
	*
	* @param vector2 乗算するベクトル値
	* @return 乗算結果 ベクトル値
	*/
	multiply(vector2) {
		const ret = new CubismVector2(0, 0);
		ret.x = this.x * vector2.x;
		ret.y = this.y * vector2.y;
		return ret;
	}
	/**
	* ベクトルの乗算(スカラー)
	*
	* @param scalar 乗算するスカラー値
	* @return 乗算結果 ベクトル値
	*/
	multiplyByScaler(scalar) {
		return this.multiply(new CubismVector2(scalar, scalar));
	}
	/**
	* ベクトルの除算
	*
	* @param vector2 除算するベクトル値
	* @return 除算結果 ベクトル値
	*/
	division(vector2) {
		const ret = new CubismVector2(0, 0);
		ret.x = this.x / vector2.x;
		ret.y = this.y / vector2.y;
		return ret;
	}
	/**
	* ベクトルの除算(スカラー)
	*
	* @param scalar 除算するスカラー値
	* @return 除算結果 ベクトル値
	*/
	divisionByScalar(scalar) {
		return this.division(new CubismVector2(scalar, scalar));
	}
	/**
	* ベクトルの長さを取得する
	*
	* @return ベクトルの長さ
	*/
	getLength() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	/**
	* ベクトルの距離の取得
	*
	* @param a 点
	* @return ベクトルの距離
	*/
	getDistanceWith(a) {
		return Math.sqrt((this.x - a.x) * (this.x - a.x) + (this.y - a.y) * (this.y - a.y));
	}
	/**
	* ドット積の計算
	*
	* @param a 値
	* @return 結果
	*/
	dot(a) {
		return this.x * a.x + this.y * a.y;
	}
	/**
	* 正規化の適用
	*/
	normalize() {
		const length = Math.pow(this.x * this.x + this.y * this.y, .5);
		this.x = this.x / length;
		this.y = this.y / length;
	}
	/**
	* 等しさの確認（等しいか？）
	*
	* 値が等しいか？
	*
	* @param rhs 確認する値
	* @return true 値は等しい
	* @return false 値は等しくない
	*/
	isEqual(rhs) {
		return this.x == rhs.x && this.y == rhs.y;
	}
	/**
	* 等しさの確認（等しくないか？）
	*
	* 値が等しくないか？
	*
	* @param rhs 確認する値
	* @return true 値は等しくない
	* @return false 値は等しい
	*/
	isNotEqual(rhs) {
		return !this.isEqual(rhs);
	}
};
var Live2DCubismFramework$27;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismVector2 = CubismVector2;
})(Live2DCubismFramework$27 || (Live2DCubismFramework$27 = {}));
//#endregion
//#region cubism/src/math/cubismmath.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
var _CubismMath;
/**
* 数値計算などに使用するユーティリティクラス
*/
var CubismMath = class CubismMath {
	/**
	* 第一引数の値を最小値と最大値の範囲に収めた値を返す
	*
	* @param value 収められる値
	* @param min   範囲の最小値
	* @param max   範囲の最大値
	* @return 最小値と最大値の範囲に収めた値
	*/
	static range(value, min, max) {
		if (value < min) value = min;
		else if (value > max) value = max;
		return value;
	}
	/**
	* サイン関数の値を求める
	*
	* @param x 角度値（ラジアン）
	* @return サイン関数sin(x)の値
	*/
	static sin(x) {
		return Math.sin(x);
	}
	/**
	* コサイン関数の値を求める
	*
	* @param x 角度値(ラジアン)
	* @return コサイン関数cos(x)の値
	*/
	static cos(x) {
		return Math.cos(x);
	}
	/**
	* 値の絶対値を求める
	*
	* @param x 絶対値を求める値
	* @return 値の絶対値
	*/
	static abs(x) {
		return Math.abs(x);
	}
	/**
	* 平方根(ルート)を求める
	* @param x -> 平方根を求める値
	* @return 値の平方根
	*/
	static sqrt(x) {
		return Math.sqrt(x);
	}
	/**
	* 立方根を求める
	* @param x -> 立方根を求める値
	* @return 値の立方根
	*/
	static cbrt(x) {
		if (x === 0) return x;
		let cx = x;
		const isNegativeNumber = cx < 0;
		if (isNegativeNumber) cx = -cx;
		let ret;
		if (cx === Infinity) ret = Infinity;
		else {
			ret = Math.exp(Math.log(cx) / 3);
			ret = (cx / (ret * ret) + 2 * ret) / 3;
		}
		return isNegativeNumber ? -ret : ret;
	}
	/**
	* イージング処理されたサインを求める
	* フェードイン・アウト時のイージングに利用できる
	*
	* @param value イージングを行う値
	* @return イージング処理されたサイン値
	*/
	static getEasingSine(value) {
		if (value < 0) return 0;
		else if (value > 1) return 1;
		return .5 - .5 * this.cos(value * Math.PI);
	}
	/**
	* 大きい方の値を返す
	*
	* @param left 左辺の値
	* @param right 右辺の値
	* @return 大きい方の値
	*/
	static max(left, right) {
		return left > right ? left : right;
	}
	/**
	* 小さい方の値を返す
	*
	* @param left  左辺の値
	* @param right 右辺の値
	* @return 小さい方の値
	*/
	static min(left, right) {
		return left > right ? right : left;
	}
	static clamp(val, min, max) {
		if (val < min) return min;
		else if (max < val) return max;
		return val;
	}
	/**
	* 角度値をラジアン値に変換する
	*
	* @param degrees   角度値
	* @return 角度値から変換したラジアン値
	*/
	static degreesToRadian(degrees) {
		return degrees / 180 * Math.PI;
	}
	/**
	* ラジアン値を角度値に変換する
	*
	* @param radian    ラジアン値
	* @return ラジアン値から変換した角度値
	*/
	static radianToDegrees(radian) {
		return radian * 180 / Math.PI;
	}
	/**
	* ２つのベクトルからラジアン値を求める
	*
	* @param from  始点ベクトル
	* @param to    終点ベクトル
	* @return ラジアン値から求めた方向ベクトル
	*/
	static directionToRadian(from, to) {
		let ret = Math.atan2(to.y, to.x) - Math.atan2(from.y, from.x);
		while (ret < -Math.PI) ret += Math.PI * 2;
		while (ret > Math.PI) ret -= Math.PI * 2;
		return ret;
	}
	/**
	* ２つのベクトルから角度値を求める
	*
	* @param from  始点ベクトル
	* @param to    終点ベクトル
	* @return 角度値から求めた方向ベクトル
	*/
	static directionToDegrees(from, to) {
		const radian = this.directionToRadian(from, to);
		let degree = this.radianToDegrees(radian);
		if (to.x - from.x > 0) degree = -degree;
		return degree;
	}
	/**
	* ラジアン値を方向ベクトルに変換する。
	*
	* @param totalAngle    ラジアン値
	* @return ラジアン値から変換した方向ベクトル
	*/
	static radianToDirection(totalAngle) {
		const ret = new CubismVector2();
		ret.x = this.sin(totalAngle);
		ret.y = this.cos(totalAngle);
		return ret;
	}
	/**
	* 三次方程式の三次項の係数が0になったときに補欠的に二次方程式の解をもとめる。
	* a * x^2 + b * x + c = 0
	*
	* @param   a -> 二次項の係数値
	* @param   b -> 一次項の係数値
	* @param   c -> 定数項の値
	* @return  二次方程式の解
	*/
	static quadraticEquation(a, b, c) {
		if (this.abs(a) < CubismMath.Epsilon) {
			if (this.abs(b) < CubismMath.Epsilon) return -c;
			return -c / b;
		}
		return -(b + this.sqrt(b * b - 4 * a * c)) / (2 * a);
	}
	/**
	* カルダノの公式によってベジェのt値に該当する３次方程式の解を求める。
	* 重解になったときには0.0～1.0の値になる解を返す。
	*
	* a * x^3 + b * x^2 + c * x + d = 0
	*
	* @param   a -> 三次項の係数値
	* @param   b -> 二次項の係数値
	* @param   c -> 一次項の係数値
	* @param   d -> 定数項の値
	* @return  0.0～1.0の間にある解
	*/
	static cardanoAlgorithmForBezier(a, b, c, d) {
		if (this.abs(a) < CubismMath.Epsilon) return this.range(this.quadraticEquation(b, c, d), 0, 1);
		const ba = b / a;
		const ca = c / a;
		const da = d / a;
		const p = (3 * ca - ba * ba) / 3;
		const p3 = p / 3;
		const q = (2 * ba * ba * ba - 9 * ba * ca + 27 * da) / 27;
		const q2 = q / 2;
		const discriminant = q2 * q2 + p3 * p3 * p3;
		const center = .5;
		const threshold = .51;
		if (discriminant < 0) {
			const mp3 = -p / 3;
			const mp33 = mp3 * mp3 * mp3;
			const r = this.sqrt(mp33);
			const t = -q / (2 * r);
			const cosphi = this.range(t, -1, 1);
			const phi = Math.acos(cosphi);
			const t1 = 2 * this.cbrt(r);
			const root1 = t1 * this.cos(phi / 3) - ba / 3;
			if (this.abs(root1 - center) < threshold) return this.range(root1, 0, 1);
			const root2 = t1 * this.cos((phi + 2 * Math.PI) / 3) - ba / 3;
			if (this.abs(root2 - center) < threshold) return this.range(root2, 0, 1);
			const root3 = t1 * this.cos((phi + 4 * Math.PI) / 3) - ba / 3;
			return this.range(root3, 0, 1);
		}
		if (discriminant == 0) {
			let u1;
			if (q2 < 0) u1 = this.cbrt(-q2);
			else u1 = -this.cbrt(q2);
			const root1 = 2 * u1 - ba / 3;
			if (this.abs(root1 - center) < threshold) return this.range(root1, 0, 1);
			const root2 = -u1 - ba / 3;
			return this.range(root2, 0, 1);
		}
		const sd = this.sqrt(discriminant);
		const root1 = this.cbrt(sd - q2) - this.cbrt(sd + q2) - ba / 3;
		return this.range(root1, 0, 1);
	}
	/**
	* 浮動小数点の余りを求める。
	*
	* @param dividend 被除数（割られる値）
	* @param divisor 除数（割る値）
	* @return 余り
	*/
	static mod(dividend, divisor) {
		if (!isFinite(dividend) || divisor === 0 || isNaN(dividend) || isNaN(divisor)) {
			console.warn(`divided: ${dividend}, divisor: ${divisor} mod() returns 'NaN'.`);
			return NaN;
		}
		const absDividend = Math.abs(dividend);
		const absDivisor = Math.abs(divisor);
		let result = absDividend - Math.floor(absDividend / absDivisor) * absDivisor;
		result *= Math.sign(dividend);
		return result;
	}
	/**
	* コンストラクタ
	*/
	constructor() {}
};
_CubismMath = CubismMath;
_CubismMath.Epsilon = 1e-5;
var Live2DCubismFramework$26;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMath = CubismMath;
})(Live2DCubismFramework$26 || (Live2DCubismFramework$26 = {}));
//#endregion
//#region cubism/src/math/cubismmatrix44.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* 4x4の行列
*
* 4x4行列の便利クラス。
*/
var CubismMatrix44 = class CubismMatrix44 {
	/**
	* コンストラクタ
	*/
	constructor() {
		this._tr = /* @__PURE__ */ new Float32Array(16);
		this.loadIdentity();
	}
	/**
	* 受け取った２つの行列の乗算を行う。
	*
	* @param a 行列a
	* @param b 行列b
	*
	* @return 乗算結果の行列
	*/
	static multiply(a, b, dst) {
		const c = new Float32Array([
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]);
		const n = 4;
		for (let i = 0; i < n; ++i) for (let j = 0; j < n; ++j) for (let k = 0; k < n; ++k) c[j + i * 4] += a[k + i * 4] * b[j + k * 4];
		for (let i = 0; i < 16; ++i) dst[i] = c[i];
	}
	/**
	* 単位行列に初期化する
	*/
	loadIdentity() {
		const c = new Float32Array([
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1
		]);
		this.setMatrix(c);
	}
	/**
	* 行列を設定
	*
	* @param tr 16個の浮動小数点数で表される4x4の行列
	*/
	setMatrix(tr) {
		for (let i = 0; i < 16; ++i) this._tr[i] = tr[i];
	}
	/**
	* 行列を浮動小数点数の配列で取得
	*
	* @return 16個の浮動小数点数で表される4x4の行列
	*/
	getArray() {
		return this._tr;
	}
	/**
	* X軸の拡大率を取得
	*
	* @return X軸の拡大率
	*/
	getScaleX() {
		return this._tr[0];
	}
	/**
	* Y軸の拡大率を取得する
	*
	* @return Y軸の拡大率
	*/
	getScaleY() {
		return this._tr[5];
	}
	/**
	* X軸の移動量を取得
	*
	* @return X軸の移動量
	*/
	getTranslateX() {
		return this._tr[12];
	}
	/**
	* Y軸の移動量を取得
	*
	* @return Y軸の移動量
	*/
	getTranslateY() {
		return this._tr[13];
	}
	/**
	* X軸の値を現在の行列で計算
	*
	* @param src X軸の値
	*
	* @return 現在の行列で計算されたX軸の値
	*/
	transformX(src) {
		return this._tr[0] * src + this._tr[12];
	}
	/**
	* Y軸の値を現在の行列で計算
	*
	* @param src Y軸の値
	*
	* @return 現在の行列で計算されたY軸の値
	*/
	transformY(src) {
		return this._tr[5] * src + this._tr[13];
	}
	/**
	* X軸の値を現在の行列で逆計算
	*/
	invertTransformX(src) {
		return (src - this._tr[12]) / this._tr[0];
	}
	/**
	* Y軸の値を現在の行列で逆計算
	*/
	invertTransformY(src) {
		return (src - this._tr[13]) / this._tr[5];
	}
	/**
	* 現在の行列の位置を起点にして移動
	*
	* 現在の行列の位置を起点にして相対的に移動する。
	*
	* @param x X軸の移動量
	* @param y Y軸の移動量
	*/
	translateRelative(x, y) {
		const tr1 = new Float32Array([
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			x,
			y,
			0,
			1
		]);
		CubismMatrix44.multiply(tr1, this._tr, this._tr);
	}
	/**
	* 現在の行列の位置を移動
	*
	* 現在の行列の位置を指定した位置へ移動する
	*
	* @param x X軸の移動量
	* @param y y軸の移動量
	*/
	translate(x, y) {
		this._tr[12] = x;
		this._tr[13] = y;
	}
	/**
	* 現在の行列のX軸の位置を指定した位置へ移動する
	*
	* @param x X軸の移動量
	*/
	translateX(x) {
		this._tr[12] = x;
	}
	/**
	* 現在の行列のY軸の位置を指定した位置へ移動する
	*
	* @param y Y軸の移動量
	*/
	translateY(y) {
		this._tr[13] = y;
	}
	/**
	* 現在の行列の拡大率を相対的に設定する
	*
	* @param x X軸の拡大率
	* @param y Y軸の拡大率
	*/
	scaleRelative(x, y) {
		const tr1 = new Float32Array([
			x,
			0,
			0,
			0,
			0,
			y,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1
		]);
		CubismMatrix44.multiply(tr1, this._tr, this._tr);
	}
	/**
	* 現在の行列の拡大率を指定した倍率に設定する
	*
	* @param x X軸の拡大率
	* @param y Y軸の拡大率
	*/
	scale(x, y) {
		this._tr[0] = x;
		this._tr[5] = y;
	}
	/**
	* 引数で与えられた行列にこの行列を乗算する。
	* (引数で与えられた行列) * (この行列)
	*
	* @note 関数名と実際の計算内容に乖離があるため、今後計算順が修正される可能性があります。
	* @param m 行列
	*/
	multiplyByMatrix(m) {
		CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
	}
	/**
	* 現在の行列の逆行列を求める。
	*
	* @return 現在の行列で計算された逆行列の値を返す
	*/
	getInvert() {
		const r00 = this._tr[0];
		const r10 = this._tr[1];
		const r20 = this._tr[2];
		const r01 = this._tr[4];
		const r11 = this._tr[5];
		const r21 = this._tr[6];
		const r02 = this._tr[8];
		const r12 = this._tr[9];
		const r22 = this._tr[10];
		const tx = this._tr[12];
		const ty = this._tr[13];
		const tz = this._tr[14];
		const det = r00 * (r11 * r22 - r12 * r21) - r01 * (r10 * r22 - r12 * r20) + r02 * (r10 * r21 - r11 * r20);
		const dst = new CubismMatrix44();
		if (CubismMath.abs(det) < CubismMath.Epsilon) {
			dst.loadIdentity();
			return dst;
		}
		const invDet = 1 / det;
		const inv00 = (r11 * r22 - r12 * r21) * invDet;
		const inv01 = -(r01 * r22 - r02 * r21) * invDet;
		const inv02 = (r01 * r12 - r02 * r11) * invDet;
		const inv10 = -(r10 * r22 - r12 * r20) * invDet;
		const inv11 = (r00 * r22 - r02 * r20) * invDet;
		const inv12 = -(r00 * r12 - r02 * r10) * invDet;
		const inv20 = (r10 * r21 - r11 * r20) * invDet;
		const inv21 = -(r00 * r21 - r01 * r20) * invDet;
		const inv22 = (r00 * r11 - r01 * r10) * invDet;
		dst._tr[0] = inv00;
		dst._tr[1] = inv10;
		dst._tr[2] = inv20;
		dst._tr[3] = 0;
		dst._tr[4] = inv01;
		dst._tr[5] = inv11;
		dst._tr[6] = inv21;
		dst._tr[7] = 0;
		dst._tr[8] = inv02;
		dst._tr[9] = inv12;
		dst._tr[10] = inv22;
		dst._tr[11] = 0;
		dst._tr[12] = -(inv00 * tx + inv01 * ty + inv02 * tz);
		dst._tr[13] = -(inv10 * tx + inv11 * ty + inv12 * tz);
		dst._tr[14] = -(inv20 * tx + inv21 * ty + inv22 * tz);
		dst._tr[15] = 1;
		return dst;
	}
	/**
	* オブジェクトのコピーを生成する
	*/
	clone() {
		const cloneMatrix = new CubismMatrix44();
		for (let i = 0; i < this._tr.length; i++) cloneMatrix._tr[i] = this._tr[i];
		return cloneMatrix;
	}
};
var Live2DCubismFramework$25;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMatrix44 = CubismMatrix44;
})(Live2DCubismFramework$25 || (Live2DCubismFramework$25 = {}));
//#endregion
//#region cubism/src/type/csmrectf.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* 矩形形状（座標・長さはfloat値）を定義するクラス
*/
var csmRect = class {
	/**
	* コンストラクタ
	* @param x 左端X座標
	* @param y 上端Y座標
	* @param w 幅
	* @param h 高さ
	*/
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
	}
	/**
	* 矩形中央のX座標を取得する
	*/
	getCenterX() {
		return this.x + .5 * this.width;
	}
	/**
	* 矩形中央のY座標を取得する
	*/
	getCenterY() {
		return this.y + .5 * this.height;
	}
	/**
	* 右側のX座標を取得する
	*/
	getRight() {
		return this.x + this.width;
	}
	/**
	* 下端のY座標を取得する
	*/
	getBottom() {
		return this.y + this.height;
	}
	/**
	* 矩形に値をセットする
	* @param r 矩形のインスタンス
	*/
	setRect(r) {
		this.x = r.x;
		this.y = r.y;
		this.width = r.width;
		this.height = r.height;
	}
	/**
	* 矩形中央を軸にして縦横を拡縮する
	* @param w 幅方向に拡縮する量
	* @param h 高さ方向に拡縮する量
	*/
	expand(w, h) {
		this.x -= w;
		this.y -= h;
		this.width += w * 2;
		this.height += h * 2;
	}
};
var Live2DCubismFramework$24;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.csmRect = csmRect;
})(Live2DCubismFramework$24 || (Live2DCubismFramework$24 = {}));
//#endregion
//#region cubism/src/utils/cubismdebug.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
var CubismLogPrint = (level, fmt, args) => {
	CubismDebug.print(level, "[CSM]" + fmt, args);
};
var CubismLogPrintIn = (level, fmt, args) => {
	CubismLogPrint(level, fmt + "\n", args);
};
var CSM_ASSERT = (expr) => {
	console.assert(expr);
};
var CubismLogDebug;
var CubismLogInfo;
var CubismLogWarning;
var CubismLogError;
CubismLogDebug = (fmt, ...args) => {
	CubismLogPrintIn(LogLevel.LogLevel_Debug, "[D]" + fmt, args);
};
CubismLogInfo = (fmt, ...args) => {
	CubismLogPrintIn(LogLevel.LogLevel_Info, "[I]" + fmt, args);
};
CubismLogWarning = (fmt, ...args) => {
	CubismLogPrintIn(LogLevel.LogLevel_Warning, "[W]" + fmt, args);
};
CubismLogError = (fmt, ...args) => {
	CubismLogPrintIn(LogLevel.LogLevel_Error, "[E]" + fmt, args);
};
/**
* デバッグ用のユーティリティクラス。
* ログの出力、バイトのダンプなど
*/
var CubismDebug = class {
	/**
	* ログを出力する。第一引数にログレベルを設定する。
	* CubismFramework.initialize()時にオプションで設定されたログ出力レベルを下回る場合はログに出さない。
	*
	* @param logLevel ログレベルの設定
	* @param format 書式付き文字列
	* @param args 可変長引数
	*/
	static print(logLevel, format, args) {
		if (logLevel < CubismFramework.getLoggingLevel()) return;
		const logPrint = CubismFramework.coreLogFunction;
		if (!logPrint) return;
		logPrint(format.replace(/\{(\d+)\}/g, (m, k) => {
			return args[k];
		}));
	}
	/**
	* データから指定した長さだけダンプ出力する。
	* CubismFramework.initialize()時にオプションで設定されたログ出力レベルを下回る場合はログに出さない。
	*
	* @param logLevel ログレベルの設定
	* @param data ダンプするデータ
	* @param length ダンプする長さ
	*/
	static dumpBytes(logLevel, data, length) {
		for (let i = 0; i < length; i++) {
			if (i % 16 == 0 && i > 0) this.print(logLevel, "\n");
			else if (i % 8 == 0 && i > 0) this.print(logLevel, "  ");
			this.print(logLevel, "{0} ", [data[i] & 255]);
		}
		this.print(logLevel, "\n");
	}
	/**
	* private コンストラクタ
	*/
	constructor() {}
};
var Live2DCubismFramework$23;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismDebug = CubismDebug;
})(Live2DCubismFramework$23 || (Live2DCubismFramework$23 = {}));
//#endregion
//#region cubism/src/rendering/cubismrenderer.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* モデル描画を処理するレンダラ
*
* サブクラスに環境依存の描画命令を記述する。
*/
var CubismRenderer = class {
	/**
	* レンダラのインスタンスを生成して取得する
	*
	* @return レンダラのインスタンス
	*/
	static create() {
		return null;
	}
	/**
	* レンダラのインスタンスを解放する
	*/
	static delete(renderer) {
		renderer = null;
	}
	/**
	* レンダラの初期化処理を実行する
	* 引数に渡したモデルからレンダラの初期化処理に必要な情報を取り出すことができる
	*
	* @param model モデルのインスタンス
	*/
	initialize(model) {
		this._model = model;
		if (model.isBlendModeEnabled()) {
			this.useHighPrecisionMask(true);
			CubismLogInfo("This model uses a high-resolution mask because it operates in blend mode.");
		}
	}
	/**
	* モデルを描画する
	* @param shaderPath ブレンドモード用シェーダのパス
	*/
	drawModel(shaderPath = null) {
		if (this.getModel() == null) return;
		this.doDrawModel(shaderPath);
	}
	/**
	* Model-View-Projection 行列をセットする
	* 配列は複製されるので、元の配列は外で破棄して良い
	*
	* @param matrix44 Model-View-Projection 行列
	*/
	setMvpMatrix(matrix44) {
		this._mvpMatrix4x4.setMatrix(matrix44.getArray());
	}
	/**
	* Model-View-Projection 行列を取得する
	*
	* @return Model-View-Projection 行列
	*/
	getMvpMatrix() {
		return this._mvpMatrix4x4;
	}
	/**
	* モデルの色をセットする
	* 各色0.0~1.0の間で指定する（1.0が標準の状態）
	*
	* @param red 赤チャンネルの値
	* @param green 緑チャンネルの値
	* @param blue 青チャンネルの値
	* @param alpha αチャンネルの値
	*/
	setModelColor(red, green, blue, alpha) {
		this._modelColor.r = CubismMath.clamp(red, 0, 1);
		this._modelColor.g = CubismMath.clamp(green, 0, 1);
		this._modelColor.b = CubismMath.clamp(blue, 0, 1);
		this._modelColor.a = CubismMath.clamp(alpha, 0, 1);
	}
	/**
	* モデルの色を取得する
	* 各色0.0~1.0の間で指定する(1.0が標準の状態)
	*
	* @return RGBAのカラー情報
	*/
	getModelColor() {
		return JSON.parse(JSON.stringify(this._modelColor));
	}
	/**
	* 透明度を考慮したモデルの色を計算する。
	*
	* @param opacity 透明度
	*
	* @return RGBAのカラー情報
	*/
	getModelColorWithOpacity(opacity) {
		const modelColorRGBA = this.getModelColor();
		modelColorRGBA.a *= opacity;
		if (this.isPremultipliedAlpha()) {
			modelColorRGBA.r *= modelColorRGBA.a;
			modelColorRGBA.g *= modelColorRGBA.a;
			modelColorRGBA.b *= modelColorRGBA.a;
		}
		return modelColorRGBA;
	}
	/**
	* 乗算済みαの有効・無効をセットする
	* 有効にするならtrue、無効にするならfalseをセットする
	*/
	setIsPremultipliedAlpha(enable) {
		this._isPremultipliedAlpha = enable;
	}
	/**
	* 乗算済みαの有効・無効を取得する
	* @return true 乗算済みのα有効
	*         false 乗算済みのα無効
	*/
	isPremultipliedAlpha() {
		return this._isPremultipliedAlpha;
	}
	/**
	* カリング（片面描画）の有効・無効をセットする。
	* 有効にするならtrue、無効にするならfalseをセットする
	*/
	setIsCulling(culling) {
		this._isCulling = culling;
	}
	/**
	* カリング（片面描画）の有効・無効を取得する。
	*
	* @return true カリング有効
	*         false カリング無効
	*/
	isCulling() {
		return this._isCulling;
	}
	/**
	* テクスチャの異方性フィルタリングのパラメータをセットする
	* パラメータ値の影響度はレンダラの実装に依存する
	*
	* @param n パラメータの値
	*/
	setAnisotropy(n) {
		this._anisotropy = n;
	}
	/**
	* テクスチャの異方性フィルタリングのパラメータをセットする
	*
	* @return 異方性フィルタリングのパラメータ
	*/
	getAnisotropy() {
		return this._anisotropy;
	}
	/**
	* レンダリングするモデルを取得する
	*
	* @return レンダリングするモデル
	*/
	getModel() {
		return this._model;
	}
	/**
	* マスク描画の方式を変更する。
	* falseの場合、マスクを1枚のテクスチャに分割してレンダリングする（デフォルト）
	* 高速だが、マスク個数の上限が36に限定され、質も荒くなる
	* trueの場合、パーツ描画の前にその都度必要なマスクを描き直す
	* レンダリング品質は高いが描画処理負荷は増す
	*
	* @param high 高精細マスクに切り替えるか？
	*/
	useHighPrecisionMask(high) {
		this._useHighPrecisionMask = high;
	}
	/**
	* マスクの描画方式を取得する
	*
	* @return true 高精細方式
	*         false デフォルト
	*/
	isUsingHighPrecisionMask() {
		return this._useHighPrecisionMask;
	}
	/**
	* モデルを描画したバッファのサイズを設定
	*
	* @param[in]   width  -> モデルを描画したバッファの幅
	* @param[in]   height -> モデルを描画したバッファの高さ
	*/
	setRenderTargetSize(width, height) {
		this._modelRenderTargetWidth = width;
		this._modelRenderTargetHeight = height;
	}
	/**
	* コンストラクタ
	*/
	constructor(width, height) {
		this._modelRenderTargetWidth = width;
		this._modelRenderTargetHeight = height;
		this._isCulling = false;
		this._isPremultipliedAlpha = false;
		this._anisotropy = 0;
		this._model = null;
		this._modelColor = new CubismTextureColor();
		this._useHighPrecisionMask = false;
		this._mvpMatrix4x4 = new CubismMatrix44();
		this._mvpMatrix4x4.loadIdentity();
	}
};
var CubismBlendMode = /* @__PURE__ */ function(CubismBlendMode) {
	CubismBlendMode[CubismBlendMode["CubismBlendMode_Normal"] = 0] = "CubismBlendMode_Normal";
	CubismBlendMode[CubismBlendMode["CubismBlendMode_Additive"] = 1] = "CubismBlendMode_Additive";
	CubismBlendMode[CubismBlendMode["CubismBlendMode_Multiplicative"] = 2] = "CubismBlendMode_Multiplicative";
	return CubismBlendMode;
}({});
/**
* オブジェクトのタイプ
*/
var DrawableObjectType = /* @__PURE__ */ function(DrawableObjectType) {
	DrawableObjectType[DrawableObjectType["DrawableObjectType_Drawable"] = 0] = "DrawableObjectType_Drawable";
	DrawableObjectType[DrawableObjectType["DrawableObjectType_Offscreen"] = 1] = "DrawableObjectType_Offscreen";
	return DrawableObjectType;
}({});
/**
* テクスチャの色をRGBAで扱うためのクラス
*/
var CubismTextureColor = class {
	/**
	* コンストラクタ
	*/
	constructor(r = 1, g = 1, b = 1, a = 1) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}
};
/**
* クリッピングマスクのコンテキスト
*/
var CubismClippingContext = class {
	/**
	* 引数付きコンストラクタ
	*/
	constructor(clippingDrawableIndices, clipCount) {
		this._clippingIdList = clippingDrawableIndices;
		this._clippingIdCount = clipCount;
		this._allClippedDrawRect = new csmRect();
		this._layoutBounds = new csmRect();
		this._clippedDrawableIndexList = [];
		this._clippedOffscreenIndexList = [];
		this._matrixForMask = new CubismMatrix44();
		this._matrixForDraw = new CubismMatrix44();
		this._bufferIndex = 0;
		this._layoutChannelIndex = 0;
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		if (this._layoutBounds != null) this._layoutBounds = null;
		if (this._allClippedDrawRect != null) this._allClippedDrawRect = null;
		if (this._clippedDrawableIndexList != null) this._clippedDrawableIndexList = null;
		if (this._clippedOffscreenIndexList != null) this._clippedOffscreenIndexList = null;
	}
	/**
	* このマスクにクリップされる描画オブジェクトを追加する
	*
	* @param drawableIndex クリッピング対象に追加する描画オブジェクトのインデックス
	*/
	addClippedDrawable(drawableIndex) {
		this._clippedDrawableIndexList.push(drawableIndex);
	}
	/**
	* このマスクにクリップされるオフスクリーンオブジェクトを追加する
	*
	* @param offscreenIndex クリッピング対象に追加するオフスクリーンオブジェクトのインデックス
	*/
	addClippedOffscreen(offscreenIndex) {
		this._clippedOffscreenIndexList.push(offscreenIndex);
	}
};
var Live2DCubismFramework$22;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismBlendMode = CubismBlendMode;
	_Live2DCubismFramework.CubismRenderer = CubismRenderer;
	_Live2DCubismFramework.CubismTextureColor = CubismTextureColor;
})(Live2DCubismFramework$22 || (Live2DCubismFramework$22 = {}));
//#endregion
//#region cubism/src/utils/cubismjsonextension.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* CubismJsonで実装されているJsonパーサを使用せず、
* TypeScript標準のJsonパーサなどを使用し出力された結果を
* Cubism SDKで定義されているJSONエレメントの要素に
* 置き換える処理をするクラス。
*/
var CubismJsonExtension = class CubismJsonExtension {
	static parseJsonObject(obj, map) {
		Object.keys(obj).forEach((key) => {
			if (typeof obj[key] == "boolean") {
				const convValue = Boolean(obj[key]);
				map.put(key, new JsonBoolean(convValue));
			} else if (typeof obj[key] == "string") {
				const convValue = String(obj[key]);
				map.put(key, new JsonString(convValue));
			} else if (typeof obj[key] == "number") {
				const convValue = Number(obj[key]);
				map.put(key, new JsonFloat(convValue));
			} else if (obj[key] instanceof Array) map.put(key, CubismJsonExtension.parseJsonArray(obj[key]));
			else if (obj[key] instanceof Object) map.put(key, CubismJsonExtension.parseJsonObject(obj[key], new JsonMap()));
			else if (obj[key] == null) map.put(key, new JsonNullvalue());
			else map.put(key, obj[key]);
		});
		return map;
	}
	static parseJsonArray(obj) {
		const arr = new JsonArray();
		Object.keys(obj).forEach((key) => {
			if (typeof Number(key) == "number") if (typeof obj[key] == "boolean") {
				const convValue = Boolean(obj[key]);
				arr.add(new JsonBoolean(convValue));
			} else if (typeof obj[key] == "string") {
				const convValue = String(obj[key]);
				arr.add(new JsonString(convValue));
			} else if (typeof obj[key] == "number") {
				const convValue = Number(obj[key]);
				arr.add(new JsonFloat(convValue));
			} else if (obj[key] instanceof Array) arr.add(this.parseJsonArray(obj[key]));
			else if (obj[key] instanceof Object) arr.add(this.parseJsonObject(obj[key], new JsonMap()));
			else if (obj[key] == null) arr.add(new JsonNullvalue());
			else arr.add(obj[key]);
			else if (obj[key] instanceof Array) arr.add(this.parseJsonArray(obj[key]));
			else if (obj[key] instanceof Object) arr.add(this.parseJsonObject(obj[key], new JsonMap()));
			else if (obj[key] == null) arr.add(new JsonNullvalue());
			else {
				const convValue = Array(obj[key]);
				for (let i = 0; i < convValue.length; i++) arr.add(convValue[i]);
			}
		});
		return arr;
	}
};
//#endregion
//#region cubism/src/utils/cubismjson.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
var CSM_JSON_ERROR_TYPE_MISMATCH = "Error: type mismatch";
var CSM_JSON_ERROR_INDEX_OF_BOUNDS = "Error: index out of bounds";
/**
* パースしたJSONエレメントの要素の基底クラス。
*/
var Value$1 = class Value$1 {
	/**
	* コンストラクタ
	*/
	constructor() {}
	/**
	* 要素を文字列型で返す(string)
	*/
	getRawString(defaultValue, indent) {
		return this.getString(defaultValue, indent);
	}
	/**
	* 要素を数値型で返す(number)
	*/
	toInt(defaultValue = 0) {
		return defaultValue;
	}
	/**
	* 要素を数値型で返す(number)
	*/
	toFloat(defaultValue = 0) {
		return defaultValue;
	}
	/**
	* 要素を真偽値で返す(boolean)
	*/
	toBoolean(defaultValue = false) {
		return defaultValue;
	}
	/**
	* サイズを返す
	*/
	getSize() {
		return 0;
	}
	/**
	* 要素を配列で返す(Value[])
	*/
	getArray(defaultValue = null) {
		return defaultValue;
	}
	/**
	* 要素をコンテナで返す(array)
	*/
	getVector(defaultValue = new Array()) {
		return defaultValue;
	}
	/**
	* 要素をマップで返す(Map<String, Value>)
	*/
	getMap(defaultValue) {
		return defaultValue;
	}
	/**
	* 添字演算子[index]
	*/
	getValueByIndex(index) {
		return Value$1.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
	}
	/**
	* 添字演算子[string]
	*/
	getValueByString(s) {
		return Value$1.nullValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
	}
	/**
	* マップのキー一覧をコンテナで返す
	*
	* @return マップのキーの一覧
	*/
	getKeys() {
		return Value$1.dummyKeys;
	}
	/**
	* Valueの種類がエラー値ならtrue
	*/
	isError() {
		return false;
	}
	/**
	* Valueの種類がnullならtrue
	*/
	isNull() {
		return false;
	}
	/**
	* Valueの種類が真偽値ならtrue
	*/
	isBool() {
		return false;
	}
	/**
	* Valueの種類が数値型ならtrue
	*/
	isFloat() {
		return false;
	}
	/**
	* Valueの種類が文字列ならtrue
	*/
	isString() {
		return false;
	}
	/**
	* Valueの種類が配列ならtrue
	*/
	isArray() {
		return false;
	}
	/**
	* Valueの種類がマップ型ならtrue
	*/
	isMap() {
		return false;
	}
	equals(value) {
		return false;
	}
	/**
	* Valueの値が静的ならtrue、静的なら解放しない
	*/
	isStatic() {
		return false;
	}
	/**
	* Valueにエラー値をセットする
	*/
	setErrorNotForClientCall(errorStr) {
		return JsonError.errorValue;
	}
	/**
	* 初期化用メソッド
	*/
	static staticInitializeNotForClientCall() {
		JsonBoolean.trueValue = new JsonBoolean(true);
		JsonBoolean.falseValue = new JsonBoolean(false);
		Value$1.errorValue = new JsonError("ERROR", true);
		Value$1.nullValue = new JsonNullvalue();
		Value$1.dummyKeys = new Array();
	}
	/**
	* リリース用メソッド
	*/
	static staticReleaseNotForClientCall() {
		JsonBoolean.trueValue = null;
		JsonBoolean.falseValue = null;
		Value$1.errorValue = null;
		Value$1.nullValue = null;
		Value$1.dummyKeys = null;
	}
};
/**
* Ascii文字のみ対応した最小限の軽量JSONパーサ。
* 仕様はJSONのサブセットとなる。
* 設定ファイル(model3.json)などのロード用
*
* [未対応項目]
* ・日本語などの非ASCII文字
* ・eによる指数表現
*/
var CubismJson = class CubismJson {
	/**
	* コンストラクタ
	*/
	constructor(buffer, length) {
		this._parseCallback = CubismJsonExtension.parseJsonObject;
		this._error = null;
		this._lineCount = 0;
		this._root = null;
		if (buffer != void 0) this.parseBytes(buffer, length, this._parseCallback);
	}
	/**
	* バイトデータから直接ロードしてパースする
	*
	* @param buffer バッファ
	* @param size バッファサイズ
	* @return CubismJsonクラスのインスタンス。失敗したらNULL
	*/
	static create(buffer, size) {
		const json = new CubismJson();
		if (!json.parseBytes(buffer, size, json._parseCallback)) {
			CubismJson.delete(json);
			return null;
		} else return json;
	}
	/**
	* パースしたJSONオブジェクトの解放処理
	*
	* @param instance CubismJsonクラスのインスタンス
	*/
	static delete(instance) {
		instance = null;
	}
	/**
	* パースしたJSONのルート要素を返す
	*/
	getRoot() {
		return this._root;
	}
	/**
	*  UnicodeのバイナリをStringに変換
	*
	* @param buffer 変換するバイナリデータ
	* @return 変換後の文字列
	*/
	static arrayBufferToString(buffer) {
		const uint8Array = new Uint8Array(buffer);
		let str = "";
		for (let i = 0, len = uint8Array.length; i < len; ++i) str += "%" + this.pad(uint8Array[i].toString(16));
		str = decodeURIComponent(str);
		return str;
	}
	/**
	* エンコード、パディング
	*/
	static pad(n) {
		return n.length < 2 ? "0" + n : n;
	}
	/**
	* JSONのパースを実行する
	* @param buffer    パース対象のデータバイト
	* @param size      データバイトのサイズ
	* return true : 成功
	* return false: 失敗
	*/
	parseBytes(buffer, size, parseCallback) {
		const endPos = new Array(1);
		const decodeBuffer = CubismJson.arrayBufferToString(buffer);
		if (parseCallback == void 0) this._root = this.parseValue(decodeBuffer, size, 0, endPos);
		else this._root = parseCallback(JSON.parse(decodeBuffer), new JsonMap());
		if (this._error) {
			let strbuf = "\0";
			strbuf = "Json parse error : @line " + (this._lineCount + 1) + "\n";
			this._root = new JsonString(strbuf);
			CubismLogInfo("{0}", this._root.getRawString());
			return false;
		} else if (this._root == null) {
			this._root = new JsonError(this._error, false);
			return false;
		}
		return true;
	}
	/**
	* パース時のエラー値を返す
	*/
	getParseError() {
		return this._error;
	}
	/**
	* ルート要素の次の要素がファイルの終端だったらtrueを返す
	*/
	checkEndOfFile() {
		return this._root.getArray()[1].equals("EOF");
	}
	/**
	* JSONエレメントからValue(float,String,Value*,Array,null,true,false)をパースする
	* エレメントの書式に応じて内部でParseString(), ParseObject(), ParseArray()を呼ぶ
	*
	* @param   buffer      JSONエレメントのバッファ
	* @param   length      パースする長さ
	* @param   begin       パースを開始する位置
	* @param   outEndPos   パース終了時の位置
	* @return      パースから取得したValueオブジェクト
	*/
	parseValue(buffer, length, begin, outEndPos) {
		if (this._error) return null;
		let o = null;
		let i = begin;
		let f;
		for (; i < length; i++) switch (buffer[i]) {
			case "-":
			case ".":
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9": {
				const afterString = new Array(1);
				f = strtod(buffer.slice(i), afterString);
				outEndPos[0] = buffer.indexOf(afterString[0]);
				return new JsonFloat(f);
			}
			case "\"": return new JsonString(this.parseString(buffer, length, i + 1, outEndPos));
			case "[":
				o = this.parseArray(buffer, length, i + 1, outEndPos);
				return o;
			case "{":
				o = this.parseObject(buffer, length, i + 1, outEndPos);
				return o;
			case "n":
				if (i + 3 < length) {
					o = new JsonNullvalue();
					outEndPos[0] = i + 4;
				} else this._error = "parse null";
				return o;
			case "t":
				if (i + 3 < length) {
					o = JsonBoolean.trueValue;
					outEndPos[0] = i + 4;
				} else this._error = "parse true";
				return o;
			case "f":
				if (i + 4 < length) {
					o = JsonBoolean.falseValue;
					outEndPos[0] = i + 5;
				} else this._error = "illegal ',' position";
				return o;
			case ",":
				this._error = "illegal ',' position";
				return null;
			case "]":
				outEndPos[0] = i;
				return null;
			case "\n": this._lineCount++;
			default: break;
		}
		this._error = "illegal end of value";
		return null;
	}
	/**
	* 次の「"」までの文字列をパースする。
	*
	* @param   string  ->  パース対象の文字列
	* @param   length  ->  パースする長さ
	* @param   begin   ->  パースを開始する位置
	* @param  outEndPos   ->  パース終了時の位置
	* @return      パースした文F字列要素
	*/
	parseString(string, length, begin, outEndPos) {
		if (this._error) return null;
		if (!string) {
			this._error = "string is null";
			return null;
		}
		let i = begin;
		let c, c2;
		let ret = "";
		let bufStart = begin;
		for (; i < length; i++) {
			c = string[i];
			switch (c) {
				case "\"":
					outEndPos[0] = i + 1;
					ret += string.substr(bufStart, i - bufStart);
					return ret;
				case "//":
					i++;
					if (i - 1 > bufStart) ret += string.substr(bufStart, i - bufStart);
					bufStart = i + 1;
					if (i < length) {
						c2 = string[i];
						switch (c2) {
							case "\\":
								ret += "\\";
								break;
							case "\"":
								ret += "\"";
								break;
							case "/":
								ret += "/";
								break;
							case "b":
								ret += "\b";
								break;
							case "f":
								ret += "\f";
								break;
							case "n":
								ret += "\n";
								break;
							case "r":
								ret += "\r";
								break;
							case "t":
								ret += "	";
								break;
							case "u":
								this._error = "parse string/unicord escape not supported";
								break;
							default: break;
						}
					} else this._error = "parse string/escape error";
				default: break;
			}
		}
		this._error = "parse string/illegal end";
		return null;
	}
	/**
	* JSONのオブジェクトエレメントをパースしてValueオブジェクトを返す
	*
	* @param buffer    JSONエレメントのバッファ
	* @param length    パースする長さ
	* @param begin     パースを開始する位置
	* @param outEndPos パース終了時の位置
	* @return パースから取得したValueオブジェクト
	*/
	parseObject(buffer, length, begin, outEndPos) {
		if (this._error) return null;
		if (!buffer) {
			this._error = "buffer is null";
			return null;
		}
		const ret = new JsonMap();
		let key = "";
		let i = begin;
		let c = "";
		const localRetEndPos2 = Array(1);
		let ok = false;
		for (; i < length; i++) {
			FOR_LOOP: for (; i < length; i++) {
				c = buffer[i];
				switch (c) {
					case "\"":
						key = this.parseString(buffer, length, i + 1, localRetEndPos2);
						if (this._error) return null;
						i = localRetEndPos2[0];
						ok = true;
						break FOR_LOOP;
					case "}":
						outEndPos[0] = i + 1;
						return ret;
					case ":":
						this._error = "illegal ':' position";
						break;
					case "\n": this._lineCount++;
					default: break;
				}
			}
			if (!ok) {
				this._error = "key not found";
				return null;
			}
			ok = false;
			FOR_LOOP2: for (; i < length; i++) {
				c = buffer[i];
				switch (c) {
					case ":":
						ok = true;
						i++;
						break FOR_LOOP2;
					case "}":
						this._error = "illegal '}' position";
						break;
					case "\n": this._lineCount++;
					default: break;
				}
			}
			if (!ok) {
				this._error = "':' not found";
				return null;
			}
			const value = this.parseValue(buffer, length, i, localRetEndPos2);
			if (this._error) return null;
			i = localRetEndPos2[0];
			ret.put(key, value);
			FOR_LOOP3: for (; i < length; i++) {
				c = buffer[i];
				switch (c) {
					case ",": break FOR_LOOP3;
					case "}":
						outEndPos[0] = i + 1;
						return ret;
					case "\n": this._lineCount++;
					default: break;
				}
			}
		}
		this._error = "illegal end of perseObject";
		return null;
	}
	/**
	* 次の「"」までの文字列をパースする。
	* @param buffer    JSONエレメントのバッファ
	* @param length    パースする長さ
	* @param begin     パースを開始する位置
	* @param outEndPos パース終了時の位置
	* @return パースから取得したValueオブジェクト
	*/
	parseArray(buffer, length, begin, outEndPos) {
		if (this._error) return null;
		if (!buffer) {
			this._error = "buffer is null";
			return null;
		}
		let ret = new JsonArray();
		let i = begin;
		let c;
		const localRetEndpos2 = new Array(1);
		for (; i < length; i++) {
			const value = this.parseValue(buffer, length, i, localRetEndpos2);
			if (this._error) return null;
			i = localRetEndpos2[0];
			if (value) ret.add(value);
			FOR_LOOP: for (; i < length; i++) {
				c = buffer[i];
				switch (c) {
					case ",": break FOR_LOOP;
					case "]":
						outEndPos[0] = i + 1;
						return ret;
					case "\n": ++this._lineCount;
					default: break;
				}
			}
		}
		ret = void 0;
		this._error = "illegal end of parseObject";
		return null;
	}
};
/**
* パースしたJSONの要素をfloat値として扱う
*/
var JsonFloat = class extends Value$1 {
	/**
	* コンストラクタ
	*/
	constructor(v) {
		super();
		this._value = v;
	}
	/**
	* Valueの種類が数値型ならtrue
	*/
	isFloat() {
		return true;
	}
	/**
	* 要素を文字列で返す(string型)
	*/
	getString(defaultValue, indent) {
		const strbuf = "\0";
		this._value = parseFloat(strbuf);
		this._stringBuffer = strbuf;
		return this._stringBuffer;
	}
	/**
	* 要素を数値型で返す(number)
	*/
	toInt(defaultValue = 0) {
		return parseInt(this._value.toString());
	}
	/**
	* 要素を数値型で返す(number)
	*/
	toFloat(defaultValue = 0) {
		return this._value;
	}
	equals(value) {
		if ("number" === typeof value) if (Math.round(value)) return false;
		else return value == this._value;
		return false;
	}
};
/**
* パースしたJSONの要素を真偽値として扱う
*/
var JsonBoolean = class extends Value$1 {
	/**
	* Valueの種類が真偽値ならtrue
	*/
	isBool() {
		return true;
	}
	/**
	* 要素を真偽値で返す(boolean)
	*/
	toBoolean(defaultValue = false) {
		return this._boolValue;
	}
	/**
	* 要素を文字列で返す(string型)
	*/
	getString(defaultValue, indent) {
		this._stringBuffer = this._boolValue ? "true" : "false";
		return this._stringBuffer;
	}
	equals(value) {
		if ("boolean" === typeof value) return value == this._boolValue;
		return false;
	}
	/**
	* Valueの値が静的ならtrue, 静的なら解放しない
	*/
	isStatic() {
		return true;
	}
	/**
	* 引数付きコンストラクタ
	*/
	constructor(v) {
		super();
		this._boolValue = v;
	}
};
/**
* パースしたJSONの要素を文字列として扱う
*/
var JsonString = class extends Value$1 {
	/**
	* 引数付きコンストラクタ
	*/
	constructor(s) {
		super();
		this._stringBuffer = s;
	}
	/**
	* Valueの種類が文字列ならtrue
	*/
	isString() {
		return true;
	}
	/**
	* 要素を文字列で返す(string型)
	*/
	getString(defaultValue, indent) {
		return this._stringBuffer;
	}
	equals(value) {
		if ("string" === typeof value) return this._stringBuffer == value;
		return false;
	}
};
/**
* JSONパース時のエラー結果。文字列型のようにふるまう
*/
var JsonError = class extends JsonString {
	/**
	* Valueの値が静的ならtrue、静的なら解放しない
	*/
	isStatic() {
		return this._isStatic;
	}
	/**
	* エラー情報をセットする
	*/
	setErrorNotForClientCall(s) {
		this._stringBuffer = s;
		return this;
	}
	/**
	* 引数付きコンストラクタ
	*/
	constructor(s, isStatic) {
		if ("string" === typeof s) super(s);
		else super(s);
		this._isStatic = isStatic;
	}
	/**
	* Valueの種類がエラー値ならtrue
	*/
	isError() {
		return true;
	}
};
/**
* パースしたJSONの要素をNULL値として持つ
*/
var JsonNullvalue = class extends Value$1 {
	/**
	* Valueの種類がNULL値ならtrue
	*/
	isNull() {
		return true;
	}
	/**
	* 要素を文字列で返す(string型)
	*/
	getString(defaultValue, indent) {
		return this._stringBuffer;
	}
	/**
	* Valueの値が静的ならtrue, 静的なら解放しない
	*/
	isStatic() {
		return true;
	}
	/**
	* Valueにエラー値をセットする
	*/
	setErrorNotForClientCall(s) {
		this._stringBuffer = s;
		return JsonError.nullValue;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		super();
		this._stringBuffer = "NullValue";
	}
};
/**
* パースしたJSONの要素を配列として持つ
*/
var JsonArray = class extends Value$1 {
	/**
	* コンストラクタ
	*/
	constructor() {
		super();
		this._array = new Array();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		for (let i = 0; i < this._array.length; i++) {
			let v = this._array[i];
			if (v && !v.isStatic()) {
				v = void 0;
				v = null;
			}
		}
	}
	/**
	* Valueの種類が配列ならtrue
	*/
	isArray() {
		return true;
	}
	/**
	* 添字演算子[index]
	*/
	getValueByIndex(index) {
		if (index < 0 || this._array.length <= index) return Value$1.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_INDEX_OF_BOUNDS);
		const v = this._array[index];
		if (v == null) return Value$1.nullValue;
		return v;
	}
	/**
	* 添字演算子[string]
	*/
	getValueByString(s) {
		return Value$1.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
	}
	/**
	* 要素を文字列で返す(string型)
	*/
	getString(defaultValue, indent) {
		const stringBuffer = indent + "[\n";
		for (let i = 0; i < this._array.length; i++) {
			const v = this._array[i];
			this._stringBuffer += indent + "" + v.getString(indent + " ") + "\n";
		}
		this._stringBuffer = stringBuffer + indent + "]\n";
		return this._stringBuffer;
	}
	/**
	* 配列要素を追加する
	* @param v 追加する要素
	*/
	add(v) {
		this._array.push(v);
	}
	/**
	* 要素をコンテナで返す(Array<Value>)
	*/
	getVector(defaultValue = null) {
		return this._array;
	}
	/**
	* 要素の数を返す
	*/
	getSize() {
		return this._array.length;
	}
};
/**
* パースしたJSONの要素をマップとして持つ
*/
var JsonMap = class extends Value$1 {
	/**
	* コンストラクタ
	*/
	constructor() {
		super();
		this._map = /* @__PURE__ */ new Map();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		this._map.clear();
	}
	/**
	* Valueの値がMap型ならtrue
	*/
	isMap() {
		return true;
	}
	/**
	* 添字演算子[string]
	*/
	getValueByString(s) {
		const ret = this._map.get(s);
		if (ret != void 0) return ret;
		return Value$1.nullValue;
	}
	/**
	* 添字演算子[index]
	*/
	getValueByIndex(index) {
		return Value$1.errorValue.setErrorNotForClientCall(CSM_JSON_ERROR_TYPE_MISMATCH);
	}
	/**
	* 要素を文字列で返す(string型)
	*/
	getString(defaultValue, indent) {
		this._stringBuffer = indent + "{\n";
		for (const element of this._map) {
			const key = element[0];
			const v = element[1];
			this._stringBuffer += indent + " " + key + " : " + v.getString(indent + "   ") + " \n";
		}
		this._stringBuffer += indent + "}\n";
		return this._stringBuffer;
	}
	/**
	* 要素をMap型で返す
	*/
	getMap(defaultValue) {
		return this._map;
	}
	/**
	* Mapに要素を追加する
	*/
	put(key, v) {
		this._map.set(key, v);
	}
	/**
	* Mapからキーのリストを取得する
	*/
	getKeys() {
		if (!this._keys) this._keys = [...this._map.keys()];
		return this._keys;
	}
	/**
	* Mapの要素数を取得する
	*/
	getSize() {
		return this._keys.length;
	}
};
var Live2DCubismFramework$21;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismJson = CubismJson;
	_Live2DCubismFramework.JsonArray = JsonArray;
	_Live2DCubismFramework.JsonBoolean = JsonBoolean;
	_Live2DCubismFramework.JsonError = JsonError;
	_Live2DCubismFramework.JsonFloat = JsonFloat;
	_Live2DCubismFramework.JsonMap = JsonMap;
	_Live2DCubismFramework.JsonNullvalue = JsonNullvalue;
	_Live2DCubismFramework.JsonString = JsonString;
	_Live2DCubismFramework.Value = Value$1;
})(Live2DCubismFramework$21 || (Live2DCubismFramework$21 = {}));
//#endregion
//#region cubism/src/live2dcubismframework.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
function strtod(s, endPtr) {
	let index = 0;
	for (let i = 1;; i++) {
		const testC = s.slice(i - 1, i);
		if (testC == "e" || testC == "-" || testC == "E") continue;
		const test = s.substring(0, i);
		const number = Number(test);
		if (isNaN(number)) break;
		index = i;
	}
	let d = parseFloat(s);
	if (isNaN(d)) d = NaN;
	endPtr[0] = s.slice(index);
	return d;
}
var s_isStarted = false;
var s_isInitialized = false;
var s_option = null;
var s_cubismIdManager = null;
/**
* Framework内で使う定数の宣言
*/
var Constant = Object.freeze({
	vertexOffset: 0,
	vertexStep: 2
});
function csmDelete(address) {
	if (!address) return;
	address = void 0;
}
/**
* Live2D Cubism SDK Original Workflow SDKのエントリポイント
* 利用開始時はCubismFramework.initialize()を呼び、CubismFramework.dispose()で終了する。
*/
var CubismFramework = class {
	/**
	* Cubism FrameworkのAPIを使用可能にする。
	*  APIを実行する前に必ずこの関数を実行すること。
	*  一度準備が完了して以降は、再び実行しても内部処理がスキップされます。
	*
	* @param    option      Optionクラスのインスタンス
	*
	* @return   準備処理が完了したらtrueが返ります。
	*/
	static startUp(option = null) {
		if (s_isStarted) {
			CubismLogInfo("CubismFramework.startUp() is already done.");
			return s_isStarted;
		}
		s_option = option;
		if (s_option != null) Live2DCubismCore.Logging.csmSetLogFunction(s_option.logFunction);
		s_isStarted = true;
		if (s_isStarted) {
			const version = Live2DCubismCore.Version.csmGetVersion();
			const major = (version & 4278190080) >> 24;
			const minor = (version & 16711680) >> 16;
			const patch = version & 65535;
			const versionNumber = version;
			CubismLogInfo(`Live2D Cubism Core version: {0}.{1}.{2} ({3})`, ("00" + major).slice(-2), ("00" + minor).slice(-2), ("0000" + patch).slice(-4), versionNumber);
		}
		CubismLogInfo("CubismFramework.startUp() is complete.");
		return s_isStarted;
	}
	/**
	* StartUp()で初期化したCubismFrameworkの各パラメータをクリアします。
	* Dispose()したCubismFrameworkを再利用する際に利用してください。
	*/
	static cleanUp() {
		s_isStarted = false;
		s_isInitialized = false;
		s_option = null;
		s_cubismIdManager = null;
	}
	/**
	* Cubism Framework内のリソースを初期化してモデルを表示可能な状態にします。<br>
	*     再度Initialize()するには先にDispose()を実行する必要があります。
	*
	* @param memorySize 初期化時メモリ量 [byte(s)]
	*    複数モデル表示時などにモデルが更新されない際に使用してください。
	*    指定する際は必ず1024*1024*16 byte(16MB)以上の値を指定してください。
	*    それ以外はすべて1024*1024*16 byteに丸めます。
	*/
	static initialize(memorySize = 0) {
		CSM_ASSERT(s_isStarted);
		if (!s_isStarted) {
			CubismLogWarning("CubismFramework is not started.");
			return;
		}
		if (s_isInitialized) {
			CubismLogWarning("CubismFramework.initialize() skipped, already initialized.");
			return;
		}
		Value$1.staticInitializeNotForClientCall();
		s_cubismIdManager = new CubismIdManager();
		Live2DCubismCore.Memory.initializeAmountOfMemory(memorySize);
		s_isInitialized = true;
		CubismLogInfo("CubismFramework.initialize() is complete.");
	}
	/**
	* Cubism Framework内の全てのリソースを解放します。
	*      ただし、外部で確保されたリソースについては解放しません。
	*      外部で適切に破棄する必要があります。
	*/
	static dispose() {
		CSM_ASSERT(s_isStarted);
		if (!s_isStarted) {
			CubismLogWarning("CubismFramework is not started.");
			return;
		}
		if (!s_isInitialized) {
			CubismLogWarning("CubismFramework.dispose() skipped, not initialized.");
			return;
		}
		Value$1.staticReleaseNotForClientCall();
		s_cubismIdManager.release();
		s_cubismIdManager = null;
		CubismRenderer.staticRelease();
		s_isInitialized = false;
		CubismLogInfo("CubismFramework.dispose() is complete.");
	}
	/**
	* Cubism FrameworkのAPIを使用する準備が完了したかどうか
	* @return APIを使用する準備が完了していればtrueが返ります。
	*/
	static isStarted() {
		return s_isStarted;
	}
	/**
	* Cubism Frameworkのリソース初期化がすでに行われているかどうか
	* @return リソース確保が完了していればtrueが返ります
	*/
	static isInitialized() {
		return s_isInitialized;
	}
	/**
	* Core APIにバインドしたログ関数を実行する
	*
	* @praram message ログメッセージ
	*/
	static coreLogFunction(message) {
		if (!Live2DCubismCore.Logging.csmGetLogFunction()) return;
		Live2DCubismCore.Logging.csmGetLogFunction()(message);
	}
	/**
	* 現在のログ出力レベル設定の値を返す。
	*
	* @return  現在のログ出力レベル設定の値
	*/
	static getLoggingLevel() {
		if (s_option != null) return s_option.loggingLevel;
		return 5;
	}
	/**
	* IDマネージャのインスタンスを取得する
	* @return CubismManagerクラスのインスタンス
	*/
	static getIdManager() {
		return s_cubismIdManager;
	}
	/**
	* 静的クラスとして使用する
	* インスタンス化させない
	*/
	constructor() {}
};
/**
* ログ出力のレベル
*/
var LogLevel = /* @__PURE__ */ function(LogLevel) {
	LogLevel[LogLevel["LogLevel_Verbose"] = 0] = "LogLevel_Verbose";
	LogLevel[LogLevel["LogLevel_Debug"] = 1] = "LogLevel_Debug";
	LogLevel[LogLevel["LogLevel_Info"] = 2] = "LogLevel_Info";
	LogLevel[LogLevel["LogLevel_Warning"] = 3] = "LogLevel_Warning";
	LogLevel[LogLevel["LogLevel_Error"] = 4] = "LogLevel_Error";
	LogLevel[LogLevel["LogLevel_Off"] = 5] = "LogLevel_Off";
	return LogLevel;
}({});
var Live2DCubismFramework$20;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.Constant = Constant;
	_Live2DCubismFramework.csmDelete = csmDelete;
	_Live2DCubismFramework.CubismFramework = CubismFramework;
})(Live2DCubismFramework$20 || (Live2DCubismFramework$20 = {}));
//#endregion
//#region cubism/src/motion/acubismmotion.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* モーションの抽象基底クラス
*
* モーションの抽象基底クラス。MotionQueueManagerによってモーションの再生を管理する。
*/
var ACubismMotion = class {
	/**
	* インスタンスの破棄
	*/
	static delete(motion) {
		motion.release();
		motion = null;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		this.setBeganMotionHandler = (onBeganMotionHandler) => this._onBeganMotion = onBeganMotionHandler;
		this.getBeganMotionHandler = () => this._onBeganMotion;
		this.setFinishedMotionHandler = (onFinishedMotionHandler) => this._onFinishedMotion = onFinishedMotionHandler;
		this.getFinishedMotionHandler = () => this._onFinishedMotion;
		this._fadeInSeconds = -1;
		this._fadeOutSeconds = -1;
		this._weight = 1;
		this._offsetSeconds = 0;
		this._isLoop = false;
		this._isLoopFadeIn = true;
		this._previousLoopState = this._isLoop;
		this._firedEventValues = new Array();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		this._weight = 0;
	}
	/**
	* モデルのパラメータ
	* @param model 対象のモデル
	* @param motionQueueEntry CubismMotionQueueManagerで管理されているモーション
	* @param userTimeSeconds デルタ時間の積算値[秒]
	*/
	updateParameters(model, motionQueueEntry, userTimeSeconds) {
		if (!motionQueueEntry.isAvailable() || motionQueueEntry.isFinished()) return;
		this.setupMotionQueueEntry(motionQueueEntry, userTimeSeconds);
		const fadeWeight = this.updateFadeWeight(motionQueueEntry, userTimeSeconds);
		this.doUpdateParameters(model, userTimeSeconds, fadeWeight, motionQueueEntry);
		if (motionQueueEntry.getEndTime() > 0 && motionQueueEntry.getEndTime() < userTimeSeconds) motionQueueEntry.setIsFinished(true);
	}
	/**
	* @brief モデルの再生開始処理
	*
	* モーションの再生を開始するためのセットアップを行う。
	*
	* @param[in]   motionQueueEntry    CubismMotionQueueManagerで管理されているモーション
	* @param[in]   userTimeSeconds     デルタ時間の積算値[秒]
	*/
	setupMotionQueueEntry(motionQueueEntry, userTimeSeconds) {
		if (motionQueueEntry == null || motionQueueEntry.isStarted()) return;
		if (!motionQueueEntry.isAvailable()) return;
		motionQueueEntry.setIsStarted(true);
		motionQueueEntry.setStartTime(userTimeSeconds - this._offsetSeconds);
		motionQueueEntry.setFadeInStartTime(userTimeSeconds);
		if (motionQueueEntry.getEndTime() < 0) this.adjustEndTime(motionQueueEntry);
		if (motionQueueEntry._motion._onBeganMotion) motionQueueEntry._motion._onBeganMotion(motionQueueEntry._motion);
	}
	/**
	* @brief モデルのウェイト更新
	*
	* モーションのウェイトを更新する。
	*
	* @param[in]   motionQueueEntry    CubismMotionQueueManagerで管理されているモーション
	* @param[in]   userTimeSeconds     デルタ時間の積算値[秒]
	*/
	updateFadeWeight(motionQueueEntry, userTimeSeconds) {
		if (motionQueueEntry == null) CubismDebug.print(LogLevel.LogLevel_Error, "motionQueueEntry is null.");
		let fadeWeight = this._weight;
		const fadeIn = this._fadeInSeconds == 0 ? 1 : CubismMath.getEasingSine((userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / this._fadeInSeconds);
		const fadeOut = this._fadeOutSeconds == 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine((motionQueueEntry.getEndTime() - userTimeSeconds) / this._fadeOutSeconds);
		fadeWeight = fadeWeight * fadeIn * fadeOut;
		motionQueueEntry.setState(userTimeSeconds, fadeWeight);
		CSM_ASSERT(0 <= fadeWeight && fadeWeight <= 1);
		return fadeWeight;
	}
	/**
	* フェードインの時間を設定する
	* @param fadeInSeconds フェードインにかかる時間[秒]
	*/
	setFadeInTime(fadeInSeconds) {
		this._fadeInSeconds = fadeInSeconds;
	}
	/**
	* フェードアウトの時間を設定する
	* @param fadeOutSeconds フェードアウトにかかる時間[秒]
	*/
	setFadeOutTime(fadeOutSeconds) {
		this._fadeOutSeconds = fadeOutSeconds;
	}
	/**
	* フェードアウトにかかる時間の取得
	* @return フェードアウトにかかる時間[秒]
	*/
	getFadeOutTime() {
		return this._fadeOutSeconds;
	}
	/**
	* フェードインにかかる時間の取得
	* @return フェードインにかかる時間[秒]
	*/
	getFadeInTime() {
		return this._fadeInSeconds;
	}
	/**
	* モーション適用の重みの設定
	* @param weight 重み（0.0 - 1.0）
	*/
	setWeight(weight) {
		this._weight = weight;
	}
	/**
	* モーション適用の重みの取得
	* @return 重み（0.0 - 1.0）
	*/
	getWeight() {
		return this._weight;
	}
	/**
	* モーションの長さの取得
	* @return モーションの長さ[秒]
	*
	* @note ループの時は「-1」。
	*       ループでない場合は、オーバーライドする。
	*       正の値の時は取得される時間で終了する。
	*       「-1」の時は外部から停止命令がない限り終わらない処理となる。
	*/
	getDuration() {
		return -1;
	}
	/**
	* モーションのループ1回分の長さの取得
	* @return モーションのループ一回分の長さ[秒]
	*
	* @note ループしない場合は、getDuration()と同じ値を返す
	*       ループ一回分の長さが定義できない場合(プログラム的に動き続けるサブクラスなど)の場合は「-1」を返す
	*/
	getLoopDuration() {
		return -1;
	}
	/**
	* モーション再生の開始時刻の設定
	* @param offsetSeconds モーション再生の開始時刻[秒]
	*/
	setOffsetTime(offsetSeconds) {
		this._offsetSeconds = offsetSeconds;
	}
	/**
	* ループ情報の設定
	* @param loop ループ情報
	*/
	setLoop(loop) {
		this._isLoop = loop;
	}
	/**
	* ループ情報の取得
	* @return true ループする
	* @return false ループしない
	*/
	getLoop() {
		return this._isLoop;
	}
	/**
	* ループ時のフェードイン情報の設定
	* @param loopFadeIn  ループ時のフェードイン情報
	*/
	setLoopFadeIn(loopFadeIn) {
		this._isLoopFadeIn = loopFadeIn;
	}
	/**
	* ループ時のフェードイン情報の取得
	*
	* @return  true    する
	* @return  false   しない
	*/
	getLoopFadeIn() {
		return this._isLoopFadeIn;
	}
	/**
	* モデルのパラメータ更新
	*
	* イベント発火のチェック。
	* 入力する時間は呼ばれるモーションタイミングを０とした秒数で行う。
	*
	* @param beforeCheckTimeSeconds 前回のイベントチェック時間[秒]
	* @param motionTimeSeconds 今回の再生時間[秒]
	*/
	getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
		return this._firedEventValues;
	}
	/**
	* 透明度のカーブが存在するかどうかを確認する
	*
	* @return true  -> キーが存在する
	*          false -> キーが存在しない
	*/
	isExistModelOpacity() {
		return false;
	}
	/**
	* 透明度のカーブのインデックスを返す
	*
	* @return success:透明度のカーブのインデックス
	*/
	getModelOpacityIndex() {
		return -1;
	}
	/**
	* 透明度のIdを返す
	*
	* @param index モーションカーブのインデックス
	* @return success:透明度のId
	*/
	getModelOpacityId(index) {
		return null;
	}
	/**
	* 指定時間の透明度の値を返す
	*
	* @return success:モーションの現在時間におけるOpacityの値
	*
	* @note  更新後の値を取るにはUpdateParameters() の後に呼び出す。
	*/
	getModelOpacityValue() {
		return 1;
	}
	/**
	* 終了時刻の調整
	* @param motionQueueEntry CubismMotionQueueManagerで管理されているモーション
	*/
	adjustEndTime(motionQueueEntry) {
		const duration = this.getDuration();
		const endTime = duration <= 0 ? -1 : motionQueueEntry.getStartTime() + duration;
		motionQueueEntry.setEndTime(endTime);
	}
};
var Live2DCubismFramework$19;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.ACubismMotion = ACubismMotion;
})(Live2DCubismFramework$19 || (Live2DCubismFramework$19 = {}));
//#endregion
//#region cubism/src/motion/cubismexpressionmotion.ts
var _CubismExpressionMotion;
var ExpressionKeyFadeIn = "FadeInTime";
var ExpressionKeyFadeOut = "FadeOutTime";
var ExpressionKeyParameters = "Parameters";
var ExpressionKeyId = "Id";
var ExpressionKeyValue = "Value";
var ExpressionKeyBlend = "Blend";
var BlendValueAdd = "Add";
var BlendValueMultiply = "Multiply";
var BlendValueOverwrite = "Overwrite";
var DefaultFadeTime = 1;
/**
* 表情のモーション
*
* 表情のモーションクラス。
*/
var CubismExpressionMotion = class CubismExpressionMotion extends ACubismMotion {
	/**
	* インスタンスを作成する。
	* @param buffer expファイルが読み込まれているバッファ
	* @param size バッファのサイズ
	* @return 作成されたインスタンス
	*/
	static create(buffer, size) {
		const expression = new CubismExpressionMotion();
		expression.parse(buffer, size);
		return expression;
	}
	/**
	* モデルのパラメータの更新の実行
	* @param model 対象のモデル
	* @param userTimeSeconds デルタ時間の積算値[秒]
	* @param weight モーションの重み
	* @param motionQueueEntry CubismMotionQueueManagerで管理されているモーション
	*/
	doUpdateParameters(model, userTimeSeconds, weight, motionQueueEntry) {
		for (let i = 0; i < this._parameters.length; ++i) {
			const parameter = this._parameters[i];
			switch (parameter.blendType) {
				case 0:
					model.addParameterValueById(parameter.parameterId, parameter.value, weight);
					break;
				case 1:
					model.multiplyParameterValueById(parameter.parameterId, parameter.value, weight);
					break;
				case 2:
					model.setParameterValueById(parameter.parameterId, parameter.value, weight);
					break;
				default: break;
			}
		}
	}
	/**
	* @brief 表情によるモデルのパラメータの計算
	*
	* モデルの表情に関するパラメータを計算する。
	*
	* @param[in]   model                        対象のモデル
	* @param[in]   userTimeSeconds              デルタ時間の積算値[秒]
	* @param[in]   motionQueueEntry             CubismMotionQueueManagerで管理されているモーション
	* @param[in]   expressionParameterValues    モデルに適用する各パラメータの値
	* @param[in]   expressionIndex              表情のインデックス
	* @param[in]   fadeWeight                   表情のウェイト
	*/
	calculateExpressionParameters(model, userTimeSeconds, motionQueueEntry, expressionParameterValues, expressionIndex, fadeWeight) {
		if (motionQueueEntry == null || expressionParameterValues == null) return;
		if (!motionQueueEntry.isAvailable()) return;
		for (let i = 0; i < expressionParameterValues.length; ++i) {
			const expressionParameterValue = expressionParameterValues[i];
			if (expressionParameterValue.parameterId == null) continue;
			const currentParameterValue = expressionParameterValue.overwriteValue = model.getParameterValueById(expressionParameterValue.parameterId);
			const expressionParameters = this.getExpressionParameters();
			let parameterIndex = -1;
			for (let j = 0; j < expressionParameters.length; ++j) {
				if (expressionParameterValue.parameterId != expressionParameters[j].parameterId) continue;
				parameterIndex = j;
				break;
			}
			if (parameterIndex < 0) {
				if (expressionIndex == 0) {
					expressionParameterValue.additiveValue = CubismExpressionMotion.DefaultAdditiveValue;
					expressionParameterValue.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
					expressionParameterValue.overwriteValue = currentParameterValue;
				} else {
					expressionParameterValue.additiveValue = this.calculateValue(expressionParameterValue.additiveValue, CubismExpressionMotion.DefaultAdditiveValue, fadeWeight);
					expressionParameterValue.multiplyValue = this.calculateValue(expressionParameterValue.multiplyValue, CubismExpressionMotion.DefaultMultiplyValue, fadeWeight);
					expressionParameterValue.overwriteValue = this.calculateValue(expressionParameterValue.overwriteValue, currentParameterValue, fadeWeight);
				}
				continue;
			}
			const value = expressionParameters[parameterIndex].value;
			let newAdditiveValue, newMultiplyValue, newOverwriteValue;
			switch (expressionParameters[parameterIndex].blendType) {
				case 0:
					newAdditiveValue = value;
					newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
					newOverwriteValue = currentParameterValue;
					break;
				case 1:
					newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
					newMultiplyValue = value;
					newOverwriteValue = currentParameterValue;
					break;
				case 2:
					newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
					newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
					newOverwriteValue = value;
					break;
				default: return;
			}
			if (expressionIndex == 0) {
				expressionParameterValue.additiveValue = newAdditiveValue;
				expressionParameterValue.multiplyValue = newMultiplyValue;
				expressionParameterValue.overwriteValue = newOverwriteValue;
			} else {
				expressionParameterValue.additiveValue = expressionParameterValue.additiveValue * (1 - fadeWeight) + newAdditiveValue * fadeWeight;
				expressionParameterValue.multiplyValue = expressionParameterValue.multiplyValue * (1 - fadeWeight) + newMultiplyValue * fadeWeight;
				expressionParameterValue.overwriteValue = expressionParameterValue.overwriteValue * (1 - fadeWeight) + newOverwriteValue * fadeWeight;
			}
		}
	}
	/**
	* @brief 表情が参照しているパラメータを取得
	*
	* 表情が参照しているパラメータを取得する
	*
	* @return 表情パラメータ
	*/
	getExpressionParameters() {
		return this._parameters;
	}
	parse(buffer, size) {
		const json = CubismJson.create(buffer, size);
		if (!json) return;
		const root = json.getRoot();
		this.setFadeInTime(root.getValueByString(ExpressionKeyFadeIn).toFloat(DefaultFadeTime));
		this.setFadeOutTime(root.getValueByString(ExpressionKeyFadeOut).toFloat(DefaultFadeTime));
		const parameterCount = root.getValueByString(ExpressionKeyParameters).getSize();
		let dstIndex = this._parameters.length;
		this._parameters.length += parameterCount;
		for (let i = 0; i < parameterCount; ++i) {
			const param = root.getValueByString(ExpressionKeyParameters).getValueByIndex(i);
			const parameterId = CubismFramework.getIdManager().getId(param.getValueByString(ExpressionKeyId).getRawString());
			const value = param.getValueByString(ExpressionKeyValue).toFloat();
			let blendType;
			if (param.getValueByString(ExpressionKeyBlend).isNull() || param.getValueByString(ExpressionKeyBlend).getString() == BlendValueAdd) blendType = 0;
			else if (param.getValueByString(ExpressionKeyBlend).getString() == BlendValueMultiply) blendType = 1;
			else if (param.getValueByString(ExpressionKeyBlend).getString() == BlendValueOverwrite) blendType = 2;
			else blendType = 0;
			const item = new ExpressionParameter();
			item.parameterId = parameterId;
			item.blendType = blendType;
			item.value = value;
			this._parameters[dstIndex++] = item;
		}
		CubismJson.delete(json);
	}
	/**
	* @brief ブレンド計算
	*
	* 入力された値でブレンド計算をする。
	*
	* @param source 現在の値
	* @param destination 適用する値
	* @param weight ウェイト
	* @return 計算結果
	*/
	calculateValue(source, destination, fadeWeight) {
		return source * (1 - fadeWeight) + destination * fadeWeight;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		super();
		this._parameters = new Array();
	}
};
_CubismExpressionMotion = CubismExpressionMotion;
_CubismExpressionMotion.DefaultAdditiveValue = 0;
_CubismExpressionMotion.DefaultMultiplyValue = 1;
/**
* 表情パラメータ値の計算方式
*/
var ExpressionBlendType = /* @__PURE__ */ function(ExpressionBlendType) {
	ExpressionBlendType[ExpressionBlendType["Additive"] = 0] = "Additive";
	ExpressionBlendType[ExpressionBlendType["Multiply"] = 1] = "Multiply";
	ExpressionBlendType[ExpressionBlendType["Overwrite"] = 2] = "Overwrite";
	return ExpressionBlendType;
}({});
/**
* 表情のパラメータ情報
*/
var ExpressionParameter = class {};
var Live2DCubismFramework$18;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismExpressionMotion = CubismExpressionMotion;
	_Live2DCubismFramework.ExpressionBlendType = ExpressionBlendType;
	_Live2DCubismFramework.ExpressionParameter = ExpressionParameter;
})(Live2DCubismFramework$18 || (Live2DCubismFramework$18 = {}));
//#endregion
//#region cubism/src/motion/cubismmotionqueueentry.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* CubismMotionQueueManagerで再生している各モーションの管理クラス。
*/
var CubismMotionQueueEntry = class {
	/**
	* コンストラクタ
	*/
	constructor() {
		this._autoDelete = false;
		this._motion = null;
		this._available = true;
		this._finished = false;
		this._started = false;
		this._startTimeSeconds = -1;
		this._fadeInStartTimeSeconds = 0;
		this._endTimeSeconds = -1;
		this._stateTimeSeconds = 0;
		this._stateWeight = 0;
		this._lastEventCheckSeconds = 0;
		this._motionQueueEntryHandle = this;
		this._fadeOutSeconds = 0;
		this._isTriggeredFadeOut = false;
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		if (this._autoDelete && this._motion) ACubismMotion.delete(this._motion);
	}
	/**
	* フェードアウト時間と開始判定の設定
	* @param fadeOutSeconds フェードアウトにかかる時間[秒]
	*/
	setFadeOut(fadeOutSeconds) {
		this._fadeOutSeconds = fadeOutSeconds;
		this._isTriggeredFadeOut = true;
	}
	/**
	* フェードアウトの開始
	* @param fadeOutSeconds フェードアウトにかかる時間[秒]
	* @param userTimeSeconds デルタ時間の積算値[秒]
	*/
	startFadeOut(fadeOutSeconds, userTimeSeconds) {
		const newEndTimeSeconds = userTimeSeconds + fadeOutSeconds;
		this._isTriggeredFadeOut = true;
		if (this._endTimeSeconds < 0 || newEndTimeSeconds < this._endTimeSeconds) this._endTimeSeconds = newEndTimeSeconds;
	}
	/**
	* モーションの終了の確認
	*
	* @return true モーションが終了した
	* @return false 終了していない
	*/
	isFinished() {
		return this._finished;
	}
	/**
	* モーションの開始の確認
	* @return true モーションが開始した
	* @return false 開始していない
	*/
	isStarted() {
		return this._started;
	}
	/**
	* モーションの開始時刻の取得
	* @return モーションの開始時刻[秒]
	*/
	getStartTime() {
		return this._startTimeSeconds;
	}
	/**
	* フェードインの開始時刻の取得
	* @return フェードインの開始時刻[秒]
	*/
	getFadeInStartTime() {
		return this._fadeInStartTimeSeconds;
	}
	/**
	* フェードインの終了時刻の取得
	* @return フェードインの終了時刻の取得
	*/
	getEndTime() {
		return this._endTimeSeconds;
	}
	/**
	* モーションの開始時刻の設定
	* @param startTime モーションの開始時刻
	*/
	setStartTime(startTime) {
		this._startTimeSeconds = startTime;
	}
	/**
	* フェードインの開始時刻の設定
	* @param startTime フェードインの開始時刻[秒]
	*/
	setFadeInStartTime(startTime) {
		this._fadeInStartTimeSeconds = startTime;
	}
	/**
	* フェードインの終了時刻の設定
	* @param endTime フェードインの終了時刻[秒]
	*/
	setEndTime(endTime) {
		this._endTimeSeconds = endTime;
	}
	/**
	* モーションの終了の設定
	* @param f trueならモーションの終了
	*/
	setIsFinished(f) {
		this._finished = f;
	}
	/**
	* モーション開始の設定
	* @param f trueならモーションの開始
	*/
	setIsStarted(f) {
		this._started = f;
	}
	/**
	* モーションの有効性の確認
	* @return true モーションは有効
	* @return false モーションは無効
	*/
	isAvailable() {
		return this._available;
	}
	/**
	* モーションの有効性の設定
	* @param v trueならモーションは有効
	*/
	setIsAvailable(v) {
		this._available = v;
	}
	/**
	* モーションの状態の設定
	* @param timeSeconds 現在時刻[秒]
	* @param weight モーション尾重み
	*/
	setState(timeSeconds, weight) {
		this._stateTimeSeconds = timeSeconds;
		this._stateWeight = weight;
	}
	/**
	* モーションの現在時刻の取得
	* @return モーションの現在時刻[秒]
	*/
	getStateTime() {
		return this._stateTimeSeconds;
	}
	/**
	* モーションの重みの取得
	* @return モーションの重み
	*/
	getStateWeight() {
		return this._stateWeight;
	}
	/**
	* 最後にイベントの発火をチェックした時間を取得
	*
	* @return 最後にイベントの発火をチェックした時間[秒]
	*/
	getLastCheckEventSeconds() {
		return this._lastEventCheckSeconds;
	}
	/**
	* 最後にイベントをチェックした時間を設定
	* @param checkSeconds 最後にイベントをチェックした時間[秒]
	*/
	setLastCheckEventSeconds(checkSeconds) {
		this._lastEventCheckSeconds = checkSeconds;
	}
	/**
	* フェードアウト開始判定の取得
	* @return フェードアウト開始するかどうか
	*/
	isTriggeredFadeOut() {
		return this._isTriggeredFadeOut;
	}
	/**
	* フェードアウト時間の取得
	* @return フェードアウト時間[秒]
	*/
	getFadeOutSeconds() {
		return this._fadeOutSeconds;
	}
	/**
	* モーションの取得
	*
	* @return モーション
	*/
	getCubismMotion() {
		return this._motion;
	}
};
var Live2DCubismFramework$17;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMotionQueueEntry = CubismMotionQueueEntry;
})(Live2DCubismFramework$17 || (Live2DCubismFramework$17 = {}));
//#endregion
//#region cubism/src/motion/cubismmotionqueuemanager.ts
/**
* モーション再生の管理
*
* モーション再生の管理用クラス。CubismMotionモーションなどACubismMotionのサブクラスを再生するために使用する。
*
* @note 再生中に別のモーションが StartMotion()された場合は、新しいモーションに滑らかに変化し旧モーションは中断する。
*       表情用モーション、体用モーションなどを分けてモーション化した場合など、
*       複数のモーションを同時に再生させる場合は、複数のCubismMotionQueueManagerインスタンスを使用する。
*/
var CubismMotionQueueManager = class {
	/**
	* コンストラクタ
	*/
	constructor() {
		this._userTimeSeconds = 0;
		this._eventCallBack = null;
		this._eventCustomData = null;
		this._motions = new Array();
	}
	/**
	* デストラクタ
	*/
	release() {
		for (let i = 0; i < this._motions.length; ++i) if (this._motions[i]) {
			this._motions[i].release();
			this._motions[i] = null;
		}
		this._motions = null;
	}
	/**
	* 指定したモーションの開始
	*
	* 指定したモーションを開始する。同じタイプのモーションが既にある場合は、既存のモーションに終了フラグを立て、フェードアウトを開始させる。
	*
	* @param   motion          開始するモーション
	* @param   autoDelete      再生が終了したモーションのインスタンスを削除するなら true
	* @param   userTimeSeconds Deprecated: デルタ時間の積算値[秒] 関数内で参照していないため使用は非推奨。
	* @return                      開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するIsFinished()の引数で使用する。開始できない時は「-1」
	*/
	startMotion(motion, autoDelete, userTimeSeconds) {
		if (motion == null) return -1;
		let motionQueueEntry = null;
		for (let i = 0; i < this._motions.length; ++i) {
			motionQueueEntry = this._motions[i];
			if (motionQueueEntry == null) continue;
			motionQueueEntry.setFadeOut(motionQueueEntry._motion.getFadeOutTime());
		}
		motionQueueEntry = new CubismMotionQueueEntry();
		motionQueueEntry._autoDelete = autoDelete;
		motionQueueEntry._motion = motion;
		this._motions.push(motionQueueEntry);
		return motionQueueEntry._motionQueueEntryHandle;
	}
	/**
	* 全てのモーションの終了の確認
	* @return true 全て終了している
	* @return false 終了していない
	*/
	isFinished() {
		for (let i = 0; i < this._motions.length;) {
			let motionQueueEntry = this._motions[i];
			if (motionQueueEntry == null) {
				this._motions.splice(i, 1);
				continue;
			}
			if (motionQueueEntry._motion == null) {
				motionQueueEntry.release();
				motionQueueEntry = null;
				this._motions.splice(i, 1);
				continue;
			}
			if (!motionQueueEntry.isFinished()) return false;
			else i++;
		}
		return true;
	}
	/**
	* 指定したモーションの終了の確認
	* @param motionQueueEntryNumber モーションの識別番号
	* @return true 全て終了している
	* @return false 終了していない
	*/
	isFinishedByHandle(motionQueueEntryNumber) {
		for (let i = 0; i < this._motions.length; i++) {
			const motionQueueEntry = this._motions[i];
			if (motionQueueEntry == null) continue;
			if (motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber && !motionQueueEntry.isFinished()) return false;
		}
		return true;
	}
	/**
	* 全てのモーションを停止する
	*/
	stopAllMotions() {
		for (let i = 0; i < this._motions.length; i++) {
			const motionQueueEntry = this._motions[i];
			if (motionQueueEntry == null) {
				this._motions.splice(i, 1);
				continue;
			}
			motionQueueEntry.release();
			this._motions.splice(i, 1);
		}
	}
	/**
	* @brief CubismMotionQueueEntryの配列の取得
	*
	* CubismMotionQueueEntryの配列を取得する。
	*
	* @return  CubismMotionQueueEntryの配列へのポインタ
	*          NULL   見つからなかった
	*/
	getCubismMotionQueueEntries() {
		return this._motions;
	}
	/**
	* 指定したCubismMotionQueueEntryの取得
	
	* @param   motionQueueEntryNumber  モーションの識別番号
	* @return  指定したCubismMotionQueueEntry
	* @return  null   見つからなかった
	*/
	getCubismMotionQueueEntry(motionQueueEntryNumber) {
		for (let i = 0; i < this._motions.length; i++) {
			const motionQueueEntry = this._motions[i];
			if (motionQueueEntry == null) continue;
			if (motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber) return motionQueueEntry;
		}
		return null;
	}
	/**
	* イベントを受け取るCallbackの登録
	*
	* @param callback コールバック関数
	* @param customData コールバックに返されるデータ
	*/
	setEventCallback(callback, customData = null) {
		this._eventCallBack = callback;
		this._eventCustomData = customData;
	}
	/**
	* モーションを更新して、モデルにパラメータ値を反映する。
	*
	* @param   model   対象のモデル
	* @param   userTimeSeconds   デルタ時間の積算値[秒]
	* @return  true    モデルへパラメータ値の反映あり
	* @return  false   モデルへパラメータ値の反映なし(モーションの変化なし)
	*/
	doUpdateMotion(model, userTimeSeconds) {
		let updated = false;
		for (let i = 0; i < this._motions.length;) {
			let motionQueueEntry = this._motions[i];
			if (motionQueueEntry == null) {
				this._motions.splice(i, 1);
				continue;
			}
			const motion = motionQueueEntry._motion;
			if (motion == null) {
				motionQueueEntry.release();
				motionQueueEntry = null;
				this._motions.splice(i, 1);
				continue;
			}
			motion.updateParameters(model, motionQueueEntry, userTimeSeconds);
			updated = true;
			const firedList = motion.getFiredEvent(motionQueueEntry.getLastCheckEventSeconds() - motionQueueEntry.getStartTime(), userTimeSeconds - motionQueueEntry.getStartTime());
			for (let i = 0; i < firedList.length; ++i) this._eventCallBack(this, firedList[i], this._eventCustomData);
			motionQueueEntry.setLastCheckEventSeconds(userTimeSeconds);
			if (motionQueueEntry.isFinished()) {
				motionQueueEntry.release();
				motionQueueEntry = null;
				this._motions.splice(i, 1);
			} else {
				if (motionQueueEntry.isTriggeredFadeOut()) motionQueueEntry.startFadeOut(motionQueueEntry.getFadeOutSeconds(), userTimeSeconds);
				i++;
			}
		}
		return updated;
	}
};
var Live2DCubismFramework$16;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMotionQueueManager = CubismMotionQueueManager;
	_Live2DCubismFramework.InvalidMotionQueueEntryHandleValue = -1;
})(Live2DCubismFramework$16 || (Live2DCubismFramework$16 = {}));
//#endregion
//#region cubism/src/motion/cubismexpressionmotionmanager.ts
/**
* @brief パラメータに適用する表情の値を持たせる構造体
*/
var ExpressionParameterValue = class {};
/**
* @brief 表情モーションの管理
*
* 表情モーションの管理をおこなうクラス。
*/
var CubismExpressionMotionManager = class extends CubismMotionQueueManager {
	/**
	* コンストラクタ
	*/
	constructor() {
		super();
		this._expressionParameterValues = new Array();
		this._fadeWeights = new Array();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		if (this._expressionParameterValues) {
			csmDelete(this._expressionParameterValues);
			this._expressionParameterValues = null;
		}
		if (this._fadeWeights) {
			csmDelete(this._fadeWeights);
			this._fadeWeights = null;
		}
	}
	/**
	* @brief 再生中のモーションのウェイトを取得する。
	*
	* @param[in]    index    表情のインデックス
	* @return               表情モーションのウェイト
	*/
	getFadeWeight(index) {
		if (index < 0 || this._fadeWeights.length < 1 || index >= this._fadeWeights.length) {
			console.warn("Failed to get the fade weight value. The element at that index does not exist.");
			return -1;
		}
		return this._fadeWeights[index];
	}
	/**
	* @brief モーションのウェイトの設定。
	*
	* @param[in]    index    表情のインデックス
	* @param[in]    index    表情モーションのウェイト
	*/
	setFadeWeight(index, expressionFadeWeight) {
		if (index < 0 || this._fadeWeights.length < 1 || this._fadeWeights.length <= index) {
			console.warn("Failed to set the fade weight value. The element at that index does not exist.");
			return;
		}
		this._fadeWeights[index] = expressionFadeWeight;
	}
	/**
	* @brief モーションの更新
	*
	* モーションを更新して、モデルにパラメータ値を反映する。
	*
	* @param[in]   model   対象のモデル
	* @param[in]   deltaTimeSeconds    デルタ時間[秒]
	* @return  true    更新されている
	*          false   更新されていない
	*/
	updateMotion(model, deltaTimeSeconds) {
		this._userTimeSeconds += deltaTimeSeconds;
		let updated = false;
		const motions = this.getCubismMotionQueueEntries();
		let expressionWeight = 0;
		let expressionIndex = 0;
		if (this._fadeWeights.length !== motions.length) {
			const difference = motions.length - this._fadeWeights.length;
			let dstIndex = this._fadeWeights.length;
			this._fadeWeights.length += difference;
			for (let i = 0; i < difference; i++) this._fadeWeights[dstIndex++] = 0;
		}
		for (let i = 0; i < this._motions.length;) {
			const motionQueueEntry = this._motions[i];
			if (motionQueueEntry == null) {
				motions.splice(i, 1);
				continue;
			}
			const expressionMotion = motionQueueEntry.getCubismMotion();
			if (expressionMotion == null) {
				csmDelete(motionQueueEntry);
				motions.splice(i, 1);
				continue;
			}
			const expressionParameters = expressionMotion.getExpressionParameters();
			if (motionQueueEntry.isAvailable()) for (let i = 0; i < expressionParameters.length; ++i) {
				if (expressionParameters[i].parameterId == null) continue;
				let index = -1;
				for (let j = 0; j < this._expressionParameterValues.length; ++j) {
					if (this._expressionParameterValues[j].parameterId != expressionParameters[i].parameterId) continue;
					index = j;
					break;
				}
				if (index >= 0) continue;
				const item = new ExpressionParameterValue();
				item.parameterId = expressionParameters[i].parameterId;
				item.additiveValue = CubismExpressionMotion.DefaultAdditiveValue;
				item.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
				item.overwriteValue = model.getParameterValueById(item.parameterId);
				this._expressionParameterValues.push(item);
			}
			expressionMotion.setupMotionQueueEntry(motionQueueEntry, this._userTimeSeconds);
			this.setFadeWeight(expressionIndex, expressionMotion.updateFadeWeight(motionQueueEntry, this._userTimeSeconds));
			expressionMotion.calculateExpressionParameters(model, this._userTimeSeconds, motionQueueEntry, this._expressionParameterValues, expressionIndex, this.getFadeWeight(expressionIndex));
			expressionWeight += expressionMotion.getFadeInTime() == 0 ? 1 : CubismMath.getEasingSine((this._userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / expressionMotion.getFadeInTime());
			updated = true;
			if (motionQueueEntry.isTriggeredFadeOut()) motionQueueEntry.startFadeOut(motionQueueEntry.getFadeOutSeconds(), this._userTimeSeconds);
			++i;
			++expressionIndex;
		}
		if (motions.length > 1) {
			if (this.getFadeWeight(this._fadeWeights.length - 1) >= 1) for (let i = motions.length - 2; i >= 0; --i) {
				const motionQueueEntry = motions[i];
				csmDelete(motionQueueEntry);
				motions.splice(i, 1);
				this._fadeWeights.splice(i, 1);
			}
		}
		if (expressionWeight > 1) expressionWeight = 1;
		for (let i = 0; i < this._expressionParameterValues.length; ++i) {
			const expressionParameterValue = this._expressionParameterValues[i];
			model.setParameterValueById(expressionParameterValue.parameterId, (expressionParameterValue.overwriteValue + expressionParameterValue.additiveValue) * expressionParameterValue.multiplyValue, expressionWeight);
			expressionParameterValue.additiveValue = CubismExpressionMotion.DefaultAdditiveValue;
			expressionParameterValue.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
		}
		return updated;
	}
};
var Live2DCubismFramework$15;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismExpressionMotionManager = CubismExpressionMotionManager;
})(Live2DCubismFramework$15 || (Live2DCubismFramework$15 = {}));
//#endregion
//#region src/cubism5/serialization.ts
function toCubismJsonBuffer(data) {
	if (data instanceof ArrayBuffer) return {
		buffer: data,
		byteLength: data.byteLength
	};
	const encoded = new TextEncoder().encode(typeof data === "string" ? data : JSON.stringify(data));
	return {
		buffer: encoded.buffer,
		byteLength: encoded.byteLength
	};
}
//#endregion
//#region src/cubism5/Cubism5ExpressionManager.ts
var Cubism5ExpressionManager = class extends ExpressionManager {
	constructor(settings, options) {
		var _settings$expressions;
		super(settings, options);
		this.queueManager = new CubismExpressionMotionManager();
		this.definitions = (_settings$expressions = settings.expressions) !== null && _settings$expressions !== void 0 ? _settings$expressions : [];
		this.init();
	}
	isFinished() {
		return this.queueManager.isFinished();
	}
	getExpressionIndex(name) {
		return this.definitions.findIndex((def) => def.Name === name);
	}
	getExpressionFile(definition) {
		return definition.File;
	}
	createExpression(data, definition) {
		const { buffer, byteLength } = toCubismJsonBuffer(data);
		return CubismExpressionMotion.create(buffer, byteLength);
	}
	_setExpression(motion) {
		return this.queueManager.startMotion(motion, false);
	}
	stopAllExpressions() {
		this.queueManager.stopAllMotions();
		this.lastUpdateTimeSeconds = void 0;
	}
	updateParameters(model, now) {
		var _this$lastUpdateTimeS;
		const elapsedSeconds = Math.max(0, now - ((_this$lastUpdateTimeS = this.lastUpdateTimeSeconds) !== null && _this$lastUpdateTimeS !== void 0 ? _this$lastUpdateTimeS : now));
		this.lastUpdateTimeSeconds = now;
		return this.queueManager.updateMotion(model, elapsedSeconds);
	}
	destroy() {
		this.stopAllExpressions();
		this.queueManager.release();
		super.destroy();
	}
};
//#endregion
//#region cubism/src/utils/cubismarrayutils.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* Arrayのサイズを変更する。
* @param curArray
* @param newSize
* @param value
* @param callPlacementNew
*/
function updateSize(curArray, newSize, value = null, callPlacementNew = null) {
	if (curArray.length < newSize) if (callPlacementNew) for (let i = curArray.length; i < newSize; i++) if (typeof value == "function") curArray[i] = JSON.parse(JSON.stringify(new value()));
	else curArray[i] = value;
	else for (let i = curArray.length; i < newSize; i++) curArray[i] = value;
	else curArray.length = newSize;
}
//#endregion
//#region cubism/src/motion/cubismmotioninternal.ts
/**
* @brief モーションカーブの種類
*
* モーションカーブの種類。
*/
var CubismMotionCurveTarget = /* @__PURE__ */ function(CubismMotionCurveTarget) {
	CubismMotionCurveTarget[CubismMotionCurveTarget["CubismMotionCurveTarget_Model"] = 0] = "CubismMotionCurveTarget_Model";
	CubismMotionCurveTarget[CubismMotionCurveTarget["CubismMotionCurveTarget_Parameter"] = 1] = "CubismMotionCurveTarget_Parameter";
	CubismMotionCurveTarget[CubismMotionCurveTarget["CubismMotionCurveTarget_PartOpacity"] = 2] = "CubismMotionCurveTarget_PartOpacity";
	return CubismMotionCurveTarget;
}({});
/**
* @brief モーションカーブのセグメントの種類
*
* モーションカーブのセグメントの種類。
*/
var CubismMotionSegmentType = /* @__PURE__ */ function(CubismMotionSegmentType) {
	CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_Linear"] = 0] = "CubismMotionSegmentType_Linear";
	CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_Bezier"] = 1] = "CubismMotionSegmentType_Bezier";
	CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_Stepped"] = 2] = "CubismMotionSegmentType_Stepped";
	CubismMotionSegmentType[CubismMotionSegmentType["CubismMotionSegmentType_InverseStepped"] = 3] = "CubismMotionSegmentType_InverseStepped";
	return CubismMotionSegmentType;
}({});
/**
* @brief モーションカーブの制御点
*
* モーションカーブの制御点。
*/
var CubismMotionPoint = class {
	constructor() {
		this.time = 0;
		this.value = 0;
	}
};
/**
* @brief モーションカーブのセグメント
*
* モーションカーブのセグメント。
*/
var CubismMotionSegment = class {
	/**
	* @brief コンストラクタ
	*
	* コンストラクタ。
	*/
	constructor() {
		this.evaluate = null;
		this.basePointIndex = 0;
		this.segmentType = 0;
	}
};
/**
* @brief モーションカーブ
*
* モーションカーブ。
*/
var CubismMotionCurve = class {
	constructor() {
		this.type = 0;
		this.segmentCount = 0;
		this.baseSegmentIndex = 0;
		this.fadeInTime = 0;
		this.fadeOutTime = 0;
	}
};
/**
* イベント。
*/
var CubismMotionEvent = class {
	constructor() {
		this.fireTime = 0;
	}
};
/**
* @brief モーションデータ
*
* モーションデータ。
*/
var CubismMotionData = class {
	constructor() {
		this.duration = 0;
		this.loop = false;
		this.curveCount = 0;
		this.eventCount = 0;
		this.fps = 0;
		this.curves = new Array();
		this.segments = new Array();
		this.points = new Array();
		this.events = new Array();
	}
};
var Live2DCubismFramework$14;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMotionCurve = CubismMotionCurve;
	_Live2DCubismFramework.CubismMotionCurveTarget = CubismMotionCurveTarget;
	_Live2DCubismFramework.CubismMotionData = CubismMotionData;
	_Live2DCubismFramework.CubismMotionEvent = CubismMotionEvent;
	_Live2DCubismFramework.CubismMotionPoint = CubismMotionPoint;
	_Live2DCubismFramework.CubismMotionSegment = CubismMotionSegment;
	_Live2DCubismFramework.CubismMotionSegmentType = CubismMotionSegmentType;
})(Live2DCubismFramework$14 || (Live2DCubismFramework$14 = {}));
//#endregion
//#region cubism/src/motion/cubismmotionjson.ts
var Meta$1 = "Meta";
var Duration = "Duration";
var Loop = "Loop";
var AreBeziersRestricted = "AreBeziersRestricted";
var CurveCount = "CurveCount";
var Fps$1 = "Fps";
var TotalSegmentCount = "TotalSegmentCount";
var TotalPointCount = "TotalPointCount";
var Curves = "Curves";
var Target = "Target";
var Id$2 = "Id";
var FadeInTime = "FadeInTime";
var FadeOutTime = "FadeOutTime";
var Segments = "Segments";
var UserData = "UserData";
var UserDataCount = "UserDataCount";
var TotalUserDataSize = "TotalUserDataSize";
var Time = "Time";
var Value = "Value";
/**
* motion3.jsonのコンテナ。
*/
var CubismMotionJson = class {
	/**
	* コンストラクタ
	* @param buffer motion3.jsonが読み込まれているバッファ
	* @param size バッファのサイズ
	*/
	constructor(buffer, size) {
		this._json = CubismJson.create(buffer, size);
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		CubismJson.delete(this._json);
	}
	/**
	* モーションの長さを取得する
	* @return モーションの長さ[秒]
	*/
	getMotionDuration() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(Duration).toFloat();
	}
	/**
	* モーションのループ情報の取得
	* @return true ループする
	* @return false ループしない
	*/
	isMotionLoop() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(Loop).toBoolean();
	}
	/**
	*  motion3.jsonファイルの整合性チェック
	*
	* @return 正常なファイルの場合はtrueを返す。
	*/
	hasConsistency() {
		let result = true;
		if (!this._json || !this._json.getRoot()) return false;
		const actualCurveListSize = this._json.getRoot().getValueByString(Curves).getVector().length;
		let actualTotalSegmentCount = 0;
		let actualTotalPointCount = 0;
		for (let curvePosition = 0; curvePosition < actualCurveListSize; ++curvePosition) for (let segmentPosition = 0; segmentPosition < this.getMotionCurveSegmentCount(curvePosition);) {
			if (segmentPosition == 0) {
				actualTotalPointCount += 1;
				segmentPosition += 2;
			}
			switch (this.getMotionCurveSegment(curvePosition, segmentPosition)) {
				case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
					actualTotalPointCount += 1;
					segmentPosition += 3;
					break;
				case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
					actualTotalPointCount += 3;
					segmentPosition += 7;
					break;
				case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
					actualTotalPointCount += 1;
					segmentPosition += 3;
					break;
				case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
					actualTotalPointCount += 1;
					segmentPosition += 3;
					break;
				default:
					CSM_ASSERT(0);
					break;
			}
			++actualTotalSegmentCount;
		}
		if (actualCurveListSize != this.getMotionCurveCount()) {
			CubismLogWarning("The number of curves does not match the metadata.");
			result = false;
		}
		if (actualTotalSegmentCount != this.getMotionTotalSegmentCount()) {
			CubismLogWarning("The number of segment does not match the metadata.");
			result = false;
		}
		if (actualTotalPointCount != this.getMotionTotalPointCount()) {
			CubismLogWarning("The number of point does not match the metadata.");
			result = false;
		}
		return result;
	}
	getEvaluationOptionFlag(flagType) {
		if (0 == flagType) return this._json.getRoot().getValueByString(Meta$1).getValueByString(AreBeziersRestricted).toBoolean();
		return false;
	}
	/**
	* モーションカーブの個数の取得
	* @return モーションカーブの個数
	*/
	getMotionCurveCount() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(CurveCount).toInt();
	}
	/**
	* モーションのフレームレートの取得
	* @return フレームレート[FPS]
	*/
	getMotionFps() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(Fps$1).toFloat();
	}
	/**
	* モーションのセグメントの総合計の取得
	* @return モーションのセグメントの取得
	*/
	getMotionTotalSegmentCount() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(TotalSegmentCount).toInt();
	}
	/**
	* モーションのカーブの制御店の総合計の取得
	* @return モーションのカーブの制御点の総合計
	*/
	getMotionTotalPointCount() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(TotalPointCount).toInt();
	}
	/**
	* モーションのフェードイン時間の存在
	* @return true 存在する
	* @return false 存在しない
	*/
	isExistMotionFadeInTime() {
		return !this._json.getRoot().getValueByString(Meta$1).getValueByString(FadeInTime).isNull();
	}
	/**
	* モーションのフェードアウト時間の存在
	* @return true 存在する
	* @return false 存在しない
	*/
	isExistMotionFadeOutTime() {
		return !this._json.getRoot().getValueByString(Meta$1).getValueByString(FadeOutTime).isNull();
	}
	/**
	* モーションのフェードイン時間の取得
	* @return フェードイン時間[秒]
	*/
	getMotionFadeInTime() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(FadeInTime).toFloat();
	}
	/**
	* モーションのフェードアウト時間の取得
	* @return フェードアウト時間[秒]
	*/
	getMotionFadeOutTime() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(FadeOutTime).toFloat();
	}
	/**
	* モーションのカーブの種類の取得
	* @param curveIndex カーブのインデックス
	* @return カーブの種類
	*/
	getMotionCurveTarget(curveIndex) {
		return this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(Target).getRawString();
	}
	/**
	* モーションのカーブのIDの取得
	* @param curveIndex カーブのインデックス
	* @return カーブのID
	*/
	getMotionCurveId(curveIndex) {
		return CubismFramework.getIdManager().getId(this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(Id$2).getRawString());
	}
	/**
	* モーションのカーブのフェードイン時間の存在
	* @param curveIndex カーブのインデックス
	* @return true 存在する
	* @return false 存在しない
	*/
	isExistMotionCurveFadeInTime(curveIndex) {
		return !this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(FadeInTime).isNull();
	}
	/**
	* モーションのカーブのフェードアウト時間の存在
	* @param curveIndex カーブのインデックス
	* @return true 存在する
	* @return false 存在しない
	*/
	isExistMotionCurveFadeOutTime(curveIndex) {
		return !this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(FadeOutTime).isNull();
	}
	/**
	* モーションのカーブのフェードイン時間の取得
	* @param curveIndex カーブのインデックス
	* @return フェードイン時間[秒]
	*/
	getMotionCurveFadeInTime(curveIndex) {
		return this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(FadeInTime).toFloat();
	}
	/**
	* モーションのカーブのフェードアウト時間の取得
	* @param curveIndex カーブのインデックス
	* @return フェードアウト時間[秒]
	*/
	getMotionCurveFadeOutTime(curveIndex) {
		return this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(FadeOutTime).toFloat();
	}
	/**
	* モーションのカーブのセグメントの個数を取得する
	* @param curveIndex カーブのインデックス
	* @return モーションのカーブのセグメントの個数
	*/
	getMotionCurveSegmentCount(curveIndex) {
		return this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(Segments).getVector().length;
	}
	/**
	* モーションのカーブのセグメントの値の取得
	* @param curveIndex カーブのインデックス
	* @param segmentIndex セグメントのインデックス
	* @return セグメントの値
	*/
	getMotionCurveSegment(curveIndex, segmentIndex) {
		return this._json.getRoot().getValueByString(Curves).getValueByIndex(curveIndex).getValueByString(Segments).getValueByIndex(segmentIndex).toFloat();
	}
	/**
	* イベントの個数の取得
	* @return イベントの個数
	*/
	getEventCount() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(UserDataCount).toInt();
	}
	/**
	*  イベントの総文字数の取得
	* @return イベントの総文字数
	*/
	getTotalEventValueSize() {
		return this._json.getRoot().getValueByString(Meta$1).getValueByString(TotalUserDataSize).toInt();
	}
	/**
	* イベントの時間の取得
	* @param userDataIndex イベントのインデックス
	* @return イベントの時間[秒]
	*/
	getEventTime(userDataIndex) {
		return this._json.getRoot().getValueByString(UserData).getValueByIndex(userDataIndex).getValueByString(Time).toFloat();
	}
	/**
	* イベントの取得
	* @param userDataIndex イベントのインデックス
	* @return イベントの文字列
	*/
	getEventValue(userDataIndex) {
		return this._json.getRoot().getValueByString(UserData).getValueByIndex(userDataIndex).getValueByString(Value).getRawString();
	}
};
/**
* @brief ベジェカーブの解釈方法のフラグタイプ
*/
var EvaluationOptionFlag = /* @__PURE__ */ function(EvaluationOptionFlag) {
	EvaluationOptionFlag[EvaluationOptionFlag["EvaluationOptionFlag_AreBeziersRistricted"] = 0] = "EvaluationOptionFlag_AreBeziersRistricted";
	return EvaluationOptionFlag;
}({});
var Live2DCubismFramework$13;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMotionJson = CubismMotionJson;
})(Live2DCubismFramework$13 || (Live2DCubismFramework$13 = {}));
//#endregion
//#region cubism/src/motion/cubismmotion.ts
var EffectNameEyeBlink = "EyeBlink";
var EffectNameLipSync = "LipSync";
var TargetNameModel = "Model";
var TargetNameParameter = "Parameter";
var TargetNamePartOpacity = "PartOpacity";
var IdNameOpacity = "Opacity";
/**
* Cubism SDK R2 以前のモーションを再現させるなら true 、アニメータのモーションを正しく再現するなら false 。
*/
var UseOldBeziersCurveMotion = false;
function lerpPoints(a, b, t) {
	const result = new CubismMotionPoint();
	result.time = a.time + (b.time - a.time) * t;
	result.value = a.value + (b.value - a.value) * t;
	return result;
}
function linearEvaluate(points, time) {
	let t = (time - points[0].time) / (points[1].time - points[0].time);
	if (t < 0) t = 0;
	return points[0].value + (points[1].value - points[0].value) * t;
}
function bezierEvaluate(points, time) {
	let t = (time - points[0].time) / (points[3].time - points[0].time);
	if (t < 0) t = 0;
	const p01 = lerpPoints(points[0], points[1], t);
	const p12 = lerpPoints(points[1], points[2], t);
	const p23 = lerpPoints(points[2], points[3], t);
	return lerpPoints(lerpPoints(p01, p12, t), lerpPoints(p12, p23, t), t).value;
}
function bezierEvaluateCardanoInterpretation(points, time) {
	const x = time;
	const x1 = points[0].time;
	const x2 = points[3].time;
	const cx1 = points[1].time;
	const cx2 = points[2].time;
	const a = x2 - 3 * cx2 + 3 * cx1 - x1;
	const b = 3 * cx2 - 6 * cx1 + 3 * x1;
	const c = 3 * cx1 - 3 * x1;
	const d = x1 - x;
	const t = CubismMath.cardanoAlgorithmForBezier(a, b, c, d);
	const p01 = lerpPoints(points[0], points[1], t);
	const p12 = lerpPoints(points[1], points[2], t);
	const p23 = lerpPoints(points[2], points[3], t);
	return lerpPoints(lerpPoints(p01, p12, t), lerpPoints(p12, p23, t), t).value;
}
function steppedEvaluate(points, time) {
	return points[0].value;
}
function inverseSteppedEvaluate(points, time) {
	return points[1].value;
}
function evaluateCurve(motionData, index, time, isCorrection, endTime) {
	const curve = motionData.curves[index];
	let target = -1;
	const totalSegmentCount = curve.baseSegmentIndex + curve.segmentCount;
	let pointPosition = 0;
	for (let i = curve.baseSegmentIndex; i < totalSegmentCount; ++i) {
		pointPosition = motionData.segments[i].basePointIndex + (motionData.segments[i].segmentType == CubismMotionSegmentType.CubismMotionSegmentType_Bezier ? 3 : 1);
		if (motionData.points[pointPosition].time > time) {
			target = i;
			break;
		}
	}
	if (target == -1) {
		if (isCorrection && time < endTime) return correctEndPoint(motionData, totalSegmentCount - 1, motionData.segments[curve.baseSegmentIndex].basePointIndex, pointPosition, time, endTime);
		return motionData.points[pointPosition].value;
	}
	const segment = motionData.segments[target];
	return segment.evaluate(motionData.points.slice(segment.basePointIndex), time);
}
/**
* 終点から始点への補正処理
* @param motionData
* @param segmentIndex
* @param beginIndex
* @param endIndex
* @param time
* @param endTime
* @return
*/
function correctEndPoint(motionData, segmentIndex, beginIndex, endIndex, time, endTime) {
	const motionPoint = [new CubismMotionPoint(), new CubismMotionPoint()];
	{
		const src = motionData.points[endIndex];
		motionPoint[0].time = src.time;
		motionPoint[0].value = src.value;
	}
	{
		const src = motionData.points[beginIndex];
		motionPoint[1].time = endTime;
		motionPoint[1].value = src.value;
	}
	switch (motionData.segments[segmentIndex].segmentType) {
		case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
		case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
		default: return linearEvaluate(motionPoint, time);
		case CubismMotionSegmentType.CubismMotionSegmentType_Stepped: return steppedEvaluate(motionPoint, time);
		case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped: return inverseSteppedEvaluate(motionPoint, time);
	}
}
/**
* モーションクラス
*
* モーションのクラス。
*/
var CubismMotion = class CubismMotion extends ACubismMotion {
	/**
	* インスタンスを作成する
	*
	* @param buffer motion3.jsonが読み込まれているバッファ
	* @param size バッファのサイズ
	* @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
	* @param onBeganMotionHandler モーション再生開始時に呼び出されるコールバック関数
	* @param shouldCheckMotionConsistency motion3.json整合性チェックするかどうか
	* @return 作成されたインスタンス
	*/
	static create(buffer, size, onFinishedMotionHandler, onBeganMotionHandler, shouldCheckMotionConsistency = false) {
		const ret = new CubismMotion();
		ret.parse(buffer, size, shouldCheckMotionConsistency);
		if (ret._motionData) {
			ret._sourceFrameRate = ret._motionData.fps;
			ret._loopDurationSeconds = ret._motionData.duration;
			ret._onFinishedMotion = onFinishedMotionHandler;
			ret._onBeganMotion = onBeganMotionHandler;
		} else {
			csmDelete(ret);
			return null;
		}
		return ret;
	}
	/**
	* モデルのパラメータの更新の実行
	* @param model             対象のモデル
	* @param userTimeSeconds   現在の時刻[秒]
	* @param fadeWeight        モーションの重み
	* @param motionQueueEntry  CubismMotionQueueManagerで管理されているモーション
	*/
	doUpdateParameters(model, userTimeSeconds, fadeWeight, motionQueueEntry) {
		if (this._modelCurveIdEyeBlink == null) this._modelCurveIdEyeBlink = CubismFramework.getIdManager().getId(EffectNameEyeBlink);
		if (this._modelCurveIdLipSync == null) this._modelCurveIdLipSync = CubismFramework.getIdManager().getId(EffectNameLipSync);
		if (this._modelCurveIdOpacity == null) this._modelCurveIdOpacity = CubismFramework.getIdManager().getId(IdNameOpacity);
		if (this._motionBehavior === 1) {
			if (this._previousLoopState !== this._isLoop) {
				this.adjustEndTime(motionQueueEntry);
				this._previousLoopState = this._isLoop;
			}
		}
		let timeOffsetSeconds = userTimeSeconds - motionQueueEntry.getStartTime();
		if (timeOffsetSeconds < 0) timeOffsetSeconds = 0;
		let lipSyncValue = Number.MAX_VALUE;
		let eyeBlinkValue = Number.MAX_VALUE;
		const maxTargetSize = 64;
		let lipSyncFlags = 0;
		let eyeBlinkFlags = 0;
		if (this._eyeBlinkParameterIds.length > maxTargetSize) CubismLogDebug("too many eye blink targets : {0}", this._eyeBlinkParameterIds.length);
		if (this._lipSyncParameterIds.length > maxTargetSize) CubismLogDebug("too many lip sync targets : {0}", this._lipSyncParameterIds.length);
		const tmpFadeIn = this._fadeInSeconds <= 0 ? 1 : CubismMath.getEasingSine((userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / this._fadeInSeconds);
		const tmpFadeOut = this._fadeOutSeconds <= 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine((motionQueueEntry.getEndTime() - userTimeSeconds) / this._fadeOutSeconds);
		let value;
		let c, parameterIndex;
		let time = timeOffsetSeconds;
		let duration = this._motionData.duration;
		const isCorrection = this._motionBehavior === 1 && this._isLoop;
		if (this._isLoop) {
			if (this._motionBehavior === 1) duration += 1 / this._motionData.fps;
			while (time > duration) time -= duration;
		}
		const curves = this._motionData.curves;
		for (c = 0; c < this._motionData.curveCount && curves[c].type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model; ++c) {
			value = evaluateCurve(this._motionData, c, time, isCorrection, duration);
			if (curves[c].id == this._modelCurveIdEyeBlink) eyeBlinkValue = value;
			else if (curves[c].id == this._modelCurveIdLipSync) lipSyncValue = value;
			else if (curves[c].id == this._modelCurveIdOpacity) {
				this._modelOpacity = value;
				model.setModelOapcity(this.getModelOpacityValue());
			}
		}
		let parameterMotionCurveCount = 0;
		for (; c < this._motionData.curveCount && curves[c].type == CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter; ++c) {
			parameterMotionCurveCount++;
			parameterIndex = model.getParameterIndex(curves[c].id);
			if (parameterIndex == -1) continue;
			const sourceValue = model.getParameterValueByIndex(parameterIndex);
			value = evaluateCurve(this._motionData, c, time, isCorrection, duration);
			if (eyeBlinkValue != Number.MAX_VALUE) {
				for (let i = 0; i < this._eyeBlinkParameterIds.length && i < maxTargetSize; ++i) if (this._eyeBlinkParameterIds[i] == curves[c].id) {
					value *= eyeBlinkValue;
					eyeBlinkFlags |= 1 << i;
					break;
				}
			}
			if (lipSyncValue != Number.MAX_VALUE) {
				for (let i = 0; i < this._lipSyncParameterIds.length && i < maxTargetSize; ++i) if (this._lipSyncParameterIds[i] == curves[c].id) {
					value += lipSyncValue;
					lipSyncFlags |= 1 << i;
					break;
				}
			}
			if (model.isRepeat(parameterIndex)) value = model.getParameterRepeatValue(parameterIndex, value);
			let v;
			if (curves[c].fadeInTime < 0 && curves[c].fadeOutTime < 0) v = sourceValue + (value - sourceValue) * fadeWeight;
			else {
				let fin;
				let fout;
				if (curves[c].fadeInTime < 0) fin = tmpFadeIn;
				else fin = curves[c].fadeInTime == 0 ? 1 : CubismMath.getEasingSine((userTimeSeconds - motionQueueEntry.getFadeInStartTime()) / curves[c].fadeInTime);
				if (curves[c].fadeOutTime < 0) fout = tmpFadeOut;
				else fout = curves[c].fadeOutTime == 0 || motionQueueEntry.getEndTime() < 0 ? 1 : CubismMath.getEasingSine((motionQueueEntry.getEndTime() - userTimeSeconds) / curves[c].fadeOutTime);
				const paramWeight = this._weight * fin * fout;
				v = sourceValue + (value - sourceValue) * paramWeight;
			}
			model.setParameterValueByIndex(parameterIndex, v, 1);
		}
		if (eyeBlinkValue != Number.MAX_VALUE) for (let i = 0; i < this._eyeBlinkParameterIds.length && i < maxTargetSize; ++i) {
			const sourceValue = model.getParameterValueById(this._eyeBlinkParameterIds[i]);
			if (eyeBlinkFlags >> i & 1) continue;
			const v = sourceValue + (eyeBlinkValue - sourceValue) * fadeWeight;
			model.setParameterValueById(this._eyeBlinkParameterIds[i], v);
		}
		if (lipSyncValue != Number.MAX_VALUE) for (let i = 0; i < this._lipSyncParameterIds.length && i < maxTargetSize; ++i) {
			const sourceValue = model.getParameterValueById(this._lipSyncParameterIds[i]);
			if (lipSyncFlags >> i & 1) continue;
			const v = sourceValue + (lipSyncValue - sourceValue) * fadeWeight;
			model.setParameterValueById(this._lipSyncParameterIds[i], v);
		}
		for (; c < this._motionData.curveCount && curves[c].type == CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity; ++c) {
			parameterIndex = model.getParameterIndex(curves[c].id);
			if (parameterIndex == -1) continue;
			value = evaluateCurve(this._motionData, c, time, isCorrection, duration);
			model.setParameterValueByIndex(parameterIndex, value);
		}
		if (timeOffsetSeconds >= duration) if (this._isLoop) this.updateForNextLoop(motionQueueEntry, userTimeSeconds, time);
		else {
			if (this._onFinishedMotion) this._onFinishedMotion(this);
			motionQueueEntry.setIsFinished(true);
		}
		this._lastWeight = fadeWeight;
	}
	/**
	* Sets the version of the Motion Behavior.
	*
	* @param Specifies the version of the Motion Behavior.
	*/
	setMotionBehavior(motionBehavior) {
		this._motionBehavior = motionBehavior;
	}
	/**
	* Gets the version of the Motion Behavior.
	*
	* @return Returns the version of the Motion Behavior.
	*/
	getMotionBehavior() {
		return this._motionBehavior;
	}
	/**
	* モーションの長さを取得する。
	*
	* @return  モーションの長さ[秒]
	*/
	getDuration() {
		return this._isLoop ? -1 : this._loopDurationSeconds;
	}
	/**
	* モーションのループ時の長さを取得する。
	*
	* @return  モーションのループ時の長さ[秒]
	*/
	getLoopDuration() {
		return this._loopDurationSeconds;
	}
	/**
	* パラメータに対するフェードインの時間を設定する。
	*
	* @param parameterId     パラメータID
	* @param value           フェードインにかかる時間[秒]
	*/
	setParameterFadeInTime(parameterId, value) {
		const curves = this._motionData.curves;
		for (let i = 0; i < this._motionData.curveCount; ++i) if (parameterId == curves[i].id) {
			curves[i].fadeInTime = value;
			return;
		}
	}
	/**
	* パラメータに対するフェードアウトの時間の設定
	* @param parameterId     パラメータID
	* @param value           フェードアウトにかかる時間[秒]
	*/
	setParameterFadeOutTime(parameterId, value) {
		const curves = this._motionData.curves;
		for (let i = 0; i < this._motionData.curveCount; ++i) if (parameterId == curves[i].id) {
			curves[i].fadeOutTime = value;
			return;
		}
	}
	/**
	* パラメータに対するフェードインの時間の取得
	* @param    parameterId     パラメータID
	* @return   フェードインにかかる時間[秒]
	*/
	getParameterFadeInTime(parameterId) {
		const curves = this._motionData.curves;
		for (let i = 0; i < this._motionData.curveCount; ++i) if (parameterId == curves[i].id) return curves[i].fadeInTime;
		return -1;
	}
	/**
	* パラメータに対するフェードアウトの時間を取得
	*
	* @param   parameterId     パラメータID
	* @return   フェードアウトにかかる時間[秒]
	*/
	getParameterFadeOutTime(parameterId) {
		const curves = this._motionData.curves;
		for (let i = 0; i < this._motionData.curveCount; ++i) if (parameterId == curves[i].id) return curves[i].fadeOutTime;
		return -1;
	}
	/**
	* 自動エフェクトがかかっているパラメータIDリストの設定
	* @param eyeBlinkParameterIds    自動まばたきがかかっているパラメータIDのリスト
	* @param lipSyncParameterIds     リップシンクがかかっているパラメータIDのリスト
	*/
	setEffectIds(eyeBlinkParameterIds, lipSyncParameterIds) {
		this._eyeBlinkParameterIds = eyeBlinkParameterIds;
		this._lipSyncParameterIds = lipSyncParameterIds;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		super();
		this._motionBehavior = 1;
		this._sourceFrameRate = 30;
		this._loopDurationSeconds = -1;
		this._isLoop = false;
		this._isLoopFadeIn = true;
		this._lastWeight = 0;
		this._motionData = null;
		this._modelCurveIdEyeBlink = null;
		this._modelCurveIdLipSync = null;
		this._modelCurveIdOpacity = null;
		this._eyeBlinkParameterIds = null;
		this._lipSyncParameterIds = null;
		this._modelOpacity = 1;
		this._debugMode = false;
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		this._motionData = void 0;
		this._motionData = null;
	}
	/**
	*
	* @param motionQueueEntry
	* @param userTimeSeconds
	* @param time
	*/
	updateForNextLoop(motionQueueEntry, userTimeSeconds, time) {
		switch (this._motionBehavior) {
			case 1:
			default:
				motionQueueEntry.setStartTime(userTimeSeconds - time);
				if (this._isLoopFadeIn) motionQueueEntry.setFadeInStartTime(userTimeSeconds - time);
				if (this._onFinishedMotion != null) this._onFinishedMotion(this);
				break;
			case 0:
				motionQueueEntry.setStartTime(userTimeSeconds);
				if (this._isLoopFadeIn) motionQueueEntry.setFadeInStartTime(userTimeSeconds);
				break;
		}
	}
	/**
	* motion3.jsonをパースする。
	*
	* @param motionJson  motion3.jsonが読み込まれているバッファ
	* @param size        バッファのサイズ
	* @param shouldCheckMotionConsistency motion3.json整合性チェックするかどうか
	*/
	parse(motionJson, size, shouldCheckMotionConsistency = false) {
		let json = new CubismMotionJson(motionJson, size);
		if (!json) {
			json.release();
			json = void 0;
			return;
		}
		if (shouldCheckMotionConsistency) {
			if (!json.hasConsistency()) {
				json.release();
				CubismLogError("Inconsistent motion3.json.");
				return;
			}
		}
		this._motionData = new CubismMotionData();
		this._motionData.duration = json.getMotionDuration();
		this._motionData.loop = json.isMotionLoop();
		this._motionData.curveCount = json.getMotionCurveCount();
		this._motionData.fps = json.getMotionFps();
		this._motionData.eventCount = json.getEventCount();
		const areBeziersRestructed = json.getEvaluationOptionFlag(EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted);
		if (json.isExistMotionFadeInTime()) this._fadeInSeconds = json.getMotionFadeInTime() < 0 ? 1 : json.getMotionFadeInTime();
		else this._fadeInSeconds = 1;
		if (json.isExistMotionFadeOutTime()) this._fadeOutSeconds = json.getMotionFadeOutTime() < 0 ? 1 : json.getMotionFadeOutTime();
		else this._fadeOutSeconds = 1;
		updateSize(this._motionData.curves, this._motionData.curveCount, CubismMotionCurve, true);
		updateSize(this._motionData.segments, json.getMotionTotalSegmentCount(), CubismMotionSegment, true);
		updateSize(this._motionData.points, json.getMotionTotalPointCount(), CubismMotionPoint, true);
		updateSize(this._motionData.events, this._motionData.eventCount, CubismMotionEvent, true);
		let totalPointCount = 0;
		let totalSegmentCount = 0;
		for (let curveCount = 0; curveCount < this._motionData.curveCount; ++curveCount) {
			if (json.getMotionCurveTarget(curveCount) == TargetNameModel) this._motionData.curves[curveCount].type = CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
			else if (json.getMotionCurveTarget(curveCount) == TargetNameParameter) this._motionData.curves[curveCount].type = CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter;
			else if (json.getMotionCurveTarget(curveCount) == TargetNamePartOpacity) this._motionData.curves[curveCount].type = CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity;
			else CubismLogWarning("Warning : Unable to get segment type from Curve! The number of \"CurveCount\" may be incorrect!");
			this._motionData.curves[curveCount].id = json.getMotionCurveId(curveCount);
			this._motionData.curves[curveCount].baseSegmentIndex = totalSegmentCount;
			this._motionData.curves[curveCount].fadeInTime = json.isExistMotionCurveFadeInTime(curveCount) ? json.getMotionCurveFadeInTime(curveCount) : -1;
			this._motionData.curves[curveCount].fadeOutTime = json.isExistMotionCurveFadeOutTime(curveCount) ? json.getMotionCurveFadeOutTime(curveCount) : -1;
			for (let segmentPosition = 0; segmentPosition < json.getMotionCurveSegmentCount(curveCount);) {
				if (segmentPosition == 0) {
					this._motionData.segments[totalSegmentCount].basePointIndex = totalPointCount;
					this._motionData.points[totalPointCount].time = json.getMotionCurveSegment(curveCount, segmentPosition);
					this._motionData.points[totalPointCount].value = json.getMotionCurveSegment(curveCount, segmentPosition + 1);
					totalPointCount += 1;
					segmentPosition += 2;
				} else this._motionData.segments[totalSegmentCount].basePointIndex = totalPointCount - 1;
				switch (json.getMotionCurveSegment(curveCount, segmentPosition)) {
					case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
						this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Linear;
						this._motionData.segments[totalSegmentCount].evaluate = linearEvaluate;
						this._motionData.points[totalPointCount].time = json.getMotionCurveSegment(curveCount, segmentPosition + 1);
						this._motionData.points[totalPointCount].value = json.getMotionCurveSegment(curveCount, segmentPosition + 2);
						totalPointCount += 1;
						segmentPosition += 3;
						break;
					case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
						this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Bezier;
						if (areBeziersRestructed || UseOldBeziersCurveMotion) this._motionData.segments[totalSegmentCount].evaluate = bezierEvaluate;
						else this._motionData.segments[totalSegmentCount].evaluate = bezierEvaluateCardanoInterpretation;
						this._motionData.points[totalPointCount].time = json.getMotionCurveSegment(curveCount, segmentPosition + 1);
						this._motionData.points[totalPointCount].value = json.getMotionCurveSegment(curveCount, segmentPosition + 2);
						this._motionData.points[totalPointCount + 1].time = json.getMotionCurveSegment(curveCount, segmentPosition + 3);
						this._motionData.points[totalPointCount + 1].value = json.getMotionCurveSegment(curveCount, segmentPosition + 4);
						this._motionData.points[totalPointCount + 2].time = json.getMotionCurveSegment(curveCount, segmentPosition + 5);
						this._motionData.points[totalPointCount + 2].value = json.getMotionCurveSegment(curveCount, segmentPosition + 6);
						totalPointCount += 3;
						segmentPosition += 7;
						break;
					case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
						this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_Stepped;
						this._motionData.segments[totalSegmentCount].evaluate = steppedEvaluate;
						this._motionData.points[totalPointCount].time = json.getMotionCurveSegment(curveCount, segmentPosition + 1);
						this._motionData.points[totalPointCount].value = json.getMotionCurveSegment(curveCount, segmentPosition + 2);
						totalPointCount += 1;
						segmentPosition += 3;
						break;
					case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
						this._motionData.segments[totalSegmentCount].segmentType = CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped;
						this._motionData.segments[totalSegmentCount].evaluate = inverseSteppedEvaluate;
						this._motionData.points[totalPointCount].time = json.getMotionCurveSegment(curveCount, segmentPosition + 1);
						this._motionData.points[totalPointCount].value = json.getMotionCurveSegment(curveCount, segmentPosition + 2);
						totalPointCount += 1;
						segmentPosition += 3;
						break;
					default:
						CSM_ASSERT(0);
						break;
				}
				++this._motionData.curves[curveCount].segmentCount;
				++totalSegmentCount;
			}
		}
		for (let userdatacount = 0; userdatacount < json.getEventCount(); ++userdatacount) {
			this._motionData.events[userdatacount].fireTime = json.getEventTime(userdatacount);
			this._motionData.events[userdatacount].value = json.getEventValue(userdatacount);
		}
		json.release();
		json = void 0;
		json = null;
	}
	/**
	* モデルのパラメータ更新
	*
	* イベント発火のチェック。
	* 入力する時間は呼ばれるモーションタイミングを０とした秒数で行う。
	*
	* @param beforeCheckTimeSeconds   前回のイベントチェック時間[秒]
	* @param motionTimeSeconds        今回の再生時間[秒]
	*/
	getFiredEvent(beforeCheckTimeSeconds, motionTimeSeconds) {
		updateSize(this._firedEventValues, 0);
		for (let u = 0; u < this._motionData.eventCount; ++u) if (this._motionData.events[u].fireTime > beforeCheckTimeSeconds && this._motionData.events[u].fireTime <= motionTimeSeconds) this._firedEventValues.push(this._motionData.events[u].value);
		return this._firedEventValues;
	}
	/**
	* 透明度のカーブが存在するかどうかを確認する
	*
	* @return true  -> キーが存在する
	*          false -> キーが存在しない
	*/
	isExistModelOpacity() {
		for (let i = 0; i < this._motionData.curveCount; i++) {
			const curve = this._motionData.curves[i];
			if (curve.type != CubismMotionCurveTarget.CubismMotionCurveTarget_Model) continue;
			if (curve.id.getString().localeCompare(IdNameOpacity) == 0) return true;
		}
		return false;
	}
	/**
	* 透明度のカーブのインデックスを返す
	*
	* @return success:透明度のカーブのインデックス
	*/
	getModelOpacityIndex() {
		if (this.isExistModelOpacity()) for (let i = 0; i < this._motionData.curveCount; i++) {
			const curve = this._motionData.curves[i];
			if (curve.type != CubismMotionCurveTarget.CubismMotionCurveTarget_Model) continue;
			if (curve.id.getString().localeCompare(IdNameOpacity) == 0) return i;
		}
		return -1;
	}
	/**
	* 透明度のIdを返す
	*
	* @param index モーションカーブのインデックス
	* @return success:透明度のカーブのインデックス
	*/
	getModelOpacityId(index) {
		if (index != -1) {
			const curve = this._motionData.curves[index];
			if (curve.type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model) {
				if (curve.id.getString().localeCompare(IdNameOpacity) == 0) return CubismFramework.getIdManager().getId(curve.id.getString());
			}
		}
		return null;
	}
	/**
	* 現在時間の透明度の値を返す
	*
	* @return success:モーションの当該時間におけるOpacityの値
	*/
	getModelOpacityValue() {
		return this._modelOpacity;
	}
	/**
	* デバッグ用フラグを設定する
	*
	* @param debugMode デバッグモードの有効・無効
	*/
	setDebugMode(debugMode) {
		this._debugMode = debugMode;
	}
};
var Live2DCubismFramework$12;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMotion = CubismMotion;
})(Live2DCubismFramework$12 || (Live2DCubismFramework$12 = {}));
//#endregion
//#region src/cubism5/Cubism5MotionManager.ts
var Cubism5MotionManager = class extends MotionManager {
	constructor(settings, options) {
		var _settings$motions;
		super(settings, options);
		this.groups = { idle: "Idle" };
		this.motionDataType = "text";
		this.queueManager = new CubismMotionQueueManager();
		this.definitions = (_settings$motions = settings.motions) !== null && _settings$motions !== void 0 ? _settings$motions : {};
		this.eyeBlinkIds = settings.getEyeBlinkParameters() || [];
		this.lipSyncIds = settings.getLipSyncParameters() || [];
		this.init(options);
	}
	init(options) {
		super.init(options);
		if (this.settings.expressions) this.expressionManager = new Cubism5ExpressionManager(this.settings, options);
		this.queueManager.setEventCallback((caller, eventValue, customData) => {
			this.emit("motion:" + eventValue);
		});
	}
	isFinished() {
		return this.queueManager.isFinished();
	}
	_startMotion(motion, onFinish) {
		motion.setFinishedMotionHandler(onFinish);
		this.queueManager.stopAllMotions();
		return this.queueManager.startMotion(motion, false, performance.now());
	}
	_stopAllMotions() {
		this.queueManager.stopAllMotions();
	}
	createMotion(data, group, definition) {
		const { buffer: arrayBuffer, byteLength } = toCubismJsonBuffer(data);
		const motion = CubismMotion.create(arrayBuffer, byteLength);
		const json = new CubismMotionJson(arrayBuffer, byteLength);
		const defaultFadingDuration = (group === this.groups.idle ? config.idleMotionFadingDuration : config.motionFadingDuration) / 1e3;
		if (json.getMotionFadeInTime() === void 0) motion.setFadeInTime(definition.FadeInTime > 0 ? definition.FadeInTime : defaultFadingDuration);
		if (json.getMotionFadeOutTime() === void 0) motion.setFadeOutTime(definition.FadeOutTime > 0 ? definition.FadeOutTime : defaultFadingDuration);
		motion.setEffectIds([], []);
		return motion;
	}
	getMotionFile(definition) {
		return definition.File;
	}
	getMotionName(definition) {
		return definition.File;
	}
	getSoundFile(definition) {
		return definition.Sound;
	}
	updateParameters(model, now) {
		return this.queueManager.doUpdateMotion(model, now);
	}
	destroy() {
		super.destroy();
		this.queueManager.release();
		this.queueManager = void 0;
	}
};
//#endregion
//#region cubism/src/cubismdefaultparameterid.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* @brief パラメータIDのデフォルト値を保持する定数<br>
*         デフォルト値の仕様は以下のマニュアルに基づく<br>
*         https://docs.live2d.com/cubism-editor-manual/standard-parametor-list/
*/
var CubismDefaultParameterId = Object.freeze({
	HitAreaPrefix: "HitArea",
	HitAreaHead: "Head",
	HitAreaBody: "Body",
	PartsIdCore: "Parts01Core",
	PartsArmPrefix: "Parts01Arm_",
	PartsArmLPrefix: "Parts01ArmL_",
	PartsArmRPrefix: "Parts01ArmR_",
	ParamAngleX: "ParamAngleX",
	ParamAngleY: "ParamAngleY",
	ParamAngleZ: "ParamAngleZ",
	ParamEyeLOpen: "ParamEyeLOpen",
	ParamEyeLSmile: "ParamEyeLSmile",
	ParamEyeROpen: "ParamEyeROpen",
	ParamEyeRSmile: "ParamEyeRSmile",
	ParamEyeBallX: "ParamEyeBallX",
	ParamEyeBallY: "ParamEyeBallY",
	ParamEyeBallForm: "ParamEyeBallForm",
	ParamBrowLY: "ParamBrowLY",
	ParamBrowRY: "ParamBrowRY",
	ParamBrowLX: "ParamBrowLX",
	ParamBrowRX: "ParamBrowRX",
	ParamBrowLAngle: "ParamBrowLAngle",
	ParamBrowRAngle: "ParamBrowRAngle",
	ParamBrowLForm: "ParamBrowLForm",
	ParamBrowRForm: "ParamBrowRForm",
	ParamMouthForm: "ParamMouthForm",
	ParamMouthOpenY: "ParamMouthOpenY",
	ParamCheek: "ParamCheek",
	ParamBodyAngleX: "ParamBodyAngleX",
	ParamBodyAngleY: "ParamBodyAngleY",
	ParamBodyAngleZ: "ParamBodyAngleZ",
	ParamBreath: "ParamBreath",
	ParamArmLA: "ParamArmLA",
	ParamArmRA: "ParamArmRA",
	ParamArmLB: "ParamArmLB",
	ParamArmRB: "ParamArmRB",
	ParamHandL: "ParamHandL",
	ParamHandR: "ParamHandR",
	ParamHairFront: "ParamHairFront",
	ParamHairSide: "ParamHairSide",
	ParamHairBack: "ParamHairBack",
	ParamHairFluffy: "ParamHairFluffy",
	ParamShoulderY: "ParamShoulderY",
	ParamBustX: "ParamBustX",
	ParamBustY: "ParamBustY",
	ParamBaseX: "ParamBaseX",
	ParamBaseY: "ParamBaseY",
	ParamNONE: "NONE:"
});
var Live2DCubismFramework$11;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.HitAreaBody = CubismDefaultParameterId.HitAreaBody;
	_Live2DCubismFramework.HitAreaHead = CubismDefaultParameterId.HitAreaHead;
	_Live2DCubismFramework.HitAreaPrefix = CubismDefaultParameterId.HitAreaPrefix;
	_Live2DCubismFramework.ParamAngleX = CubismDefaultParameterId.ParamAngleX;
	_Live2DCubismFramework.ParamAngleY = CubismDefaultParameterId.ParamAngleY;
	_Live2DCubismFramework.ParamAngleZ = CubismDefaultParameterId.ParamAngleZ;
	_Live2DCubismFramework.ParamArmLA = CubismDefaultParameterId.ParamArmLA;
	_Live2DCubismFramework.ParamArmLB = CubismDefaultParameterId.ParamArmLB;
	_Live2DCubismFramework.ParamArmRA = CubismDefaultParameterId.ParamArmRA;
	_Live2DCubismFramework.ParamArmRB = CubismDefaultParameterId.ParamArmRB;
	_Live2DCubismFramework.ParamBaseX = CubismDefaultParameterId.ParamBaseX;
	_Live2DCubismFramework.ParamBaseY = CubismDefaultParameterId.ParamBaseY;
	_Live2DCubismFramework.ParamBodyAngleX = CubismDefaultParameterId.ParamBodyAngleX;
	_Live2DCubismFramework.ParamBodyAngleY = CubismDefaultParameterId.ParamBodyAngleY;
	_Live2DCubismFramework.ParamBodyAngleZ = CubismDefaultParameterId.ParamBodyAngleZ;
	_Live2DCubismFramework.ParamBreath = CubismDefaultParameterId.ParamBreath;
	_Live2DCubismFramework.ParamBrowLAngle = CubismDefaultParameterId.ParamBrowLAngle;
	_Live2DCubismFramework.ParamBrowLForm = CubismDefaultParameterId.ParamBrowLForm;
	_Live2DCubismFramework.ParamBrowLX = CubismDefaultParameterId.ParamBrowLX;
	_Live2DCubismFramework.ParamBrowLY = CubismDefaultParameterId.ParamBrowLY;
	_Live2DCubismFramework.ParamBrowRAngle = CubismDefaultParameterId.ParamBrowRAngle;
	_Live2DCubismFramework.ParamBrowRForm = CubismDefaultParameterId.ParamBrowRForm;
	_Live2DCubismFramework.ParamBrowRX = CubismDefaultParameterId.ParamBrowRX;
	_Live2DCubismFramework.ParamBrowRY = CubismDefaultParameterId.ParamBrowRY;
	_Live2DCubismFramework.ParamBustX = CubismDefaultParameterId.ParamBustX;
	_Live2DCubismFramework.ParamBustY = CubismDefaultParameterId.ParamBustY;
	_Live2DCubismFramework.ParamCheek = CubismDefaultParameterId.ParamCheek;
	_Live2DCubismFramework.ParamEyeBallForm = CubismDefaultParameterId.ParamEyeBallForm;
	_Live2DCubismFramework.ParamEyeBallX = CubismDefaultParameterId.ParamEyeBallX;
	_Live2DCubismFramework.ParamEyeBallY = CubismDefaultParameterId.ParamEyeBallY;
	_Live2DCubismFramework.ParamEyeLOpen = CubismDefaultParameterId.ParamEyeLOpen;
	_Live2DCubismFramework.ParamEyeLSmile = CubismDefaultParameterId.ParamEyeLSmile;
	_Live2DCubismFramework.ParamEyeROpen = CubismDefaultParameterId.ParamEyeROpen;
	_Live2DCubismFramework.ParamEyeRSmile = CubismDefaultParameterId.ParamEyeRSmile;
	_Live2DCubismFramework.ParamHairBack = CubismDefaultParameterId.ParamHairBack;
	_Live2DCubismFramework.ParamHairFluffy = CubismDefaultParameterId.ParamHairFluffy;
	_Live2DCubismFramework.ParamHairFront = CubismDefaultParameterId.ParamHairFront;
	_Live2DCubismFramework.ParamHairSide = CubismDefaultParameterId.ParamHairSide;
	_Live2DCubismFramework.ParamHandL = CubismDefaultParameterId.ParamHandL;
	_Live2DCubismFramework.ParamHandR = CubismDefaultParameterId.ParamHandR;
	_Live2DCubismFramework.ParamMouthForm = CubismDefaultParameterId.ParamMouthForm;
	_Live2DCubismFramework.ParamMouthOpenY = CubismDefaultParameterId.ParamMouthOpenY;
	_Live2DCubismFramework.ParamNONE = CubismDefaultParameterId.ParamNONE;
	_Live2DCubismFramework.ParamShoulderY = CubismDefaultParameterId.ParamShoulderY;
	_Live2DCubismFramework.PartsArmLPrefix = CubismDefaultParameterId.PartsArmLPrefix;
	_Live2DCubismFramework.PartsArmPrefix = CubismDefaultParameterId.PartsArmPrefix;
	_Live2DCubismFramework.PartsArmRPrefix = CubismDefaultParameterId.PartsArmRPrefix;
	_Live2DCubismFramework.PartsIdCore = CubismDefaultParameterId.PartsIdCore;
})(Live2DCubismFramework$11 || (Live2DCubismFramework$11 = {}));
//#endregion
//#region cubism/src/effect/cubismbreath.ts
/**
* 呼吸機能
*
* 呼吸機能を提供する。
*/
var CubismBreath = class CubismBreath {
	/**
	* インスタンスの作成
	*/
	static create() {
		return new CubismBreath();
	}
	/**
	* インスタンスの破棄
	* @param instance 対象のCubismBreath
	*/
	static delete(instance) {
		if (instance != null) instance = null;
	}
	/**
	* 呼吸のパラメータの紐づけ
	* @param breathParameters 呼吸を紐づけたいパラメータのリスト
	*/
	setParameters(breathParameters) {
		this._breathParameters = breathParameters;
	}
	/**
	* 呼吸に紐づいているパラメータの取得
	* @return 呼吸に紐づいているパラメータのリスト
	*/
	getParameters() {
		return this._breathParameters;
	}
	/**
	* モデルのパラメータの更新
	* @param model 対象のモデル
	* @param deltaTimeSeconds デルタ時間[秒]
	*/
	updateParameters(model, deltaTimeSeconds) {
		this._currentTime += deltaTimeSeconds;
		const t = this._currentTime * 2 * Math.PI;
		for (let i = 0; i < this._breathParameters.length; ++i) {
			const data = this._breathParameters[i];
			model.addParameterValueById(data.parameterId, data.offset + data.peak * Math.sin(t / data.cycle), data.weight);
		}
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		this._currentTime = 0;
	}
};
/**
* 呼吸のパラメータ情報
*/
var BreathParameterData = class {
	/**
	* コンストラクタ
	* @param parameterId   呼吸をひもづけるパラメータID
	* @param offset        呼吸を正弦波としたときの、波のオフセット
	* @param peak          呼吸を正弦波としたときの、波の高さ
	* @param cycle         呼吸を正弦波としたときの、波の周期
	* @param weight        パラメータへの重み
	*/
	constructor(parameterId, offset, peak, cycle, weight) {
		this.parameterId = parameterId == void 0 ? null : parameterId;
		this.offset = offset == void 0 ? 0 : offset;
		this.peak = peak == void 0 ? 0 : peak;
		this.cycle = cycle == void 0 ? 0 : cycle;
		this.weight = weight == void 0 ? 0 : weight;
	}
};
var Live2DCubismFramework$10;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.BreathParameterData = BreathParameterData;
	_Live2DCubismFramework.CubismBreath = CubismBreath;
})(Live2DCubismFramework$10 || (Live2DCubismFramework$10 = {}));
//#endregion
//#region cubism/src/effect/cubismeyeblink.ts
var _CubismEyeBlink;
/**
* 自動まばたき機能
*
* 自動まばたき機能を提供する。
*/
var CubismEyeBlink = class CubismEyeBlink {
	/**
	* インスタンスを作成する
	* @param modelSetting モデルの設定情報
	* @return 作成されたインスタンス
	* @note 引数がNULLの場合、パラメータIDが設定されていない空のインスタンスを作成する。
	*/
	static create(modelSetting = null) {
		return new CubismEyeBlink(modelSetting);
	}
	/**
	* インスタンスの破棄
	* @param eyeBlink 対象のCubismEyeBlink
	*/
	static delete(eyeBlink) {
		if (eyeBlink != null) eyeBlink = null;
	}
	/**
	* まばたきの間隔の設定
	* @param blinkingInterval まばたきの間隔の時間[秒]
	*/
	setBlinkingInterval(blinkingInterval) {
		this._blinkingIntervalSeconds = blinkingInterval;
	}
	/**
	* まばたきのモーションの詳細設定
	* @param closing   まぶたを閉じる動作の所要時間[秒]
	* @param closed    まぶたを閉じている動作の所要時間[秒]
	* @param opening   まぶたを開く動作の所要時間[秒]
	*/
	setBlinkingSetting(closing, closed, opening) {
		this._closingSeconds = closing;
		this._closedSeconds = closed;
		this._openingSeconds = opening;
	}
	/**
	* まばたきさせるパラメータIDのリストの設定
	* @param parameterIds パラメータのIDのリスト
	*/
	setParameterIds(parameterIds) {
		this._parameterIds = parameterIds;
	}
	/**
	* まばたきさせるパラメータIDのリストの取得
	* @return パラメータIDのリスト
	*/
	getParameterIds() {
		return this._parameterIds;
	}
	/**
	* モデルのパラメータの更新
	* @param model 対象のモデル
	* @param deltaTimeSeconds デルタ時間[秒]
	*/
	updateParameters(model, deltaTimeSeconds) {
		this._userTimeSeconds += deltaTimeSeconds;
		let parameterValue;
		let t = 0;
		switch (this._blinkingState) {
			case 2:
				t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._closingSeconds;
				if (t >= 1) {
					t = 1;
					this._blinkingState = 3;
					this._stateStartTimeSeconds = this._userTimeSeconds;
				}
				parameterValue = 1 - t;
				break;
			case 3:
				t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._closedSeconds;
				if (t >= 1) {
					this._blinkingState = 4;
					this._stateStartTimeSeconds = this._userTimeSeconds;
				}
				parameterValue = 0;
				break;
			case 4:
				t = (this._userTimeSeconds - this._stateStartTimeSeconds) / this._openingSeconds;
				if (t >= 1) {
					t = 1;
					this._blinkingState = 1;
					this._nextBlinkingTime = this.determinNextBlinkingTiming();
				}
				parameterValue = t;
				break;
			case 1:
				if (this._nextBlinkingTime < this._userTimeSeconds) {
					this._blinkingState = 2;
					this._stateStartTimeSeconds = this._userTimeSeconds;
				}
				parameterValue = 1;
				break;
			default:
				this._blinkingState = 1;
				this._nextBlinkingTime = this.determinNextBlinkingTiming();
				parameterValue = 1;
				break;
		}
		if (!CubismEyeBlink.CloseIfZero) parameterValue = -parameterValue;
		for (let i = 0; i < this._parameterIds.length; ++i) model.setParameterValueById(this._parameterIds[i], parameterValue);
	}
	/**
	* コンストラクタ
	* @param modelSetting モデルの設定情報
	*/
	constructor(modelSetting) {
		this._blinkingState = 0;
		this._nextBlinkingTime = 0;
		this._stateStartTimeSeconds = 0;
		this._blinkingIntervalSeconds = 4;
		this._closingSeconds = .1;
		this._closedSeconds = .05;
		this._openingSeconds = .15;
		this._userTimeSeconds = 0;
		this._parameterIds = new Array();
		if (modelSetting == null) return;
		this._parameterIds.length = modelSetting.getEyeBlinkParameterCount();
		for (let i = 0; i < modelSetting.getEyeBlinkParameterCount(); ++i) this._parameterIds[i] = modelSetting.getEyeBlinkParameterId(i);
	}
	/**
	* 次の瞬きのタイミングの決定
	*
	* @return 次のまばたきを行う時刻[秒]
	*/
	determinNextBlinkingTiming() {
		const r = Math.random();
		return this._userTimeSeconds + r * (2 * this._blinkingIntervalSeconds - 1);
	}
};
_CubismEyeBlink = CubismEyeBlink;
_CubismEyeBlink.CloseIfZero = true;
/**
* まばたきの状態
*
* まばたきの状態を表す列挙型
*/
var EyeState = /* @__PURE__ */ function(EyeState) {
	EyeState[EyeState["EyeState_First"] = 0] = "EyeState_First";
	EyeState[EyeState["EyeState_Interval"] = 1] = "EyeState_Interval";
	EyeState[EyeState["EyeState_Closing"] = 2] = "EyeState_Closing";
	EyeState[EyeState["EyeState_Closed"] = 3] = "EyeState_Closed";
	EyeState[EyeState["EyeState_Opening"] = 4] = "EyeState_Opening";
	return EyeState;
}({});
var Live2DCubismFramework$9;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismEyeBlink = CubismEyeBlink;
	_Live2DCubismFramework.EyeState = EyeState;
})(Live2DCubismFramework$9 || (Live2DCubismFramework$9 = {}));
//#endregion
//#region cubism/src/model/cubismmodelmultiplyandscreencolor.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* SDK側から与えられた描画オブジェクトの乗算色・スクリーン色上書きフラグと
* その色を保持する構造体
*/
var ColorData = class {
	constructor(isOverridden = false, color = new CubismTextureColor()) {
		this.isOverridden = isOverridden;
		this.color = color;
	}
};
/**
* Handling multiply and screen colors of the model.
*/
var CubismModelMultiplyAndScreenColor = class {
	/**
	* Constructor.
	*
	* @param model cubism model.
	*/
	constructor(model) {
		this._model = model;
		this._isOverriddenModelMultiplyColors = false;
		this._isOverriddenModelScreenColors = false;
		this._userPartScreenColors = [];
		this._userPartMultiplyColors = [];
		this._userDrawableScreenColors = [];
		this._userDrawableMultiplyColors = [];
		this._userOffscreenScreenColors = [];
		this._userOffscreenMultiplyColors = [];
	}
	/**
	* Initialization for using multiply and screen colors.
	*
	* @param partCount number of parts.
	* @param drawableCount number of drawables.
	* @param offscreenCount number of offscreen.
	*/
	initialize(partCount, drawableCount, offscreenCount) {
		const userMultiplyColor = new ColorData(false, new CubismTextureColor(1, 1, 1, 1));
		const userScreenColor = new ColorData(false, new CubismTextureColor(0, 0, 0, 1));
		this._userPartMultiplyColors = new Array(partCount);
		this._userPartScreenColors = new Array(partCount);
		for (let i = 0; i < partCount; i++) {
			this._userPartMultiplyColors[i] = new ColorData(userMultiplyColor.isOverridden, new CubismTextureColor(userMultiplyColor.color.r, userMultiplyColor.color.g, userMultiplyColor.color.b, userMultiplyColor.color.a));
			this._userPartScreenColors[i] = new ColorData(userScreenColor.isOverridden, new CubismTextureColor(userScreenColor.color.r, userScreenColor.color.g, userScreenColor.color.b, userScreenColor.color.a));
		}
		this._userDrawableMultiplyColors = new Array(drawableCount);
		this._userDrawableScreenColors = new Array(drawableCount);
		for (let i = 0; i < drawableCount; i++) {
			this._userDrawableMultiplyColors[i] = new ColorData(userMultiplyColor.isOverridden, new CubismTextureColor(userMultiplyColor.color.r, userMultiplyColor.color.g, userMultiplyColor.color.b, userMultiplyColor.color.a));
			this._userDrawableScreenColors[i] = new ColorData(userScreenColor.isOverridden, new CubismTextureColor(userScreenColor.color.r, userScreenColor.color.g, userScreenColor.color.b, userScreenColor.color.a));
		}
		this._userOffscreenMultiplyColors = new Array(offscreenCount);
		this._userOffscreenScreenColors = new Array(offscreenCount);
		for (let i = 0; i < offscreenCount; i++) {
			this._userOffscreenMultiplyColors[i] = new ColorData(userMultiplyColor.isOverridden, new CubismTextureColor(userMultiplyColor.color.r, userMultiplyColor.color.g, userMultiplyColor.color.b, userMultiplyColor.color.a));
			this._userOffscreenScreenColors[i] = new ColorData(userScreenColor.isOverridden, new CubismTextureColor(userScreenColor.color.r, userScreenColor.color.g, userScreenColor.color.b, userScreenColor.color.a));
		}
	}
	/**
	* Outputs a warning message for index out of range errors.
	*
	* @param functionName Name of the calling function
	* @param index The invalid index value
	* @param maxIndex The maximum valid index (length - 1)
	*/
	warnIndexOutOfRange(functionName, index, maxIndex) {
		CubismLogWarning(`${functionName}: index is out of range. index=${index}, valid range=[0, ${maxIndex}].`);
	}
	/**
	* Validates if the given part index is within valid range.
	*
	* @param index Part index to validate
	* @param functionName Name of the calling function for error reporting
	* @return true if the index is valid; otherwise false
	*/
	isValidPartIndex(index, functionName) {
		if (index < 0 || index >= this._model.getPartCount()) {
			this.warnIndexOutOfRange(functionName, index, this._model.getPartCount() - 1);
			return false;
		}
		return true;
	}
	/**
	* Validates if the given drawable index is within valid range.
	*
	* @param index Drawable index to validate
	* @param functionName Name of the calling function for error reporting
	* @return true if the index is valid; otherwise false
	*/
	isValidDrawableIndex(index, functionName) {
		if (index < 0 || index >= this._model.getDrawableCount()) {
			this.warnIndexOutOfRange(functionName, index, this._model.getDrawableCount() - 1);
			return false;
		}
		return true;
	}
	/**
	* Validates if the given offscreen index is within valid range.
	*
	* @param index Offscreen index to validate
	* @param functionName Name of the calling function for error reporting
	* @return true if the index is valid; otherwise false
	*/
	isValidOffscreenIndex(index, functionName) {
		if (index < 0 || index >= this._model.getOffscreenCount()) {
			this.warnIndexOutOfRange(functionName, index, this._model.getOffscreenCount() - 1);
			return false;
		}
		return true;
	}
	/**
	* Sets the flag indicating whether the color set at runtime is used as the multiply color for the entire model during rendering.
	*
	* @param value true if the color set at runtime is to be used; otherwise false.
	*/
	setMultiplyColorEnabled(value) {
		this._isOverriddenModelMultiplyColors = value;
	}
	/**
	* Returns the flag indicating whether the color set at runtime is used as the multiply color for the entire model during rendering.
	*
	* @return true if the color set at runtime is used; otherwise false.
	*/
	getMultiplyColorEnabled() {
		return this._isOverriddenModelMultiplyColors;
	}
	/**
	* Sets the flag indicating whether the color set at runtime is used as the screen color for the entire model during rendering.
	*
	* @param value true if the color set at runtime is to be used; otherwise false.
	*/
	setScreenColorEnabled(value) {
		this._isOverriddenModelScreenColors = value;
	}
	/**
	* Returns the flag indicating whether the color set at runtime is used as the screen color for the entire model during rendering.
	*
	* @return true if the color set at runtime is used; otherwise false.
	*/
	getScreenColorEnabled() {
		return this._isOverriddenModelScreenColors;
	}
	/**
	* Sets whether the part multiply color is overridden by the SDK.
	* Use true to use the color information from the SDK, or false to use the color information from the model.
	*
	* @param partIndex Part index
	* @param value true enable override, false to disable
	*/
	setPartMultiplyColorEnabled(partIndex, value) {
		if (!this.isValidPartIndex(partIndex, "setPartMultiplyColorEnabled")) return;
		this.setPartColorEnabled(partIndex, value, this._userPartMultiplyColors, this._userDrawableMultiplyColors, this._userOffscreenMultiplyColors);
	}
	/**
	* Checks whether the part multiply color is overridden by the SDK.
	*
	* @param partIndex Part index
	*
	* @return true if the color information from the SDK is used; otherwise false.
	*/
	getPartMultiplyColorEnabled(partIndex) {
		if (!this.isValidPartIndex(partIndex, "getPartMultiplyColorEnabled")) return false;
		return this._userPartMultiplyColors[partIndex].isOverridden;
	}
	/**
	* Sets whether the part screen color is overridden by the SDK.
	* Use true to use the color information from the SDK, or false to use the color information from the model.
	*
	* @param partIndex Part index
	* @param value true enable override, false to disable
	*/
	setPartScreenColorEnabled(partIndex, value) {
		if (!this.isValidPartIndex(partIndex, "setPartScreenColorEnabled")) return;
		this.setPartColorEnabled(partIndex, value, this._userPartScreenColors, this._userDrawableScreenColors, this._userOffscreenScreenColors);
	}
	/**
	* Checks whether the part screen color is overridden by the SDK.
	*
	* @param partIndex Part index
	*
	* @return true if the color information from the SDK is used; otherwise false.
	*/
	getPartScreenColorEnabled(partIndex) {
		if (!this.isValidPartIndex(partIndex, "getPartScreenColorEnabled")) return false;
		return this._userPartScreenColors[partIndex].isOverridden;
	}
	/**
	* Sets the multiply color of the part.
	*
	* @param partIndex Part index
	* @param color Multiply color to be set (CubismTextureColor)
	*/
	setPartMultiplyColorByTextureColor(partIndex, color) {
		if (!this.isValidPartIndex(partIndex, "setPartMultiplyColorByTextureColor")) return;
		this.setPartMultiplyColorByRGBA(partIndex, color.r, color.g, color.b, color.a);
	}
	/**
	* Sets the multiply color of the part.
	*
	* @param partIndex Part index
	* @param r Red value of the multiply color to be set
	* @param g Green value of the multiply color to be set
	* @param b Blue value of the multiply color to be set
	* @param a Alpha value of the multiply color to be set
	*/
	setPartMultiplyColorByRGBA(partIndex, r, g, b, a = 1) {
		if (!this.isValidPartIndex(partIndex, "setPartMultiplyColorByRGBA")) return;
		this.setPartColor(partIndex, r, g, b, a, this._userPartMultiplyColors, this._userDrawableMultiplyColors, this._userOffscreenMultiplyColors);
	}
	/**
	* Returns the multiply color of the part.
	*
	* @param partIndex Part index
	*
	* @return Multiply color (CubismTextureColor)
	*/
	getPartMultiplyColor(partIndex) {
		if (!this.isValidPartIndex(partIndex, "getPartMultiplyColor")) return new CubismTextureColor(1, 1, 1, 1);
		return this._userPartMultiplyColors[partIndex].color;
	}
	/**
	* Sets the screen color of the part.
	*
	* @param partIndex Part index
	* @param color Screen color to be set (CubismTextureColor)
	*/
	setPartScreenColorByTextureColor(partIndex, color) {
		if (!this.isValidPartIndex(partIndex, "setPartScreenColorByTextureColor")) return;
		this.setPartScreenColorByRGBA(partIndex, color.r, color.g, color.b, color.a);
	}
	/**
	* Sets the screen color of the part.
	*
	* @param partIndex Part index
	* @param r Red value of the screen color to be set
	* @param g Green value of the screen color to be set
	* @param b Blue value of the screen color to be set
	* @param a Alpha value of the screen color to be set
	*/
	setPartScreenColorByRGBA(partIndex, r, g, b, a = 1) {
		if (!this.isValidPartIndex(partIndex, "setPartScreenColorByRGBA")) return;
		this.setPartColor(partIndex, r, g, b, a, this._userPartScreenColors, this._userDrawableScreenColors, this._userOffscreenScreenColors);
	}
	/**
	* Returns the screen color of the part.
	*
	* @param partIndex Part index
	*
	* @return Screen color (CubismTextureColor)
	*/
	getPartScreenColor(partIndex) {
		if (!this.isValidPartIndex(partIndex, "getPartScreenColor")) return new CubismTextureColor(0, 0, 0, 1);
		return this._userPartScreenColors[partIndex].color;
	}
	/**
	* Sets the flag indicating whether the color set at runtime is used as the multiply color for the drawable during rendering.
	*
	* @param drawableIndex Drawable index
	* @param value true if the color set at runtime is to be used; otherwise false.
	*/
	setDrawableMultiplyColorEnabled(drawableIndex, value) {
		if (!this.isValidDrawableIndex(drawableIndex, "setDrawableMultiplyColorEnabled")) return;
		this._userDrawableMultiplyColors[drawableIndex].isOverridden = value;
	}
	/**
	* Returns the flag indicating whether the color set at runtime is used as the multiply color for the drawable during rendering.
	*
	* @param drawableIndex Drawable index
	*
	* @return true if the color set at runtime is used; otherwise false.
	*/
	getDrawableMultiplyColorEnabled(drawableIndex) {
		if (!this.isValidDrawableIndex(drawableIndex, "getDrawableMultiplyColorEnabled")) return false;
		return this._userDrawableMultiplyColors[drawableIndex].isOverridden;
	}
	/**
	* Sets the flag indicating whether the color set at runtime is used as the screen color for the drawable during rendering.
	*
	* @param drawableIndex Drawable index
	* @param value true if the color set at runtime is to be used; otherwise false.
	*/
	setDrawableScreenColorEnabled(drawableIndex, value) {
		if (!this.isValidDrawableIndex(drawableIndex, "setDrawableScreenColorEnabled")) return;
		this._userDrawableScreenColors[drawableIndex].isOverridden = value;
	}
	/**
	* Returns the flag indicating whether the color set at runtime is used as the screen color for the drawable during rendering.
	*
	* @param drawableIndex Drawable index
	*
	* @return true if the color set at runtime is used; otherwise false.
	*/
	getDrawableScreenColorEnabled(drawableIndex) {
		if (!this.isValidDrawableIndex(drawableIndex, "getDrawableScreenColorEnabled")) return false;
		return this._userDrawableScreenColors[drawableIndex].isOverridden;
	}
	/**
	* Sets the multiply color of the drawable.
	*
	* @param drawableIndex Drawable index
	* @param color Multiply color to be set (CubismTextureColor)
	*/
	setDrawableMultiplyColorByTextureColor(drawableIndex, color) {
		if (!this.isValidDrawableIndex(drawableIndex, "setDrawableMultiplyColorByTextureColor")) return;
		this.setDrawableMultiplyColorByRGBA(drawableIndex, color.r, color.g, color.b, color.a);
	}
	/**
	* Sets the multiply color of the drawable.
	*
	* @param drawableIndex Drawable index
	* @param r Red value of the multiply color to be set
	* @param g Green value of the multiply color to be set
	* @param b Blue value of the multiply color to be set
	* @param a Alpha value of the multiply color to be set
	*/
	setDrawableMultiplyColorByRGBA(drawableIndex, r, g, b, a = 1) {
		if (!this.isValidDrawableIndex(drawableIndex, "setDrawableMultiplyColorByRGBA")) return;
		this._userDrawableMultiplyColors[drawableIndex].color.r = r;
		this._userDrawableMultiplyColors[drawableIndex].color.g = g;
		this._userDrawableMultiplyColors[drawableIndex].color.b = b;
		this._userDrawableMultiplyColors[drawableIndex].color.a = a;
	}
	/**
	* Returns the multiply color from the list of drawables.
	*
	* @param drawableIndex Drawable index
	*
	* @return Multiply color (CubismTextureColor)
	*/
	getDrawableMultiplyColor(drawableIndex) {
		if (!this.isValidDrawableIndex(drawableIndex, "getDrawableMultiplyColor")) return new CubismTextureColor(1, 1, 1, 1);
		if (this.getMultiplyColorEnabled() || this.getDrawableMultiplyColorEnabled(drawableIndex)) return this._userDrawableMultiplyColors[drawableIndex].color;
		return this._model.getDrawableMultiplyColor(drawableIndex);
	}
	/**
	* Sets the screen color of the drawable.
	*
	* @param drawableIndex Drawable index
	* @param color Screen color to be set (CubismTextureColor)
	*/
	setDrawableScreenColorByTextureColor(drawableIndex, color) {
		if (!this.isValidDrawableIndex(drawableIndex, "setDrawableScreenColorByTextureColor")) return;
		this.setDrawableScreenColorByRGBA(drawableIndex, color.r, color.g, color.b, color.a);
	}
	/**
	* Sets the screen color of the drawable.
	*
	* @param drawableIndex Drawable index
	* @param r Red value of the screen color to be set
	* @param g Green value of the screen color to be set
	* @param b Blue value of the screen color to be set
	* @param a Alpha value of the screen color to be set
	*/
	setDrawableScreenColorByRGBA(drawableIndex, r, g, b, a = 1) {
		if (!this.isValidDrawableIndex(drawableIndex, "setDrawableScreenColorByRGBA")) return;
		this._userDrawableScreenColors[drawableIndex].color.r = r;
		this._userDrawableScreenColors[drawableIndex].color.g = g;
		this._userDrawableScreenColors[drawableIndex].color.b = b;
		this._userDrawableScreenColors[drawableIndex].color.a = a;
	}
	/**
	* Returns the screen color from the list of drawables.
	*
	* @param drawableIndex Drawable index
	*
	* @return Screen color (CubismTextureColor)
	*/
	getDrawableScreenColor(drawableIndex) {
		if (!this.isValidDrawableIndex(drawableIndex, "getDrawableScreenColor")) return new CubismTextureColor(0, 0, 0, 1);
		if (this.getScreenColorEnabled() || this.getDrawableScreenColorEnabled(drawableIndex)) return this._userDrawableScreenColors[drawableIndex].color;
		return this._model.getDrawableScreenColor(drawableIndex);
	}
	/**
	* Sets whether the offscreen multiply color is overridden by the SDK.
	* Use true to use the color information from the SDK, or false to use the color information from the model.
	*
	* @param offscreenIndex Offscreen index
	* @param value true enable override, false to disable
	*/
	setOffscreenMultiplyColorEnabled(offscreenIndex, value) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "setOffscreenMultiplyColorEnabled")) return;
		this._userOffscreenMultiplyColors[offscreenIndex].isOverridden = value;
	}
	/**
	* Checks whether the offscreen multiply color is overridden by the SDK.
	*
	* @param offscreenIndex Offscreen index
	*
	* @return true if the color information from the SDK is used; otherwise false.
	*/
	getOffscreenMultiplyColorEnabled(offscreenIndex) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "getOffscreenMultiplyColorEnabled")) return false;
		return this._userOffscreenMultiplyColors[offscreenIndex].isOverridden;
	}
	/**
	* Sets whether the offscreen screen color is overridden by the SDK.
	* Use true to use the color information from the SDK, or false to use the color information from the model.
	*
	* @param offscreenIndex Offscreen index
	* @param value true enable override, false to disable
	*/
	setOffscreenScreenColorEnabled(offscreenIndex, value) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "setOffscreenScreenColorEnabled")) return;
		this._userOffscreenScreenColors[offscreenIndex].isOverridden = value;
	}
	/**
	* Checks whether the offscreen screen color is overridden by the SDK.
	*
	* @param offscreenIndex Offscreen index
	*
	* @return true if the color information from the SDK is used; otherwise false.
	*/
	getOffscreenScreenColorEnabled(offscreenIndex) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "getOffscreenScreenColorEnabled")) return false;
		return this._userOffscreenScreenColors[offscreenIndex].isOverridden;
	}
	/**
	* Sets the multiply color of the offscreen.
	*
	* @param offscreenIndex Offsscreen index
	* @param color Multiply color to be set (CubismTextureColor)
	*/
	setOffscreenMultiplyColorByTextureColor(offscreenIndex, color) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "setOffscreenMultiplyColorByTextureColor")) return;
		this.setOffscreenMultiplyColorByRGBA(offscreenIndex, color.r, color.g, color.b, color.a);
	}
	/**
	* Sets the multiply color of the offscreen.
	*
	* @param offscreenIndex Offsscreen index
	* @param r Red value of the multiply color to be set
	* @param g Green value of the multiply color to be set
	* @param b Blue value of the multiply color to be set
	* @param a Alpha value of the multiply color to be set
	*/
	setOffscreenMultiplyColorByRGBA(offscreenIndex, r, g, b, a = 1) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "setOffscreenMultiplyColorByRGBA")) return;
		this._userOffscreenMultiplyColors[offscreenIndex].color.r = r;
		this._userOffscreenMultiplyColors[offscreenIndex].color.g = g;
		this._userOffscreenMultiplyColors[offscreenIndex].color.b = b;
		this._userOffscreenMultiplyColors[offscreenIndex].color.a = a;
	}
	/**
	* Returns the multiply color from the list of offscreen.
	*
	* @param offscreenIndex Offsscreen index
	*
	* @return Multiply color (CubismTextureColor)
	*/
	getOffscreenMultiplyColor(offscreenIndex) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "getOffscreenMultiplyColor")) return new CubismTextureColor(1, 1, 1, 1);
		if (this.getMultiplyColorEnabled() || this.getOffscreenMultiplyColorEnabled(offscreenIndex)) return this._userOffscreenMultiplyColors[offscreenIndex].color;
		return this._model.getOffscreenMultiplyColor(offscreenIndex);
	}
	/**
	* Sets the screen color of the offscreen.
	*
	* @param offscreenIndex Offsscreen index
	* @param color Screen color to be set (CubismTextureColor)
	*/
	setOffscreenScreenColorByTextureColor(offscreenIndex, color) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "setOffscreenScreenColorByTextureColor")) return;
		this.setOffscreenScreenColorByRGBA(offscreenIndex, color.r, color.g, color.b, color.a);
	}
	/**
	* Sets the screen color of the offscreen.
	*
	* @param offscreenIndex Offsscreen index
	* @param r Red value of the screen color to be set
	* @param g Green value of the screen color to be set
	* @param b Blue value of the screen color to be set
	* @param a Alpha value of the screen color to be set
	*/
	setOffscreenScreenColorByRGBA(offscreenIndex, r, g, b, a = 1) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "setOffscreenScreenColorByRGBA")) return;
		this._userOffscreenScreenColors[offscreenIndex].color.r = r;
		this._userOffscreenScreenColors[offscreenIndex].color.g = g;
		this._userOffscreenScreenColors[offscreenIndex].color.b = b;
		this._userOffscreenScreenColors[offscreenIndex].color.a = a;
	}
	/**
	* Returns the screen color from the list of offscreen.
	*
	* @param offscreenIndex Offsscreen index
	*
	* @return Screen color (CubismTextureColor)
	*/
	getOffscreenScreenColor(offscreenIndex) {
		if (!this.isValidOffscreenIndex(offscreenIndex, "getOffscreenScreenColor")) return new CubismTextureColor(0, 0, 0, 1);
		if (this.getScreenColorEnabled() || this.getOffscreenScreenColorEnabled(offscreenIndex)) return this._userOffscreenScreenColors[offscreenIndex].color;
		return this._model.getOffscreenScreenColor(offscreenIndex);
	}
	/**
	* Sets the part color with hierarchical propagation (internal method)
	*/
	setPartColor(partIndex, r, g, b, a, partColors, drawableColors, offscreenColors) {
		partColors[partIndex].color.r = r;
		partColors[partIndex].color.g = g;
		partColors[partIndex].color.b = b;
		partColors[partIndex].color.a = a;
		if (partColors[partIndex].isOverridden) {
			const offscreenIndex = this._model.getPartOffscreenIndices()[partIndex];
			if (offscreenIndex == -1) {
				const partsHierarchy = this._model.getPartsHierarchy();
				if (partsHierarchy && partsHierarchy[partIndex]) for (let i = 0; i < partsHierarchy[partIndex].objects.length; ++i) {
					const objectInfo = partsHierarchy[partIndex].objects[i];
					if (objectInfo.objectType === CubismModelObjectType.CubismModelObjectType_Drawable) {
						const drawableIndex = objectInfo.objectIndex;
						drawableColors[drawableIndex].color.r = r;
						drawableColors[drawableIndex].color.g = g;
						drawableColors[drawableIndex].color.b = b;
						drawableColors[drawableIndex].color.a = a;
					} else {
						const childPartIndex = objectInfo.objectIndex;
						this.setPartColor(childPartIndex, r, g, b, a, partColors, drawableColors, offscreenColors);
					}
				}
			} else {
				offscreenColors[offscreenIndex].color.r = r;
				offscreenColors[offscreenIndex].color.g = g;
				offscreenColors[offscreenIndex].color.b = b;
				offscreenColors[offscreenIndex].color.a = a;
			}
		}
	}
	/**
	* Sets the part color enabled flag with hierarchical propagation (internal method)
	*/
	setPartColorEnabled(partIndex, value, partColors, drawableColors, offscreenColors) {
		partColors[partIndex].isOverridden = value;
		const offscreenIndex = this._model.getPartOffscreenIndices()[partIndex];
		if (offscreenIndex == -1) {
			const partsHierarchy = this._model.getPartsHierarchy();
			if (partsHierarchy && partsHierarchy[partIndex]) for (let i = 0; i < partsHierarchy[partIndex].objects.length; ++i) {
				const objectInfo = partsHierarchy[partIndex].objects[i];
				if (objectInfo.objectType === CubismModelObjectType.CubismModelObjectType_Drawable) {
					const drawableIndex = objectInfo.objectIndex;
					drawableColors[drawableIndex].isOverridden = value;
					if (value) {
						drawableColors[drawableIndex].color.r = partColors[partIndex].color.r;
						drawableColors[drawableIndex].color.g = partColors[partIndex].color.g;
						drawableColors[drawableIndex].color.b = partColors[partIndex].color.b;
						drawableColors[drawableIndex].color.a = partColors[partIndex].color.a;
					}
				} else {
					const childPartIndex = objectInfo.objectIndex;
					if (value) {
						partColors[childPartIndex].color.r = partColors[partIndex].color.r;
						partColors[childPartIndex].color.g = partColors[partIndex].color.g;
						partColors[childPartIndex].color.b = partColors[partIndex].color.b;
						partColors[childPartIndex].color.a = partColors[partIndex].color.a;
					}
					this.setPartColorEnabled(childPartIndex, value, partColors, drawableColors, offscreenColors);
				}
			}
		} else {
			offscreenColors[offscreenIndex].isOverridden = value;
			if (value) {
				offscreenColors[offscreenIndex].color.r = partColors[partIndex].color.r;
				offscreenColors[offscreenIndex].color.g = partColors[partIndex].color.g;
				offscreenColors[offscreenIndex].color.b = partColors[partIndex].color.b;
				offscreenColors[offscreenIndex].color.a = partColors[partIndex].color.a;
			}
		}
	}
};
/**
* カラーブレンドのタイプ
*/
var CubismColorBlend = /* @__PURE__ */ function(CubismColorBlend) {
	CubismColorBlend[CubismColorBlend["ColorBlend_None"] = -1] = "ColorBlend_None";
	CubismColorBlend[CubismColorBlend["ColorBlend_Normal"] = Live2DCubismCore.ColorBlendType_Normal] = "ColorBlend_Normal";
	CubismColorBlend[CubismColorBlend["ColorBlend_AddGlow"] = Live2DCubismCore.ColorBlendType_AddGlow] = "ColorBlend_AddGlow";
	CubismColorBlend[CubismColorBlend["ColorBlend_Add"] = Live2DCubismCore.ColorBlendType_Add] = "ColorBlend_Add";
	CubismColorBlend[CubismColorBlend["ColorBlend_Darken"] = Live2DCubismCore.ColorBlendType_Darken] = "ColorBlend_Darken";
	CubismColorBlend[CubismColorBlend["ColorBlend_Multiply"] = Live2DCubismCore.ColorBlendType_Multiply] = "ColorBlend_Multiply";
	CubismColorBlend[CubismColorBlend["ColorBlend_ColorBurn"] = Live2DCubismCore.ColorBlendType_ColorBurn] = "ColorBlend_ColorBurn";
	CubismColorBlend[CubismColorBlend["ColorBlend_LinearBurn"] = Live2DCubismCore.ColorBlendType_LinearBurn] = "ColorBlend_LinearBurn";
	CubismColorBlend[CubismColorBlend["ColorBlend_Lighten"] = Live2DCubismCore.ColorBlendType_Lighten] = "ColorBlend_Lighten";
	CubismColorBlend[CubismColorBlend["ColorBlend_Screen"] = Live2DCubismCore.ColorBlendType_Screen] = "ColorBlend_Screen";
	CubismColorBlend[CubismColorBlend["ColorBlend_ColorDodge"] = Live2DCubismCore.ColorBlendType_ColorDodge] = "ColorBlend_ColorDodge";
	CubismColorBlend[CubismColorBlend["ColorBlend_Overlay"] = Live2DCubismCore.ColorBlendType_Overlay] = "ColorBlend_Overlay";
	CubismColorBlend[CubismColorBlend["ColorBlend_SoftLight"] = Live2DCubismCore.ColorBlendType_SoftLight] = "ColorBlend_SoftLight";
	CubismColorBlend[CubismColorBlend["ColorBlend_HardLight"] = Live2DCubismCore.ColorBlendType_HardLight] = "ColorBlend_HardLight";
	CubismColorBlend[CubismColorBlend["ColorBlend_LinearLight"] = Live2DCubismCore.ColorBlendType_LinearLight] = "ColorBlend_LinearLight";
	CubismColorBlend[CubismColorBlend["ColorBlend_Hue"] = Live2DCubismCore.ColorBlendType_Hue] = "ColorBlend_Hue";
	CubismColorBlend[CubismColorBlend["ColorBlend_Color"] = Live2DCubismCore.ColorBlendType_Color] = "ColorBlend_Color";
	CubismColorBlend[CubismColorBlend["ColorBlend_AddCompatible"] = Live2DCubismCore.ColorBlendType_AddCompatible] = "ColorBlend_AddCompatible";
	CubismColorBlend[CubismColorBlend["ColorBlend_MultiplyCompatible"] = Live2DCubismCore.ColorBlendType_MultiplyCompatible] = "ColorBlend_MultiplyCompatible";
	return CubismColorBlend;
}({});
/**
* アルファブレンドのタイプ
*/
var CubismAlphaBlend = /* @__PURE__ */ function(CubismAlphaBlend) {
	CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_None"] = -1] = "AlphaBlend_None";
	CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_Over"] = 0] = "AlphaBlend_Over";
	CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_Atop"] = 1] = "AlphaBlend_Atop";
	CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_Out"] = 2] = "AlphaBlend_Out";
	CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_ConjointOver"] = 3] = "AlphaBlend_ConjointOver";
	CubismAlphaBlend[CubismAlphaBlend["AlphaBlend_DisjointOver"] = 4] = "AlphaBlend_DisjointOver";
	return CubismAlphaBlend;
}({});
/**
* オブジェクトのタイプ
*/
var CubismModelObjectType = /* @__PURE__ */ function(CubismModelObjectType) {
	CubismModelObjectType[CubismModelObjectType["CubismModelObjectType_Drawable"] = 0] = "CubismModelObjectType_Drawable";
	CubismModelObjectType[CubismModelObjectType["CubismModelObjectType_Parts"] = 1] = "CubismModelObjectType_Parts";
	return CubismModelObjectType;
}({});
/**
* Structure for managing the override of parameter repetition settings
*/
var ParameterRepeatData = class {
	/**
	* Constructor
	*
	* @param isOverridden whether to be overriden
	* @param isParameterRepeated override flag for settings
	*/
	constructor(isOverridden = false, isParameterRepeated = false) {
		this.isOverridden = isOverridden;
		this.isParameterRepeated = isParameterRepeated;
	}
};
/**
* テクスチャのカリング設定を管理するための構造体
*/
var CullingData = class {
	/**
	* コンストラクタ
	*
	* @param isOverridden
	* @param isCulling
	*/
	constructor(isOverridden = false, isCulling = false) {
		this.isOverridden = isOverridden;
		this.isCulling = isCulling;
	}
};
/**
* パーツ子描画オブジェクト情報構造体
*/
var PartChildDrawObjects = class {
	constructor(drawableIndices = new Array(), offscreenIndices = new Array()) {
		this.drawableIndices = drawableIndices;
		this.offscreenIndices = offscreenIndices;
	}
};
/**
* オブジェクト情報構造体
*/
var CubismModelObjectInfo = class {
	constructor(objectIndex, objectType) {
		this.objectIndex = objectIndex;
		this.objectType = objectType;
	}
};
/**
* パーツ情報管理構造体
*/
var CubismModelPartInfo = class {
	constructor(objects = new Array(), childDrawObjects = new PartChildDrawObjects()) {
		this.objects = objects;
		this.childDrawObjects = childDrawObjects;
	}
	getChildObjectCount() {
		return this.objects.length;
	}
};
/**
* モデル
*
* Mocデータから生成されるモデルのクラス。
*/
var CubismModel = class {
	/**
	* モデルのパラメータの更新
	*/
	update() {
		this._model.update();
		this._model.drawables.resetDynamicFlags();
	}
	/**
	* PixelsPerUnitを取得する
	* @return PixelsPerUnit
	*/
	getPixelsPerUnit() {
		if (this._model == null) return 0;
		return this._model.canvasinfo.PixelsPerUnit;
	}
	/**
	* キャンバスの幅を取得する
	*/
	getCanvasWidth() {
		if (this._model == null) return 0;
		return this._model.canvasinfo.CanvasWidth / this._model.canvasinfo.PixelsPerUnit;
	}
	/**
	* キャンバスの高さを取得する
	*/
	getCanvasHeight() {
		if (this._model == null) return 0;
		return this._model.canvasinfo.CanvasHeight / this._model.canvasinfo.PixelsPerUnit;
	}
	/**
	* パラメータを保存する
	*/
	saveParameters() {
		const parameterCount = this._model.parameters.count;
		const savedParameterCount = this._savedParameters.length;
		for (let i = 0; i < parameterCount; ++i) if (i < savedParameterCount) this._savedParameters[i] = this._parameterValues[i];
		else this._savedParameters.push(this._parameterValues[i]);
	}
	/**
	* 乗算色・スクリーン色管理クラスを取得する
	*
	* @return CubismModelMultiplyAndScreenColorのインスタンス
	*/
	getOverrideMultiplyAndScreenColor() {
		return this._overrideMultiplyAndScreenColor;
	}
	/**
	* Checks whether parameter repetition is performed for the entire model.
	*
	* @return true if parameter repetition is performed for the entire model; otherwise returns false.
	*/
	getOverrideFlagForModelParameterRepeat() {
		return this._isOverriddenParameterRepeat;
	}
	/**
	* Sets whether parameter repetition is performed for the entire model.
	* Use true to perform parameter repetition for the entire model, or false to not perform it.
	*/
	setOverrideFlagForModelParameterRepeat(isRepeat) {
		this._isOverriddenParameterRepeat = isRepeat;
	}
	/**
	* Returns the flag indicating whether to override the parameter repeat.
	*
	* @param parameterIndex Parameter index
	*
	* @return true if the parameter repeat is overridden, false otherwise.
	*/
	getOverrideFlagForParameterRepeat(parameterIndex) {
		return this._userParameterRepeatDataList[parameterIndex].isOverridden;
	}
	/**
	* Sets the flag indicating whether to override the parameter repeat.
	*
	* @param parameterIndex Parameter index
	* @param value true if it is to be overridden; otherwise, false.
	*/
	setOverrideFlagForParameterRepeat(parameterIndex, value) {
		this._userParameterRepeatDataList[parameterIndex].isOverridden = value;
	}
	/**
	* Returns the repeat flag.
	*
	* @param parameterIndex Parameter index
	*
	* @return true if repeating, false otherwise.
	*/
	getRepeatFlagForParameterRepeat(parameterIndex) {
		return this._userParameterRepeatDataList[parameterIndex].isParameterRepeated;
	}
	/**
	* Sets the repeat flag.
	*
	* @param parameterIndex Parameter index
	* @param value true to enable repeating, false otherwise.
	*/
	setRepeatFlagForParameterRepeat(parameterIndex, value) {
		this._userParameterRepeatDataList[parameterIndex].isParameterRepeated = value;
	}
	/**
	* Drawableのカリング情報を取得する。
	*
	* @param   drawableIndex   Drawableのインデックス
	*
	* @return  Drawableのカリング情報
	*/
	getDrawableCulling(drawableIndex) {
		if (this.getOverrideFlagForModelCullings() || this.getOverrideFlagForDrawableCullings(drawableIndex)) return this._userDrawableCullings[drawableIndex].isCulling;
		const constantFlags = this._model.drawables.constantFlags;
		return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(constantFlags[drawableIndex]);
	}
	/**
	* Drawableのカリング情報を設定する。
	*
	* @param drawableIndex Drawableのインデックス
	* @param isCulling カリング情報
	*/
	setDrawableCulling(drawableIndex, isCulling) {
		this._userDrawableCullings[drawableIndex].isCulling = isCulling;
	}
	/**
	* Offscreenのカリング情報を取得する。
	*
	* @param   offscreenIndex   Offscreenのインデックス
	*
	* @return  Offscreenのカリング情報
	*/
	getOffscreenCulling(offscreenIndex) {
		if (this.getOverrideFlagForModelCullings() || this.getOverrideFlagForOffscreenCullings(offscreenIndex)) return this._userOffscreenCullings[offscreenIndex].isCulling;
		const constantFlags = this._model.offscreens.constantFlags;
		return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(constantFlags[offscreenIndex]);
	}
	/**
	* Offscreenのカリング設定を設定する。
	*
	* @param offscreenIndex Offscreenのインデックス
	* @param isCulling カリング情報
	*/
	setOffscreenCulling(offscreenIndex, isCulling) {
		this._userOffscreenCullings[offscreenIndex].isCulling = isCulling;
	}
	/**
	* SDKからモデル全体のカリング設定を上書きするか。
	*
	* @return  true    ->  SDK上のカリング設定を使用
	*          false   ->  モデルのカリング設定を使用
	*/
	getOverrideFlagForModelCullings() {
		return this._isOverriddenCullings;
	}
	/**
	* SDKからモデル全体のカリング設定を上書きするかを設定する。
	*
	* @param isOverriddenCullings SDK上のカリング設定を使うならtrue、モデルのカリング設定を使うならfalse
	*/
	setOverrideFlagForModelCullings(isOverriddenCullings) {
		this._isOverriddenCullings = isOverriddenCullings;
	}
	/**
	*
	* @param drawableIndex Drawableのインデックス
	* @return  true    ->  SDK上のカリング設定を使用
	*          false   ->  モデルのカリング設定を使用
	*/
	getOverrideFlagForDrawableCullings(drawableIndex) {
		return this._userDrawableCullings[drawableIndex].isOverridden;
	}
	/**
	* @param offscreenIndex Offscreenのインデックス
	* @return  true    ->  SDK上のカリング設定を使用
	*          false   ->  モデルのカリング設定を使用
	*/
	getOverrideFlagForOffscreenCullings(offscreenIndex) {
		return this._userOffscreenCullings[offscreenIndex].isOverridden;
	}
	/**
	*
	* @param drawableIndex Drawableのインデックス
	* @param isOverriddenCullings SDK上のカリング設定を使うならtrue、モデルのカリング設定を使うならfalse
	*/
	setOverrideFlagForDrawableCullings(drawableIndex, isOverriddenCullings) {
		this._userDrawableCullings[drawableIndex].isOverridden = isOverriddenCullings;
	}
	/**
	* モデルの不透明度を取得する
	*
	* @return 不透明度の値
	*/
	getModelOapcity() {
		return this._modelOpacity;
	}
	/**
	* モデルの不透明度を設定する
	*
	* @param value 不透明度の値
	*/
	setModelOapcity(value) {
		this._modelOpacity = value;
	}
	/**
	* モデルを取得
	*/
	getModel() {
		return this._model;
	}
	/**
	* パーツのインデックスを取得
	* @param partId パーツのID
	* @return パーツのインデックス
	*/
	getPartIndex(partId) {
		let partIndex;
		const partCount = this._model.parts.count;
		for (partIndex = 0; partIndex < partCount; ++partIndex) if (partId == this._partIds[partIndex]) return partIndex;
		if (this._notExistPartId.has(partId)) return this._notExistPartId.get(partId);
		partIndex = partCount + this._notExistPartId.size;
		this._notExistPartId.set(partId, partIndex);
		this._notExistPartOpacities.set(partIndex, null);
		return partIndex;
	}
	/**
	* パーツのIDを取得する。
	*
	* @param partIndex 取得するパーツのインデックス
	* @return パーツのID
	*/
	getPartId(partIndex) {
		const partId = this._model.parts.ids[partIndex];
		return CubismFramework.getIdManager().getId(partId);
	}
	/**
	* パーツの個数の取得
	* @return パーツの個数
	*/
	getPartCount() {
		return this._model.parts.count;
	}
	/**
	* パーツのオフスクリーンインデックスの取得
	* @param partIndex パーツのインデックス
	* @return オフスクリーンインデックスのリスト
	*/
	getPartOffscreenIndices() {
		return this._model.parts.offscreenIndices;
	}
	/**
	* パーツの親パーツインデックスのリストを取得
	*
	* @return パーツの親パーツインデックスのリスト
	*/
	getPartParentPartIndices() {
		return this._model.parts.parentIndices;
	}
	/**
	* パーツの不透明度の設定(Index)
	* @param partIndex パーツのインデックス
	* @param opacity 不透明度
	*/
	setPartOpacityByIndex(partIndex, opacity) {
		if (this._notExistPartOpacities.has(partIndex)) {
			this._notExistPartOpacities.set(partIndex, opacity);
			return;
		}
		CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
		this._partOpacities[partIndex] = opacity;
	}
	/**
	* パーツの不透明度の設定(Id)
	* @param partId パーツのID
	* @param opacity パーツの不透明度
	*/
	setPartOpacityById(partId, opacity) {
		const index = this.getPartIndex(partId);
		if (index < 0) return;
		this.setPartOpacityByIndex(index, opacity);
	}
	/**
	* パーツの不透明度の取得(index)
	* @param partIndex パーツのインデックス
	* @return パーツの不透明度
	*/
	getPartOpacityByIndex(partIndex) {
		if (this._notExistPartOpacities.has(partIndex)) return this._notExistPartOpacities.get(partIndex);
		CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());
		return this._partOpacities[partIndex];
	}
	/**
	* パーツの不透明度の取得(id)
	* @param partId パーツのＩｄ
	* @return パーツの不透明度
	*/
	getPartOpacityById(partId) {
		const index = this.getPartIndex(partId);
		if (index < 0) return 0;
		return this.getPartOpacityByIndex(index);
	}
	/**
	* パラメータのインデックスの取得
	* @param パラメータID
	* @return パラメータのインデックス
	*/
	getParameterIndex(parameterId) {
		let parameterIndex;
		const idCount = this._model.parameters.count;
		for (parameterIndex = 0; parameterIndex < idCount; ++parameterIndex) {
			if (parameterId != this._parameterIds[parameterIndex]) continue;
			return parameterIndex;
		}
		if (this._notExistParameterId.has(parameterId)) return this._notExistParameterId.get(parameterId);
		parameterIndex = this._model.parameters.count + this._notExistParameterId.size;
		this._notExistParameterId.set(parameterId, parameterIndex);
		this._notExistParameterValues.set(parameterIndex, null);
		return parameterIndex;
	}
	/**
	* パラメータの個数の取得
	* @return パラメータの個数
	*/
	getParameterCount() {
		return this._model.parameters.count;
	}
	/**
	* パラメータの種類の取得
	* @param parameterIndex パラメータのインデックス
	* @return csmParameterType_Normal -> 通常のパラメータ
	*          csmParameterType_BlendShape -> ブレンドシェイプパラメータ
	*/
	getParameterType(parameterIndex) {
		return this._model.parameters.types[parameterIndex];
	}
	/**
	* パラメータの最大値の取得
	* @param parameterIndex パラメータのインデックス
	* @return パラメータの最大値
	*/
	getParameterMaximumValue(parameterIndex) {
		return this._model.parameters.maximumValues[parameterIndex];
	}
	/**
	* パラメータの最小値の取得
	* @param parameterIndex パラメータのインデックス
	* @return パラメータの最小値
	*/
	getParameterMinimumValue(parameterIndex) {
		return this._model.parameters.minimumValues[parameterIndex];
	}
	/**
	* パラメータのデフォルト値の取得
	* @param parameterIndex パラメータのインデックス
	* @return パラメータのデフォルト値
	*/
	getParameterDefaultValue(parameterIndex) {
		return this._model.parameters.defaultValues[parameterIndex];
	}
	/**
	* 指定したパラメータindexのIDを取得
	*
	* @param parameterIndex パラメータのインデックス
	* @return パラメータID
	*/
	getParameterId(parameterIndex) {
		return CubismFramework.getIdManager().getId(this._model.parameters.ids[parameterIndex]);
	}
	/**
	* パラメータの値の取得
	* @param parameterIndex    パラメータのインデックス
	* @return パラメータの値
	*/
	getParameterValueByIndex(parameterIndex) {
		if (this._notExistParameterValues.has(parameterIndex)) return this._notExistParameterValues.get(parameterIndex);
		CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
		return this._parameterValues[parameterIndex];
	}
	/**
	* パラメータの値の取得
	* @param parameterId    パラメータのID
	* @return パラメータの値
	*/
	getParameterValueById(parameterId) {
		const parameterIndex = this.getParameterIndex(parameterId);
		return this.getParameterValueByIndex(parameterIndex);
	}
	/**
	* パラメータの値の設定
	* @param parameterIndex パラメータのインデックス
	* @param value パラメータの値
	* @param weight 重み
	*/
	setParameterValueByIndex(parameterIndex, value, weight = 1) {
		if (this._notExistParameterValues.has(parameterIndex)) {
			this._notExistParameterValues.set(parameterIndex, weight == 1 ? value : this._notExistParameterValues.get(parameterIndex) * (1 - weight) + value * weight);
			return;
		}
		CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
		if (this.isRepeat(parameterIndex)) value = this.getParameterRepeatValue(parameterIndex, value);
		else value = this.getParameterClampValue(parameterIndex, value);
		this._parameterValues[parameterIndex] = weight == 1 ? value : this._parameterValues[parameterIndex] = this._parameterValues[parameterIndex] * (1 - weight) + value * weight;
	}
	/**
	* パラメータの値の設定
	* @param parameterId パラメータのID
	* @param value パラメータの値
	* @param weight 重み
	*/
	setParameterValueById(parameterId, value, weight = 1) {
		const index = this.getParameterIndex(parameterId);
		this.setParameterValueByIndex(index, value, weight);
	}
	/**
	* パラメータの値の加算(index)
	* @param parameterIndex パラメータインデックス
	* @param value 加算する値
	* @param weight 重み
	*/
	addParameterValueByIndex(parameterIndex, value, weight = 1) {
		this.setParameterValueByIndex(parameterIndex, this.getParameterValueByIndex(parameterIndex) + value * weight);
	}
	/**
	* パラメータの値の加算(id)
	* @param parameterId パラメータＩＤ
	* @param value 加算する値
	* @param weight 重み
	*/
	addParameterValueById(parameterId, value, weight = 1) {
		const index = this.getParameterIndex(parameterId);
		this.addParameterValueByIndex(index, value, weight);
	}
	/**
	* Gets whether the parameter has the repeat setting.
	*
	* @param parameterIndex Parameter index
	*
	* @return true if it is set, otherwise returns false.
	*/
	isRepeat(parameterIndex) {
		if (this._notExistParameterValues.has(parameterIndex)) return false;
		CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
		let isRepeat;
		if (this._isOverriddenParameterRepeat || this._userParameterRepeatDataList[parameterIndex].isOverridden) isRepeat = this._userParameterRepeatDataList[parameterIndex].isParameterRepeated;
		else isRepeat = this._model.parameters.repeats[parameterIndex] != 0;
		return isRepeat;
	}
	/**
	* Returns the calculated result ensuring the value falls within the parameter's range.
	*
	* @param parameterIndex Parameter index
	* @param value Parameter value
	*
	* @return a value that falls within the parameter’s range. If the parameter does not exist, returns it as is.
	*/
	getParameterRepeatValue(parameterIndex, value) {
		if (this._notExistParameterValues.has(parameterIndex)) return value;
		CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
		const maxValue = this._model.parameters.maximumValues[parameterIndex];
		const minValue = this._model.parameters.minimumValues[parameterIndex];
		const valueSize = maxValue - minValue;
		if (maxValue < value) {
			const overValue = CubismMath.mod(value - maxValue, valueSize);
			if (!Number.isNaN(overValue)) value = minValue + overValue;
			else value = maxValue;
		}
		if (value < minValue) {
			const overValue = CubismMath.mod(minValue - value, valueSize);
			if (!Number.isNaN(overValue)) value = maxValue - overValue;
			else value = minValue;
		}
		return value;
	}
	/**
	* Returns the result of clamping the value to ensure it falls within the parameter's range.
	*
	* @param parameterIndex Parameter index
	* @param value Parameter value
	*
	* @return the clamped value. If the parameter does not exist, returns it as is.
	*/
	getParameterClampValue(parameterIndex, value) {
		if (this._notExistParameterValues.has(parameterIndex)) return value;
		CSM_ASSERT(0 <= parameterIndex && parameterIndex < this.getParameterCount());
		const maxValue = this._model.parameters.maximumValues[parameterIndex];
		const minValue = this._model.parameters.minimumValues[parameterIndex];
		return CubismMath.clamp(value, minValue, maxValue);
	}
	/**
	* Returns the repeat of the parameter.
	*
	* @param parameterIndex Parameter index
	*
	* @return the raw data parameter repeat from the Cubism Core.
	*/
	getParameterRepeats(parameterIndex) {
		return this._model.parameters.repeats[parameterIndex] != 0;
	}
	/**
	* パラメータの値の乗算
	* @param parameterId パラメータのID
	* @param value 乗算する値
	* @param weight 重み
	*/
	multiplyParameterValueById(parameterId, value, weight = 1) {
		const index = this.getParameterIndex(parameterId);
		this.multiplyParameterValueByIndex(index, value, weight);
	}
	/**
	* パラメータの値の乗算
	* @param parameterIndex パラメータのインデックス
	* @param value 乗算する値
	* @param weight 重み
	*/
	multiplyParameterValueByIndex(parameterIndex, value, weight = 1) {
		this.setParameterValueByIndex(parameterIndex, this.getParameterValueByIndex(parameterIndex) * (1 + (value - 1) * weight));
	}
	/**
	* Drawableのインデックスの取得
	* @param drawableId DrawableのID
	* @return Drawableのインデックス
	*/
	getDrawableIndex(drawableId) {
		const drawableCount = this._model.drawables.count;
		for (let drawableIndex = 0; drawableIndex < drawableCount; ++drawableIndex) if (this._drawableIds[drawableIndex] == drawableId) return drawableIndex;
		return -1;
	}
	/**
	* Drawableの個数の取得
	* @return drawableの個数
	*/
	getDrawableCount() {
		return this._model.drawables.count;
	}
	/**
	* DrawableのIDを取得する
	* @param drawableIndex Drawableのインデックス
	* @return drawableのID
	*/
	getDrawableId(drawableIndex) {
		const parameterIds = this._model.drawables.ids;
		return CubismFramework.getIdManager().getId(parameterIds[drawableIndex]);
	}
	/**
	* Drawableの描画順リストの取得
	* @return Drawableの描画順リスト
	*/
	getRenderOrders() {
		return this._model.getRenderOrders();
	}
	/**
	* Drawableのテクスチャインデックスの取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableのテクスチャインデックス
	*/
	getDrawableTextureIndex(drawableIndex) {
		return this._model.drawables.textureIndices[drawableIndex];
	}
	/**
	* DrawableのVertexPositionsの変化情報の取得
	*
	* 直近のCubismModel.update関数でDrawableの頂点情報が変化したかを取得する。
	*
	* @param   drawableIndex   Drawableのインデックス
	* @return  true    Drawableの頂点情報が直近のCubismModel.update関数で変化した
	*          false   Drawableの頂点情報が直近のCubismModel.update関数で変化していない
	*/
	getDrawableDynamicFlagVertexPositionsDidChange(drawableIndex) {
		const dynamicFlags = this._model.drawables.dynamicFlags;
		return Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(dynamicFlags[drawableIndex]);
	}
	/**
	* Drawableの頂点インデックスの個数の取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの頂点インデックスの個数
	*/
	getDrawableVertexIndexCount(drawableIndex) {
		return this._model.drawables.indexCounts[drawableIndex];
	}
	/**
	* Drawableの頂点の個数の取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの頂点の個数
	*/
	getDrawableVertexCount(drawableIndex) {
		return this._model.drawables.vertexCounts[drawableIndex];
	}
	/**
	* Drawableの頂点リストの取得
	* @param drawableIndex drawableのインデックス
	* @return drawableの頂点リスト
	*/
	getDrawableVertices(drawableIndex) {
		return this.getDrawableVertexPositions(drawableIndex);
	}
	/**
	* Drawableの頂点インデックスリストの取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの頂点インデックスリスト
	*/
	getDrawableVertexIndices(drawableIndex) {
		return this._model.drawables.indices[drawableIndex];
	}
	/**
	* Drawableの頂点リストの取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの頂点リスト
	*/
	getDrawableVertexPositions(drawableIndex) {
		return this._model.drawables.vertexPositions[drawableIndex];
	}
	/**
	* Drawableの頂点のUVリストの取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの頂点UVリスト
	*/
	getDrawableVertexUvs(drawableIndex) {
		return this._model.drawables.vertexUvs[drawableIndex];
	}
	/**
	* Drawableの不透明度の取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの不透明度
	*/
	getDrawableOpacity(drawableIndex) {
		return this._model.drawables.opacities[drawableIndex];
	}
	/**
	* Drawableの乗算色の取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの乗算色(RGBA)
	* スクリーン色はRGBAで取得されるが、Aは必ず0
	*/
	getDrawableMultiplyColor(drawableIndex) {
		if (this._drawableMultiplyColors == null) {
			this._drawableMultiplyColors = new Array(this._model.drawables.count);
			this._drawableMultiplyColors.fill(new CubismTextureColor());
		}
		const multiplyColors = this._model.drawables.multiplyColors;
		const index = drawableIndex * 4;
		this._drawableMultiplyColors[drawableIndex].r = multiplyColors[index];
		this._drawableMultiplyColors[drawableIndex].g = multiplyColors[index + 1];
		this._drawableMultiplyColors[drawableIndex].b = multiplyColors[index + 2];
		this._drawableMultiplyColors[drawableIndex].a = multiplyColors[index + 3];
		return this._drawableMultiplyColors[drawableIndex];
	}
	/**
	* Drawableのスクリーン色の取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableのスクリーン色(RGBA)
	* スクリーン色はRGBAで取得されるが、Aは必ず0
	*/
	getDrawableScreenColor(drawableIndex) {
		if (this._drawableScreenColors == null) {
			this._drawableScreenColors = new Array(this._model.drawables.count);
			this._drawableScreenColors.fill(new CubismTextureColor());
		}
		const screenColors = this._model.drawables.screenColors;
		const index = drawableIndex * 4;
		this._drawableScreenColors[drawableIndex].r = screenColors[index];
		this._drawableScreenColors[drawableIndex].g = screenColors[index + 1];
		this._drawableScreenColors[drawableIndex].b = screenColors[index + 2];
		this._drawableScreenColors[drawableIndex].a = screenColors[index + 3];
		return this._drawableScreenColors[drawableIndex];
	}
	/**
	* Offscreenの乗算色の取得
	* @param offscreenIndex Offscreenのインデックス
	* @return Offscreenの乗算色(RGBA)
	* スクリーン色はRGBAで取得されるが、Aは必ず0
	*/
	getOffscreenMultiplyColor(offscreenIndex) {
		if (this._offscreenMultiplyColors == null) {
			this._offscreenMultiplyColors = new Array(this._model.offscreens.count);
			this._offscreenMultiplyColors.fill(new CubismTextureColor());
		}
		const multiplyColors = this._model.offscreens.multiplyColors;
		const index = offscreenIndex * 4;
		this._offscreenMultiplyColors[offscreenIndex].r = multiplyColors[index];
		this._offscreenMultiplyColors[offscreenIndex].g = multiplyColors[index + 1];
		this._offscreenMultiplyColors[offscreenIndex].b = multiplyColors[index + 2];
		this._offscreenMultiplyColors[offscreenIndex].a = multiplyColors[index + 3];
		return this._offscreenMultiplyColors[offscreenIndex];
	}
	/**
	* Offscreenのスクリーン色の取得
	* @param offscreenIndex Offscreenのインデックス
	* @return Offscreenのスクリーン色(RGBA)
	* スクリーン色はRGBAで取得されるが、Aは必ず0
	*/
	getOffscreenScreenColor(offscreenIndex) {
		if (this._offscreenScreenColors == null) {
			this._offscreenScreenColors = new Array(this._model.offscreens.count);
			this._offscreenScreenColors.fill(new CubismTextureColor());
		}
		const screenColors = this._model.offscreens.screenColors;
		const index = offscreenIndex * 4;
		this._offscreenScreenColors[offscreenIndex].r = screenColors[index];
		this._offscreenScreenColors[offscreenIndex].g = screenColors[index + 1];
		this._offscreenScreenColors[offscreenIndex].b = screenColors[index + 2];
		this._offscreenScreenColors[offscreenIndex].a = screenColors[index + 3];
		return this._offscreenScreenColors[offscreenIndex];
	}
	/**
	* Drawableの親パーツのインデックスの取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableの親パーツのインデックス
	*/
	getDrawableParentPartIndex(drawableIndex) {
		return this._model.drawables.parentPartIndices[drawableIndex];
	}
	/**
	* Drawableのブレンドモードを取得
	* @param drawableIndex Drawableのインデックス
	* @return drawableのブレンドモード
	*/
	getDrawableBlendMode(drawableIndex) {
		const constantFlags = this._model.drawables.constantFlags;
		return Live2DCubismCore.Utils.hasBlendAdditiveBit(constantFlags[drawableIndex]) ? CubismBlendMode.CubismBlendMode_Additive : Live2DCubismCore.Utils.hasBlendMultiplicativeBit(constantFlags[drawableIndex]) ? CubismBlendMode.CubismBlendMode_Multiplicative : CubismBlendMode.CubismBlendMode_Normal;
	}
	/**
	* Drawableのカラーブレンドの取得(Cubism 5.3 以降)
	*
	* @param drawableIndex Drawableのインデックス
	* @return Drawableのカラーブレンド
	*/
	getDrawableColorBlend(drawableIndex) {
		if (this._drawableColorBlends[drawableIndex] == -1) this._drawableColorBlends[drawableIndex] = this._model.drawables.blendModes[drawableIndex] & 255;
		return this._drawableColorBlends[drawableIndex];
	}
	/**
	* Drawableのアルファブレンドの取得(Cubism 5.3 以降)
	*
	* @param drawableIndex Drawableのインデックス
	* @return Drawableのアルファブレンド
	*/
	getDrawableAlphaBlend(drawableIndex) {
		if (this._drawableAlphaBlends[drawableIndex] == -1) this._drawableAlphaBlends[drawableIndex] = this._model.drawables.blendModes[drawableIndex] >> 8 & 255;
		return this._drawableAlphaBlends[drawableIndex];
	}
	/**
	* Drawableのマスクの反転使用の取得
	*
	* Drawableのマスク使用時の反転設定を取得する。
	* マスクを使用しない場合は無視される。
	*
	* @param drawableIndex Drawableのインデックス
	* @return Drawableの反転設定
	*/
	getDrawableInvertedMaskBit(drawableIndex) {
		const constantFlags = this._model.drawables.constantFlags;
		return Live2DCubismCore.Utils.hasIsInvertedMaskBit(constantFlags[drawableIndex]);
	}
	/**
	* Drawableのクリッピングマスクリストの取得
	* @return Drawableのクリッピングマスクリスト
	*/
	getDrawableMasks() {
		return this._model.drawables.masks;
	}
	/**
	* Drawableのクリッピングマスクの個数リストの取得
	* @return Drawableのクリッピングマスクの個数リスト
	*/
	getDrawableMaskCounts() {
		return this._model.drawables.maskCounts;
	}
	/**
	* クリッピングマスクの使用状態
	*
	* @return true クリッピングマスクを使用している
	* @return false クリッピングマスクを使用していない
	*/
	isUsingMasking() {
		for (let d = 0; d < this._model.drawables.count; ++d) {
			if (this._model.drawables.maskCounts[d] <= 0) continue;
			return true;
		}
		return false;
	}
	/**
	* Offscreenでクリッピングマスクを使用しているかどうかを取得
	*
	* @return true クリッピングマスクをオフスクリーンで使用している
	*/
	isUsingMaskingForOffscreen() {
		for (let d = 0; d < this.getOffscreenCount(); ++d) {
			if (this._model.offscreens.maskCounts[d] <= 0) continue;
			return true;
		}
		return false;
	}
	/**
	* Drawableの表示情報を取得する
	*
	* @param drawableIndex Drawableのインデックス
	* @return true Drawableが表示
	* @return false Drawableが非表示
	*/
	getDrawableDynamicFlagIsVisible(drawableIndex) {
		const dynamicFlags = this._model.drawables.dynamicFlags;
		return Live2DCubismCore.Utils.hasIsVisibleBit(dynamicFlags[drawableIndex]);
	}
	/**
	* DrawableのDrawOrderの変化情報の取得
	*
	* 直近のCubismModel.update関数でdrawableのdrawOrderが変化したかを取得する。
	* drawOrderはartMesh上で指定する0から1000の情報
	* @param drawableIndex drawableのインデックス
	* @return true drawableの不透明度が直近のCubismModel.update関数で変化した
	* @return false drawableの不透明度が直近のCubismModel.update関数で変化している
	*/
	getDrawableDynamicFlagVisibilityDidChange(drawableIndex) {
		const dynamicFlags = this._model.drawables.dynamicFlags;
		return Live2DCubismCore.Utils.hasVisibilityDidChangeBit(dynamicFlags[drawableIndex]);
	}
	/**
	* Drawableの不透明度の変化情報の取得
	*
	* 直近のCubismModel.update関数でdrawableの不透明度が変化したかを取得する。
	*
	* @param drawableIndex drawableのインデックス
	* @return true Drawableの不透明度が直近のCubismModel.update関数で変化した
	* @return false Drawableの不透明度が直近のCubismModel.update関数で変化してない
	*/
	getDrawableDynamicFlagOpacityDidChange(drawableIndex) {
		const dynamicFlags = this._model.drawables.dynamicFlags;
		return Live2DCubismCore.Utils.hasOpacityDidChangeBit(dynamicFlags[drawableIndex]);
	}
	/**
	* Drawableの描画順序の変化情報の取得
	*
	* 直近のCubismModel.update関数でDrawableの描画の順序が変化したかを取得する。
	*
	* @param drawableIndex Drawableのインデックス
	* @return true Drawableの描画の順序が直近のCubismModel.update関数で変化した
	* @return false Drawableの描画の順序が直近のCubismModel.update関数で変化してない
	*/
	getDrawableDynamicFlagRenderOrderDidChange(drawableIndex) {
		const dynamicFlags = this._model.drawables.dynamicFlags;
		return Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(dynamicFlags[drawableIndex]);
	}
	/**
	* Drawableの乗算色・スクリーン色の変化情報の取得
	*
	* 直近のCubismModel.update関数でDrawableの乗算色・スクリーン色が変化したかを取得する。
	*
	* @param drawableIndex Drawableのインデックス
	* @return true Drawableの乗算色・スクリーン色が直近のCubismModel.update関数で変化した
	* @return false Drawableの乗算色・スクリーン色が直近のCubismModel.update関数で変化してない
	*/
	getDrawableDynamicFlagBlendColorDidChange(drawableIndex) {
		const dynamicFlags = this._model.drawables.dynamicFlags;
		return Live2DCubismCore.Utils.hasBlendColorDidChangeBit(dynamicFlags[drawableIndex]);
	}
	/**
	* オフスクリーンの個数を取得する
	* @return オフスクリーンの個数
	*/
	getOffscreenCount() {
		return this._model.offscreens.count;
	}
	/**
	* Offscreenのカラーブレンドの取得(Cubism 5.3 以降)
	*
	* @param offscreenIndex Offscreenのインデックス
	* @return Offscreenのカラーブレンド
	*/
	getOffscreenColorBlend(offscreenIndex) {
		if (this._offscreenColorBlends[offscreenIndex] == -1) this._offscreenColorBlends[offscreenIndex] = this._model.offscreens.blendModes[offscreenIndex] & 255;
		return this._offscreenColorBlends[offscreenIndex];
	}
	/**
	* Offscreenのアルファブレンドの取得(Cubism 5.3 以降)
	*
	* @param offscreenIndex Offscreenのインデックス
	* @return Offscreenのアルファブレンド
	*/
	getOffscreenAlphaBlend(offscreenIndex) {
		if (this._offscreenAlphaBlends[offscreenIndex] == -1) this._offscreenAlphaBlends[offscreenIndex] = this._model.offscreens.blendModes[offscreenIndex] >> 8 & 255;
		return this._offscreenAlphaBlends[offscreenIndex];
	}
	/**
	* オフスクリーンのオーナーインデックス配列を取得する
	* @return オフスクリーンのオーナーインデックス配列
	*/
	getOffscreenOwnerIndices() {
		return this._model.offscreens.ownerIndices;
	}
	/**
	* オフスクリーンの不透明度を取得
	* @param offscreenIndex オフスクリーンのインデックス
	* @return 不透明度
	*/
	getOffscreenOpacity(offscreenIndex) {
		if (offscreenIndex < 0 || offscreenIndex >= this._model.offscreens.count) return 1;
		return this._model.offscreens.opacities[offscreenIndex];
	}
	/**
	* オフスクリーンのクリッピングマスクリストの取得
	* @return オフスクリーンのクリッピングマスクリスト
	*/
	getOffscreenMasks() {
		return this._model.offscreens.masks;
	}
	/**
	* オフスクリーンのクリッピングマスクの個数リストの取得
	* @return オフスクリーンのクリッピングマスクの個数リスト
	*/
	getOffscreenMaskCounts() {
		return this._model.offscreens.maskCounts;
	}
	/**
	* オフスクリーンのマスク反転設定を取得する
	* @param offscreenIndex オフスクリーンのインデックス
	* @return オフスクリーンのマスク反転設定
	*/
	getOffscreenInvertedMask(offscreenIndex) {
		const constantFlags = this._model.offscreens.constantFlags;
		return Live2DCubismCore.Utils.hasIsInvertedMaskBit(constantFlags[offscreenIndex]);
	}
	/**
	* ブレンドモード使用判定
	* @return ブレンドモードを使用しているか
	*/
	isBlendModeEnabled() {
		return this._isBlendModeEnabled;
	}
	/**
	* 保存されたパラメータの読み込み
	*/
	loadParameters() {
		let parameterCount = this._model.parameters.count;
		const savedParameterCount = this._savedParameters.length;
		if (parameterCount > savedParameterCount) parameterCount = savedParameterCount;
		for (let i = 0; i < parameterCount; ++i) this._parameterValues[i] = this._savedParameters[i];
	}
	/**
	* 初期化する
	*/
	initialize() {
		CSM_ASSERT(this._model);
		this._parameterValues = this._model.parameters.values;
		this._partOpacities = this._model.parts.opacities;
		this._offscreenOpacities = this._model.offscreens.opacities;
		this._parameterMaximumValues = this._model.parameters.maximumValues;
		this._parameterMinimumValues = this._model.parameters.minimumValues;
		{
			const parameterIds = this._model.parameters.ids;
			const parameterCount = this._model.parameters.count;
			this._parameterIds.length = parameterCount;
			this._userParameterRepeatDataList.length = parameterCount;
			for (let i = 0; i < parameterCount; ++i) {
				this._parameterIds[i] = CubismFramework.getIdManager().getId(parameterIds[i]);
				this._userParameterRepeatDataList[i] = new ParameterRepeatData(false, false);
			}
		}
		const partCount = this._model.parts.count;
		{
			const partIds = this._model.parts.ids;
			this._partIds.length = partCount;
			for (let i = 0; i < partCount; ++i) this._partIds[i] = CubismFramework.getIdManager().getId(partIds[i]);
		}
		{
			const drawableIds = this._model.drawables.ids;
			const drawableCount = this._model.drawables.count;
			this._userDrawableCullings.length = drawableCount;
			const userCulling = new CullingData(false, false);
			this._userOffscreenCullings.length = this._model.offscreens.count;
			const userOffscreenCulling = new CullingData(false, false);
			for (let i = 0; i < drawableCount; ++i) {
				this._drawableIds.push(CubismFramework.getIdManager().getId(drawableIds[i]));
				this._userDrawableCullings[i] = userCulling;
			}
			for (let i = 0; i < this._model.offscreens.count; ++i) this._userOffscreenCullings[i] = userOffscreenCulling;
			if (this.getOffscreenCount() > 0) this._isBlendModeEnabled = true;
			else {
				this._model.drawables.blendModes;
				for (let i = 0; i < drawableCount; ++i) {
					const colorBlendType = this.getDrawableColorBlend(i);
					const alphaBlendType = this.getDrawableAlphaBlend(i);
					if (!(colorBlendType == CubismColorBlend.ColorBlend_Normal && alphaBlendType == 0) && colorBlendType != CubismColorBlend.ColorBlend_AddCompatible && colorBlendType != CubismColorBlend.ColorBlend_MultiplyCompatible) {
						this._isBlendModeEnabled = true;
						break;
					}
				}
			}
			this.setupPartsHierarchy();
			const offscreenCount = this.getOffscreenCount();
			this._overrideMultiplyAndScreenColor.initialize(partCount, drawableCount, offscreenCount);
		}
	}
	/**
	* パーツ階層構造を取得する
	* @return パーツ階層構造の配列
	*/
	getPartsHierarchy() {
		return this._partsHierarchy;
	}
	/**
	* パーツ階層構造をセットアップする
	*/
	setupPartsHierarchy() {
		this._partsHierarchy.length = 0;
		const partCount = this.getPartCount();
		this._partsHierarchy.length = partCount;
		for (let i = 0; i < partCount; ++i) {
			const partInfo = new CubismModelPartInfo();
			this._partsHierarchy[i] = partInfo;
		}
		for (let i = 0; i < partCount; ++i) {
			const parentPartIndex = this.getPartParentPartIndices()[i];
			if (parentPartIndex === -1) continue;
			for (let partIndex = 0; partIndex < this._partsHierarchy.length; ++partIndex) if (partIndex === parentPartIndex) {
				const objectInfo = new CubismModelObjectInfo(i, 1);
				this._partsHierarchy[partIndex].objects.push(objectInfo);
				break;
			}
		}
		const drawableCount = this.getDrawableCount();
		for (let i = 0; i < drawableCount; ++i) {
			const parentPartIndex = this.getDrawableParentPartIndex(i);
			if (parentPartIndex === -1) continue;
			for (let partIndex = 0; partIndex < this._partsHierarchy.length; ++partIndex) if (partIndex === parentPartIndex) {
				const objectInfo = new CubismModelObjectInfo(i, 0);
				this._partsHierarchy[partIndex].objects.push(objectInfo);
				break;
			}
		}
		for (let i = 0; i < this._partsHierarchy.length; ++i) this.getPartChildDrawObjects(i);
	}
	/**
	* 指定したパーツの子描画オブジェクト情報を取得・構築する
	* @param partInfoIndex パーツ情報のインデックス
	* @return PartChildDrawObjects
	*/
	getPartChildDrawObjects(partInfoIndex) {
		if (this._partsHierarchy[partInfoIndex].getChildObjectCount() < 1) return this._partsHierarchy[partInfoIndex].childDrawObjects;
		const childDrawObjects = this._partsHierarchy[partInfoIndex].childDrawObjects;
		if (childDrawObjects.drawableIndices.length !== 0 || childDrawObjects.offscreenIndices.length !== 0) return childDrawObjects;
		const objects = this._partsHierarchy[partInfoIndex].objects;
		for (let i = 0; i < objects.length; ++i) {
			const obj = objects[i];
			if (obj.objectType === 1) {
				this.getPartChildDrawObjects(obj.objectIndex);
				const childToChildDrawObjects = this._partsHierarchy[obj.objectIndex].childDrawObjects;
				childDrawObjects.drawableIndices.push(...childToChildDrawObjects.drawableIndices);
				childDrawObjects.offscreenIndices.push(...childToChildDrawObjects.offscreenIndices);
				const offscreenIndices = this.getOffscreenIndices();
				const offscreenIndex = offscreenIndices ? offscreenIndices[obj.objectIndex] : -1;
				if (offscreenIndex !== -1) childDrawObjects.offscreenIndices.push(offscreenIndex);
			} else if (obj.objectType === 0) childDrawObjects.drawableIndices.push(obj.objectIndex);
		}
		return childDrawObjects;
	}
	/**
	* パーツのオフスクリーンインデックス配列を取得
	* @return Int32Array offscreenIndices
	*/
	getOffscreenIndices() {
		return this._model.parts.offscreenIndices;
	}
	/**
	* コンストラクタ
	* @param model モデル
	*/
	constructor(model) {
		this._model = model;
		this._parameterValues = null;
		this._parameterMaximumValues = null;
		this._parameterMinimumValues = null;
		this._partOpacities = null;
		this._offscreenOpacities = null;
		this._savedParameters = new Array();
		this._parameterIds = new Array();
		this._drawableIds = new Array();
		this._partIds = new Array();
		this._isOverriddenParameterRepeat = true;
		this._isOverriddenCullings = false;
		this._modelOpacity = 1;
		this._overrideMultiplyAndScreenColor = new CubismModelMultiplyAndScreenColor(this);
		this._isBlendModeEnabled = false;
		this._drawableColorBlends = null;
		this._drawableAlphaBlends = null;
		this._offscreenColorBlends = null;
		this._offscreenAlphaBlends = null;
		this._drawableMultiplyColors = null;
		this._drawableScreenColors = null;
		this._offscreenMultiplyColors = null;
		this._offscreenScreenColors = null;
		this._userParameterRepeatDataList = new Array();
		this._userDrawableCullings = new Array();
		this._userOffscreenCullings = new Array();
		this._partsHierarchy = new Array();
		this._notExistPartId = /* @__PURE__ */ new Map();
		this._notExistParameterId = /* @__PURE__ */ new Map();
		this._notExistParameterValues = /* @__PURE__ */ new Map();
		this._notExistPartOpacities = /* @__PURE__ */ new Map();
		this._drawableColorBlends = new Array(model.drawables.count).fill(-1);
		this._drawableAlphaBlends = new Array(model.drawables.count).fill(-1);
		this._offscreenColorBlends = new Array(model.offscreens.count).fill(-1);
		this._offscreenAlphaBlends = new Array(model.offscreens.count).fill(-1);
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		this._model.release();
		this._model = null;
		this._drawableColorBlends = null;
		this._drawableAlphaBlends = null;
		this._offscreenColorBlends = null;
		this._offscreenAlphaBlends = null;
		this._drawableMultiplyColors = null;
		this._drawableScreenColors = null;
		this._offscreenMultiplyColors = null;
		this._offscreenScreenColors = null;
	}
};
var Live2DCubismFramework$8;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismModel = CubismModel;
})(Live2DCubismFramework$8 || (Live2DCubismFramework$8 = {}));
//#endregion
//#region cubism/src/rendering/cubismclippingmanager.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
var ColorChannelCount = 4;
var ClippingMaskMaxCountOnDefault = 36;
var ClippingMaskMaxCountOnMultiRenderTexture = 32;
var CubismClippingManager = class {
	/**
	* コンストラクタ
	*/
	constructor(clippingContextFactory) {
		this._renderTextureCount = 0;
		this._clippingMaskBufferSize = 256;
		this._clippingContextListForMask = new Array();
		this._clippingContextListForDraw = new Array();
		this._clippingContextListForOffscreen = new Array();
		this._tmpBoundsOnModel = new csmRect();
		this._tmpMatrix = new CubismMatrix44();
		this._tmpMatrixForMask = new CubismMatrix44();
		this._tmpMatrixForDraw = new CubismMatrix44();
		this._clearedMaskBufferFlags = new Array();
		this._clippingContexttConstructor = clippingContextFactory;
		this._channelColors = [
			new CubismTextureColor(1, 0, 0, 0),
			new CubismTextureColor(0, 1, 0, 0),
			new CubismTextureColor(0, 0, 1, 0),
			new CubismTextureColor(0, 0, 0, 1)
		];
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		for (let i = 0; i < this._clippingContextListForMask.length; i++) {
			if (this._clippingContextListForMask[i]) {
				this._clippingContextListForMask[i].release();
				this._clippingContextListForMask[i] = void 0;
			}
			this._clippingContextListForMask[i] = null;
		}
		this._clippingContextListForMask = null;
		for (let i = 0; i < this._clippingContextListForDraw.length; i++) this._clippingContextListForDraw[i] = null;
		this._clippingContextListForDraw = null;
		for (let i = 0; i < this._channelColors.length; i++) this._channelColors[i] = null;
		this._channelColors = null;
		if (this._clearedMaskBufferFlags != null) this._clearedMaskBufferFlags.length = 0;
		this._clearedMaskBufferFlags = null;
	}
	/**
	* マネージャの初期化処理
	* クリッピングマスクを使う描画オブジェクトの登録を行う
	* @param model モデルのインスタンス
	* @param renderTextureCount バッファの生成数
	*/
	initializeForDrawable(model, renderTextureCount) {
		if (renderTextureCount % 1 != 0) {
			CubismLogWarning("The number of render textures must be specified as an integer. The decimal point is rounded down and corrected to an integer.");
			renderTextureCount = ~~renderTextureCount;
		}
		if (renderTextureCount < 1) CubismLogWarning("The number of render textures must be an integer greater than or equal to 1. Set the number of render textures to 1.");
		this._renderTextureCount = renderTextureCount < 1 ? 1 : renderTextureCount;
		this._clearedMaskBufferFlags = new Array(this._renderTextureCount);
		this._clippingContextListForDraw.length = model.getDrawableCount();
		for (let i = 0; i < model.getDrawableCount(); i++) {
			if (model.getDrawableMaskCounts()[i] <= 0) {
				this._clippingContextListForDraw[i] = null;
				continue;
			}
			let clippingContext = this.findSameClip(model.getDrawableMasks()[i], model.getDrawableMaskCounts()[i]);
			if (clippingContext == null) {
				clippingContext = new this._clippingContexttConstructor(this, model.getDrawableMasks()[i], model.getDrawableMaskCounts()[i]);
				this._clippingContextListForMask.push(clippingContext);
			}
			clippingContext.addClippedDrawable(i);
			this._clippingContextListForDraw[i] = clippingContext;
		}
	}
	/**
	* オフスクリーン用の初期化処理
	*
	* @param model モデルのインスタンス
	* @param maskBufferCount オフスクリーン用のマスクバッファの数
	*/
	initializeForOffscreen(model, maskBufferCount) {
		this._renderTextureCount = maskBufferCount;
		this._clearedMaskBufferFlags.length = this._renderTextureCount;
		for (let i = 0; i < this._renderTextureCount; ++i) this._clearedMaskBufferFlags[i] = false;
		this._clippingContextListForOffscreen.length = model.getOffscreenCount();
		for (let i = 0; i < model.getOffscreenCount(); ++i) {
			if (model.getOffscreenMaskCounts()[i] <= 0) {
				this._clippingContextListForOffscreen.push(null);
				continue;
			}
			let cc = this.findSameClip(model.getOffscreenMasks()[i], model.getOffscreenMaskCounts()[i]);
			if (cc == null) {
				cc = new this._clippingContexttConstructor(this, model.getOffscreenMasks()[i], model.getOffscreenMaskCounts()[i]);
				this._clippingContextListForMask.push(cc);
			}
			cc.addClippedOffscreen(i);
			this._clippingContextListForOffscreen[i] = cc;
		}
	}
	/**
	* 既にマスクを作っているかを確認
	* 作っている様であれば該当するクリッピングマスクのインスタンスを返す
	* 作っていなければNULLを返す
	* @param drawableMasks 描画オブジェクトをマスクする描画オブジェクトのリスト
	* @param drawableMaskCounts 描画オブジェクトをマスクする描画オブジェクトの数
	* @return 該当するクリッピングマスクが存在すればインスタンスを返し、なければNULLを返す
	*/
	findSameClip(drawableMasks, drawableMaskCounts) {
		for (let i = 0; i < this._clippingContextListForMask.length; i++) {
			const clippingContext = this._clippingContextListForMask[i];
			const count = clippingContext._clippingIdCount;
			if (count != drawableMaskCounts) continue;
			let sameCount = 0;
			for (let j = 0; j < count; j++) {
				const clipId = clippingContext._clippingIdList[j];
				for (let k = 0; k < count; k++) if (drawableMasks[k] == clipId) {
					sameCount++;
					break;
				}
			}
			if (sameCount == count) return clippingContext;
		}
		return null;
	}
	/**
	* 高精細マスク処理用の行列を計算する
	* @param model モデルのインスタンス
	* @param isRightHanded 処理が右手系であるか
	*/
	setupMatrixForHighPrecision(model, isRightHanded) {
		let usingClipCount = 0;
		for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
			const cc = this._clippingContextListForMask[clipIndex];
			this.calcClippedDrawableTotalBounds(model, cc);
			if (cc._isUsing) usingClipCount++;
		}
		if (usingClipCount > 0) {
			this.setupLayoutBounds(0);
			if (this._clearedMaskBufferFlags.length != this._renderTextureCount) {
				this._clearedMaskBufferFlags.length = this._renderTextureCount;
				for (let i = 0; i < this._renderTextureCount; i++) this._clearedMaskBufferFlags[i] = false;
			} else for (let i = 0; i < this._renderTextureCount; i++) this._clearedMaskBufferFlags[i] = false;
			for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
				const clipContext = this._clippingContextListForMask[clipIndex];
				const allClippedDrawRect = clipContext._allClippedDrawRect;
				const layoutBoundsOnTex01 = clipContext._layoutBounds;
				const margin = .05;
				let scaleX = 0;
				let scaleY = 0;
				const ppu = model.getPixelsPerUnit();
				const maskPixelSize = clipContext.getClippingManager().getClippingMaskBufferSize();
				const physicalMaskWidth = layoutBoundsOnTex01.width * maskPixelSize;
				const physicalMaskHeight = layoutBoundsOnTex01.height * maskPixelSize;
				this._tmpBoundsOnModel.setRect(allClippedDrawRect);
				if (this._tmpBoundsOnModel.width * ppu > physicalMaskWidth) {
					this._tmpBoundsOnModel.expand(allClippedDrawRect.width * margin, 0);
					scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
				} else scaleX = ppu / physicalMaskWidth;
				if (this._tmpBoundsOnModel.height * ppu > physicalMaskHeight) {
					this._tmpBoundsOnModel.expand(0, allClippedDrawRect.height * margin);
					scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
				} else scaleY = ppu / physicalMaskHeight;
				this.createMatrixForMask(isRightHanded, layoutBoundsOnTex01, scaleX, scaleY);
				clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
				clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
			}
		}
	}
	/**
	* オフスクリーンの高精細マスク処理用の行列を計算する
	*
	* @param model モデルのインスタンス
	* @param isRightHanded 処理が右手系であるか
	* @param mvp モデルビュー投影行列
	*/
	setupMatrixForOffscreenHighPrecision(model, isRightHanded, mvp) {
		let usingClipCount = 0;
		for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
			const cc = this._clippingContextListForMask[clipIndex];
			this.calcClippedOffscreenTotalBounds(model, cc);
			if (cc._isUsing) usingClipCount++;
		}
		if (usingClipCount <= 0) return;
		this.setupLayoutBounds(0);
		if (this._clearedMaskBufferFlags.length != this._renderTextureCount) {
			this._clearedMaskBufferFlags.length = this._renderTextureCount;
			for (let i = 0; i < this._renderTextureCount; ++i) this._clearedMaskBufferFlags[i] = false;
		} else for (let i = 0; i < this._renderTextureCount; ++i) this._clearedMaskBufferFlags[i] = false;
		for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
			const clipContext = this._clippingContextListForMask[clipIndex];
			const allClippedDrawRect = clipContext._allClippedDrawRect;
			const layoutBoundsOnTex01 = clipContext._layoutBounds;
			const margin = .05;
			let scaleX = 0;
			let scaleY = 0;
			const ppu = model.getPixelsPerUnit();
			const maskPixel = clipContext.getClippingManager().getClippingMaskBufferSize();
			const physicalMaskWidth = layoutBoundsOnTex01.width * maskPixel;
			const physicalMaskHeight = layoutBoundsOnTex01.height * maskPixel;
			this._tmpBoundsOnModel.setRect(allClippedDrawRect);
			if (this._tmpBoundsOnModel.width * ppu > physicalMaskWidth) {
				this._tmpBoundsOnModel.expand(allClippedDrawRect.width * margin, 0);
				scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
			} else scaleX = ppu / physicalMaskWidth;
			if (this._tmpBoundsOnModel.height * ppu > physicalMaskHeight) {
				this._tmpBoundsOnModel.expand(0, allClippedDrawRect.height * margin);
				scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
			} else scaleY = ppu / physicalMaskHeight;
			this.createMatrixForMask(isRightHanded, layoutBoundsOnTex01, scaleX, scaleY);
			clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
			clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
			const invertMvp = mvp.getInvert();
			clipContext._matrixForDraw.multiplyByMatrix(invertMvp);
		}
	}
	/**
	* マスクを使う描画オブジェクトの全体の矩形を計算する。
	*
	* @param model モデルのインスタンス
	* @param clippingContext クリッピングコンテキスト
	*/
	calcClippedOffscreenTotalBounds(model, clippingContext) {
		let clippedDrawTotalMinX = Number.MAX_VALUE, clippedDrawTotalMinY = Number.MAX_VALUE;
		let clippedDrawTotalMaxX = -Number.MAX_VALUE, clippedDrawTotalMaxY = -Number.MAX_VALUE;
		const clippedOffscreenCount = clippingContext._clippedOffscreenIndexList.length;
		const clippedOffscreenChildDrawableIndexList = new Array();
		for (let clippedOffscreenIndex = 0; clippedOffscreenIndex < clippedOffscreenCount; clippedOffscreenIndex++) {
			const offscreenIndex = clippingContext._clippedOffscreenIndexList[clippedOffscreenIndex];
			this.getOffscreenChildDrawableIndexList(model, offscreenIndex, clippedOffscreenChildDrawableIndexList);
		}
		const childDrawableCount = clippedOffscreenChildDrawableIndexList.length;
		for (let childDrawableIndex = 0; childDrawableIndex < childDrawableCount; childDrawableIndex++) {
			const drawableVertexCount = model.getDrawableVertexCount(clippedOffscreenChildDrawableIndexList[childDrawableIndex]);
			const drawableVertexes = model.getDrawableVertices(clippedOffscreenChildDrawableIndexList[childDrawableIndex]);
			let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE;
			let maxX = -Number.MAX_VALUE, maxY = -Number.MAX_VALUE;
			const loop = drawableVertexCount * Constant.vertexStep;
			for (let pi = Constant.vertexOffset; pi < loop; pi += Constant.vertexStep) {
				const x = drawableVertexes[pi];
				const y = drawableVertexes[pi + 1];
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
			if (minX == Number.MAX_VALUE) continue;
			if (minX < clippedDrawTotalMinX) clippedDrawTotalMinX = minX;
			if (minY < clippedDrawTotalMinY) clippedDrawTotalMinY = minY;
			if (maxX > clippedDrawTotalMaxX) clippedDrawTotalMaxX = maxX;
			if (maxY > clippedDrawTotalMaxY) clippedDrawTotalMaxY = maxY;
		}
		if (clippedDrawTotalMinX == Number.MAX_VALUE) {
			clippingContext._allClippedDrawRect.x = 0;
			clippingContext._allClippedDrawRect.y = 0;
			clippingContext._allClippedDrawRect.width = 0;
			clippingContext._allClippedDrawRect.height = 0;
			clippingContext._isUsing = false;
		} else {
			clippingContext._isUsing = true;
			const w = clippedDrawTotalMaxX - clippedDrawTotalMinX;
			const h = clippedDrawTotalMaxY - clippedDrawTotalMinY;
			clippingContext._allClippedDrawRect.x = clippedDrawTotalMinX;
			clippingContext._allClippedDrawRect.y = clippedDrawTotalMinY;
			clippingContext._allClippedDrawRect.width = w;
			clippingContext._allClippedDrawRect.height = h;
		}
	}
	/**
	* マスクを使う描画オブジェクトの全体の矩形を計算する。
	*
	* @param model モデルのインスタンス
	* @param offscreenIndex オフスクリーンのインデックス
	* @param childDrawableIndexList オフスクリーンの子Drawableのインデックスリスト
	*/
	getOffscreenChildDrawableIndexList(model, offscreenIndex, childDrawableIndexList) {
		const ownerIndex = model.getOffscreenOwnerIndices()[offscreenIndex];
		this.getPartChildDrawableIndexList(model, ownerIndex, childDrawableIndexList);
	}
	/**
	* パーツの子Drawableのインデックスリストを取得する。
	*
	* @param model モデルのインスタンス
	* @param partIndex パーツのインデックス
	* @param childDrawableIndexList パーツの子Drawableのインデックスリスト
	*/
	getPartChildDrawableIndexList(model, partIndex, childDrawableIndexList) {
		const childDrawObjects = model.getPartsHierarchy()[partIndex].childDrawObjects;
		childDrawableIndexList.push(...childDrawObjects.drawableIndices);
		for (let i = 0; i < childDrawObjects.offscreenIndices.length; ++i) this.getOffscreenChildDrawableIndexList(model, childDrawObjects.offscreenIndices[i], childDrawableIndexList);
	}
	/**
	* マスク作成・描画用の行列を作成する。
	* @param isRightHanded 座標を右手系として扱うかを指定
	* @param layoutBoundsOnTex01 マスクを収める領域
	* @param scaleX 描画オブジェクトの伸縮率
	* @param scaleY 描画オブジェクトの伸縮率
	*/
	createMatrixForMask(isRightHanded, layoutBoundsOnTex01, scaleX, scaleY) {
		this._tmpMatrix.loadIdentity();
		this._tmpMatrix.translateRelative(-1, -1);
		this._tmpMatrix.scaleRelative(2, 2);
		this._tmpMatrix.translateRelative(layoutBoundsOnTex01.x, layoutBoundsOnTex01.y);
		this._tmpMatrix.scaleRelative(scaleX, scaleY);
		this._tmpMatrix.translateRelative(-this._tmpBoundsOnModel.x, -this._tmpBoundsOnModel.y);
		this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());
		this._tmpMatrix.loadIdentity();
		this._tmpMatrix.translateRelative(layoutBoundsOnTex01.x, layoutBoundsOnTex01.y * (isRightHanded ? -1 : 1));
		this._tmpMatrix.scaleRelative(scaleX, scaleY * (isRightHanded ? -1 : 1));
		this._tmpMatrix.translateRelative(-this._tmpBoundsOnModel.x, -this._tmpBoundsOnModel.y);
		this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
	}
	/**
	* クリッピングコンテキストを配置するレイアウト
	* 指定された数のレンダーテクスチャを極力いっぱいに使ってマスクをレイアウトする
	* マスクグループの数が4以下ならRGBA各チャンネルに一つずつマスクを配置し、5以上6以下ならRGBAを2,2,1,1と配置する。
	*
	* @param usingClipCount 配置するクリッピングコンテキストの数
	*/
	setupLayoutBounds(usingClipCount) {
		const useClippingMaskMaxCount = this._renderTextureCount <= 1 ? ClippingMaskMaxCountOnDefault : ClippingMaskMaxCountOnMultiRenderTexture * this._renderTextureCount;
		if (usingClipCount <= 0 || usingClipCount > useClippingMaskMaxCount) {
			if (usingClipCount > useClippingMaskMaxCount) CubismLogError("not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}", usingClipCount - useClippingMaskMaxCount, this._renderTextureCount, usingClipCount);
			for (let index = 0; index < this._clippingContextListForMask.length; index++) {
				const clipContext = this._clippingContextListForMask[index];
				clipContext._layoutChannelIndex = 0;
				clipContext._layoutBounds.x = 0;
				clipContext._layoutBounds.y = 0;
				clipContext._layoutBounds.width = 1;
				clipContext._layoutBounds.height = 1;
				clipContext._bufferIndex = 0;
			}
			return;
		}
		const layoutCountMaxValue = this._renderTextureCount <= 1 ? 9 : 8;
		let countPerSheetDiv = usingClipCount / this._renderTextureCount;
		const reduceLayoutTextureCount = usingClipCount % this._renderTextureCount;
		countPerSheetDiv = Math.ceil(countPerSheetDiv);
		let divCount = countPerSheetDiv / ColorChannelCount;
		const modCount = countPerSheetDiv % ColorChannelCount;
		divCount = ~~divCount;
		let curClipIndex = 0;
		for (let renderTextureIndex = 0; renderTextureIndex < this._renderTextureCount; renderTextureIndex++) for (let channelIndex = 0; channelIndex < ColorChannelCount; channelIndex++) {
			let layoutCount = divCount + (channelIndex < modCount ? 1 : 0);
			const checkChannelIndex = modCount + (divCount < 1 ? -1 : 0);
			if (channelIndex == checkChannelIndex && reduceLayoutTextureCount > 0) layoutCount -= !(renderTextureIndex < reduceLayoutTextureCount) ? 1 : 0;
			if (layoutCount == 0) {} else if (layoutCount == 1) {
				const clipContext = this._clippingContextListForMask[curClipIndex++];
				clipContext._layoutChannelIndex = channelIndex;
				clipContext._layoutBounds.x = 0;
				clipContext._layoutBounds.y = 0;
				clipContext._layoutBounds.width = 1;
				clipContext._layoutBounds.height = 1;
				clipContext._bufferIndex = renderTextureIndex;
			} else if (layoutCount == 2) for (let i = 0; i < layoutCount; i++) {
				let xpos = i % 2;
				xpos = ~~xpos;
				const cc = this._clippingContextListForMask[curClipIndex++];
				cc._layoutChannelIndex = channelIndex;
				cc._layoutBounds.x = xpos * .5;
				cc._layoutBounds.y = 0;
				cc._layoutBounds.width = .5;
				cc._layoutBounds.height = 1;
				cc._bufferIndex = renderTextureIndex;
			}
			else if (layoutCount <= 4) for (let i = 0; i < layoutCount; i++) {
				let xpos = i % 2;
				let ypos = i / 2;
				xpos = ~~xpos;
				ypos = ~~ypos;
				const cc = this._clippingContextListForMask[curClipIndex++];
				cc._layoutChannelIndex = channelIndex;
				cc._layoutBounds.x = xpos * .5;
				cc._layoutBounds.y = ypos * .5;
				cc._layoutBounds.width = .5;
				cc._layoutBounds.height = .5;
				cc._bufferIndex = renderTextureIndex;
			}
			else if (layoutCount <= layoutCountMaxValue) for (let i = 0; i < layoutCount; i++) {
				let xpos = i % 3;
				let ypos = i / 3;
				xpos = ~~xpos;
				ypos = ~~ypos;
				const cc = this._clippingContextListForMask[curClipIndex++];
				cc._layoutChannelIndex = channelIndex;
				cc._layoutBounds.x = xpos / 3;
				cc._layoutBounds.y = ypos / 3;
				cc._layoutBounds.width = 1 / 3;
				cc._layoutBounds.height = 1 / 3;
				cc._bufferIndex = renderTextureIndex;
			}
			else {
				CubismLogError("not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}", usingClipCount - useClippingMaskMaxCount, this._renderTextureCount, usingClipCount);
				for (let index = 0; index < layoutCount; index++) {
					const cc = this._clippingContextListForMask[curClipIndex++];
					cc._layoutChannelIndex = 0;
					cc._layoutBounds.x = 0;
					cc._layoutBounds.y = 0;
					cc._layoutBounds.width = 1;
					cc._layoutBounds.height = 1;
					cc._bufferIndex = 0;
				}
			}
		}
	}
	/**
	* マスクされる描画オブジェクト群全体を囲む矩形（モデル座標系）を計算する
	* @param model モデルのインスタンス
	* @param clippingContext クリッピングマスクのコンテキスト
	*/
	calcClippedDrawableTotalBounds(model, clippingContext) {
		let clippedDrawTotalMinX = Number.MAX_VALUE;
		let clippedDrawTotalMinY = Number.MAX_VALUE;
		let clippedDrawTotalMaxX = Number.MIN_VALUE;
		let clippedDrawTotalMaxY = Number.MIN_VALUE;
		const clippedDrawCount = clippingContext._clippedDrawableIndexList.length;
		for (let clippedDrawableIndex = 0; clippedDrawableIndex < clippedDrawCount; clippedDrawableIndex++) {
			const drawableIndex = clippingContext._clippedDrawableIndexList[clippedDrawableIndex];
			const drawableVertexCount = model.getDrawableVertexCount(drawableIndex);
			const drawableVertexes = model.getDrawableVertices(drawableIndex);
			let minX = Number.MAX_VALUE;
			let minY = Number.MAX_VALUE;
			let maxX = -Number.MAX_VALUE;
			let maxY = -Number.MAX_VALUE;
			const loop = drawableVertexCount * Constant.vertexStep;
			for (let pi = Constant.vertexOffset; pi < loop; pi += Constant.vertexStep) {
				const x = drawableVertexes[pi];
				const y = drawableVertexes[pi + 1];
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
			if (minX == Number.MAX_VALUE) continue;
			if (minX < clippedDrawTotalMinX) clippedDrawTotalMinX = minX;
			if (minY < clippedDrawTotalMinY) clippedDrawTotalMinY = minY;
			if (maxX > clippedDrawTotalMaxX) clippedDrawTotalMaxX = maxX;
			if (maxY > clippedDrawTotalMaxY) clippedDrawTotalMaxY = maxY;
			if (clippedDrawTotalMinX == Number.MAX_VALUE) {
				clippingContext._allClippedDrawRect.x = 0;
				clippingContext._allClippedDrawRect.y = 0;
				clippingContext._allClippedDrawRect.width = 0;
				clippingContext._allClippedDrawRect.height = 0;
				clippingContext._isUsing = false;
			} else {
				clippingContext._isUsing = true;
				const w = clippedDrawTotalMaxX - clippedDrawTotalMinX;
				const h = clippedDrawTotalMaxY - clippedDrawTotalMinY;
				clippingContext._allClippedDrawRect.x = clippedDrawTotalMinX;
				clippingContext._allClippedDrawRect.y = clippedDrawTotalMinY;
				clippingContext._allClippedDrawRect.width = w;
				clippingContext._allClippedDrawRect.height = h;
			}
		}
	}
	/**
	* 画面描画に使用するクリッピングマスクのリストを取得する
	* @return 画面描画に使用するクリッピングマスクのリスト
	*/
	getClippingContextListForDraw() {
		return this._clippingContextListForDraw;
	}
	getClippingContextListForOffscreen() {
		return this._clippingContextListForOffscreen;
	}
	/**
	* クリッピングマスクバッファのサイズを取得する
	* @return クリッピングマスクバッファのサイズ
	*/
	getClippingMaskBufferSize() {
		return this._clippingMaskBufferSize;
	}
	/**
	* このバッファのレンダーテクスチャの枚数を取得する
	* @return このバッファのレンダーテクスチャの枚数
	*/
	getRenderTextureCount() {
		return this._renderTextureCount;
	}
	/**
	* カラーチャンネル（RGBA）のフラグを取得する
	* @param channelNo カラーチャンネル（RGBA）の番号（0:R, 1:G, 2:B, 3:A）
	*/
	getChannelFlagAsColor(channelNo) {
		return this._channelColors[channelNo];
	}
	/**
	* クリッピングマスクバッファのサイズを設定する
	* @param size クリッピングマスクバッファのサイズ
	*/
	setClippingMaskBufferSize(size) {
		this._clippingMaskBufferSize = size;
	}
};
//#endregion
//#region cubism/src/rendering/cubismrendertarget_webgl.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* WebGL用オフスクリーンサーフェス
* マスクの描画に必要なフレームバッファなどを管理する。
*/
var CubismRenderTarget_WebGL = class {
	/**
	* WebGL2RenderingContext.blitFramebuffer() でバッファのコピーを行う。
	*
	* @param src コピー元のオフスクリーンサーフェス
	* @param dst コピー先のオフスクリーンサーフェス
	*/
	static copyBuffer(gl, src, dst) {
		if (src == null || dst == null) return;
		if (!(gl instanceof WebGL2RenderingContext)) throw new Error("WebGL2RenderingContext is required for buffer copy.");
		const previousFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, src.getRenderTexture());
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dst.getRenderTexture());
		gl.blitFramebuffer(0, 0, src.getBufferWidth(), src.getBufferHeight(), 0, 0, dst.getBufferWidth(), dst.getBufferHeight(), gl.COLOR_BUFFER_BIT, gl.NEAREST);
		gl.bindFramebuffer(gl.FRAMEBUFFER, previousFramebuffer);
	}
	/**
	* 描画を開始する。
	*
	* @param restoreFbo EndDraw時に復元するFBOを指定する。nullを指定すると、beginDraw時に現在のFBOを記憶しておく。
	*/
	beginDraw(restoreFbo = null) {
		if (this._renderTexture == null) {
			console.error("_renderTexture is null");
			return;
		}
		if (restoreFbo == null) this._oldFbo = this._gl.getParameter(this._gl.FRAMEBUFFER_BINDING);
		else this._oldFbo = restoreFbo;
		this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._renderTexture);
	}
	/**
	* 描画を終了し、バックバッファのサーフェイスを復元する。
	*/
	endDraw() {
		this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._oldFbo);
	}
	/**
	* バインドされているカラーバッファのクリアを行う。
	*
	* @param r 赤の成分 (0.0 - 1.0)
	* @param g 緑の成分 (0.0 - 1.0)
	* @param b 青の成分 (0.0 - 1.0)
	* @param a アルファの成分 (0.0 - 1.0)
	*/
	clear(r, g, b, a) {
		this._gl.clearColor(r, g, b, a);
		this._gl.clear(this._gl.COLOR_BUFFER_BIT);
	}
	/**
	* オフスクリーンサーフェスを作成する。
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*          NOTE: Cubism 5.3以降のモデルが使用される場合はWebGL2RenderingContextを使用すること。
	* @param displayBufferWidth オフスクリーンサーフェスの幅
	* @param displayBufferHeight オフスクリーンサーフェスの高さ
	* @param previousFramebuffer 前のフレームバッファ
	*
	* @return 成功した場合はtrue、失敗した場合はfalse
	*/
	createRenderTarget(gl, displayBufferWidth, displayBufferHeight, previousFramebuffer) {
		this.destroyRenderTarget();
		this._colorBuffer = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this._colorBuffer);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, displayBufferWidth, displayBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.bindTexture(gl.TEXTURE_2D, null);
		const ret = gl.createFramebuffer();
		if (ret == null) {
			CubismLogError("Failed to create framebuffer");
			return false;
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, ret);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._colorBuffer, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
			CubismLogError("Framebuffer is not complete");
			gl.bindFramebuffer(gl.FRAMEBUFFER, previousFramebuffer);
			gl.deleteFramebuffer(ret);
			this.destroyRenderTarget();
			return false;
		}
		this._renderTexture = ret;
		this._bufferWidth = displayBufferWidth;
		this._bufferHeight = displayBufferHeight;
		this._gl = gl;
		return true;
	}
	/**
	* レンダーターゲットを破棄する。
	*/
	destroyRenderTarget() {
		if (this._colorBuffer) {
			this._gl.bindTexture(this._gl.TEXTURE_2D, null);
			this._gl.deleteTexture(this._colorBuffer);
			this._colorBuffer = null;
		}
		if (this._renderTexture) {
			this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
			this._gl.deleteFramebuffer(this._renderTexture);
			this._renderTexture = null;
		}
	}
	/**
	* WebGLのコンテキストを取得する。
	*
	* @return WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	getGL() {
		return this._gl;
	}
	/**
	* レンダーテクスチャを取得する。
	*
	* @return WebGLFramebuffer
	*/
	getRenderTexture() {
		return this._renderTexture;
	}
	/**
	* カラーバッファを取得する。
	*
	* @return WebGLTexture
	*/
	getColorBuffer() {
		return this._colorBuffer;
	}
	/**
	* カラーバッファの幅を取得する。
	*
	* @return カラーバッファの幅
	*/
	getBufferWidth() {
		return this._bufferWidth;
	}
	/**
	* カラーバッファの高さを取得する。
	*
	* @return カラーバッファの高さ
	*/
	getBufferHeight() {
		return this._bufferHeight;
	}
	/**
	* オフスクリーンサーフェスが有効かどうかを確認する。
	*
	* @return 有効な場合はtrue、無効な場合はfalse
	*/
	isValid() {
		return this._renderTexture != null;
	}
	/**
	* 以前のフレームバッファを取得する。
	*
	* @return 以前のフレームバッファ
	*/
	getOldFBO() {
		return this._oldFbo;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		this._gl = null;
		this._colorBuffer = null;
		this._renderTexture = null;
		this._bufferWidth = 0;
		this._bufferHeight = 0;
		this._oldFbo = null;
	}
};
var Live2DCubismFramework$7;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismOffscreenSurface_WebGL = CubismRenderTarget_WebGL;
})(Live2DCubismFramework$7 || (Live2DCubismFramework$7 = {}));
//#endregion
//#region cubism/src/rendering/cubismshader_webgl.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
var VertShaderSrcPath = "vertshadersrc.vert";
var VertShaderSrcMaskedPath = "vertshadersrcmasked.vert";
var VertShaderSrcSetupMaskPath = "vertshadersrcsetupmask.vert";
var FragShaderSrcSetupMaskPath = "fragshadersrcsetupmask.frag";
var FragShaderSrcPremultipliedAlphaPath = "fragshadersrcpremultipliedalpha.frag";
var FragShaderSrcMaskPremultipliedAlphaPath = "fragshadersrcmaskpremultipliedalpha.frag";
var FragShaderSrcMaskInvertedPremultipliedAlphaPath = "fragshadersrcmaskinvertedpremultipliedalpha.frag";
var VertShaderSrcCopyPath = "vertshadersrccopy.vert";
var FragShaderSrcCopyPath = "fragshadersrccopy.frag";
var FragShaderSrcColorBlendPath = "fragshadersrccolorblend.frag";
var FragShaderSrcAlphaBlendPath = "fragshadersrcalphablend.frag";
var VertShaderSrcBlendPath = "vertshadersrcblend.vert";
var FragShaderSrcBlendPath = "fragshadersrcpremultipliedalphablend.frag";
var ColorBlendPrefix = "ColorBlend_";
var AlphaBlendPrefix = "AlphaBlend_";
var s_instance;
var s_renderTargetVertexArray = new Float32Array([
	-1,
	-1,
	1,
	-1,
	-1,
	1,
	1,
	1
]);
var s_renderTargetUvArray = new Float32Array([
	0,
	0,
	1,
	0,
	0,
	1,
	1,
	1
]);
var s_renderTargetReverseUvArray = new Float32Array([
	0,
	1,
	1,
	1,
	0,
	0,
	1,
	0
]);
/**
* WebGL用のシェーダープログラムを生成・破棄するクラス
*/
var CubismShader_WebGL = class {
	/**
	* 非同期でシェーダーをパスから読み込む
	*
	* @param url シェーダーのURL
	*
	* @return シェーダーのソースコード
	*/
	loadShader(url) {
		return _asyncToGenerator(function* () {
			return yield (yield fetch(url)).text();
		})();
	}
	/**
	* ブレンドモード用のシェーダーを読み込む
	*/
	loadShaders() {
		var _this = this;
		return _asyncToGenerator(function* () {
			var _this$_shaderPath;
			const shaderDir = (_this$_shaderPath = _this._shaderPath) !== null && _this$_shaderPath !== void 0 ? _this$_shaderPath : _this._defaultShaderPath;
			const shaderFiles = [
				{
					path: shaderDir + VertShaderSrcPath,
					prop: "_vertShaderSrc"
				},
				{
					path: shaderDir + VertShaderSrcMaskedPath,
					prop: "_vertShaderSrcMasked"
				},
				{
					path: shaderDir + VertShaderSrcSetupMaskPath,
					prop: "_vertShaderSrcSetupMask"
				},
				{
					path: shaderDir + FragShaderSrcSetupMaskPath,
					prop: "_fragShaderSrcSetupMask"
				},
				{
					path: shaderDir + FragShaderSrcPremultipliedAlphaPath,
					prop: "_fragShaderSrcPremultipliedAlpha"
				},
				{
					path: shaderDir + FragShaderSrcMaskPremultipliedAlphaPath,
					prop: "_fragShaderSrcMaskPremultipliedAlpha"
				},
				{
					path: shaderDir + FragShaderSrcMaskInvertedPremultipliedAlphaPath,
					prop: "_fragShaderSrcMaskInvertedPremultipliedAlpha"
				},
				{
					path: shaderDir + VertShaderSrcCopyPath,
					prop: "_vertShaderSrcCopy"
				},
				{
					path: shaderDir + FragShaderSrcCopyPath,
					prop: "_fragShaderSrcCopy"
				},
				{
					path: shaderDir + FragShaderSrcColorBlendPath,
					prop: "_fragShaderSrcColorBlend"
				},
				{
					path: shaderDir + FragShaderSrcAlphaBlendPath,
					prop: "_fragShaderSrcAlphaBlend"
				},
				{
					path: shaderDir + VertShaderSrcBlendPath,
					prop: "_vertShaderSrcBlend"
				},
				{
					path: shaderDir + FragShaderSrcBlendPath,
					prop: "_fragShaderSrcBlend"
				}
			];
			(yield Promise.all(shaderFiles.map((file) => _this.loadShader(file.path).then((data) => ({
				prop: file.prop,
				data
			})).catch((error) => {
				console.error(`Error loading ${file.path} shader:`, error);
				return {
					prop: file.prop,
					data: ""
				};
			})))).forEach((result) => {
				_this[result.prop] = result.data;
			});
		})();
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		this._shaderSets = new Array();
		this._isShaderLoading = false;
		this._isShaderLoaded = false;
		this._colorBlendMap = /* @__PURE__ */ new Map();
		this._colorBlendValues = new Array();
		const colorBlendKeys = Object.keys(CubismColorBlend);
		const colorBlendRawValues = Object.keys(CubismColorBlend).map((k) => CubismColorBlend[k]);
		for (let i = 0; i < colorBlendKeys.length; i++) {
			const colorBlendKey = colorBlendKeys[i];
			if (colorBlendKey.includes(ColorBlendPrefix)) {
				const blendModeName = colorBlendKey.slice(11);
				const colorBlendNumber = parseInt(colorBlendRawValues[i].toString());
				this._colorBlendMap.set(colorBlendNumber, blendModeName);
				this._colorBlendValues.push(colorBlendNumber);
			}
		}
		this._alphaBlendMap = /* @__PURE__ */ new Map();
		this._alphaBlendValues = new Array();
		const alphaBlendKeys = Object.keys(CubismAlphaBlend);
		const alphaBlendRawValues = Object.keys(CubismAlphaBlend).map((k) => CubismAlphaBlend[k]);
		for (let i = 0; i < alphaBlendKeys.length; i++) {
			const alphaBlendKey = alphaBlendKeys[i];
			if (alphaBlendKey.includes(AlphaBlendPrefix)) {
				const blendModeName = alphaBlendKey.slice(11);
				const alphaBlendNumber = parseInt(alphaBlendRawValues[i].toString());
				this._alphaBlendMap.set(alphaBlendNumber, blendModeName);
				this._alphaBlendValues.push(alphaBlendNumber);
			}
		}
		this._blendShaderSetMap = /* @__PURE__ */ new Map();
		this._shaderCount = 11 + (this._colorBlendValues.length - 3) * (this._alphaBlendValues.length - 1) * 3;
		this._defaultShaderPath = "../../Framework/Shaders/WebGL/";
		this._shaderPath = this._defaultShaderPath;
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		this.releaseShaderProgram();
	}
	/**
	* 描画用のシェーダプログラムの一連のセットアップを実行する
	*
	* @param renderer レンダラー
	* @param model 描画対象のモデル
	* @param index 描画対象のメッシュのインデックス
	*/
	setupShaderProgramForDrawable(renderer, model, index) {
		if (!renderer.isPremultipliedAlpha()) CubismLogError("NoPremultipliedAlpha is not allowed");
		if (this._shaderSets.length == 0) this.generateShaders();
		if (this._isShaderLoaded == false) {
			CubismLogWarning("Shader program is not initialized.");
			return;
		}
		let srcColor;
		let dstColor;
		let srcAlpha;
		let dstAlpha;
		const masked = renderer.getClippingContextBufferForDrawable() != null;
		const invertedMask = model.getDrawableInvertedMaskBit(index);
		const offset = masked ? invertedMask ? 2 : 1 : 0;
		let shaderSet;
		let isUsingCompatible = true;
		if (model.isBlendModeEnabled()) {
			const colorBlendMode = model.getDrawableColorBlend(index);
			const alphaBlendMode = model.getDrawableAlphaBlend(index);
			if (colorBlendMode == CubismColorBlend.ColorBlend_None || alphaBlendMode == CubismAlphaBlend.AlphaBlend_None || colorBlendMode == CubismColorBlend.ColorBlend_Normal && alphaBlendMode == CubismAlphaBlend.AlphaBlend_Over) {
				shaderSet = this._shaderSets[1 + offset];
				srcColor = this.gl.ONE;
				dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
				srcAlpha = this.gl.ONE;
				dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
			} else switch (colorBlendMode) {
				case CubismColorBlend.ColorBlend_AddCompatible:
					shaderSet = this._shaderSets[4 + offset];
					srcColor = this.gl.ONE;
					dstColor = this.gl.ONE;
					srcAlpha = this.gl.ZERO;
					dstAlpha = this.gl.ONE;
					break;
				case CubismColorBlend.ColorBlend_MultiplyCompatible:
					shaderSet = this._shaderSets[7 + offset];
					srcColor = this.gl.DST_COLOR;
					dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
					srcAlpha = this.gl.ZERO;
					dstAlpha = this.gl.ONE;
					break;
				default:
					{
						const srcBuffer = renderer._currentOffscreen != null ? renderer._currentOffscreen : renderer.getModelRenderTarget(0);
						CubismRenderTarget_WebGL.copyBuffer(this.gl, srcBuffer, renderer.getModelRenderTarget(1));
						const baseShaderSetIndex = this._blendShaderSetMap.get(this._colorBlendMap.get(colorBlendMode) + this._alphaBlendMap.get(alphaBlendMode));
						shaderSet = this._shaderSets[baseShaderSetIndex + offset];
						srcColor = this.gl.ONE;
						dstColor = this.gl.ZERO;
						srcAlpha = this.gl.ONE;
						dstAlpha = this.gl.ZERO;
						isUsingCompatible = false;
					}
					break;
			}
		} else switch (model.getDrawableBlendMode(index)) {
			case CubismBlendMode.CubismBlendMode_Normal:
			default:
				shaderSet = this._shaderSets[1 + offset];
				srcColor = this.gl.ONE;
				dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
				srcAlpha = this.gl.ONE;
				dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
				break;
			case CubismBlendMode.CubismBlendMode_Additive:
				shaderSet = this._shaderSets[4 + offset];
				srcColor = this.gl.ONE;
				dstColor = this.gl.ONE;
				srcAlpha = this.gl.ZERO;
				dstAlpha = this.gl.ONE;
				break;
			case CubismBlendMode.CubismBlendMode_Multiplicative:
				shaderSet = this._shaderSets[7 + offset];
				srcColor = this.gl.DST_COLOR;
				dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
				srcAlpha = this.gl.ZERO;
				dstAlpha = this.gl.ONE;
				break;
		}
		this.gl.useProgram(shaderSet.shaderProgram);
		if (renderer._bufferData.vertex == null) renderer._bufferData.vertex = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
		const vertexArray = model.getDrawableVertices(index);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
		this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, 0, 0);
		if (renderer._bufferData.uv == null) renderer._bufferData.uv = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
		const uvArray = model.getDrawableVertexUvs(index);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
		this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
		if (masked) {
			this.gl.activeTexture(this.gl.TEXTURE1);
			const tex = renderer.getDrawableMaskBuffer(renderer.getClippingContextBufferForDrawable()._bufferIndex).getColorBuffer();
			this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
			this.gl.uniform1i(shaderSet.samplerTexture1Location, 1);
			this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, renderer.getClippingContextBufferForDrawable()._matrixForDraw.getArray());
			const channelIndex = renderer.getClippingContextBufferForDrawable()._layoutChannelIndex;
			const colorChannel = renderer.getClippingContextBufferForDrawable().getClippingManager().getChannelFlagAsColor(channelIndex);
			this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.r, colorChannel.g, colorChannel.b, colorChannel.a);
			if (model.isBlendModeEnabled()) this.gl.uniform1f(shaderSet.uniformInvertMaskFlagLocation, invertedMask ? 1 : 0);
		}
		const textureNo = model.getDrawableTextureIndex(index);
		const textureId = renderer.getBindedTextures().get(textureNo);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
		this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
		const matrix4x4 = renderer.getMvpMatrix();
		this.gl.uniformMatrix4fv(shaderSet.uniformMatrixLocation, false, matrix4x4.getArray());
		let baseColor = null;
		if (model.isBlendModeEnabled()) {
			const drawableOpacity = model.getDrawableOpacity(index);
			baseColor = new CubismTextureColor(drawableOpacity, drawableOpacity, drawableOpacity, drawableOpacity);
		} else baseColor = renderer.getModelColorWithOpacity(model.getDrawableOpacity(index));
		const multiplyAndScreenColor = model.getOverrideMultiplyAndScreenColor();
		const multiplyColor = multiplyAndScreenColor.getDrawableMultiplyColor(index);
		const screenColor = multiplyAndScreenColor.getDrawableScreenColor(index);
		this.gl.uniform4f(shaderSet.uniformBaseColorLocation, baseColor.r, baseColor.g, baseColor.b, baseColor.a);
		this.gl.uniform4f(shaderSet.uniformMultiplyColorLocation, multiplyColor.r, multiplyColor.g, multiplyColor.b, multiplyColor.a);
		this.gl.uniform4f(shaderSet.uniformScreenColorLocation, screenColor.r, screenColor.g, screenColor.b, screenColor.a);
		if (model.isBlendModeEnabled()) {
			this.gl.activeTexture(this.gl.TEXTURE2);
			if (!isUsingCompatible) {
				const tex = renderer.getModelRenderTarget(1).getColorBuffer();
				this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
				this.gl.uniform1i(shaderSet.samplerFrameBufferTextureLocation, 2);
			}
		}
		if (renderer._bufferData.index == null) renderer._bufferData.index = this.gl.createBuffer();
		const indexArray = model.getDrawableVertexIndices(index);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, renderer._bufferData.index);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.DYNAMIC_DRAW);
		this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
	}
	/**
	* オフスクリーン用のシェーダプログラムの一連のセットアップを実行する
	*
	* @param renderer レンダラー
	* @param model 描画対象のモデル
	* @param offscreen 描画対象のオフスクリーン
	*/
	setupShaderProgramForOffscreen(renderer, model, offscreen) {
		if (!renderer.isPremultipliedAlpha()) CubismLogError("NoPremultipliedAlpha is not allowed");
		if (this._shaderSets.length == 0) this.generateShaders();
		if (this._isShaderLoaded == false) {
			CubismLogWarning("Shader program is not initialized.");
			return;
		}
		let srcColor;
		let dstColor;
		let srcAlpha;
		let dstAlpha;
		const offscreenIndex = offscreen.getOffscreenIndex();
		const masked = renderer.getClippingContextBufferForOffscreen() != null;
		const invertedMask = model.getOffscreenInvertedMask(offscreenIndex);
		const offset = masked ? invertedMask ? 2 : 1 : 0;
		let shaderSet;
		let isUsingCompatible = true;
		const colorBlendMode = model.getOffscreenColorBlend(offscreenIndex);
		const alphaBlendMode = model.getOffscreenAlphaBlend(offscreenIndex);
		if (colorBlendMode == CubismColorBlend.ColorBlend_None || alphaBlendMode == CubismAlphaBlend.AlphaBlend_None || colorBlendMode == CubismColorBlend.ColorBlend_Normal && alphaBlendMode == CubismAlphaBlend.AlphaBlend_Over) {
			shaderSet = this._shaderSets[1 + offset];
			srcColor = this.gl.ONE;
			dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
			srcAlpha = this.gl.ONE;
			dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
		} else switch (colorBlendMode) {
			case CubismColorBlend.ColorBlend_AddCompatible:
				shaderSet = this._shaderSets[4 + offset];
				srcColor = this.gl.ONE;
				dstColor = this.gl.ONE;
				srcAlpha = this.gl.ZERO;
				dstAlpha = this.gl.ONE;
				break;
			case CubismColorBlend.ColorBlend_MultiplyCompatible:
				shaderSet = this._shaderSets[7 + offset];
				srcColor = this.gl.DST_COLOR;
				dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
				srcAlpha = this.gl.ZERO;
				dstAlpha = this.gl.ONE;
				break;
			default:
				{
					const srcBuffer = offscreen.getOldOffscreen() != null ? offscreen.getOldOffscreen() : renderer.getModelRenderTarget(0);
					CubismRenderTarget_WebGL.copyBuffer(this.gl, srcBuffer, renderer.getModelRenderTarget(1));
					const baseShaderSetIndex = this._blendShaderSetMap.get(this._colorBlendMap.get(colorBlendMode) + this._alphaBlendMap.get(alphaBlendMode));
					shaderSet = this._shaderSets[baseShaderSetIndex + offset];
					srcColor = this.gl.ONE;
					dstColor = this.gl.ZERO;
					srcAlpha = this.gl.ONE;
					dstAlpha = this.gl.ZERO;
					isUsingCompatible = false;
				}
				break;
		}
		this.gl.useProgram(shaderSet.shaderProgram);
		CubismRenderTarget_WebGL.copyBuffer(this.gl, offscreen, renderer.getModelRenderTarget(2));
		this.gl.activeTexture(this.gl.TEXTURE0);
		const tex0 = renderer.getModelRenderTarget(2).getColorBuffer();
		this.gl.bindTexture(this.gl.TEXTURE_2D, tex0);
		this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
		const matrix4x4 = new CubismMatrix44();
		matrix4x4.loadIdentity();
		this.gl.uniformMatrix4fv(shaderSet.uniformMatrixLocation, false, matrix4x4.getArray());
		const offscreenOpacity = model.getOffscreenOpacity(offscreenIndex);
		const baseColor = new CubismTextureColor(offscreenOpacity, offscreenOpacity, offscreenOpacity, offscreenOpacity);
		const multiplyAndScreenColor = model.getOverrideMultiplyAndScreenColor();
		const multiplyColor = multiplyAndScreenColor.getOffscreenMultiplyColor(offscreenIndex);
		const screenColor = multiplyAndScreenColor.getOffscreenScreenColor(offscreenIndex);
		this.gl.uniform4f(shaderSet.uniformBaseColorLocation, baseColor.r, baseColor.g, baseColor.b, baseColor.a);
		this.gl.uniform4f(shaderSet.uniformMultiplyColorLocation, multiplyColor.r, multiplyColor.g, multiplyColor.b, multiplyColor.a);
		this.gl.uniform4f(shaderSet.uniformScreenColorLocation, screenColor.r, screenColor.g, screenColor.b, screenColor.a);
		this.gl.activeTexture(this.gl.TEXTURE2);
		if (!isUsingCompatible) {
			const tex1 = renderer.getModelRenderTarget(1).getColorBuffer();
			this.gl.bindTexture(this.gl.TEXTURE_2D, tex1);
			this.gl.uniform1i(shaderSet.samplerFrameBufferTextureLocation, 2);
		}
		if (masked) {
			this.gl.activeTexture(this.gl.TEXTURE1);
			const tex2 = renderer.getOffscreenMaskBuffer(renderer.getClippingContextBufferForOffscreen()._bufferIndex).getColorBuffer();
			this.gl.bindTexture(this.gl.TEXTURE_2D, tex2);
			this.gl.uniform1i(shaderSet.samplerTexture1Location, 1);
			this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, renderer.getClippingContextBufferForOffscreen()._matrixForDraw.getArray());
			const channelIndex = renderer.getClippingContextBufferForOffscreen()._layoutChannelIndex;
			const colorChannel = renderer.getClippingContextBufferForOffscreen().getClippingManager().getChannelFlagAsColor(channelIndex);
			this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.r, colorChannel.g, colorChannel.b, colorChannel.a);
			if (model.isBlendModeEnabled()) this.gl.uniform1f(shaderSet.uniformInvertMaskFlagLocation, invertedMask ? 1 : 0);
		}
		if (!renderer._bufferData.vertex) renderer._bufferData.vertex = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetVertexArray, this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
		this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
		if (!renderer._bufferData.uv) renderer._bufferData.uv = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetReverseUvArray, this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
		this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
		this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
	}
	/**
	* マスク用のシェーダプログラムの一連のセットアップを実行する
	*
	* @param renderer レンダラー
	* @param model 描画対象のモデル
	* @param index 描画対象のメッシュのインデックス
	*/
	setupShaderProgramForMask(renderer, model, index) {
		if (!renderer.isPremultipliedAlpha()) CubismLogError("NoPremultipliedAlpha is not allowed");
		if (this._shaderSets.length == 0) this.generateShaders();
		if (this._isShaderLoaded == false) {
			CubismLogWarning("Shader program is not initialized.");
			return;
		}
		const shaderSet = this._shaderSets[0];
		this.gl.useProgram(shaderSet.shaderProgram);
		if (renderer._bufferData.vertex == null) renderer._bufferData.vertex = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
		const vertexArray = model.getDrawableVertices(index);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.DYNAMIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
		this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, 0, 0);
		if (renderer._bufferData.uv == null) renderer._bufferData.uv = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
		const textureNo = model.getDrawableTextureIndex(index);
		const textureId = renderer.getBindedTextures().get(textureNo);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, textureId);
		this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
		if (renderer._bufferData.uv == null) renderer._bufferData.uv = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
		const uvArray = model.getDrawableVertexUvs(index);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, uvArray, this.gl.DYNAMIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
		this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
		const channelIndex = renderer.getClippingContextBufferForMask()._layoutChannelIndex;
		const colorChannel = renderer.getClippingContextBufferForMask().getClippingManager().getChannelFlagAsColor(channelIndex);
		this.gl.uniform4f(shaderSet.uniformChannelFlagLocation, colorChannel.r, colorChannel.g, colorChannel.b, colorChannel.a);
		this.gl.uniformMatrix4fv(shaderSet.uniformClipMatrixLocation, false, renderer.getClippingContextBufferForMask()._matrixForMask.getArray());
		const rect = renderer.getClippingContextBufferForMask()._layoutBounds;
		this.gl.uniform4f(shaderSet.uniformBaseColorLocation, rect.x * 2 - 1, rect.y * 2 - 1, rect.getRight() * 2 - 1, rect.getBottom() * 2 - 1);
		const srcColor = this.gl.ZERO;
		const dstColor = this.gl.ONE_MINUS_SRC_COLOR;
		const srcAlpha = this.gl.ZERO;
		const dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
		if (renderer._bufferData.index == null) renderer._bufferData.index = this.gl.createBuffer();
		const indexArray = model.getDrawableVertexIndices(index);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, renderer._bufferData.index);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indexArray, this.gl.DYNAMIC_DRAW);
		this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
	}
	/**
	* オフスクリーンのレンダリングターゲット用のシェーダープログラムを設定する
	*
	* @param renderer レンダラー
	*/
	setupShaderProgramForOffscreenRenderTarget(renderer) {
		if (this._shaderSets.length == 0) this.generateShaders();
		if (this._isShaderLoaded == false) {
			CubismLogWarning("Shader program is not initialized.");
			return;
		}
		const baseColor = renderer.getModelColor();
		baseColor.r *= baseColor.a;
		baseColor.g *= baseColor.a;
		baseColor.b *= baseColor.a;
		this.copyTexture(renderer, baseColor);
	}
	/**
	* オフスクリーンのレンダリングターゲットの内容をコピーする
	*
	* @param renderer レンダラー
	* @param baseColor ベースカラー
	*/
	copyTexture(renderer, baseColor) {
		const srcColor = this.gl.ONE;
		const dstColor = this.gl.ONE_MINUS_SRC_ALPHA;
		const srcAlpha = this.gl.ONE;
		const dstAlpha = this.gl.ONE_MINUS_SRC_ALPHA;
		const shaderSet = this._shaderSets[10];
		this.gl.useProgram(shaderSet.shaderProgram);
		this.gl.uniform4f(shaderSet.uniformBaseColorLocation, baseColor.r, baseColor.g, baseColor.b, baseColor.a);
		this.gl.activeTexture(this.gl.TEXTURE0);
		const tex = renderer.getModelRenderTarget(0).getColorBuffer();
		this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
		this.gl.uniform1i(shaderSet.samplerTexture0Location, 0);
		if (!renderer._bufferData.vertex) renderer._bufferData.vertex = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.vertex);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetVertexArray, this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributePositionLocation);
		this.gl.vertexAttribPointer(shaderSet.attributePositionLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
		if (!renderer._bufferData.uv) renderer._bufferData.uv = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, renderer._bufferData.uv);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, s_renderTargetUvArray, this.gl.STATIC_DRAW);
		this.gl.enableVertexAttribArray(shaderSet.attributeTexCoordLocation);
		this.gl.vertexAttribPointer(shaderSet.attributeTexCoordLocation, 2, this.gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 2, 0);
		this.gl.blendFuncSeparate(srcColor, dstColor, srcAlpha, dstAlpha);
	}
	/**
	* シェーダープログラムを解放する
	*/
	releaseShaderProgram() {
		for (let i = 0; i < this._shaderSets.length; i++) {
			this.gl.deleteProgram(this._shaderSets[i].shaderProgram);
			this._shaderSets[i].shaderProgram = 0;
			this._shaderSets[i] = void 0;
			this._shaderSets[i] = null;
		}
	}
	/**
	* シェーダープログラムを初期化する
	*
	* @param vertShaderSrc 頂点シェーダのソース
	* @param fragShaderSrc フラグメントシェーダのソース
	*/
	generateShaders() {
		if (this._isShaderLoading) return;
		this._isShaderLoading = true;
		this._isShaderLoaded = false;
		this._shaderSets.length = this._shaderCount;
		for (let i = 0; i < this._shaderCount; i++) this._shaderSets[i] = new CubismShaderSet();
		this.loadShaders().then(() => {
			this.registerShader();
			this.registerBlendShader();
			this._isShaderLoading = false;
			this._isShaderLoaded = true;
		}).catch((error) => {
			this._isShaderLoading = false;
			console.error("Failed to load shaders:", error);
		});
	}
	/**
	* シェーダープログラムを登録する
	*/
	registerShader() {
		const vertexShaderSrc = this._vertShaderSrc;
		const vertexShaderSrcMasked = this._vertShaderSrcMasked;
		const vertexShaderSrcSetupMask = this._vertShaderSrcSetupMask;
		const fragmentShaderSrcSetupMask = this._fragShaderSrcSetupMask;
		const fragmentShaderSrcPremultipliedAlpha = this._fragShaderSrcPremultipliedAlpha;
		const fragmentShaderSrcMaskPremultipliedAlpha = this._fragShaderSrcMaskPremultipliedAlpha;
		const fragmentShaderSrcMaskInvertedPremultipliedAlpha = this._fragShaderSrcMaskInvertedPremultipliedAlpha;
		this._shaderSets[0].shaderProgram = this.loadShaderProgram(vertexShaderSrcSetupMask, fragmentShaderSrcSetupMask);
		this._shaderSets[1].shaderProgram = this.loadShaderProgram(vertexShaderSrc, fragmentShaderSrcPremultipliedAlpha);
		this._shaderSets[2].shaderProgram = this.loadShaderProgram(vertexShaderSrcMasked, fragmentShaderSrcMaskPremultipliedAlpha);
		this._shaderSets[3].shaderProgram = this.loadShaderProgram(vertexShaderSrcMasked, fragmentShaderSrcMaskInvertedPremultipliedAlpha);
		this._shaderSets[4].shaderProgram = this._shaderSets[1].shaderProgram;
		this._shaderSets[5].shaderProgram = this._shaderSets[2].shaderProgram;
		this._shaderSets[6].shaderProgram = this._shaderSets[3].shaderProgram;
		this._shaderSets[7].shaderProgram = this._shaderSets[1].shaderProgram;
		this._shaderSets[8].shaderProgram = this._shaderSets[2].shaderProgram;
		this._shaderSets[9].shaderProgram = this._shaderSets[3].shaderProgram;
		this._shaderSets[0].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[0].shaderProgram, "a_position");
		this._shaderSets[0].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[0].shaderProgram, "a_texCoord");
		this._shaderSets[0].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "s_texture0");
		this._shaderSets[0].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "u_clipMatrix");
		this._shaderSets[0].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "u_channelFlag");
		this._shaderSets[0].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[0].shaderProgram, "u_baseColor");
		this._shaderSets[1].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[1].shaderProgram, "a_position");
		this._shaderSets[1].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[1].shaderProgram, "a_texCoord");
		this._shaderSets[1].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "s_texture0");
		this._shaderSets[1].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "u_matrix");
		this._shaderSets[1].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "u_baseColor");
		this._shaderSets[1].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "u_multiplyColor");
		this._shaderSets[1].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[1].shaderProgram, "u_screenColor");
		this._shaderSets[2].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[2].shaderProgram, "a_position");
		this._shaderSets[2].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[2].shaderProgram, "a_texCoord");
		this._shaderSets[2].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "s_texture0");
		this._shaderSets[2].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "s_texture1");
		this._shaderSets[2].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_matrix");
		this._shaderSets[2].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_clipMatrix");
		this._shaderSets[2].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_channelFlag");
		this._shaderSets[2].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_baseColor");
		this._shaderSets[2].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_multiplyColor");
		this._shaderSets[2].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[2].shaderProgram, "u_screenColor");
		this._shaderSets[3].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[3].shaderProgram, "a_position");
		this._shaderSets[3].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[3].shaderProgram, "a_texCoord");
		this._shaderSets[3].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "s_texture0");
		this._shaderSets[3].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "s_texture1");
		this._shaderSets[3].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_matrix");
		this._shaderSets[3].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_clipMatrix");
		this._shaderSets[3].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_channelFlag");
		this._shaderSets[3].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_baseColor");
		this._shaderSets[3].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_multiplyColor");
		this._shaderSets[3].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[3].shaderProgram, "u_screenColor");
		this._shaderSets[4].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[4].shaderProgram, "a_position");
		this._shaderSets[4].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[4].shaderProgram, "a_texCoord");
		this._shaderSets[4].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "s_texture0");
		this._shaderSets[4].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "u_matrix");
		this._shaderSets[4].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "u_baseColor");
		this._shaderSets[4].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "u_multiplyColor");
		this._shaderSets[4].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[4].shaderProgram, "u_screenColor");
		this._shaderSets[5].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[5].shaderProgram, "a_position");
		this._shaderSets[5].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[5].shaderProgram, "a_texCoord");
		this._shaderSets[5].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "s_texture0");
		this._shaderSets[5].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "s_texture1");
		this._shaderSets[5].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_matrix");
		this._shaderSets[5].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_clipMatrix");
		this._shaderSets[5].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_channelFlag");
		this._shaderSets[5].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_baseColor");
		this._shaderSets[5].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_multiplyColor");
		this._shaderSets[5].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[5].shaderProgram, "u_screenColor");
		this._shaderSets[6].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[6].shaderProgram, "a_position");
		this._shaderSets[6].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[6].shaderProgram, "a_texCoord");
		this._shaderSets[6].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "s_texture0");
		this._shaderSets[6].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "s_texture1");
		this._shaderSets[6].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_matrix");
		this._shaderSets[6].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_clipMatrix");
		this._shaderSets[6].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_channelFlag");
		this._shaderSets[6].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_baseColor");
		this._shaderSets[6].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_multiplyColor");
		this._shaderSets[6].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[6].shaderProgram, "u_screenColor");
		this._shaderSets[7].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[7].shaderProgram, "a_position");
		this._shaderSets[7].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[7].shaderProgram, "a_texCoord");
		this._shaderSets[7].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "s_texture0");
		this._shaderSets[7].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "u_matrix");
		this._shaderSets[7].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "u_baseColor");
		this._shaderSets[7].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "u_multiplyColor");
		this._shaderSets[7].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[7].shaderProgram, "u_screenColor");
		this._shaderSets[8].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[8].shaderProgram, "a_position");
		this._shaderSets[8].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[8].shaderProgram, "a_texCoord");
		this._shaderSets[8].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "s_texture0");
		this._shaderSets[8].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "s_texture1");
		this._shaderSets[8].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_matrix");
		this._shaderSets[8].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_clipMatrix");
		this._shaderSets[8].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_channelFlag");
		this._shaderSets[8].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_baseColor");
		this._shaderSets[8].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_multiplyColor");
		this._shaderSets[8].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[8].shaderProgram, "u_screenColor");
		this._shaderSets[9].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[9].shaderProgram, "a_position");
		this._shaderSets[9].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[9].shaderProgram, "a_texCoord");
		this._shaderSets[9].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "s_texture0");
		this._shaderSets[9].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "s_texture1");
		this._shaderSets[9].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_matrix");
		this._shaderSets[9].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_clipMatrix");
		this._shaderSets[9].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_channelFlag");
		this._shaderSets[9].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_baseColor");
		this._shaderSets[9].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_multiplyColor");
		this._shaderSets[9].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[9].shaderProgram, "u_screenColor");
	}
	/**
	* ブレンドモード用のシェーダープログラムを登録する
	*/
	registerBlendShader() {
		const vertShaderSrcCopy = this._vertShaderSrcCopy;
		const fragShaderSrcCopy = this._fragShaderSrcCopy;
		const copyShaderSet = this._shaderSets[10];
		copyShaderSet.shaderProgram = this.loadShaderProgram(vertShaderSrcCopy, fragShaderSrcCopy);
		copyShaderSet.attributeTexCoordLocation = this.gl.getAttribLocation(copyShaderSet.shaderProgram, "a_texCoord");
		copyShaderSet.attributePositionLocation = this.gl.getAttribLocation(copyShaderSet.shaderProgram, "a_position");
		copyShaderSet.uniformBaseColorLocation = this.gl.getUniformLocation(copyShaderSet.shaderProgram, "u_baseColor");
		let shaderSetIndex = 11;
		for (let colorBlendIndex = 0; colorBlendIndex < this._colorBlendValues.length; colorBlendIndex++) {
			if (this._colorBlendValues[colorBlendIndex] == CubismColorBlend.ColorBlend_None || this._colorBlendValues[colorBlendIndex] == CubismColorBlend.ColorBlend_AddCompatible || this._colorBlendValues[colorBlendIndex] == CubismColorBlend.ColorBlend_MultiplyCompatible) continue;
			const colorBlendValue = this._colorBlendValues[colorBlendIndex];
			const colorBlendMacro = `#define COLOR_BLEND_${this._colorBlendMap.get(colorBlendValue).toUpperCase()}\n`;
			for (let alphablendIndex = 0; alphablendIndex < this._alphaBlendValues.length; alphablendIndex++) {
				if (this._alphaBlendValues[alphablendIndex] == CubismAlphaBlend.AlphaBlend_None || this._colorBlendValues[colorBlendIndex] == CubismColorBlend.ColorBlend_Normal && this._alphaBlendValues[alphablendIndex] == CubismAlphaBlend.AlphaBlend_Over) continue;
				const alphaBlendValue = this._alphaBlendValues[alphablendIndex];
				const alphaBlendMacro = `#define ALPHA_BLEND_${this._alphaBlendMap.get(alphaBlendValue).toUpperCase()}\n`;
				this.generateBlendShader(colorBlendMacro, alphaBlendMacro, shaderSetIndex);
				this._blendShaderSetMap.set(this._colorBlendMap.get(this._colorBlendValues[colorBlendIndex]) + this._alphaBlendMap.get(this._alphaBlendValues[alphablendIndex]), shaderSetIndex);
				shaderSetIndex += 3;
			}
		}
	}
	/**
	* ブレンドモード用のシェーダープログラムを生成する
	*
	* @param colorBlendMacro カラーブレンド用のマクロ
	* @param alphaBlendMacro アルファブレンド用のマクロ
	* @param shaderSetBaseIndex _shaderSets のインデックス
	*/
	generateBlendShader(colorBlendMacro, alphaBlendMacro, shaderSetBaseIndex) {
		for (let shaderTypeIndex = 0; shaderTypeIndex < 3; shaderTypeIndex++) {
			let vertexShaderSrc = "";
			let fragmentShaderStr = "precision mediump float;\n";
			const shaderSetIndex = shaderSetBaseIndex + shaderTypeIndex;
			fragmentShaderStr += colorBlendMacro;
			fragmentShaderStr += alphaBlendMacro;
			fragmentShaderStr += this._fragShaderSrcColorBlend;
			fragmentShaderStr += this._fragShaderSrcAlphaBlend;
			if (shaderTypeIndex == 1 || shaderTypeIndex == 2) {
				const clippingMaskMacro = "#define CLIPPING_MASK\n";
				vertexShaderSrc += clippingMaskMacro;
				fragmentShaderStr += clippingMaskMacro;
			}
			vertexShaderSrc += this._vertShaderSrcBlend;
			fragmentShaderStr += this._fragShaderSrcBlend;
			this._shaderSets[shaderSetIndex].shaderProgram = this.loadShaderProgram(vertexShaderSrc, fragmentShaderStr);
			this._shaderSets[shaderSetIndex].attributePositionLocation = this.gl.getAttribLocation(this._shaderSets[shaderSetIndex].shaderProgram, "a_position");
			this._shaderSets[shaderSetIndex].attributeTexCoordLocation = this.gl.getAttribLocation(this._shaderSets[shaderSetIndex].shaderProgram, "a_texCoord");
			this._shaderSets[shaderSetIndex].samplerTexture0Location = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "s_texture0");
			this._shaderSets[shaderSetIndex].uniformMatrixLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "u_matrix");
			this._shaderSets[shaderSetIndex].uniformBaseColorLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "u_baseColor");
			this._shaderSets[shaderSetIndex].uniformMultiplyColorLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "u_multiplyColor");
			this._shaderSets[shaderSetIndex].uniformScreenColorLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "u_screenColor");
			this._shaderSets[shaderSetIndex].samplerFrameBufferTextureLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "s_blendTexture");
			if (shaderTypeIndex == 1 || shaderTypeIndex == 2) {
				this._shaderSets[shaderSetIndex].samplerTexture1Location = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "s_texture1");
				this._shaderSets[shaderSetIndex].uniformClipMatrixLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "u_clipMatrix");
				this._shaderSets[shaderSetIndex].uniformChannelFlagLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "u_channelFlag");
				this._shaderSets[shaderSetIndex].uniformInvertMaskFlagLocation = this.gl.getUniformLocation(this._shaderSets[shaderSetIndex].shaderProgram, "u_invertClippingMask");
			}
		}
	}
	/**
	* シェーダプログラムをロードしてアドレスを返す
	*
	* @param vertexShaderSource    頂点シェーダのソース
	* @param fragmentShaderSource  フラグメントシェーダのソース
	*
	* @return シェーダプログラムのアドレス
	*/
	loadShaderProgram(vertexShaderSource, fragmentShaderSource) {
		let shaderProgram = this.gl.createProgram();
		let vertShader = this.compileShaderSource(this.gl.VERTEX_SHADER, vertexShaderSource);
		if (!vertShader) {
			CubismLogError("Vertex shader compile error!");
			return 0;
		}
		let fragShader = this.compileShaderSource(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
		if (!fragShader) {
			CubismLogError("Fragment shader compile error!");
			return 0;
		}
		this.gl.attachShader(shaderProgram, vertShader);
		this.gl.attachShader(shaderProgram, fragShader);
		this.gl.linkProgram(shaderProgram);
		if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
			CubismLogError("Failed to link program: {0}", shaderProgram);
			this.gl.deleteShader(vertShader);
			vertShader = 0;
			this.gl.deleteShader(fragShader);
			fragShader = 0;
			if (shaderProgram) {
				this.gl.deleteProgram(shaderProgram);
				shaderProgram = 0;
			}
			return 0;
		}
		this.gl.deleteShader(vertShader);
		this.gl.deleteShader(fragShader);
		return shaderProgram;
	}
	/**
	* シェーダープログラムをコンパイルする
	*
	* @param shaderType シェーダタイプ(Vertex/Fragment)
	* @param shaderSource シェーダソースコード
	*
	* @return コンパイルされたシェーダープログラム
	*/
	compileShaderSource(shaderType, shaderSource) {
		const source = shaderSource;
		const shader = this.gl.createShader(shaderType);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!shader) CubismLogError("Shader compile log: {0} ", this.gl.getShaderInfoLog(shader));
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			CubismLogError("Shader compile log: {0} ", this.gl.getShaderInfoLog(shader));
			this.gl.deleteShader(shader);
			return null;
		}
		return shader;
	}
	/**
	* WebGLレンダリングコンテキストを設定する
	*
	* @param gl WebGLレンダリングコンテキスト
	*/
	setGl(gl) {
		this.gl = gl;
	}
	/**
	* ブレンドモード用のシェーダーパスを設定する
	*
	* @param shaderPath シェーダーパス
	*/
	setShaderPath(shaderPath) {
		this._shaderPath = shaderPath;
	}
	/**
	* シェーダーパスを取得する
	*
	* @return シェーダーパス
	*/
	getShaderPath() {
		return this._shaderPath;
	}
};
/**
* GLContextごとにCubismShader_WebGLを確保するためのクラス
* シングルトンなクラスであり、CubismShaderManager_WebGL.getInstanceからアクセスする。
*/
var CubismShaderManager_WebGL = class CubismShaderManager_WebGL {
	/**
	* インスタンスを取得する（シングルトン）
	*
	* @return インスタンス
	*/
	static getInstance() {
		if (s_instance == null) s_instance = new CubismShaderManager_WebGL();
		return s_instance;
	}
	/**
	* インスタンスを開放する（シングルトン）
	*/
	static deleteInstance() {
		if (s_instance) {
			s_instance.release();
			s_instance = null;
		}
	}
	/**
	* Privateなコンストラクタ
	*/
	constructor() {
		this._shaderMap = /* @__PURE__ */ new Map();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		for (const item of this._shaderMap) item[1].release();
		this._shaderMap.clear();
	}
	/**
	* GLContextをキーにShaderを取得する
	*
	* @param gl glコンテキスト
	*
	* @return shaderを返す
	*/
	getShader(gl) {
		return this._shaderMap.get(gl);
	}
	/**
	* GLContextを登録する
	*
	* @param gl glコンテキスト
	*/
	setGlContext(gl) {
		if (!this._shaderMap.has(gl)) {
			const instance = new CubismShader_WebGL();
			instance.setGl(gl);
			this._shaderMap.set(gl, instance);
		}
	}
};
/**
* CubismShader_WebGLのインナークラス
*/
var CubismShaderSet = class {};
/**
* シェーダーの名前を定義する列挙型
*/
var ShaderNames = /* @__PURE__ */ function(ShaderNames) {
	ShaderNames[ShaderNames["ShaderNames_SetupMask"] = 0] = "ShaderNames_SetupMask";
	ShaderNames[ShaderNames["ShaderNames_NormalPremultipliedAlpha"] = 1] = "ShaderNames_NormalPremultipliedAlpha";
	ShaderNames[ShaderNames["ShaderNames_NormalMaskedPremultipliedAlpha"] = 2] = "ShaderNames_NormalMaskedPremultipliedAlpha";
	ShaderNames[ShaderNames["ShaderNames_NomralMaskedInvertedPremultipliedAlpha"] = 3] = "ShaderNames_NomralMaskedInvertedPremultipliedAlpha";
	ShaderNames[ShaderNames["ShaderNames_AddPremultipliedAlpha"] = 4] = "ShaderNames_AddPremultipliedAlpha";
	ShaderNames[ShaderNames["ShaderNames_AddMaskedPremultipliedAlpha"] = 5] = "ShaderNames_AddMaskedPremultipliedAlpha";
	ShaderNames[ShaderNames["ShaderNames_AddMaskedPremultipliedAlphaInverted"] = 6] = "ShaderNames_AddMaskedPremultipliedAlphaInverted";
	ShaderNames[ShaderNames["ShaderNames_MultPremultipliedAlpha"] = 7] = "ShaderNames_MultPremultipliedAlpha";
	ShaderNames[ShaderNames["ShaderNames_MultMaskedPremultipliedAlpha"] = 8] = "ShaderNames_MultMaskedPremultipliedAlpha";
	ShaderNames[ShaderNames["ShaderNames_MultMaskedPremultipliedAlphaInverted"] = 9] = "ShaderNames_MultMaskedPremultipliedAlphaInverted";
	ShaderNames[ShaderNames["ShaderNames_ShaderCount"] = 10] = "ShaderNames_ShaderCount";
	return ShaderNames;
}({});
var Live2DCubismFramework$6;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismShaderSet = CubismShaderSet;
	_Live2DCubismFramework.CubismShader_WebGL = CubismShader_WebGL;
	_Live2DCubismFramework.CubismShaderManager_WebGL = CubismShaderManager_WebGL;
	_Live2DCubismFramework.ShaderNames = ShaderNames;
})(Live2DCubismFramework$6 || (Live2DCubismFramework$6 = {}));
//#endregion
//#region cubism/src/rendering/cubismoffscreenmanager.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* フレームバッファなどのコンテナのクラス
*/
var CubismRenderTargetContainer = class {
	/**
	* Constructor
	*
	* @param colorBuffer カラーバッファ
	* @param renderTexture レンダーテクスチャ
	* @param inUse 使用中かどうか
	*/
	constructor(colorBuffer = null, renderTexture = null, inUse = false) {
		this.colorBuffer = colorBuffer;
		this.renderTexture = renderTexture;
		this.inUse = inUse;
	}
	clear() {
		this.colorBuffer = null;
		this.renderTexture = null;
		this.inUse = false;
	}
	/**
	* カラーバッファを取得
	*
	* @returns カラーバッファ
	*/
	getColorBuffer() {
		return this.colorBuffer;
	}
	/**
	* レンダーテクスチャを取得
	*
	* @returns レンダーテクスチャ
	*/
	getRenderTexture() {
		return this.renderTexture;
	}
};
/**
* WebGLContextごとのリソース管理を行う内部クラス
*/
var CubismWebGLContextManager = class {
	constructor(gl) {
		this.gl = gl;
		this.offscreenRenderTargetContainers = new Array();
		this.previousActiveRenderTextureMaxCount = 0;
		this.currentActiveRenderTextureCount = 0;
		this.hasResetThisFrame = false;
		this.width = 0;
		this.height = 0;
	}
	release() {
		if (this.offscreenRenderTargetContainers != null) {
			for (let index = 0; index < this.offscreenRenderTargetContainers.length; ++index) {
				const container = this.offscreenRenderTargetContainers[index];
				this.gl.deleteTexture(container.colorBuffer);
				this.gl.deleteFramebuffer(container.renderTexture);
			}
			this.offscreenRenderTargetContainers.length = 0;
			this.offscreenRenderTargetContainers = null;
		}
	}
};
/**
* WebGL用オフスクリーン描画機能を管理するマネージャ
* オフスクリーン描画機能に必要なフレームバッファなどを含むコンテナを管理する。
* 複数のWebGLContextに対応。
*/
var CubismWebGLOffscreenManager = class CubismWebGLOffscreenManager {
	/**
	* コンストラクタ
	*/
	constructor() {
		this._contextManagers = /* @__PURE__ */ new Map();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		if (this._contextManagers != null) {
			for (const manager of this._contextManagers.values()) manager.release();
			this._contextManagers.clear();
			this._contextManagers = null;
		}
		CubismWebGLOffscreenManager._instance = null;
	}
	/**
	* インスタンスの取得
	*
	* @return インスタンス
	*/
	static getInstance() {
		if (this._instance == null) this._instance = new CubismWebGLOffscreenManager();
		return this._instance;
	}
	/**
	* WebGLContextに対応するマネージャーを取得または作成
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @return WebGLContextManager
	*/
	getContextManager(gl) {
		if (!this._contextManagers.has(gl)) this._contextManagers.set(gl, new CubismWebGLContextManager(gl));
		return this._contextManagers.get(gl);
	}
	/**
	* 指定されたWebGLContextのマネージャーを削除
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	removeContext(gl) {
		if (this._contextManagers.has(gl)) {
			this._contextManagers.get(gl).release();
			this._contextManagers.delete(gl);
		}
	}
	/**
	* 初期化処理
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @param width 幅
	* @param height 高さ
	*/
	initialize(gl, width, height) {
		const contextManager = this.getContextManager(gl);
		if (contextManager.offscreenRenderTargetContainers != null) {
			for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
				const container = contextManager.offscreenRenderTargetContainers[index];
				contextManager.gl.deleteTexture(container.colorBuffer);
				contextManager.gl.deleteFramebuffer(container.renderTexture);
				container.clear();
			}
			contextManager.offscreenRenderTargetContainers.length = 0;
		} else contextManager.offscreenRenderTargetContainers = new Array();
		contextManager.width = width;
		contextManager.height = height;
		contextManager.previousActiveRenderTextureMaxCount = 0;
		contextManager.currentActiveRenderTextureCount = 0;
		contextManager.hasResetThisFrame = false;
	}
	/**
	* モデルを描画する前に呼び出すフレーム開始時の処理を行う
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	beginFrameProcess(gl) {
		const contextManager = this.getContextManager(gl);
		if (contextManager.hasResetThisFrame) return;
		contextManager.previousActiveRenderTextureMaxCount = 0;
		contextManager.hasResetThisFrame = true;
	}
	/**
	* モデルの描画が終わった後に呼び出すフレーム終了時の処理
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	endFrameProcess(gl) {
		const contextManager = this.getContextManager(gl);
		contextManager.hasResetThisFrame = false;
	}
	/**
	* コンテナサイズの取得
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	getContainerSize(gl) {
		const contextManager = this.getContextManager(gl);
		if (contextManager.offscreenRenderTargetContainers == null) return 0;
		return contextManager.offscreenRenderTargetContainers.length;
	}
	/**
	* 使用可能なリソースコンテナの取得
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @param width 幅
	* @param height 高さ
	* @param previousFramebuffer 前のフレームバッファ
	* @return 使用可能なリソースコンテナ
	*/
	getOffscreenRenderTargetContainers(gl, width, height, previousFramebuffer) {
		const contextManager = this.getContextManager(gl);
		if (contextManager.width != width || contextManager.height != height || contextManager.offscreenRenderTargetContainers == null) this.initialize(gl, width, height);
		this.updateRenderTargetContainerCount(gl);
		const container = this.getUnusedOffscreenRenderTargetContainer(gl);
		if (container != null) return container;
		return this.createOffscreenRenderTargetContainer(gl, width, height, previousFramebuffer);
	}
	/**
	* リソースコンテナの使用状態を取得
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @param renderTexture WebGLFramebuffer
	* @return 使用中はtrue、未使用の場合はfalse
	*/
	getUsingRenderTextureState(gl, renderTexture) {
		const contextManager = this.getContextManager(gl);
		for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) if (contextManager.offscreenRenderTargetContainers[index].renderTexture == renderTexture) return contextManager.offscreenRenderTargetContainers[index].inUse;
		return true;
	}
	/**
	* リソースコンテナの使用を開始する。
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @param renderTexture WebGLFramebuffer
	*/
	startUsingRenderTexture(gl, renderTexture) {
		const contextManager = this.getContextManager(gl);
		for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
			if (contextManager.offscreenRenderTargetContainers[index].renderTexture != renderTexture) continue;
			contextManager.offscreenRenderTargetContainers[index].inUse = true;
			this.updateRenderTargetContainerCount(gl);
			break;
		}
	}
	/**
	* リソースコンテナの使用を終了する。
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @param renderTexture WebGLFramebuffer
	*/
	stopUsingRenderTexture(gl, renderTexture) {
		const contextManager = this.getContextManager(gl);
		for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
			if (contextManager.offscreenRenderTargetContainers[index].renderTexture != renderTexture) continue;
			contextManager.offscreenRenderTargetContainers[index].inUse = false;
			contextManager.currentActiveRenderTextureCount--;
			if (contextManager.currentActiveRenderTextureCount < 0) contextManager.currentActiveRenderTextureCount = 0;
			break;
		}
	}
	/**
	* リソースコンテナの使用を全て終了する。
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	stopUsingAllRenderTextures(gl) {
		const contextManager = this.getContextManager(gl);
		for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) contextManager.offscreenRenderTargetContainers[index].inUse = false;
		contextManager.currentActiveRenderTextureCount = 0;
	}
	/**
	* 使用されていないリソースコンテナを解放する。
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	releaseStaleRenderTextures(gl) {
		const contextManager = this.getContextManager(gl);
		const listSize = contextManager.offscreenRenderTargetContainers.length;
		if (contextManager.hasResetThisFrame || listSize === 0) return;
		let findPos = 0;
		let resize = contextManager.previousActiveRenderTextureMaxCount;
		for (let i = listSize; contextManager.previousActiveRenderTextureMaxCount < i; --i) {
			const index = i - 1;
			if (contextManager.offscreenRenderTargetContainers[index].inUse) {
				let isFind = false;
				for (; findPos < contextManager.previousActiveRenderTextureMaxCount; ++findPos) if (!contextManager.offscreenRenderTargetContainers[findPos].inUse) {
					const tempContainer = contextManager.offscreenRenderTargetContainers[findPos];
					contextManager.offscreenRenderTargetContainers[findPos] = contextManager.offscreenRenderTargetContainers[index];
					contextManager.offscreenRenderTargetContainers[findPos].inUse = true;
					contextManager.offscreenRenderTargetContainers[index] = tempContainer;
					contextManager.offscreenRenderTargetContainers[index].inUse = false;
					isFind = true;
					break;
				}
				if (!isFind) {
					resize = i;
					break;
				}
			}
			const container = contextManager.offscreenRenderTargetContainers[index];
			contextManager.gl.bindTexture(contextManager.gl.TEXTURE_2D, null);
			contextManager.gl.deleteTexture(container.colorBuffer);
			contextManager.gl.bindFramebuffer(contextManager.gl.FRAMEBUFFER, null);
			contextManager.gl.deleteFramebuffer(container.renderTexture);
			container.clear();
		}
		updateSize(contextManager.offscreenRenderTargetContainers, resize);
	}
	/**
	* 直前のアクティブなレンダーターゲットの最大数を取得
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @returns 直前のアクティブなレンダーターゲットの最大数
	*/
	getPreviousActiveRenderTextureCount(gl) {
		return this.getContextManager(gl).previousActiveRenderTextureMaxCount;
	}
	/**
	* 現在のアクティブなレンダーターゲットの数を取得
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @returns 現在のアクティブなレンダーターゲットの数
	*/
	getCurrentActiveRenderTextureCount(gl) {
		return this.getContextManager(gl).currentActiveRenderTextureCount;
	}
	/**
	* 現在のアクティブなレンダーターゲットの数を更新
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*/
	updateRenderTargetContainerCount(gl) {
		const contextManager = this.getContextManager(gl);
		++contextManager.currentActiveRenderTextureCount;
		contextManager.previousActiveRenderTextureMaxCount = contextManager.currentActiveRenderTextureCount > contextManager.previousActiveRenderTextureMaxCount ? contextManager.currentActiveRenderTextureCount : contextManager.previousActiveRenderTextureMaxCount;
	}
	/**
	* 使用されていないリソースコンテナの取得
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @return 使用されていないリソースコンテナ
	*/
	getUnusedOffscreenRenderTargetContainer(gl) {
		const contextManager = this.getContextManager(gl);
		for (let index = 0; index < contextManager.offscreenRenderTargetContainers.length; ++index) {
			const container = contextManager.offscreenRenderTargetContainers[index];
			if (container.inUse == false) {
				container.inUse = true;
				return container;
			}
		}
		return null;
	}
	/**
	* 新たにリソースコンテナを作成する。
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	* @param width 幅
	* @param height 高さ
	* @param previousFramebuffer 前のフレームバッファ
	* @return 作成されたリソースコンテナ
	*/
	createOffscreenRenderTargetContainer(gl, width, height, previousFramebuffer) {
		const renderTarget = new CubismRenderTarget_WebGL();
		if (!renderTarget.createRenderTarget(gl, width, height, previousFramebuffer)) {
			CubismLogError("Failed to create offscreen render texture.");
			return null;
		}
		const offscreenRenderTextureContainer = new CubismRenderTargetContainer(renderTarget.getColorBuffer(), renderTarget.getRenderTexture(), true);
		this.getContextManager(gl).offscreenRenderTargetContainers.push(offscreenRenderTextureContainer);
		return offscreenRenderTextureContainer;
	}
};
//#endregion
//#region cubism/src/rendering/cubismoffscreenrendertarget_webgl.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* WebGL用オフスクリーンサーフェス
* マスクの描画及びオフスクリーン機能に必要なフレームバッファなどを管理する。
*/
var CubismOffscreenRenderTarget_WebGL = class extends CubismRenderTarget_WebGL {
	/**
	* リソースコンテナマネージャを初期化する。
	*
	* @param displayBufferWidth レンダーターゲットの幅
	* @param displayBufferHeight レンダーターゲットの高さ
	*/
	initializeOffscreenManager(gl, displayBufferWidth, displayBufferHeight) {
		this._gl = gl;
		this._webGLOffscreenManager = CubismWebGLOffscreenManager.getInstance();
		if (this._webGLOffscreenManager.getContainerSize(gl) === 0) this._webGLOffscreenManager.initialize(gl, displayBufferWidth, displayBufferHeight);
	}
	/**
	* オフスクリーン描画用レンダーターゲットをセットする。
	*
	* @param gl WebGLRenderingContextまたはWebGL2RenderingContext
	*          NOTE: Cubism 5.3以降のモデルが使用される場合はWebGL2RenderingContextを使用すること。
	* @param displayBufferWidth レンダーターゲットの幅
	* @param displayBufferHeight レンダーターゲットの高さ
	* @param previousFramebuffer 前のフレームバッファ
	*/
	setOffscreenRenderTarget(gl, displayBufferWidth, displayBufferHeight, previousFramebuffer) {
		if (this._webGLOffscreenManager == null) this.initializeOffscreenManager(gl, displayBufferWidth, displayBufferHeight);
		const offscreenRenderTargetContainer = this._webGLOffscreenManager.getOffscreenRenderTargetContainers(gl, displayBufferWidth, displayBufferHeight, previousFramebuffer);
		if (offscreenRenderTargetContainer == null) {
			CubismLogError("Failed to acquire offscreen render texture container.");
			return;
		}
		this._colorBuffer = offscreenRenderTargetContainer.getColorBuffer();
		this._renderTexture = offscreenRenderTargetContainer.getRenderTexture();
		this._bufferWidth = displayBufferWidth;
		this._bufferHeight = displayBufferHeight;
		this._gl = gl;
		if (this._renderTexture == null) {
			this._renderTexture = previousFramebuffer;
			CubismLogError("Failed to create offscreen render texture.");
		}
	}
	/**
	* リソースコンテナの使用状態を取得
	*
	* @return 使用中はtrue、未使用の場合はfalse
	*/
	getUsingRenderTextureState() {
		if (this._webGLOffscreenManager == null || this._gl == null) return true;
		return this._webGLOffscreenManager.getUsingRenderTextureState(this._gl, this._renderTexture);
	}
	/**
	* リソースコンテナの使用を開始する。
	*/
	startUsingRenderTexture() {
		if (this._webGLOffscreenManager == null || this._gl == null) return;
		this._webGLOffscreenManager.startUsingRenderTexture(this._gl, this._renderTexture);
	}
	/**
	* リソースコンテナの使用を終了する。
	*/
	stopUsingRenderTexture() {
		if (this._webGLOffscreenManager == null || this._gl == null) return;
		this._webGLOffscreenManager.stopUsingRenderTexture(this._gl, this._renderTexture);
	}
	/**
	* オフスクリーンのインデックスを設定する。
	*
	* @param offscreenIndex オフスクリーンのインデックス
	*/
	setOffscreenIndex(offscreenIndex) {
		this._offscreenIndex = offscreenIndex;
	}
	/**
	* オフスクリーンのインデックスを取得する。
	*
	* @return オフスクリーンのインデックス
	*/
	getOffscreenIndex() {
		return this._offscreenIndex;
	}
	/**
	* 以前のオフスクリーン描画用レンダーターゲットを設定する。
	*
	* @param oldOffscreen 以前のオフスクリーン描画用レンダーターゲット
	*/
	setOldOffscreen(oldOffscreen) {
		this._oldOffscreen = oldOffscreen;
	}
	/**
	* 以前のオフスクリーン描画用レンダーターゲットを取得する。
	*
	* @return 以前のオフスクリーン描画用レンダーターゲット
	*/
	getOldOffscreen() {
		return this._oldOffscreen;
	}
	/**
	* 親のオフスクリーン描画用レンダーターゲットを設定する。
	*
	* @param parentOffscreenRenderTarget 親のオフスクリーン描画用レンダーターゲット
	*/
	setParentPartOffscreen(parentOffscreenRenderTarget) {
		this._parentOffscreenRenderTarget = parentOffscreenRenderTarget;
	}
	/**
	* 親のオフスクリーン描画用レンダーターゲットを取得する。
	*
	* @return 親のオフスクリーン描画用レンダーターゲット
	*/
	getParentPartOffscreen() {
		return this._parentOffscreenRenderTarget;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		super();
		this._offscreenIndex = -1;
		this._parentOffscreenRenderTarget = null;
		this._oldOffscreen = null;
		this._webGLOffscreenManager = null;
	}
	release() {
		if (this._webGLOffscreenManager != null && this._gl != null && this._renderTexture != null) this._webGLOffscreenManager.stopUsingRenderTexture(this._gl, this._renderTexture);
		if (this._colorBuffer && this._gl) {
			this._gl.deleteTexture(this._colorBuffer);
			this._colorBuffer = null;
		}
		if (this._renderTexture && this._gl) {
			this._gl.deleteFramebuffer(this._renderTexture);
			this._renderTexture = null;
		}
		if (this._webGLOffscreenManager != null) this._webGLOffscreenManager = null;
		this._oldOffscreen = null;
		this._parentOffscreenRenderTarget = null;
	}
};
//#endregion
//#region cubism/src/rendering/cubismrenderer_webgl.ts
var s_invalidValue = -1;
var s_renderTargetIndexArray = new Uint16Array([
	0,
	1,
	2,
	2,
	1,
	3
]);
/**
* クリッピングマスクの処理を実行するクラス
*/
var CubismClippingManager_WebGL = class extends CubismClippingManager {
	/**
	* WebGLレンダリングコンテキストを設定する
	*
	* @param gl WebGLレンダリングコンテキスト
	*/
	setGL(gl) {
		this.gl = gl;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		super(CubismClippingContext_WebGL);
	}
	/**
	* クリッピングコンテキストを作成する。モデル描画時に実行する。
	*
	* @param model モデルのインスタンス
	* @param renderer レンダラのインスタンス
	* @param lastFbo フレームバッファ
	* @param lastViewport ビューポート
	* @param drawObjectType 描画オブジェクトのタイプ
	*/
	setupClippingContext(model, renderer, lastFbo, lastViewport, drawObjectType) {
		let usingClipCount = 0;
		for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
			const cc = this._clippingContextListForMask[clipIndex];
			switch (drawObjectType) {
				case DrawableObjectType.DrawableObjectType_Drawable:
				default:
					this.calcClippedDrawableTotalBounds(model, cc);
					break;
				case DrawableObjectType.DrawableObjectType_Offscreen:
					this.calcClippedOffscreenTotalBounds(model, cc);
					break;
			}
			if (cc._isUsing) usingClipCount++;
		}
		if (usingClipCount <= 0) return;
		this.gl.viewport(0, 0, this._clippingMaskBufferSize, this._clippingMaskBufferSize);
		switch (drawObjectType) {
			case DrawableObjectType.DrawableObjectType_Drawable:
			default:
				this._currentMaskBuffer = renderer.getDrawableMaskBuffer(0);
				break;
			case DrawableObjectType.DrawableObjectType_Offscreen:
				this._currentMaskBuffer = renderer.getOffscreenMaskBuffer(0);
				break;
		}
		this._currentMaskBuffer.beginDraw(lastFbo);
		renderer.preDraw();
		this.setupLayoutBounds(usingClipCount);
		if (this._clearedMaskBufferFlags.length != this._renderTextureCount) {
			this._clearedMaskBufferFlags.length = 0;
			this._clearedMaskBufferFlags = new Array(this._renderTextureCount);
			for (let i = 0; i < this._clearedMaskBufferFlags.length; i++) this._clearedMaskBufferFlags[i] = false;
		}
		for (let index = 0; index < this._clearedMaskBufferFlags.length; index++) this._clearedMaskBufferFlags[index] = false;
		for (let clipIndex = 0; clipIndex < this._clippingContextListForMask.length; clipIndex++) {
			const clipContext = this._clippingContextListForMask[clipIndex];
			const allClipedDrawRect = clipContext._allClippedDrawRect;
			const layoutBoundsOnTex01 = clipContext._layoutBounds;
			const margin = .05;
			let scaleX = 0;
			let scaleY = 0;
			let maskBuffer;
			switch (drawObjectType) {
				case DrawableObjectType.DrawableObjectType_Drawable:
				default:
					maskBuffer = renderer.getDrawableMaskBuffer(clipContext._bufferIndex);
					break;
				case DrawableObjectType.DrawableObjectType_Offscreen:
					maskBuffer = renderer.getOffscreenMaskBuffer(clipContext._bufferIndex);
					break;
			}
			if (this._currentMaskBuffer != maskBuffer) {
				this._currentMaskBuffer.endDraw();
				this._currentMaskBuffer = maskBuffer;
				this._currentMaskBuffer.beginDraw(lastFbo);
				renderer.preDraw();
			}
			this._tmpBoundsOnModel.setRect(allClipedDrawRect);
			this._tmpBoundsOnModel.expand(allClipedDrawRect.width * margin, allClipedDrawRect.height * margin);
			scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
			scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
			this.createMatrixForMask(false, layoutBoundsOnTex01, scaleX, scaleY);
			clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
			clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
			if (drawObjectType == DrawableObjectType.DrawableObjectType_Offscreen) {
				const invertMvp = renderer.getMvpMatrix().getInvert();
				clipContext._matrixForDraw.multiplyByMatrix(invertMvp);
			}
			const clipDrawCount = clipContext._clippingIdCount;
			for (let i = 0; i < clipDrawCount; i++) {
				const clipDrawIndex = clipContext._clippingIdList[i];
				if (!model.getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)) continue;
				renderer.setIsCulling(model.getDrawableCulling(clipDrawIndex) != false);
				if (!this._clearedMaskBufferFlags[clipContext._bufferIndex]) {
					this.gl.clearColor(1, 1, 1, 1);
					this.gl.clear(this.gl.COLOR_BUFFER_BIT);
					this._clearedMaskBufferFlags[clipContext._bufferIndex] = true;
				}
				renderer.setClippingContextBufferForMask(clipContext);
				renderer.drawMeshWebGL(model, clipDrawIndex);
			}
		}
		this._currentMaskBuffer.endDraw();
		renderer.setClippingContextBufferForMask(null);
		this.gl.viewport(lastViewport[0], lastViewport[1], lastViewport[2], lastViewport[3]);
	}
	/**
	* マスクの合計数をカウント
	*
	* @return マスクの合計数を返す
	*/
	getClippingMaskCount() {
		return this._clippingContextListForMask.length;
	}
};
/**
* クリッピングマスクのコンテキスト
*/
var CubismClippingContext_WebGL = class extends CubismClippingContext {
	/**
	* 引数付きコンストラクタ
	*
	* @param manager マスクを管理しているマネージャのインスタンス
	* @param clippingDrawableIndices クリップしているDrawableのインデックスリスト
	* @param clipCount クリップしているDrawableの個数
	*/
	constructor(manager, clippingDrawableIndices, clipCount) {
		super(clippingDrawableIndices, clipCount);
		this._owner = manager;
	}
	/**
	* このマスクを管理するマネージャのインスタンスを取得する
	*
	* @return クリッピングマネージャのインスタンス
	*/
	getClippingManager() {
		return this._owner;
	}
	/**
	* WebGLレンダリングコンテキストを設定する
	*
	* @param gl WebGLレンダリングコンテキスト
	*/
	setGl(gl) {
		this._owner.setGL(gl);
	}
};
/**
* Cubismモデルを描画する直前のWebGLのステートを保持・復帰させるクラス
*/
var CubismRendererProfile_WebGL = class {
	/**
	* WebGLの有効・無効をセットする
	*
	* @param index 有効・無効にする機能
	* @param enabled trueなら有効にする
	*/
	setGlEnable(index, enabled) {
		if (enabled) this.gl.enable(index);
		else this.gl.disable(index);
	}
	/**
	* WebGLのVertex Attribute Array機能の有効・無効をセットする
	*
	* @param   index   有効・無効にする機能
	* @param   enabled trueなら有効にする
	*/
	setGlEnableVertexAttribArray(index, enabled) {
		if (enabled) this.gl.enableVertexAttribArray(index);
		else this.gl.disableVertexAttribArray(index);
	}
	/**
	* WebGLのステートを保持する
	*/
	save() {
		if (this.gl == null) {
			CubismLogError("'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function.");
			return;
		}
		this._lastArrayBufferBinding = this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING);
		this._lastElementArrayBufferBinding = this.gl.getParameter(this.gl.ELEMENT_ARRAY_BUFFER_BINDING);
		this._lastProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
		this._lastActiveTexture = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);
		this.gl.activeTexture(this.gl.TEXTURE1);
		this._lastTexture1Binding2D = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this._lastTexture0Binding2D = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
		this._lastVertexAttribArrayEnabled[0] = this.gl.getVertexAttrib(0, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
		this._lastVertexAttribArrayEnabled[1] = this.gl.getVertexAttrib(1, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
		this._lastVertexAttribArrayEnabled[2] = this.gl.getVertexAttrib(2, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
		this._lastVertexAttribArrayEnabled[3] = this.gl.getVertexAttrib(3, this.gl.VERTEX_ATTRIB_ARRAY_ENABLED);
		this._lastScissorTest = this.gl.isEnabled(this.gl.SCISSOR_TEST);
		this._lastStencilTest = this.gl.isEnabled(this.gl.STENCIL_TEST);
		this._lastDepthTest = this.gl.isEnabled(this.gl.DEPTH_TEST);
		this._lastCullFace = this.gl.isEnabled(this.gl.CULL_FACE);
		this._lastBlend = this.gl.isEnabled(this.gl.BLEND);
		this._lastFrontFace = this.gl.getParameter(this.gl.FRONT_FACE);
		this._lastColorMask = this.gl.getParameter(this.gl.COLOR_WRITEMASK);
		this._lastBlending[0] = this.gl.getParameter(this.gl.BLEND_SRC_RGB);
		this._lastBlending[1] = this.gl.getParameter(this.gl.BLEND_DST_RGB);
		this._lastBlending[2] = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA);
		this._lastBlending[3] = this.gl.getParameter(this.gl.BLEND_DST_ALPHA);
	}
	/**
	* 保持したWebGLのステートを復帰させる
	*/
	restore() {
		if (this.gl == null) {
			CubismLogError("'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function.");
			return;
		}
		this.gl.useProgram(this._lastProgram);
		this.setGlEnableVertexAttribArray(0, this._lastVertexAttribArrayEnabled[0]);
		this.setGlEnableVertexAttribArray(1, this._lastVertexAttribArrayEnabled[1]);
		this.setGlEnableVertexAttribArray(2, this._lastVertexAttribArrayEnabled[2]);
		this.setGlEnableVertexAttribArray(3, this._lastVertexAttribArrayEnabled[3]);
		this.setGlEnable(this.gl.SCISSOR_TEST, this._lastScissorTest);
		this.setGlEnable(this.gl.STENCIL_TEST, this._lastStencilTest);
		this.setGlEnable(this.gl.DEPTH_TEST, this._lastDepthTest);
		this.setGlEnable(this.gl.CULL_FACE, this._lastCullFace);
		this.setGlEnable(this.gl.BLEND, this._lastBlend);
		this.gl.frontFace(this._lastFrontFace);
		this.gl.colorMask(this._lastColorMask[0], this._lastColorMask[1], this._lastColorMask[2], this._lastColorMask[3]);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._lastArrayBufferBinding);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this._lastElementArrayBufferBinding);
		this.gl.activeTexture(this.gl.TEXTURE1);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture1Binding2D);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture0Binding2D);
		this.gl.activeTexture(this._lastActiveTexture);
		this.gl.blendFuncSeparate(this._lastBlending[0], this._lastBlending[1], this._lastBlending[2], this._lastBlending[3]);
	}
	/**
	* WebGLレンダリングコンテキストを設定する
	*
	* @param gl WebGLレンダリングコンテキスト
	*/
	setGl(gl) {
		this.gl = gl;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		this._lastVertexAttribArrayEnabled = new Array(4);
		this._lastColorMask = new Array(4);
		this._lastBlending = new Array(4);
	}
};
/**
* WebGL用の描画命令を実装したクラス
*/
var CubismRenderer_WebGL = class extends CubismRenderer {
	/**
	* レンダラの初期化処理を実行する
	* 引数に渡したモデルからレンダラの初期化処理に必要な情報を取り出すことができる
	* NOTE: WebGLコンテキストが初期化されていない可能性があるため、ここではWebGLコンテキストを使う初期化は行わない。
	*
	* @param model モデルのインスタンス
	* @param maskBufferCount バッファの生成数
	*/
	initialize(model, maskBufferCount = 1) {
		if (model.isUsingMasking()) {
			this._drawableClippingManager = new CubismClippingManager_WebGL();
			this._drawableClippingManager.initializeForDrawable(model, maskBufferCount);
		}
		if (model.isUsingMaskingForOffscreen()) {
			this._offscreenClippingManager = new CubismClippingManager_WebGL();
			this._offscreenClippingManager.initializeForOffscreen(model, maskBufferCount);
		}
		updateSize(this._sortedObjectsIndexList, model.getDrawableCount() + (model.getOffscreenCount ? model.getOffscreenCount() : 0), 0, true);
		updateSize(this._sortedObjectsTypeList, model.getDrawableCount() + (model.getOffscreenCount ? model.getOffscreenCount() : 0), 0, true);
		super.initialize(model);
	}
	/**
	* オフスクリーンの親を探して設定する
	*
	* @param model モデルのインスタンス
	* @param offscreenCount オフスクリーンの数
	*/
	setupParentOffscreens(model, offscreenCount) {
		let parentOffscreen;
		for (let offscreenIndex = 0; offscreenIndex < offscreenCount; ++offscreenIndex) {
			parentOffscreen = null;
			const ownerIndex = model.getOffscreenOwnerIndices()[offscreenIndex];
			let parentIndex = model.getPartParentPartIndices()[ownerIndex];
			while (parentIndex != -1) {
				for (let i = 0; i < offscreenCount; ++i) {
					if (model.getOffscreenOwnerIndices()[this._offscreenList[i].getOffscreenIndex()] != parentIndex) continue;
					parentOffscreen = this._offscreenList[i];
					break;
				}
				if (parentOffscreen != null) break;
				parentIndex = model.getPartParentPartIndices()[parentIndex];
			}
			this._offscreenList[offscreenIndex].setParentPartOffscreen(parentOffscreen);
		}
	}
	/**
	* WebGLテクスチャのバインド処理
	* CubismRendererにテクスチャを設定し、CubismRenderer内でその画像を参照するためのIndex値を戻り値とする
	*
	* @param modelTextureNo セットするモデルテクスチャの番号
	* @param glTextureNo WebGLテクスチャの番号
	*/
	bindTexture(modelTextureNo, glTexture) {
		this._textures.set(modelTextureNo, glTexture);
	}
	/**
	* WebGLにバインドされたテクスチャのリストを取得する
	*
	* @return テクスチャのリスト
	*/
	getBindedTextures() {
		return this._textures;
	}
	/**
	* クリッピングマスクバッファのサイズを設定する
	* マスク用のFrameBufferを破棄、再作成する為処理コストは高い
	*
	* @param size クリッピングマスクバッファのサイズ
	*/
	setClippingMaskBufferSize(size) {
		if (!this._model.isUsingMasking()) return;
		const renderTextureCount = this._drawableClippingManager.getRenderTextureCount();
		this._drawableClippingManager.release();
		this._drawableClippingManager = void 0;
		this._drawableClippingManager = null;
		this._drawableClippingManager = new CubismClippingManager_WebGL();
		this._drawableClippingManager.setClippingMaskBufferSize(size);
		this._drawableClippingManager.initializeForDrawable(this.getModel(), renderTextureCount);
	}
	/**
	* クリッピングマスクバッファのサイズを取得する
	*
	* @return クリッピングマスクバッファのサイズ
	*/
	getClippingMaskBufferSize() {
		return this._model.isUsingMasking() ? this._drawableClippingManager.getClippingMaskBufferSize() : s_invalidValue;
	}
	/**
	* ブレンドモード用のフレームバッファを取得する
	*
	* @return ブレンドモード用のフレームバッファ
	*/
	getModelRenderTarget(index) {
		return this._modelRenderTargets[index];
	}
	/**
	* レンダーテクスチャの枚数を取得する
	* @return レンダーテクスチャの枚数
	*/
	getRenderTextureCount() {
		return this._model.isUsingMasking() ? this._drawableClippingManager.getRenderTextureCount() : s_invalidValue;
	}
	/**
	* コンストラクタ
	*/
	constructor(width, height) {
		super(width, height);
		this._clippingContextBufferForMask = null;
		this._clippingContextBufferForDraw = null;
		this._rendererProfile = new CubismRendererProfile_WebGL();
		this._textures = /* @__PURE__ */ new Map();
		this._sortedObjectsIndexList = new Array();
		this._sortedObjectsTypeList = new Array();
		this._bufferData = {
			vertex: WebGLBuffer = null,
			uv: WebGLBuffer = null,
			index: WebGLBuffer = null
		};
		this._modelRenderTargets = new Array();
		this._drawableMasks = new Array();
		this._currentFbo = null;
		this._drawableClippingManager = null;
		this._offscreenClippingManager = null;
		this._offscreenMasks = new Array();
		this._offscreenList = new Array();
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		if (this._drawableClippingManager) {
			this._drawableClippingManager.release();
			this._drawableClippingManager = void 0;
			this._drawableClippingManager = null;
		}
		if (this.gl == null) return;
		this.gl.deleteBuffer(this._bufferData.vertex);
		this._bufferData.vertex = null;
		this.gl.deleteBuffer(this._bufferData.uv);
		this._bufferData.uv = null;
		this.gl.deleteBuffer(this._bufferData.index);
		this._bufferData.index = null;
		this._bufferData = null;
		this._textures = null;
		for (let i = 0; i < this._modelRenderTargets.length; i++) if (this._modelRenderTargets[i] != null && this._modelRenderTargets[i].isValid()) this._modelRenderTargets[i].destroyRenderTarget();
		this._modelRenderTargets.length = 0;
		this._modelRenderTargets = null;
		for (let i = 0; i < this._drawableMasks.length; i++) if (this._drawableMasks[i] != null && this._drawableMasks[i].isValid()) this._drawableMasks[i].destroyRenderTarget();
		this._drawableMasks.length = 0;
		this._drawableMasks = null;
		for (let i = 0; i < this._offscreenMasks.length; i++) if (this._offscreenMasks[i] != null && this._offscreenMasks[i].isValid()) this._offscreenMasks[i].destroyRenderTarget();
		this._offscreenMasks.length = 0;
		this._offscreenMasks = null;
		for (let i = 0; i < this._offscreenList.length; i++) if (this._offscreenList[i] != null && this._offscreenList[i].isValid()) this._offscreenList[i].destroyRenderTarget();
		this._offscreenList.length = 0;
		this._offscreenList = null;
		this._offscreenClippingManager = null;
		this._drawableClippingManager = null;
		this._clippingContextBufferForMask = null;
		this._clippingContextBufferForDraw = null;
		this._rendererProfile = null;
		this._sortedObjectsIndexList = null;
		this._sortedObjectsTypeList = null;
		this._currentFbo = null;
		this._model = null;
		this.gl = null;
	}
	/**
	* Shaderの読み込みを行う
	* @param shaderPath シェーダのパス
	*/
	loadShaders(shaderPath = null) {
		if (this.gl == null) {
			CubismLogError("'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function.");
			return;
		}
		if (CubismShaderManager_WebGL.getInstance().getShader(this.gl)._shaderSets.length == 0 || !CubismShaderManager_WebGL.getInstance().getShader(this.gl)._isShaderLoaded) {
			const shader = CubismShaderManager_WebGL.getInstance().getShader(this.gl);
			if (shaderPath != null) shader.setShaderPath(shaderPath);
			shader.generateShaders();
		}
	}
	/**
	* モデルを描画する実際の処理
	* @param shaderPath シェーダのパス
	*/
	doDrawModel(shaderPath = null) {
		this.loadShaders(shaderPath);
		this.beforeDrawModelRenderTarget();
		const lastFbo = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
		const lastViewport = this.gl.getParameter(this.gl.VIEWPORT);
		if (this._drawableClippingManager != null) {
			this.preDraw();
			for (let i = 0; i < this._drawableClippingManager.getRenderTextureCount(); ++i) if (this._drawableMasks[i].getBufferWidth() != this._drawableClippingManager.getClippingMaskBufferSize() || this._drawableMasks[i].getBufferHeight() != this._drawableClippingManager.getClippingMaskBufferSize()) this._drawableMasks[i].createRenderTarget(this.gl, this._drawableClippingManager.getClippingMaskBufferSize(), this._drawableClippingManager.getClippingMaskBufferSize(), lastFbo);
			if (this.isUsingHighPrecisionMask()) this._drawableClippingManager.setupMatrixForHighPrecision(this.getModel(), false);
			else this._drawableClippingManager.setupClippingContext(this.getModel(), this, lastFbo, lastViewport, DrawableObjectType.DrawableObjectType_Drawable);
		}
		if (this._offscreenClippingManager != null) {
			this.preDraw();
			for (let i = 0; i < this._offscreenClippingManager.getRenderTextureCount(); ++i) if (this._offscreenMasks[i].getBufferWidth() != this._offscreenClippingManager.getClippingMaskBufferSize() || this._offscreenMasks[i].getBufferHeight() != this._offscreenClippingManager.getClippingMaskBufferSize()) this._offscreenMasks[i].createRenderTarget(this.gl, this._offscreenClippingManager.getClippingMaskBufferSize(), this._offscreenClippingManager.getClippingMaskBufferSize(), lastFbo);
			if (this.isUsingHighPrecisionMask()) this._offscreenClippingManager.setupMatrixForOffscreenHighPrecision(this.getModel(), false, this.getMvpMatrix());
			else this._offscreenClippingManager.setupClippingContext(this.getModel(), this, lastFbo, lastViewport, DrawableObjectType.DrawableObjectType_Offscreen);
		}
		this.preDraw();
		this.drawObjectLoop(lastFbo);
		this.afterDrawModelRenderTarget();
	}
	/**
	* 描画オブジェクトのループ処理を行う。
	*
	* @param lastFbo 前回のフレームバッファ
	*/
	drawObjectLoop(lastFbo) {
		const model = this.getModel();
		const drawableCount = model.getDrawableCount();
		const totalCount = drawableCount + model.getOffscreenCount();
		const renderOrder = model.getRenderOrders();
		this._currentOffscreen = null;
		this._currentFbo = lastFbo;
		this._modelRootFbo = lastFbo;
		for (let i = 0; i < totalCount; ++i) {
			const order = renderOrder[i];
			if (i < drawableCount) {
				this._sortedObjectsIndexList[order] = i;
				this._sortedObjectsTypeList[order] = DrawableObjectType.DrawableObjectType_Drawable;
			} else if (i < totalCount) {
				this._sortedObjectsIndexList[order] = i - drawableCount;
				this._sortedObjectsTypeList[order] = DrawableObjectType.DrawableObjectType_Offscreen;
			}
		}
		for (let i = 0; i < totalCount; ++i) {
			const objectIndex = this._sortedObjectsIndexList[i];
			const objectType = this._sortedObjectsTypeList[i];
			this.renderObject(objectIndex, objectType);
		}
		while (this._currentOffscreen != null) this.submitDrawToParentOffscreen(this._currentOffscreen.getOffscreenIndex(), DrawableObjectType.DrawableObjectType_Offscreen);
	}
	/**
	* 描画オブジェクトを描画する。
	*
	* @param objectIndex 描画対象のオブジェクトのインデックス
	* @param objectType 描画対象のオブジェクトのタイプ
	* @param lastFbo 前回のフレームバッファ
	* @param lastViewport 前回のビューポート
	*/
	renderObject(objectIndex, objectType) {
		switch (objectType) {
			case DrawableObjectType.DrawableObjectType_Drawable:
				this.drawDrawable(objectIndex, this._modelRootFbo);
				break;
			case DrawableObjectType.DrawableObjectType_Offscreen:
				this.addOffscreen(objectIndex);
				break;
			default:
				CubismLogError("Unknown object type: " + objectType);
				break;
		}
	}
	/**
	* 描画オブジェクト（アートメッシュ）を描画する。
	*
	* @param model 描画対象のモデル
	* @param index 描画対象のメッシュのインデックス
	*/
	drawDrawable(drawableIndex, rootFbo) {
		if (!this.getModel().getDrawableDynamicFlagIsVisible(drawableIndex)) return;
		this.submitDrawToParentOffscreen(drawableIndex, DrawableObjectType.DrawableObjectType_Drawable);
		const clipContext = this._drawableClippingManager != null ? this._drawableClippingManager.getClippingContextListForDraw()[drawableIndex] : null;
		if (clipContext != null && this.isUsingHighPrecisionMask()) {
			if (clipContext._isUsing) {
				this.gl.viewport(0, 0, this._drawableClippingManager.getClippingMaskBufferSize(), this._drawableClippingManager.getClippingMaskBufferSize());
				this.preDraw();
				this.getDrawableMaskBuffer(clipContext._bufferIndex).beginDraw(this._currentFbo);
				this.gl.clearColor(1, 1, 1, 1);
				this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			}
			{
				const clipDrawCount = clipContext._clippingIdCount;
				for (let index = 0; index < clipDrawCount; index++) {
					const clipDrawIndex = clipContext._clippingIdList[index];
					if (!this._model.getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)) continue;
					this.setIsCulling(this._model.getDrawableCulling(clipDrawIndex) != false);
					this.setClippingContextBufferForMask(clipContext);
					this.drawMeshWebGL(this._model, clipDrawIndex);
				}
				this.getDrawableMaskBuffer(clipContext._bufferIndex).endDraw();
				this.setClippingContextBufferForMask(null);
				this.gl.viewport(0, 0, this._modelRenderTargetWidth, this._modelRenderTargetHeight);
				this.preDraw();
			}
		}
		this.setClippingContextBufferForDrawable(clipContext);
		this.setIsCulling(this.getModel().getDrawableCulling(drawableIndex));
		this.drawMeshWebGL(this._model, drawableIndex);
	}
	/**
	* 描画オブジェクト（アートメッシュ）を描画する。
	*
	* @param model 描画対象のモデル
	* @param index 描画対象のメッシュのインデックス
	*/
	drawMeshWebGL(model, index) {
		if (this.isCulling()) this.gl.enable(this.gl.CULL_FACE);
		else this.gl.disable(this.gl.CULL_FACE);
		this.gl.frontFace(this.gl.CCW);
		if (this.isGeneratingMask()) CubismShaderManager_WebGL.getInstance().getShader(this.gl).setupShaderProgramForMask(this, model, index);
		else CubismShaderManager_WebGL.getInstance().getShader(this.gl).setupShaderProgramForDrawable(this, model, index);
		if (!CubismShaderManager_WebGL.getInstance().getShader(this.gl)._isShaderLoaded) return;
		{
			const indexCount = model.getDrawableVertexIndexCount(index);
			this.gl.drawElements(this.gl.TRIANGLES, indexCount, this.gl.UNSIGNED_SHORT, 0);
		}
		this.gl.useProgram(null);
		this.setClippingContextBufferForDrawable(null);
		this.setClippingContextBufferForMask(null);
	}
	/**
	* オフスクリーンを親のオフスクリーンにコピーする。
	*
	* @param objectIndex オブジェクトのインデックス
	* @param objectType  オブジェクトの種類
	*/
	submitDrawToParentOffscreen(objectIndex, objectType) {
		if (this._currentOffscreen == null || objectIndex == s_invalidValue) return;
		const currentOwnerIndex = this.getModel().getOffscreenOwnerIndices()[this._currentOffscreen.getOffscreenIndex()];
		if (currentOwnerIndex == s_invalidValue) return;
		let targetParentIndex = -1;
		switch (objectType) {
			case DrawableObjectType.DrawableObjectType_Drawable:
				targetParentIndex = this.getModel().getDrawableParentPartIndex(objectIndex);
				break;
			case DrawableObjectType.DrawableObjectType_Offscreen:
				targetParentIndex = this.getModel().getPartParentPartIndices()[this.getModel().getOffscreenOwnerIndices()[objectIndex]];
				break;
			default: return;
		}
		while (targetParentIndex != -1) {
			if (targetParentIndex == currentOwnerIndex) return;
			targetParentIndex = this.getModel().getPartParentPartIndices()[targetParentIndex];
		}
		this.drawOffscreen(this._currentOffscreen);
		this.submitDrawToParentOffscreen(objectIndex, objectType);
	}
	/**
	* 描画オブジェクト（オフスクリーン）を追加する。
	*
	* @param offscreenIndex オフスクリーンのインデックス
	*/
	addOffscreen(offscreenIndex) {
		if (this._currentOffscreen != null && this._currentOffscreen.getOffscreenIndex() != offscreenIndex) {
			let isParent = false;
			const ownerIndex = this.getModel().getOffscreenOwnerIndices()[offscreenIndex];
			let parentIndex = this.getModel().getPartParentPartIndices()[ownerIndex];
			const currentOffscreenIndex = this._currentOffscreen.getOffscreenIndex();
			const currentOffscreenOwnerIndex = this.getModel().getOffscreenOwnerIndices()[currentOffscreenIndex];
			while (parentIndex != -1) {
				if (parentIndex == currentOffscreenOwnerIndex) {
					isParent = true;
					break;
				}
				parentIndex = this.getModel().getPartParentPartIndices()[parentIndex];
			}
			if (!isParent) this.submitDrawToParentOffscreen(offscreenIndex, DrawableObjectType.DrawableObjectType_Offscreen);
		}
		const offscreen = this._offscreenList[offscreenIndex];
		if (offscreen.getRenderTexture() == null || offscreen.getBufferWidth() != this._modelRenderTargetWidth || offscreen.getBufferHeight() != this._modelRenderTargetHeight || offscreen.getUsingRenderTextureState()) offscreen.setOffscreenRenderTarget(this.gl, this._modelRenderTargetWidth, this._modelRenderTargetHeight, this._currentFbo);
		else offscreen.startUsingRenderTexture();
		const oldOffscreen = offscreen.getParentPartOffscreen();
		offscreen.setOldOffscreen(oldOffscreen);
		let oldFBO = null;
		if (oldOffscreen != null) oldFBO = oldOffscreen.getRenderTexture();
		if (oldFBO == null) oldFBO = this._modelRootFbo;
		offscreen.beginDraw(oldFBO);
		this.gl.viewport(0, 0, this._modelRenderTargetWidth, this._modelRenderTargetHeight);
		offscreen.clear(0, 0, 0, 0);
		this._currentOffscreen = offscreen;
		this._currentFbo = offscreen.getRenderTexture();
	}
	/**
	* オフスクリーン描画を行う。
	*
	* @param offscreen オフスクリーンレンダリングターゲット
	*/
	drawOffscreen(offscreen) {
		const offscreenIndex = offscreen.getOffscreenIndex();
		const clipContext = this._offscreenClippingManager != null ? this._offscreenClippingManager.getClippingContextListForOffscreen()[offscreenIndex] : null;
		if (clipContext != null && this.isUsingHighPrecisionMask()) {
			if (clipContext._isUsing) {
				this.gl.viewport(0, 0, this._offscreenClippingManager.getClippingMaskBufferSize(), this._offscreenClippingManager.getClippingMaskBufferSize());
				this.preDraw();
				this.getOffscreenMaskBuffer(clipContext._bufferIndex).beginDraw(this._currentFbo);
				this.gl.clearColor(1, 1, 1, 1);
				this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			}
			{
				const clipDrawCount = clipContext._clippingIdCount;
				for (let index = 0; index < clipDrawCount; index++) {
					const clipDrawIndex = clipContext._clippingIdList[index];
					if (!this.getModel().getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)) continue;
					this.setIsCulling(this.getModel().getDrawableCulling(clipDrawIndex) != false);
					this.setClippingContextBufferForMask(clipContext);
					this.drawMeshWebGL(this.getModel(), clipDrawIndex);
				}
			}
			this.getOffscreenMaskBuffer(clipContext._bufferIndex).endDraw();
			this.setClippingContextBufferForMask(null);
			this.gl.viewport(0, 0, this._modelRenderTargetWidth, this._modelRenderTargetHeight);
			this.preDraw();
		}
		this.setClippingContextBufferForOffscreen(clipContext);
		this.setIsCulling(this._model.getOffscreenCulling(offscreenIndex) != false);
		this.drawOffscreenWebGL(this.getModel(), offscreen);
	}
	/**
	* オフスクリーン描画のWebGL実装
	*
	* @param model モデル
	* @param index オフスクリーンインデックス
	*/
	drawOffscreenWebGL(model, offscreen) {
		if (this.isCulling()) this.gl.enable(this.gl.CULL_FACE);
		else this.gl.disable(this.gl.CULL_FACE);
		this.gl.frontFace(this.gl.CCW);
		CubismShaderManager_WebGL.getInstance().getShader(this.gl).setupShaderProgramForOffscreen(this, model, offscreen);
		offscreen.endDraw();
		this._currentOffscreen = this._currentOffscreen.getOldOffscreen();
		this._currentFbo = offscreen.getOldFBO();
		if (this._currentFbo == null) {
			this._currentOffscreen = this._modelRenderTargets[0];
			this._currentFbo = this._modelRenderTargets[0].getRenderTexture();
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this._currentFbo);
		}
		{
			const indexBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, s_renderTargetIndexArray, this.gl.STATIC_DRAW);
			this.gl.drawElements(this.gl.TRIANGLES, s_renderTargetIndexArray.length, this.gl.UNSIGNED_SHORT, 0);
			this.gl.deleteBuffer(indexBuffer);
		}
		offscreen.stopUsingRenderTexture();
		this.gl.useProgram(null);
		this.setClippingContextBufferForMask(null);
		this.setClippingContextBufferForOffscreen(null);
	}
	/**
	* モデル描画直前のレンダラのステートを保持する
	*/
	saveProfile() {
		this._rendererProfile.save();
	}
	/**
	* モデル描画直前のレンダラのステートを復帰させる
	*/
	restoreProfile() {
		this._rendererProfile.restore();
	}
	/**
	* モデル描画直前のオフスクリーン設定を行う
	*/
	beforeDrawModelRenderTarget() {
		if (this._modelRenderTargets.length == 0) return;
		for (let i = 0; i < this._modelRenderTargets.length; ++i) if (this._modelRenderTargets[i].getBufferWidth() != this._modelRenderTargetWidth || this._modelRenderTargets[i].getBufferHeight() != this._modelRenderTargetHeight) this._modelRenderTargets[i].createRenderTarget(this.gl, this._modelRenderTargetWidth, this._modelRenderTargetHeight, this._currentFbo);
		this._modelRenderTargets[0].beginDraw();
		this._modelRenderTargets[0].clear(0, 0, 0, 0);
	}
	/**
	* モデル描画後のオフスクリーン設定を行う
	*/
	afterDrawModelRenderTarget() {
		if (this._modelRenderTargets.length == 0) return;
		this._modelRenderTargets[0].endDraw();
		CubismShaderManager_WebGL.getInstance().getShader(this.gl).setupShaderProgramForOffscreenRenderTarget(this);
		if (CubismShaderManager_WebGL.getInstance().getShader(this.gl)._isShaderLoaded) {
			const indexBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
			this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, s_renderTargetIndexArray, this.gl.STATIC_DRAW);
			this.gl.drawElements(this.gl.TRIANGLES, s_renderTargetIndexArray.length, this.gl.UNSIGNED_SHORT, 0);
			this.gl.deleteBuffer(indexBuffer);
		}
		this.gl.useProgram(null);
	}
	/**
	* オフスクリーンのクリッピングマスクのバッファを取得する
	*
	* @param index オフスクリーンのクリッピングマスクのバッファのインデックス
	*
	* @return オフスクリーンのクリッピングマスクのバッファへのポインタ
	*/
	getOffscreenMaskBuffer(index) {
		return this._offscreenMasks[index];
	}
	/**
	* レンダラが保持する静的なリソースを解放する
	* WebGLの静的なシェーダープログラムを解放する
	*/
	static doStaticRelease() {
		CubismShaderManager_WebGL.deleteInstance();
	}
	/**
	* レンダーステートを設定する
	*
	* @param fbo アプリケーション側で指定しているフレームバッファ
	* @param viewport ビューポート
	*/
	setRenderState(fbo, viewport) {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
		this.gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
		if (this._modelRenderTargetWidth != viewport[2] || this._modelRenderTargetHeight != viewport[3]) {
			this._modelRenderTargetWidth = viewport[2];
			this._modelRenderTargetHeight = viewport[3];
		}
	}
	/**
	* 描画開始時の追加処理
	* モデルを描画する前にクリッピングマスクに必要な処理を実装している
	*/
	preDraw() {
		this.gl.disable(this.gl.SCISSOR_TEST);
		this.gl.disable(this.gl.STENCIL_TEST);
		this.gl.disable(this.gl.DEPTH_TEST);
		this.gl.frontFace(this.gl.CW);
		this.gl.enable(this.gl.BLEND);
		this.gl.colorMask(true, true, true, true);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
		if (this.getAnisotropy() > 0 && this._extension) for (let i = 0; i < this._textures.size; ++i) {
			this.gl.bindTexture(this.gl.TEXTURE_2D, this._textures.get(i));
			this.gl.texParameterf(this.gl.TEXTURE_2D, this._extension.TEXTURE_MAX_ANISOTROPY_EXT, this.getAnisotropy());
		}
	}
	/**
	* Drawableのマスク用のオフスクリーンサーフェースを取得する
	*
	* @param index オフスクリーンサーフェースのインデックス
	*
	* @return マスク用のオフスクリーンサーフェース
	*/
	getDrawableMaskBuffer(index) {
		return this._drawableMasks[index];
	}
	/**
	* マスクテクスチャに描画するクリッピングコンテキストをセットする
	*/
	setClippingContextBufferForMask(clip) {
		this._clippingContextBufferForMask = clip;
	}
	/**
	* マスクテクスチャに描画するクリッピングコンテキストを取得する
	*
	* @return マスクテクスチャに描画するクリッピングコンテキスト
	*/
	getClippingContextBufferForMask() {
		return this._clippingContextBufferForMask;
	}
	/**
	* Drawableの画面上に描画するクリッピングコンテキストをセットする
	*
	* @param clip drawableで画面上に描画するクリッピングコンテキスト
	*/
	setClippingContextBufferForDrawable(clip) {
		this._clippingContextBufferForDraw = clip;
	}
	/**
	* Drawableの画面上に描画するクリッピングコンテキストを取得する
	*
	* @return Drawableの画面上に描画するクリッピングコンテキスト
	*/
	getClippingContextBufferForDrawable() {
		return this._clippingContextBufferForDraw;
	}
	/**
	* offscreenで画面上に描画するクリッピングコンテキストをセットする。
	*
	* @param clip offscreenで画面上に描画するクリッピングコンテキスト
	*/
	setClippingContextBufferForOffscreen(clip) {
		this._clippingContextBufferForOffscreen = clip;
	}
	/**
	* offscreenで画面上に描画するクリッピングコンテキストを取得する。
	*
	* @return offscreenで画面上に描画するクリッピングコンテキスト
	*/
	getClippingContextBufferForOffscreen() {
		return this._clippingContextBufferForOffscreen;
	}
	/**
	* マスク生成時かを判定する
	*
	* @return 判定値
	*/
	isGeneratingMask() {
		return this.getClippingContextBufferForMask() != null;
	}
	/**
	* glの設定
	*/
	startUp(gl) {
		this.gl = gl;
		if (this._drawableClippingManager) this._drawableClippingManager.setGL(gl);
		if (this._offscreenClippingManager) this._offscreenClippingManager.setGL(gl);
		CubismShaderManager_WebGL.getInstance().setGlContext(gl);
		this._rendererProfile.setGl(gl);
		this._extension = this.gl.getExtension("EXT_texture_filter_anisotropic") || this.gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || this.gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
		if (this._model.isUsingMasking()) {
			this._drawableMasks.length = this._drawableClippingManager.getRenderTextureCount();
			for (let i = 0; i < this._drawableMasks.length; ++i) {
				const renderTarget = new CubismRenderTarget_WebGL();
				renderTarget.createRenderTarget(this.gl, this._drawableClippingManager.getClippingMaskBufferSize(), this._drawableClippingManager.getClippingMaskBufferSize(), this._currentFbo);
				this._drawableMasks[i] = renderTarget;
			}
		}
		if (this._model.isBlendModeEnabled()) {
			this._modelRenderTargets.length = 0;
			const createSize = 3;
			this._modelRenderTargets.length = createSize;
			for (let i = 0; i < createSize; ++i) {
				const offscreenRenderTarget = new CubismOffscreenRenderTarget_WebGL();
				offscreenRenderTarget.createRenderTarget(this.gl, this._modelRenderTargetWidth, this._modelRenderTargetHeight, this._currentFbo);
				this._modelRenderTargets[i] = offscreenRenderTarget;
			}
			if (this._model.isUsingMaskingForOffscreen()) {
				this._offscreenMasks.length = this._offscreenClippingManager.getRenderTextureCount();
				for (let i = 0; i < this._offscreenMasks.length; ++i) {
					const offscreenMask = new CubismRenderTarget_WebGL();
					offscreenMask.createRenderTarget(this.gl, this._offscreenClippingManager.getClippingMaskBufferSize(), this._offscreenClippingManager.getClippingMaskBufferSize(), this._currentFbo);
					this._offscreenMasks[i] = offscreenMask;
				}
			}
			const offscreenCount = this._model.getOffscreenCount();
			if (offscreenCount > 0) {
				this._offscreenList = new Array(offscreenCount);
				for (let offscreenIndex = 0; offscreenIndex < offscreenCount; ++offscreenIndex) {
					const offscreenRenderTarget = new CubismOffscreenRenderTarget_WebGL();
					offscreenRenderTarget.setOffscreenIndex(offscreenIndex);
					this._offscreenList[offscreenIndex] = offscreenRenderTarget;
				}
				this.setupParentOffscreens(this._model, offscreenCount);
			}
		}
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this._currentFbo);
	}
};
/**
* レンダラが保持する静的なリソースを開放する
*/
CubismRenderer.staticRelease = () => {
	CubismRenderer_WebGL.doStaticRelease();
};
var Live2DCubismFramework$5;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismClippingContext = CubismClippingContext_WebGL;
	_Live2DCubismFramework.CubismClippingManager_WebGL = CubismClippingManager_WebGL;
	_Live2DCubismFramework.CubismRenderer_WebGL = CubismRenderer_WebGL;
})(Live2DCubismFramework$5 || (Live2DCubismFramework$5 = {}));
//#endregion
//#region src/cubism5/Cubism5ShaderLoader.ts
var CUBISM5_SHADER_FILES = [
	"fragshadersrcalphablend.frag",
	"fragshadersrccolorblend.frag",
	"fragshadersrccopy.frag",
	"fragshadersrcmaskinvertedpremultipliedalpha.frag",
	"fragshadersrcmaskpremultipliedalpha.frag",
	"fragshadersrcpremultipliedalpha.frag",
	"fragshadersrcpremultipliedalphablend.frag",
	"fragshadersrcsetupmask.frag",
	"vertshadersrc.vert",
	"vertshadersrcblend.vert",
	"vertshadersrccopy.vert",
	"vertshadersrcmasked.vert",
	"vertshadersrcsetupmask.vert"
];
var SHADER_LOAD_TIMEOUT = 3e4;
var shaderLoadRecords = /* @__PURE__ */ new WeakMap();
var contextUsages = /* @__PURE__ */ new WeakMap();
var knownShaders = /* @__PURE__ */ new Set();
var activeContextCount = 0;
var Cubism5ShaderLoadCancelledError = class extends Error {
	constructor() {
		super("Cubism 5 shader loading was superseded by a newer WebGL context.");
		this.name = "Cubism5ShaderLoadCancelledError";
	}
};
function normalizeCubism5ShaderPath(path) {
	if (!path) throw new Error("config.cubism5ShaderPath must be a non-empty shader directory URL.");
	return path.endsWith("/") ? path : path + "/";
}
function verifyCubism5ShaderAssets(_x2, _x3) {
	return _verifyCubism5ShaderAssets.apply(this, arguments);
}
function _verifyCubism5ShaderAssets() {
	_verifyCubism5ShaderAssets = _asyncToGenerator(function* (shaderPath, signal) {
		const normalizedPath = normalizeCubism5ShaderPath(shaderPath);
		yield Promise.all(CUBISM5_SHADER_FILES.map(function() {
			var _ref = _asyncToGenerator(function* (file) {
				const url = normalizedPath + file;
				let response;
				try {
					response = yield fetch(url, { signal });
				} catch (cause) {
					throw new Error(`Failed to fetch Cubism 5 shader ${url}.`, { cause });
				}
				if (!response.ok) throw new Error(`Failed to fetch Cubism 5 shader ${url}: HTTP ${response.status} ${response.statusText}.`);
				if (!(yield response.text()).trim()) throw new Error(`Cubism 5 shader ${url} was empty.`);
			});
			return function(_x) {
				return _ref.apply(this, arguments);
			};
		}()));
	});
	return _verifyCubism5ShaderAssets.apply(this, arguments);
}
/** Retains the shared R5 state for one model using a WebGL context. */
function retainCubism5Context(gl) {
	let usage = contextUsages.get(gl);
	if (!usage) {
		usage = {
			references: 0,
			frameStarted: false
		};
		contextUsages.set(gl, usage);
		activeContextCount++;
	}
	usage.references++;
}
/** Releases one model's ownership of the shared R5 state for a WebGL context. */
function releaseCubism5Context(gl) {
	const usage = contextUsages.get(gl);
	if (!usage || usage.references === 0) return;
	usage.references--;
	endCubism5Frame(gl, usage);
	usage.frameStarted = false;
	CubismWebGLOffscreenManager.getInstance().removeContext(gl);
	if (usage.references > 0) return;
	contextUsages.delete(gl);
	activeContextCount--;
	const shader = CubismShaderManager_WebGL.getInstance().getShader(gl);
	if (shader) invalidateShaderRecord(shader);
	if (activeContextCount === 0) {
		releaseKnownShaderPrograms();
		CubismShaderManager_WebGL.deleteInstance();
		CubismWebGLOffscreenManager.getInstance().release();
		shaderLoadRecords = /* @__PURE__ */ new WeakMap();
	}
}
/**
* Starts or reuses one shader initialization task for a WebGL context epoch.
* The shared task deliberately has no model-specific cancellation callback: destroying one
* model must not cancel shader compilation required by other models on the same context.
*/
function loadCubism5Shaders(gl, shaderPath, epoch, isCurrent) {
	assertCurrent(isCurrent);
	prepareCubism5Context(gl, epoch);
	const normalizedPath = normalizeCubism5ShaderPath(shaderPath);
	const shader = CubismShaderManager_WebGL.getInstance().getShader(gl);
	if (!shader) return Promise.reject(/* @__PURE__ */ new Error("Cubism 5 did not register a shader manager for the active WebGL context."));
	knownShaders.add(shader);
	const existing = shaderLoadRecords.get(shader);
	if ((existing === null || existing === void 0 ? void 0 : existing.valid) && existing.epoch === epoch) {
		if (existing.path !== normalizedPath) return Promise.reject(/* @__PURE__ */ new Error(`Cubism 5 shaders for this WebGL context are already loading from ${existing.path}; cannot also use ${normalizedPath}.`));
		return observeSharedTask(existing.task, isCurrent);
	}
	if (!shader._isShaderLoading && shader._isShaderLoaded) try {
		validateShaderPrograms(gl, shader);
		const task = Promise.resolve();
		shaderLoadRecords.set(shader, {
			epoch,
			path: normalizedPath,
			task,
			valid: true
		});
		return observeSharedTask(task, isCurrent);
	} catch (_unused) {}
	if (existing) invalidateShaderRecord(shader);
	const record = {
		epoch,
		path: normalizedPath,
		task: Promise.resolve(),
		valid: true
	};
	record.task = initializeSharedShaders(gl, shader, record);
	shaderLoadRecords.set(shader, record);
	return observeSharedTask(record.task, isCurrent);
}
function initializeSharedShaders(gl, shader, record) {
	return _asyncToGenerator(function* () {
		const deadline = performance.now() + SHADER_LOAD_TIMEOUT;
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), SHADER_LOAD_TIMEOUT);
		try {
			yield verifyCubism5ShaderAssets(record.path, controller.signal);
			assertSharedRecord(shader, record);
			if (controller.signal.aborted || performance.now() >= deadline) throw shaderTimeoutError(record.path);
			shader.setShaderPath(record.path);
			shader.generateShaders();
			while (true) {
				assertSharedRecord(shader, record);
				if (gl.isContextLost()) throw new Error("The WebGL 2 context was lost while Cubism 5 shaders were loading.");
				if (!shader._isShaderLoading && shader._isShaderLoaded) {
					validateShaderPrograms(gl, shader);
					return;
				}
				if (!shader._isShaderLoading && !shader._isShaderLoaded) throw new Error("Cubism 5 shader compilation stopped before completion.");
				if (performance.now() >= deadline) throw shaderTimeoutError(record.path);
				yield new Promise((resolve) => setTimeout(resolve, 16));
			}
		} catch (cause) {
			if (controller.signal.aborted) throw shaderTimeoutError(record.path);
			throw cause;
		} finally {
			clearTimeout(timeout);
		}
	})();
}
function observeSharedTask(task, isCurrent) {
	return task.then(() => assertCurrent(isCurrent));
}
function prepareCubism5Context(gl, epoch) {
	const usage = contextUsages.get(gl);
	if (!usage) throw new Error("Cubism 5 WebGL context ownership was not registered.");
	if (usage.epoch !== epoch) {
		if (usage.epoch) resetCubism5Context(gl);
		usage.epoch = epoch;
	}
	if (!usage.frameStarted) beginCubism5Frame(gl, usage);
}
function resetCubism5Context(gl) {
	const shader = CubismShaderManager_WebGL.getInstance().getShader(gl);
	if (shader) invalidateShaderRecord(shader);
	CubismWebGLOffscreenManager.getInstance().removeContext(gl);
}
function beginCubism5Frame(gl, usage) {
	const manager = CubismWebGLOffscreenManager.getInstance();
	if (usage.frameStarted) manager.endFrameProcess(gl);
	manager.beginFrameProcess(gl);
	usage.frameStarted = true;
}
function endCubism5Frame(gl, usage) {
	if (!usage.frameStarted) return;
	const manager = CubismWebGLOffscreenManager.getInstance();
	manager.endFrameProcess(gl);
	manager.releaseStaleRenderTextures(gl);
	usage.frameStarted = false;
}
registerWebGLContextLifecycleListener({
	contextChange(gl, epoch) {
		const usage = contextUsages.get(gl);
		if (!usage) return;
		resetCubism5Context(gl);
		usage.epoch = epoch;
		usage.frameStarted = false;
	},
	prerender(gl) {
		const webGL2 = gl;
		const usage = contextUsages.get(webGL2);
		if (usage) beginCubism5Frame(webGL2, usage);
	},
	postrender(gl) {
		const webGL2 = gl;
		const usage = contextUsages.get(webGL2);
		if (usage) endCubism5Frame(webGL2, usage);
	}
});
function validateShaderPrograms(gl, shader) {
	if (!shader._shaderSets.length) throw new Error("Cubism 5 reported shader readiness without creating shader programs.");
	const requiredIndices = new Set(Array.from({ length: 11 }, (_, index) => index));
	for (const baseIndex of shader._blendShaderSetMap.values()) {
		requiredIndices.add(baseIndex);
		requiredIndices.add(baseIndex + 1);
		requiredIndices.add(baseIndex + 2);
	}
	const programs = /* @__PURE__ */ new Set();
	for (const index of requiredIndices) {
		var _shader$_shaderSets$i;
		const program = (_shader$_shaderSets$i = shader._shaderSets[index]) === null || _shader$_shaderSets$i === void 0 ? void 0 : _shader$_shaderSets$i.shaderProgram;
		if (!program) throw new Error(`Cubism 5 shader program ${index} failed to compile or link.`);
		programs.add(program);
	}
	for (const program of programs) if (!gl.isProgram(program) || !gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("A Cubism 5 shader program failed WebGL link validation.");
}
function invalidateShaderRecord(shader) {
	const record = shaderLoadRecords.get(shader);
	if (record) record.valid = false;
	shaderLoadRecords.delete(shader);
}
function assertSharedRecord(shader, record) {
	if (!record.valid || shaderLoadRecords.get(shader) !== record) throw new Cubism5ShaderLoadCancelledError();
}
function assertCurrent(isCurrent) {
	if (!isCurrent()) throw new Cubism5ShaderLoadCancelledError();
}
function shaderTimeoutError(path) {
	return /* @__PURE__ */ new Error(`Timed out while loading or compiling Cubism 5 shaders from ${path}.`);
}
function releaseKnownShaderPrograms() {
	for (const shader of knownShaders) {
		for (const shaderSet of shader._shaderSets) {
			const program = shaderSet === null || shaderSet === void 0 ? void 0 : shaderSet.shaderProgram;
			if (program && typeof program === "object") shader.gl.deleteProgram(program);
		}
		shader._shaderSets.length = 0;
	}
	knownShaders.clear();
}
//#endregion
//#region src/cubism5/Cubism5InternalModel.ts
var tempMatrix = new CubismMatrix44();
var Cubism5InternalModel = class extends InternalModel {
	constructor(coreModel, settings, options) {
		super();
		this.lipSync = true;
		this.breath = CubismBreath.create();
		this.shaderState = "idle";
		this.shaderPath = "";
		this.shaderGeneration = 0;
		this.idParamAngleX = "ParamAngleX";
		this.idParamAngleY = "ParamAngleY";
		this.idParamAngleZ = "ParamAngleZ";
		this.idParamEyeBallX = "ParamEyeBallX";
		this.idParamEyeBallY = "ParamEyeBallY";
		this.idParamBodyAngleX = "ParamBodyAngleX";
		this.idParamBreath = CubismDefaultParameterId.ParamBreath;
		this.pixelsPerUnit = 1;
		this.centeringTransform = new Matrix();
		this.coreModel = coreModel;
		this.settings = settings;
		this.motionManager = new Cubism5MotionManager(settings, options);
		this.eyeballXParamIndex = this.coreModel.getParameterIndex(CubismFramework.getIdManager().getId(this.idParamEyeBallX));
		this.eyeballYParamIndex = this.coreModel.getParameterIndex(CubismFramework.getIdManager().getId(this.idParamEyeBallY));
		this.angleXParamIndex = this.coreModel.getParameterIndex(CubismFramework.getIdManager().getId(this.idParamAngleX));
		this.angleYParamIndex = this.coreModel.getParameterIndex(CubismFramework.getIdManager().getId(this.idParamAngleY));
		this.angleZParamIndex = this.coreModel.getParameterIndex(CubismFramework.getIdManager().getId(this.idParamAngleZ));
		this.bodyAngleXParamIndex = this.coreModel.getParameterIndex(CubismFramework.getIdManager().getId(this.idParamBodyAngleX));
		this.breathParamIndex = this.coreModel.getParameterIndex(this.idParamBreath);
		this.init();
	}
	init() {
		var _this$settings$getEye;
		super.init();
		if ((_this$settings$getEye = this.settings.getEyeBlinkParameters()) === null || _this$settings$getEye === void 0 ? void 0 : _this$settings$getEye.length) this.eyeBlink = CubismEyeBlink.create(this.settings);
		const breathParams = [];
		breathParams.push(new BreathParameterData(CubismFramework.getIdManager().getId(this.idParamAngleX), 0, 15, 6.5345, .5));
		breathParams.push(new BreathParameterData(CubismFramework.getIdManager().getId(this.idParamAngleY), 0, 8, 3.5345, .5));
		breathParams.push(new BreathParameterData(CubismFramework.getIdManager().getId(this.idParamAngleZ), 0, 10, 5.5345, .5));
		breathParams.push(new BreathParameterData(CubismFramework.getIdManager().getId(this.idParamBodyAngleX), 0, 4, 15.5345, .5));
		breathParams.push(new BreathParameterData(this.idParamBreath, 0, .5, 3.2345, .5));
		this.breath.setParameters(breathParams);
	}
	getSize() {
		return [this.coreModel.getModel().canvasinfo.CanvasWidth, this.coreModel.getModel().canvasinfo.CanvasHeight];
	}
	getLayout() {
		const layout = {};
		if (this.settings.layout) for (const [key, value] of Object.entries(this.settings.layout)) {
			const commonKey = key.charAt(0).toLowerCase() + key.slice(1);
			layout[commonKey] = value;
		}
		return layout;
	}
	setupLayout() {
		super.setupLayout();
		this.pixelsPerUnit = this.coreModel.getModel().canvasinfo.PixelsPerUnit;
		this.centeringTransform.scale(this.pixelsPerUnit, this.pixelsPerUnit).translate(this.originalWidth / 2, this.originalHeight / 2);
	}
	updateWebGLContext(gl, _glContextID, contextEpoch) {
		try {
			var _this$renderer;
			if (this.gl !== gl) {
				if (this.gl) this.releaseWebGLContext(this.gl);
				retainCubism5Context(gl);
				this.gl = gl;
			}
			this.shaderGeneration++;
			this.shaderState = "loading";
			this.shaderError = void 0;
			(_this$renderer = this.renderer) === null || _this$renderer === void 0 || _this$renderer.release();
			const renderer = new CubismRenderer_WebGL(Math.max(1, Math.floor(this.viewport[2] || gl.drawingBufferWidth)), Math.max(1, Math.floor(this.viewport[3] || gl.drawingBufferHeight)));
			this.renderer = renderer;
			renderer.initialize(this.coreModel, 3);
			renderer.setIsPremultipliedAlpha(true);
			renderer.startUp(gl);
			this.shaderPath = normalizeCubism5ShaderPath(config.cubism5ShaderPath);
			const generation = this.shaderGeneration;
			const task = loadCubism5Shaders(gl, this.shaderPath, contextEpoch, () => !this.destroyed && generation === this.shaderGeneration).then(() => {
				if (generation === this.shaderGeneration) this.shaderState = "ready";
			}).catch((cause) => {
				if (generation !== this.shaderGeneration || cause instanceof Cubism5ShaderLoadCancelledError) throw cause;
				const error = new Error(`Failed to initialize Cubism 5 shaders from ${this.shaderPath}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
				this.shaderState = "error";
				this.shaderError = error;
				this.emit("shaderLoadError", error);
				throw error;
			});
			this.shaderReady = task;
			task.catch(() => {});
		} catch (cause) {
			if (this.gl === gl) this.releaseWebGLContext(gl);
			const error = cause instanceof Error ? cause : /* @__PURE__ */ new Error(`Failed to initialize the Cubism 5 WebGL renderer: ${String(cause)}`);
			this.shaderState = "error";
			this.shaderError = error;
			this.emit("shaderLoadError", error);
			throw error;
		}
	}
	bindTexture(index, texture) {
		var _this$renderer2;
		(_this$renderer2 = this.renderer) === null || _this$renderer2 === void 0 || _this$renderer2.bindTexture(index, texture);
	}
	getHitAreaDefs() {
		var _this$settings$hitAre, _this$settings$hitAre2;
		const drawableIds = this.getDrawableIDs();
		return (_this$settings$hitAre = (_this$settings$hitAre2 = this.settings.hitAreas) === null || _this$settings$hitAre2 === void 0 ? void 0 : _this$settings$hitAre2.map((hitArea) => {
			const index = drawableIds.indexOf(hitArea.Id);
			return {
				id: hitArea.Id,
				name: hitArea.Name,
				index
			};
		})) !== null && _this$settings$hitAre !== void 0 ? _this$settings$hitAre : [];
	}
	getDrawableIDs() {
		return this.coreModel.getModel().drawables.ids;
	}
	getDrawableIndex(id) {
		return this.coreModel.getDrawableIndex(id);
	}
	getDrawableVertices(drawIndex) {
		if (typeof drawIndex === "string") {
			drawIndex = this.coreModel.getDrawableIndex(drawIndex);
			if (drawIndex === -1) throw new TypeError("Unable to find drawable ID: " + drawIndex);
		}
		const arr = this.coreModel.getDrawableVertices(drawIndex).slice();
		for (let i = 0; i < arr.length; i += 2) {
			arr[i] = arr[i] * this.pixelsPerUnit + this.originalWidth / 2;
			arr[i + 1] = -arr[i + 1] * this.pixelsPerUnit + this.originalHeight / 2;
		}
		return arr;
	}
	updateTransform(transform) {
		this.drawingMatrix.copyFrom(this.centeringTransform).prepend(this.localTransform).prepend(transform);
	}
	update(dt, now) {
		var _this$motionManager$e, _this$physics, _this$pose;
		super.update(dt, now);
		dt /= 1e3;
		now /= 1e3;
		const model = this.coreModel;
		model.loadParameters();
		this.emit("beforeMotionUpdate");
		const motionUpdated = this.motionManager.update(this.coreModel, now);
		this.emit("afterMotionUpdate");
		model.saveParameters();
		if (!motionUpdated) {
			var _this$eyeBlink;
			(_this$eyeBlink = this.eyeBlink) === null || _this$eyeBlink === void 0 || _this$eyeBlink.updateParameters(model, dt);
		}
		(_this$motionManager$e = this.motionManager.expressionManager) === null || _this$motionManager$e === void 0 || _this$motionManager$e.update(model, now);
		this.updateNaturalMovements(dt * 1e3, now * 1e3);
		(_this$physics = this.physics) === null || _this$physics === void 0 || _this$physics.evaluate(model, dt);
		(_this$pose = this.pose) === null || _this$pose === void 0 || _this$pose.updateParameters(model, dt);
		this.updateFocus();
		this.emit("beforeModelUpdate");
		model.update();
	}
	updateFocus() {
		if (this.eyeballXParamIndex < 0 || this.angleXParamIndex < 0) return;
		const eyeX = this.focusController.x;
		const eyeY = this.focusController.y;
		const angleX = this.focusController.x * 30;
		const angleY = this.focusController.y * 30;
		this.coreModel.setParameterValueByIndex(this.eyeballXParamIndex, eyeX);
		this.coreModel.setParameterValueByIndex(this.eyeballYParamIndex, eyeY);
		this.coreModel.setParameterValueByIndex(this.angleXParamIndex, angleX);
		this.coreModel.setParameterValueByIndex(this.angleYParamIndex, angleY);
		this.coreModel.setParameterValueByIndex(this.angleZParamIndex, this.focusController.x * this.focusController.y * -30);
		this.coreModel.setParameterValueByIndex(this.bodyAngleXParamIndex, this.focusController.x * 10);
	}
	updateNaturalMovements(dt, now) {
		var _this$breath;
		(_this$breath = this.breath) === null || _this$breath === void 0 || _this$breath.updateParameters(this.coreModel, dt / 1e3);
	}
	draw(gl) {
		if (this.shaderError) throw this.shaderError;
		const renderer = this.renderer;
		if (!renderer || this.shaderState !== "ready") return;
		const matrix = this.drawingMatrix;
		const array = tempMatrix.getArray();
		array[0] = matrix.a;
		array[1] = matrix.b;
		array[4] = -matrix.c;
		array[5] = -matrix.d;
		array[12] = matrix.tx;
		array[13] = matrix.ty;
		renderer.setMvpMatrix(tempMatrix);
		renderer.setRenderState(gl.getParameter(gl.FRAMEBUFFER_BINDING), this.viewport);
		if (!this._dbgLogged) {
			var _im$isUsingMasking, _im$isBlendModeEnable, _im$isUsingMaskingFor, _im$getDrawableCount;
			this._dbgLogged = true;
			const im = this.coreModel;
			console.log("[Cubism#] draw called, masking=", (_im$isUsingMasking = im.isUsingMasking) === null || _im$isUsingMasking === void 0 ? void 0 : _im$isUsingMasking.call(im), " blend=", (_im$isBlendModeEnable = im.isBlendModeEnabled) === null || _im$isBlendModeEnable === void 0 ? void 0 : _im$isBlendModeEnable.call(im), " offscreenMask=", (_im$isUsingMaskingFor = im.isUsingMaskingForOffscreen) === null || _im$isUsingMaskingFor === void 0 ? void 0 : _im$isUsingMaskingFor.call(im), " drawNum=", (_im$getDrawableCount = im.getDrawableCount) === null || _im$getDrawableCount === void 0 ? void 0 : _im$getDrawableCount.call(im), " mv=", Array.from(tempMatrix.getArray()).map((x) => +x.toFixed(2)).join(","), " vp=", this.viewport.join(","), " fbo=", String(gl.getParameter(gl.FRAMEBUFFER_BINDING)));
		}
		renderer.drawModel(this.shaderPath);
	}
	releaseWebGLContext(gl) {
		if (this.gl !== gl) return;
		this.shaderGeneration++;
		const renderer = this.renderer;
		this.renderer = void 0;
		this.shaderState = "idle";
		this.shaderReady = void 0;
		this.shaderError = void 0;
		this.gl = void 0;
		try {
			renderer === null || renderer === void 0 || renderer.release();
		} finally {
			releaseCubism5Context(gl);
		}
	}
	destroy() {
		super.destroy();
		if (this.gl) this.releaseWebGLContext(this.gl);
		this.coreModel.release();
		this.renderer = void 0;
		this.coreModel = void 0;
	}
};
//#endregion
//#region src/cubism5/Cubism5ModelSettings.ts
var Cubism5ModelSettings = class Cubism5ModelSettings extends ModelSettings {
	static isValidJSON(json) {
		const maybeSettings = json;
		const fileReferences = maybeSettings === null || maybeSettings === void 0 ? void 0 : maybeSettings.FileReferences;
		return !!fileReferences && typeof fileReferences.Moc === "string" && Array.isArray(fileReferences.Textures) && fileReferences.Textures.length > 0 && fileReferences.Textures.every((item) => typeof item === "string");
	}
	constructor(json) {
		super(json);
		if (!Cubism5ModelSettings.isValidJSON(json)) throw new TypeError("Invalid JSON.");
		this.moc = json.FileReferences.Moc;
		this.textures = json.FileReferences.Textures;
		this.layout = json.Layout;
		this.userData = json.FileReferences.UserData;
		if (json.FileReferences.Physics) this.physics = json.FileReferences.Physics;
		if (json.FileReferences.Pose) this.pose = json.FileReferences.Pose;
		if (json.HitAreas) this.hitAreas = json.HitAreas;
		if (json.FileReferences.Motions) this.motions = json.FileReferences.Motions;
		if (json.FileReferences.Expressions) this.expressions = json.FileReferences.Expressions;
	}
	getModelFileName() {
		return this.moc;
	}
	getTextureCount() {
		return this.textures.length;
	}
	getTextureDirectory() {
		const firstTexture = this.textures[0];
		if (!(firstTexture === null || firstTexture === void 0 ? void 0 : firstTexture.includes("/"))) return "";
		return firstTexture.slice(0, firstTexture.lastIndexOf("/"));
	}
	getTextureFileName(index) {
		var _this$textures$index;
		return (_this$textures$index = this.textures[index]) !== null && _this$textures$index !== void 0 ? _this$textures$index : "";
	}
	getHitAreasCount() {
		var _this$hitAreas$length, _this$hitAreas;
		return (_this$hitAreas$length = (_this$hitAreas = this.hitAreas) === null || _this$hitAreas === void 0 ? void 0 : _this$hitAreas.length) !== null && _this$hitAreas$length !== void 0 ? _this$hitAreas$length : 0;
	}
	getHitAreaId(index) {
		var _this$hitAreas2;
		const hitArea = (_this$hitAreas2 = this.hitAreas) === null || _this$hitAreas2 === void 0 ? void 0 : _this$hitAreas2[index];
		return hitArea ? CubismFramework.getIdManager().getId(hitArea.Id) : void 0;
	}
	getHitAreaName(index) {
		var _this$hitAreas$index$, _this$hitAreas3;
		return (_this$hitAreas$index$ = (_this$hitAreas3 = this.hitAreas) === null || _this$hitAreas3 === void 0 || (_this$hitAreas3 = _this$hitAreas3[index]) === null || _this$hitAreas3 === void 0 ? void 0 : _this$hitAreas3.Name) !== null && _this$hitAreas$index$ !== void 0 ? _this$hitAreas$index$ : "";
	}
	getPhysicsFileName() {
		var _this$physics;
		return (_this$physics = this.physics) !== null && _this$physics !== void 0 ? _this$physics : "";
	}
	getPoseFileName() {
		var _this$pose;
		return (_this$pose = this.pose) !== null && _this$pose !== void 0 ? _this$pose : "";
	}
	getExpressionCount() {
		var _this$expressions$len, _this$expressions;
		return (_this$expressions$len = (_this$expressions = this.expressions) === null || _this$expressions === void 0 ? void 0 : _this$expressions.length) !== null && _this$expressions$len !== void 0 ? _this$expressions$len : 0;
	}
	getExpressionName(index) {
		var _this$expressions$ind, _this$expressions2;
		return (_this$expressions$ind = (_this$expressions2 = this.expressions) === null || _this$expressions2 === void 0 || (_this$expressions2 = _this$expressions2[index]) === null || _this$expressions2 === void 0 ? void 0 : _this$expressions2.Name) !== null && _this$expressions$ind !== void 0 ? _this$expressions$ind : "";
	}
	getExpressionFileName(index) {
		var _this$expressions$ind2, _this$expressions3;
		return (_this$expressions$ind2 = (_this$expressions3 = this.expressions) === null || _this$expressions3 === void 0 || (_this$expressions3 = _this$expressions3[index]) === null || _this$expressions3 === void 0 ? void 0 : _this$expressions3.File) !== null && _this$expressions$ind2 !== void 0 ? _this$expressions$ind2 : "";
	}
	getMotionGroupCount() {
		var _this$motions;
		return Object.keys((_this$motions = this.motions) !== null && _this$motions !== void 0 ? _this$motions : {}).length;
	}
	getMotionGroupName(index) {
		var _Object$keys$index, _this$motions2;
		return (_Object$keys$index = Object.keys((_this$motions2 = this.motions) !== null && _this$motions2 !== void 0 ? _this$motions2 : {})[index]) !== null && _Object$keys$index !== void 0 ? _Object$keys$index : "";
	}
	getMotionCount(groupName) {
		var _this$motions$groupNa, _this$motions3;
		return (_this$motions$groupNa = (_this$motions3 = this.motions) === null || _this$motions3 === void 0 || (_this$motions3 = _this$motions3[groupName]) === null || _this$motions3 === void 0 ? void 0 : _this$motions3.length) !== null && _this$motions$groupNa !== void 0 ? _this$motions$groupNa : 0;
	}
	getMotionFileName(groupName, index) {
		var _this$motions$groupNa2, _this$motions4;
		return (_this$motions$groupNa2 = (_this$motions4 = this.motions) === null || _this$motions4 === void 0 || (_this$motions4 = _this$motions4[groupName]) === null || _this$motions4 === void 0 || (_this$motions4 = _this$motions4[index]) === null || _this$motions4 === void 0 ? void 0 : _this$motions4.File) !== null && _this$motions$groupNa2 !== void 0 ? _this$motions$groupNa2 : "";
	}
	getMotionSoundFileName(groupName, index) {
		var _this$motions$groupNa3, _this$motions5;
		return (_this$motions$groupNa3 = (_this$motions5 = this.motions) === null || _this$motions5 === void 0 || (_this$motions5 = _this$motions5[groupName]) === null || _this$motions5 === void 0 || (_this$motions5 = _this$motions5[index]) === null || _this$motions5 === void 0 ? void 0 : _this$motions5.Sound) !== null && _this$motions$groupNa3 !== void 0 ? _this$motions$groupNa3 : "";
	}
	getMotionFadeInTimeValue(groupName, index) {
		var _this$motions$groupNa4, _this$motions6;
		return (_this$motions$groupNa4 = (_this$motions6 = this.motions) === null || _this$motions6 === void 0 || (_this$motions6 = _this$motions6[groupName]) === null || _this$motions6 === void 0 || (_this$motions6 = _this$motions6[index]) === null || _this$motions6 === void 0 ? void 0 : _this$motions6.FadeInTime) !== null && _this$motions$groupNa4 !== void 0 ? _this$motions$groupNa4 : -1;
	}
	getMotionFadeOutTimeValue(groupName, index) {
		var _this$motions$groupNa5, _this$motions7;
		return (_this$motions$groupNa5 = (_this$motions7 = this.motions) === null || _this$motions7 === void 0 || (_this$motions7 = _this$motions7[groupName]) === null || _this$motions7 === void 0 || (_this$motions7 = _this$motions7[index]) === null || _this$motions7 === void 0 ? void 0 : _this$motions7.FadeOutTime) !== null && _this$motions$groupNa5 !== void 0 ? _this$motions$groupNa5 : -1;
	}
	getUserDataFile() {
		var _this$userData;
		return (_this$userData = this.userData) !== null && _this$userData !== void 0 ? _this$userData : "";
	}
	getLayoutMap(outLayoutMap) {
		if (!this.layout) return false;
		Object.entries(this.layout).forEach(([key, value]) => {
			outLayoutMap.set(key, value);
		});
		return true;
	}
	getGroupParameterIds(groupName) {
		var _this$json$Groups$fin, _this$json$Groups;
		return (_this$json$Groups$fin = (_this$json$Groups = this.json.Groups) === null || _this$json$Groups === void 0 || (_this$json$Groups = _this$json$Groups.find((group) => group.Name === groupName)) === null || _this$json$Groups === void 0 ? void 0 : _this$json$Groups.Ids.slice()) !== null && _this$json$Groups$fin !== void 0 ? _this$json$Groups$fin : [];
	}
	getEyeBlinkParameterCount() {
		return this.getGroupParameterIds("EyeBlink").length;
	}
	getEyeBlinkParameterId(index) {
		const parameterId = this.getGroupParameterIds("EyeBlink")[index];
		return parameterId ? CubismFramework.getIdManager().getId(parameterId) : void 0;
	}
	/**
	* Get all eye blink parameter IDs as an array
	*/
	getEyeBlinkParameters() {
		return this.getGroupParameterIds("EyeBlink");
	}
	getLipSyncParameterCount() {
		return this.getGroupParameterIds("LipSync").length;
	}
	getLipSyncParameterId(index) {
		const parameterId = this.getGroupParameterIds("LipSync")[index];
		return parameterId ? CubismFramework.getIdManager().getId(parameterId) : void 0;
	}
	/**
	* Get all lip sync parameter IDs as an array
	*/
	getLipSyncParameters() {
		return this.getGroupParameterIds("LipSync");
	}
	replaceFiles(replace) {
		super.replaceFiles(replace);
		if (this.motions) for (const [group, motions] of Object.entries(this.motions)) for (let i = 0; i < motions.length; i++) {
			motions[i].File = replace(motions[i].File, `motions.${group}[${i}].File`);
			if (motions[i].Sound !== void 0) motions[i].Sound = replace(motions[i].Sound, `motions.${group}[${i}].Sound`);
		}
		if (this.expressions) for (let i = 0; i < this.expressions.length; i++) this.expressions[i].File = replace(this.expressions[i].File, `expressions[${i}].File`);
	}
};
//#endregion
//#region src/cubism5/setup.ts
var startupPromise;
var startupRetries = 20;
/**
* Promises that the Cubism 5 framework is ready to work.
* @return Promise that resolves if the startup has succeeded, rejects if failed.
*/
function cubism5Ready() {
	var _startupPromise;
	if (CubismFramework.isStarted()) return Promise.resolve();
	(_startupPromise = startupPromise) !== null && _startupPromise !== void 0 || (startupPromise = new Promise((resolve, reject) => {
		function startUpWithRetry() {
			try {
				startUpCubism5();
				resolve();
			} catch (e) {
				startupRetries--;
				if (startupRetries < 0) {
					const err = /* @__PURE__ */ new Error("Failed to start up Cubism 5 framework.");
					err.cause = e;
					reject(err);
					return;
				}
				logger.log("Cubism5", "Startup failed, retrying 10ms later...");
				setTimeout(startUpWithRetry, 10);
			}
		}
		startUpWithRetry();
	}));
	return startupPromise;
}
/**
* Starts up Cubism 5 framework.
*/
function startUpCubism5(options) {
	var _config$cubism5$logLe;
	options = Object.assign({
		logFunction: function () {},
		loggingLevel: (_config$cubism5$logLe = config.cubism5.logLevel) !== null && _config$cubism5$logLe !== void 0 ? _config$cubism5$logLe : LogLevel.LogLevel_Warning
	}, options);
	CubismFramework.startUp(options);
	CubismFramework.initialize();
}
//#endregion
//#region cubism/src/effect/cubismpose.ts
var Epsilon = .001;
var DefaultFadeInSeconds = .5;
var FadeIn = "FadeInTime";
var Link = "Link";
var Groups = "Groups";
var Id$1 = "Id";
/**
* パーツの不透明度の設定
*
* パーツの不透明度の管理と設定を行う。
*/
var CubismPose = class CubismPose {
	/**
	* インスタンスの作成
	* @param pose3json pose3.jsonのデータ
	* @param size pose3.jsonのデータのサイズ[byte]
	* @return 作成されたインスタンス
	*/
	static create(pose3json, size) {
		const json = CubismJson.create(pose3json, size);
		if (!json) return null;
		const ret = new CubismPose();
		const root = json.getRoot();
		if (!root.getValueByString(FadeIn).isNull()) {
			ret._fadeTimeSeconds = root.getValueByString(FadeIn).toFloat(DefaultFadeInSeconds);
			if (ret._fadeTimeSeconds < 0) ret._fadeTimeSeconds = DefaultFadeInSeconds;
		}
		const poseListInfo = root.getValueByString(Groups);
		const poseCount = poseListInfo.getSize();
		ret._partGroupCounts.length = poseCount;
		for (let poseIndex = 0; poseIndex < poseCount; ++poseIndex) {
			const idListInfo = poseListInfo.getValueByIndex(poseIndex);
			const idCount = idListInfo.getSize();
			let groupCount = 0;
			for (let groupIndex = 0; groupIndex < idCount; ++groupIndex) {
				const partInfo = idListInfo.getValueByIndex(groupIndex);
				const partData = new PartData();
				partData.partId = CubismFramework.getIdManager().getId(partInfo.getValueByString(Id$1).getRawString());
				if (!partInfo.getValueByString(Link).isNull()) {
					const linkListInfo = partInfo.getValueByString(Link);
					const linkCount = linkListInfo.getSize();
					for (let linkIndex = 0; linkIndex < linkCount; ++linkIndex) {
						const linkPart = new PartData();
						linkPart.partId = CubismFramework.getIdManager().getId(linkListInfo.getValueByIndex(linkIndex).getString());
						partData.link.push(linkPart);
					}
				}
				ret._partGroups.push(partData.clone());
				++groupCount;
			}
			ret._partGroupCounts[poseIndex] = groupCount;
		}
		CubismJson.delete(json);
		return ret;
	}
	/**
	* インスタンスを破棄する
	* @param pose 対象のCubismPose
	*/
	static delete(pose) {
		if (pose != null) pose = null;
	}
	/**
	* モデルのパラメータの更新
	* @param model 対象のモデル
	* @param deltaTimeSeconds デルタ時間[秒]
	*/
	updateParameters(model, deltaTimeSeconds) {
		if (model != this._lastModel) this.reset(model);
		this._lastModel = model;
		if (deltaTimeSeconds < 0) deltaTimeSeconds = 0;
		let beginIndex = 0;
		for (let i = 0; i < this._partGroupCounts.length; i++) {
			const partGroupCount = this._partGroupCounts[i];
			this.doFade(model, deltaTimeSeconds, beginIndex, partGroupCount);
			beginIndex += partGroupCount;
		}
		this.copyPartOpacities(model);
	}
	/**
	* 表示を初期化
	* @param model 対象のモデル
	* @note 不透明度の初期値が0でないパラメータは、不透明度を１に設定する
	*/
	reset(model) {
		let beginIndex = 0;
		for (let i = 0; i < this._partGroupCounts.length; ++i) {
			const groupCount = this._partGroupCounts[i];
			for (let j = beginIndex; j < beginIndex + groupCount; ++j) {
				this._partGroups[j].initialize(model);
				const partsIndex = this._partGroups[j].partIndex;
				const paramIndex = this._partGroups[j].parameterIndex;
				if (partsIndex < 0) continue;
				model.setPartOpacityByIndex(partsIndex, j == beginIndex ? 1 : 0);
				model.setParameterValueByIndex(paramIndex, j == beginIndex ? 1 : 0);
				for (let k = 0; k < this._partGroups[j].link.length; ++k) this._partGroups[j].link[k].initialize(model);
			}
			beginIndex += groupCount;
		}
	}
	/**
	* パーツの不透明度をコピー
	*
	* @param model 対象のモデル
	*/
	copyPartOpacities(model) {
		for (let groupIndex = 0; groupIndex < this._partGroups.length; ++groupIndex) {
			const partData = this._partGroups[groupIndex];
			if (partData.link.length == 0) continue;
			const partIndex = this._partGroups[groupIndex].partIndex;
			const opacity = model.getPartOpacityByIndex(partIndex);
			for (let linkIndex = 0; linkIndex < partData.link.length; ++linkIndex) {
				const linkPartIndex = partData.link[linkIndex].partIndex;
				if (linkPartIndex < 0) continue;
				model.setPartOpacityByIndex(linkPartIndex, opacity);
			}
		}
	}
	/**
	* パーツのフェード操作を行う。
	* @param model 対象のモデル
	* @param deltaTimeSeconds デルタ時間[秒]
	* @param beginIndex フェード操作を行うパーツグループの先頭インデックス
	* @param partGroupCount フェード操作を行うパーツグループの個数
	*/
	doFade(model, deltaTimeSeconds, beginIndex, partGroupCount) {
		let visiblePartIndex = -1;
		let newOpacity = 1;
		const phi = .5;
		const backOpacityThreshold = .15;
		for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
			const partIndex = this._partGroups[i].partIndex;
			const paramIndex = this._partGroups[i].parameterIndex;
			if (model.getParameterValueByIndex(paramIndex) > Epsilon) {
				if (visiblePartIndex >= 0) break;
				visiblePartIndex = i;
				if (this._fadeTimeSeconds == 0) {
					newOpacity = 1;
					continue;
				}
				newOpacity = model.getPartOpacityByIndex(partIndex);
				newOpacity += deltaTimeSeconds / this._fadeTimeSeconds;
				if (newOpacity > 1) newOpacity = 1;
			}
		}
		if (visiblePartIndex < 0) {
			visiblePartIndex = 0;
			newOpacity = 1;
		}
		for (let i = beginIndex; i < beginIndex + partGroupCount; ++i) {
			const partsIndex = this._partGroups[i].partIndex;
			if (visiblePartIndex == i) model.setPartOpacityByIndex(partsIndex, newOpacity);
			else {
				let opacity = model.getPartOpacityByIndex(partsIndex);
				let a1;
				if (newOpacity < phi) a1 = newOpacity * (phi - 1) / phi + 1;
				else a1 = (1 - newOpacity) * phi / (1 - phi);
				if ((1 - a1) * (1 - newOpacity) > backOpacityThreshold) a1 = 1 - backOpacityThreshold / (1 - newOpacity);
				if (opacity > a1) opacity = a1;
				model.setPartOpacityByIndex(partsIndex, opacity);
			}
		}
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		this._fadeTimeSeconds = DefaultFadeInSeconds;
		this._lastModel = null;
		this._partGroups = new Array();
		this._partGroupCounts = new Array();
	}
};
/**
* パーツにまつわるデータを管理
*/
var PartData = class PartData {
	/**
	* コンストラクタ
	*/
	constructor(v) {
		this.parameterIndex = 0;
		this.partIndex = 0;
		this.link = new Array();
		if (v != void 0) {
			this.partId = v.partId;
			this.link.length = v.link.length;
			for (let i = 0; i < v.link.length; i++) this.link[i] = v.link[i].clone();
		}
	}
	/**
	* =演算子のオーバーロード
	*/
	assignment(v) {
		this.partId = v.partId;
		let dstIndex = this.link.length;
		this.link.length += v.link.length;
		for (const partData of v.link) this.link[dstIndex++] = partData.clone();
		return this;
	}
	/**
	* 初期化
	* @param model 初期化に使用するモデル
	*/
	initialize(model) {
		this.parameterIndex = model.getParameterIndex(this.partId);
		this.partIndex = model.getPartIndex(this.partId);
		model.setParameterValueByIndex(this.parameterIndex, 1);
	}
	/**
	* オブジェクトのコピーを生成する
	*/
	clone() {
		const clonePartData = new PartData();
		clonePartData.partId = this.partId;
		clonePartData.parameterIndex = this.parameterIndex;
		clonePartData.partIndex = this.partIndex;
		clonePartData.link = new Array();
		clonePartData.link.length = this.link.length;
		for (let i = 0; i < this.link.length; i++) clonePartData.link[i] = this.link[i].clone();
		return clonePartData;
	}
};
var Live2DCubismFramework$4;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismPose = CubismPose;
	_Live2DCubismFramework.PartData = PartData;
})(Live2DCubismFramework$4 || (Live2DCubismFramework$4 = {}));
//#endregion
//#region cubism/src/model/cubismmoc.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
/**
* Mocデータの管理
*
* Mocデータの管理を行うクラス。
*/
var CubismMoc = class CubismMoc {
	/**
	* Mocデータの作成
	*/
	static create(mocBytes, shouldCheckMocConsistency) {
		let cubismMoc = null;
		if (shouldCheckMocConsistency) {
			if (!this.hasMocConsistency(mocBytes)) {
				CubismLogError(`Inconsistent MOC3.`);
				return cubismMoc;
			}
		}
		const moc = Live2DCubismCore.Moc.fromArrayBuffer(mocBytes);
		if (moc) {
			cubismMoc = new CubismMoc(moc);
			cubismMoc._mocVersion = Live2DCubismCore.Version.csmGetMocVersion(mocBytes);
		}
		return cubismMoc;
	}
	/**
	* Mocデータを削除
	*
	* Mocデータを削除する
	*/
	static delete(moc) {
		moc._moc._release();
		moc._moc = null;
		moc = null;
	}
	/**
	* モデルを作成する
	*
	* @return Mocデータから作成されたモデル
	*/
	createModel() {
		let cubismModel = null;
		const model = Live2DCubismCore.Model.fromMoc(this._moc);
		if (model) {
			cubismModel = new CubismModel(model);
			cubismModel.initialize();
			++this._modelCount;
		}
		return cubismModel;
	}
	/**
	* モデルを削除する
	*/
	deleteModel(model) {
		if (model != null) {
			model.release();
			model = null;
			--this._modelCount;
		}
	}
	/**
	* コンストラクタ
	*/
	constructor(moc) {
		this._moc = moc;
		this._modelCount = 0;
		this._mocVersion = 0;
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		CSM_ASSERT(this._modelCount == 0);
		this._moc._release();
		this._moc = null;
	}
	/**
	* 最新の.moc3 Versionを取得
	*/
	getLatestMocVersion() {
		return Live2DCubismCore.Version.csmGetLatestMocVersion();
	}
	/**
	* 読み込んだモデルの.moc3 Versionを取得
	*/
	getMocVersion() {
		return this._mocVersion;
	}
	/**
	* Mocファイルのbufferから.moc3 Versionを取得
	* @param mocBytes Mocファイルのバイト配列
	* @returns .moc3 Version番号
	*/
	static getMocVersionFromBuffer(mocBytes) {
		return Live2DCubismCore.Version.csmGetMocVersion(mocBytes);
	}
	/**
	* .moc3 の整合性を検証する
	*/
	static hasMocConsistency(mocBytes) {
		return Live2DCubismCore.Moc.prototype.hasMocConsistency(mocBytes) === 1 ? true : false;
	}
};
var Live2DCubismFramework$3;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismMoc = CubismMoc;
})(Live2DCubismFramework$3 || (Live2DCubismFramework$3 = {}));
//#endregion
//#region cubism/src/physics/cubismphysicsinternal.ts
/**
* 物理演算の適用先の種類
*/
var CubismPhysicsTargetType = /* @__PURE__ */ function(CubismPhysicsTargetType) {
	CubismPhysicsTargetType[CubismPhysicsTargetType["CubismPhysicsTargetType_Parameter"] = 0] = "CubismPhysicsTargetType_Parameter";
	return CubismPhysicsTargetType;
}({});
/**
* 物理演算の入力の種類
*/
var CubismPhysicsSource = /* @__PURE__ */ function(CubismPhysicsSource) {
	CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_X"] = 0] = "CubismPhysicsSource_X";
	CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_Y"] = 1] = "CubismPhysicsSource_Y";
	CubismPhysicsSource[CubismPhysicsSource["CubismPhysicsSource_Angle"] = 2] = "CubismPhysicsSource_Angle";
	return CubismPhysicsSource;
}({});
/**
* @brief 物理演算で使用する外部の力
*
* 物理演算で使用する外部の力。
*/
var PhysicsJsonEffectiveForces = class {
	constructor() {
		this.gravity = new CubismVector2(0, 0);
		this.wind = new CubismVector2(0, 0);
	}
};
/**
* 物理演算のパラメータ情報
*/
var CubismPhysicsParameter = class {};
/**
* 物理演算の正規化情報
*/
var CubismPhysicsNormalization = class {};
/**
* 物理演算の演算委使用する物理点の情報
*/
var CubismPhysicsParticle = class {
	constructor() {
		this.initialPosition = new CubismVector2(0, 0);
		this.position = new CubismVector2(0, 0);
		this.lastPosition = new CubismVector2(0, 0);
		this.lastGravity = new CubismVector2(0, 0);
		this.force = new CubismVector2(0, 0);
		this.velocity = new CubismVector2(0, 0);
	}
};
/**
* 物理演算の物理点の管理
*/
var CubismPhysicsSubRig = class {
	constructor() {
		this.normalizationPosition = new CubismPhysicsNormalization();
		this.normalizationAngle = new CubismPhysicsNormalization();
	}
};
/**
* 物理演算の入力情報
*/
var CubismPhysicsInput = class {
	constructor() {
		this.source = new CubismPhysicsParameter();
	}
};
/**
* @brief 物理演算の出力情報
*
* 物理演算の出力情報。
*/
var CubismPhysicsOutput = class {
	constructor() {
		this.destination = new CubismPhysicsParameter();
		this.translationScale = new CubismVector2(0, 0);
	}
};
/**
* @brief 物理演算のデータ
*
* 物理演算のデータ。
*/
var CubismPhysicsRig = class {
	constructor() {
		this.settings = new Array();
		this.inputs = new Array();
		this.outputs = new Array();
		this.particles = new Array();
		this.gravity = new CubismVector2(0, 0);
		this.wind = new CubismVector2(0, 0);
		this.fps = 0;
	}
};
var Live2DCubismFramework$2;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismPhysicsInput = CubismPhysicsInput;
	_Live2DCubismFramework.CubismPhysicsNormalization = CubismPhysicsNormalization;
	_Live2DCubismFramework.CubismPhysicsOutput = CubismPhysicsOutput;
	_Live2DCubismFramework.CubismPhysicsParameter = CubismPhysicsParameter;
	_Live2DCubismFramework.CubismPhysicsParticle = CubismPhysicsParticle;
	_Live2DCubismFramework.CubismPhysicsRig = CubismPhysicsRig;
	_Live2DCubismFramework.CubismPhysicsSource = CubismPhysicsSource;
	_Live2DCubismFramework.CubismPhysicsSubRig = CubismPhysicsSubRig;
	_Live2DCubismFramework.CubismPhysicsTargetType = CubismPhysicsTargetType;
	_Live2DCubismFramework.PhysicsJsonEffectiveForces = PhysicsJsonEffectiveForces;
})(Live2DCubismFramework$2 || (Live2DCubismFramework$2 = {}));
//#endregion
//#region cubism/src/physics/cubismphysicsjson.ts
var Position = "Position";
var X = "X";
var Y = "Y";
var Angle = "Angle";
var Type = "Type";
var Id = "Id";
var Meta = "Meta";
var EffectiveForces = "EffectiveForces";
var TotalInputCount = "TotalInputCount";
var TotalOutputCount = "TotalOutputCount";
var PhysicsSettingCount = "PhysicsSettingCount";
var Gravity = "Gravity";
var Wind = "Wind";
var VertexCount = "VertexCount";
var Fps = "Fps";
var PhysicsSettings = "PhysicsSettings";
var Normalization = "Normalization";
var Minimum = "Minimum";
var Maximum = "Maximum";
var Default = "Default";
var Reflect = "Reflect";
var Weight = "Weight";
var Input = "Input";
var Source = "Source";
var Output = "Output";
var Scale = "Scale";
var VertexIndex = "VertexIndex";
var Destination = "Destination";
var Vertices = "Vertices";
var Mobility = "Mobility";
var Delay = "Delay";
var Radius = "Radius";
var Acceleration = "Acceleration";
/**
* physics3.jsonのコンテナ。
*/
var CubismPhysicsJson = class {
	/**
	* コンストラクタ
	* @param buffer physics3.jsonが読み込まれているバッファ
	* @param size バッファのサイズ
	*/
	constructor(buffer, size) {
		this._json = CubismJson.create(buffer, size);
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		CubismJson.delete(this._json);
	}
	/**
	* 重力の取得
	* @return 重力
	*/
	getGravity() {
		const ret = new CubismVector2(0, 0);
		ret.x = this._json.getRoot().getValueByString(Meta).getValueByString(EffectiveForces).getValueByString(Gravity).getValueByString(X).toFloat();
		ret.y = this._json.getRoot().getValueByString(Meta).getValueByString(EffectiveForces).getValueByString(Gravity).getValueByString(Y).toFloat();
		return ret;
	}
	/**
	* 風の取得
	* @return 風
	*/
	getWind() {
		const ret = new CubismVector2(0, 0);
		ret.x = this._json.getRoot().getValueByString(Meta).getValueByString(EffectiveForces).getValueByString(Wind).getValueByString(X).toFloat();
		ret.y = this._json.getRoot().getValueByString(Meta).getValueByString(EffectiveForces).getValueByString(Wind).getValueByString(Y).toFloat();
		return ret;
	}
	/**
	* 物理演算設定FPSの取得
	* @return 物理演算設定FPS
	*/
	getFps() {
		return this._json.getRoot().getValueByString(Meta).getValueByString(Fps).toFloat(0);
	}
	/**
	* 物理店の管理の個数の取得
	* @return 物理店の管理の個数
	*/
	getSubRigCount() {
		return this._json.getRoot().getValueByString(Meta).getValueByString(PhysicsSettingCount).toInt();
	}
	/**
	* 入力の総合計の取得
	* @return 入力の総合計
	*/
	getTotalInputCount() {
		return this._json.getRoot().getValueByString(Meta).getValueByString(TotalInputCount).toInt();
	}
	/**
	* 出力の総合計の取得
	* @return 出力の総合計
	*/
	getTotalOutputCount() {
		return this._json.getRoot().getValueByString(Meta).getValueByString(TotalOutputCount).toInt();
	}
	/**
	* 物理点の個数の取得
	* @return 物理点の個数
	*/
	getVertexCount() {
		return this._json.getRoot().getValueByString(Meta).getValueByString(VertexCount).toInt();
	}
	/**
	* 正規化された位置の最小値の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @return 正規化された位置の最小値
	*/
	getNormalizationPositionMinimumValue(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Normalization).getValueByString(Position).getValueByString(Minimum).toFloat();
	}
	/**
	* 正規化された位置の最大値の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @return 正規化された位置の最大値
	*/
	getNormalizationPositionMaximumValue(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Normalization).getValueByString(Position).getValueByString(Maximum).toFloat();
	}
	/**
	* 正規化された位置のデフォルト値の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @return 正規化された位置のデフォルト値
	*/
	getNormalizationPositionDefaultValue(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Normalization).getValueByString(Position).getValueByString(Default).toFloat();
	}
	/**
	* 正規化された角度の最小値の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @return 正規化された角度の最小値
	*/
	getNormalizationAngleMinimumValue(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Normalization).getValueByString(Angle).getValueByString(Minimum).toFloat();
	}
	/**
	* 正規化された角度の最大値の取得
	* @param physicsSettingIndex
	* @return 正規化された角度の最大値
	*/
	getNormalizationAngleMaximumValue(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Normalization).getValueByString(Angle).getValueByString(Maximum).toFloat();
	}
	/**
	* 正規化された角度のデフォルト値の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @return 正規化された角度のデフォルト値
	*/
	getNormalizationAngleDefaultValue(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Normalization).getValueByString(Angle).getValueByString(Default).toFloat();
	}
	/**
	* 入力の個数の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @return 入力の個数
	*/
	getInputCount(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Input).getVector().length;
	}
	/**
	* 入力の重みの取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param inputIndex 入力のインデックス
	* @return 入力の重み
	*/
	getInputWeight(physicsSettingIndex, inputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Input).getValueByIndex(inputIndex).getValueByString(Weight).toFloat();
	}
	/**
	* 入力の反転の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param inputIndex 入力のインデックス
	* @return 入力の反転
	*/
	getInputReflect(physicsSettingIndex, inputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Input).getValueByIndex(inputIndex).getValueByString(Reflect).toBoolean();
	}
	/**
	* 入力の種類の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param inputIndex 入力のインデックス
	* @return 入力の種類
	*/
	getInputType(physicsSettingIndex, inputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Input).getValueByIndex(inputIndex).getValueByString(Type).getRawString();
	}
	/**
	* 入力元のIDの取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param inputIndex 入力のインデックス
	* @return 入力元のID
	*/
	getInputSourceId(physicsSettingIndex, inputIndex) {
		return CubismFramework.getIdManager().getId(this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Input).getValueByIndex(inputIndex).getValueByString(Source).getValueByString(Id).getRawString());
	}
	/**
	* 出力の個数の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @return 出力の個数
	*/
	getOutputCount(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Output).getVector().length;
	}
	/**
	* 出力の物理点のインデックスの取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param outputIndex 出力のインデックス
	* @return 出力の物理点のインデックス
	*/
	getOutputVertexIndex(physicsSettingIndex, outputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Output).getValueByIndex(outputIndex).getValueByString(VertexIndex).toInt();
	}
	/**
	* 出力の角度のスケールを取得する
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param outputIndex 出力のインデックス
	* @return 出力の角度のスケール
	*/
	getOutputAngleScale(physicsSettingIndex, outputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Output).getValueByIndex(outputIndex).getValueByString(Scale).toFloat();
	}
	/**
	* 出力の重みの取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param outputIndex 出力のインデックス
	* @return 出力の重み
	*/
	getOutputWeight(physicsSettingIndex, outputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Output).getValueByIndex(outputIndex).getValueByString(Weight).toFloat();
	}
	/**
	* 出力先のIDの取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param outputIndex 出力のインデックス
	* @return 出力先のID
	*/
	getOutputDestinationId(physicsSettingIndex, outputIndex) {
		return CubismFramework.getIdManager().getId(this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Output).getValueByIndex(outputIndex).getValueByString(Destination).getValueByString(Id).getRawString());
	}
	/**
	* 出力の種類の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param outputIndex 出力のインデックス
	* @return 出力の種類
	*/
	getOutputType(physicsSettingIndex, outputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Output).getValueByIndex(outputIndex).getValueByString(Type).getRawString();
	}
	/**
	* 出力の反転の取得
	* @param physicsSettingIndex 物理演算のインデックス
	* @param outputIndex 出力のインデックス
	* @return 出力の反転
	*/
	getOutputReflect(physicsSettingIndex, outputIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Output).getValueByIndex(outputIndex).getValueByString(Reflect).toBoolean();
	}
	/**
	* 物理点の個数の取得
	* @param physicsSettingIndex 物理演算男設定のインデックス
	* @return 物理点の個数
	*/
	getParticleCount(physicsSettingIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Vertices).getVector().length;
	}
	/**
	* 物理点の動きやすさの取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param vertexIndex 物理点のインデックス
	* @return 物理点の動きやすさ
	*/
	getParticleMobility(physicsSettingIndex, vertexIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Vertices).getValueByIndex(vertexIndex).getValueByString(Mobility).toFloat();
	}
	/**
	* 物理点の遅れの取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param vertexIndex 物理点のインデックス
	* @return 物理点の遅れ
	*/
	getParticleDelay(physicsSettingIndex, vertexIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Vertices).getValueByIndex(vertexIndex).getValueByString(Delay).toFloat();
	}
	/**
	* 物理点の加速度の取得
	* @param physicsSettingIndex 物理演算の設定
	* @param vertexIndex 物理点のインデックス
	* @return 物理点の加速度
	*/
	getParticleAcceleration(physicsSettingIndex, vertexIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Vertices).getValueByIndex(vertexIndex).getValueByString(Acceleration).toFloat();
	}
	/**
	* 物理点の距離の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param vertexIndex 物理点のインデックス
	* @return 物理点の距離
	*/
	getParticleRadius(physicsSettingIndex, vertexIndex) {
		return this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Vertices).getValueByIndex(vertexIndex).getValueByString(Radius).toFloat();
	}
	/**
	* 物理点の位置の取得
	* @param physicsSettingIndex 物理演算の設定のインデックス
	* @param vertexInde 物理点のインデックス
	* @return 物理点の位置
	*/
	getParticlePosition(physicsSettingIndex, vertexIndex) {
		const ret = new CubismVector2(0, 0);
		ret.x = this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Vertices).getValueByIndex(vertexIndex).getValueByString(Position).getValueByString(X).toFloat();
		ret.y = this._json.getRoot().getValueByString(PhysicsSettings).getValueByIndex(physicsSettingIndex).getValueByString(Vertices).getValueByIndex(vertexIndex).getValueByString(Position).getValueByString(Y).toFloat();
		return ret;
	}
};
var Live2DCubismFramework$1;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismPhysicsJson = CubismPhysicsJson;
})(Live2DCubismFramework$1 || (Live2DCubismFramework$1 = {}));
//#endregion
//#region cubism/src/physics/cubismphysics.ts
/**
* Copyright(c) Live2D Inc. All rights reserved.
*
* Use of this source code is governed by the Live2D Open Software license
* that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
*/
var PhysicsTypeTagX = "X";
var PhysicsTypeTagY = "Y";
var PhysicsTypeTagAngle = "Angle";
var AirResistance = 5;
var MaximumWeight = 100;
var MovementThreshold = .001;
var MaxDeltaTime = 5;
/**
* 物理演算クラス
*/
var CubismPhysics = class CubismPhysics {
	/**
	* インスタンスの作成
	* @param buffer    physics3.jsonが読み込まれているバッファ
	* @param size      バッファのサイズ
	* @return 作成されたインスタンス
	*/
	static create(buffer, size) {
		const ret = new CubismPhysics();
		ret.parse(buffer, size);
		ret._physicsRig.gravity.y = 0;
		return ret;
	}
	/**
	* インスタンスを破棄する
	* @param physics 破棄するインスタンス
	*/
	static delete(physics) {
		if (physics != null) {
			physics.release();
			physics = null;
		}
	}
	/**
	* physics3.jsonをパースする。
	* @param physicsJson physics3.jsonが読み込まれているバッファ
	* @param size バッファのサイズ
	*/
	parse(physicsJson, size) {
		this._physicsRig = new CubismPhysicsRig();
		let json = new CubismPhysicsJson(physicsJson, size);
		this._physicsRig.gravity = json.getGravity();
		this._physicsRig.wind = json.getWind();
		this._physicsRig.subRigCount = json.getSubRigCount();
		this._physicsRig.fps = json.getFps();
		updateSize(this._physicsRig.settings, this._physicsRig.subRigCount, CubismPhysicsSubRig, true);
		updateSize(this._physicsRig.inputs, json.getTotalInputCount(), CubismPhysicsInput, true);
		updateSize(this._physicsRig.outputs, json.getTotalOutputCount(), CubismPhysicsOutput, true);
		updateSize(this._physicsRig.particles, json.getVertexCount(), CubismPhysicsParticle, true);
		this._currentRigOutputs.length = 0;
		this._previousRigOutputs.length = 0;
		let inputIndex = 0, outputIndex = 0, particleIndex = 0;
		let dstIndexCurrentRigOutputs = this._currentRigOutputs.length;
		let dstIndexPreviousRigOutputs = this._previousRigOutputs.length;
		this._currentRigOutputs.length += this._physicsRig.settings.length;
		this._previousRigOutputs.length += this._physicsRig.settings.length;
		for (let i = 0; i < this._physicsRig.settings.length; ++i) {
			this._physicsRig.settings[i].normalizationPosition.minimum = json.getNormalizationPositionMinimumValue(i);
			this._physicsRig.settings[i].normalizationPosition.maximum = json.getNormalizationPositionMaximumValue(i);
			this._physicsRig.settings[i].normalizationPosition.defalut = json.getNormalizationPositionDefaultValue(i);
			this._physicsRig.settings[i].normalizationAngle.minimum = json.getNormalizationAngleMinimumValue(i);
			this._physicsRig.settings[i].normalizationAngle.maximum = json.getNormalizationAngleMaximumValue(i);
			this._physicsRig.settings[i].normalizationAngle.defalut = json.getNormalizationAngleDefaultValue(i);
			this._physicsRig.settings[i].inputCount = json.getInputCount(i);
			this._physicsRig.settings[i].baseInputIndex = inputIndex;
			for (let j = 0; j < this._physicsRig.settings[i].inputCount; ++j) {
				this._physicsRig.inputs[inputIndex + j].sourceParameterIndex = -1;
				this._physicsRig.inputs[inputIndex + j].weight = json.getInputWeight(i, j);
				this._physicsRig.inputs[inputIndex + j].reflect = json.getInputReflect(i, j);
				if (json.getInputType(i, j) == PhysicsTypeTagX) {
					this._physicsRig.inputs[inputIndex + j].type = CubismPhysicsSource.CubismPhysicsSource_X;
					this._physicsRig.inputs[inputIndex + j].getNormalizedParameterValue = getInputTranslationXFromNormalizedParameterValue;
				} else if (json.getInputType(i, j) == PhysicsTypeTagY) {
					this._physicsRig.inputs[inputIndex + j].type = CubismPhysicsSource.CubismPhysicsSource_Y;
					this._physicsRig.inputs[inputIndex + j].getNormalizedParameterValue = getInputTranslationYFromNormalizedParamterValue;
				} else if (json.getInputType(i, j) == PhysicsTypeTagAngle) {
					this._physicsRig.inputs[inputIndex + j].type = CubismPhysicsSource.CubismPhysicsSource_Angle;
					this._physicsRig.inputs[inputIndex + j].getNormalizedParameterValue = getInputAngleFromNormalizedParameterValue;
				}
				this._physicsRig.inputs[inputIndex + j].source.targetType = CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;
				this._physicsRig.inputs[inputIndex + j].source.id = json.getInputSourceId(i, j);
			}
			inputIndex += this._physicsRig.settings[i].inputCount;
			this._physicsRig.settings[i].outputCount = json.getOutputCount(i);
			this._physicsRig.settings[i].baseOutputIndex = outputIndex;
			const currentRigOutput = new PhysicsOutput();
			updateSize(currentRigOutput.outputs, this._physicsRig.settings[i].outputCount, null, true);
			const previousRigOutput = new PhysicsOutput();
			updateSize(previousRigOutput.outputs, this._physicsRig.settings[i].outputCount, null, true);
			for (let j = 0; j < this._physicsRig.settings[i].outputCount; ++j) {
				currentRigOutput.outputs[j] = 0;
				previousRigOutput.outputs[j] = 0;
				this._physicsRig.outputs[outputIndex + j].destinationParameterIndex = -1;
				this._physicsRig.outputs[outputIndex + j].vertexIndex = json.getOutputVertexIndex(i, j);
				this._physicsRig.outputs[outputIndex + j].angleScale = json.getOutputAngleScale(i, j);
				this._physicsRig.outputs[outputIndex + j].weight = json.getOutputWeight(i, j);
				this._physicsRig.outputs[outputIndex + j].destination.targetType = CubismPhysicsTargetType.CubismPhysicsTargetType_Parameter;
				this._physicsRig.outputs[outputIndex + j].destination.id = json.getOutputDestinationId(i, j);
				if (json.getOutputType(i, j) == PhysicsTypeTagX) {
					this._physicsRig.outputs[outputIndex + j].type = CubismPhysicsSource.CubismPhysicsSource_X;
					this._physicsRig.outputs[outputIndex + j].getValue = getOutputTranslationX;
					this._physicsRig.outputs[outputIndex + j].getScale = getOutputScaleTranslationX;
				} else if (json.getOutputType(i, j) == PhysicsTypeTagY) {
					this._physicsRig.outputs[outputIndex + j].type = CubismPhysicsSource.CubismPhysicsSource_Y;
					this._physicsRig.outputs[outputIndex + j].getValue = getOutputTranslationY;
					this._physicsRig.outputs[outputIndex + j].getScale = getOutputScaleTranslationY;
				} else if (json.getOutputType(i, j) == PhysicsTypeTagAngle) {
					this._physicsRig.outputs[outputIndex + j].type = CubismPhysicsSource.CubismPhysicsSource_Angle;
					this._physicsRig.outputs[outputIndex + j].getValue = getOutputAngle;
					this._physicsRig.outputs[outputIndex + j].getScale = getOutputScaleAngle;
				}
				this._physicsRig.outputs[outputIndex + j].reflect = json.getOutputReflect(i, j);
			}
			this._currentRigOutputs[dstIndexCurrentRigOutputs++] = currentRigOutput;
			this._previousRigOutputs[dstIndexPreviousRigOutputs++] = previousRigOutput;
			outputIndex += this._physicsRig.settings[i].outputCount;
			this._physicsRig.settings[i].particleCount = json.getParticleCount(i);
			this._physicsRig.settings[i].baseParticleIndex = particleIndex;
			for (let j = 0; j < this._physicsRig.settings[i].particleCount; ++j) {
				this._physicsRig.particles[particleIndex + j].mobility = json.getParticleMobility(i, j);
				this._physicsRig.particles[particleIndex + j].delay = json.getParticleDelay(i, j);
				this._physicsRig.particles[particleIndex + j].acceleration = json.getParticleAcceleration(i, j);
				this._physicsRig.particles[particleIndex + j].radius = json.getParticleRadius(i, j);
				this._physicsRig.particles[particleIndex + j].position = json.getParticlePosition(i, j);
			}
			particleIndex += this._physicsRig.settings[i].particleCount;
		}
		this.initialize();
		json.release();
		json = void 0;
		json = null;
	}
	/**
	* 現在のパラメータ値で物理演算が安定化する状態を演算する。
	* @param model 物理演算の結果を適用するモデル
	*/
	stabilization(model) {
		var _this$_parameterCache, _this$_parameterCache2, _this$_parameterInput, _this$_parameterInput2;
		let totalAngle;
		let weight;
		let radAngle;
		let outputValue;
		const totalTranslation = new CubismVector2();
		let currentSetting;
		let currentInputs;
		let currentOutputs;
		let currentParticles;
		const parameterValues = model.getModel().parameters.values;
		const parameterMaximumValues = model.getModel().parameters.maximumValues;
		const parameterMinimumValues = model.getModel().parameters.minimumValues;
		const parameterDefaultValues = model.getModel().parameters.defaultValues;
		if (((_this$_parameterCache = (_this$_parameterCache2 = this._parameterCaches) === null || _this$_parameterCache2 === void 0 ? void 0 : _this$_parameterCache2.length) !== null && _this$_parameterCache !== void 0 ? _this$_parameterCache : 0) < model.getParameterCount()) this._parameterCaches = new Float32Array(model.getParameterCount());
		if (((_this$_parameterInput = (_this$_parameterInput2 = this._parameterInputCaches) === null || _this$_parameterInput2 === void 0 ? void 0 : _this$_parameterInput2.length) !== null && _this$_parameterInput !== void 0 ? _this$_parameterInput : 0) < model.getParameterCount()) this._parameterInputCaches = new Float32Array(model.getParameterCount());
		for (let j = 0; j < model.getParameterCount(); ++j) {
			this._parameterCaches[j] = parameterValues[j];
			this._parameterInputCaches[j] = parameterValues[j];
		}
		for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
			totalAngle = { angle: 0 };
			totalTranslation.x = 0;
			totalTranslation.y = 0;
			currentSetting = this._physicsRig.settings[settingIndex];
			currentInputs = this._physicsRig.inputs.slice(currentSetting.baseInputIndex);
			currentOutputs = this._physicsRig.outputs.slice(currentSetting.baseOutputIndex);
			currentParticles = this._physicsRig.particles.slice(currentSetting.baseParticleIndex);
			for (let i = 0; i < currentSetting.inputCount; ++i) {
				weight = currentInputs[i].weight / MaximumWeight;
				if (currentInputs[i].sourceParameterIndex == -1) currentInputs[i].sourceParameterIndex = model.getParameterIndex(currentInputs[i].source.id);
				currentInputs[i].getNormalizedParameterValue(totalTranslation, totalAngle, parameterValues[currentInputs[i].sourceParameterIndex], parameterMinimumValues[currentInputs[i].sourceParameterIndex], parameterMaximumValues[currentInputs[i].sourceParameterIndex], parameterDefaultValues[currentInputs[i].sourceParameterIndex], currentSetting.normalizationPosition, currentSetting.normalizationAngle, currentInputs[i].reflect, weight);
				this._parameterCaches[currentInputs[i].sourceParameterIndex] = parameterValues[currentInputs[i].sourceParameterIndex];
			}
			radAngle = CubismMath.degreesToRadian(-totalAngle.angle);
			totalTranslation.x = totalTranslation.x * CubismMath.cos(radAngle) - totalTranslation.y * CubismMath.sin(radAngle);
			totalTranslation.y = totalTranslation.x * CubismMath.sin(radAngle) + totalTranslation.y * CubismMath.cos(radAngle);
			updateParticlesForStabilization(currentParticles, currentSetting.particleCount, totalTranslation, totalAngle.angle, this._options.wind, MovementThreshold * currentSetting.normalizationPosition.maximum);
			for (let i = 0; i < currentSetting.outputCount; ++i) {
				const particleIndex = currentOutputs[i].vertexIndex;
				if (currentOutputs[i].destinationParameterIndex == -1) currentOutputs[i].destinationParameterIndex = model.getParameterIndex(currentOutputs[i].destination.id);
				if (particleIndex < 1 || particleIndex >= currentSetting.particleCount) continue;
				let translation = new CubismVector2();
				translation = currentParticles[particleIndex].position.substract(currentParticles[particleIndex - 1].position);
				outputValue = currentOutputs[i].getValue(translation, currentParticles, particleIndex, currentOutputs[i].reflect, this._options.gravity);
				this._currentRigOutputs[settingIndex].outputs[i] = outputValue;
				this._previousRigOutputs[settingIndex].outputs[i] = outputValue;
				const destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
				const outParameterCaches = !Float32Array.prototype.slice && "subarray" in Float32Array.prototype ? JSON.parse(JSON.stringify(parameterValues.subarray(destinationParameterIndex))) : parameterValues.slice(destinationParameterIndex);
				updateOutputParameterValue(outParameterCaches, parameterMinimumValues[destinationParameterIndex], parameterMaximumValues[destinationParameterIndex], outputValue, currentOutputs[i]);
				for (let offset = destinationParameterIndex, outParamIndex = 0; offset < this._parameterCaches.length; offset++, outParamIndex++) parameterValues[offset] = this._parameterCaches[offset] = outParameterCaches[outParamIndex];
			}
		}
	}
	/**
	* 物理演算の評価
	*
	* Pendulum interpolation weights
	*
	* 振り子の計算結果は保存され、パラメータへの出力は保存された前回の結果で補間されます。
	* The result of the pendulum calculation is saved and
	* the output to the parameters is interpolated with the saved previous result of the pendulum calculation.
	*
	* 図で示すと[1]と[2]で補間されます。
	* The figure shows the interpolation between [1] and [2].
	*
	* 補間の重みは最新の振り子計算タイミングと次回のタイミングの間で見た現在時間で決定する。
	* The weight of the interpolation are determined by the current time seen between
	* the latest pendulum calculation timing and the next timing.
	*
	* 図で示すと[2]と[4]の間でみた(3)の位置の重みになる。
	* Figure shows the weight of position (3) as seen between [2] and [4].
	*
	* 解釈として振り子計算のタイミングと重み計算のタイミングがズレる。
	* As an interpretation, the pendulum calculation and weights are misaligned.
	*
	* physics3.jsonにFPS情報が存在しない場合は常に前の振り子状態で設定される。
	* If there is no FPS information in physics3.json, it is always set in the previous pendulum state.
	*
	* この仕様は補間範囲を逸脱したことが原因の震えたような見た目を回避を目的にしている。
	* The purpose of this specification is to avoid the quivering appearance caused by deviations from the interpolation range.
	*
	* ------------ time -------------->
	*
	*                 |+++++|------| <- weight
	* ==[1]====#=====[2]---(3)----(4)
	*          ^ output contents
	*
	* 1:_previousRigOutputs
	* 2:_currentRigOutputs
	* 3:_currentRemainTime (now rendering)
	* 4:next particles timing
	* @param model 物理演算の結果を適用するモデル
	* @param deltaTimeSeconds デルタ時間[秒]
	*/
	evaluate(model, deltaTimeSeconds) {
		var _this$_parameterCache3, _this$_parameterCache4, _this$_parameterInput3, _this$_parameterInput4;
		let totalAngle;
		let weight;
		let radAngle;
		let outputValue;
		const totalTranslation = new CubismVector2();
		let currentSetting;
		let currentInputs;
		let currentOutputs;
		let currentParticles;
		if (0 >= deltaTimeSeconds) return;
		const parameterValues = model.getModel().parameters.values;
		const parameterMaximumValues = model.getModel().parameters.maximumValues;
		const parameterMinimumValues = model.getModel().parameters.minimumValues;
		const parameterDefaultValues = model.getModel().parameters.defaultValues;
		let physicsDeltaTime;
		this._currentRemainTime += deltaTimeSeconds;
		if (this._currentRemainTime > MaxDeltaTime) this._currentRemainTime = 0;
		if (((_this$_parameterCache3 = (_this$_parameterCache4 = this._parameterCaches) === null || _this$_parameterCache4 === void 0 ? void 0 : _this$_parameterCache4.length) !== null && _this$_parameterCache3 !== void 0 ? _this$_parameterCache3 : 0) < model.getParameterCount()) this._parameterCaches = new Float32Array(model.getParameterCount());
		if (((_this$_parameterInput3 = (_this$_parameterInput4 = this._parameterInputCaches) === null || _this$_parameterInput4 === void 0 ? void 0 : _this$_parameterInput4.length) !== null && _this$_parameterInput3 !== void 0 ? _this$_parameterInput3 : 0) < model.getParameterCount()) {
			this._parameterInputCaches = new Float32Array(model.getParameterCount());
			for (let j = 0; j < model.getParameterCount(); ++j) this._parameterInputCaches[j] = parameterValues[j];
		}
		if (this._physicsRig.fps > 0) physicsDeltaTime = 1 / this._physicsRig.fps;
		else physicsDeltaTime = deltaTimeSeconds;
		while (this._currentRemainTime >= physicsDeltaTime) {
			for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
				currentSetting = this._physicsRig.settings[settingIndex];
				currentOutputs = this._physicsRig.outputs.slice(currentSetting.baseOutputIndex);
				for (let i = 0; i < currentSetting.outputCount; ++i) this._previousRigOutputs[settingIndex].outputs[i] = this._currentRigOutputs[settingIndex].outputs[i];
			}
			const inputWeight = physicsDeltaTime / this._currentRemainTime;
			for (let j = 0; j < model.getParameterCount(); ++j) {
				this._parameterCaches[j] = this._parameterInputCaches[j] * (1 - inputWeight) + parameterValues[j] * inputWeight;
				this._parameterInputCaches[j] = this._parameterCaches[j];
			}
			for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
				totalAngle = { angle: 0 };
				totalTranslation.x = 0;
				totalTranslation.y = 0;
				currentSetting = this._physicsRig.settings[settingIndex];
				currentInputs = this._physicsRig.inputs.slice(currentSetting.baseInputIndex);
				currentOutputs = this._physicsRig.outputs.slice(currentSetting.baseOutputIndex);
				currentParticles = this._physicsRig.particles.slice(currentSetting.baseParticleIndex);
				for (let i = 0; i < currentSetting.inputCount; ++i) {
					weight = currentInputs[i].weight / MaximumWeight;
					if (currentInputs[i].sourceParameterIndex == -1) currentInputs[i].sourceParameterIndex = model.getParameterIndex(currentInputs[i].source.id);
					currentInputs[i].getNormalizedParameterValue(totalTranslation, totalAngle, this._parameterCaches[currentInputs[i].sourceParameterIndex], parameterMinimumValues[currentInputs[i].sourceParameterIndex], parameterMaximumValues[currentInputs[i].sourceParameterIndex], parameterDefaultValues[currentInputs[i].sourceParameterIndex], currentSetting.normalizationPosition, currentSetting.normalizationAngle, currentInputs[i].reflect, weight);
				}
				radAngle = CubismMath.degreesToRadian(-totalAngle.angle);
				totalTranslation.x = totalTranslation.x * CubismMath.cos(radAngle) - totalTranslation.y * CubismMath.sin(radAngle);
				totalTranslation.y = totalTranslation.x * CubismMath.sin(radAngle) + totalTranslation.y * CubismMath.cos(radAngle);
				updateParticles(currentParticles, currentSetting.particleCount, totalTranslation, totalAngle.angle, this._options.wind, MovementThreshold * currentSetting.normalizationPosition.maximum, physicsDeltaTime, AirResistance);
				for (let i = 0; i < currentSetting.outputCount; ++i) {
					const particleIndex = currentOutputs[i].vertexIndex;
					if (currentOutputs[i].destinationParameterIndex == -1) currentOutputs[i].destinationParameterIndex = model.getParameterIndex(currentOutputs[i].destination.id);
					if (particleIndex < 1 || particleIndex >= currentSetting.particleCount) continue;
					const translation = new CubismVector2();
					translation.x = currentParticles[particleIndex].position.x - currentParticles[particleIndex - 1].position.x;
					translation.y = currentParticles[particleIndex].position.y - currentParticles[particleIndex - 1].position.y;
					outputValue = currentOutputs[i].getValue(translation, currentParticles, particleIndex, currentOutputs[i].reflect, this._options.gravity);
					this._currentRigOutputs[settingIndex].outputs[i] = outputValue;
					const destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
					const outParameterCaches = !Float32Array.prototype.slice && "subarray" in Float32Array.prototype ? JSON.parse(JSON.stringify(this._parameterCaches.subarray(destinationParameterIndex))) : this._parameterCaches.slice(destinationParameterIndex);
					updateOutputParameterValue(outParameterCaches, parameterMinimumValues[destinationParameterIndex], parameterMaximumValues[destinationParameterIndex], outputValue, currentOutputs[i]);
					for (let offset = destinationParameterIndex, outParamIndex = 0; offset < this._parameterCaches.length; offset++, outParamIndex++) this._parameterCaches[offset] = outParameterCaches[outParamIndex];
				}
			}
			this._currentRemainTime -= physicsDeltaTime;
		}
		const alpha = this._currentRemainTime / physicsDeltaTime;
		this.interpolate(model, alpha);
	}
	/**
	* 物理演算結果の適用
	* 振り子演算の最新の結果と一つ前の結果から指定した重みで適用する。
	* @param model 物理演算の結果を適用するモデル
	* @param weight 最新結果の重み
	*/
	interpolate(model, weight) {
		let currentOutputs;
		let currentSetting;
		const parameterValues = model.getModel().parameters.values;
		const parameterMaximumValues = model.getModel().parameters.maximumValues;
		const parameterMinimumValues = model.getModel().parameters.minimumValues;
		for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
			currentSetting = this._physicsRig.settings[settingIndex];
			currentOutputs = this._physicsRig.outputs.slice(currentSetting.baseOutputIndex);
			for (let i = 0; i < currentSetting.outputCount; ++i) {
				if (currentOutputs[i].destinationParameterIndex == -1) continue;
				const destinationParameterIndex = currentOutputs[i].destinationParameterIndex;
				const outParameterValues = !Float32Array.prototype.slice && "subarray" in Float32Array.prototype ? JSON.parse(JSON.stringify(parameterValues.subarray(destinationParameterIndex))) : parameterValues.slice(destinationParameterIndex);
				updateOutputParameterValue(outParameterValues, parameterMinimumValues[destinationParameterIndex], parameterMaximumValues[destinationParameterIndex], this._previousRigOutputs[settingIndex].outputs[i] * (1 - weight) + this._currentRigOutputs[settingIndex].outputs[i] * weight, currentOutputs[i]);
				for (let offset = destinationParameterIndex, outParamIndex = 0; offset < parameterValues.length; offset++, outParamIndex++) parameterValues[offset] = outParameterValues[outParamIndex];
			}
		}
	}
	/**
	* オプションの設定
	* @param options オプション
	*/
	setOptions(options) {
		this._options = options;
	}
	/**
	* オプションの取得
	* @return オプション
	*/
	getOption() {
		return this._options;
	}
	/**
	* コンストラクタ
	*/
	constructor() {
		this._physicsRig = null;
		this._options = new Options();
		this._options.gravity.y = -1;
		this._options.gravity.x = 0;
		this._options.wind.x = 0;
		this._options.wind.y = 0;
		this._currentRigOutputs = new Array();
		this._previousRigOutputs = new Array();
		this._currentRemainTime = 0;
		this._parameterCaches = null;
		this._parameterInputCaches = null;
	}
	/**
	* デストラクタ相当の処理
	*/
	release() {
		this._physicsRig = void 0;
		this._physicsRig = null;
	}
	/**
	* 初期化する
	*/
	initialize() {
		let strand;
		let currentSetting;
		let radius;
		for (let settingIndex = 0; settingIndex < this._physicsRig.subRigCount; ++settingIndex) {
			currentSetting = this._physicsRig.settings[settingIndex];
			strand = this._physicsRig.particles.slice(currentSetting.baseParticleIndex);
			strand[0].initialPosition = new CubismVector2(0, 0);
			strand[0].lastPosition = new CubismVector2(strand[0].initialPosition.x, strand[0].initialPosition.y);
			strand[0].lastGravity = new CubismVector2(0, -1);
			strand[0].lastGravity.y *= -1;
			strand[0].velocity = new CubismVector2(0, 0);
			strand[0].force = new CubismVector2(0, 0);
			for (let i = 1; i < currentSetting.particleCount; ++i) {
				radius = new CubismVector2(0, 0);
				radius.y = strand[i].radius;
				strand[i].initialPosition = new CubismVector2(strand[i - 1].initialPosition.x + radius.x, strand[i - 1].initialPosition.y + radius.y);
				strand[i].position = new CubismVector2(strand[i].initialPosition.x, strand[i].initialPosition.y);
				strand[i].lastPosition = new CubismVector2(strand[i].initialPosition.x, strand[i].initialPosition.y);
				strand[i].lastGravity = new CubismVector2(0, -1);
				strand[i].lastGravity.y *= -1;
				strand[i].velocity = new CubismVector2(0, 0);
				strand[i].force = new CubismVector2(0, 0);
			}
		}
	}
};
/**
* 物理演算のオプション
*/
var Options = class {
	constructor() {
		this.gravity = new CubismVector2(0, 0);
		this.wind = new CubismVector2(0, 0);
	}
};
/**
* パラメータに適用する前の物理演算の出力結果
*/
var PhysicsOutput = class {
	constructor() {
		this.outputs = new Array(0);
	}
};
/**
* Gets sign.
*
* @param value Evaluation target value.
*
* @return Sign of value.
*/
function sign(value) {
	let ret = 0;
	if (value > 0) ret = 1;
	else if (value < 0) ret = -1;
	return ret;
}
function getInputTranslationXFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
	targetTranslation.x += normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition.minimum, normalizationPosition.maximum, normalizationPosition.defalut, isInverted) * weight;
}
function getInputTranslationYFromNormalizedParamterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition, normalizationAngle, isInverted, weight) {
	targetTranslation.y += normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationPosition.minimum, normalizationPosition.maximum, normalizationPosition.defalut, isInverted) * weight;
}
function getInputAngleFromNormalizedParameterValue(targetTranslation, targetAngle, value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizaitionPosition, normalizationAngle, isInverted, weight) {
	targetAngle.angle += normalizeParameterValue(value, parameterMinimumValue, parameterMaximumValue, parameterDefaultValue, normalizationAngle.minimum, normalizationAngle.maximum, normalizationAngle.defalut, isInverted) * weight;
}
function getOutputTranslationX(translation, particles, particleIndex, isInverted, parentGravity) {
	let outputValue = translation.x;
	if (isInverted) outputValue *= -1;
	return outputValue;
}
function getOutputTranslationY(translation, particles, particleIndex, isInverted, parentGravity) {
	let outputValue = translation.y;
	if (isInverted) outputValue *= -1;
	return outputValue;
}
function getOutputAngle(translation, particles, particleIndex, isInverted, parentGravity) {
	let outputValue;
	if (particleIndex >= 2) parentGravity = particles[particleIndex - 1].position.substract(particles[particleIndex - 2].position);
	else parentGravity = parentGravity.multiplyByScaler(-1);
	outputValue = CubismMath.directionToRadian(parentGravity, translation);
	if (isInverted) outputValue *= -1;
	return outputValue;
}
function getRangeValue(min, max) {
	const maxValue = CubismMath.max(min, max);
	const minValue = CubismMath.min(min, max);
	return CubismMath.abs(maxValue - minValue);
}
function getDefaultValue(min, max) {
	return CubismMath.min(min, max) + getRangeValue(min, max) / 2;
}
function getOutputScaleTranslationX(translationScale, angleScale) {
	return JSON.parse(JSON.stringify(translationScale.x));
}
function getOutputScaleTranslationY(translationScale, angleScale) {
	return JSON.parse(JSON.stringify(translationScale.y));
}
function getOutputScaleAngle(translationScale, angleScale) {
	return JSON.parse(JSON.stringify(angleScale));
}
/**
* Updates particles.
*
* @param strand                Target array of particle.
* @param strandCount           Count of particle.
* @param totalTranslation      Total translation value.
* @param totalAngle            Total angle.
* @param windDirection         Direction of Wind.
* @param thresholdValue        Threshold of movement.
* @param deltaTimeSeconds      Delta time.
* @param airResistance         Air resistance.
*/
function updateParticles(strand, strandCount, totalTranslation, totalAngle, windDirection, thresholdValue, deltaTimeSeconds, airResistance) {
	let delay;
	let radian;
	let direction = new CubismVector2(0, 0);
	let velocity = new CubismVector2(0, 0);
	let force = new CubismVector2(0, 0);
	let newDirection = new CubismVector2(0, 0);
	strand[0].position = new CubismVector2(totalTranslation.x, totalTranslation.y);
	const totalRadian = CubismMath.degreesToRadian(totalAngle);
	const currentGravity = CubismMath.radianToDirection(totalRadian);
	currentGravity.normalize();
	for (let i = 1; i < strandCount; ++i) {
		strand[i].force = currentGravity.multiplyByScaler(strand[i].acceleration).add(windDirection);
		strand[i].lastPosition = new CubismVector2(strand[i].position.x, strand[i].position.y);
		delay = strand[i].delay * deltaTimeSeconds * 30;
		direction = strand[i].position.substract(strand[i - 1].position);
		radian = CubismMath.directionToRadian(strand[i].lastGravity, currentGravity) / airResistance;
		direction.x = CubismMath.cos(radian) * direction.x - direction.y * CubismMath.sin(radian);
		direction.y = CubismMath.sin(radian) * direction.x + direction.y * CubismMath.cos(radian);
		strand[i].position = strand[i - 1].position.add(direction);
		velocity = strand[i].velocity.multiplyByScaler(delay);
		force = strand[i].force.multiplyByScaler(delay).multiplyByScaler(delay);
		strand[i].position = strand[i].position.add(velocity).add(force);
		newDirection = strand[i].position.substract(strand[i - 1].position);
		newDirection.normalize();
		strand[i].position = strand[i - 1].position.add(newDirection.multiplyByScaler(strand[i].radius));
		if (CubismMath.abs(strand[i].position.x) < thresholdValue) strand[i].position.x = 0;
		if (delay != 0) {
			strand[i].velocity = strand[i].position.substract(strand[i].lastPosition);
			strand[i].velocity = strand[i].velocity.divisionByScalar(delay);
			strand[i].velocity = strand[i].velocity.multiplyByScaler(strand[i].mobility);
		}
		strand[i].force = new CubismVector2(0, 0);
		strand[i].lastGravity = new CubismVector2(currentGravity.x, currentGravity.y);
	}
}
/**
* Updates particles for stabilization.
*
* @param strand                Target array of particle.
* @param strandCount           Count of particle.
* @param totalTranslation      Total translation value.
* @param totalAngle            Total angle.
* @param windDirection         Direction of Wind.
* @param thresholdValue        Threshold of movement.
*/
function updateParticlesForStabilization(strand, strandCount, totalTranslation, totalAngle, windDirection, thresholdValue) {
	let force = new CubismVector2(0, 0);
	strand[0].position = new CubismVector2(totalTranslation.x, totalTranslation.y);
	const totalRadian = CubismMath.degreesToRadian(totalAngle);
	const currentGravity = CubismMath.radianToDirection(totalRadian);
	currentGravity.normalize();
	for (let i = 1; i < strandCount; ++i) {
		strand[i].force = currentGravity.multiplyByScaler(strand[i].acceleration).add(windDirection);
		strand[i].lastPosition = new CubismVector2(strand[i].position.x, strand[i].position.y);
		strand[i].velocity = new CubismVector2(0, 0);
		force = strand[i].force;
		force.normalize();
		force = force.multiplyByScaler(strand[i].radius);
		strand[i].position = strand[i - 1].position.add(force);
		if (CubismMath.abs(strand[i].position.x) < thresholdValue) strand[i].position.x = 0;
		strand[i].force = new CubismVector2(0, 0);
		strand[i].lastGravity = new CubismVector2(currentGravity.x, currentGravity.y);
	}
}
/**
* Updates output parameter value.
* @param parameterValue            Target parameter value.
* @param parameterValueMinimum     Minimum of parameter value.
* @param parameterValueMaximum     Maximum of parameter value.
* @param translation               Translation value.
*/
function updateOutputParameterValue(parameterValue, parameterValueMinimum, parameterValueMaximum, translation, output) {
	let value;
	value = translation * output.getScale(output.translationScale, output.angleScale);
	if (value < parameterValueMinimum) {
		if (value < output.valueBelowMinimum) output.valueBelowMinimum = value;
		value = parameterValueMinimum;
	} else if (value > parameterValueMaximum) {
		if (value > output.valueExceededMaximum) output.valueExceededMaximum = value;
		value = parameterValueMaximum;
	}
	const weight = output.weight / MaximumWeight;
	if (weight >= 1) parameterValue[0] = value;
	else {
		value = parameterValue[0] * (1 - weight) + value * weight;
		parameterValue[0] = value;
	}
}
function normalizeParameterValue(value, parameterMinimum, parameterMaximum, parameterDefault, normalizedMinimum, normalizedMaximum, normalizedDefault, isInverted) {
	let result = 0;
	const maxValue = CubismMath.max(parameterMaximum, parameterMinimum);
	if (maxValue < value) value = maxValue;
	const minValue = CubismMath.min(parameterMaximum, parameterMinimum);
	if (minValue > value) value = minValue;
	const minNormValue = CubismMath.min(normalizedMinimum, normalizedMaximum);
	const maxNormValue = CubismMath.max(normalizedMinimum, normalizedMaximum);
	const middleNormValue = normalizedDefault;
	const middleValue = getDefaultValue(minValue, maxValue);
	const paramValue = value - middleValue;
	switch (sign(paramValue)) {
		case 1: {
			const nLength = maxNormValue - middleNormValue;
			const pLength = maxValue - middleValue;
			if (pLength != 0) {
				result = paramValue * (nLength / pLength);
				result += middleNormValue;
			}
			break;
		}
		case -1: {
			const nLength = minNormValue - middleNormValue;
			const pLength = minValue - middleValue;
			if (pLength != 0) {
				result = paramValue * (nLength / pLength);
				result += middleNormValue;
			}
			break;
		}
		case 0:
			result = middleNormValue;
			break;
		default: break;
	}
	return isInverted ? result : result * -1;
}
var Live2DCubismFramework;
(function(_Live2DCubismFramework) {
	_Live2DCubismFramework.CubismPhysics = CubismPhysics;
	_Live2DCubismFramework.Options = Options;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));
//#endregion
//#region src/cubism5/factory.ts
Live2DFactory.registerRuntime({
	version: 5,
	expressionDataType: "text",
	ready: cubism5Ready,
	test(source) {
		return source instanceof Cubism5ModelSettings || Cubism5ModelSettings.isValidJSON(source);
	},
	isValidMoc(modelData) {
		if (modelData.byteLength < 4) return false;
		const view = new Int8Array(modelData, 0, 4);
		return String.fromCharCode(...view) === "MOC3";
	},
	createModelSettings(json) {
		return new Cubism5ModelSettings(json);
	},
	createCoreModel(data, options) {
		const moc = CubismMoc.create(data, !!(options === null || options === void 0 ? void 0 : options.checkMocConsistency));
		try {
			const model = moc.createModel();
			model.__moc = moc;
			return model;
		} catch (e) {
			try {
				moc.release();
			} catch (_unused) {}
			throw e;
		}
	},
	createInternalModel(coreModel, settings, options) {
		const model = new Cubism5InternalModel(coreModel, settings, options);
		const coreModelWithMoc = coreModel;
		if (coreModelWithMoc.__moc) {
			model.__moc = coreModelWithMoc.__moc;
			delete coreModelWithMoc.__moc;
			model.once("destroy", releaseMoc);
		}
		return model;
	},
	createPhysics(coreModel, data) {
		const { buffer, byteLength } = toCubismJsonBuffer(data);
		return CubismPhysics.create(buffer, byteLength);
	},
	createPose(coreModel, data) {
		const { buffer, byteLength } = toCubismJsonBuffer(data);
		return CubismPose.create(buffer, byteLength);
	}
});
function releaseMoc() {
	var _this$__moc;
	(_this$__moc = this.__moc) === null || _this$__moc === void 0 || _this$__moc.release();
}
//#endregion
export { Cubism5ExpressionManager, Cubism5InternalModel, Cubism5ModelSettings, Cubism5MotionManager, ExpressionManager, FileLoader, FocusController, InternalModel, LOGICAL_HEIGHT, LOGICAL_WIDTH, Live2DFactory, Live2DLoader, Live2DModel, Live2DTransform, ModelSettings, MotionManager, MotionPreloadStrategy, MotionPriority, MotionState, SoundManager, VERSION, XHRLoader, ZipLoader, applyMixins, clamp, config, copyArray, copyProperty, cubism5Ready, folderName, logger, rand, remove, resolveUrl, startUpCubism5 };
