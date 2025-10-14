import React, { useState } from "react";
import { Card, Select, Row, Col, Button, Typography, Progress } from "antd";
import "antd/dist/reset.css";
import "./style.css";

const { Option } = Select;
const { Text } = Typography;

const TraceabilityLog = () => {
  const [line, setLine] = useState(null);
  const [product, setProduct] = useState(null);
  const [workOrder, setWorkOrder] = useState(null);
  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = () => {
    const newErrors = {};
    if (!line) newErrors.line = "Please select a Line";
    if (!product) newErrors.product = "Please select a Product";
    if (!workOrder) newErrors.workOrder = "Please select a Work Order";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShowDetails(true);
    } else {
      setShowDetails(false);
    }
  };

  const handleCancel = () => {
    setShowDetails(false);
    setErrors({});
  };

  return (
    <div className="traceability-container">
      {/* Traceability Log Card */}
      <Card
        title="Traceability Log"
        headStyle={{
          backgroundColor: "#00264d",
          color: "white",
          fontWeight: "bold",
          fontSize: "16px",
        }}
        bodyStyle={{ padding: "24px" }}
        bordered={false}
        className="traceability-card"
      >
        {/* Dropdown Section */}
        <Row gutter={24} style={{ marginBottom: "24px" }}>
          <Col xs={24} md={8}>
            <Text strong>
              Line<span className="required">*</span>
            </Text>
            <Select
              placeholder="Select"
              value={line}
              onChange={(value) => setLine(value)}
              style={{ width: "100%", marginTop: 6 }}
            >
              <Option value="Line-1">Line 1</Option>
              <Option value="Line-2">Line 2</Option>
            </Select>
            {errors.line && <div className="error-text">{errors.line}</div>}
          </Col>

          <Col xs={24} md={8}>
            <Text strong>
              Product<span className="required">*</span>
            </Text>
            <Select
              placeholder="Select"
              value={product}
              onChange={(value) => setProduct(value)}
              style={{ width: "100%", marginTop: 6 }}
            >
              <Option value="Product-A">Product A</Option>
              <Option value="Product-B">Product B</Option>
            </Select>
            {errors.product && (
              <div className="error-text">{errors.product}</div>
            )}
          </Col>

          <Col xs={24} md={8}>
            <Text strong>
              Work Order<span className="required">*</span>
            </Text>
            <Select
              placeholder="Select"
              value={workOrder}
              onChange={(value) => setWorkOrder(value)}
              style={{ width: "100%", marginTop: 6 }}
            >
              <Option value="WO-001">WO-001</Option>
              <Option value="WO-002">WO-002</Option>
            </Select>
            {errors.workOrder && (
              <div className="error-text">{errors.workOrder}</div>
            )}
          </Col>
        </Row>

        {/* Submit & Cancel Buttons */}
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Button
            type="primary"
            style={{
              backgroundColor: "#00264d",
              color: "#fff",
              fontWeight: "bold",
              width: 120,
              marginRight: 16,
            }}
            onClick={handleSubmit}
          >
            Submit
          </Button>
          <Button type="default" style={{ width: 120 }} onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </Card>

      {/* Traceability Log Details Card */}
      {showDetails && (
        <Card
          title="Traceability Log Details"
          headStyle={{
            backgroundColor: "#00264d",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          bodyStyle={{ padding: "24px" }}
          bordered={false}
          className="traceability-card"
          style={{ marginTop: 24 }}
        >
          {/* Table Wrapper */}
          <div className="table-wrapper">
            {/* Header */}
            <Row
              className="table-header"
              style={{
                fontWeight: "bold",
                background: "#f2f2f2",
                textAlign: "center",
                padding: "8px 0",
              }}
            >
              <Col span={10}>Station Bin Barcode</Col>
              <Col span={14}>Child Part Lot Barcode</Col>
            </Row>

            {/* Table Content */}
            <div className="table-content">
              <div className="vertical-grey-line"></div>

              {/* OP 20 */}
              <Row align="middle" className="table-row">
                <Col span={10} className="cell-center">
                  <div className="green-box">OP 20</div>
                </Col>
                <Col span={14}>
                  <div className="green-box shifted-box">Diaphragm</div>
                  <div style={{ width: 120, marginTop: 4 }}>
                    <Progress
                      percent={50}
                      size="small"
                      showInfo={false}
                      strokeWidth={6}
                    />
                  </div>
                </Col>
              </Row>

              {/* OP 30 */}
              <Row align="middle" className="table-row">
                <Col span={10} className="cell-center">
                  <div className="green-box">OP 30</div>
                </Col>
                <Col span={14}>
                  <div style={{ display: "flex", gap: "40px", marginLeft: 20 }}>
                    {/* Column 1 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div className="green-box">Cover Plate</div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={50}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div className="green-box">Delta Rivet</div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={50}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>

                    {/* Fulcrum Ring */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div className="green-box">Fulcrum Ring</div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={50}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* OP 40 */}
              <Row align="top" className="table-row">
                <Col span={10} className="cell-center">
                  <div className="grey-box">OP 40</div>
                </Col>
                <Col span={14}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {/* Column 1 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div className="green-box shifted-box">
                        Cover Assembly
                      </div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={30}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div className="grey-box shifted-box">Drive Strap</div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={50}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* OP 50 */}
              <Row align="top" className="table-row">
                <Col span={10} className="cell-center">
                  <div className="grey-box">OP 50</div>
                </Col>
                <Col span={14}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    {/* Column 1 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div className="grey-box shifted-box">Pressure Plate</div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={40}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div className="grey-box shifted-box">Pressure Rivet</div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={60}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* OP 60B */}
              <Row align="middle" className="table-row">
                <Col span={10} className="cell-center">
                  <div className="grey-box">OP 60B</div>
                </Col>
                <Col span={14}>
                  <div className="grey-box shifted-box">Balancing Plate</div>
                  <div style={{ width: 120, marginTop: 4 }}>
                    <Progress
                      percent={25}
                      size="small"
                      showInfo={false}
                      strokeWidth={6}
                    />
                  </div>
                </Col>
              </Row>
            </div>

            {/* Next Process Button */}
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <Button
                type="primary"
                style={{
                  backgroundColor: "#00264d",
                  color: "#fff",
                  fontWeight: "bold",
                  width: "180px",
                  height: "40px",
                  borderRadius: "6px",
                }}
              >
                Next Process
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TraceabilityLog;
