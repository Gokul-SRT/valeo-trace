import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  DatePicker,
  Button,
  Select,
  Table,
  Input,
  Checkbox,
} from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

// Map checklist items from the image for Greasing Fixture
const checklistByTool = {
  "Greasing Fixture": [
    { key: 1, SNo: "1", Characteristics: "CHECK THE GREASING PIN DIA (#20)", Spec: "Ø10.5 ± 0.10 mm", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 2, SNo: "2", Characteristics: "TOP TOOL CAM/CAM BASE MOVEMENT CHECKED", Spec: "VISUAL / PHYSICAL", Tools: "-", Observed: "-", checked: false },
    { key: 3, SNo: "3", Characteristics: "CHECK THE TOP TOOL CAM SPRING LENGTH", Spec: "51 ± 0.50 mm", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 4, SNo: "4", Characteristics: "CHECK THE TOP TOOL MECHANICAL STOPPER HEIGHT", Spec: "40.0 ± 0.20 mm", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 5, SNo: "5", Characteristics: "CHECK THE TOP TOOL SUPPORTING STOPPER LENGTH", Spec: "38.0 ± 0.05 mm", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 6, SNo: "6", Characteristics: "CHECK THE BOTTOM TOOL COVER LOCATION PIN DIA-1", Spec: "Ø4.6 ± 0.10 mm", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 7, SNo: "7", Characteristics: "CHECK THE BOTTOM TOOL COVER LOCATION PIN DIA-2", Spec: "Ø7.0 ± 0.10 mm", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 8, SNo: "8", Characteristics: "CHECK THE BOTTOM TOOL MECHANICAL STOPPER HEIGHT", Spec: "20.5 ± 0.50 mm", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 9, SNo: "9", Characteristics: "EVERY 100000 NOS STROKE SPRING CONDITION TO BE CHECK (832-102)", Spec: "832-102", Tools: "VERNIER", Observed: "-", checked: false },
    { key: 10, SNo: "10", Characteristics: "ENSURE ALL THE SCREW HOLE MARKING TO BE DONE AFTER TIGHTENING THE SCREWS", Spec: "VISUAL", Tools: "MARKER", Observed: "-", checked: false },
  ],
  // Extend mapping for other tools if you want dynamic PM checklist per tool
};

// Operation mapping by tool desc
const toolOperationMap = {
  "Greasing Fixture": "Greasing & Finger Folding Tool Stage",
  // Add any other tool desc mappings here as needed
};

// PM Qty mapping by tool desc
const toolPMQtyMap = {
  "Greasing Fixture": "100000",
  // Add any other tool desc qtys here as needed
};

const PreventiveMaintenanceCheckList = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [showDetails, setShowDetails] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  // Add Checklist dynamic states
  const [addChecklistTool, setAddChecklistTool] = useState("");
  const [operation, setOperation] = useState("");
  const [pmQty, setPmQty] = useState("");
  const [addChecklistData, setAddChecklistData] = useState([]);

  // Table sources
  const dataSource = [
    { key: 1, SNo: "1", Line: "Cover Assembly", Date: "05-Oct-2025", Customer: "Maruti", Modal: "Z12E" , operation: "Greasing & Finger Folding Tool Stage", pmQty: "100000"},
    { key: 2, SNo: "2", Line: "Cover Assembly", Date: "02-Oct-2025", Customer: "Maruti", Modal: "Z12E", operation: "Greasing & Finger Folding Tool Stage", pmQty: "100000" },
    { key: 3, SNo: "3", Line: "Cover Assembly", Date: "28-Sep-2025", Customer: "Maruti", Modal: "Z12E", operation: "Greasing & Finger Folding Tool Stage", pmQty: "100000" },
    { key: 4, SNo: "4", Line: "Cover Assembly", Date: "25-Sep-2025", Customer: "Maruti", Modal: "Z12E", operation: "Greasing & Finger Folding Tool Stage", pmQty: "100000" },
    { key: 5, SNo: "5", Line: "Disc Assembly - 1", Date: "20-Sep-2025", Customer: "Maruti", Modal: "YTE", operation: "Greasing & Finger Folding Tool Stage", pmQty: "100000" },
  ];

  const columns = [
    { title: "S.No", dataIndex: "SNo", key: "SNo" },
    { title: "Line", dataIndex: "Line", key: "Line" },
    { title: "Operation", dataIndex: "operation", key: "operation" },
    { title: "Date", dataIndex: "Date", key: "Date" },
    { title: "Customer", dataIndex: "Customer", key: "Customer" },
    { title: "Modal", dataIndex: "Modal", key: "Modal" },
  ];

  const addChecklistColumns = [
    { title: "S.No", dataIndex: "SNo", key: "SNo" },
    { title: "CHARACTERISTICS", dataIndex: "Characteristics", key: "Characteristics" },
    { title: "SPEC/UNIT", dataIndex: "Spec", key: "Spec" },
    { title: "Measurement Tools", dataIndex: "Tools", key: "Tools" },
    {
      title: "OBSERVED READING",
      dataIndex: "Observed",
      key: "Observed",
      render: () => <Input placeholder="Enter observed reading" />,
    },
    {
      title: "OK/NOT OK",
      dataIndex: "OkNotOk",
      key: "OkNotOk",
      render: (_, record) => (
        <Checkbox
          checked={record.checked}
          onChange={(e) => handleCheckboxChange(record.key, e.target.checked)}
        />
      ),
    },
    {
      title: "REMARKS & REPLACED",
      dataIndex: "Remarks",
      key: "Remarks",
      render: () => <Input placeholder="Enter remarks" />,
    },
  ];

  const handleCheckboxChange = (key, checked) => {
    setAddChecklistData(prev =>
      prev.map(item => item.key === key ? { ...item, checked } : item)
    );
  };

  const handleSubmit = (values) => {
    setSelectedTool(values.toolId);
    setSelectedYear(values.year.format("YYYY"));
    setShowDetails(true);
    setShowAddChecklist(false);
  };

  const handleCancel = () => {
    form.resetFields();
    setShowDetails(false);
    setShowAddChecklist(false);
  };

  const handleAddChecklist = () => {
    setShowAddChecklist(true);
    setShowDetails(false);
    // If previously selected tool present, keep that for Add Checklist
    if (selectedTool) {
      setAddChecklistTool(selectedTool);
      const op = toolOperationMap[selectedTool] || "";
      const qty = toolPMQtyMap[selectedTool] || "";
      setOperation(op);
      setPmQty(qty);
      setAddChecklistData(checklistByTool[selectedTool] || []);

      addForm.setFieldsValue({
        toolId: selectedTool,
        operation: op,
        pmQty: qty,
      });
    } else {
      setAddChecklistTool("");
      setOperation("");
      setPmQty("");
      setAddChecklistData([]);
      addForm.resetFields();
    }
  };

  // When tool desc changes in "Add Checklist" form
  const handleAddChecklistToolChange = (value) => {
    setAddChecklistTool(value);

    const op = toolOperationMap[value] || "";
    const qty = toolPMQtyMap[value] || "";
    setOperation(op);
    setPmQty(qty);
    setAddChecklistData(checklistByTool[value] || []);

    addForm.setFieldsValue({
      operation: op,
      pmQty: qty,
    });
  };

  // Chart tool data sample
  const chartData = [
    { toolName: "Greasing Fixture", maxUsage: 100000, usedUsage: 60000 },
    { toolName: "1st Top Tool", maxUsage: 90000, usedUsage: 70000 },
    { toolName: "1st Bottom Tool", maxUsage: 120000, usedUsage: 80000 },
    { toolName: "2nd Top Tool", maxUsage: 80000, usedUsage: 50000 },
    { toolName: "2nd Bottom Tool", maxUsage: 110000, usedUsage: 85000 },
    { toolName: "3rd Top Tool", maxUsage: 95000, usedUsage: 75000 },
    { toolName: "3rd Bottom Tool", maxUsage: 105000, usedUsage: 65000 },
    { toolName: "Balancing Fixture", maxUsage: 115000, usedUsage: 95000 },
    // ...rest
  ];

  // Ensure checklist is correct if you open Add Checklist directly
  useEffect(() => {
    if (showAddChecklist && addChecklistTool) {
      setOperation(toolOperationMap[addChecklistTool] || "");
      setPmQty(toolPMQtyMap[addChecklistTool] || "");
      setAddChecklistData(checklistByTool[addChecklistTool] || []);

      addForm.setFieldsValue({
        toolId: addChecklistTool,
        operation: toolOperationMap[addChecklistTool] || "",
        pmQty: toolPMQtyMap[addChecklistTool] || "",
      });
    }
  }, [showAddChecklist, addChecklistTool, addForm]);

  return (
    <>
      {/* PM Checklist Search Card */}
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        title="PM Checklist"
        extra={
          <PlusCircleOutlined
            style={{ fontSize: "20px", color: "white", cursor: "pointer" }}
            onClick={handleAddChecklist}
          />
        }
        style={{ marginTop: "20px", borderRadius: "8px" }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item
                label="Tool Desc"
                name="toolId"
                rules={[{ required: true, message: "Please select Tool Desc" }]}
              >
                <Select placeholder="Select Tool Desc">
                  {chartData.map((tool) => (
                    <Option key={tool.toolName} value={tool.toolName}>
                      {tool.toolName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Year"
                name="year"
                initialValue={dayjs()}
                rules={[{ required: true, message: "Please select Year" }]}
              >
                <DatePicker picker="year" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Button type="primary" htmlType="submit" style={{ marginRight: "10px", backgroundColor: "#00264d", borderColor: "#00264d" }}>
              Submit
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>
        </Form>
      </Card>

      {/* PM Checklist Details Card */}
      {showDetails && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title={
            <span>
              PM Checklist Details{" "}
              {selectedTool && selectedYear && (
                <span style={{ fontSize: "14px", fontWeight: "normal" }}>
                  — Tool Desc: <b>{selectedTool}</b> | Year: <b>{selectedYear} </b>
                </span>
              )}
            </span>
          }
          style={{ marginTop: "20px", borderRadius: "8px" }}
        >
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={{ pageSize: 5 }}
            bordered
            locale={{ emptyText: "No data available in table" }}
          />
        </Card>
      )}

      {/* Add Checklist PM Card */}
      {showAddChecklist && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title="Add PM Checklist"
          style={{ marginTop: "20px", borderRadius: "8px" }}
        >
          <Form form={addForm} layout="vertical">
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Tool Desc" name="toolId">
                  <Select
                    placeholder="Select Tool Desc"
                    value={addChecklistTool}
                    onChange={handleAddChecklistToolChange}
                  >
                    {chartData.map((tool) => (
                      <Option key={tool.toolName} value={tool.toolName}>
                        {tool.toolName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Operation" name="operation">
                  <Input value={operation} readOnly />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="PM Qty" name="pmQty">
                  <Input value={pmQty} disabled />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Preventive Qty" name="preventiveQty">
                  <Input defaultValue="45000" />
                </Form.Item>
              </Col>
            </Row>

            <Table
              dataSource={addChecklistData}
              columns={addChecklistColumns}
              pagination={{ pageSize: 10 }}
              bordered
              style={{ marginTop: "10px" }}
            />
          </Form>
          
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Button type="primary" htmlType="submit" style={{ marginRight: "10px", backgroundColor: "#00264d", borderColor: "#00264d" }}>
              Submit
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>

        </Card>
      )}
    </>
  );
};

export default PreventiveMaintenanceCheckList;
