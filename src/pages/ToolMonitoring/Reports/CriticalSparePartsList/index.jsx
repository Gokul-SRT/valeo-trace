import React, { useState } from "react";
import {
  Card,
  Form,
  Select,
  Row,
  Col,
  Button,
  DatePicker,
  Input,
} from "antd";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

const chartData = [
  { toolName: "Greasing Fixture", maxUsage: 100000, usedUsage: 60000 },
  { toolName: "1st Top Tool", maxUsage: 90000, usedUsage: 70000 },
  { toolName: "1st Bottom Tool", maxUsage: 120000, usedUsage: 80000 },
  { toolName: "2nd Top Tool", maxUsage: 80000, usedUsage: 50000 },
  { toolName: "2nd Bottom Tool", maxUsage: 110000, usedUsage: 85000 },
];

const criticalSparesList = [
  { critical: "Locating pin" },
  { critical: "Cover Locating Pin" },
  { critical: "POKA-YOKE BUSH" },
  { critical: "Hook Rivet Guide pin" },
  { critical: "Hook Rivet Guide pin spring" },
  { critical: "Hook Rivet Punch with MAGNET" },
  { critical: "Delta Rivet Holder" },
  { critical: "DSP Loader" },
  { critical: "Bottom stopper" },
  { critical: "Top Punch 80.0 mm" },
  { critical: "Top Punch 80.30 mm" },
  { critical: "Top Load Spring" },
  { critical: "TOP Punch Base Plate" },
  { critical: "Top Tool Holder Spring" },
  { critical: "Cover Plate Holder Bush" },
  { critical: "Hook Rivet Plate" },
  { critical: "DSP Locator Pin" },
  { critical: "DSP Holder pin spring" },
  { critical: "Drive Strap Pin" },
  { critical: "Bottom Punch Spacer" },
];

const dataSource = [
  {
    key: 1,
    line: "Cover Assembly",
    toolDescription: "Greasing Fixture",
    monthYear: "09-Oct-2025",
  },
  {
    key: 2,
    line: "Cover Assembly",
    toolDescription: "Greasing Fixture",
    monthYear: "12-Oct-2025",
  },
];

const CriticalSparePartsList = () => {
  const [form] = Form.useForm();
  const [showDetails, setShowDetails] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardData, setAddCardData] = useState([]);

  const handleSubmit = () => {
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
      const tableData = criticalSparesList.map((item, index) => ({
        key: index + 1,
        toolDescription: allValues.toolId,
        criticalSpares: item.critical,
        minQty: Math.floor(Math.random() * 8) + 3,
        availableQty: "",
        storageRack: "",
        needToOrder: "",
        totalAvailable: "",
      }));
      setAddCardData(tableData);
    } else {
      setAddCardData([]);
    }
  };

  const handleAddCardEdit = (params) => {
    const updated = [...addCardData];
    const index = updated.findIndex((row) => row.key === params.data.key);
    if (index > -1) {
      updated[index] = { ...params.data };
      setAddCardData(updated);
    }
  };

  const addCardColumns = [
    { headerName: "S.No", field: "key", width: 80 },
    { headerName: "Tool Description", field: "toolDescription", width: 180 },
    { headerName: "Critical Spares", field: "criticalSpares", width: 200 },
    {
      headerName: "Min Qty",
      field: "minQty",
      width: 120,
      editable: false,
      cellStyle: { textAlign: "center", fontWeight: "bold" },
    },
    {
      headerName: "Available Qty",
      field: "availableQty",
      width: 150,
      cellRenderer: (params) => (
        <Input
          type="number"
          value={params.value || ""}
          onChange={(e) => {
            params.data.availableQty = e.target.value;
            handleAddCardEdit(params);
          }}
        />
      ),
    },
    {
      headerName: "Storage Rack",
      field: "storageRack",
      width: 150,
      cellRenderer: (params) => (
        <Input
          value={params.value || ""}
          onChange={(e) => {
            params.data.storageRack = e.target.value;
            handleAddCardEdit(params);
          }}
        />
      ),
    },
    {
      headerName: "Need to Order",
      field: "needToOrder",
      width: 150,
      cellRenderer: (params) => (
        <Input
          type="number"
          value={params.value || ""}
          onChange={(e) => {
            params.data.needToOrder = e.target.value;
            handleAddCardEdit(params);
          }}
        />
      ),
    },
    {
      headerName: "Total Available",
      field: "totalAvailable",
      width: 150,
      cellRenderer: (params) => (
        <Input
          type="number"
          value={params.value || ""}
          onChange={(e) => {
            params.data.totalAvailable = e.target.value;
            handleAddCardEdit(params);
          }}
        />
      ),
    },
  ];

  // ✅ FIXED: Use flex instead of fixed width
  const detailsColumns = [
    { headerName: "S.No", field: "key", flex: 1 },
    { headerName: "Line", field: "line", flex: 2 },
    { headerName: "Tool Description", field: "toolDescription", flex: 3 },
    { headerName: "Month Year", field: "monthYear", flex: 2 },
  ];

  return (
    <>
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title="Critical Spare Parts List"
        extra={
          <PlusOutlined
            style={{ fontSize: 18, color: "white", cursor: "pointer" }}
            onClick={handleAddClick}
          />
        }
        style={{ marginTop: 20, borderRadius: 8 }}
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
                  <Option value="Cover Assembly">Cover Assembly</Option>
                  <Option value="Disc Assembly - 1">Disc Assembly - 1</Option>
                  <Option value="Disc Assembly - 2">Disc Assembly - 2</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Tool Desc"
                name="toolId"
                rules={[{ required: true, message: "Please select Tool" }]}
              >
                <Select placeholder="Select Tool Desc">
                  {chartData.map((tool, index) => (
                    <Option key={index} value={tool.toolName}>
                      {tool.toolName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label="Month/Year"
                name="monthYear"
                initialValue={dayjs()}
                rules={[{ required: true, message: "Select Month/Year" }]}
              >
                <DatePicker
                  picker="month"
                  format="MMM-YYYY"
                  placeholder="Select Month/Year"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                marginRight: 10,
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

      {/* ✅ FIXED TABLE WIDTH ISSUE HERE */}
      {showDetails && (
        <Card
          title="Critical Spare Parts Details"
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
            <AgGridReact
              rowData={dataSource}
              columnDefs={detailsColumns}
              domLayout="autoHeight"
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
            />
          </div>
        </Card>
      )}

      {showAddCard && (
        <Card
          title="Add Critical Spare Parts Details"
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <Form layout="vertical" onValuesChange={handleAddFormChange}>
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Line" name="line">
                  <Select placeholder="Select Line">
                    <Option value="Cover Assembly">Cover Assembly</Option>
                    <Option value="Disc Assembly - 1">Disc Assembly - 1</Option>
                    <Option value="Disc Assembly - 2">Disc Assembly - 2</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Tool Desc" name="toolId">
                  <Select placeholder="Select Tool Desc">
                    {chartData.map((tool, index) => (
                      <Option key={index} value={tool.toolName}>
                        {tool.toolName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Date" name="monthYear">
                  <DatePicker
                    format="YYYY-MM-DD"
                    placeholder="Select Date"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div
              className="ag-theme-alpine"
              style={{ height: 400, width: "100%", marginTop: 20 }}
            >
              <AgGridReact
                rowData={addCardData}
                columnDefs={addCardColumns}
                defaultColDef={{ resizable: true }}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Button
                type="primary"
                style={{
                  marginRight: 10,
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
      )}
    </>
  );
};

export default CriticalSparePartsList;
