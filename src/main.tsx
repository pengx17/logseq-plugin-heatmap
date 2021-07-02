import "@logseq/libs";
import "virtual:windi.css";
import "virtual:windi-devtools";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { openIconName } from "./utils";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const magicKey = "__heatmap__plugin__loaded__";

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

  // @ts-expect-error
  top[magicKey] = true;

  logseq.provideStyle(css`
    div[data-injected-ui=${openIconName}-${pluginId}] {
      display: inline-flex;
      align-items: center;
      opacity: 0.8;
      font-weight: 500;
      padding: 0 5px;
      position: relative;
    }

    div[data-injected-ui=${openIconName}-${pluginId}]:hover {
      opacity: 1;
    }

    div[data-injected-ui=${openIconName}-${pluginId}] .logseq-heatmap-trigger-icon {
      width: 1em;
      height: 1em;
      display: inline-flex;
      background-color: #26a641;
      border-radius: 4px;
      border: 1px solid #eee;
    }
  `);

  logseq.provideUI({
    key: openIconName,
    path: "#search",
    template: `
      <a data-on-click="show"
         style="opacity: .6; display: inline-flex; line-height: 1;">
         <div class="logseq-heatmap-trigger-icon"></div>
      </a>
    `,
  });
}

// @ts-expect-error
if (top[magicKey]) {
  top.location.reload();
}

logseq.ready(main).catch(console.error);
