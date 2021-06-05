import * as React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

import ReactTooltip from "react-tooltip";

import "./Heatmap.css";
import { BlockEntity, BlockUUIDTuple } from "@logseq/libs/dist/LSPlugin";

const defaultFormat = "YYYY-MM-DD";
const dateFn = (offset = 0) => {
  return dayjs().add(offset, "d").format(defaultFormat);
};

function isBlockEntity(
  maybeBlockEntity: BlockEntity | BlockUUIDTuple
): maybeBlockEntity is BlockEntity {
  // PageEntity does not have "page" property
  return "page" in maybeBlockEntity;
}

function countBlockEntity(blocks: BlockEntity[]): number {
  if (blocks.length === 0) {
    return 0;
  }

  return (
    blocks.length +
    blocks.reduce((accum, block) => {
      if (block.children) {
        return accum + countBlockEntity(block.children.filter(isBlockEntity));
      }
      return accum;
    }, 0)
  );
}

const getCountForDate = async (journalName: string) => {
  const res = await logseq.Editor.getPageBlocksTree(journalName);
  return countBlockEntity(res);
};

const useActivity = (startDate: string, endDate: string) => {
  const [values, setValues] = React.useState<
    { date: string; originalName: string; count: number }[]
  >([]);

  React.useEffect(() => {
    (async () => {
      // let newValuesPromises: Promise<{ date: string; count: number }>[] = [];

      const [d0, d1] = [
        dayjs(startDate).format("YYYYMMDD"),
        dayjs(endDate).format("YYYYMMDD"),
      ];

      const res: any[] = await logseq.DB.datascriptQuery(`
      [:find (pull ?p [*])
       :where
       [?b :block/page ?p]
       [?p :block/journal? true]
       [?p :block/journal-day ?d]
       [(>= ?d ${d0})] [(<= ?d ${d1})]]
    `);

      const newValuesPromises = res.flat().map((page: any) => {
        return getCountForDate(page["name"]).then((count) => ({
          count: count ?? 0,
          date: dayjs("" + page["journal-day"], "YYYYMMDD").format(
            defaultFormat
          ),
          originalName: page["original-name"] as string,
        }));
      });

      const newValues = await Promise.all(newValuesPromises);
      setValues(newValues.filter((v) => v.count !== 0));
    })();
  }, [startDate, endDate]);

  return values;
};

const scaleCount = (v: number) => {
  return Math.floor(Math.min(v, 50) / 10) + 1;
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

export const Heatmap = React.forwardRef<HTMLDivElement>(({}, ref) => {
  const endDate = dayjs().format(defaultFormat);
  const startDate = dayjs(endDate)
    .add(-12 * 7, "d")
    .endOf("week")
    .format(defaultFormat);
  const values = useActivity(startDate, endDate);
  React.useEffect(() => {
    ReactTooltip.rebuild();
  }, [values]);
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
            logseq.App.pushState('page', { name: d.originalName })
            logseq.hideMainUI()
          }
        }}
        gutterSize={1.5}
        transformDayElement={(rect) => {
          return React.cloneElement(rect, { rx: 2 });
        }}
      />
      <ReactTooltip />
    </div>
  );
});
