import React, { useRef } from "react";
import { Heatmap } from "./Heatmap";
import { useAppVisible, useThemeMode } from "./utils";

function App() {
  const innerRef = useRef<HTMLDivElement>(null);
  const visible = useAppVisible();
  const themeMode = useThemeMode();
  const [started, setStarted] = React.useState(visible);
  React.useEffect(() => {
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
    );
  }
  return null;
}

export default App;
