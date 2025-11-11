import React, { useState, useEffect } from "react";
import { Card, Form, Row, Col, Select, Input, Button, Table, DatePicker } from "antd";
import moment from "moment";
import { toast } from "react-toastify";
import serverApi from "../../../../serverAPI";
import { Label } from "recharts";
import { backendService } from "../../../../service/ToolServerApi";
import store from "store";

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
  setPrintB2Data,
  handleViewQR,
}) => {
  const [addQty, setAddQty] = useState(0);
  const [binCount, setBinCount] = useState(0);
  const [picklistOptions, setPicklistOptions] = useState([]); // ✅ store API response here
  const [selectedPicklist, setSelectedPicklist] = useState(null); // ✅ selected picklist code
  const [childPartOptions, setChildPartOptions] = useState([]); // ✅ store child part options
  const [selectedChildPart, setSelectedChildPart] = useState(null);
  const [standPickQty, setStandPickQty] = useState([]);
  const [planQty, setPlanQty] = useState("");
  const binQty = 200; // fixed bin quantity
  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const empId = store.get("employeeId")
  const [noOfLabels, setNoOfLabels] = useState(0);
  const [printform] = Form.useForm()

  const handleAddQtyChange = (e) => {
    const value = Number(e.target.value);
    const standardQty = Number(printform.getFieldValue("pickedQty") || 0);
    const binQty = Number(printform.getFieldValue("binQty") || 0);
    const label = value > 0 ? Math.floor(binQty / value) : 0;
    if (value <= standardQty) {
      printform.setFieldsValue({
        addQty: value,
      })
      setNoOfLabels(label);
    } else {
      printform.resetFields(["addQty"]);
      toast.warning(`Add Quantity cannot exceed ${standardQty}`);
    }
  };


  const handlePicklistCodetoChildParts = (picklistCode) => {
    setSelectedPicklist(picklistCode)
    fetchPlscodetoChildPartDetails(picklistCode);
  }

  useEffect(() => {
    if (qrData) {
      printform.setFieldsValue({
        custName: qrData.customerSno,
        supCode: qrData.supplierCode,
        packageNo: qrData.packageNo,
        deliveryDate: qrData.deliveryDate ? moment(qrData.deliveryDate, "YYYY-MM-DD") : null,
        manufacturingDate: qrData.manufactureDate ? moment(qrData.manufactureDate, "YYYY-MM-DD") : null,
        scanQty: qrData.quantity,
      });
    }
    fetchPicklistPLSDetails();
  }, [qrData, addQty, binCount, printform]);

  const handleSubmitData = async () => {
    const formValues = printform.getFieldsValue()
    const part = childPartOptions.find(item => item.childPartDesc === formValues.childPart) || {};
    try {
      const response = await backendService({
        requestPath: 'insertAndUpdatePrintPage',
        requestData: {
          picklistCode: formValues.pickListCode,
          childPartCode: part.childPartCode,
          planQuantity: formValues.planQty,
          scanQrCode: formValues.qrCode,
          itemType: 'A2',
          customerSno: formValues.custName,
          supplierCode: formValues.supCode,
          packageNo: formValues.packageNo,
          deliveryDate: formValues.deliveryDate.format("YYYY-MM-DD"),
          manufacturingDate: formValues.manufacturingDate.format("YYYY-MM-DD"),
          scannedQuantity: formValues.scanQty,
          inputQuantity: formValues.addQty,
          binQuantity: formValues.binQty,
          BinCountQuantity: formValues.binQty,
          binCount: noOfLabels,
          tenantId,
          branchCode,
          createdBy: empId,
        }
      })
      if (response) {
        if (response.responseCode === '200') {
          if (response.responseData !== null && response.responseData.length > 0) {
            const updatedData = response.responseData.map((item, index) => ({
              ...item,
              sno: index + 1,
            }));
            console.log(updatedData, "updatedData--------")
            setPrintB2Data(updatedData)
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPickedAndStandardQty = async (childCode) => {
    try {
      const response = await serverApi.post("getPLSCodePickedQuantity", {
        tenantId,
        branchCode,
        plsCode: printform.getFieldValue("pickListCode"),
        itemType: "A2",
        childPartCode: childCode
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        console.log("Fetched PickedQty Details:", res.responseData);
        setStandPickQty(res.responseData);
        const firstItem = res.responseData[0] || {};
        printform.setFieldsValue({
          binQty: firstItem.standardQuantity || "",
          pickedQty: firstItem.pickedQuantity || ""
        });
      } else {
        setStandPickQty([]);
        printform.setFieldsValue({
          binQty: "0",
          pickedQty: "0"
        });
      }
    } catch (error) {
      toast.error("Error fetching picked quantity. Please try again later.");
    }
  }
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
        itemType: "A2",
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

  const handleChildPartCode = (val) => {
    const part = childPartOptions.find(item => item.childPartDesc === val) || {};
    setSelectedChildPart(val);
    printform.setFieldsValue({
      planQty: part.planQty || ""
    });
    fetchPickedAndStandardQty(part.childPartCode)
  }

  const handleCancel = () => {
    printform.resetFields()
  }

  return (
    <>
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={`Print Page - ${selectType}`}
        style={{ marginTop: "20px" }}
      >
        <Form form={printform} layout="vertical">
          <Row gutter={16}>
            {/* ✅ Dynamic Picklist Select Box */}
            <Col span={4}>
              <Form.Item name="pickListCode" label="PickList Code">
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
              <Form.Item name="childPart" label="Child Part">
                <Select
                  placeholder="Select Child Part"
                  value={selectedChildPart}
                  onChange={(value) => handleChildPartCode(value)}
                  allowClear
                  showSearch
                >
                  {childPartOptions.map((item, index) => (
                    <Option key={item.childPartCode} value={item.childPartDesc}>
                      {item.childPartDesc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item name="planQty" label="Plan Quantity">
                <Input type="number" placeholder="Enter Quantity" value={planQty} readOnly disabled />
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item name="qrCode" label="Scan QR">
                <Input type="text" placeholder="Scan QR" onBlur={handleQrBlur} />
              </Form.Item>
            </Col>

            {qrData && (
              <>
                <Col span={4}>
                  <Form.Item name="custName" label="Customer SNo">
                    <Input readOnly disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="supCode" label="Supplier Code">
                    <Input readOnly disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="packageNo" label="Package No">
                    <Input readOnly disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="deliveryDate" label="Delivery Date">
                    <DatePicker format="YYYY-MM-DD" disabled style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="manufacturingDate" label="Manufacturing Date">
                    <DatePicker format="YYYY-MM-DD" disabled style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="scanQty" label="Scanned Quantity">
                    <Input type="number" placeholder="Enter Quantity" disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="addQty" label="Add Quantity">
                    <Input
                      type="number"
                      placeholder="Enter Quantity"
                      onChange={handleAddQtyChange}
                    />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="binQty" label="Bin Quantity">
                    <Input type="number" placeholder="Bin Quantity" readOnly disabled />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
          {qrData && (
            <div style={{ marginTop: 16, fontWeight: 500 }}>
              No. of Labels: {noOfLabels}
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              style={{ marginRight: "5px" }}
              onClick={() => { setShowPrintDetails(true); handleSubmitData() }}
            >
              Submit
            </Button>
            <Button type="primary" onClick={() => { setShowPrintDetails(false); handleCancel() }}>
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
