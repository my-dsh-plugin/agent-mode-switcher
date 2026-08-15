//#region lib/types/index.js
/**
* agent-mode-switcher: a DeepSeek Harness plugin that lets the user switch the
* current conversation's agent preset (mode) after the model finishes
* answering, and keep chatting in the same session.
*
* The browser half replaces the shipped read-only agent-preset label in the
* session header with a live switcher. Picking another preset rides the
* standard `agentPreset.select` RPC, which recomposes the session's agent
* from the target preset and logs the committed selection; the deployment
* must allow idle-session switches (the fork's api-proxy relaxation).
* This host entry exists so the bundle patch has a cordis plugin to mount;
* it registers nothing.
*
* @module dsh-agent-mode-switcher
*/
const name = "agent-mode-switcher";
const inject = [];
/**
* Mount the host half. The plugin needs no host services — the switcher and
* every operation live on the browser side.
* @param _ctx - plugin context.
*/
function apply(_ctx) {}
//#endregion
export { apply, inject, name };
