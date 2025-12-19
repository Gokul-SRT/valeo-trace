import React, { useState, useEffect } from "react";
import {
  Card,
  Select,
  Input,
  Button,
  Table,
  Switch,
  Row,
  Col,
} from "antd";
import { backendService } from "../../service/ToolServerApi";
import store from "store";
import { toast } from "react-toastify";

import LineMstdropdown from "../../CommonDropdownServices/Service/LineMasterSerive";
import ProductDropdown from "../../CommonDropdownServices/Service/ProductDropdownService";
import CycleTimeChart from "../Traceability/CycleTimeAnalysis/CycleTimeAnalysis";
import Loader from "../../Utills/Loader";

const { Option } = Select;

const Traceabilityreports = () => {
  // State management
  const [customerType, setCustomerType] = useState(null); // 'inhouse' or 'customer'
  const [toggleValue, setToggleValue] = useState(true); // true = Serial, false = Date range
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lineCode: null,
    productCode: null,
    serialNumber: null,
    fromDate: "",
    toDate: "",
    customerProductCode: null,
    customerLineCode: null,
    customerSerialNumber: null,
    customerFromDate: "",
    customerToDate: "",
  });

  // Data states
  const [lineOptions, setLineOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [customerLineOptions, setCustomerLineOptions] = useState([]);
  const [customerProductOptions, setCustomerProductOptions] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [customerSerialNumbers, setCustomerSerialNumbers] = useState([]);
  const [cycleTimeData, setCycleTimeData] = useState([]);

  // Display states
  const [showTraceReportHeader, setShowTraceReportHeader] = useState(false);
  const [showQualityTable, setShowQualityTable] = useState(false);
  const [showEmployeeTable, setShowEmployeeTable] = useState(false);
  const [filterChildPartReport, setFilterChildPartReport] = useState([]);
  const [filterQualityParameter, setFilterQualityParameter] = useState([]);
  const [filterSerialNumber, setFilterSerialNumber] = useState([]);

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");

  // Initialize component
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData((prev) => ({
      ...prev,
      fromDate: today,
      toDate: today,
      customerFromDate: today,
      customerToDate: today,
    }));
    loadLineDropdown();
    loadProductDropdown();
    loadCustomerLineDropdown();
    loadCustomerProductDropdown();
  };

  // Load line dropdown from API service
  const loadLineDropdown = async () => {
    const lines = await LineMstdropdown();
    if (Array.isArray(lines) && lines.length > 0) {
      setLineOptions(lines);
    } else {
      setLineOptions([]);
    }
  };

  // Load product dropdown from API service
  const loadProductDropdown = async () => {
    const products = await ProductDropdown();
    if (Array.isArray(products) && products.length > 0) {
      setProductOptions(products);
    } else {
      setProductOptions([]);
    }
  };

  // Load customer line dropdown (you can use same or different API)
  const loadCustomerLineDropdown = async () => {
    const lines = await LineMstdropdown(); // Use same or different service
    if (Array.isArray(lines) && lines.length > 0) {
      setCustomerLineOptions(lines);
    } else {
      setCustomerLineOptions([]);
    }
  };

  // Load customer product dropdown (you can use same or different API)
  const loadCustomerProductDropdown = async () => {
    const products = await ProductDropdown(); // Use same or different service
    if (Array.isArray(products) && products.length > 0) {
      setCustomerProductOptions(products);
    } else {
      setCustomerProductOptions([]);
    }
  };

  // Customer type change handler
  const handleCustomerTypeChange = (value) => {
    setCustomerType(value);
    closeRetrieveCards();
    // Reset form when customer type changes
    setFormData((prev) => ({
      ...prev,
      lineCode: null,
      productCode: null,
      serialNumber: null,
      customerProductCode: null,
      customerLineCode: null,
      customerSerialNumber: null,
      fromDate: new Date().toISOString().split("T")[0],
      toDate: new Date().toISOString().split("T")[0],
      customerFromDate: new Date().toISOString().split("T")[0],
      customerToDate: new Date().toISOString().split("T")[0],
    }));
  };

  // Toggle switch handler
  const handleToggleChange = (checked) => {
    setToggleValue(checked);
    closeRetrieveCards();
  };

  const closeRetrieveCards = () => {
    setShowQualityTable(false);
    setShowEmployeeTable(false);
    setShowTraceReportHeader(false);
    setReportData(null);
    setSerialNumbers([]);
    setCustomerSerialNumbers([]);
    setCycleTimeData([]);
    // Reset all filters
    setFilterChildPartReport([]);
    setFilterQualityParameter([]);
    // Reset form fields
    setFormData((prev) => ({
      ...prev,
      lineCode: null,
      productCode: null,
      serialNumber: null,
      customerProductCode: null,
      customerLineCode: null,
      customerSerialNumber: null,
    }));
  };

  // Validate form based on customer type
  const validateForm = () => {
    if (customerType === "inhouse") {
      const { lineCode, productCode, serialNumber, fromDate, toDate } =
        formData;

      if (!lineCode || lineCode === "<--Select-->") {
        toast.info("Please select a line");
        return false;
      }

      if (!productCode || productCode === "<--Select-->") {
        toast.info("Please select a product");
        return false;
      }

      if (toggleValue && !serialNumber) {
        toast.info("Please enter a serial number");
        return false;
      }

      if (!toggleValue && (!fromDate || !toDate)) {
        toast.info("Please select date range");
        return false;
      }
    } else if (customerType === "customer") {
      const {
        customerLineCode,
        customerProductCode,
        customerSerialNumber,
        customerFromDate,
        customerToDate,
      } = formData;

      if (!customerLineCode || customerLineCode === "<--Select-->") {
        toast.info("Please select a customer line");
        return false;
      }

      if (!customerProductCode || customerProductCode === "<--Select-->") {
        toast.info("Please select a customer product");
        return false;
      }

      if (toggleValue && !customerSerialNumber) {
        toast.info("Please enter a customer serial number");
        return false;
      }

      if (!toggleValue && (!customerFromDate || !customerToDate)) {
        toast.info("Please select customer date range");
        return false;
      }
    }

    return true;
  };

  // Fetch report data from backend
  const fetchReportData = async () => {
    if (!validateForm()) return;

    // Clear all table data first
    setReportData(null);
    setFilterChildPartReport([]);
    setFilterQualityParameter([]);
    setSerialNumbers([]);
    setCustomerSerialNumbers([]);
    setCycleTimeData([]);

    setLoading(true);
    
    // Show cards immediately with loaders
    if (toggleValue) {
      setShowTraceReportHeader(true);
      setShowQualityTable(true);
    } else {
      setShowQualityTable(true);
      setShowTraceReportHeader(false);
      setShowEmployeeTable(false);
    }
    
    try {
      const isInhouse = customerType === "inhouse";

      const reqdata = {
        product: isInhouse
          ? formData.productCode
          : formData.customerProductCode,
        line: isInhouse ? formData.lineCode : formData.customerLineCode,
        serialNumber: toggleValue
          ? isInhouse
            ? formData.serialNumber
            : formData.customerSerialNumber
          : null,
        fromDate: !toggleValue
          ? isInhouse
            ? formData.fromDate
            : formData.customerFromDate
          : null,
        toDate: !toggleValue
          ? isInhouse
            ? formData.toDate
            : formData.customerToDate
          : null,
        tenantId: tenantId,
        branchCode: branchCode,
        isToggle: toggleValue ? "0" : "1",
        serialType: customerType,
      };

      const response = await backendService({
        requestPath: "getTraceabilityReport",
        requestData: reqdata,
      });

      if (
        response &&
        Array.isArray(response.responseData) &&
        response.responseData.length > 0
      ) {
        const data = response.responseData[0];
        console.log("data.cycleResponse", data.cycleResponse);

        // Set cycle time data FIRST
        setCycleTimeData(data.cycleResponse || []);

        // Normalize/guard against null
        const normalized = {
          ...data,
          trace_childpartReport: data.trace_childpartReport || [],
          qualityParams: data.qualityParams || [],
          trace_rep_op_info: data.trace_rep_op_info || [],
        };
        setFilterChildPartReport(normalized?.trace_childpartReport);
        setFilterQualityParameter(normalized?.qualityParams);
        setReportData(normalized);

        if (toggleValue) {
          // Show employee table only if there is some data
          setShowEmployeeTable(
            Array.isArray(normalized.trace_rep_op_info) &&
              normalized.trace_rep_op_info.length > 0
          );
        } else {
          // Load serial numbers based on customer type
          loadSerialNumbers();
        }
      } else {
        toast.error(response?.responseMessage || "No data found");
        closeRetrieveCards();
      }
    } catch (e) {
      console.error("Error fetching report data:", e);
      toast.error("Error fetching report data");
      closeRetrieveCards();
    } finally {
      setLoading(false);
    }
  };

  // Load serial numbers based on customer type
  const loadSerialNumbers = async () => {
    setLoading(true);
    try {
      const isInhouse = customerType === "inhouse";

      const reqdata = {
        product: isInhouse
          ? formData.productCode
          : formData.customerProductCode,
        line: isInhouse ? formData.lineCode : formData.customerLineCode,
        fromDate: isInhouse ? formData.fromDate : formData.customerFromDate,
        toDate: isInhouse ? formData.toDate : formData.customerToDate,
        tenantId: tenantId,
        branachCode: branchCode, // Note: matches backend field name (typo preserved)
      };

      const response = await backendService({
        requestPath: "getSerialNumberReport",
        requestData: reqdata,
      });

      if (
        response &&
        Array.isArray(response.responseData) &&
        response.responseData.length > 0
      ) {
        // Transform response data to match table structure
        const transformedData = response.responseData.map((item) => ({
          serial_no: item.serialNumber,
          shift_date: item.shiftDate,
          shift: item.shiftMstTypeDescription || item.shift,
        }));

        if (customerType === "inhouse") {
          setSerialNumbers(transformedData);
        } else {
          setCustomerSerialNumbers(transformedData);
        }
      } else {
        // Handle empty response
        if (customerType === "inhouse") {
          setSerialNumbers([]);
        } else {
          setCustomerSerialNumbers([]);
        }
        toast.info(
          response?.responseMessage ||
            "No serial numbers found for the selected date range"
        );
      }
    } catch (e) {
      console.error("Error loading serial numbers:", e);
      toast.error("Error loading serial numbers");
      // Reset on error
      if (customerType === "inhouse") {
        setSerialNumbers([]);
      } else {
        setCustomerSerialNumbers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle serial number click from date range table
  const handleSerialNumberClick = (serialNo) => {
    // Update form data with clicked serial number
    const updatedFormData = { ...formData };
    if (customerType === "inhouse") {
      updatedFormData.serialNumber = serialNo;
    } else {
      updatedFormData.customerSerialNumber = serialNo;
    }
    setFormData(updatedFormData);

    // Set toggle to Serial Number mode
    setToggleValue(true);

    // Fetch details for this serial number
    setTimeout(() => {
      fetchSerialNumberDetails(serialNo);
    }, 100);
  };

  // Fetch details for a specific serial number
  const fetchSerialNumberDetails = async (serialNo) => {
    setLoading(true);
    try {
      const isInhouse = customerType === "inhouse";

      const reqdata = {
        product: isInhouse
          ? formData.productCode
          : formData.customerProductCode,
        line: isInhouse ? formData.lineCode : formData.customerLineCode,
        serialNumber: serialNo,
        fromDate: null,
        toDate: null,
        tenantId: tenantId,
        branchCode: branchCode,
        isToggle: "0", // 0 = Serial Number mode
        serialType: customerType,
      };

      const response = await backendService({
        requestPath: "getTraceabilityReport",
        requestData: reqdata,
      });

      if (
        response &&
        Array.isArray(response.responseData) &&
        response.responseData.length > 0
      ) {
        const data = response.responseData[0];

        // Set cycle time data
        setCycleTimeData(data.cycleResponse || []);

        // Normalize/guard against null
        const normalized = {
          ...data,
          trace_childpartReport: data.trace_childpartReport || [],
          qualityParams: data.qualityParams || [],
          trace_rep_op_info: data.trace_rep_op_info || [],
        };

        setReportData(normalized);

        // Show detailed reports
        setShowTraceReportHeader(true);
        setShowQualityTable(true);
        setShowEmployeeTable(
          Array.isArray(normalized.trace_rep_op_info) &&
            normalized.trace_rep_op_info.length > 0
        );
      } else {
        toast.error(
          response?.responseMessage || "No data found for this serial number"
        );
      }
    } catch (e) {
      console.error("Error fetching serial number details:", e);
      toast.error("Error fetching serial number details");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    console.log(searchTerm);
    if (searchTerm === "") {
      setFilterChildPartReport(reportData.trace_childpartReport);
      return;
    }
    const filteredList = reportData.trace_childpartReport.filter((item) => {
      const itemKeys = Object.keys(item);
      return itemKeys.some((key) => {
        const columnValue = item[key];
        if (typeof columnValue === "string") {
          return columnValue.toLowerCase().includes(searchTerm);
        }
        if (columnValue !== null && columnValue !== undefined) {
          return String(columnValue).toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });

    console.log("filteredList", filteredList);
    setFilterChildPartReport(filteredList);
  };

  const handleSearchs = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    console.log(searchTerm);
    if (searchTerm === "") {
      setFilterQualityParameter(reportData.qualityParams);
      return;
    }
    const filteredLists = reportData.qualityParams.filter((item) => {
      const itemKeys = Object.keys(item);
      return itemKeys.some((key) => {
        const columnValue = item[key];
        if (typeof columnValue === "string") {
          return columnValue.toLowerCase().includes(searchTerm);
        }
        if (columnValue !== null && columnValue !== undefined) {
          return String(columnValue).toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });

    console.log("filteredList", filteredLists);
    setFilterQualityParameter(filteredLists);
  };

  // Go back to serial numbers list
  const handleBackToSerialNumbers = () => {
    setShowTraceReportHeader(false);
    setShowQualityTable(true);
    setReportData(null);
    setCycleTimeData([]);
    setToggleValue(false); // Set back to date range mode
  };

  const exportToPDF = async () => {
    const isInhouse = customerType === "inhouse";
    const reqdata = {
      key: "Traceability_report",
      branchCode,
      serialNo: isInhouse
        ? formData.serialNumber
        : formData.customerSerialNumber,
      tenantId,
      customerType: customerType,
    };

    const response = await backendService({
      requestPath: "getTraceabilityReportPdf",
      requestData: reqdata,
    });

    if (response.responseCode === "200") {
      if (response?.responseData?.[0]?.fileContent) {
        const link = document.createElement("a");
        link.href = `data:application/octet-stream;base64,${response.responseData[0].fileContent}`;
        link.download = response.fileName;
        link.click();
        toast.success(response.responseMessage);
      } else {
        toast.error(response.responseMessage || "File not found");
      }
    } else {
      toast.error(response.responseMessage || "PDF export failed");
    }
  };

  const exportToPDFss = () => {
    toast.info("PDF export functionality would be implemented here");
  };

  // const tableHeaderStyle = {
  //     backgroundColor: '#001F3E',
  //     color: 'white',
  //     fontWeight: 'bold',
  //     fontSize: '14px'
  //   };

  // Table columns for child parts
  const childPartsColumns = [
    { title: "S.No", key: "sno", render: (_, __, index) => index + 1 },
    {
      title: "Child Part Code",
      dataIndex: "child_PRODUCT_CODE",
      key: "childCode",
      // onHeaderCell: () => ({ style: tableHeaderStyle })
    },
    {
      title: "Child Part Description",
      dataIndex: "child_PART_DESC",
      key: "childDesc",
      render: (text) => text || "-",
      // onHeaderCell: () => ({ style: tableHeaderStyle })
    },
    {
      title: "Count",
      dataIndex: "offtake",
      key: "count",
      render: (text) => (text != null ? parseInt(text, 10) : 0),
      // onHeaderCell: () => ({ style: tableHeaderStyle })
    },
    {
      title: "Lot Number",
      dataIndex: "lot_NUMBER",
      key: "lotNumber",
      // onHeaderCell: () => ({ style: tableHeaderStyle })
    },
  ];

  // Table columns for quality parameters
  const qualityParamsColumns = [
    { title: "S.No", key: "sno", render: (_, __, index) => index + 1 },
    {
      title: "Equipment",
      dataIndex: "equipment_DESCRIPTION",
      key: "equipment",
      // onHeaderCell: () => ({ style: tableHeaderStyle })
    },
    {
      title: "Parameter",
      dataIndex: "pa_DESC",
      key: "parameter",
      //  onHeaderCell: () => ({ style: tableHeaderStyle })
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      //  onHeaderCell: () => ({ style: tableHeaderStyle })
    },
  ];

  // Table columns for employee traceability
  const employeeColumns = [
    { title: "Sequence", dataIndex: "operation_UNIQUECODE", key: "sequence" },
    {
      title: "Operation Description",
      dataIndex: "operation_DESCRIPTION",
      key: "operation",
    },
    { title: "Employee", dataIndex: "employee_name", key: "employee" },
  ];

  // Table columns for serial numbers (date range mode)
  const serialNumberColumns = [
    {
      title: "Serial Number",
      dataIndex: "serial_no",
      key: "serialNo",
      render: (text) => (
        <Button
          type="link"
          onClick={() => handleSerialNumberClick(text)}
          style={{ padding: 0, fontWeight: "bold", cursor: "pointer" }}
        >
          {text}
        </Button>
      ),
      //  onHeaderCell: () => ({ style: tableHeaderStyle })
    },
    {
      title: "Shift Date",
      dataIndex: "shift_date",
      key: "shiftDate",
      //  onHeaderCell: () => ({ style: tableHeaderStyle })
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
      //  onHeaderCell: () => ({ style: tableHeaderStyle })
    },
  ];

  // Helper to get line description
  const getLineDesc = () => {
    if (customerType === "inhouse") {
      const line = lineOptions.find((l) => l.lineMstCode === formData.lineCode);
      return line?.lineMstDesc || "";
    } else {
      const line = customerLineOptions.find(
        (l) => l.lineMstCode === formData.customerLineCode
      );
      return line?.lineMstDesc || "";
    }
  };

  // Helper to get product description
  const getProductDesc = () => {
    if (customerType === "inhouse") {
      const prod = productOptions.find(
        (p) => p.productCode === formData.productCode
      );
      return prod?.productDescription || "";
    } else {
      const prod = customerProductOptions.find(
        (p) => p.productCode === formData.customerProductCode
      );
      return prod?.productDescription || "";
    }
  };

  // Get current serial number based on customer type
  const getCurrentSerialNumber = () => {
    if (customerType === "inhouse") {
      return formData.serialNumber;
    } else {
      return formData.customerSerialNumber;
    }
  };

  // Split productdateTime into date and time safely
  const producedDate = reportData?.productdateTime
    ? reportData.productdateTime.split(" ")[0]
    : "";
  const producedTime = reportData?.productdateTime
    ? reportData.productdateTime.split(" ").slice(1).join(" ")
    : "";

  return (
    <div>
      {/* Main Form Card */}
      <Card
        title="Traceability Report"
        style={{ marginBottom: "20px" }}
        headStyle={{ backgroundColor: "#001F3E", color: "white" }}
      >
        {/* Customer Type Dropdown */}
        <Row gutter={16} style={{ marginBottom: "16px" }}>
          <Col span={6}>
            <div style={{ marginBottom: "16px" }}>
              <strong>
                Customer Type <span style={{ color: "red" }}>*</span>
              </strong>
              <Select
                style={{ width: "100%", marginTop: "4px" }}
                placeholder="<--Select-->"
                value={customerType}
                onChange={handleCustomerTypeChange}
              >
                <Option value="<--Select-->">--Select--</Option>
                <Option value="inhouse">Inhouse</Option>
                <Option value="customer">Customer</Option>
              </Select>
            </div>
          </Col>
        </Row>

        {/* Conditional rendering based on customer type */}
        {(customerType === "inhouse" || customerType === "customer") && (
          <>
            <Row gutter={16} style={{ marginBottom: "16px" }}>
              <Col span={24}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <strong style={{ marginRight: "8px" }}>Log Date</strong>
                  <Switch
                    checked={toggleValue}
                    onChange={handleToggleChange}
                    style={{ margin: "0 8px" }}
                    disabled={customerType === "customer"}
                  />
                  <strong style={{ marginLeft: "8px" }}>Serial Number</strong>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              {/* Product Dropdown */}
              <Col span={6}>
                <div style={{ marginBottom: "16px" }}>
                  <strong>
                    {customerType === "inhouse"
                      ? "Product"
                      : "Customer Product"}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </strong>
                  <Select
                    style={{ width: "100%", marginTop: "4px" }}
                    placeholder="<--Select-->"
                    value={
                      customerType === "inhouse"
                        ? formData.productCode
                        : formData.customerProductCode
                    }
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        [customerType === "inhouse"
                          ? "productCode"
                          : "customerProductCode"]: value,
                      }))
                    }
                  >
                    <Option value="<--Select-->">--Select--</Option>
                    {(customerType === "inhouse"
                      ? productOptions
                      : customerProductOptions
                    ).map((product) => (
                      <Option
                        key={product.productCode}
                        value={product.productCode}
                      >
                        {product.productDescription}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>

              {/* Line Dropdown */}
              <Col span={6}>
                <div style={{ marginBottom: "16px" }}>
                  <strong>
                    {customerType === "inhouse" ? "Line" : "Customer Line"}{" "}
                    <span style={{ color: "red" }}>*</span>
                  </strong>
                  <Select
                    style={{ width: "100%", marginTop: "4px" }}
                    placeholder="<--Select-->"
                    value={
                      customerType === "inhouse"
                        ? formData.lineCode
                        : formData.customerLineCode
                    }
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        [customerType === "inhouse"
                          ? "lineCode"
                          : "customerLineCode"]: value,
                      }))
                    }
                  >
                    <Option value="<--Select-->">Select</Option>
                    {(customerType === "inhouse"
                      ? lineOptions
                      : customerLineOptions
                    ).map((line) => (
                      <Option key={line.lineMstCode} value={line.lineMstCode}>
                        {line.lineMstDesc}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>

              {/* Serial Number Input (when toggle is true) */}
              {toggleValue && (
                <Col span={6}>
                  <div style={{ marginBottom: "16px" }}>
                    <strong>
                      {customerType === "inhouse"
                        ? "Serial Number"
                        : "Customer Serial Number"}{" "}
                      <span style={{ color: "red" }}>*</span>
                    </strong>
                    <Input
                      style={{ marginTop: "4px" }}
                      placeholder={`Enter ${
                        customerType === "inhouse"
                          ? "Serial"
                          : "Customer Serial"
                      } Number`}
                      value={
                        customerType === "inhouse"
                          ? formData.serialNumber
                          : formData.customerSerialNumber
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [customerType === "inhouse"
                            ? "serialNumber"
                            : "customerSerialNumber"]: e.target.value,
                        }))
                      }
                    />
                  </div>
                </Col>
              )}

              {/* Date Range Inputs (when toggle is false) */}
              {!toggleValue && (
                <>
                  <Col span={6}>
                    <div style={{ marginBottom: "16px" }}>
                      <strong>
                        {customerType === "inhouse"
                          ? "From Date"
                          : "Customer From Date"}{" "}
                        <span style={{ color: "red" }}>*</span>
                      </strong>
                      <Input
                        type="date"
                        style={{ marginTop: "4px" }}
                        value={
                          customerType === "inhouse"
                            ? formData.fromDate
                            : formData.customerFromDate
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [customerType === "inhouse"
                              ? "fromDate"
                              : "customerFromDate"]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ marginBottom: "16px" }}>
                      <strong>
                        {customerType === "inhouse"
                          ? "To Date"
                          : "Customer To Date"}{" "}
                        <span style={{ color: "red" }}>*</span>
                      </strong>
                      <Input
                        type="date"
                        style={{ marginTop: "4px" }}
                        value={
                          customerType === "inhouse"
                            ? formData.toDate
                            : formData.customerToDate
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [customerType === "inhouse"
                              ? "toDate"
                              : "customerToDate"]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </>
        )}

        {/* Buttons */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Button
            type="primary"
            onClick={fetchReportData}
            style={{ marginRight: "8px" }}
          >
            Submit
          </Button>
          <Button
            onClick={closeRetrieveCards}
            style={{ marginRight: "8px" }}
            type="primary"
          >
            Cancel
          </Button>
        </div>
      </Card>

      {/* Export button above header */}
      {customerType && toggleValue && reportData && (
        <Button
          type="primary"
          onClick={exportToPDF}
          style={{ display: "inline-block", margin: 5, marginBottom: "20px" }}
        >
          Export to PDF
        </Button>
      )}

      {/* Back button when in serial number details view from date range */}
      {showTraceReportHeader && !toggleValue && (
        <Button
          onClick={handleBackToSerialNumbers}
          style={{ marginLeft: "8px", marginBottom: "20px" }}
        >
          Back to Serial Numbers
        </Button>
      )}

      {/* Report Header Card */}
      {showTraceReportHeader && reportData && (
        <Card
          title={`${
            customerType === "inhouse" ? "FG" : "Customer"
          } Traceability Report - ${getCurrentSerialNumber()}`}
          style={{ marginBottom: "20px" }}
          headStyle={{ backgroundColor: "#001F3E", color: "white" }}
        >
            <Row gutter={16}>
              <Col span={12}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ backgroundColor: "#e6e6e6" }}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {customerType === "inhouse"
                          ? "Product Code"
                          : "Customer Product Code"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {customerType === "inhouse"
                          ? formData.productCode
                          : formData.customerProductCode}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: "#f3f3f3" }}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {customerType === "inhouse"
                          ? "Line Name"
                          : "Customer Line Name"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {getLineDesc()}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: "#e6e6e6" }}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {customerType === "inhouse"
                          ? "FG Serial Number"
                          : "Customer Serial Number"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {getCurrentSerialNumber()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Col>
              <Col span={12}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ backgroundColor: "#e6e6e6" }}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {customerType === "inhouse"
                          ? "Product Description"
                          : "Customer Product Description"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {getProductDesc()}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: "#f3f3f3" }}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        Produced Date
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {producedDate}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: "#e6e6e6" }}>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        Produced Time
                      </td>
                      <td
                        style={{
                          border: "1px solid #ccc",
                          padding: "8px",
                          fontWeight: "bold",
                        }}
                      >
                        {producedTime}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Col>
            </Row>

            <div style={{ position: "relative" }}>
              {loading && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.6)",
                    zIndex: 2,
                    borderRadius: "8px",
                  }}
                >
                  <Loader />
                </div>
              )}
            </div>
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontWeight: "bold" }}>
                Child Part Lot Traceability
              </h4>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 10,
                }}
              >
                <Input
                  placeholder="Search..."
                  onChange={handleSearch}
                  style={{ width: 250 }}
                />
              </div>
              <Table
                dataSource={filterChildPartReport}
                columns={childPartsColumns}
                rowKey={(record, index) => index}
                pagination={false}
                size="small"
              />
            </div>
        </Card>
      )}

      {/* Quality Parameters / Serial Numbers Card */}
      {showQualityTable && (
        <Card
          title={
            toggleValue || showTraceReportHeader
              ? `Quality Parameters - ${getCurrentSerialNumber()}`
              : `${
                  customerType === "inhouse"
                    ? "Serial Numbers"
                    : "Customer Serial Numbers"
                }`
          }
          style={{ marginBottom: "20px" }}
          headStyle={{ backgroundColor: "#001F3E", color: "white" }}
        >
          <div style={{ position: "relative" }}>
            {loading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.6)",
                  zIndex: 2,
                  borderRadius: "8px",
                }}
              >
                <Loader />
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 10,
              }}
            >
              <Input
                placeholder="Search..."
                onChange={handleSearchs}
                style={{ width: 250 }}
              />
            </div>
            {(toggleValue || showTraceReportHeader) && reportData ? (
              <Table
                dataSource={filterQualityParameter}
                columns={qualityParamsColumns}
                rowKey={(record, index) => index}
                pagination={false}
                size="small"
              />
            ) : (
              <Table
                dataSource={
                  customerType === "inhouse"
                    ? serialNumbers
                    : customerSerialNumbers
                }
                columns={serialNumberColumns}
                rowKey="serial_no"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            )}
          </div>
        </Card>
      )}

      {/* CYCLE TIME CHART - SHOWS ONLY AFTER SUBMIT BUTTON CLICK WITH DATA */}
      {reportData && cycleTimeData && cycleTimeData.length > 0 && (
        <Card
          title={`Cycle Time Analysis - ${getCurrentSerialNumber()}`}
          style={{ marginBottom: "20px" }}
          headStyle={{ backgroundColor: "#001F3E", color: "white" }}
        >
          <div style={{ position: "relative" }}>
            {loading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.6)",
                  zIndex: 2,
                  borderRadius: "8px",
                }}
              >
                <Loader />
              </div>
            )}
            <CycleTimeChart data={cycleTimeData} />
          </div>
        </Card>
      )}

      {/* Employee Traceability Card */}
      {showEmployeeTable &&
        reportData &&
        Array.isArray(reportData.trace_rep_op_info) &&
        reportData.trace_rep_op_info.length > 0 && (
          <Card
            title={`Employee Traceability - ${getCurrentSerialNumber()}`}
            style={{ marginBottom: "20px" }}
            headStyle={{ backgroundColor: "#001F3E", color: "white" }}
          >
            <div style={{ position: "relative" }}>
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    zIndex: 2,
                    borderRadius: "8px",
                  }}
                >
                  <Loader />
                </div>
              )}
              <Table
                dataSource={reportData.trace_rep_op_info}
                columns={employeeColumns}
                rowKey={(record, index) => index}
                pagination={false}
                size="small"
              />
            </div>
          </Card>
        )}
    </div>
  );
};

export default Traceabilityreports;
