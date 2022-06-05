import React, { useRef } from "react";
import { setLocale } from "./translate";
import { useAppVisible, useThemeMode } from "./utils";
const Heatmap = React.lazy(() =>
  import("./Heatmap").then((d) => ({ default: d.Heatmap }))
);

function App() {
  const innerRef = useRef<HTMLDivElement>(null);
  const visible = useAppVisible();
  const themeMode = useThemeMode();
  const [started, setStarted] = React.useState(visible);
  React.useEffect(() => {
    logseq.App.getUserConfigs().then((config) => {
      setLocale(config.preferredLanguage);
    });

    if (visible) {
      setStarted(true);
    } else {
      const timer = setTimeout(() => {
        setStarted(false);
      }, 1 * 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [visible]);

  if (started) {
    return (
      <React.Suspense fallback="loading...">
        <main
          className={`absolute inset-0 ${themeMode}`}
          onClick={(e) => {
            if (!innerRef.current?.contains(e.target as any)) {
              window.logseq.hideMainUI();
            }
          }}
        >
          <Heatmap ref={innerRef} />
        </main>
      </React.Suspense>
    );
  }
  return null;
}

export default App;
