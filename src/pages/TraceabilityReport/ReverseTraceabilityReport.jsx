import moment from "moment";
import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Table,
  Form,
  Row,
  Col,
  Typography,
  Space,
  message,
  Select,
} from 'antd';
import {
  DownloadOutlined
} from '@ant-design/icons';
import { backendService } from "../../../src/service/ToolServerApi";
import store from 'store';
import { toast } from 'react-toastify';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ReverseTraceabilityReport = () => {
  const [form] = Form.useForm();
  const { Option } = Select;
  const [childPartDescription, setChildPartDescription] = useState('');
  const [childPartDescriptionData, setChildPartDescriptionData] = useState([]);
  const [serialData, setSerialData] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const tenantId = store.get('tenantId')
  const branchCode = store.get('branchCode')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const response = await backendService({
      requestPath: "getchildpartMasterdtl",
      requestData: {
        tenantId,
        branchCode,
        isActive: "1"
      }
    });
    if (response?.responseCode === '200') {
      setChildPartDescriptionData(response.responseData)
    } else {
      setChildPartDescriptionData([])
    }
  }

  const handleChildPartChange = (value) => {
    const code = (value || "").trim();

    if (!code) {
      setChildPartDescription("");
      return;
    }

    const found = childPartDescriptionData.find(
      (p) =>
        (p.childPartCode || "").toLowerCase() === code.toLowerCase()
    );

    setChildPartDescription(
      found ? found.childPartDesc || "" : ""
    );
  };


  const handleSubmit = async () => {
    const data = form.getFieldsValue()
    const { childPartCode, lotNumber } = data;
    if (!childPartCode || !childPartCode.trim() || !lotNumber || !lotNumber.trim()) {
      message.error("Please fill all mandatory fields: Child Part Code and Lot Number.");
      return;
    }
    const response = await backendService({
      requestPath: "getReverseTraceDtl",
      requestData: {
        tenantId,
        branchCode,
        lotNo: lotNumber,
        childPartCode,
      }
    });
    if (response?.responseCode === '200') {
      console.log(response?.responseData, "response--")
      const data = (response?.responseData || []).map((item, index) => ({
        ...item,
        logId: index + 1,
      }));
      setSerialData(data);
      setShowResults(true);
      toast.success(`Found ${data.length} records`);
    } else {
      setSerialData([]);
      setShowResults(false);
      toast.error(response.responseMessage);
    }
  };

  const onReset = () => {
    form.resetFields();
    setChildPartDescription('');
    setSerialData([]);
    setShowResults(false);
  };

  const onExportExcel = async () => {
    console.log('data')
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Operation Master Report");

      // === Row Height for header ===
      worksheet.getRow(1).height = 60;

      // === Define Columns ===
      worksheet.columns = [
        { header: "Log ID	", key: "logId", width: 20 },
        { header: "Serial Number", key: "serialNumber", width: 25 },
        { header: "Shift Date	", key: "shiftDate", width: 25 },
        { header: "Shift", key: "shift", width: 25 },
      ];

      // === Insert Left Logo (Valeo) ===
      try {
        const imgResponse = await fetch("/pngwing.com.png");
        const imgBlob = await imgResponse.blob();
        const arrayBuffer = await imgBlob.arrayBuffer();
        const imageId = workbook.addImage({
          buffer: arrayBuffer,
          extension: "png",
        });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          br: { col: 1, row: 1 },
          editAs: "oneCell",
        });
      } catch {
        console.warn("Logo not found — skipping image insert.");
      }

      // === Title Cell ===
      worksheet.mergeCells("B1:D2");
      const titleCell = worksheet.getCell("B1");
      titleCell.value = "Reverse Traceability Report";
      titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      // === Date (top right) ===
      worksheet.mergeCells("E1:F2");
      const dateCell = worksheet.getCell("E1");
      dateCell.value = `Generated On: ${moment().format("DD/MM/YYYY HH:mm:ss")}`;
      dateCell.font = { bold: true, size: 11, color: { argb: "FF00264D" } };
      dateCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

      // === Insert Right Logo (SmartRun) ===
      try {
        const secondImgResponse = await fetch("/smartrunLogo.png");
        const secondImgBlob = await secondImgResponse.blob();
        const secondArrayBuffer = await secondImgBlob.arrayBuffer();
        const secondImageId = workbook.addImage({
          buffer: secondArrayBuffer,
          extension: "png",
        });
        worksheet.mergeCells("G1:H2");
        worksheet.addImage(secondImageId, {
          tl: { col: 6, row: 0 },
          br: { col: 8, row: 2 },
          editAs: "oneCell",
        });
      } catch {
        console.warn("SmartRun logo not found — skipping right logo insert.");
      }

      // === Header Row ===
      const headerRow = worksheet.addRow([
        "Log ID	",
        "Serial Number",
        "Shift Date",
        "Shift",
      ]);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      headerRow.height = 25;

      // === AutoFilter ===
      worksheet.autoFilter = {
        from: { row: headerRow.number, column: 1 },
        to: { row: headerRow.number, column: worksheet.columns.length },
      };

      // === Data Rows ===
      serialData.forEach((item) => {
        const newRow = worksheet.addRow({
          logId: item.logId || "",
          serialNumber: item.serialNumber || "",
          shiftDate: item.shiftDate
            ? moment(item.shiftDate).format("DD-MMM-YYYY")
            : "",
          shift: item.shift || "",
        });

        newRow.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { size: 10 };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // === Save File ===
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `Reverse_Traceability_Report_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting to Excel. Please try again.");
    }
  };


  // Table columns
  const columns = [
    {
      title: 'Log ID',
      dataIndex: 'logId',
      key: 'logId',
      render: (text, record, index) => index + 1,
      align: 'center'
    },
    {
      title: 'Serial Number',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      render: (text) => text || 'N/A',
      align: 'center'
    },
    {
      title: 'Shift Date',
      dataIndex: 'shiftDate',
      key: 'shiftDate',
      render: (text) => text ? moment(text).format('DD-MMM-YYYY') : '',
      align: 'center'
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      render: (text) => text || 'N/A',
      align: 'center'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1800px', margin: '0 auto' }}>
      {/* Search Form Card */}
      <Card
        title="Reverse Traceability Report"
        headStyle={{ backgroundColor: '#001f3e', color: '#fff' }}
        style={{ marginBottom: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          // onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={10} sm={5}>
              <Form.Item
                label="Child Part Code"
                name="childPartCode"
                rules={[{ required: true, message: 'Please enter Child Part Code!' }]}
              >
                <Input
                  placeholder="Enter child part code"
                  onChange={(e) => handleChildPartChange(e.target.value)}
                />
              </Form.Item>
            </Col>

            <Col xs={10} sm={8}>
              <Form.Item label="Child Part Description">
                <Input
                  value={childPartDescription}
                  placeholder="Description will auto-populate"
                  readOnly
                />
              </Form.Item>
            </Col>

            <Col xs={10} sm={5}>
              <Form.Item
                label="Lot Number"
                name="lotNumber"
                rules={[{ required: true, message: 'Please enter Lot Number!' }]}
              >
                <Input
                  placeholder="Enter lot number"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="center">
            <Col>
              <Space size="middle">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{ backgroundColor: '#001F3E' }}
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
                <Button
                  htmlType="button"
                  onClick={onReset}
                  size="large"
                  style={{ backgroundColor: '#001F3E', color: '#fff' }}
                >
                  Cancel
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
      {serialData.length > 0 && (
        <Button
          onClick={() => onExportExcel()}
          style={{ display: showResults ? 'inline-block' : 'none', margin: 5 }}
        >
          Export to PDF
        </Button>
      )}
      {/* Results Card */}
      {showResults && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              {/* <Title level={3} style={{ margin: 0, color: '#fff' }}> */}
              Child Part Traceability - Serial Number Details
            </div>
          }
          headStyle={{ backgroundColor: '#001f3e' }}
        >
          <Table
            columns={columns}
            dataSource={serialData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            locale={{
              emptyText: serialData.length === 0 ?
                'No records found for the specified criteria.' : undefined
            }}
            scroll={{ x: 800 }}
            size="middle"
            bordered
          />
        </Card>
      )}
    </div>
  );
};

export default ReverseTraceabilityReport;
