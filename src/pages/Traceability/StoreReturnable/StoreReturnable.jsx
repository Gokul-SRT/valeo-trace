import React, { useState, useEffect } from "react";
import moment from "moment";
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Card,
  Form,
  Select,
  Button,
  Space,
  Row,
  Col,
  Table,
  Dropdown,
  Modal,
  QRCode,
  Input,
} from "antd";
import html2canvas from "html2canvas";

const { Option } = Select;
const { Search } = Input;

const StoreReturnable = () => {
  const [returnChildPart, setReturnChildPart] = useState(null);
  const [pickListCode, setPickListCode] = useState(null);
  const [childPartCode, setChildPartCode] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [childPartScan, setChildPartScan] = useState("");
  const [remainQty, setRemainQty] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const returnChildPartOptions = [
    { id: 1, name: "Pending Qty" },
    { id: 2, name: "Full Qty" },
  ];

  const pickListCodes = [
    { id: 1, name: "PL-001" },
    { id: 2, name: "PL-002" },
    { id: 3, name: "PL-003" },
  ];

  const childPartCodes = [
    { id: 1, name: "CF86625SF", pickList: "PL-001" },
    { id: 2, name: "CF89046SF", pickList: "PL-001" },
    { id: 3, name: "CF72760", pickList: "PL-002" },
    { id: 4, name: "CF72760HF", pickList: "PL-002" },
    { id: 5, name: "CF89045", pickList: "PL-003" },
  ];

  const dataSource = [
    {
      key: 1,
      date: moment().format("YYYY-MM-DD"),
      product: "MSIL Z12E 200 OE",
      line: "Disc Assy",
      workOrder: "WO-001",
      childPart: "CF72760",
      quantity: "1,000",
    },
    {
      key: 2,
      date: moment().format("YYYY-MM-DD"),
      product: "MSIL Z12E 200 OE",
      line: "Disc Assy",
      workOrder: "WO-002",
      childPart: "CF72760HF",
      quantity: 75,
    },
    {
      key: 3,
      date: moment().format("YYYY-MM-DD"),
      product: "MSIL Z12E 200 OE",
      line: "Disc Assy",
      workOrder: "WO-003",
      childPart: "CF72760TE",
      quantity: 100,
    },
    {
      key: 4,
      date: moment().format("YYYY-MM-DD"),
      product: "MSIL YTA 200 OE",
      line: "Cover Assy",
      workOrder: "WO-001",
      childPart: "CF89045",
      quantity: 25,
    },
    {
      key: 5,
      date: moment().format("YYYY-MM-DD"),
      product: "MSIL YTA 200 OE",
      line: "Cover Assy",
      workOrder: "WO-002",
      childPart: "CF89045HP",
      quantity: 60,
    },
    {
      key: 6,
      date: moment().format("YYYY-MM-DD"),
      product: "MSIL YTA 200 OE",
      line: "Cover Assy",
      workOrder: "WO-002",
      childPart: "CF89045BL",
      quantity: 60,
    },
  ].map((row) => ({
    ...row,
    qrCode: JSON.stringify(row),
  }));

  const columns = [
    { title: "Date", dataIndex: "date", key: "date", width: 120 },
    { title: "Product", dataIndex: "product", key: "product", width: 150 },
    { title: "Line", dataIndex: "line", key: "line", width: 100 },
    {
      title: "Work Order",
      dataIndex: "workOrder",
      key: "workOrder",
      width: 130,
    },
    {
      title: "Child Part",
      dataIndex: "childPart",
      key: "childPart",
      width: 200,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
    },
    {
      title: "Action",
      key: "action",
      width: 220,
      align: "center",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "1",
                label: "View QR Code",
                icon: <EyeOutlined />,
                onClick: () => handleViewQR(record.qrCode),
              },
              {
                key: "2",
                label: "Download QR Code",
                icon: <DownloadOutlined />,
                onClick: () => handleDownloadQR(record.qrCode),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="primary" style={{ backgroundColor: "#00264d" }}>
            Actions
          </Button>
        </Dropdown>
      ),
    },
  ];

  const handleSearch = () => {
    setFilteredData(dataSource);
    setShowTable(true);
  };

  const handleReset = () => {
    setReturnChildPart(null);
    setPickListCode(null);
    setChildPartCode(null);
    setQuantity("");
    setChildPartScan("");
    setRemainQty("");
    setSearchText("");
    setShowTable(false);
  };

  const handleViewQR = (qrData) => {
    setSelectedQrData(qrData);
    setQrModalVisible(true);
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

  const handlePrintQR = () => {
    const qrElement = document.getElementById("qr-code-container");
    html2canvas(qrElement).then((canvas) => {
      const imageURL = canvas.toDataURL("image/png");
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${imageURL}" />
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  };

  const handleReturnChildPartChange = (value) => {
    setReturnChildPart(value);
    // Reset other fields when changing return type
    setPickListCode(null);
    setChildPartCode(null);
    setQuantity("");
    setChildPartScan("");
    setRemainQty("");
  };

  const handlePickListChange = (value) => {
    setPickListCode(value);
    setChildPartCode(null); // Reset child part when pick list changes
  };

  useEffect(() => {
    if (searchText) {
      setFilteredData(
        dataSource.filter(
          (row) =>
            row.product.toLowerCase().includes(searchText.toLowerCase()) ||
            row.line.toLowerCase().includes(searchText.toLowerCase()) ||
            row.childPart.toLowerCase().includes(searchText.toLowerCase()) ||
            row.workOrder.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    } else {
      setFilteredData(dataSource);
    }
  }, [searchText]);

  return (
    <>
      {/* Search Form Card */}
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 24, paddingBottom: 16 }}
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={<span>Store Returnable</span>}
      >
        <Form layout="vertical">
          {/* Return Child Part Selection - Always visible */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item
                label={
                  <>
                    Return Child Part <span style={{ color: "red" }}>*</span>
                  </>
                }
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select Return Type"
                  value={returnChildPart}
                  onChange={handleReturnChildPartChange}
                  style={{ width: "100%" }}
                >
                  {returnChildPartOptions.map((option) => (
                    <Option key={option.id} value={option.name}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Pending Qty Fields */}
            {returnChildPart === "Pending Qty" && (
              <>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item
                    label={
                      <>
                        Pick List Code <span style={{ color: "red" }}>*</span>
                      </>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Select Pick List Code"
                      value={pickListCode}
                      onChange={handlePickListChange}
                      style={{ width: "100%" }}
                    >
                      {pickListCodes.map((pl) => (
                        <Option key={pl.id} value={pl.name}>
                          {pl.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item
                    label={
                      <>
                        Child Part Scan <span style={{ color: "red" }}>*</span>
                      </>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Scan Child Part"
                      value={childPartScan}
                      onChange={(e) => setChildPartScan(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item
                    label={
                      <>
                        Remain Quantity <span style={{ color: "red" }}>*</span>
                      </>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <input
                      type="number"
                      placeholder="Enter Remain Qty"
                      value={remainQty}
                      onChange={(e) => setRemainQty(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "4px 11px",
                        borderRadius: 4,
                        border: "1px solid #d9d9d9",
                      }}
                    />
                  </Form.Item>
                </Col>
              </>
            )}

            {/* Full Qty Fields */}
            {returnChildPart === "Full Qty" && (
              <>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item
                    label={
                      <>
                        Pick List Code <span style={{ color: "red" }}>*</span>
                      </>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Select Pick List Code"
                      value={pickListCode}
                      onChange={handlePickListChange}
                      style={{ width: "100%" }}
                    >
                      {pickListCodes.map((pl) => (
                        <Option key={pl.id} value={pl.name}>
                          {pl.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item
                    label={
                      <>
                        Child Part Scan <span style={{ color: "red" }}>*</span>
                      </>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder="Scan Child Part"
                      value={childPartScan}
                      onChange={(e) => setChildPartScan(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Form.Item style={{ textAlign: "center", marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                onClick={handleSearch}
                style={{ backgroundColor: "#00264d" }}
              >
                Submit
              </Button>
              <Button
                htmlType="button"
                onClick={handleReset}
                style={{ backgroundColor: "#00264d", color: "white" }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {showTable && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title="Store Returnable Details"
        >
          <div
            style={{
              marginBottom: 16,
              textAlign: "right",
              backgroundColor: "#fff",
            }}
          >
            <Input.Search
              placeholder="Search..."
              allowClear
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              enterButton={false}
            />
          </div>

          <Table
            columns={columns}
            dataSource={dataSource.filter((row) =>
              !searchText
                ? true
                : Object.values(row)
                    .join(" ")
                    .toLowerCase()
                    .includes(searchText.toLowerCase())
            )}
            pagination={{ pageSize: 5 }}
            bordered
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {/* QR Code Modal */}
      <Modal
        title="QR Code Details"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <div
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <Button
              key="download"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadQR}
              style={{ marginRight: "8px" }}
            >
              Download
            </Button>
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintQR}
              style={{ marginRight: "8px" }}
            >
              Print
            </Button>
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
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
          }}
        >
          <QRCode
            value={selectedQrData}
            size={200}
            style={{ marginBottom: "20px" }}
          />
        </div>
      </Modal>
    </>
  );
};

export default StoreReturnable;
