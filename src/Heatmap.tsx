import {
  addDays,
  addWeeks,
  differenceInDays,
  endOfWeek,
  startOfWeek,
} from "date-fns";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import ReactTooltip from "react-tooltip";
import { useMountedState, useWindowSize } from "react-use";
import "./Heatmap.css";
import {
  formatAsDashed,
  formatAsLocale,
  formatAsParam,
  triggerIconName,
  parseJournalDate,
  useCurrentJournalDate,
} from "./utils";

function ErrorFallback({ error }: FallbackProps) {
  return (
    <div role="alert" className="text-red-500 font-semibold">
      <p>
        Heatmap failed to render. Can you re-index your graph and try again?
      </p>
    </div>
  );
}

const useActivities = (startDate: string, endDate: string) => {
  const isMounted = useMountedState();
  const currentJournalDate = useCurrentJournalDate();

  const [rawValue, setRawValue] = React.useState<any[]>([]);

  React.useLayoutEffect(() => {
    (async () => {
      const date0 = new Date(startDate);
      const date1 = new Date(endDate);

      const res: any[] = await logseq.DB.datascriptQuery(`
        [:find (pull ?p [*]) (count ?b)
         :where
         [?b :block/page ?p]
         [?p :block/journal? true]
         [?p :block/journal-day ?d]
         [?b :block/content ?c]
         [(clojure.string/blank? ?c) ?empty]
         [(not ?empty)]
         [(>= ?d ${formatAsParam(date0)})]
         [(<= ?d ${formatAsParam(date1)})]]
     `);

      if (isMounted()) {
        setRawValue(res);
      }
    })();
  }, [startDate, endDate]);

  return React.useMemo(() => {
    const date0 = new Date(startDate);
    const date1 = new Date(endDate);
    const mapping = Object.fromEntries(
      rawValue.map(([page, count]: any[]) => {
        const date = parseJournalDate(page["journal-day"]);
        const datum = {
          count: count ?? 0,
          date: formatAsDashed(date),
          originalName: page["original-name"] as string,
        };
        return [datum.date, datum];
      })
    );

    const totalDays = differenceInDays(date1, date0) + 1;
    const newValues: Datum[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = formatAsDashed(addDays(date0, i));
      if (mapping[date]) {
        newValues.push(mapping[date]);
      } else {
        newValues.push({
          date,
          count: 0,
          originalName: formatAsLocale(date),
        });
      }
    }

    if (currentJournalDate) {
      const datum = newValues.find(
        (v) => formatAsDashed(currentJournalDate) === v.date
      );
      if (datum) {
        datum.isActive = true;
      }
    }
    return newValues;
  }, [rawValue, currentJournalDate]);
};

type Datum = {
  date: string;
  originalName: string;
  count: number;
  isActive?: boolean;
};

// We have 1 ~ 4 scales for now:
// [1,  10] -> 1
// [11, 20] -> 2
// [21, 30] -> 3
// > 31     -> 4
const scaleCount = (v: number) => {
  return Math.ceil(Math.min(v, 40) / 10);
};

const getTooltipDataAttrs = (value: Datum) => {
  // Temporary hack around null value.date issue
  if (!value || !value.date) {
    return null;
  }
  // Configuration for react-tooltip
  const count = value.count === 0 ? "No" : value.count;
  return {
    "data-tip": `<strong>${count} journal blocks</strong> on <span class="opacity-70">${value.originalName}</span>`,
  };
};

const useUpdateCounter = (v: any) => {
  const [state, setState] = React.useState(0);
  React.useEffect(() => {
    setState((c) => c + 1);
  }, [v]);
  return state;
};

const HeatmapChart = ({
  today,
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
  today: string;
}) => {
  const activities = useActivities(startDate, endDate);
  const counter = useUpdateCounter(activities);
  const weeks = Math.ceil(activities.length / 7);
  const totalBlocks = activities.reduce((acc, cur) => acc + cur.count, 0);
  return (
    <div style={{ width: `${weeks * 16}px` }}>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={activities}
        showOutOfRangeDays
        classForValue={(value: Datum) => {
          let classes: string[] = [];
          classes.push(`color-github-${scaleCount(value?.count ?? 0)}`);
          if (today === value?.date) {
            classes.push("today");
          }
          if (value?.isActive) {
            classes.push("active");
          }
          return classes.join(" ");
        }}
        tooltipDataAttrs={getTooltipDataAttrs}
        onClick={(d: Datum) => {
          if (d) {
            logseq.App.pushState("page", { name: d.originalName });
            // Allow the user to quickly navigate between different days
            // logseq.hideMainUI();
          }
        }}
        gutterSize={4}
        transformDayElement={(rect) => {
          return React.cloneElement(rect, { rx: 3 });
        }}
      />
      <div className="text-xs text-right mt-1">
        Total journal blocks during this period:{" "}
        <span className="font-medium">
          {new Intl.NumberFormat().format(totalBlocks)}
        </span>
      </div>
      <ReactTooltip key={counter} effect="solid" html />
    </div>
  );
};

const NUM_WEEKS = 25; // Half a year

const DateRange = ({
  range,
  onRangeChange,
  today,
}: {
  range: [string, string] | null;
  onRangeChange: (r: [string, string]) => void;
  today: string;
}) => {
  React.useLayoutEffect(() => {
    if (!range) {
      const endDate = formatAsDashed(endOfWeek(new Date(today)));
      const startDate = formatAsDashed(
        startOfWeek(addWeeks(endOfWeek(new Date(today)), -NUM_WEEKS))
      );
      onRangeChange([startDate, endDate]);
    }
  }, [range]);

  const onRangeClick = (isPrev: boolean) => {
    const [, endDate] = range!;
    const newEndDate = formatAsDashed(
      addWeeks(new Date(endDate), isPrev ? -12 : 12)
    );

    const newStartDate = formatAsDashed(
      startOfWeek(addWeeks(new Date(newEndDate), -NUM_WEEKS))
    );

    onRangeChange([newStartDate, newEndDate]);
  };

  if (range) {
    const [startDate, endDate] = range;
    return (
      <div className="text-xs mb-2">
        From
        <span className="date-range-tag" onClick={() => onRangeClick(true)}>
          {formatAsLocale(startDate)}
        </span>
        to
        <span className="date-range-tag" onClick={() => onRangeClick(false)}>
          {formatAsLocale(endDate)}
        </span>
      </div>
    );
  }
  return null;
};

function useIconPosition() {
  const windowSize = useWindowSize();
  return React.useMemo(() => {
    let right = windowSize.width - 10;
    let bottom = 20;
    if (top?.document) {
      const iconRect = top?.document
        .querySelector(`.${triggerIconName}`)
        ?.getBoundingClientRect();
      if (iconRect) {
        right = iconRect.right;
        bottom = iconRect.bottom;
      }
    }
    return { right, bottom };
  }, [windowSize]);
}

export const Heatmap = React.forwardRef<HTMLDivElement>(({}, ref) => {
  const today = formatAsDashed(new Date());
  const [range, setRange] = React.useState<[string, string] | null>(null);
  const { bottom, right } = useIconPosition();
  return (
    <div
      ref={ref}
      className="heatmap-root"
      style={{ left: right - 300, top: bottom + 20 }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DateRange range={range} onRangeChange={setRange} today={today} />
        {range && (
          <HeatmapChart today={today} endDate={range[1]} startDate={range[0]} />
        )}
      </ErrorBoundary>
    </div>
  );
});
