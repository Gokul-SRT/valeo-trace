import React, { useRef, useState } from "react";
import { Card, Form, Select, Row, Col, Button, DatePicker } from "antd";
import dayjs from "dayjs";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";

const { Option } = Select;

const ToolHistoryLog = () => {
  const [form] = Form.useForm();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const gridRef = useRef(null);

  // 🔹 Sample Tool List (can later come from API)
  const chartData = [
  { toolName: "Greasing Fixture", maxUsage: 100000, usedUsage: 60000 },
  { toolName: "1st Top Tool", maxUsage: 90000, usedUsage: 70000 },
  { toolName: "1st Bottom Tool", maxUsage: 120000, usedUsage: 80000 },
  { toolName: "2nd Top Tool", maxUsage: 80000, usedUsage: 50000 },
  { toolName: "2nd Bottom Tool", maxUsage: 110000, usedUsage: 85000 },
  { toolName: "3rd Top Tool", maxUsage: 95000, usedUsage: 75000 },
  { toolName: "3rd Bottom Tool", maxUsage: 105000, usedUsage: 65000 },
  { toolName: "Balancing Fixture", maxUsage: 115000, usedUsage: 95000 },
  { toolName: "Balancing Riveting Fixture", maxUsage: 100000, usedUsage: 80000 },
  { toolName: "Rebalancing Fixture", maxUsage: 90000, usedUsage: 60000 },
  { toolName: "R/o Depositor", maxUsage: 95000, usedUsage: 70000 },
  { toolName: "R/o Lever", maxUsage: 100000, usedUsage: 85000 },
  { toolName: "R/o Bunk", maxUsage: 120000, usedUsage: 95000 },
  { toolName: "R/o Probe", maxUsage: 110000, usedUsage: 70000 },
  { toolName: "R/o Po Plate", maxUsage: 95000, usedUsage: 80000 },
  { toolName: "EOL Bunk", maxUsage: 100000, usedUsage: 90000 },
  { toolName: "EOL Top Plate", maxUsage: 95000, usedUsage: 85000 },
  { toolName: "EOL Bottom Plate", maxUsage: 105000, usedUsage: 95000 },
  { toolName: "EOL Po Plate", maxUsage: 115000, usedUsage: 100000 },
  { toolName: "EOL Marking Fixture", maxUsage: 100000, usedUsage: 85000 },
];

// generate tool options dynamically from chartData
const toolOptions = chartData.map(item => item.toolName);

  // 🔹 Sample data for Tool History Log Details grid
const rowData = [
  {
    date: "16-Sep-2025",
    nosProduced: "73839",
    defects: "-",
    rectification: "Polished surface",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "19-Sep-2025",
    nosProduced: "76890",
    defects: "Minor burrs",
    rectification: "Deburred manually",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "22-Sep-2025",
    nosProduced: "79020",
    defects: "-",
    rectification: "Checked alignment",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "25-Sep-2025",
    nosProduced: "80339",
    defects: "-",
    rectification: "Replaced insert",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "28-Sep-2025",
    nosProduced: "81234",
    defects: "-",
    rectification: "Cleaned fixture",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "02-Oct-2025",
    nosProduced: "84560",
    defects: "Oil leakage",
    rectification: "Replaced seal",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "05-Oct-2025",
    nosProduced: "89040",
    defects: "-",
    rectification: "Checked lubrication system",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "07-Oct-2025",
    nosProduced: "90215",
    defects: "-",
    rectification: "Tightened clamping bolts",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "09-Oct-2025",
    nosProduced: "95049",
    defects: "-",
    rectification: "Re-aligned tooling",
    rectifiedBy: "Nagaraj T/M",
  },
  {
    date: "12-Oct-2025",
    nosProduced: "98773",
    defects: "Slight misalignment",
    rectification: "Adjusted jig",
    rectifiedBy: "Nagaraj T/M",
  },
];


  // 🔹 Grid column definitions with sorting & filtering
  const columnDefs = [
    {
      headerName: "Date",
      field: "date",
      flex: 1,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Components produced in the last run (in Nos.)",
      field: "nosProduced",
      flex: 2,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Defects noticed",
      field: "defects",
      flex: 2,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Rectification Done",
      field: "rectification",
      flex: 2,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Rectified By T/M",
      field: "rectifiedBy",
      flex: 1.5,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    // {
    //   headerName: "T/M.ENGINEER SIGN/DATE",
    //   field: "engineerSign",
    //   flex: 2,
    //   sortable: true,
    //   filter: "agTextColumnFilter",
    // },
  ];

  // 🔹 Form Submit Handler
  const handleSubmit = (values) => {
    const yearValue = values.year ? dayjs(values.year).format("YYYY") : null;
    setSelectedTool(values.toolId);
    setSelectedYear(yearValue);
    setShowDetails(true);
  };

  // 🔹 Cancel Handler
  const handleCancel = () => {
    form.resetFields();
    setShowDetails(false);
    setSelectedTool(null);
    setSelectedYear(null);
  };

  // 🔹 CSV Export
  const handleExport = () => {
    gridRef.current.api.exportDataAsCsv({
      fileName: `Tool_History_${selectedTool}_${selectedYear}.csv`,
    });
  };

  return (
    <>
      {/* 🔸 Tool History Search Card */}
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title="Tool History Card"
        style={{ marginTop: "20px", borderRadius: "8px" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: "10px" }}
        >
          <Row gutter={16}>
            {/* Tool ID Dropdown */}
            <Col span={4}>
              <Form.Item
                label="Tool Desc"
                name="toolId"
                rules={[{ required: true, message: "Please select Tool Desc." }]}
              >
                <Select placeholder="Select Tool Desc.">
                  {toolOptions.map((tool) => (
                    <Option key={tool} value={tool}>
                      {tool}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Year Picker */}
            <Col span={4}>
              <Form.Item
                label="Year"
                name="year"
                initialValue={dayjs()}
                rules={[{ required: true, message: "Please select Year" }]}
              >
                <DatePicker
                  picker="year"
                  style={{ width: "100%" }}
                  disabledDate={(current) =>
                    current && current > dayjs().endOf("year")
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                marginRight: "10px",
                backgroundColor: "#00264d",
                borderColor: "#00264d",
              }}
            >
              Submit
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>
        </Form>
      </Card>

      {/* 🔸 Tool History Log Details Card */}
      {showDetails && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title={
            <span>
              Tool History Log Details{" "}
              {selectedTool && selectedYear && (
                <span style={{ fontSize: "14px", fontWeight: "normal" }}>
                  — Tool Desc: <b>{selectedTool}</b> | Year: <b>{selectedYear}</b> | Customer: <b>Maruti</b>
                </span>
              )}
            </span>
          }
          style={{ marginTop: "30px", borderRadius: "8px" }}
        >
          {/* Export Button */}
          <div style={{ marginBottom: "10px", textAlign: "right" , display:'none' }}>
            <Button
              type="primary"
              onClick={handleExport}
              style={{
                backgroundColor: "#28a745",
                borderColor: "#28a745",
              }}
            >
              Export CSV
            </Button>
          </div>

          <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={10}
              suppressCellFocus={true}
              domLayout="autoHeight"
            />
          </div>
        </Card>
      )}
    </>
  );
};

export default ToolHistoryLog;
