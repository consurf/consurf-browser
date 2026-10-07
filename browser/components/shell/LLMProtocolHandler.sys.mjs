/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EXPORTED_SYMBOLS = ["LLMProtocolHandler"];

export class LLMProtocolHandler {
  scheme = "llm";
  defaultPort = -1;
  protocolFlags =
    Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE |
    Ci.nsIProtocolHandler.URI_NORELATIVE |
    Ci.nsIProtocolHandler.URI_NON_PERSISTENT |
    Ci.nsIProtocolHandler.URI_OPENING_EXECUTES_SCRIPT;

  newURI(aSpec, aOriginCharset, aBaseURI) {
    return Services.io.newSimpleURI(aSpec, aOriginCharset, aBaseURI);
  }

  newChannel(aURI, aLoadInfo) {
    // Strip "llm://" or "llm:" from the beginning of the spec
    let spec = aURI.spec;
    let prompt = spec.replace(/^llm:\/\/?/i, "");

    // Retrieve the target LLM URL from prefs
    let sidebarLlmUrl = Services.prefs.getStringPref(
      "browser.sidebar.llm.url",
      "https://chatgpt.com/?q=%s"
    );

    let targetUrl;
    if (sidebarLlmUrl.includes("%s")) {
      targetUrl = sidebarLlmUrl.replace("%s", encodeURIComponent(prompt));
    } else {
      let separator = sidebarLlmUrl.includes("?") ? "&" : "?";
      targetUrl = `${sidebarLlmUrl}${separator}q=${encodeURIComponent(prompt)}`;
    }

    // Redirect to the chosen LLM web URL
    let newURI = Services.io.newURI(targetUrl);
    return Services.io.newChannelFromURIWithLoadInfo(newURI, aLoadInfo);
  }

  QueryInterface = ChromeUtils.generateQI([Ci.nsIProtocolHandler]);
}