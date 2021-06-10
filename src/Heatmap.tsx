import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";

import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import ReactTooltip from "react-tooltip";
import { useMountedState } from "react-use";
import "./Heatmap.css";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

const defaultFormat = "YYYY-MM-DD";

const useActivity = (startDate: string, endDate: string) => {
  const [values, setValues] = React.useState<
    { date: string; originalName: string; count: number }[]
  >([]);
  const isMounted = useMountedState();

  React.useEffect(() => {
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

type Datum = ReturnType<typeof useActivity>[number];

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
  return {
    "data-tip": `<strong>${
      value.count === 0 ? "No" : value.count
    } journal blocks</strong> on <span class="opacity-70">${
      value.originalName
    }</span>`,
  };
};

const useUpdateCounter = (v: any) => {
  const [state, setState] = React.useState(0);
  React.useEffect(() => {
    setState((c) => c + 1);
  }, [v]);
  return state;
};

const NUM_WEEKS = 16; // A quarter

export const Heatmap = React.forwardRef<HTMLDivElement>(({}, ref) => {
  const today = dayjs().format(defaultFormat);
  const endDate = dayjs().endOf("week").format(defaultFormat);
  const startDate = dayjs(endDate)
    .add(-NUM_WEEKS * 7, "d")
    .endOf("week")
    .format(defaultFormat);
  const values = useActivity(startDate, endDate);
  const counter = useUpdateCounter(values);
  return (
    <div
      ref={ref}
      style={{ width: `${NUM_WEEKS * 20}px` }}
      className="heatmap-root"
    >
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
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
});
