import LineChartIllustration from "./line-chart-illustration"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@pilot/ui/components/table"

const summary = [
  {
    name: "DM Lead Queue",
    value: "2,349 leads",
    planted: "1,980 leads",
    water: "14,033 msgs",
    yield: "+18.2%",
    efficiency: "+7.8%",
    nutrients: "+4.9%",
    bgColor: "bg-chart-1",
    changeType: "positive",
  },
  {
    name: "Comment Triggers",
    value: "1,943 leads",
    planted: "1,760 leads",
    water: "11,033 msgs",
    yield: "+9.1%",
    efficiency: "+5.6%",
    nutrients: "+2.9%",
    bgColor: "bg-chart-2",
    changeType: "positive",
  },
  {
    name: "Manual Escalations",
    value: "443 leads",
    planted: "620 leads",
    water: "2,033 msgs",
    yield: "-5.1%",
    efficiency: "-6.3%",
    nutrients: "-9.9%",
    bgColor: "bg-chart-4",
    changeType: "negative",
  },
]

const FieldPerformance = () => {
  return (
    <div className="shrink-0 overflow-hidden mask-[radial-gradient(white_30%,transparent_90%)] perspective-[4000px] perspective-origin-center">
      <div className="-translate-y-10 -translate-z-10 rotate-x-10 rotate-y-20 -rotate-z-10 transform-3d">
        <h3 className="text-sm text-muted-foreground">Pipeline Performance</h3>
        <p className="mt-1 text-3xl font-semibold text-foreground">
          4,735 qualified leads
        </p>
        <p className="mt-1 text-sm font-medium">
          <span className="text-emerald-700">+430 leads (9.1%)</span>{" "}
          <span className="font-normal text-muted-foreground">
            Past 30 days
          </span>
        </p>
        <LineChartIllustration className="mt-8 w-full max-w-[800px] shrink-0" />

        <div className="mt-6 w-full max-w-full">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Captured</TableHead>
                <TableHead className="text-right">
                  Qualified
                </TableHead>
                <TableHead className="text-right">
                  Messages
                </TableHead>
                <TableHead className="text-right">
                  Lift
                </TableHead>
                <TableHead className="text-right">
                  Reply Rate
                </TableHead>
                <TableHead className="text-right">
                  Close Rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex space-x-3">
                      <span
                        className={item.bgColor + " w-1 shrink-0 rounded"}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.value}</TableCell>
                  <TableCell className="text-right">{item.planted}</TableCell>
                  <TableCell className="text-right">{item.water}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        item.changeType === "positive"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }
                    >
                      {item.yield}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        item.changeType === "positive"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }
                    >
                      {item.efficiency}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        item.changeType === "positive"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }
                    >
                      {item.nutrients}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default FieldPerformance
