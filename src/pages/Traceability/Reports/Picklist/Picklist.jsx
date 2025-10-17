import React, { useState } from "react";
import { Table, Button, Modal, Card, Select, Input, Form, Row, Col } from "antd";
import { PlusCircleOutlined, PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import { FaQrcode } from "react-icons/fa";
import QRCode from "antd/lib/qr-code";
import html2canvas from "html2canvas";
import "./style.css";
import { useNavigate } from "react-router-dom";

 

const { Option } = Select;

const Picklist = () => {
  const navigate = useNavigate();
  // Pending Picklist sample data
  const [pendingData] = useState([
    { key: 1, sno: 1, picklistCode: "PENDING-001",product:"MSIL Z12E 200 OE",line:"Disc Assy", createdDate: "20-Sep-2025",shift:"A", status: "Pending", issueStatus: "Open" },
    { key: 2, sno: 2, picklistCode: "PENDING-002",product:"MSIL YTA 200 OE",line:"Cover Assy",  createdDate: "21-Sep-2025",shift:"B", status: "Pending", issueStatus: "Open" },
  ]);

  // Completed Picklist sample data
  const [completedData] = useState([
    { key: 1, sno: 1, picklistCode: "VACPUMP-L1/JUN-2025/463/6543",product:"MSIL Z12E 200 OE",line:"Disc Assy",  createdDate: "03-Jun-2025",shift:"A", status: "Completed", issueStatus: "Completed" },
    { key: 2, sno: 2, picklistCode: "VACPUMP-L1/MAY-2025/463/6528",product:"MSIL YTA 200 OE",line:"Cover Assy",  createdDate: "27-May-2025",shift:"B", status: "Completed", issueStatus: "Completed" },
    { key: 3, sno: 3, picklistCode: "VACPUMP-L1/MAY-2025/463/6521",product:"MSIL Z12E 200 OE",line:"Disc Assy",  createdDate: "24-May-2025",shift:"C", status: "Completed", issueStatus: "Completed" },
  ]);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLineFeeder, setShowLineFeeder] = useState(false);
  const [currentPage, setCurrentPage] = useState("main"); // main | printPage
  const [selectedPrintPart, setSelectedPrintPart] = useState(null);
  const [selectType, setSelectedType] = useState(null);
  const [showPrintDetails, setShowPrintDetails] = useState(false);
   

  // QR modal states
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState("");

  // QR Handlers
  const handleViewQR = (qrData) => {
    setSelectedQrData(qrData);
    setQrModalVisible(true);

    setTimeout(() => {
   handleDownloadQR();
  }, 500); // 0.5s delay to ensure QR is rendered
  };

  const handleDownloadQR = () => {
    const qrElement = document.getElementById("qr-code-container");
    html2canvas(qrElement).then((canvas) => {
      const imageURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageURL;
      link.download = `QRCode-${Date.now()}.png`;
      link.click();
    });
  };

  // Line Feeder Details Table
  const today = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).replace(/ /g, "-").toLowerCase();
  const lineFeederData = [
    { key: 1, sno: 1, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "CF72760", childPartDesc: "Cushion Disc - MSIL  Z12E 200 UX OE", type: "A1", fromSub: "STORES", locator: "LOC-001", lotNumber: "LOT-001", picklistQty: 1000 },
    { key: 2, sno: 2, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "CF72760HF", childPartDesc: "Cushion Disc HF - MSIL  Z12E 200 UX OE", type: "A1", fromSub: "STORES", locator: "LOC-002", lotNumber: "LOT-002", picklistQty: 1000 },
    { key: 3, sno: 3, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "CF72760TE", childPartDesc: "Cushion Disc Temp - MSIL  Z12E 200 UX OE", type: "A1", fromSub: "STORES", locator: "LOC-001", lotNumber: "LOT-001", picklistQty: 1000 },
    { key: 4, sno: 4, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "612050700H", childPartDesc: "Steel Coil-MSIL Z12E Cushion Disc205X0.7", type: "A1", fromSub: "STORES", locator: "LOC-002", lotNumber: "LOT-002", picklistQty: 226 },
    { key: 5, sno: 5, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "1069282", childPartDesc: "Rivet - Cushion Disc DW", type: "A2", fromSub: "STORES", locator: "LOC-002", lotNumber: "LOT-002", picklistQty: 4000 },
    { key: 6, sno: 6, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "KRPA00024", childPartDesc: "Kitting RP Assy - MARUTI F8D 180KX", type: "A2", fromSub: "STORES", locator: "LOC-002", lotNumber: "LOT-002", picklistQty: 1000 },
    { key: 7, sno: 7, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "CF86479", childPartDesc: "Retainer Plate - MSIL Z12E FW Side", type: "A2", fromSub: "STORES", locator: "LOC-001", lotNumber: "LOT-001", picklistQty: 1000 },
    { key: 8, sno: 8, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "CF86479HT", childPartDesc: "Retainer Plate HT - MSIL Z12E FW Side", type: "A2", fromSub: "STORES", locator: "LOC-002", lotNumber: "LOT-002", picklistQty: 1000 },
    { key: 9, sno: 9, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "CF86479BL", childPartDesc: "Retainer Plate BL - MSIL Z12E FW Side", type: "B2", fromSub: "STORES", locator: "LOC-001", lotNumber: "LOT-001", picklistQty: 1000 },
    { key: 10, sno: 10, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "612801700", childPartDesc: "Steel Coil - MSIL Z12E R/P 280 X 1.7", type: "B2", fromSub: "STORES", locator: "LOC-001", lotNumber: "LOT-001", picklistQty: 263 },
    { key: 11, sno: 11, date: today, operation: "Disc Assy - MSIL Z12E 200 OE", childPartCode: "CF86495", childPartDesc: "Friction Bush - MSIL Z12E FW Side", type: "C", fromSub: "STORES", locator: "LOC-002", lotNumber: "LOT-002", picklistQty: 1000 },
  ];

  const lineFeederColumns = [
    { title: "S.No", dataIndex: "sno", key: "sno" },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Product & Line ", dataIndex: "operation", key: "operation" },
    { title: "Child Part Code", dataIndex: "childPartCode", key: "childPartCode" },
    { title: "Child Part Description", dataIndex: "childPartDesc", key: "childPartDesc" },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "FromSub", dataIndex: "fromSub", key: "fromSub" },
    { title: "Locator", dataIndex: "locator", key: "locator" },
    { title: "Lot Number", dataIndex: "lotNumber", key: "lotNumber" },
    { title: "Picklist Qty", dataIndex: "picklistQty", key: "picklistQty" },
    { title: "Status", dataIndex: "status", key: "status", render: () => <FaQrcode size={18} color="#002147" /> },
    {
  title: "Action",
  dataIndex: "action",
  key: "action",
  render: (_, record) =>
    record.type === "A2" || record.type === "B2" ? (
      <Button
        type="link"
        icon={<PrinterOutlined />}
        onClick={() => {
          setSelectedType(record.type);
          setSelectedPrintPart(record.childPartCode);
          setCurrentPage("printPage");
          setShowPrintDetails(false);
        }}
      >
        Print
      </Button>
    ) : record.type === "C" ? (
      <Button
        type="link"
        icon={<PrinterOutlined />}
        onClick={() => {
           setSelectedType(record.type);
           navigate("/Kittingprocessscreen");

        }}
      >
        Print
      </Button>
    ) : null,
}

  ];

  // Columns for Pending Picklist
  const pendingColumns = [
    { title: "S.No", dataIndex: "sno", key: "sno" },
    {
      title: "Picklist Code",
      dataIndex: "picklistCode",
      key: "picklistCode",
      render: (text) => (
        <Button
          type="link"
          onClick={() => {
            setShowLineFeeder(true);
            setCurrentPage("main");
          }}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    { title: "Product", dataIndex: "product", key: "product" },
    { title: "Line", dataIndex: "line", key: "line" },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
    { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Issue Status", dataIndex: "issueStatus", key: "issueStatus" },
  ];

  const completedColumns = [
    { title: "S.No", dataIndex: "sno", key: "sno" },
    { title: "Picklist Code", dataIndex: "picklistCode", key: "picklistCode" },
    { title: "Product", dataIndex: "product", key: "product" },
    { title: "Line", dataIndex: "line", key: "line" },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
     { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Issue Status", dataIndex: "issueStatus", key: "issueStatus" },
  ];

  // Print Page - B2 details sample table
  const printB2Data = [
    { key: 1, product: "Product A", line: "Line 1", workOrder: "WO-001", childPart: "Child Part X (CPX-001)", addQty: 50 },
    { key: 2, product: "Product B", line: "Line 2", workOrder: "WO-002", childPart: "Child Part Y (CPY-002)", addQty: 75 },
    { key: 3, product: "Product C", line: "Line 3", workOrder: "WO-003", childPart: "Child Part Z (CPZ-003)", addQty: 100 },
    { key: 4, product: "Product A", line: "Line 1", workOrder: "WO-001", childPart: "Child Part X (CPX-001)", addQty: 25 },
    { key: 5, product: "Product B", line: "Line 2", workOrder: "WO-002", childPart: "Child Part Y (CPY-002)", addQty: 60 },
  ];

  const printB2Columns = [
    { title: "Product", dataIndex: "product", key: "product" },
    { title: "Line", dataIndex: "line", key: "line" },
    { title: "Work Order", dataIndex: "workOrder", key: "workOrder" },
    { title: "Child Part", dataIndex: "childPart", key: "childPart" },
    { title: "Add Quantity", dataIndex: "addQty", key: "addQty" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          icon={<FaQrcode size={18} color="#002147" />}
          onClick={() => handleViewQR(record.childPart)}
        />
      ),
    },
  ];

  // Utility: render picklist card
  const renderPicklist = (title, data, columns, showAddButton = false) => (
    <div className="picklist-container">
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={title}
        extra={
          showAddButton && (
            <Button
              type="link"
              onClick={() => setIsModalOpen(true)}
              icon={<PlusCircleOutlined style={{ fontSize: "20px", color: "#fff" }} />}
            />
          )
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 5 }}
          bordered
          locale={{ emptyText: "No data available in table" }}
        />
      </Card>
    </div>
  );

  return (
    <>
      {/* MAIN PAGE */}
      {currentPage === "main" && (
        <>
          {renderPicklist("Pending Picklist", pendingData, pendingColumns, true)}

          {/* Show Line Feeder below Pending Picklist */}
          {showLineFeeder && (
            <Card headStyle={{ backgroundColor: "#00264d", color: "white" }} title="Picklist Verification">
              <Table
                columns={lineFeederColumns}
                dataSource={lineFeederData}
                bordered
                pagination={{ pageSize: 5 }}
              />
              <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                <Button type="primary" style={{ marginRight: "5px" }}>Partially Approved</Button>
                <Button type="primary">Submit</Button>
              </div>
            </Card>
          )}

          {/* Hide Completed Picklist when Line Feeder is open */}
          {!showLineFeeder && (
            <div style={{ marginTop: "30px" }}>
              {renderPicklist("Completed Picklist", completedData, completedColumns)}
            </div>
          )}
        </>
      )}

      {/* PRINT PAGE */}
      {currentPage === "printPage" && (
        <>
          {/* Print Page - Form */}
          <Card
            headStyle={{ backgroundColor: "#00264d", color: "white" }}
            title={`Print Page - ${selectType}`}
            style={{ marginTop: "20px" }}
          >
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={4}>
                  <Form.Item label="Product">
                    <Select placeholder="Select Product">
                      <Option value="prod1">Product 1</Option>
                      <Option value="prod2">Product 2</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Line">
                    <Select placeholder="Select Line">
                      <Option value="line1">Line 1</Option>
                      <Option value="line2">Line 2</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Work Order">
                    <Select placeholder="Select Work Order">
                      <Option value="wo1">Work Order 1</Option>
                      <Option value="wo2">Work Order 2</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Child Part">
                    <Select value={selectedPrintPart}>
                      <Option value={selectedPrintPart}>{selectedPrintPart}</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Add Quantity">
                    <Input type="number" placeholder="Enter Quantity" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: "center" }}>
                <Button
                  type="primary"
                  style={{ marginRight: "5px" }}
                  onClick={() => setShowPrintDetails(true)}
                >
                  Submit
                </Button>
                <Button
                  type="primary"
                  onClick={() => setShowPrintDetails(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>

            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <Button onClick={() => setCurrentPage("main")}>Back</Button>
            </div>
          </Card>

          {/* Print Page - B2 Details Table (only show after Submit) */}
          {showPrintDetails && (
            <Card
              headStyle={{ backgroundColor: "#00264d", color: "white" }}
              title={`Print Page - ${selectType}`}
              style={{ marginTop: "20px" }}
            >
              <Table
                columns={printB2Columns}
                dataSource={printB2Data}
                bordered
                pagination={{ pageSize: 5 }}
              />
            </Card>
          )}
        </>
      )}

      {/* QR Modal */}
      <Modal
        title="QR Code Details"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
    <div
      key="footer"
      style={{
        width: "100%",
        textAlign: "center", // centers buttons
      }}
    >
      <Button key="close" onClick={() => setQrModalVisible(false)}>
        Close
      </Button>
    </div>,
  ]}
        centered
        width={400}
      >
        <div
          id="qr-code-container"
          style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}
        >
          <QRCode value={selectedQrData} size={200} />
        </div>
      </Modal>
    </>
  );
};

export default Picklist;
