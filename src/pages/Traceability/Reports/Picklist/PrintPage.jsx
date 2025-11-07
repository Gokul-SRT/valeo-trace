import React, { useState, useEffect } from "react";
import { Card, Form, Row, Col, Select, Input, Button, Table, DatePicker } from "antd";
import moment from "moment";
import { toast } from "react-toastify";
import serverApi from "../../../../serverAPI";

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
  const [picklistOptions, setPicklistOptions] = useState([]); // ✅ store API response here
  const [selectedPicklist, setSelectedPicklist] = useState(null); // ✅ selected picklist code
  const [childPartOptions, setChildPartOptions] = useState([]); // ✅ store child part options

  const binQty = 200; // fixed bin quantity
  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));

  const handleAddQtyChange = (e) => {
    const value = Number(e.target.value);
    setAddQty(value);

    // Calculate bin count dynamically
    if (value > 0 && qrData?.quantity && value <= Number(qrData.quantity)) {
      const count = Math.ceil(value / binQty);
      setBinCount(count);
    } else {
      setBinCount(0);
    }
  };


  const handlePicklistCodetoChildParts = (picklistCode) => {
    // Implement logic to fetch and set child parts based on selected picklist code
    console.log("Selected Picklist Code:", picklistCode);
    fetchPlscodetoChildPartDetails(picklistCode);
  }

  useEffect(() => {
    fetchPicklistPLSDetails();
  }, []);

  const fetchPicklistPLSDetails = async () => {
    try {
      const response = await serverApi.post("getPicklistWO", {
        tenantId,
        branchCode,
        planDate: "",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        console.log("Fetched PLS Details:", res.responseData);
        setPicklistOptions(res.responseData);
      } else {
        setPicklistOptions([]);
      }
    } catch (error) {
      toast.error("Error fetching picklist codes. Please try again later.");
    }
  };


  const fetchPlscodetoChildPartDetails = async (plsCode) => {
    try {
      const response = await serverApi.post("getPicklistCodetoChildPartCode", {
        tenantId,
        branchCode,
        plsCode: plsCode,
        itemType :"A2",
        childPartCode: ""
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        console.log("Fetched Product Details:", res.responseData);
        setChildPartOptions(res.responseData);
      } else {
        setChildPartOptions([]);
      }
    } catch (error) {
      toast.error("Error fetching picklist codes. Please try again later.");
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
            {/* ✅ Dynamic Picklist Select Box */}
            <Col span={4}>
              <Form.Item label="PickList Code">
                <Select
                  placeholder="Select PickList Code"
                  value={selectedPicklist}
                  onChange={(value) => handlePicklistCodetoChildParts(value)}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {picklistOptions.map((item, index) => (
                    <Option key={index} value={item.plsCode}>
                      {item.plsCode}
                    </Option>
                  ))}
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
                      value={
                        qrData?.deliveryDate ? moment(qrData.deliveryDate, "YYYY-MM-DD") : null
                      }
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
                      value={
                        qrData?.manufactureDate
                          ? moment(qrData.manufactureDate, "YYYY-MM-DD")
                          : null
                      }
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
                    <Input
                      type="number"
                      placeholder="Enter Quantity"
                      value={addQty}
                      onChange={handleAddQtyChange}
                    />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Bin Count">
                    <Input type="number" placeholder="Bin Count" value={binCount} readOnly />
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
