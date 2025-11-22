(async () => {
    try {
        console.log('Hedy Loader: Started');

        // Inject bridge script into MAIN world
        const bridgeSrc = chrome.runtime.getURL('src/bridge.js');

        const script = document.createElement('script');
        script.src = bridgeSrc;
        script.onload = function () {
            this.remove();
        };
        script.onerror = function (e) {
            console.error('Hedy Loader: Failed to load bridge script', e);
        };
        (document.head || document.documentElement).appendChild(script);

        // Load Main Content Script (Isolated World)
        const src = chrome.runtime.getURL('src/main.js');
        const contentMain = await import(src);
        contentMain.main();
    } catch (e) {
        console.error('Hedy Loader: Error loading extension', e);
    }
})();
