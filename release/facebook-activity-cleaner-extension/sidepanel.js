import { r as isMessage, t as isSupportedActivityUrl } from "./assets/security-DAaATruC.js";
//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region src/sidepanel/render.ts
/** Page-derived values are always text, never parsed as extension HTML. */
var renderPreview = (app, items, status, scanning, actions) => {
	const doc = app.ownerDocument;
	const heading = doc.createElement("h2");
	heading.textContent = "Facebook Activity Cleaner";
	const mode = doc.createElement("p");
	mode.append("Default mode: ");
	const emphasis = doc.createElement("b");
	emphasis.textContent = "Preview/Dry Run";
	mode.append(emphasis);
	const scan = doc.createElement("button");
	scan.id = "scan";
	scan.textContent = scanning ? "Scanning..." : "Scan";
	scan.disabled = scanning;
	scan.addEventListener("click", actions.scan);
	const protect = doc.createElement("button");
	protect.id = "protect-all";
	protect.textContent = "Mark all scanned as keep";
	protect.addEventListener("click", actions.protectAll);
	const clear = doc.createElement("button");
	clear.id = "clear-keep";
	clear.textContent = "Clear keeps";
	clear.addEventListener("click", actions.clearKeeps);
	const counts = doc.createElement("div");
	const matched = items.filter((item) => item.matched);
	counts.textContent = `Scanned: ${items.length} | Matched: ${matched.length} | Protected: ${items.filter((item) => item.keep).length}`;
	const notice = doc.createElement("p");
	notice.id = "status";
	notice.setAttribute("role", "status");
	notice.textContent = status;
	const list = doc.createElement("ul");
	for (const item of matched.slice(0, 50)) {
		const row = doc.createElement("li");
		const label = doc.createElement("label");
		const checkbox = doc.createElement("input");
		checkbox.type = "checkbox";
		checkbox.checked = item.keep;
		checkbox.addEventListener("change", () => actions.setKeep(item.id, checkbox.checked));
		label.append(checkbox, " Keep");
		row.append(label, ` [${item.activityType}] ${item.snippet}`);
		list.append(row);
	}
	app.replaceChildren(heading, mode, scan, protect, clear, counts, notice, list);
};
//#endregion
//#region src/sidepanel/main.ts
var app = document.getElementById("app");
if (!app) throw new Error("Missing side panel container.");
var filters = {
	includeTypes: [],
	contains: [],
	excludes: [],
	onlyActionable: false,
	excludeUnknown: true
};
var items = [];
var scanning = false;
var status = "Open your Facebook Activity Log to preview visible activity.";
var render = () => renderPreview(app, items, status, scanning, {
	scan: () => {
		doScan();
	},
	protectAll: () => {
		items = items.map((item) => ({
			...item,
			keep: true
		}));
		render();
	},
	clearKeeps: () => {
		items = items.map((item) => ({
			...item,
			keep: false
		}));
		render();
	},
	setKeep: (id, keep) => {
		items = items.map((item) => item.id === id ? {
			...item,
			keep
		} : item);
		render();
	}
});
var doScan = async () => {
	if (scanning) return;
	scanning = true;
	items = [];
	status = "Checking the active Activity Log page...";
	render();
	try {
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true
		});
		if (typeof tab?.id !== "number" || !isSupportedActivityUrl(tab.url)) {
			status = "Open your Facebook Activity Log at https://www.facebook.com/<profile>/allactivity/ before scanning.";
			return;
		}
		const response = await chrome.tabs.sendMessage(tab.id, {
			type: "SCAN",
			filters
		}, { frameId: 0 });
		if (!isMessage(response) || response.type !== "SCAN_RESULT") {
			status = "The page returned an invalid scan response. Reload the Activity Log and try again.";
			return;
		}
		if (!response.supported) {
			status = "This page is not a supported Facebook Activity Log.";
			return;
		}
		const [currentTab] = await chrome.tabs.query({
			active: true,
			currentWindow: true
		});
		if (currentTab?.id !== tab.id || currentTab.url !== tab.url || !isSupportedActivityUrl(currentTab.url)) {
			status = "The active page changed during scanning. Return to your Activity Log and scan again.";
			return;
		}
		items = response.items;
		status = "Preview complete. This extension does not delete or change Facebook activity.";
	} catch {
		status = "Scanning failed. Reload the Activity Log and try again.";
	} finally {
		scanning = false;
		render();
	}
};
render();
//#endregion
