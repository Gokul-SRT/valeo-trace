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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [selectedChildPart, setSelectedChildPart] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [searchDate, setSearchDate] = useState(moment().format("YYYY-MM-DD"));
  const [showTable, setShowTable] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const products = [
    { id: 1, name: "MSIL Z12E 200 OE" },
    { id: 2, name: "MSIL Z12E 200 OE" },
  ];

  const lines = [
    { id: 1, name: "Disc Assy" },
    { id: 2, name: "Cover Assy" },
  ];

  const workOrders = [
    { id: 1, name: "WO-001" },
    { id: 2, name: "WO-002" },
    { id: 3, name: "WO-003" },
  ];

  const childParts = [
    { id: 1, name: "CF86625SF" },
    { id: 2, name: "CF89046SF" },
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
            //   {
            //     key: "3",
            //     label: "Print QR Code",
            //     icon: <PrinterOutlined />,
            //     onClick: () => handlePrintQR(record.qrCode),
            //   },
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
    setSelectedProduct(null);
    setSelectedLine(null);
    setSelectedWorkOrder(null);
    setSelectedChildPart(null);
    setQuantity("");
    setSearchDate(moment().format("YYYY-MM-DD"));
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
        style={{ marginBottom: 16, height: 340 }}
        bodyStyle={{ padding: 24 }}
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={<span>Store Returnable</span>}
      >
        <Form layout="vertical">
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Date">
                <input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "4px 11px",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label={
                <> Product<span style={{ color: "red" }}>*</span></>
              }>
                <Select
                  placeholder="Select Product"
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  style={{ width: "100%" }}
                >
                  {products.map((p) => (
                    <Option key={p.id} value={p.name}>
                      {p.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label={
                <> Line<span style={{ color: "red" }}>*</span></>
              }>
                <Select
                  placeholder="Select Line"
                  value={selectedLine}
                  onChange={setSelectedLine}
                  style={{ width: "100%" }}
                >
                  {lines.map((l) => (
                    <Option key={l.id} value={l.name}>
                      {l.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Work Order">
                <Select
                  placeholder="Select Work Order"
                  value={selectedWorkOrder}
                  onChange={setSelectedWorkOrder}
                  style={{ width: "100%" }}
                >
                  {workOrders.map((wo) => (
                    <Option key={wo.id} value={wo.name}>
                      {wo.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={14} sm={6} md={6}>
              <Form.Item label={
                <>Child Part <span style={{ color: "red" }}>*</span></>
              }>
                <Select
                  placeholder="Select Child Part"
                  value={selectedChildPart}
                  onChange={setSelectedChildPart}
                  style={{ width: "100%" }}
                >
                  {childParts.map((cp) => (
                    <Option key={cp.id} value={cp.name}>
                      {cp.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={14} sm={6} md={6}>
              <Form.Item label="Quantity">
                <input
                  type="number"
                  placeholder="Enter Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "4px 6px",
                    borderRadius: 4,
                    border: "1px solid #d9d9d9",
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: "center", marginTop: 24 }}>
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
