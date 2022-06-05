import "@logseq/libs";
import "virtual:windi.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { getDisplayDateFormat, triggerIconName } from "./utils";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

function main() {
  const pluginId = logseq.baseInfo.id;
  console.info(`#${pluginId}: MAIN`);
  const node = ReactDOM.createRoot(document.getElementById("app")!);
  node.render(<App />);

  function createModel() {
    return {
      async show() {
        await getDisplayDateFormat();
        logseq.showMainUI();
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
    maxWidth: "calc(100% - 10px)",
  });

  logseq.provideStyle(css`
    .${triggerIconName} {
      width: 18px;
      height: 18px;
      margin: 2px 0.4em 0 0.4em;
      background-color: #26a641;
      border-radius: 4px;
      border: 1px solid #eee;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: "heatmap-plugin-open",
    template: `
    <a data-on-click="show">
      <div class="${triggerIconName}"></div>
    </a>
  `,
  });
}

logseq.ready(main).catch(console.error);
