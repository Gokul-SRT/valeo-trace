import React, { useState } from "react";
import { Card, Form, Select, Row, Col, Button, DatePicker, Table, Input } from "antd";
import "antd/dist/reset.css";
import dayjs from "dayjs";
import { PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

const CriticalSparePartsList = () => {
  const [form] = Form.useForm();
  const [showDetails, setShowDetails] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardData, setAddCardData] = useState([]);

  // 🔹 Sample data for Critical Spare Parts List
  const dataSource = [
    { key: 1, toolId: "D001", toolDescription: "Spindle Assembly - L1", monthYear: "Oct-2025" },
    { key: 2, toolId: "D002", toolDescription: "Motor Coupling - L2", monthYear: "Oct-2025" },
    { key: 3, toolId: "D003", toolDescription: "Clutch Plate - L3", monthYear: "Sep-2025" },
    { key: 4, toolId: "D004", toolDescription: "Pressure Plate - L4", monthYear: "Sep-2025" },
  ];

  // 🔹 Columns for Critical Spare Parts List Table
  const columns = [
    { title: "S.No", dataIndex: "key", key: "key" },
    { title: "Tool ID", dataIndex: "toolId", key: "toolId" },
    { title: "Tool Description", dataIndex: "toolDescription", key: "toolDescription" },
    { title: "Month Year", dataIndex: "monthYear", key: "monthYear" },
  ];

  // 🔹 Columns for Add Critical Spare Parts Details Table
  const addCardColumns = [
    { title: "S.No", dataIndex: "key", key: "key" },
    { title: "Tool Description", dataIndex: "toolDescription", key: "toolDescription" },
    { title: "Critical Spares", dataIndex: "criticalSpares", key: "criticalSpares" },
    {
      title: "Spares Min Qty in tool",
      dataIndex: "minQty",
      key: "minQty",
      render: () => <Input placeholder="Enter Min Qty" />,
    },
    {
      title: "Spares Available Qty",
      dataIndex: "availableQty",
      key: "availableQty",
      render: () => <Input placeholder="Enter Available Qty" />,
    },
    {
      title: "Storage Rack",
      dataIndex: "storageRack",
      key: "storageRack",
      render: () => <Input placeholder="Enter Storage Rack" />,
    },
    {
      title: "Need to Order",
      dataIndex: "needToOrder",
      key: "needToOrder",
      render: () => <Input placeholder="Enter Need to Order" />,
    },
    {
      title: "Drawing is Available",
      dataIndex: "drawingAvailable",
      key: "drawingAvailable",
      render: () => <Input placeholder="Enter Drawing Availability" />,
    },
    {
      title: "Reorder Data Suppliers",
      dataIndex: "reorderSuppliers",
      key: "reorderSuppliers",
      render: () => <Input placeholder="Enter Supplier Info" />,
    },
    {
      title: "PO No/GRN No/Remarks",
      dataIndex: "poGrnRemarks",
      key: "poGrnRemarks",
      render: () => <Input placeholder="Enter PO/GRN/Remarks" />,
    },
    {
      title: "Received Date & Qty",
      dataIndex: "receivedDateQty",
      key: "receivedDateQty",
      render: () => <Input placeholder="Enter Received Date & Qty" />,
    },
    {
      title: "TOTAL Available",
      dataIndex: "totalAvailable",
      key: "totalAvailable",
      render: () => <Input placeholder="Enter Total Available" />,
    },
  ];

  // 🔹 Handlers
  const handleSubmit = (values) => {
    console.log("Form values:", values);
    setShowDetails(true);
    setShowAddCard(false);
  };

  const handleCancel = () => {
    form.resetFields();
    setShowDetails(false);
    setShowAddCard(false);
    setAddCardData([]);
  };

  const handleAddClick = () => {
    setShowAddCard(true);
    setShowDetails(false);
    setAddCardData([]);
  };

  const handleAddFormChange = (changedValues, allValues) => {
    if (allValues.line && allValues.toolId && allValues.monthYear) {
      // Combine Greasing + Station 1 in same table
      const combinedData = [
        { desc: "Greasing", critical: "Location pin" },
        { critical: "Cover Locating Pin" },
        { critical: "POKA-YOKE BUSH" },
        { desc: "Station 1", critical: "Top Load Spring" },
        { critical: "Top Punch Base Plate" },
      ];

      const tableData = combinedData.map((item, index) => ({
        key: index + 1,
        toolDescription: item.desc,
        criticalSpares: item.critical,
      }));

      setAddCardData(tableData);
    } else {
      setAddCardData([]);
    }
  };

  return (
    <>
      {/* Critical Spare Parts List Card */}
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title="Critical Spare Parts List"
        extra={
          <PlusOutlined
            style={{ fontSize: "18px", color: "white", cursor: "pointer" }}
            onClick={handleAddClick}
          />
        }
        style={{ marginTop: "20px", borderRadius: "8px" }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item
                label="Line"
                name="line"
                rules={[{ required: true, message: "Please select Line" }]}
              >
                <Select placeholder="Select Line">
                  <Option value="Line1">Line 1</Option>
                  <Option value="Line2">Line 2</Option>
                  <Option value="Line3">Line 3</Option>
                </Select>
              </Form.Item>
            </Col>

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

            <Col span={4}>
              <Form.Item
                label="Month/Year"
                name="monthYear"
                initialValue={dayjs()}
                rules={[{ required: true, message: "Please select Month/Year" }]}
              >
                <DatePicker
                  picker="month"
                  format="MMM-YYYY"
                  placeholder="Select Month/Year"
                  allowClear
                  style={{
                    width: "100%",
                    height: "34px",
                    borderRadius: "4px",
                    border: "1px solid #ced4da",
                    boxShadow: "none",
                    fontSize: "14px",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

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

      {/* Critical Spare Parts Details Table */}
      {showDetails && (
        <Card
          title="Critical Spare Parts Details"
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: "20px", borderRadius: "8px" }}
        >
          <Table
            dataSource={dataSource}
            columns={columns}
            pagination={{ pageSize: 5 }}
            bordered
          />
        </Card>
      )}

      {/* Add Critical Spare Parts Details */}
      {showAddCard && (
        <Card
          title="Add Critical Spare Parts Details"
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: "20px", borderRadius: "8px" }}
        >
          <Form layout="vertical" onValuesChange={handleAddFormChange}>
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Line" name="line">
                  <Select placeholder="Select Line">
                    <Option value="Line1">Line 1</Option>
                    <Option value="Line2">Line 2</Option>
                    <Option value="Line3">Line 3</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Tool ID" name="toolId">
                  <Select placeholder="Select Tool ID">
                    <Option value="D001">D001</Option>
                    <Option value="D002">D002</Option>
                    <Option value="D003">D003</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Month/Year" name="monthYear">
                  <DatePicker
                    picker="month"
                    format="MMM-YYYY"
                    placeholder="Select Month/Year"
                    allowClear
                    style={{
                      width: "100%",
                      height: "34px",
                      borderRadius: "4px",
                      border: "1px solid #ced4da",
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Table
            dataSource={addCardData}
            columns={addCardColumns}
            pagination={{ pageSize: 5 }}
            bordered
            style={{ marginTop: "20px" }}
            locale={{
              emptyText: "Please select Line, Tool ID, and Month/Year",
            }}
          />

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Button
              type="primary"
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
        </Card>
      )}
    </>
  );
};

export default CriticalSparePartsList;
