(async function() {
    const scripts = [
        "emulator.js",
        "nipplejs.js",
        "shaders.js",
        "storage.js",
        "gamepad.js",
        "GameManager.js",
        "socket.io.min.js",
        "compression.js"
    ];

    // Use EJS_pathtodata if set, else fallback to folder of loader.js
    let scriptPath = (typeof window.EJS_pathtodata === "string") ? window.EJS_pathtodata : (() => {
        const url = new URL(document.currentScript.src);
        return url.href.substring(0, url.href.lastIndexOf("/") + 1);
    })();
    if (!scriptPath.endsWith("/")) scriptPath += "/";

    // Prepend EJS_pathtodata to all internal paths
    function resolvePath(file) {
        if (typeof EJS_paths !== "undefined" && typeof EJS_paths[file] === "string") {
            return EJS_paths[file];
        }
        if (file.endsWith("emulator.min.js") || file.endsWith("emulator.min.css")) {
            return scriptPath + file;
        }
        // Everything else (scripts, CSS, localization) uses CDN base
        return scriptPath + file;
    }

    function loadScript(file) {
        return new Promise(resolve => {
            const script = document.createElement("script");
            script.src = resolvePath(file);
            script.onload = resolve;
            script.onerror = async () => {
                await filesmissing(file);
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    function loadStyle(file) {
        return new Promise(resolve => {
            const css = document.createElement("link");
            css.rel = "stylesheet";
            css.href = resolvePath(file);
            css.onload = resolve;
            css.onerror = async () => {
                await filesmissing(file);
                resolve();
            };
            document.head.appendChild(css);
        });
    }

    async function filesmissing(file) {
        console.error("Failed to load " + file);
        const minifiedFailed = file.includes(".min.") && !file.includes("socket");
        console[minifiedFailed ? "warn" : "error"](
            `Failed to load ${file}. Likely the minified files are missing. To fix: download from EmulatorJS releases or build locally.`
        );
        if (minifiedFailed) {
            console.log("Attempting to load non-minified files");
            if (file === "emulator.min.js") {
                for (let i = 0; i < scripts.length; i++) await loadScript(scripts[i]);
            } else {
                await loadStyle("emulator.css");
            }
        }
    }

    // Load scripts & styles
    if (typeof EJS_DEBUG_XX === "boolean" && EJS_DEBUG_XX === true) {
        for (let i = 0; i < scripts.length; i++) await loadScript(scripts[i]);
        await loadStyle("emulator.css");
    } else {
        await loadScript("emulator.min.js");
        await loadStyle("emulator.min.css");
    }

    // EmulatorJS config
    const config = {
        gameUrl: window.EJS_gameUrl,
        dataPath: scriptPath,
        system: window.EJS_core,
        biosUrl: window.EJS_biosUrl,
        gameName: window.EJS_gameName,
        color: window.EJS_color,
        adUrl: window.EJS_AdUrl,
        adMode: window.EJS_AdMode,
        adTimer: window.EJS_AdTimer,
        adSize: window.EJS_AdSize,
        alignStartButton: window.EJS_alignStartButton,
        VirtualGamepadSettings: window.EJS_VirtualGamepadSettings,
        buttonOpts: window.EJS_Buttons,
        volume: window.EJS_volume,
        defaultControllers: window.EJS_defaultControls,
        startOnLoad: window.EJS_startOnLoaded,
        fullscreenOnLoad: window.EJS_fullscreenOnLoaded,
        filePaths: window.EJS_paths,
        loadState: window.EJS_loadStateURL,
        cacheLimit: window.EJS_CacheLimit,
        cheats: window.EJS_cheats,
        defaultOptions: window.EJS_defaultOptions,
        gamePatchUrl: window.EJS_gamePatchUrl,
        gameParentUrl: window.EJS_gameParentUrl,
        netplayUrl: window.EJS_netplayServer,
        gameId: window.EJS_gameID,
        backgroundImg: window.EJS_backgroundImage,
        backgroundBlur: window.EJS_backgroundBlur,
        backgroundColor: window.EJS_backgroundColor,
        controlScheme: window.EJS_controlScheme,
        threads: window.EJS_threads,
        disableCue: window.EJS_disableCue,
        startBtnName: window.EJS_startButtonName,
        softLoad: window.EJS_softLoad,
        capture: window.EJS_screenCapture,
        externalFiles: window.EJS_externalFiles,
        dontExtractBIOS: window.EJS_dontExtractBIOS,
        disableDatabases: window.EJS_disableDatabases,
        disableLocalStorage: window.EJS_disableLocalStorage,
        forceLegacyCores: window.EJS_forceLegacyCores,
        noAutoFocus: window.EJS_noAutoFocus,
        videoRotation: window.EJS_videoRotation,
        hideSettings: window.EJS_hideSettings,
        shaders: Object.assign({}, window.EJS_SHADERS, window.EJS_shaders || {})
    };

    // Load language JSON from CDN
    let systemLang;
    try { systemLang = Intl.DateTimeFormat().resolvedOptions().locale; } catch(e){}
    if ((typeof window.EJS_language === "string" && window.EJS_language !== "en-US") || (systemLang && window.EJS_disableAutoLang !== false)) {
        const language = window.EJS_language || systemLang;
        try {
            let path;
            console.log("Loading language", language);
            path = (typeof EJS_paths !== "undefined" && typeof EJS_paths[language] === "string") 
                ? EJS_paths[language] 
                : scriptPath + "localization/" + language + ".json";
            config.language = language;
            config.langJson = JSON.parse(await (await fetch(path)).text());
        } catch(e) {
            console.log("Missing language", language, "!!");
            delete config.language;
            delete config.langJson;
        }
    }

    // Initialize emulator
    window.EJS_emulator = new EmulatorJS(EJS_player, config);
    window.EJS_adBlocked = (url, del) => window.EJS_emulator.adBlocked(url, del);

    // Event hooks
    ["ready", "start", "loadState", "saveState", "loadSave", "saveSave"].forEach(event => {
        const fn = window["EJS_on" + event.charAt(0).toUpperCase() + event.slice(1)];
        if (typeof fn === "function") window.EJS_emulator.on(event, fn);
    });
})();
