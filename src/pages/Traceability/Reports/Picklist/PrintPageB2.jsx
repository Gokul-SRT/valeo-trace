import React from "react";
import { Card, Form, Row, Col, Input, Button, Select, Table } from "antd";
const { Option } = Select;

const PrintPageB2 = ({
  selectedPrintPart,
  selectType,
  qrData,
  handleQrBlur,
  setCurrentPage,
  showPrintDetails,
  setShowPrintDetails,
  printB2Columns,
  printB2Data
}) => {
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
              <Form.Item label="Add Quantity">
                <Input type="number" placeholder="Enter Quantity" />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item label="Scan QR">
                <Input type="text" placeholder="Scan QR" onBlur={handleQrBlur} />
              </Form.Item>
            </Col>

            {qrData && (
              <>
                <Col span={4}><Form.Item label="Customer SNo"><Input value={qrData.customerSno} readOnly /></Form.Item></Col>
                <Col span={4}><Form.Item label="Supplier Code"><Input value={qrData.supplierCode} readOnly /></Form.Item></Col>
                <Col span={4}><Form.Item label="Package No"><Input value={qrData.packageNo} readOnly /></Form.Item></Col>
                <Col span={4}><Form.Item label="Delivery Date"><Input value={qrData.deliveryDate} readOnly /></Form.Item></Col>
                <Col span={4}><Form.Item label="Manufacturing Date"><Input value={qrData.manufactureDate} readOnly /></Form.Item></Col>
              </>
            )}
          </Row>

          <div style={{ textAlign: "center" }}>
            <Button type="primary" style={{ marginRight: "5px" }} onClick={() => setShowPrintDetails(true)}>Submit</Button>
            <Button type="primary" onClick={() => setShowPrintDetails(false)}>Cancel</Button>
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
          <Table columns={printB2Columns} dataSource={printB2Data} bordered pagination={{ pageSize: 5 }} />
        </Card>
      )}
    </>
  );
};

export default PrintPageB2;
