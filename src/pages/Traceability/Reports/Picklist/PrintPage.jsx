// PrintPage.js
import React , {useState} from "react";
import { Card, Form, Row, Col, Select, Input, Button, Table, DatePicker } from "antd";
import moment from "moment";

const { Option } = Select;

const PrintPage = ({
  selectType,
  selectedPrintPart,
  qrData,
  setQrValue,
  showPrintDetails,
  setShowPrintDetails,
  setCurrentPage,
  handleQrBlur,
  printB2Columns,
  printB2Data,
  handleViewQR,
}) => {

  const [addQty, setAddQty] = useState(0);
  const [binCount, setBinCount] = useState(0);
  const binQty = 200; // fixed bin quantity

  const handleAddQtyChange = (e) => {
    console.log("Add Quantity Changed:", e.target.value);
    const value = Number(e.target.value);
    setAddQty(value);

    // Calculate bin count dynamically
    if (value > 0 && value <= Number(qrData.quantity)) {
      const count = Math.ceil(value / binQty);
      setBinCount(count);
    } else {
      setBinCount(0);
    }
  };

  return (
    <>
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
              <Form.Item label="Plan Quantity">
                <Input type="number" placeholder="Enter Quantity" value={100000} />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item label="Scan QR">
                <Input type="text" placeholder="Scan QR" onBlur={handleQrBlur} />
              </Form.Item>
            </Col>

            {qrData && (
              <>
                <Col span={4}>
                  <Form.Item label="Customer SNo">
                    <Input value={qrData.customerSno} readOnly />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Supplier Code">
                    <Input value={qrData.supplierCode} readOnly />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Package No">
                    <Input value={qrData.packageNo} readOnly />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Delivery Date">
                    <DatePicker
                      value={qrData?.deliveryDate ? moment(qrData.deliveryDate, "YYYY-MM-DD") : null}
                      format="YYYY-MM-DD"
                      readOnly
                      disabled
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Manufacturing Date">
                    <DatePicker
                      value={qrData?.manufactureDate ? moment(qrData.manufactureDate, "YYYY-MM-DD") : null}
                      format="YYYY-MM-DD"
                      readOnly
                      disabled
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="Scanned Quantity">
                    <Input type="number" placeholder="Enter Quantity" value={qrData.quantity} />
                  </Form.Item>
                </Col>

                 <Col span={4}>
              <Form.Item label="Add Quantity">
                <Input type="number" placeholder="Enter Quantity" value={addQty} onChange={handleAddQtyChange} />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item label="Bin Count">
                <Input type="number" placeholder="Bin Count" value={binCount} />
              </Form.Item>
            </Col>
              </>
            )}
          </Row>

          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              style={{ marginRight: "5px" }}
              onClick={() => setShowPrintDetails(true)}
            >
              Submit
            </Button>
            <Button type="primary" onClick={() => setShowPrintDetails(false)}>
              Cancel
            </Button>
          </div>
        </Form>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <Button onClick={() => setCurrentPage("main")}>Back</Button>
        </div>
      </Card>

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
  );
};

export default PrintPage;
