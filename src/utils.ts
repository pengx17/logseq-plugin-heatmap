import { format, parse } from "date-fns";
import React, { useState } from "react";
import { useMountedState } from "react-use";
import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";

export const triggerIconName = "logseq-heatmap-trigger-icon";

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

export const useCurrentPage = () => {
  const [page, setPage] = React.useState<null | PageEntity | BlockEntity>(null);
  const setActivePage = React.useCallback(async () => {
    const p = await logseq.Editor.getCurrentPage();
    setPage(p);
  }, []);
  React.useEffect(() => {
    setActivePage();
    return logseq.App.onRouteChanged(setActivePage);
  }, [setActivePage]);
  return page;
};

export const useCurrentJournalDate = () => {
  const page = useCurrentPage();
  return React.useMemo(() => {
    if (page && page["journal?"] && page.journalDay) {
      return parseJournalDate(page.journalDay);
    }
    return null;
  }, [page]);
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
      if (isMounted()) {
        setMode(s.mode);
      }
    });
  }, [isMounted]);

  return mode;
};

export let displayDateFormat = "MMM do, yyyy";

export async function getDisplayDateFormat() {
  let format =
    (await logseq.App.getUserConfigs())?.preferredDateFormat ?? "MMM do, yyyy";

  displayDateFormat = format;
  return format;
}

export const toDate = (d: Date | string) => {
  if (typeof d !== "string") {
    return d;
  }
  return new Date(d);
};

export const formatAsDashed = (d: Date | string) => {
  return format(toDate(d), "yyyy-MM-dd");
};

export const formatAsParam = (d: Date | string) => {
  return format(toDate(d), "yyyyMMdd");
};

export const formatAsLocale = (d: Date | string) => {
  return format(toDate(d), displayDateFormat);
};

export const parseJournalDate = (d: number) => {
  return parse(`${d}`, "yyyyMMdd", new Date());
};
