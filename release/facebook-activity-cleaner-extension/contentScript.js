(function() {
	//#region src/shared/redaction.ts
	var redactText = (value, max = 120) => value.replace(/https:\/\/www\.facebook\.com\/[^\s/]+/g, "https://www.facebook.com/[REDACTED]").slice(0, max);
	//#endregion
	//#region src/shared/filters.ts
	var matchItem = (item, filters) => {
		if (filters.excludeUnknown && item.activityType === "unknown") return false;
		if (filters.includeTypes.length && !filters.includeTypes.includes(item.activityType)) return false;
		const s = item.snippet.toLowerCase();
		if (filters.contains.some((k) => !s.includes(k.toLowerCase()))) return false;
		if (filters.excludes.some((k) => s.includes(k.toLowerCase()))) return false;
		if (filters.onlyActionable && item.actionLabels.length === 0) return false;
		return true;
	};
	var activityTypes = [
		"posts",
		"comments",
		"reactions",
		"shares",
		"media",
		"tags",
		"group",
		"page",
		"searches",
		"unknown"
	];
	var itemStates = [
		"discovered",
		"matched",
		"protected",
		"queued",
		"active",
		"action_menu_opened",
		"action_selected",
		"confirmation_detected",
		"confirmed",
		"completed",
		"skipped",
		"failed"
	];
	var runStates = [
		"idle",
		"validating_page",
		"scanning",
		"scan_complete",
		"awaiting_user_review",
		"awaiting_confirmation",
		"running",
		"paused",
		"stopping",
		"stopped",
		"completed",
		"failed"
	];
	var isRecord = (x) => x !== null && typeof x === "object" && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
	var hasKeys = (x, required, optional = []) => required.every((key) => Object.hasOwn(x, key)) && Object.keys(x).every((key) => required.includes(key) || optional.includes(key));
	var boundedString = (x, max) => typeof x === "string" && x.length <= max;
	var stringArray = (x, maxItems, maxLength) => Array.isArray(x) && x.length <= maxItems && x.every((value) => boundedString(value, maxLength));
	var isId = (x) => typeof x === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(x);
	var idArray = (x) => Array.isArray(x) && x.length <= 200 && x.every(isId) && new Set(x).size === x.length;
	var isCount = (x) => typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
	var isFilters = (x) => {
		if (!isRecord(x) || !hasKeys(x, [
			"includeTypes",
			"contains",
			"excludes",
			"onlyActionable",
			"excludeUnknown"
		])) return false;
		return stringArray(x.includeTypes, activityTypes.length, 20) && x.includeTypes.every((value) => activityTypes.includes(value)) && new Set(x.includeTypes).size === x.includeTypes.length && stringArray(x.contains, 20, 160) && stringArray(x.excludes, 20, 160) && typeof x.onlyActionable === "boolean" && typeof x.excludeUnknown === "boolean";
	};
	var isActivityItem = (x) => {
		if (!isRecord(x) || !hasKeys(x, [
			"id",
			"snippet",
			"activityType",
			"actionLabels",
			"fingerprint",
			"matched",
			"keep",
			"state"
		], ["dateText"])) return false;
		return isId(x.id) && boundedString(x.snippet, 160) && typeof x.activityType === "string" && activityTypes.includes(x.activityType) && stringArray(x.actionLabels, 10, 100) && boundedString(x.fingerprint, 100) && typeof x.matched === "boolean" && typeof x.keep === "boolean" && typeof x.state === "string" && itemStates.includes(x.state) && (!Object.hasOwn(x, "dateText") || boundedString(x.dateText, 100));
	};
	var isRunState = (x) => {
		if (!isRecord(x) || !hasKeys(x, [
			"runId",
			"state",
			"scanCount",
			"queuedCount",
			"completedCount",
			"failedCount",
			"skippedCount"
		], ["startedAt", "lastActionAt"])) return false;
		return boundedString(x.runId, 100) && typeof x.state === "string" && runStates.includes(x.state) && [
			"scanCount",
			"queuedCount",
			"completedCount",
			"failedCount",
			"skippedCount"
		].every((key) => isCount(x[key])) && ["startedAt", "lastActionAt"].every((key) => !Object.hasOwn(x, key) || boundedString(x[key], 40));
	};
	/** Validate the complete, bounded payload before using data from another context. */
	var isMessage = (x) => {
		if (!isRecord(x)) return false;
		switch (x.type) {
			case "PING": return hasKeys(x, ["type"]);
			case "SCAN": return hasKeys(x, ["type", "filters"]) && isFilters(x.filters);
			case "SCAN_RESULT": return hasKeys(x, [
				"type",
				"items",
				"supported"
			]) && typeof x.supported === "boolean" && Array.isArray(x.items) && x.items.length <= 200 && x.items.every(isActivityItem) && new Set(x.items.map((item) => item.id)).size === x.items.length && (x.supported || x.items.length === 0);
			case "RUN_UPDATE": return hasKeys(x, ["type", "run"]) && isRunState(x.run);
			case "HIGHLIGHT": return hasKeys(x, [
				"type",
				"itemIds",
				"protectedIds"
			]) && idArray(x.itemIds) && idArray(x.protectedIds);
			default: return false;
		}
	};
	//#endregion
	//#region src/shared/security.ts
	var FACEBOOK_ORIGIN = "https://www.facebook.com";
	/** Accept only the Activity Log route on the origin covered by our permission. */
	var isSupportedActivityUrl = (value) => {
		if (typeof value !== "string") return false;
		try {
			const url = new URL(value);
			return url.origin === FACEBOOK_ORIGIN && url.username === "" && url.password === "" && /^\/[A-Za-z0-9_.-]+\/allactivity\/?$/.test(url.pathname);
		} catch {
			return false;
		}
	};
	/** Runtime requests may originate only from this extension's side panel. */
	var isTrustedPanelSender = (sender, extensionId) => {
		if (sender.id !== extensionId || sender.tab || typeof sender.url !== "string") return false;
		try {
			const url = new URL(sender.url);
			return url.protocol === "chrome-extension:" && url.hostname === extensionId && url.port === "" && url.username === "" && url.password === "" && url.pathname === "/sidepanel.html";
		} catch {
			return false;
		}
	};
	//#endregion
	//#region src/content/activityContentScript.ts
	var inferType = (text) => text.toLowerCase().includes("comment") ? "comments" : "unknown";
	var scan = () => {
		return Array.from(document.querySelectorAll("[role=\"article\"], div[aria-label]")).slice(0, 200).map((el, idx) => {
			const text = (el.textContent || "").trim();
			return {
				id: `item-${idx}`,
				snippet: redactText(text, 160),
				activityType: inferType(text),
				actionLabels: [],
				fingerprint: `${el.tagName}:${idx}`,
				matched: false,
				keep: false,
				state: "discovered"
			};
		});
	};
	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		if (!isTrustedPanelSender(sender, chrome.runtime.id) || !isMessage(msg) || msg.type !== "SCAN") return;
		if (!isSupportedActivityUrl(location.href) || window.top !== window.self) {
			sendResponse({
				type: "SCAN_RESULT",
				items: [],
				supported: false
			});
			return;
		}
		sendResponse({
			type: "SCAN_RESULT",
			items: scan().map((i) => ({
				...i,
				matched: matchItem(i, msg.filters)
			})),
			supported: true
		});
	});
	//#endregion
})();
