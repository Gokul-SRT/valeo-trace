import React, { useLayoutEffect, useRef } from "react";
import { Card } from "antd";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import * as am4plugins_timeline from "@amcharts/amcharts4/plugins/timeline";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import "antd/dist/reset.css";
import "./style.css";

am4core.useTheme(am4themes_animated);

const cycleData = [
  { category: "Main Assy-1", start: "2025-10-15T17:30:00", end: "2025-10-15T17:30:02", text: "Main Assy-1", color: "#6FC4F0" },
  { category: "Main Assy-2", start: "2025-10-15T17:30:04", end: "2025-10-15T17:30:07", text: "Main Assy-2", color: "#6FC4F0" },
  { category: "Main Assy-3", start: "2025-10-15T17:30:08", end: "2025-10-15T17:30:11", text: "Main Assy-3", color: "#6FC4F0" },

  { category: "End Of Line Tester", start: "2025-10-15T17:30:27", end: "2025-10-15T17:30:30", text: "End Of Line Tester", color: "#6FC4F0" },
  { category: "Blower Sub Assembly", start: "2025-10-15T17:30:24", end: "2025-10-15T17:30:27", text: "Blower Sub Assembly", color: "#6FC4F0" },

  { category: "Evaporator Insulator Assembly", start: "2025-10-15T17:30:31", end: "2025-10-15T17:30:33", text: "Evaporator Insulator Assembly", color: "#6FC4F0" },
  { category: "Loading And Unloading (Threshold)", start: "2025-10-15T17:30:34", end: "2025-10-15T17:30:37", text: "Loading & Unloading > Threshold", color: "#EB4C42" },

  { category: "Firewall Station", start: "2025-10-15T17:30:39", end: "2025-10-15T17:30:41", text: "Firewall Station", color: "#6FC4F0" },

  { category: "Picking Racks", start: "2025-10-15T17:31:01", end: "2025-10-15T17:31:03", text: "Picking Racks", color: "#6FC4F0" },
  { category: "Motor Noise Check", start: "2025-10-15T17:30:56", end: "2025-10-15T17:30:58", text: "Motor Noise Check", color: "#6FC4F0" },

  { category: "Intake Sub Assembly-2", start: "2025-10-15T17:30:51", end: "2025-10-15T17:30:55", text: "Intake Sub Assembly-2", color: "#6FC4F0" },
  { category: "Final Assy", start: "2025-10-15T17:31:05", end: "2025-10-15T17:31:13", text: "Final Assy", color: "#6FC4F0" },

  { category: "Intake Sub Assembly-1", start: "2025-10-15T17:30:46", end: "2025-10-15T17:30:50", text: "Intake Sub Assembly-1", color: "#6FC4F0" },
  { category: "End Of Line", start: "2025-10-15T17:31:14", end: "2025-10-15T17:31:20", text: "End Of Line", color: "#6FC4F0" },
];

const SerpentineTimelineChart = () => {
  const chartRef = useRef(null);

  useLayoutEffect(() => {
    const chart = am4core.create(chartRef.current, am4plugins_timeline.SerpentineChart);

    chart.orientation = "vertical";
    chart.levelCount = 5; // five serpentine lines
    chart.curveContainer.padding(40, 0, 40, 0);
    chart.yAxisRadius = am4core.percent(25);
    chart.yAxisInnerRadius = am4core.percent(0);
    chart.maskBullets = false;
    chart.logo.disabled = true;

    chart.data = cycleData;
    chart.dateFormatter.inputDateFormat = "yyyy-MM-ddTHH:mm:ss";

    let categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "category";
    categoryAxis.renderer.grid.template.disabled = true;
    categoryAxis.renderer.labels.template.fontSize = 13;
    categoryAxis.renderer.labels.template.rotation = -15;
    categoryAxis.renderer.labels.template.dx = 12;

    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.baseInterval = { count: 1, timeUnit: "second" };
    dateAxis.dateFormats.setKey("second", "HH:mm:ss");
    dateAxis.periodChangeDateFormats.setKey("second", "HH:mm:ss");
    dateAxis.renderer.labels.template.rotation = 0;  // no rotation for straight labels
    dateAxis.renderer.labels.template.dy = 20;     // vertical offset for better spacing
    dateAxis.renderer.inside = false;
    dateAxis.min = new Date("2025-10-15T17:30:00").getTime();
    dateAxis.max = new Date("2025-10-15T17:31:20").getTime();

    // Align labels straight along the line (no slant)
    dateAxis.renderer.labels.template.location = 0;

    let series = chart.series.push(new am4plugins_timeline.CurveColumnSeries());
    series.columns.template.height = am4core.percent(600); // thick curves
    series.dataFields.openDateX = "start";
    series.dataFields.dateX = "end";
    series.dataFields.categoryY = "category";
    series.columns.template.propertyFields.fill = "color";
    series.columns.template.propertyFields.stroke = "color";
    series.columns.template.strokeWidth = 3;
    series.columns.template.tooltipText = "{category}\n{start} - {end}";
    series.columns.template.cornerRadiusTopLeft = 8;
    series.columns.template.cornerRadiusTopRight = 8;

    let textBullet = series.bullets.push(new am4charts.LabelBullet());
    textBullet.label.text = "{text}";
    textBullet.label.fill = am4core.color("#00264d");
    textBullet.label.fontSize = 12;
    textBullet.dy = -18;
    textBullet.label.background.fill = am4core.color("rgba(255,255,255,0.8)");
    textBullet.label.padding(5, 5, 5, 5);

    chart.scrollbarX = new am4core.Scrollbar();
    chart.scrollbarX.marginBottom = 24;

    chart.paddingBottom = 20;

    return () => chart && chart.dispose();
  }, []);

  return <div ref={chartRef} style={{ width: "100%", height: 480 }} />;
};

const CycleTimeSnackChart = () => (
  <div className="cycle-time-container">
    <Card
      title="Cycle Time Analysis"
      headStyle={{
        backgroundColor: "#00264d",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
      }}
      bodyStyle={{ padding: 22 }}
      bordered={false}
      style={{ maxWidth: 1320, margin: "0 auto" }}
    >
      <SerpentineTimelineChart />
    </Card>
  </div>
);

export default CycleTimeSnackChart;
