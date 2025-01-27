import React, { Fragment, useState, useEffect } from "react";
import { PROJECT_STATES, PROJECT_STATES_ALL, TERMINATED } from "./const";
import Store from "./Store";
import { initCap } from "./BaseComponents";
import { Scrollable } from './Scrollable';

const ReportSelector = ({ reports, activeReportCode, setActiveReportCode }) => {
  return (
    <>
      <select
        value={activeReportCode}
        onChange={e => setActiveReportCode(e.target.value)}
        className="text-3xl font-bold mt-3 bg-gray-200 rounded leading-tight no-print"
      >
        {reports.map(r => (
          <option className="text-normal" value={r.code} key={r.code}>
            {r.name}
          </option>
        ))}
      </select>
      <span className="text-3xl font-bold mt-3 leading-tight only-print">
        {reports.find(r => r.code === activeReportCode).name}
      </span>
    </>
  );
};

const B = ({ children }) => <span className="font-bold">{children}</span>;

const Note = ({
  notes = [
    `Edit "notes" in data.json to update this section.<br>
      Then click "Edit" -> "Load" to apply changes.<br>
      "Notes" is an array, which is joined and set as html.`
  ]
}) => (
  <ul
    className="list-disc list-inside bg-gray-200 p-4 text-sm"
    dangerouslySetInnerHTML={{ __html: notes.join("\n") }}
  />
);

const Td = ({
  children,
  className,
  yellow,
  red,
  green,
  bold,
  c = (f, t) => (f ? ` ${t}` : "")
}) => (
  <td
    className={
      "p-1 pl-3 w-1/4 whitespace-pre-line text-left align-top " +
      className +
      c(red, "bg-red-200") +
      c(green, "bg-green-200") +
      c(yellow, "bg-yellow-200") +
      c(bold, "font-bold")
    }
  >
    {children}
  </td>
);

const TotalsTable = ({ projects, prevProjects }) => {
  const Row = ({ cells, ...props }) => (
      <tr>
        <Td {...props}>{cells[0]}</Td>
        <Td green {...props}>
          {cells[1]}
        </Td>
        <Td yellow {...props}>
          {cells[2]}
        </Td>
        <Td red {...props}>
          {cells[3]}
        </Td>
      </tr>
    ),
    sum = (a, b) => a + b,
    countProjects = ps =>
      ps && PROJECT_STATES.map(t => (ps[t] ? ps[t].length : 0)).reduce(sum),
    totalProjectsNow = countProjects(projects),
    totalProjectsThen = countProjects(prevProjects),
    Comparer = ({
      now,
      then = 0,
      totalNow,
      totalThen,
      tip,
      projectState,
      lowerBetter = false
    }) => {
      const percent = (v, t) => Math.round((100 * v) / t),
        nowValue = totalNow ? percent(now, totalNow) : now,
        thenValue = totalThen ? percent(then, totalThen) : then,
        maybePercent = totalNow || totalThen ? "%" : "",
        change = nowValue - thenValue,
        changeText = ` ${
          change > 0
            ? "increased by " + change
            : change < 0
            ? "decreased by " + -change
            : "not changed"
        }`,
        good =
          nowValue === thenValue ||
          (lowerBetter && nowValue < thenValue) ||
          (!lowerBetter && nowValue > thenValue),
        arrow = thenValue > nowValue ? "↓" : "↑",
        title =
          (tip && tip + changeText) ||
          (totalNow
            ? `Percentage of ${projectState} projects from total${changeText}`
            : `Number of ${projectState} projects${changeText}`);
      return (
        <span title={title} className="cursor-default">
          {nowValue + maybePercent}{" "}
          <span
            className={
              "font-normal text-sm " +
              (good ? "text-green-400" : "text-red-400")
            }
          >
            ({arrow}
            {Math.abs(nowValue - thenValue) + maybePercent})
          </span>
        </span>
      );
    },
    TdComparer = ({ projectState, ...props }) => (
      <Td {...{ [projectState]: true }}>
        <Comparer
          now={projects[projectState] && projects[projectState].length}
          then={
            prevProjects &&
            prevProjects[projectState] &&
            prevProjects[projectState].length
          }
          lowerBetter={projectState === "yellow" || projectState === "red"}
          projectState={projectState}
          {...props}
        />
      </Td>
    );
  return (
    <>
      <table className="mt-3 text-left font-mono w-full border-collapse">
        <thead style={{ borderBottom: "solid silver 1px" }}>
          <Row
            bold
            cells={[
              "Total Projects",
              "Green State",
              "Yellow State",
              "Red State"
            ]}
          />
        </thead>
        <tbody>
          <tr>
            <Td bold>
              <Comparer
                now={totalProjectsNow}
                then={totalProjectsThen}
                tip={"Total projects"}
                lowerBetter={false}
              />
            </Td>
            {PROJECT_STATES.map(ps => (
              <TdComparer key={ps} projectState={ps} />
            ))}
          </tr>
          <tr>
            <Td bold>%</Td>
            {PROJECT_STATES.map(ps => (
              <TdComparer
                key={ps}
                projectState={ps}
                totalNow={totalProjectsNow}
                totalThen={totalProjectsThen}
              />
            ))}
          </tr>
        </tbody>
      </table>
      <p className="text-sm text-gray-600 pl-3">
        * Numbers in brackets show comparison to previous month
      </p>
    </>
  );
};

const ProjectStatus = ({ project, hideOK }) => {
  const { issues, staffing, notes } = project || {
    issues: null,
    staffing: null,
    notes: null
  };
  return (
    <ul>
      {issues ? (
        issues.map(i =>
          i ? (
            <Fragment key={i.id}>
              <li>{i.issue}</li>
              <li className="mb-2">
                <B>Mitigation: </B>
                {i.mitigation} <B>ETA: </B> {i.eta || "none"}
              </li>
            </Fragment>
          ) : (
            ""
          )
        )
      ) : (
        <>
          {!hideOK && <B>OK. </B>}
          {notes && <span className="text-gray-600">{notes}</span>}
        </>
      )}
      {staffing && (
        <li className="text-blue-500">
          <B>Staffing: </B>
          {staffing}
        </li>
      )}
      {issues && issues.length > 0 && notes && (
        <li className="text-gray-600">
          <B>Notes: </B>
          {notes}
        </li>
      )}
    </ul>
  );
};

const ProjectTable = ({ projectState, projects }) => (
  <table className="mt-3 w-full border-collapse">
    <thead style={{ borderBottom: "solid silver 1px" }}>
      <tr>
        <Td bold>Project</Td>
        <Td bold className="w-3/4">
          Status
        </Td>
      </tr>
    </thead>
    <tbody>
      {projects.map(project => (
        <tr key={project.id} style={{ borderBottom: "solid silver 1px" }}>
          <Td className="align-top" {...{ [projectState]: true }}>
            {project && project.name}
          </Td>
          <Td {...{ [projectState]: true }}>
            <ProjectStatus
              project={project}
              hideOK={projectState === TERMINATED}
            />
          </Td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ProjectListForState = p => {
  return (
    <>
      <h1 className="text-3xl mt-5">{initCap(p.projectState)}</h1>
      {p.projects && p.projects.length > 0 ? (
        <ProjectTable {...p} />
      ) : (
        "No projects."
      )}
    </>
  );
};

export default ({
  data,
  activeReportCode,
  setActiveReportCode,
  reportToPrintRef
}) => {
  const [activeReport, setActiveReport] = useState(data.reports[0]);
  useEffect(() => {
    Store.lastSelectedReport = activeReportCode;
    setActiveReport(data.reports.find(r => r.code === activeReportCode));
  }, [activeReportCode, data.reports]);
  return (
    <Scrollable>
      <div
        ref={reportToPrintRef}
        className="container p-4 mx-auto max-w-4xl good-fonts"
      >
        <img
          alt="Logo"
          src={data.headerImageSrc || "https://placekitten.com/300/100"}
          className="mx-auto"
        />
        <h1 className="text-3xl">
          <ReportSelector
            reports={data.reports}
            activeReportCode={activeReportCode}
            setActiveReportCode={setActiveReportCode}
          />{" "}
          — {data.reportName || "<data.reportName>"}
        </h1>
        <Note notes={data.notes} />
        <TotalsTable
          projects={activeReport.projects}
          prevProjects={activeReport.prev && activeReport.prev.projects}
        />
        {PROJECT_STATES_ALL.map(ps => (
          <ProjectListForState
            key={ps}
            projectState={ps}
            projects={activeReport.projects[ps]}
          />
        ))}
      </div>
    </Scrollable>
  );
};

//

// line 322!!!
