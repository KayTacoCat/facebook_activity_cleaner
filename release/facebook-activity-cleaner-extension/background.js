import { n as isTrustedPanelSender, r as isMessage, t as isSupportedActivityUrl } from "./assets/security-DAaATruC.js";
//#region src/storage/localStore.ts
var store = {
	async get(key, fallback) {
		return (await chrome.storage.local.get(key))[key] ?? fallback;
	},
	async set(key, value) {
		await chrome.storage.local.set({ [key]: value });
	}
};
//#endregion
//#region src/background/serviceWorker.ts
chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => {});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
chrome.runtime.onInstalled.addListener(() => {
	store.set("runState", {
		runId: "",
		state: "idle",
		scanCount: 0,
		queuedCount: 0,
		completedCount: 0,
		failedCount: 0,
		skippedCount: 0
	});
});
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (info.status === "complete" || typeof info.url === "string") try {
		await chrome.sidePanel.setOptions({
			tabId,
			enabled: isSupportedActivityUrl(info.url ?? tab.url),
			path: "sidepanel.html"
		});
	} catch {}
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (isTrustedPanelSender(sender, chrome.runtime.id) && isMessage(msg) && msg.type === "PING") sendResponse({ ok: true });
});
//#endregion
