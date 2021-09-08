import React, { useState } from "react";
import { useMountedState } from "react-use";

export const openIconName = "heatmap-plugin-open";

export function getIconPosition() {
  const pluginId = logseq.baseInfo.id;
  const el = top?.document.querySelector(
    `div[data-injected-ui=${openIconName}-${pluginId}]`
  );
  return el!.getBoundingClientRect();
}

export const useAppVisible = () => {
  const [visible, setVisible] = useState(logseq.isMainUIVisible);
  const isMounted = useMountedState();
  React.useEffect(() => {
    const eventName = "ui:visible:changed";
    const handler = async ({ visible }: any) => {
      if (isMounted()) {
        setVisible(visible);
      }
    };
    logseq.on(eventName, handler);
    return () => {
      logseq.off(eventName, handler);
    };
  }, [isMounted]);
  return visible;
};

export const useSidebarVisible = () => {
  const [visible, setVisible] = useState(false);
  const isMounted = useMountedState();
  React.useEffect(() => {
    logseq.App.onSidebarVisibleChanged(({ visible }) => {
      if (isMounted()) {
        setVisible(visible);
      }
    });
  }, [isMounted]);
  return visible;
};

export const useThemeMode = () => {
  const isMounted = useMountedState();
  const [mode, setMode] = React.useState<"dark" | "light">("light");
  React.useEffect(() => {
    setMode(
      (top?.document
        .querySelector("html")
        ?.getAttribute("data-theme") as typeof mode) ??
        (matchMedia("prefers-color-scheme: dark").matches ? "dark" : "light")
    );
    logseq.App.onThemeModeChanged((s) => {
      console.log(s);
      if (isMounted()) {
        setMode(s.mode);
      }
    });
  }, [isMounted]);

  return mode;
};
