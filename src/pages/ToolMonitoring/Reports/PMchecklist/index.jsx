import React, { useState } from "react";
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

const PreventiveMaintenanceCheckList = () => {
  const [form] = Form.useForm();
  const [showDetails, setShowDetails] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);

  // PM Checklist Details data
  const dataSource = [
    {
      key: 1,
      SNo: "1",
      Line: "Clutch Plate Assembly - A2",
      Date: "05-Oct-2025",
      Customer: "John T/M",
      Modal: "M1",
    },
    {
      key: 2,
      SNo: "2",
      Line: "Pressure Plate - B2",
      Date: "02-Oct-2025",
      Customer: "Ravi T/M",
      Modal: "M2",
    },
    {
      key: 3,
      SNo: "3",
      Line: "Flywheel Housing - C2",
      Date: "28-Sep-2025",
      Customer: "Kumar T/M",
      Modal: "M3",
    },
    {
      key: 4,
      SNo: "4",
      Line: "Disc Assy - D1",
      Date: "25-Sep-2025",
      Customer: "Vinoth T/M",
      Modal: "M4",
    },
    {
      key: 5,
      SNo: "5",
      Line: "Gearbox Cover - E3",
      Date: "20-Sep-2025",
      Customer: "S. Mehta",
      Modal: "M5",
    },
  ];

  const columns = [
    { title: "S.No", dataIndex: "SNo", key: "SNo" },
    { title: "Line", dataIndex: "Line", key: "Line" },
    { title: "Date", dataIndex: "Date", key: "Date" },
    { title: "Customer", dataIndex: "Customer", key: "Customer" },
    { title: "Modal", dataIndex: "Modal", key: "Modal" },
  ];

  // State for Add Checklist PM data
  const [addChecklistData, setAddChecklistData] = useState([
    {
      key: 1,
      SNo: "1",
      Characteristics: "Dimension Check",
      Spec: "±0.02mm",
      Tools: "Vernier Caliper",
      Observed: "0.01mm",
      checked: true,
    },
    {
      key: 2,
      SNo: "2",
      Characteristics: "Surface Finish",
      Spec: "Ra < 1.6",
      Tools: "Surface Tester",
      Observed: "1.4",
      checked: true,
    },
    {
      key: 3,
      SNo: "3",
      Characteristics: "Flatness",
      Spec: "< 0.05mm",
      Tools: "Dial Gauge",
      Observed: "0.07",
      checked: false,
    },
    {
      key: 4,
      SNo: "4",
      Characteristics: "Concentricity",
      Spec: "≤ 0.03mm",
      Tools: "CMM",
      Observed: "0.02",
      checked: true,
    },
    {
      key: 5,
      SNo: "5",
      Characteristics: "Burr Check",
      Spec: "None",
      Tools: "Visual",
      Observed: "-",
      checked: false,
    },
  ]);

  // Columns for Add Checklist PM table
  const addChecklistColumns = [
    { title: "S.No", dataIndex: "SNo", key: "SNo" },
    { title: "CHARACTERISTICS", dataIndex: "Characteristics", key: "Characteristics" },
    { title: "SPEC/UNIT", dataIndex: "Spec", key: "Spec" },
    { title: "Measurement Tools", dataIndex: "Tools", key: "Tools" },
    { title: "OBSERVED READING", dataIndex: "Observed", key: "Observed" },
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

  // Toggle checkbox handler
  const handleCheckboxChange = (key, checked) => {
    const updatedData = addChecklistData.map((item) =>
      item.key === key ? { ...item, checked } : item
    );
    setAddChecklistData(updatedData);
  };

  const handleSubmit = (values) => {
    console.log("Form Values:", values);
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
  };

  return (
    <>
      {/* PM Checklist Search Card */}
      <Card
        headStyle={{
          backgroundColor: "#00264d",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        title="PM Checklist"
        extra={
          <PlusCircleOutlined
            data-icon="plus-circle"
            style={{ fontSize: "20px", color: "white", cursor: "pointer" }}
            onClick={handleAddChecklist}
          />
        }
        style={{ marginTop: "20px", borderRadius: "8px" }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            {/* Tool ID Dropdown */}
            <Col span={4}>
              <Form.Item
                label="Tool ID"
                name="toolId"
                rules={[{ required: true, message: "Please select Tool ID" }]}
              >
                <Select placeholder="Select Tool ID">
                  <Option value="D001">D001</Option>
                  <Option value="D002">D002</Option>
                  <Option value="D003">D003</Option>
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
                <DatePicker picker="year" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          {/* Submit & Cancel Buttons */}
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

      {/* PM Checklist Details Card */}
      {showDetails && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title="PM Checklist Details"
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
          title="Add Checklist PM"
          style={{ marginTop: "20px", borderRadius: "8px" }}
        >
          <Form layout="vertical">
            <Row gutter={16}>
              {/* Line Dropdown */}
              <Col span={4}>
                <Form.Item label="Line" name="line">
                  <Select placeholder="Select Line">
                    <Option value="A2">A2</Option>
                    <Option value="B2">B2</Option>
                    <Option value="C2">C2</Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* Tool ID Dropdown */}
              <Col span={4}>
                <Form.Item label="Tool ID" name="toolId">
                  <Select placeholder="Select Tool ID">
                    <Option value="D001">D001</Option>
                    <Option value="D002">D002</Option>
                    <Option value="D003">D003</Option>
                  </Select>
                </Form.Item>
              </Col>

              {/* PM Qty (Disabled) */}
              <Col span={4}>
                <Form.Item label="PM Qty" name="pmQty" initialValue="100000">
                  <Input disabled />
                </Form.Item>
              </Col>

              {/* Preventive Qty */}
              <Col span={4}>
                <Form.Item label="Preventive Qty" name="preventiveQty">
                  <Input defaultValue="45000" />
                </Form.Item>
              </Col>
            </Row>

            {/* Table under fields */}
            <Table
              dataSource={addChecklistData}
              columns={addChecklistColumns}
              pagination={{ pageSize: 5}}
              bordered
              style={{ marginTop: "10px" }}
            />
          </Form>
        </Card>
      )}
    </>
  );
};

export default PreventiveMaintenanceCheckList;
