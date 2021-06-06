import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import ReactTooltip from "react-tooltip";
import "./Heatmap.css";

dayjs.extend(customParseFormat);

const defaultFormat = "YYYY-MM-DD";

const useActivity = (startDate: string, endDate: string) => {
  const [values, setValues] = React.useState<
    { date: string; originalName: string; count: number }[]
  >([]);

  React.useEffect(() => {
    (async () => {
      const [d0, d1] = [
        dayjs(startDate).format("YYYYMMDD"),
        dayjs(endDate).format("YYYYMMDD"),
      ];

      const res: any[] = await logseq.DB.datascriptQuery(`
        [:find (pull ?p [*]) (count ?b)
         :where
         [?b :block/page ?p]
         [?p :block/journal? true]
         [?p :block/journal-day ?d]
         [(>= ?d ${d0})] [(<= ?d ${d1})]]
     `);

      const newValues = res.map(([page, count]: any[]) => {
        return {
          count: count ?? 0,
          date: dayjs("" + page["journal-day"], "YYYYMMDD").format(
            defaultFormat
          ),
          originalName: page["original-name"] as string,
        };
      });

      setValues(newValues);
    })();
  }, [startDate, endDate]);

  return values;
};

type Datum = ReturnType<typeof useActivity>[number];

// We have 1 ~ 4 scales for now:
// [1,  10] -> 1
// [11, 20] -> 2
// [21, 30] -> 2
// > 31     -> 4
const scaleCount = (v: number) => {
  return Math.floor(Math.min(v, 30) / 10) + 1;
};

const getTooltipDataAttrs = (value: Datum) => {
  // Temporary hack around null value.date issue
  if (!value || !value.date) {
    return null;
  }
  // Configuration for react-tooltip
  return {
    "data-tip": `<strong>${value.count} journal blocks</strong> on <span class="opacity-70">${value.originalName}</span>`,
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
        classForValue={(value?: Datum) => {
          let classes: string[] = [];
          if (!value) {
            classes.push("color-empty");
          } else {
            classes.push(`color-github-${scaleCount(value.count)}`);
          }
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
