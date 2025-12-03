import React, { useState, useEffect, useCallback } from "react";
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
} from "antd";
import { PlusCircleOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import store from "store";
import {
  backendService,
  commonBackendService,
} from "../../../../service/ToolServerApi";
import LineMstdropdown from "../../../../CommonDropdownServices/Service/LineMasterSerive";
import { AgGridReact } from "ag-grid-react";
import Loader from "../../../../Utills/Loader";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";


const { Option } = Select;

const PreventiveMaintenanceCheckList = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  const [showDetails, setShowDetails] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [showViewChecklist, setShowViewChecklist] = useState(false);

  // SEARCH CARD STATES
  const [selectedLineSearch, setSelectedLineSearch] = useState("getAll");
  const [selectedToolSearch, setSelectedToolSearch] = useState(null);
  const [productDataSearch, setProductDataSearch] = useState([]);
  const [toolDataSearch, setToolDataSearch] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ADD CHECKLIST CARD STATES
  const [selectedLineAdd, setSelectedLineAdd] = useState("getAll");
  const [selectedToolAdd, setSelectedToolAdd] = useState(null);
  const [productDataAdd, setProductDataAdd] = useState([]);
  const [toolDataAdd, setToolDataAdd] = useState([]);
  const [isEditable, setIsEditable] = useState(true);

  // Common
  const [lineData, setLineData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const [operation, setOperation] = useState("");
  const [operationId, setOperationId] = useState("");
  const [product, setProduct] = useState("");
  const [customer, setCustomer] = useState("");
  const [pmQty, setPmQty] = useState("");
  const [preventiveQty, setPreventiveQty] = useState(0);
  const [addChecklistData, setAddChecklistData] = useState([]);
  const [currentViewedRecordId, setCurrentViewedRecordId] = useState(null);

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");

  const columns = [
    { title: "S.No", dataIndex: "SNo", key: "SNo" },
    { title: "Line", dataIndex: "Line", key: "Line" },
    { title: "Tool", dataIndex: "Tool", key: "Tool" },
    { title: "Product", dataIndex: "Product", key: "Product" },
    { title: "Customer", dataIndex: "Customer", key: "Customer" },
    { title: "Date", dataIndex: "Date", key: "Date" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewChecklist(record)}>
          View
        </Button>
      ),
    },
  ];

  const addChecklistColumns = [
    { title: "S.No", dataIndex: "SNo", key: "SNo" },
    {
      title: "CHARACTERISTICS",
      dataIndex: "characteristicName",
      key: "characteristicName",
    },
    { title: "SPEC/UNIT", dataIndex: "specUnit", key: "specUnit" },
    {
      title: "Measurement Tools",
      dataIndex: "measurementType",
      key: "measurementType",
    },
    {
      title: "OBSERVED READING",
      dataIndex: "observed",
      key: "observed",
      render: (_, record) =>
        isEditable ? (
          <Input
            placeholder="Enter Observed Value"
            value={record.observed || ""}
            onChange={(e) =>
              setAddChecklistData((prev) =>
                prev.map((item) =>
                  item.key === record.key
                    ? { ...item, observed: e.target.value }
                    : item
                )
              )
            }
          />
        ) : (
          <span>{record.observed}</span>
        ),
    },
    {
      title: "OK / NOT OK",
      dataIndex: "okNotOk",
      key: "okNotOk",
      render: (_, record) =>
        isEditable ? (
          <Select
            placeholder="Select"
            style={{ width: 120 }}
            value={record.okNotOk}
            onChange={(value) =>
              setAddChecklistData((prev) =>
                prev.map((item) =>
                  item.key === record.key ? { ...item, okNotOk: value } : item
                )
              )
            }
            options={[
              { label: "OK", value: "OK" },
              { label: "NOT OK", value: "NOT OK" },
            ]}
          />
        ) : (
          <span>{record.okNotOk}</span>
        ),
    },
    {
      title: "REMARKS & REPLACED",
      dataIndex: "remarks",
      key: "remarks",
      render: (_, record) =>
        isEditable ? (
          <Input
            placeholder="Enter remarks"
            value={record.remarks || ""}
            onChange={(e) =>
              setAddChecklistData((prev) =>
                prev.map((item) =>
                  item.key === record.key
                    ? { ...item, remarks: e.target.value }
                    : item
                )
              )
            }
          />
        ) : (
          <span>{record.remarks}</span>
        ),
    },
  ];

  const handleSubmitSearch = async (values) => {
    setSelectedToolSearch(values.toolId);
    setSelectedYear(values.year.format("YYYY"));
    setShowDetails(true);
    setShowAddChecklist(false);
    setLoading(true);

    try {
      // Call API to get search results
      const response = await backendService({
        requestPath: "searchPMChecklist",
        requestData: {
          lineCode: values.lineId,
          modelId: product,
          customerId: customer,
          toolNo: values.toolId,
          year: values.year.format("YYYY"),
          tenantId,
          branchCode,
        },
      });
      if (response?.responseCode === "200") {
        setLoading(false);
        setSearchResults(
          response.responseData.map((item, index) => ({
            sno: index + 1,
            ...item,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error fetching search results", error);
      setSearchResults([]);
    }
  };

  const handleViewChecklist = async (record) => {
    try {
      setShowViewChecklist(true);
      setShowDetails(false);
      setCurrentViewedRecordId(record.logId); // Store the record ID for export

      const response = await backendService({
        requestPath: "getViewPMChecklistDtl",
        requestData: {
          hdrId: record.logId,
          tenantId,
          branchCode,
        },
      });

      if (response?.responseCode === "200") {
        const data = response.responseData;

        if (data.length > 0) {
          // Take the first object for header info
          const firstRecord = data[0];

          setSelectedLineAdd(firstRecord.lineMstDescription);
          addForm.setFieldsValue({
            lineId: firstRecord.lineMstDescription,
          });
          setSelectedToolAdd(firstRecord.toolDesc);
          setOperation(firstRecord.toolDesc); // If operation info exists, replace this
          setPmQty(firstRecord.pmQty);
          setPreventiveQty(firstRecord.preventiveQty);
          setProduct(firstRecord.productDescription);
          setCustomer(firstRecord.customerName);

          addForm.setFieldsValue({
            lineId: firstRecord.lineMstDescription,
            toolId: firstRecord.toolDesc,
            operation: firstRecord.toolDesc, // replace if different
            pmQty: firstRecord.pmQty,
            preventiveQty: firstRecord.preventiveQty,
            productId: firstRecord.productDescription,
            customer: firstRecord.customerName,
          });

          // Map checklist data
          const checklist = data.map((item, index) => ({
            key: index + 1,
            SNo: index + 1,
            characteristicId: item.characteristicId,
            characteristicName: item.characteristicName,
            toolPmLogId: item.toolPmLogId,
            specUnit: item.specUnit,
            measurementType: item.measurementType,
            observed: item.observedReadings,
            okNotOk: item.okNok,
            remarks: item.remarks,
          }));

          setAddChecklistData(checklist);

          // Editable only if current date
          const today = dayjs().format("YYYY-MM-DD");
          setIsEditable(dayjs(record.Date).format("YYYY-MM-DD") === today);
        }
      }
    } catch (error) {
      console.error("Error fetching checklist details", error);
    }
  };

  const handleAddChecklist = () => {
    setShowAddChecklist(true);
    setShowDetails(false);
    addForm.resetFields();
    setAddChecklistData([]);
    setOperation("");
    setPmQty("");
    setPreventiveQty(0);
    setIsEditable(true);
  };

  // existing product/tool dropdown functions remain unchanged

  const productDropDownDataSearch = async (toolNo) => {
    try {
      const response = await commonBackendService({
        requestPath: "getProductByTool",
        requestData: { toolNo, tenantId, branchCode },
      });
      if (response?.responseCode === "200") {
        setProductDataSearch(response.responseData);
        setProductDataAdd(response.responseData);
      }
    } catch (error) {
      setProductDataSearch([]);
      setProductDataAdd([]);
    }
  };

  const productDropDownDataAdd = async (toolNo) => {
    try {
      const toolResp = await commonBackendService({
        requestPath: "getToolOperationAndQty",
        requestData: { toolNo, tenantId, branchCode },
      });

      if (
        toolResp?.responseCode === "200" &&
        toolResp.responseData?.length > 0
      ) {
        const data = toolResp.responseData[0];

        setOperation(data.operation || "");
        setOperationId(data.operationId || "");
        setPmQty(data.pmQty || "");
        setPreventiveQty(data.preventiveQty || 0);

        addForm.setFieldsValue({
          operation: data.operation || "",
          pmQty: data.pmQty || "",
          preventiveQty: data.preventiveQty || 0,
        });

        if (data.operationId) {
          const charResp = await backendService({
            requestPath: "getPMCharacteristicList",
            requestData: {
              lineCode: selectedLineAdd,
              toolNo: toolNo,
              operation: data.operationId,
              tenantId,
              branchCode,
            },
          });

          if (charResp?.responseCode === "200") {
            const checklist = charResp.responseData.map((item, index) => ({
              key: index + 1,
              SNo: index + 1,
              characteristicId: item.characteristicId,
              characteristicName: item.characteristicName || "",
              specUnit: item.specUnit || "",
              measurementType: item.measurementType || "",
              observed: "",
              checked: false,
              remarks: "",
            }));

            setAddChecklistData(checklist);
          } else {
            setAddChecklistData([]);
          }
        }
      } else {
        setOperation("");
        setPmQty("");
        setPreventiveQty(0);
        addForm.setFieldsValue({ operation: "", pmQty: "", preventiveQty: 0 });
        setAddChecklistData([]);
      }
    } catch (error) {
      console.error(
        "Error fetching tool operation & PM characteristics",
        error
      );
      setOperation("");
      setPmQty("");
      setPreventiveQty(0);
      addForm.setFieldsValue({ operation: "", pmQty: "", preventiveQty: 0 });
      setAddChecklistData([]);
    }
  };

  const fetchCustomerByProduct = async (productId) => {
    try {
      const response = await commonBackendService({
        requestPath: "getCustomerByProduct",
        requestData: {
          productId,
          tenantId,
          branchCode,
        },
      });

      if (
        response?.responseCode === "200" &&
        response.responseData?.length > 0
      ) {
        // Assuming only one customer per product
        console.log("first", response);
        setCustomer(response.responseData[0].customerId);
        addForm.setFieldsValue({
          customer: response.responseData[0].customerName,
        });
        form.setFieldsValue({
          customerSearch: response.responseData[0].customerName,
        });
      } else {
        setCustomer("");
      }
    } catch (error) {
      console.error("Error fetching customer by product", error);
      setCustomer("");
    }
  };

  const handleSubmitAddChecklist = async () => {
    if (!isEditable) return;
    try {
      const payload = {
        lineCode: selectedLineAdd,
        toolNo: selectedToolAdd,
        operation: operationId,
        pmQty: pmQty,
        preventiveQty: preventiveQty,
        modelId: product,
        customerId: customer,
        tenantId,
        branchCode,
        characteristicList: addChecklistData.map((item) => ({
          characteristicId: item.characteristicId,
          observedReading: item.observed,
          okNotOk: item.okNotOk,
          remarks: item.remarks,
        })),
      };

      const response = await backendService({
        requestPath: "insertPMChecklist",
        requestData: payload,
      });

      if (response?.responseCode === "200") {
        setShowAddChecklist(false);
        setAddChecklistData([]);
        addForm.resetFields();
      }
    } catch (error) {
      console.error("Insert PM Checklist Error:", error);
    }
  };
  const handleSubmitViewChecklist = async () => {
    if (!isEditable) return;

    try {
      const payload = {
        tenantId,
        branchCode,
        characteristicList: addChecklistData.map((item) => ({
          toolPmLogId: item.toolPmLogId, // REQUIRED for update
          observedReading: item.observed,
          okNotOk: item.okNotOk,
          remarks: item.remarks,
        })),
      };

      const response = await backendService({
        requestPath: "updatePMCharacterList",
        requestData: payload,
      });

      if (response?.responseCode === "200") {
        // Close view card
        setShowViewChecklist(false);
        setIsEditable(false);
      }
    } catch (error) {
      console.error("Update PM Checklist Error:", error);
    }
  };

  const toolDropDownDataSearch = async (lineCode) => {
    try {
      const response = await commonBackendService({
        requestPath: "getToolByLineCode",
        requestData: { lineCode, tenantId, branchCode, isActive: "1" },
      });
      if (response?.responseCode === "200")
        setToolDataSearch(response.responseData);
    } catch (error) {}
  };

  const toolDropDownDataAdd = async (lineCode) => {
    try {
      const response = await commonBackendService({
        requestPath: "getToolByLineCode",
        requestData: { lineCode, tenantId, branchCode, isActive: "1" },
      });
      if (response?.responseCode === "200")
        setToolDataAdd(response.responseData);
    } catch (error) {}
  };

  const getLineDropDownData = useCallback(async () => {
    try {
      const response = await LineMstdropdown();
      if (response) {
        setLineData(
          response.map((item) => ({
            key: item.lineMstCode,
            value: item.lineMstDesc,
          }))
        );
      }
    } catch (error) {
      setLineData([]);
    }
  }, []);

  useEffect(() => {
    getLineDropDownData();
  }, []);

  useEffect(() => {
    toolDropDownDataSearch(selectedLineSearch);
  }, [selectedLineSearch]);

  useEffect(() => {
    toolDropDownDataAdd(selectedLineAdd);
  }, [selectedLineAdd]);

  const agColumns = [
    { headerName: "S.No", field: "sno", width: 90 },
    { headerName: "Line", field: "lineMstDescription", flex: 1 },
    { headerName: "Tool", field: "toolDesc", flex: 1 },
    { headerName: "Product", field: "productDescription", flex: 1 },
    { headerName: "Customer", field: "customerName", flex: 1 },
    { 
      headerName: "Date", 
      field: "createdDate", 
      flex: 1,
      cellRenderer: (params) => {
        if (params.value) {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD-MMM-YYYY') : params.value;
        }
        return params.value;
      },
    },
    {
      headerName: "Action",
      field: "action",
      cellRenderer: (params) => {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <EyeOutlined 
              style={{ 
                fontSize: '16px', 
                color: '#1890ff', 
                cursor: 'pointer',
                padding: '4px'
              }}
              onClick={() => handleViewChecklist(params.data)}
              title="View Details"
            />
          </div>
        );
      },
      width: 100,
      cellStyle: { textAlign: "center" },
      sortable: false,
      filter: false,
    },
  ];

  const exportToFormattedExcel = async () => {
    let reportId = currentViewedRecordId;
    
    if (!reportId) {
      toast.error("No report data available for export");
      return;
    }

    const payload = {
      id: reportId,
      tenantId,
      branchCode,
      logoPath: "/images/logo.png"
    };

    const response = await backendService({
      requestPath: 'pmChecklistExport',
      requestData: payload,
    })

    if (response.responseCode === '200') {
      if (response?.responseData[0]?.fileContent !== null) {
        const link = document.createElement('a')
        link.href = `data:application/octet-stream;base64,${response?.responseData[0]?.fileContent}`
        link.download = response?.fileName
        link.click()
        toast.success(response.responseMessage)
      } else {
        toast.error(response.responseMessage)
      }
    }
  };

  return (
    <>
      {/* SEARCH CARD */}
      <Card
        title="PM Checklist"
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        extra={
          <PlusCircleOutlined
            style={{ fontSize: 20, color: "white", cursor: "pointer" }}
            onClick={handleAddChecklist}
          />
        }
        style={{ marginTop: 20, borderRadius: 8 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitSearch}>
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item label="Line" name="lineId">
                <Select
                  value={selectedLineSearch}
                  onChange={(value) => setSelectedLineSearch(value)}
                >
                  <Option value="getAll">Get All</Option>
                  {lineData.map((line) => (
                    <Option key={line.key} value={line.key}>
                      {line.value}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item label="Tool Desc" name="toolId">
                <Select
                  placeholder="Select Tool"
                  onChange={(value) => {
                    setSelectedToolSearch(value);
                    if (value === "getAll") {
                      form.setFieldsValue({ productId: "getAll" });
                      setProduct("getAll");
                    }
                    productDropDownDataSearch(value);
                  }}
                >
                  <Option value="getAll">Get All</Option>
                  {toolDataSearch.map((tool) => (
                    <Option key={tool.toolNo} value={tool.toolNo}>
                      {tool.toolDesc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item label="Product" name="productId">
                <Select
                  disabled={!selectedToolSearch}
                  onChange={(value) => {
                    addForm.setFieldsValue({ productId: value });
                    setProduct(value);
                    fetchCustomerByProduct(value); // Call the new function
                  }}
                >
                  <Option value="getAll">Get All</Option>
                  {productDataSearch.map((prod) => (
                    <Option key={prod.productCode} value={prod.productCode}>
                      {prod.productDescription}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item label="Customer" name="customerSearch">
                <Input readOnly disabled={selectedToolSearch === "getAll"} />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item label="Year" name="year" initialValue={dayjs()}>
                <DatePicker picker="year" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Button
              type="primary"
              htmlType="submit"
              style={{ background: "#00264d", borderColor: "#00264d" }}
            >
              Submit
            </Button>

            <Button
              onClick={() => setShowDetails(false)}
              type="primary"
              style={{
                marginLeft: 10,
                background: "#00264d",
                borderColor: "#00264d",
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card>

      {/* SEARCH RESULTS SECTION */}
      {showDetails && (
        <Card
          title={"PM Checklist Summary"}
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          {/* If loading → show loader inside card */}
          {loading ? (
            <div
              style={{
                width: "100%",
                height: 300,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Loader />
            </div>
          ) : searchResults.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                width: "100%",
                padding: "60px 0",
                fontSize: "18px",
                color: "#999",
              }}
            >
              No data to show
            </div>
          ) : (
            searchResults.length > 0 && (
              <div
                className="ag-theme-alpine"
                style={{ height: 400, width: "100%" }}
              >
                <AgGridReact
                  columnDefs={agColumns}
                  rowData={searchResults}
                  pagination={true}
                  paginationPageSize={10}
                />
              </div>
            )
          )}
        </Card>
      )}

      {/* ADD / VIEW CHECKLIST CARD */}
      {showAddChecklist && (
        <Card
          title={isEditable ? "Add PM Checklist" : "View PM Checklist"}
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <Form form={addForm} layout="vertical">
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Line" name="lineId">
                  <Select
                    value={selectedLineAdd}
                    disabled={!isEditable}
                    onChange={(value) => {
                      setSelectedLineAdd(value);
                      toolDropDownDataAdd(value);
                    }}
                  >
                    <Option value="getAll">Get All</Option>
                    {lineData.map((line) => (
                      <Option key={line.key} value={line.key}>
                        {line.value}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="Tool Desc" name="toolId">
                  <Select
                    placeholder="Select Tool"
                    disabled={!isEditable}
                    onChange={(value) => {
                      setSelectedToolAdd(value);
                      productDropDownDataAdd(value);
                      productDropDownDataSearch(value);
                    }}
                  >
                    {toolDataAdd.map((tool) => (
                      <Option key={tool.toolNo} value={tool.toolNo}>
                        {tool.toolDesc}
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
                <Form.Item label="Product" name="productId">
                  <Select
                    disabled={!selectedToolAdd}
                    onChange={(value) => {
                      addForm.setFieldsValue({ productId: value });
                      setProduct(value);
                      fetchCustomerByProduct(value); // Call the new function
                    }}
                  >
                    {productDataAdd.map((prod) => (
                      <Option key={prod.productCode} value={prod.productCode}>
                        {prod.productDescription}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item label="Customer" name="customer">
                  <Input readOnly />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="PM Qty" name="pmQty">
                  <Input value={pmQty} readOnly />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="Preventive Qty" name="preventiveQty">
                  <Input value={preventiveQty} readOnly />
                </Form.Item>
              </Col>
            </Row>

            <Table
              dataSource={addChecklistData}
              columns={addChecklistColumns}
              pagination={{ pageSize: 10 }}
              bordered
              style={{ marginTop: 10 }}
            />
          </Form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            {isEditable && (
              <Button
                type="primary"
                style={{ background: "#00264d", borderColor: "#00264d" }}
                onClick={handleSubmitAddChecklist}
              >
                Submit
              </Button>
            )}

            <Button
              onClick={() => setShowAddChecklist(false)}
              style={{ marginLeft: 10 }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* view card table */}
      {showViewChecklist && (
        <Card
          title={"PM Checklist Detail"}
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <Form form={addForm} layout="vertical">
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Line" name="lineId">
                  <Input readOnly />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="Tool Desc" name="toolId">
                  <Input value={selectedToolAdd} readOnly />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item label="Operation" name="operation">
                  <Input value={operation} readOnly />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="Product" name="productId">
                  <Input value={product} readOnly />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item label="Customer" name="customer">
                  <Input value={customer} readOnly />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="PM Qty" name="pmQty">
                  <Input value={pmQty} readOnly />
                </Form.Item>
              </Col>

              <Col span={4}>
                <Form.Item label="Preventive Qty" name="preventiveQty">
                  <Input value={preventiveQty} readOnly />
                </Form.Item>
              </Col>
            </Row>

            <Table
              dataSource={addChecklistData}
              columns={addChecklistColumns}
              pagination={{ pageSize: 10 }}
              bordered
              style={{ marginTop: 10 }}
            />
          </Form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Button
              type="primary"
              style={{ background: "#28a745", borderColor: "#28a745" }}
              onClick={exportToFormattedExcel}
            >
              Export 
            </Button>
            {isEditable && (
              <Button
                type="primary"
                style={{ 
                  marginLeft: 10,
                  background: "#00264d", 
                  borderColor: "#00264d" 
                }}
                onClick={handleSubmitViewChecklist}
              >
                Update
              </Button>
            )}

            <Button
              onClick={() => setShowViewChecklist(false)}
              type="primary"
              style={{
                marginLeft: 10,
                background: "#00264d",
                borderColor: "#00264d",
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};

export default PreventiveMaintenanceCheckList;
