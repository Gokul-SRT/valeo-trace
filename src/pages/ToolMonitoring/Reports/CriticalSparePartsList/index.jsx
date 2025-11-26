import React, { useState, useEffect } from "react";
import { Card, Form, Select, Row, Col, Button, DatePicker, Input } from "antd";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import CommonserverApi from "../../../../CommonserverApi";
import { backendService } from "../../../../service/ToolServerApi";
// import "./style.css";

const { Option } = Select;

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
  const [addForm] = Form.useForm();

  const [showDetails, setShowDetails] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardData, setAddCardData] = useState([]);
  const [detailsData, setDetailsData] = useState([]);

  // ✅ MAIN DROPDOWNS
  const [lineList, setLineList] = useState([]);
  const [toolList, setToolList] = useState([]);

  // ✅ ADD CARD DROPDOWNS
  const [addLineList, setAddLineList] = useState([]);
  const [addToolList, setAddToolList] = useState([]);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));

  // ================= LINE DROPDOWN FETCH =================
  const fetchLineDropdown = async () => {
    try {
      const payload = {
        isActive: "1",
        tenantId,
        branchCode,
      };

      const res = await CommonserverApi.post("getCommonMstdtl", payload);
      const rawData = Array.isArray(res?.data)
        ? res.data
        : res?.data?.responseData || [];

      const formatted = rawData.map((item) => ({
        label: item.lineMstDesc,
        value: item.lineMstCode,
      }));

      setLineList(formatted);
      setAddLineList(formatted);
    } catch (err) {
      toast.error("Failed to load Line dropdown");
    }
  };

  useEffect(() => {
    fetchLineDropdown();
  }, []);

  // ================= MAIN LINE CHANGE =================
  const handleLineChange = async (lineCode) => {
    if (!lineCode) return;

    try {
      const payload = {
        lineCode,
        tenantId,
        branchCode,
        isActive: "1",
      };

      const res = await CommonserverApi.post("getToolByLineCode", payload);
      const rawData = Array.isArray(res?.data)
        ? res.data
        : res?.data?.responseData || [];

      const tools = rawData.map((tool) => ({
        label: tool.toolDesc,
        value: tool.toolNo,
      }));

      setToolList(tools);
      form.setFieldsValue({ toolId: undefined });
    } catch (err) {
      toast.error("Failed to load Tool dropdown");
    }
  };

  // ================= ADD CARD LINE CHANGE =================
  const handleAddLineChange = async (lineCode) => {
    if (!lineCode) return;

    try {
      const payload = {
        lineCode,
        tenantId,
        branchCode,
        isActive: "1",
      };

      const res = await CommonserverApi.post("getToolByLineCode", payload);
      const rawData = Array.isArray(res?.data)
        ? res.data
        : res?.data?.responseData || [];

      const tools = rawData.map((tool) => ({
        label: tool.toolDesc,
        value: tool.toolNo,
      }));

      setAddToolList(tools);
      addForm.setFieldsValue({ toolId: undefined });
    } catch (err) {
      toast.error("Failed to load Tool dropdown");
    }
  };

  // ================= FETCH CRITICAL SPARE DETAILS =================
  const fetchCriticalSpareDetails = async (lineCode) => {
    try {
      const payload = { line: lineCode, tenantId, branchCode };
      const res = await backendService({
        requestPath: "getcriticalsparedetailsbyline",
        requestData: payload,
      });

      console.log("API Response:", res); // Debug log
      
      // Handle different response structures
      const rawData = res?.data || res || [];
      console.log("Raw Data:", rawData); // Debug log

      if (Array.isArray(rawData) && rawData.length > 0) {
        // Group by operationDescription and create table data
        const groupedData = {};
        rawData.forEach((item) => {
          const opDesc = item.operationDescription;
          if (!groupedData[opDesc]) {
            groupedData[opDesc] = [];
          }
          groupedData[opDesc].push(item);
        });

        // Create table rows with proper S.NO numbering per operation
        let tableData = [];
        let globalKey = 1;

        Object.keys(groupedData).forEach((operationDesc) => {
          groupedData[operationDesc].forEach((item, index) => {
            tableData.push({
              key: globalKey++,
              sno: index + 1,
              toolDescription: operationDesc,
              criticalSpares: item.criticalSpareName,
              minQty: parseInt(item.minimumThresholdQuantity),
              spareLocation: "",
              availableQty: 0,
              needToOrder: 0,
              totalAvailable: 0,
              sparePartId: item.sparePartId,
            });
          });
        });

        console.log("Table Data:", tableData); // Debug log
        setAddCardData(tableData);
      } else {
        console.log("No data or empty array");
        setAddCardData([]);
      }
    } catch (err) {
      console.error("fetchCriticalSpareDetails error", err);
      setAddCardData([]);
    }
  };

  // ================= FETCH CRITICAL SPARE PART REPORT HEADER =================
  const fetchCriticalSparePartReportHdr = async (formValues) => {
    try {
      const payload = {
        tenantId,
        branchCode,
        lineCode: formValues.line,
        toolNo: formValues.toolId,
        monthYear: formValues.monthYear.format('MMM-YYYY'),
      };

      const res = await backendService({
        requestPath: "getcriticalsparepartreporthdr",
        requestData: payload,
      });

      const rawData = res?.data || res || [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        const formattedData = rawData.map((item, index) => ({
          key: index + 1,
          line: item.lineDescription,
          toolDescription: item.toolDescription,
          monthYear: item.createdDate,
        }));
        setDetailsData(formattedData);
      } else {
        setDetailsData([]);
      }
    } catch (err) {
      console.error("fetchCriticalSparePartReportHdr error", err);
      setDetailsData([]);
    }
  };

  // ================= FORM HANDLERS =================
  const handleSubmit = (values) => {
    fetchCriticalSparePartReportHdr(values);
    setShowDetails(true);
    setShowAddCard(false);
  };

  const handleCancel = () => {
    form.resetFields();
    addForm.resetFields();
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
      fetchCriticalSpareDetails(allValues.line);
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

  // ================= INPUT CHANGE HANDLERS =================
  const handleInputChange = (key, field, value) => {
    const updated = [...addCardData];
    const index = updated.findIndex((row) => row.key === key);
    if (index > -1) {
      updated[index][field] = value;
      
      // Auto-calculate total available
      if (field === 'availableQty' || field === 'needToOrder') {
        const availableQty = parseInt(updated[index].availableQty) || 0;
        const needToOrder = parseInt(updated[index].needToOrder) || 0;
        updated[index].totalAvailable = availableQty + needToOrder;
      }
      
      setAddCardData(updated);
    }
  };

  // ================= INSERT CRITICAL SPARE PART REPORT =================
  const insertCriticalSparePartReport = async () => {
    try {
      const formValues = addForm.getFieldsValue();
      
      // Prepare spare parts data
      const sparePartsData = addCardData.map(row => ({
        sparePartId: row.sparePartId,
        storageLocation: row.spareLocation || null,
        stockAvailable: parseInt(row.availableQty) || 0,
        needToOrder: parseInt(row.needToOrder) || 0,
        totalAvailable: parseInt(row.totalAvailable) || 0,
      }));

      const payload = {
        line: formValues.line,
        toolNo: formValues.toolId,
        tenantId,
        branchCode,
        sparePartsData,
      };

      const res = await backendService({
        requestPath: "insertcriticalsparepartreport",
        requestData: payload,
      });

      if (res === "SUCCESS" || res?.status === "SUCCESS") {
        toast.success("Critical spare part report inserted successfully");
        return true;
      } else {
        toast.error("Failed to insert critical spare part report");
        return false;
      }
    } catch (err) {
      console.error("insertCriticalSparePartReport error", err);
      toast.error("Failed to insert critical spare part report");
      return false;
    }
  };

  // ================= HANDLE ADD FORM SUBMIT =================
  const handleAddFormSubmit = async () => {
    try {
      const formValues = addForm.getFieldsValue();
      if (!formValues.line || !formValues.toolId) {
        toast.error("Please select Line and Tool");
        return;
      }

      const success = await insertCriticalSparePartReport();
      if (success) {
        toast.success(`${addCardData.length} records inserted successfully`);
        handleCancel();
      }
    } catch (err) {
      console.error("handleAddFormSubmit error", err);
      toast.error("Failed to submit form");
    }
  };

  const addCardColumns = [
    {
      headerName: "TOOL DESCRIPTION",
      field: "toolDescription",
      width: 180,
      rowSpan: (params) => {
        const value = params.value;
        const api = params.api;
        let span = 1;
        let rowIndex = params.node.rowIndex;

        while (
          api.getDisplayedRowAtIndex(rowIndex + span) &&
          api.getDisplayedRowAtIndex(rowIndex + span).data.toolDescription ===
            value
        ) {
          span++;
        }
        return span;
      },
      cellClass: (params) => {
        const api = params.api;
        const rowIndex = params.node.rowIndex;
        const prevRow = api.getDisplayedRowAtIndex(rowIndex - 1);

        if (prevRow && prevRow.data.toolDescription === params.value) {
          return "hide-cell";
        }
        return "merge-cell";
      },
      cellRenderer: (params) => {
        const api = params.api;
        const rowIndex = params.node.rowIndex;
        const value = params.value;

        let span = 1;
        while (
          api.getDisplayedRowAtIndex(rowIndex + span) &&
          api.getDisplayedRowAtIndex(rowIndex + span).data.toolDescription ===
            value
        ) {
          span++;
        }

        return <div className="tool-section-label">{value}</div>;
      },
    },
    {
      headerName: "S.NO",
      field: "sno",
      width: 80,
      cellRenderer: (params) => (params.data.isSection ? "" : params.value),
    },
    {
      headerName: "Critical spares",
      field: "criticalSpares",
      width: 220,
      cellRenderer: (params) =>
        params.data.isSection ? "" : <Input value={params.value} />,
    },
    {
      headerName: "Spare location",
      field: "spareLocation",
      width: 200,
      editable: true,
      cellEditor: 'agTextCellEditor',
    },
    {
      headerName: "Spares Min Qty in tool",
      field: "minQty",
      width: 180,
      cellRenderer: (params) =>
        params.data.isSection ? (
          ""
        ) : (
          <Input type="number" value={params.value} />
        ),
    },
    {
      headerName: "Spares stock Qty",
      field: "availableQty",
      width: 160,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
      },
    },
    {
      headerName: "Need to order",
      field: "needToOrder",
      width: 140,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
      },
    },
    {
      headerName: "TOTAL AVAILABLE",
      field: "totalAvailable",
      width: 160,
      cellRenderer: (params) =>
        params.data.isSection ? (
          ""
        ) : (
          <Input
            value={params.data.totalAvailable}
            readOnly
            style={{ backgroundColor: '#f5f5f5' }}
          />
        ),
    },
  ];

  const detailsColumns = [
    { headerName: "S.No", field: "key", flex: 1 },
    { headerName: "Line", field: "line", flex: 2 },
    { headerName: "Tool Description", field: "toolDescription", flex: 3 },
    { headerName: "Month Year", field: "monthYear", flex: 2 },
  ];

  return (
    <>
      {/* ================= MAIN CARD ================= */}
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
              <Form.Item label="Line" name="line" rules={[{ required: true }]}>
                <Select
                  placeholder="Select Line"
                  options={lineList}
                  onChange={handleLineChange}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item label="Tool Desc" name="toolId" rules={[{ required: true }]}>
                <Select
                  placeholder="Select Tool Desc"
                  options={toolList}
                  allowClear
                />
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

      {showDetails && (
        <Card
          title="Critical Spare Parts Details"
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <div
            className="ag-theme-alpine"
            style={{ height: 300, width: "100%" }}
          >
            <AgGridReact
              rowData={detailsData}
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

      {/* ================= ADD POPUP PAGE ================= */}
      {showAddCard && (
        <Card
          title="Add Critical Spare Parts Details"
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <Form layout="vertical" form={addForm} onValuesChange={handleAddFormChange}>
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Line" name="line" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select Line"
                    options={addLineList}
                    onChange={handleAddLineChange}
                    allowClear
                  />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="Tool Desc" name="toolId" rules={[{ required: true }]}>
                  <Select
                    placeholder="Select Tool Desc"
                    options={addToolList}
                    allowClear
                  />
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
                suppressRowTransform={true}
                domLayout="normal"
                getRowHeight={() => 48}
                enableCellSpan={true}
                onCellValueChanged={(params) => {
                  const updated = [...addCardData];
                  const index = updated.findIndex(row => row.key === params.data.key);
                  if (index > -1) {
                    updated[index][params.colDef.field] = params.newValue;
                    
                    // Auto-calculate total available
                    if (params.colDef.field === 'availableQty' || params.colDef.field === 'needToOrder') {
                      const availableQty = parseInt(updated[index].availableQty) || 0;
                      const needToOrder = parseInt(updated[index].needToOrder) || 0;
                      updated[index].totalAvailable = availableQty + needToOrder;
                    }
                    
                    setAddCardData(updated);
                  }
                }}
              />
            </div>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Button
                type="primary"
                onClick={handleAddFormSubmit}
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
