import React, { useState, useEffect } from "react";
import { Card, Form, Select, Row, Col, Button, DatePicker, Input } from "antd";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import CommonserverApi from "../../../../CommonserverApi";
import { backendService } from "../../../../service/ToolServerApi";
import Loader from "../../../.././Utills/Loader";
import store from 'store';
import axios from 'axios';
// import "./style.css";
import LineMstdropdown from "../../../../CommonDropdownServices/Service/LineMasterSerive";

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
  const [isViewMode, setIsViewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);

  // ✅ MAIN DROPDOWNS
  const [lineList, setLineList] = useState([]);
  const [toolList, setToolList] = useState([]);

  // ✅ ADD CARD DROPDOWNS
  const [addLineList, setAddLineList] = useState([]);
  const [addToolList, setAddToolList] = useState([]);
  const [jsonResponse, settableJson] = useState([]);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = store.get("employeeId");

  // ================= LINE DROPDOWN FETCH =================
  const fetchLineDropdown = async () => {
    try {
      const payload = {
        isActive: "1",
        tenantId,
        branchCode,
      };

      const res = await LineMstdropdown();
      const rawData = Array.isArray(res)
        ? res
        : res || [];

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
  const fetchCriticalSpareDetails = async (lineCode, toolNo) => {
    setIsLoading(true);
    try {
      const payload = { line: lineCode, tenantId, branchCode };
      if (toolNo) {
        payload.toolNo = toolNo;
      }
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
              toolDescription: item.toolDesc || "",
              operationDescription: operationDesc,
              criticalSpares: item.criticalSpareName,
              minQty: parseInt(item.minimumThresholdQuantity) || 0,
              spareLocation: item.storageLocation || "",
              availableQty: parseInt(item.stockAvailable) || 0,
              needToOrder: parseInt(item.needToOrder) || 0,
              totalAvailable: parseInt(item.totalAvailable) || 0,
              sparePartId: item.sparePartId,
              operationId: item.operationId,
              toolNo: item.toolNo,
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
    } finally {
      setIsLoading(false);
    }
  };

  // ================= FETCH CRITICAL SPARE PART REPORT HEADER =================
  const fetchCriticalSparePartReportHdr = async (formValues) => {
    setIsDetailsLoading(true);
    try {
      const payload = {
        tenantId,
        branchCode,
        lineCode: formValues.line,
        monthYear: formValues.monthYear.format('MMM-YYYY'),
      };

      const res = await backendService({
        requestPath: "getcriticalsparepartreporthdr",
        requestData: payload,
      });

      const rawData = res?.data || res || [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        const formattedData = rawData.map((item, index) => ({
          key: item.id || index + 1, // Use actual database ID instead of array index
          line: item.lineDescription,
          createdBy: item.employeeName,
          toolDescription: item.toolDescription,
          monthYear: item.createdDate,
          actualId: item.id, // Store the actual ID for reference
        }));
        setDetailsData(formattedData);
      } else {
        setDetailsData([]);
      }
    } catch (err) {
      console.error("fetchCriticalSparePartReportHdr error", err);
      setDetailsData([]);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // ================= FORM HANDLERS =================
  const handleSubmit = (values) => {
    fetchCriticalSparePartReportHdr(values);
    setShowDetails(true);
    setShowAddCard(false);
  };

  const handleCancel = () => {
    if (isViewMode) {
      // When closing view mode, go back to summary and preserve line selection
      setShowAddCard(false);
      setShowDetails(true);
      setIsViewMode(false);
      setAddCardData([]);
    } else {
      // Normal cancel - reset everything
      form.resetFields();
      addForm.resetFields();
      setShowDetails(false);
      setShowAddCard(false);
      setAddCardData([]);
      setIsViewMode(false);
    }
  };

  const handleAddClick = () => {
    addForm.resetFields();
    setAddToolList([]);
    setShowAddCard(true);
    setShowDetails(false);
    setAddCardData([]);
    setIsViewMode(false);
  };

  const handleAddFormChange = (changedValues, allValues) => {
    if (allValues.line) {
      fetchCriticalSpareDetails(allValues.line, null);
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

  // ================= FETCH CRITICAL SPARE DETAILS BY ID =================
  const getCriticalSpareDetailsById = async (reportId) => {
    try {
      console.log("Fetching details for reportId:", reportId);
      
      const payload = {
        logId: reportId,
        tenantId,
        branchCode,
      };
      
      console.log("API payload:", payload);

      const res = await backendService({
        requestPath: "getCritcalSpareDetailsById",
        requestData: payload,
      });
      
      console.log("API response:", res);

      const rawData = res?.data || res || [];
      console.log("Raw data:", rawData);
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        // Format data for the add card grid
        const tableData = rawData.map((item, index) => ({
          key: index + 1,
          sno: index + 1,
          toolDescription: item.toolDesc || "",
          operationDescription: item.operationDesc || "",
          criticalSpares: item.criticalSpareName,
          minQty: parseInt(item.minimumThresholdQuantity) || 0,
          spareLocation: item.storageLocation || "",
          availableQty: parseInt(item.stockAvailable) || 0,
          needToOrder: parseInt(item.needToOrder) || 0,
          totalAvailable: parseInt(item.totalAvailable) || 0,
          sparePartId: item.sparePartId,
          toolNo: item.toolNo,
        }));

        settableJson(rawData);
        
        console.log("Formatted table data:", tableData);

        return {
          data: tableData,
          lineCode: rawData[0]?.lineMstCode,
          toolNo: rawData[0]?.toolNo,
          date: rawData[0]?.date ? rawData[0].date.split(' ')[0] : null,
          reportId: reportId, // Store the report ID for PDF export
        };
      }
      console.log("No data returned from API");
      return null;
    } catch (err) {
      console.error("getCriticalSpareDetailsById error", err);
      toast.error("Failed to fetch critical spare details");
      return null;
    }
  };

  // ================= ACTION HANDLERS =================
  const handleViewClick = async (data) => {
    try {
      console.log("View clicked with data:", data);
      
      // Show the popup first
      setShowAddCard(true);
      setShowDetails(false);
      setIsViewMode(true);
      setAddCardData([]); // Clear existing data
      
      // Start loading
      setIsViewLoading(true);
      
      // Use the key as reportId
      const reportId = data.key;
      console.log("Using reportId:", reportId);
      
      const result = await getCriticalSpareDetailsById(reportId);
      console.log("API result:", result);
      
      if (result && result.data && result.data.length > 0) {
        // Set the add card data with fetched details
        setAddCardData(result.data);
        
        // Auto-populate the form fields
        addForm.setFieldsValue({
          line: result.lineCode,
          toolId: result.toolNo,
          monthYear: result.date ? dayjs(result.date) : null,
        });
        
        // Data loaded successfully
      } else {
        toast.error("No data found for this record");
      }
    } catch (err) {
      console.error("handleViewClick error", err);
      toast.error("Failed to load critical spare details");
    } finally {
      setIsViewLoading(false);
    }
  };

  const ActionCellRenderer = (props) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <EyeOutlined 
          style={{ 
            fontSize: '16px', 
            color: '#1890ff', 
            cursor: 'pointer',
            padding: '4px'
          }}
          onClick={() => handleViewClick(props.data)}
          title="View Details"
        />
      </div>
    );
  };

  // ================= COLUMN DEFINITIONS =================
  const detailsColumns = [
    {
      headerName: "S.No",
      field: "key",
      width: 80,
      cellStyle: { textAlign: "left" },
    },
    {
      headerName: "Line",
      field: "line",
      flex: 1,
    },
    {
      headerName: "Date",
      field: "monthYear",
      flex: 1,
      cellRenderer: (params) => {
        if (params.value) {
          // Convert from YYYY-MM-DD to DD-MMM-YYYY format
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD-MMM-YYYY') : params.value;
        }
        return params.value;
      },
    },
    {
      headerName: "Created By",
      field: "createdBy",
      flex: 1,
    },
    {
      headerName: "View",
      field: "action",
      width: 100,
      cellRenderer: ActionCellRenderer,
      cellStyle: { textAlign: "center" },
      sortable: false,
      filter: false,
    },
  ];

  // ================= INPUT CHANGE HANDLERS =================
  const handleInputChange = (key, field, value) => {
    const updated = [...addCardData];
    const index = updated.findIndex((row) => row.key === key);
    if (index > -1) {
      updated[index][field] = value;
      
      // Set total available to same as stock available
      if (field === 'availableQty') {
        updated[index].totalAvailable = parseInt(value) || 0;
      }
      
      setAddCardData(updated);
    }
  };

  // ================= INSERT CRITICAL SPARE PART REPORT =================
  const insertCriticalSparePartReport = async (gridApi) => {
    try {
      const formValues = addForm.getFieldsValue();
      
      // Force grid to stop editing and commit all changes
      if (gridApi) {
        gridApi.stopEditing();
        // Small delay to ensure all changes are committed
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get current data from AgGrid API to ensure we have the latest values
      const currentData = [];
      if (gridApi) {
        gridApi.forEachNode((node) => {
          if (node.data) {
            // Create a deep copy to ensure we get the latest values
            const rowData = { ...node.data };
            currentData.push(rowData);
          }
        });
      }
      
      console.log("Current data from grid:", currentData);
      console.log("State data:", addCardData);
      
      // Always use the current state data as it's more reliable
      const dataToUse = addCardData;
      console.log("Data to use for API:", dataToUse);
      
      // Get toolNo from first row (all rows should have same toolNo)
      const toolNo = dataToUse.length > 0 ? dataToUse[0].toolNo : null;
      
      // Prepare spare parts data with current values (without toolNo)
      const sparePartsData = dataToUse.map(row => ({
        sparePartId: row.sparePartId,
        operationId: row.operationId,
        storageLocation: row.spareLocation || null,
        stockAvailable: parseInt(row.availableQty) || 0,
        needToOrder: parseInt(row.needToOrder) || 0,
        totalAvailable: parseInt(row.totalAvailable) || 0,
      }));
      
      console.log("Prepared sparePartsData:", sparePartsData);

      const payload = {
        line: formValues.line,
        toolNo: toolNo,
        tenantId,
        branchCode,
        enteredBy: employeeId,
        sparePartsData,
      };
      
      console.log("Final payload:", payload);

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
  const handleAddFormSubmit = async (gridApi) => {
    try {
      const formValues = addForm.getFieldsValue();
      if (!formValues.line) {
        toast.error("Please fill all mandatory(*) fields");
        return;
      }

      const success = await insertCriticalSparePartReport(gridApi);
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
      headerName: "Tool Description",
      field: "toolDescription",
      cellStyle: { backgroundColor: '#f5f5f5' },
    },
    {
      headerName: "Operation Description",
      field: "operationDescription",
      cellStyle: { backgroundColor: '#f5f5f5' },
      rowSpan: (params) => {
        const value = params.value;
        const api = params.api;
        let span = 1;
        let rowIndex = params.node.rowIndex;

        while (
          api.getDisplayedRowAtIndex(rowIndex + span) &&
          api.getDisplayedRowAtIndex(rowIndex + span).data.operationDescription ===
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

        if (prevRow && prevRow.data.operationDescription === params.value) {
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
          api.getDisplayedRowAtIndex(rowIndex + span).data.operationDescription ===
            value
        ) {
          span++;
        }

        return <div className="tool-section-label">{value}</div>;
      },
    },
    {
      headerName: "S.No",
      field: "sno",
      cellStyle: { backgroundColor: '#f5f5f5' },
      cellRenderer: (params) => (params.data.isSection ? "" : params.value),
    },
    {
      headerName: "Critical spares",
      field: "criticalSpares",
      cellStyle: { backgroundColor: '#f5f5f5' },
      cellRenderer: (params) =>
        params.data.isSection ? "" : params.value,
    },
    {
      headerName: "Spares Min Qty",
      field: "minQty",
      cellStyle: { backgroundColor: '#f5f5f5' },
      cellRenderer: (params) =>
        params.data.isSection ? "" : params.value,
    },
    {
      headerName: "Spare location",
      field: "spareLocation",
      editable: !isViewMode,
      cellEditor: 'agTextCellEditor',
    },
    {
      headerName: "Spares stock Qty",
      field: "availableQty",
      editable: !isViewMode,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
      },
      cellStyle: (params) => {
        const availableQty = parseInt(params.value) || 0;
        const minQty = parseInt(params.data.minQty) || 0;
        if (availableQty < minQty) {
          return {
            border: '2px solid red',
            color: 'black'
          };
        }
        return null;
      },
    },
    {
      headerName: "Need to order",
      field: "needToOrder",
      editable: !isViewMode,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
      },
    },
    {
      headerName: "Total Available",
      field: "totalAvailable",
      cellStyle: { backgroundColor: '#f5f5f5' },
      cellRenderer: (params) =>
        params.data.isSection ? "" : params.data.availableQty || 0,
    },
  ];


   const downloadExcel = async () => {
    let reportId = null;
      
      if (isViewMode && addCardData.length > 0) {
        // In view mode, get the ID from the stored context
        const viewedRecord = detailsData.find(item => item.key);
        reportId = viewedRecord?.key;
      } else {
        // Fallback to finding from current data
        const currentViewData = detailsData.find(item => 
          addCardData.length > 0 && item.key
        );
        reportId = currentViewData?.key;
      }
      
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
        requestPath: 'critical-spare-export',
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


  // const downloadExcel = async () => {
  //   try {
  //     // Get the report ID from the current view context or from the viewed record
  //     let reportId = null;
      
  //     if (isViewMode && addCardData.length > 0) {
  //       // In view mode, get the ID from the stored context
  //       const viewedRecord = detailsData.find(item => item.key);
  //       reportId = viewedRecord?.key;
  //     } else {
  //       // Fallback to finding from current data
  //       const currentViewData = detailsData.find(item => 
  //         addCardData.length > 0 && item.key
  //       );
  //       reportId = currentViewData?.key;
  //     }
      
  //     if (!reportId) {
  //       toast.error("No report data available for export");
  //       return;
  //     }

  //     const payload = {
  //       id: reportId,
  //       tenantId,
  //       branchCode,
  //       logoPath: "/images/logo.png"
  //     };

  //     console.log("PDF Export payload:", payload);

  //     const accessToken = store.get('accessToken');
      
  //     const response = await axios.post(
  //       `${process.env.REACT_APP_API_URL || 'http://localhost:8901'}/traceability/critical-spare-export`,
  //       payload,
  //       {
  //         responseType: 'blob',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'Authorization': `Bearer ${accessToken}`
  //         }
  //       }
  //     );

  //     console.log("Response status:", response.status);
  //     console.log("Response headers:", response.headers);
  //     console.log("Response data size:", response.data.size);
  //     console.log("Response data type:", response.data.type);
      
  //     // Check if response is actually a PDF
  //     if (response.data.size === 0) {
  //       toast.error("Received empty file from server");
  //       return;
  //     }
      
  //     // Check content type
  //     const contentType = response.headers['content-type'];
  //     console.log("Content type:", contentType);
      
  //     // Read first few bytes to check if it's a valid PDF
  //     const arrayBuffer = await response.data.arrayBuffer();
  //     const uint8Array = new Uint8Array(arrayBuffer);
  //     const firstBytes = Array.from(uint8Array.slice(0, 10)).map(b => String.fromCharCode(b)).join('');
  //     console.log("First 10 bytes as string:", firstBytes);
  //     console.log("First 10 bytes as hex:", Array.from(uint8Array.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
  //     // Check if it starts with PDF header
  //     if (!firstBytes.startsWith('%PDF')) {
  //       console.error("Response is not a valid PDF file");
  //       // Try to read as text to see what we got
  //       const text = new TextDecoder().decode(uint8Array);
  //       console.error("Response as text:", text.substring(0, 500));
  //       toast.error("Server returned invalid PDF data");
  //       return;
  //     }

  //     const file = new Blob([arrayBuffer], { type: 'application/pdf' });
  //     const fileURL = URL.createObjectURL(file);
  //     console.log("Created blob URL:", fileURL);
  //     console.log("Final blob size:", file.size);
      
  //     // Create download link
  //     const link = document.createElement('a');
  //     link.href = fileURL;
  //     link.download = `CriticalSpareList_${dayjs().format('YYYY-MM-DD')}.pdf`;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
      
  //     // Clean up after a delay to ensure download completes
  //     setTimeout(() => {
  //       URL.revokeObjectURL(fileURL);
  //     }, 1000);
      
  //     toast.success("PDF exported successfully");
  //   } catch (error) {
  //     console.error("Error exporting PDF:", error);
  //     if (error.response) {
  //       console.error("Error response status:", error.response.status);
  //       console.error("Error response data:", error.response.data);
  //     }
  //     toast.error("Failed to export PDF");
  //   }
  // };



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
              <Form.Item label="Line" name="line" rules={[{ required: true, message: "Please select Line" }]}>
                <Select
                  placeholder="Select Line"
                  onChange={handleLineChange}
                  allowClear
                >
                  <Option value="getAll">Get All</Option>
                  {lineList.map((line) => (
                    <Option key={line.value} value={line.value}>
                      {line.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Tool Desc dropdown hidden */}

            <Col span={4}>
              <Form.Item
                label="Month/Year"
                name="monthYear"
                initialValue={dayjs()}
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
            <Button 
              type="primary"
              onClick={handleCancel}
              style={{
                backgroundColor: "#00264d",
                borderColor: "#00264d",
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card>

      {showDetails && (
        <Card
          title="Critical Spare Parts Summary"
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <div style={{ position: "relative" }}>
            {isDetailsLoading && (
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
            <div
              className="ag-theme-alpine"
              style={{ height: 400, width: "100%" }}
            >
              <AgGridReact
                rowData={detailsData}
                columnDefs={detailsColumns}
                domLayout="normal"
                pagination={true}
                paginationPageSize={10}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                overlayNoRowsTemplate="No Data Available"
              />
            </div>
          </div>
        </Card>
      )}

      {/* ================= ADD POPUP PAGE ================= */}
      {showAddCard && (
        <Card
          title={isViewMode ? "Critical Spare Details" : "Add Critical Spare Parts Details"}
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          style={{ marginTop: 20, borderRadius: 8 }}
        >
          <Form layout="vertical" form={addForm} onValuesChange={handleAddFormChange}>
            <style>
              {`
                .ant-select-disabled .ant-select-selector {
                  background-color: white !important;
                  color: black !important;
                }
                .ant-select-disabled .ant-select-selection-item {
                  color: black !important;
                }
                .ant-picker-disabled {
                  background-color: white !important;
                  color: black !important;
                }
                .ant-picker-disabled .ant-picker-input > input {
                  color: black !important;
                }
              `}
            </style>
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Line" name="line" rules={[{ required: true, message: "Please select Line" }]}>
                  <Select
                    placeholder="Select Line"
                    options={addLineList}
                    onChange={handleAddLineChange}
                    allowClear
                    disabled={isViewMode}
                    style={{
                      backgroundColor: isViewMode ? 'white' : undefined,
                      color: isViewMode ? 'black' : undefined
                    }}
                  />
                </Form.Item>
              </Col>

              {/* Tool Desc dropdown hidden */}

              <Col span={4}>
                <Form.Item label="Date" name="monthYear" initialValue={dayjs()}>
                  <DatePicker
                    format="DD-MMM-YYYY"
                    placeholder="Select Date"
                    style={{ 
                      width: "100%",
                      backgroundColor: 'white',
                      color: 'black'
                    }}
                    disabled={true}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ position: "relative" }}>
              {(isLoading || isViewLoading) && (
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
                  overlayNoRowsTemplate="No Data Available"
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    flex: 1,
                  }}
                  onGridReady={(params) => {
                    window.gridApi = params.api;
                  }}
                  onFirstDataRendered={(params) => {
                    if (params.columnApi && params.columnApi.getAllColumns) {
                      const allColumnIds = params.columnApi.getAllColumns().map((col) => col.getId());
                      params.api.autoSizeColumns(allColumnIds);
                    }
                  }}
                  onCellValueChanged={(params) => {
                    // Update the React state directly to ensure consistency
                    const updated = [...addCardData];
                    const index = updated.findIndex(row => row.key === params.data.key);
                    
                    if (index > -1) {
                      updated[index][params.colDef.field] = params.newValue;
                      
                      // Handle specific field updates
                      if (params.colDef.field === 'availableQty') {
                        const availableQty = parseInt(params.newValue) || 0;
                        updated[index].totalAvailable = availableQty;
                        params.node.setDataValue('totalAvailable', availableQty);
                        params.api.refreshCells({ rowNodes: [params.node], columns: ['totalAvailable'] });
                      }
                      
                      setAddCardData(updated);
                    }
                    
                    console.log('Cell value changed:', {
                      field: params.colDef.field,
                      oldValue: params.oldValue,
                      newValue: params.newValue,
                      rowKey: params.data.key,
                      updatedState: updated[index]
                    });
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              {!isViewMode && (
                <Button
                  type="primary"
                  onClick={() => handleAddFormSubmit(window.gridApi)}
                  style={{
                    marginRight: 10,
                    backgroundColor: "#00264d",
                    borderColor: "#00264d",
                  }}
                >
                  Submit
                </Button>
              )}
              <Button 
                type="primary"
                onClick={handleCancel}
                style={{
                  backgroundColor: "#00264d",
                  borderColor: "#00264d",
                }}
              >
                {isViewMode ? "Close" : "Cancel"}
              </Button>

              {isViewMode && (
                <Button
                  type="primary"
                  disabled
                  style={{
                    display: "none",
                    marginLeft: 10,
                    backgroundColor: "#00264d",
                    borderColor: "#00264d",
                    cursor: "not-allowed",
                    color: "white",
                  }}
                >
                  Export
                </Button>
              )}

            </div>
          </Form>
        </Card>
      )}
    </>
  );
};

export default CriticalSparePartsList;
