import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";

import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import ReactTooltip from "react-tooltip";
import { useMountedState } from "react-use";
import "./Heatmap.css";
import { getIconPosition as getTriggerIconPosition } from "./utils";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

const defaultFormat = "YYYY-MM-DD";

const useActivities = (startDate: string, endDate: string) => {
  const [values, setValues] = React.useState<
    { date: string; originalName: string; count: number }[]
  >([]);
  const isMounted = useMountedState();

  React.useLayoutEffect(() => {
    (async () => {
      const d0 = dayjs(startDate).format("YYYYMMDD");
      const d1 = dayjs(endDate).format("YYYYMMDD");

      const res: any[] = await logseq.DB.datascriptQuery(`
        [:find (pull ?p [*]) (count ?b)
         :where
         [?b :block/page ?p]
         [?p :block/journal? true]
         [?p :block/journal-day ?d]
         [(>= ?d ${d0})] [(<= ?d ${d1})]]
     `);

      const mapping = Object.fromEntries(
        res.map(([page, count]: any[]) => {
          const datum = {
            count: count ?? 0,
            date: dayjs("" + page["journal-day"], "YYYYMMDD").format(
              defaultFormat
            ),
            originalName: page["original-name"] as string,
          };
          return [datum.date, datum];
        })
      );

      const totalDays = dayjs(endDate).diff(dayjs(startDate), "d") + 1;
      const newValues: Datum[] = [];
      for (let i = 0; i < totalDays; i++) {
        const date = dayjs(startDate).add(i, "d").format(defaultFormat);
        if (mapping[date]) {
          newValues.push(mapping[date]);
        } else {
          newValues.push({
            date,
            count: 0,
            // FIXME: only support default date format for now
            originalName: dayjs(date).format("MMM Do, YYYY"),
          });
        }
      }

      if (isMounted()) {
        setValues(newValues);
      }
    })();
  }, [startDate, endDate]);

  return values;
};

type Datum = ReturnType<typeof useActivities>[number];

// We have 1 ~ 4 scales for now:
// [1,  10] -> 1
// [11, 20] -> 2
// [21, 30] -> 3
// > 31     -> 4
const scaleCount = (v: number) => {
  return Math.ceil(Math.min(v, 30) / 10);
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
          return classes.join(" ");
        }}
        tooltipDataAttrs={getTooltipDataAttrs}
        onClick={(d: Datum) => {
          if (d) {
            logseq.App.pushState("page", { name: d.originalName });
            logseq.hideMainUI();
          }
        }}
        gutterSize={4}
        transformDayElement={(rect) => {
          return React.cloneElement(rect, { rx: 3 });
        }}
      />
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
      const endDate = dayjs(today).endOf("week").format(defaultFormat);
      const startDate = dayjs(endDate)
        .add(-NUM_WEEKS, "week")
        .startOf("week")
        .format(defaultFormat);
      onRangeChange([startDate, endDate]);
    }
  }, [range]);

  const onRangeClick = (isPrev: boolean) => {
    const [, endDate] = range!;
    const newEndDate = dayjs(endDate).add(isPrev ? -12 : 12, "weeks").format(defaultFormat);
    const newStartDate = dayjs(newEndDate)
      .add(-NUM_WEEKS, "week")
      .startOf("week")
      .format(defaultFormat);

    onRangeChange([newStartDate, newEndDate]);
  };

  if (range) {
    const [startDate, endDate] = range;
    return (
      <div className="text-xs mb-2">
        From
        <span className="date-range-tag" onClick={() => onRangeClick(true)}>
          {dayjs(startDate).format("MMM Do, YYYY")}
        </span>
        to
        <span className="date-range-tag" onClick={() => onRangeClick(false)}>
          {dayjs(endDate).format("MMM Do, YYYY")}
        </span>
      </div>
    );
  }
  return null;
};

export const Heatmap = React.forwardRef<HTMLDivElement>(({}, ref) => {
  const today = dayjs().format(defaultFormat);
  const [range, setRange] = React.useState<[string, string] | null>(null);
  const { x, bottom, right, y } = getTriggerIconPosition();
  return (
    <div ref={ref} className="heatmap-root" style={{ left: right - 250, top: bottom + 20 }}>
      <DateRange range={range} onRangeChange={setRange} today={today} />
      {range && (
        <HeatmapChart today={today} endDate={range[1]} startDate={range[0]} />
      )}
    </div>
  );
});
