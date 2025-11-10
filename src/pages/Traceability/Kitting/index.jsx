import React, { useState, useEffect } from "react";
import {
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Button,
  Table,
  DatePicker,
  Modal,
  message,
} from "antd";
import PicklistWODropdown from "../../Traceability/Kitting/dropdownService";
import serverApi from "../../../serverAPI";
import QRModal from "../../Traceability/Reports/Picklist/QRModal";

const { Option } = Select;

const ChildPartValidationCard = ({ 
  plsCode, 
  childPartCode, 
  kitPartCode, 
  kitPartDesc, 
  onValidationComplete 
}) => {
  const [scannedValue, setScannedValue] = useState("");
  const [indicatorColor, setIndicatorColor] = useState("#d9d9d9");
  const [isVerified, setIsVerified] = useState(false);

  const handleScanChange = async (e) => {
    const scanned = e.target.value.trim();
    setScannedValue(scanned);

    if (!scanned) {
      setIndicatorColor("#d9d9d9");
      setIsVerified(false);
      if (onValidationComplete) onValidationComplete(kitPartCode, false);
      return;
    }

    try {
      const payload = {
        scannedCode: scanned,          
        subChildPartCode: kitPartCode,  
      };

      const response = await serverApi.post("/verifySubChildPart", payload);
      const resData = response.data;

      // Handle success response
      if (resData.responseCode === "200" && resData.responseDataMessage === "true") {
        setIndicatorColor("green");
        setIsVerified(true);
        message.success("Child part successfully verified");
        if (onValidationComplete) onValidationComplete(kitPartCode, true);
      } else {
        setIndicatorColor("red");
        setIsVerified(false);
        message.error(resData.responseDataMessage || "Verification failed");
        if (onValidationComplete) onValidationComplete(kitPartCode, false);
      }
    } catch (error) {
      console.error("Error verifying child part:", error);
      message.error("Error verifying child part");
      setIndicatorColor("red");
      setIsVerified(false);
      if (onValidationComplete) onValidationComplete(kitPartCode, false);
    }
  };

  return (
    <Card
      size="small"
      title={`Child Part ${kitPartCode} - ${kitPartDesc}`}
      headStyle={{
        backgroundColor: "#f0f0f0",
        color: "#001F3E",
        fontSize: "12px",
      }}
      style={{ marginRight: 8 }}
    >
      <Form layout="vertical">
        <Form.Item label="PLS Code">
          <Input value={plsCode} disabled />
        </Form.Item>

        <Form.Item label="Child Part Code ">
          <Input value={childPartCode} disabled />
        </Form.Item>
        
        <Form.Item label="Sub Child Part">
          <Input value={kitPartCode} disabled />
        </Form.Item>

        <Form.Item label="Scan Barcode">
          <Input
            placeholder="Scan barcode here"
            value={scannedValue}
            onChange={(e) => setScannedValue(e.target.value)}
            onBlur={handleScanChange}
          />
        </Form.Item>

        <Form.Item>
          <Button
            style={{
              backgroundColor: indicatorColor,
              borderColor: indicatorColor,
              color: "white",
              cursor: "default",
            }}
            block
            disabled
          >
            {indicatorColor === "green"
              ? "✓ Childpart Code and Scan Barcode Match"
              : indicatorColor === "red"
              ? "✗ Childpart Code and Scan Barcode No Match"
              : "Waiting for Scan"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

const LabelPrintCard = ({ 
  childPartCode, 
  planQty, 
  onPrint, 
  onCancel 
}) => {
  const [form] = Form.useForm();
  const [scanCount, setScanCount] = useState("");
  const [labelValue, setLabelValue] = useState("");

  const handleScanCountChange = (e) => {
    const value = e.target.value;
    setScanCount(value);
    
    const scanCountNum = Number(value) || 0;
    const planNum = Number(planQty) || 0;
    const calculatedLabel = scanCountNum > 0 ? Number((planNum / scanCountNum).toFixed(2)) : 0;
    setLabelValue(calculatedLabel.toString());
    form.setFieldsValue({ label: calculatedLabel.toString() });
  };

  const handlePrint = () => {
    form.validateFields().then(values => {
      if (onPrint) {
        onPrint({
          childPartCode: values.childPartCode,
          scanCount: values.scanCount,
          label: values.label
        });
      }
    });
  };

  return (
    <Card
      title="Label Printing"
      headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
      style={{ marginTop: 16 }}
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={{
          childPartCode: childPartCode,
          plan: planQty,
          scanCount: "",
          label: ""
        }}
      >
        <Row gutter={[16, 8]}>
          <Col span={6}>
            <Form.Item label="Child Part Code" name="childPartCode">
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item label="Plan" name="plan">
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              label="Scan Count"
              name="scanCount"
              rules={[{ required: true, message: "Please enter scan count" }]}
            >
              <Input
                placeholder="Enter scan count"
                value={scanCount}
                onChange={handleScanCountChange}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item label="Label" name="label">
              <Input value={labelValue} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end">
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handlePrint}
            style={{ backgroundColor: "#001F3E", color: "white" }}
          >
            Print
          </Button>
        </Row>
      </Form>
    </Card>
  );
};

const Kitting = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [showKittingCard, setShowKittingCard] = useState(false);
  const [showLabelCard, setShowLabelCard] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [form] = Form.useForm();
  const [planOptions, setPlanOptions] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [allChildPartsVerified, setAllChildPartsVerified] = useState(false);
  const [formChanged, setFormChanged] = useState(false);

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState(null);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));

  // Fetch available Work Orders / Plans
  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await PicklistWODropdown(tenantId, branchCode);
      const data = Array.isArray(response.data) ? response.data : response;
      setPlanOptions(
        data.map((item) => ({
          code: item.plsCode,
        }))
      );
      if (data.length === 0) {
        message.info("No work orders found");
      }
    } catch (err) {
      console.error("Error fetching work order plans:", err);
      message.error("Failed to load work orders");
      setPlanOptions([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch Kitting Part Details
  const fetchKittingPartDetails = async (planCode) => {
    setLoadingParts(true);
    try {
      const payload = { tenantId, plscode: planCode };
      const response = await serverApi.post("/getKittingPartDetails", payload);
      const data = response.data.responseData || response.data || [];

      if (!Array.isArray(data) || data.length === 0) {
        message.info("No Kitting part details found for this plan");
        setTableData([]);
        setShowTable(false);
        return;
      }

      const formatted = data.map((item, index) => ({
        key: index + 1,
        plsdId: item.plsdId,
        childPartCode: item.childPartCode,
        childPartDesc: item.childPartDesc,
        itemType: item.itemType,
        picklistQty: item.picklistQty,
        pickedQty: item.pickedQty,
        productCode: item.productCode,
      }));

      setTableData(formatted);
      setShowTable(true);
    } catch (error) {
      console.error("Error fetching kitting details:", error);
      message.error("Failed to fetch Kitting part details");
    } finally {
      setLoadingParts(false);
    }
  };

  // Handle form submit (fetch table)
  const handleSubmit = async (values) => {
    setSelectedPlan(values.plan);
    setSelectedDate(values.date);
    setShowKittingCard(false);
    setShowLabelCard(false);
    setVerificationStatus({});
    setAllChildPartsVerified(false);
    setFormChanged(false);
    await fetchKittingPartDetails(values.plan);
  };

  // Handle form field changes
  const handleFormChange = (changedValues, allValues) => {
    // Check if either date or plan has changed from the current submitted values
    const isDateChanged = changedValues.date && selectedDate !== changedValues.date;
    const isPlanChanged = changedValues.plan && selectedPlan !== changedValues.plan;
    
    if (isDateChanged || isPlanChanged) {
      setFormChanged(true);
      // Hide all cards when form changes
      setShowTable(false);
      setShowKittingCard(false);
      setShowLabelCard(false);
    }
  };

  // When a row (part) is clicked
  const handlePartClick = async (record) => {
    setSelectedPart(record);
    setShowKittingCard(true);
    setShowLabelCard(false);
    setVerificationStatus({});
    setAllChildPartsVerified(false);

    try {
      const payload = {
        tenantId,
        childPartCode: record.childPartCode,
        branchCode,
      };
      const response = await serverApi.post(
        "/getKittingChildPartDetails",
        payload
      );

      const rawData = response.data?.responseData;
      const data = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];

      if (data.length > 0) {
        setSelectedPart((prev) => ({
          ...prev,
          childParts: data,
        }));
        
        // Initialize verification status for all child parts
        const initialStatus = {};
        data.forEach(part => {
          initialStatus[part.kitPartCode] = false;
        });
        setVerificationStatus(initialStatus);
      } else {
        message.info("No child part details found for this part");
        setVerificationStatus({});
      }
    } catch (error) {
      console.error("Error fetching child part details:", error);
      message.error("Failed to fetch child part details");
      setVerificationStatus({});
    }

    setTimeout(() => {
      document
        .getElementById("kitting-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Handle validation completion from child parts
  const handleValidationComplete = (kitPartCode, isVerified) => {
    setVerificationStatus(prev => ({
      ...prev,
      [kitPartCode]: isVerified
    }));
  };

  // Check if all child parts are verified
  useEffect(() => {
    if (selectedPart?.childParts && Object.keys(verificationStatus).length > 0) {
      const allVerified = selectedPart.childParts.every(
        part => verificationStatus[part.kitPartCode] === true
      );
      setAllChildPartsVerified(allVerified);
      
      if (allVerified) {
        message.success("All child parts have been verified successfully!");
      }
    }
  }, [verificationStatus, selectedPart]);

  // Handle label print button click
  const handleLabelPrintClick = () => {
    if (!allChildPartsVerified) return;
    setShowLabelCard(true);
    
    setTimeout(() => {
      document
        .getElementById("label-print-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Handle label print submission
  const handleLabelPrint = (printData) => {
    setSelectedQrData(printData.childPartCode || "QR123");
    setQrModalVisible(true);
  };

  // Handle label card close
  const handleLabelCardClose = () => {
    setShowLabelCard(false);
  };

  // Table Columns
  const columns = [
    { title: "PLSD ID", dataIndex: "plsdId", key: "plsdId" },
    {
      title: "Child Part Code",
      dataIndex: "childPartCode",
      key: "childPartCode",
      render: (text, record) => (
        <a
          onClick={() => handlePartClick(record)}
          style={{ color: "#1890ff", cursor: "pointer", textDecoration: "underline" }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Child Part Description",
      dataIndex: "childPartDesc",
      key: "childPartDesc",
    },
    { title: "Item Type", dataIndex: "itemType", key: "itemType" },
    { title: "Picklist Qty", dataIndex: "picklistQty", key: "picklistQty", align: "right" },
    { title: "Picked Qty", dataIndex: "pickedQty", key: "pickedQty", align: "right" },
    { title: "Product Code", dataIndex: "productCode", key: "productCode" },
  ];

  // Render Child Part Cards using the separate validation card component
  const renderChildPartCard = () => {
    const childParts = selectedPart?.childParts || [];

    if (childParts.length === 0) {
      return (
        <Col xs={24}>
          <Card>
            <p>No child parts available for this item.</p>
          </Card>
        </Col>
      );
    }

    return (
      <Col xs={24}>
        <Row gutter={[8, 8]}>
          {childParts.map((part, i) => (
            <Col span={8} key={i}>
              <ChildPartValidationCard
                plsCode={selectedPlan}
                childPartCode={selectedPart?.childPartCode || "--"}
                kitPartCode={part.kitPartCode || "--"}
                kitPartDesc={part.kitPartDesc || "--"}
                onValidationComplete={handleValidationComplete}
              />
            </Col>
          ))}
        </Row>

        {/* Label Print Button */}
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Button
              style={{ 
                backgroundColor: allChildPartsVerified ? "#001F3E" : "#d9d9d9", 
                color: allChildPartsVerified ? "white" : "#666666",
                borderColor: allChildPartsVerified ? "#001F3E" : "#d9d9d9"
              }}
              block
              onClick={handleLabelPrintClick}
              disabled={!allChildPartsVerified}
            >
              {allChildPartsVerified 
                ? "Label Print" 
                : `Complete ${Object.values(verificationStatus).filter(Boolean).length}/${childParts.length} Child Parts`}
            </Button>
          </Col>
        </Row>
      </Col>
    );
  };

  return (
    <>
      {/* Top Form */}
      <div style={{ marginBottom: 16 }}>
        <Card title="Kitting Process" headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}>
          <Form 
            layout="vertical" 
            form={form} 
            onFinish={handleSubmit}
            onValuesChange={handleFormChange}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item 
                  label="Date" 
                  name="date"
                  rules={[{ required: true, message: "Please select date" }]}
                >
                  <DatePicker 
                    style={{ width: "100%" }} 
                    onChange={(date) => {
                      setFormChanged(true);
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="WO/Plan"
                  name="plan"
                  rules={[{ required: true, message: "Please select a plan" }]}
                >
                  <Select 
                    placeholder="Select Work Order" 
                    loading={loadingPlans} 
                    allowClear
                    onChange={(value) => {
                      if (value) {
                        setFormChanged(true);
                      }
                    }}
                  >
                    {planOptions.map((plan) => (
                      <Option key={plan.code} value={plan.code}>
                        {plan.code}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row justify="center" style={{ marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{ backgroundColor: "#001F3E", borderColor: "#001F3E", color: "white" }}
              >
                Submit
              </Button>
              <Button
                style={{ marginLeft: 8,backgroundColor: "#001F3E", borderColor: "#001F3E", color: "white" }}
                onClick={() => {
                  form.resetFields();
                  setShowTable(false);
                  setShowKittingCard(false);
                  setShowLabelCard(false);
                  setVerificationStatus({});
                  setAllChildPartsVerified(false);
                  setFormChanged(false);
                  setSelectedPlan(null);
                  setSelectedDate(null);
                }}
              >
                Cancel
              </Button>
            </Row>

            {/* Warning message when form is changed */}
            {/* {formChanged && (
              <Row style={{ marginTop: 8 }}>
                <Col span={24}>
                  <div style={{ 
                    backgroundColor: '#fffbe6', 
                    border: '1px solid #ffe58f', 
                    padding: '8px 12px', 
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                  </div>
                </Col>
              </Row>
            )} */}
          </Form>
        </Card>
      </div>

      {/* Table */}
      {showTable && (
        <div style={{ marginBottom: 16 }}>
          <Card
            title={`Work Order Details - Plan ${selectedPlan}`}
            headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
          >
            <Table
              columns={columns}
              dataSource={tableData}
              loading={loadingParts}
              pagination={{ pageSize: 5 }}
              bordered
            />
          </Card>
        </div>
      )}

      {/* Child Part Card */}
      {showKittingCard && (
        <div id="kitting-card">
          <Card
            title={`Kitting - ${selectedPart?.childPartDesc || ""}`}
            headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
            extra={
              <span style={{ color: "#fff", fontSize: 14 }}>
                Child Part Code: {selectedPart?.childPartCode}
              </span>
            }
          >
            {renderChildPartCard()}
          </Card>
        </div>
      )}

      {/* Label Print Card - Shows as new card instead of modal */}
      {showLabelCard && (
        <div id="label-print-card">
          <LabelPrintCard
            childPartCode={selectedPart?.childPartCode || ""}
            planQty={selectedPart?.picklistQty || 0}
            onPrint={handleLabelPrint}
            onCancel={handleLabelCardClose}
          />
        </div>
      )}

      {/* QR Preview Modal */}
      <QRModal
        qrModalVisible={qrModalVisible}
        setQrModalVisible={setQrModalVisible}
        selectedQrData={selectedQrData}
      />
    </>
  );
};

export default Kitting;