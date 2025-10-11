import React, { useState } from "react";
import { Card, Form, Select, Row, Col, Button, DatePicker, Table } from "antd";
import dayjs from "dayjs";

const { Option } = Select;

const ToolHistoryLog = () => {
  const [form] = Form.useForm();
  const [showDetails, setShowDetails] = useState(false);

  // 🔹 Sample data for Tool History Log Details table
  const dataSource = [
    {
      key: 1,
      date: "05-Oct-2025",
      componentProduced: "Clutch Plate Assembly - A2",
      defects: "Minor scratches observed",
      rectification: "Polished surface",
      rectifiedBy: "John T/M",
      engineerSign: "A. Kumar / 05-Oct-2025",
    },
    {
      key: 2,
      date: "02-Oct-2025",
      componentProduced: "Pressure Plate - B2",
      defects: "Misalignment issue",
      rectification: "Re-aligned tooling",
      rectifiedBy: "Ravi T/M",
      engineerSign: "S. Mehta / 02-Oct-2025",
    },
    {
      key: 3,
      date: "28-Sep-2025",
      componentProduced: "Flywheel Housing - C2",
      defects: "Tool wear",
      rectification: "Replaced insert",
      rectifiedBy: "Kumar T/M",
      engineerSign: "P. Singh / 28-Sep-2025",
    },
    {
      key: 4,
      date: "25-Sep-2025",
      componentProduced: "Disc Assy - D1",
      defects: "Slight misalignment",
      rectification: "Adjusted jig",
      rectifiedBy: "Vinoth T/M",
      engineerSign: "R. Sharma / 25-Sep-2025",
    },
  ];

  // 🔹 Table columns
  const columns = [
    { title: "Date", dataIndex: "date", key: "date" },
    {
      title: "Component produced in the last run",
      dataIndex: "componentProduced",
      key: "componentProduced",
    },
    { title: "Defects noticed", dataIndex: "defects", key: "defects" },
    { title: "Rectification Done", dataIndex: "rectification", key: "rectification" },
    { title: "Rectified By T/M", dataIndex: "rectifiedBy", key: "rectifiedBy" },
    { title: "T/M.ENGINEER SIGN/DATE", dataIndex: "engineerSign", key: "engineerSign" },
  ];

  // 🔹 Common pagination config (used in both cards)
  const paginationConfig = {
    pageSize: 2,
    showSizeChanger: true,
  };

  // 🔹 Handlers
  const handleSubmit = (values) => {
    console.log("Form values:", values);
    setShowDetails(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setShowDetails(false);
  };

  return (
    <>
      {/* 🔸 Tool History Search Card */}
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title="Tool History Search Card"
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

      {/* Tool History Log Details Card */}
      {showDetails && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title="Tool History Log Details"
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
    </>
  );
};

export default ToolHistoryLog;
