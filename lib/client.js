window.__ModuleLoader__.load({
	id: "dsh-agent-mode-switcher",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region \0dsh-css:/Users/cuizhy/WebstormProjects/my-dsh-plugin/agent-mode-switcher/src/client/AgentModeSwitch.module.css.mjs
		const css = ".RBaZMq_switcher{align-items:center;display:inline-flex;position:relative}.RBaZMq_seat{background:var(--dsw-alias-fill-tsp-secondary);max-width:180px;height:22px;color:var(--dsw-alias-label-primary);white-space:nowrap;cursor:pointer;border:none;border-radius:6px;align-items:center;gap:4px;padding:0 6px 0 4px;font-size:12px;line-height:22px;display:inline-flex;overflow:hidden}.RBaZMq_seat:not(:disabled):hover,.RBaZMq_seat[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}.RBaZMq_seat:disabled{cursor:default;color:var(--dsw-alias-label-quaternary)}.RBaZMq_icon,.RBaZMq_chevron{opacity:.7;flex:none}.RBaZMq_name{text-overflow:ellipsis;overflow:hidden}.RBaZMq_error{z-index:30;background:var(--dsw-alias-bg-overlay);max-width:280px;color:var(--dsw-alias-state-error-primary);box-shadow:var(--dsw-shadow-lv2);border-radius:6px;padding:4px 8px;font-size:12px;line-height:16px;position:absolute;top:calc(100% + 4px);right:0}";
		const tagId = "dsh-agent-mode-switcher/AgentModeSwitch.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-agent-mode-switcher";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var AgentModeSwitch_module_css_default = {
			"error": "RBaZMq_error",
			"chevron": "RBaZMq_chevron",
			"switcher": "RBaZMq_switcher",
			"seat": "RBaZMq_seat",
			"icon": "RBaZMq_icon",
			"name": "RBaZMq_name"
		};
		//#endregion
		//#region src/client/AgentModeSwitch.tsx
		/**
		* The session header's agent-preset switcher.
		*
		* Replaces the shipped read-only label (the same `conversation.session.header
		* .actions` cell, id `agent-preset`) with a live chip: it names the preset the
		* current session runs and, once the model finished answering, offers every
		* mounted-able preset the deployment composes. Picking one recomposes the
		* session's agent from that preset; the conversation and its history stay in
		* the same session. The chip refuses interaction while the agent runs a turn
		* (the host refuses the swap regardless). The same component can register in
		* the composer tool row with `blankOnly: true`, so a new blank conversation
		* (whose header is hidden) still has a switch entry and shows the deployment
		* default until a preset is committed.
		*/
		/**
		* Render this session's agent preset as a switchable chip.
		* @param props - composed slot props.
		* @returns the chip, or null for a non-blank-only registration on an active session.
		*/
		function AgentModeSwitch({ sessionId, useSessions, useSession, useModeSwitch, load, switchMode, t, blankOnly }) {
			const preset = useSessions((state) => state.byId[sessionId]?.agentPreset);
			const running = useSession((state) => state.running);
			const blank = useSession((state) => state.blank);
			const options = useModeSwitch((state) => state.options);
			const switching = useModeSwitch((state) => state.switching);
			const [open, setOpen] = (0, react.useState)(false);
			const [pending, setPending] = (0, react.useState)(null);
			const [failed, setFailed] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			if (blankOnly === true && !blank) return null;
			const busy = running || switching;
			const currentId = preset ?? options.find((option) => option.isDefault)?.id;
			const current = options.find((option) => option.id === currentId);
			const label = current?.name ?? currentId ?? t("noMode");
			const empty = options.length === 0;
			const handleSelect = (id) => {
				if (id === currentId || busy) return;
				setPending(id);
				setFailed(null);
				switchMode(sessionId, id).then((error) => {
					setPending(null);
					if (error !== void 0) setFailed(error);
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: AgentModeSwitch_module_css_default.switcher,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open,
					onClose: () => {
						setOpen(false);
					},
					items: options.map((option) => {
						const name = option.name ?? option.id;
						return {
							id: option.id,
							label: option.trust === "user" ? `${name} · ${t("userTrust")}` : name,
							disabled: option.id === currentId
						};
					}),
					selectedId: currentId ?? "",
					onSelect: handleSelect,
					align: "end",
					portal: true,
					anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: AgentModeSwitch_module_css_default.seat,
						"aria-haspopup": "menu",
						"aria-expanded": open,
						disabled: busy || empty,
						title: failed ?? (running ? t("runningHint") : current?.description ?? t("headerHint")),
						onClick: () => {
							setOpen(!open);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconAgentPresetOutline16, {
								size: 14,
								className: AgentModeSwitch_module_css_default.icon
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: AgentModeSwitch_module_css_default.name,
								children: pending !== null ? t("switching") : label
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: AgentModeSwitch_module_css_default.chevron })
						]
					})
				}), failed !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: AgentModeSwitch_module_css_default.error,
					role: "alert",
					children: failed
				})]
			});
		}
		/**
		* Human text for a rejected wire call. A transport failure rejects with an
		* Error; a host or a runtime can reject with anything, and the surface still
		* has to say something.
		* @param error - the rejection value.
		* @returns the message to show.
		*/
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		const INITIAL = {
			options: [],
			switching: false
		};
		/** Reads the roster and issues one switch. */
		var ModeSwitchController = class {
			api;
			onApplied;
			/** Header snapshot the renderer subscribes to. */
			store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)(INITIAL);
			constructor(api, onApplied) {
				this.api = api;
				this.onApplied = onApplied;
			}
			set(patch) {
				this.store.set({
					...this.store.getSnapshot(),
					...patch
				});
			}
			/**
			* Read the roster; a failure leaves the current options in place.
			*
			* Best-effort by design: the button can still show the session's preset id
			* without the roster, and the switch itself is refused by the host when a
			* preset is unknown.
			*/
			async load() {
				let response;
				try {
					response = await this.api.agentPresets.list({});
				} catch {
					return;
				}
				if (!response.result.ok) return;
				this.set({ options: response.result.value.presets.filter((preset) => preset.broken === void 0).map((preset) => ({
					id: preset.id,
					trust: preset.trust,
					...preset.name === void 0 ? {} : { name: preset.name },
					...preset.description === void 0 ? {} : { description: preset.description },
					...preset.isDefault === void 0 ? {} : { isDefault: preset.isDefault }
				})) });
			}
			/**
			* Switch one session to another preset.
			* @param sessionId - the session whose agent gets recomposed.
			* @param presetId - the target preset id.
			* @returns the failure message, or undefined once the switch committed.
			*/
			async switch(sessionId, presetId) {
				this.set({ switching: true });
				let response;
				try {
					response = await this.api.agentPresets.select({
						sessionId,
						agentPreset: presetId
					});
				} catch (error) {
					this.set({ switching: false });
					return messageOf(error);
				}
				this.set({ switching: false });
				if (!response.result.ok) return response.result.error.message;
				this.onApplied?.(sessionId, response.result.value.agentPreset);
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/** English copy. */
		const en = {
			headerHint: "The agent preset this session runs",
			runningHint: "Answering now — switch once the model finishes",
			switching: "Switching…",
			userTrust: "Custom",
			noMode: "No mode selected"
		};
		/** 简体中文文案。 */
		const zh = {
			headerHint: "当前会话运行的 agent 预设（模式）",
			runningHint: "模型回答中，完成后可切换模式",
			switching: "切换中…",
			userTrust: "自定义",
			noMode: "未选择模式"
		};
		//#endregion
		//#region src/client/index.ts
		/** Locale dictionary namespace owned by this header cell. */
		const NS = "agent-mode-switch";
		/** Required services (cordis fiber inject). */
		const inject = [
			"slots",
			"locale",
			"connection",
			"remote",
			"sessions"
		];
		/**
		* Mount the session-header agent-preset switcher.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "agent-mode-switch: dictionaries");
			const controller = new ModeSwitchController(ctx.get("connection").api, (sessionId, agentPreset) => {
				ctx.sessions.noteAgentPreset(sessionId, agentPreset);
			});
			ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "agent-preset",
				order: -10,
				locale: NS,
				inject: () => ({
					hooks: { modeSwitch: controller.store },
					load: () => controller.load(),
					switchMode: (sessionId, presetId) => controller.switch(sessionId, presetId)
				})
			}, AgentModeSwitch));
			ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
				name: "conversation.input.left",
				id: "agent-mode-switch",
				order: 0,
				locale: NS,
				inject: () => ({
					blankOnly: true,
					hooks: { modeSwitch: controller.store },
					load: () => controller.load(),
					switchMode: (sessionId, presetId) => controller.switch(sessionId, presetId)
				})
			}, AgentModeSwitch));
			ctx.effect(() => ctx.remote.$on("settings/document-updated", (ns) => {
				if (ns === "agent-presets") controller.load();
			}), "agent-mode-switch: roster refresh");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map