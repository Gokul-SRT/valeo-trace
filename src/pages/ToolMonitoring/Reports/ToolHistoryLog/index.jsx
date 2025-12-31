import React, { useRef, useState, useEffect } from "react";
import { Card, Form, Select, Row, Col, Button, DatePicker } from "antd";
import dayjs from "dayjs";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { AgGridReact } from "ag-grid-react";
import { backendService } from "../../../../service/ToolServerApi";
import store from "store";
import { toast } from "react-toastify";
import moment from "moment";
import Loader from "../../../.././Utills/Loader";

const { Option } = Select;

const ToolHistoryLog = () => {
  const [form] = Form.useForm();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [toolData, setToolData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const gridRef = useRef(null);
  const tenantId = store.get('tenantId')
  const branchCode = store.get('branchCode')

  useEffect(() => {
    toolDropDownData()
  }, []);

  const toolDropDownData = async (e) => {
    try {
      setIsLoading(true);
      const response = await backendService({
        requestPath: "gettoolmasterdtl",
        requestData: {
          lineCode: e || "getAll",
          tenantId,
          branchCode,
          status: "getAll"
        }
      });
      if (response?.responseCode === '200') {
        const options = response?.responseData.map((item) => ({
          key: item.toolNo || "",
          value: item.toolDesc || "",
        }));
        setToolData(options);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToolHistoryLog = async () => {
    const formValues = form.getFieldsValue()
    console.log(formValues, 'formValues---')
    
    // Validate mandatory fields
    if (!formValues.toolNo || !formValues.year) {
      toast.error("Please fill all mandatory fields");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await backendService({
        requestPath: 'getToolHistoryLogHdr',
        requestData: {
          toolNo: formValues.toolNo,
          tenantId,
          branchCode,
          year: formValues.year ? formValues.year.format("YYYY") : null,
        }
      })
      if (response) {
        if (response.responseCode === '200') {
          if (response.responseData !== null && response.responseData.length > 0) {
            const updatedData = response.responseData
            console.log(updatedData, "updatedData--------")
            setHistoryData(updatedData)
          }
        } else {
          setHistoryData([])
          form.resetFields()
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false);
    }
  }


  // 🔹 Grid column definitions with sorting & filtering
  const columnDefs = [
    {
      headerName: "Date",
      field: "createdDateTime",
      flex: 1,
      sortable: true,
      filter: "agTextColumnFilter",
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("DD-MMM-YYYY") : "",
    },
    {
      headerName: "Components produced in the last run (in Nos.)",
      field: "usageTillDate",
      flex: 3,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Customer",
      field: "custName",
      flex: 2,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Defects noticed",
      field: "defectsNoticed",
      flex: 2,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Rectification Done",
      field: "rectificationDone",
      flex: 2,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Rectified By",
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
  const handleExport = async () => {
    try {
      // Get document reference
      const docResponse = await backendService({
        requestPath: "getDocumentRefDetails",
        requestData: {
          documentName: "Critical Spare Parts List",
          date: moment().format("YYYY-MM-DD HH:mm:ss"),
          tenantId,
          branchCode,
        },
      });
      
      const docNo = docResponse?.responseCode === "200" ? docResponse.responseDataMessage : "";

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tool History Report");

      // --- Set column widths to match table width ---
      worksheet.getColumn(1).width = 20; // Date
      worksheet.getColumn(2).width = 35; // Components produced
      worksheet.getColumn(3).width = 20; // Customer
      worksheet.getColumn(4).width = 30; // Defects noticed
      worksheet.getColumn(5).width = 30; // Rectification Done
      worksheet.getColumn(6).width = 20; // Rectified By

      // --- Row 1 height for logos ---
      worksheet.getRow(2).height = 65;

      // --- Doc No in row 1 ---
      worksheet.mergeCells('A1:F1');
      const docNoCell = worksheet.getCell("A1");
      docNoCell.value = `Doc No: ${docNo}`;
      docNoCell.font = { bold: true, size: 12 };
      docNoCell.alignment = { horizontal: "center", vertical: "middle" };
      docNoCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // --- Insert Customer Logo in A2 ---
      const customerLogoResp = await fetch("/pngwing.com.png");
      const customerBlob = await customerLogoResp.blob();
      const customerBuffer = await customerBlob.arrayBuffer();
      const customerImageId = workbook.addImage({
        buffer: customerBuffer,
        extension: "png",
      });
      worksheet.addImage(customerImageId, { tl: { col: 0, row: 1 }, br: { col: 1, row: 2 } });

      // --- Merge cells B2:E2 for title ---
      worksheet.mergeCells('B2:E2');
      const toolNo = form.getFieldValue("toolNo");
      const toolDesc = toolData.find(tool => tool.key === toolNo)?.value || toolNo;
      const year = form.getFieldValue("year") ? form.getFieldValue("year").format("YYYY") : "";

      const middlewareCell = worksheet.getCell("B2");

      // Use rich text for multiple font sizes in the same cell
      middlewareCell.value = {
        richText: [
          { text: "Tool History Card Report\n", font: { bold: true, size: 14 } }, // main title
          { text: `Tool Desc: ${toolDesc} | Year: ${year}`, font: { size: 10 } }, // subtitle smaller
        ],
      };

      middlewareCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      middlewareCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // --- Company Logo in F2 ---
      const companyLogoResp = await fetch("/smartrunLogo.png");
      const companyBlob = await companyLogoResp.blob();
      const companyBuffer = await companyBlob.arrayBuffer();
      const companyImageId = workbook.addImage({
        buffer: companyBuffer,
        extension: "png",
      });
      worksheet.addImage(companyImageId, { tl: { col: 5, row: 1 }, br: { col: 6, row: 2 } });

      // --- Table header at row 4 ---
      const startRow = 4;
      const headers = [
        "Date",
        "Components produced in the last run (in Nos.)",
        "Customer",
        "Defects noticed",
        "Rectification Done",
        "Rectified By",
      ];
      const headerRow = worksheet.getRow(startRow);
      headers.forEach((header, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // --- Add data rows as arrays ---
      historyData.forEach((row) => {
        worksheet.addRow([
          row.createdDateTime ? moment(row.createdDateTime).format("DD-MMM-YYYY") : "",
          row.usageTillDate || "",
          row.custName || "",
          row.defectsNoticed || "",
          row.rectificationDone || "",
          row.rectifiedBy || "",
        ]);
      });

      // --- Apply borders and alignment to all data rows ---
      const totalRows = worksheet.rowCount;
      for (let i = startRow + 1; i <= totalRows; i++) {
        worksheet.getRow(i).eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
        });
      }

      // --- Save Excel file ---
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `Tool_History_Report_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Error exporting report. Please try again.");
    }
  };





  return (
    <>
      {/* 🔸 Tool History Search Card */}
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title="Tool History Card Report"
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
                name="toolNo"
                rules={[{ required: true, message: "Please select Tool Desc." }]}
              >
                <Select placeholder="Select Tool Desc.">
                  {toolData.map((tool) => (
                    <Option key={tool.key} value={tool.key}>
                      {tool.value}
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
              onClick={handleToolHistoryLog}
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

      {/* 🔸 Tool History Log Details Card */}
      {showDetails && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title={
            <span>
              Tool History Card Report Details{" "}
              {selectedTool && selectedYear && (
                <span style={{ fontSize: "14px", fontWeight: "normal" }}>
                  — Tool Desc: <b>{selectedTool}</b> | Year: <b>{selectedYear}</b> | Customer: <b>Maruti</b>
                </span>
              )}
            </span>
          }
          style={{ marginTop: "30px", borderRadius: "8px" }}
        >
          <div style={{ position: "relative" }}>
            {isLoading && (
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
            <div className="ag-theme-alpine" style={{ height: 300, width: "100%" }}>
              <AgGridReact
                ref={gridRef}
                rowData={historyData}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 25, 50, 100]}
                suppressCellFocus={true}
                domLayout="normal"
                singleClickEdit={true}
                suppressHorizontalScroll={false}
                autoSizeStrategy={{ type: 'fitGridWidth' }}
                overlayNoRowsTemplate="No Data Available"
              />
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default ToolHistoryLog;
