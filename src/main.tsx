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
    div[data-injected-ui=${openIconName}-${pluginId}] .logseq-heatmap-trigger-icon {
      width: 1em;
      height: 1em;
      display: inline-flex;
      background-color: #26a641;
      border-radius: 4px;
      border: 1px solid #eee;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: openIconName,
    template: `
    <a data-on-click="show"
       style="opacity: .6; display: inline-flex; line-height: 1;">
       <div class="logseq-heatmap-trigger-icon"></div>
    </a>
  `,
  });
}

if (process.env.NODE_ENV === "development") {
  // @ts-expect-error
  if (top[magicKey]) {
    top?.location.reload();
  }
}

logseq.ready(main).catch(console.error);
