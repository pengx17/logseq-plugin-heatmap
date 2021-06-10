import "@logseq/libs";
import "virtual:windi.css";
import "virtual:windi-devtools";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

function main() {
  const pluginId = logseq.baseInfo.id;
  console.info(`#${pluginId}: MAIN`);
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("app")
  );

  function createModel() {
    return {
      show() {
        logseq.showMainUI();
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  const openIconName = "heatmap-plugin-open";

  // @ts-expect-error
  top['pluginId-loaded'] = true;

  logseq.provideStyle(css`
    div[data-injected-ui=${openIconName}-${pluginId}] {
      display: inline-flex;
      align-items: center;
      opacity: 0.55;
      font-weight: 500;
      padding: 0 5px;
      position: relative;
      margin-top: .25rem;
    }

    div[data-injected-ui=${openIconName}-${pluginId}]:hover {
      opacity: 0.9;
    }
  `);

  logseq.provideUI({
    key: openIconName,
    path: "#search",
    template: `
      <a data-on-click="show"
         style="opacity: .6; display: inline-flex; line-height: 1;">🟩</a>
    `,
  });
}

// @ts-expect-error
if (top['pluginId-loaded']) {
  top.location.reload();
}

logseq.ready(main).catch(console.error);
