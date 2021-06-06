import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
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

      const newValuesPromises = res.map(([page, count]: any[]) => {
        return {
          count: count ?? 0,
          date: dayjs("" + page["journal-day"], "YYYYMMDD").format(
            defaultFormat
          ),
          originalName: page["original-name"] as string,
        };
      });

      const newValues = await Promise.all(newValuesPromises);
      setValues(newValues.filter((v) => v.count !== 0));
    })();
  }, [startDate, endDate]);

  return values;
};

const scaleCount = (v: number) => {
  return Math.floor(Math.min(v, 30) / 10) + 1;
};

const getTooltipDataAttrs = (value: any) => {
  // Temporary hack around null value.date issue
  if (!value || !value.date) {
    return null;
  }
  // Configuration for react-tooltip
  return {
    "data-tip": `[[${value.originalName}]] has ${value.count} journal blocks`,
  };
};

const useUpdateCounter = (v: any) => {
  const [state, setState] = React.useState(0);
  React.useEffect(() => {
    setState((c) => c + 1);
  }, [v]);
  return state;
};

export const Heatmap = React.forwardRef<HTMLDivElement>(({}, ref) => {
  const endDate = dayjs().format(defaultFormat);
  const startDate = dayjs(endDate)
    .add(-12 * 7, "d")
    .endOf("week")
    .format(defaultFormat);
  const values = useActivity(startDate, endDate);
  const counter = useUpdateCounter(values);
  return (
    <div
      ref={ref}
      className="w-60 p-4 bg-white rounded right-2 top-10 absolute"
    >
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={(value) => {
          if (!value) {
            return "color-empty";
          }
          return `color-github-${scaleCount(value.count)}`;
        }}
        tooltipDataAttrs={getTooltipDataAttrs}
        onClick={(d) => {
          if (d) {
            logseq.App.pushState("page", { name: d.originalName });
            logseq.hideMainUI();
          }
        }}
        gutterSize={1.5}
        transformDayElement={(rect) => {
          return React.cloneElement(rect, { rx: 2 });
        }}
      />
      <ReactTooltip key={counter} />
    </div>
  );
});
