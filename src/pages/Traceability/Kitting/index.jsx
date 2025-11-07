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



const ChildPartValidationCard = ({ kitPartCode, kitPartDesc }) => {
  const [scannedValue, setScannedValue] = useState("");
  const [indicatorColor, setIndicatorColor] = useState("#d9d9d9");

  const handleScanChange = async (e) => {
    const scanned = e.target.value.trim();
    setScannedValue(scanned);

    if (!scanned) {
      setIndicatorColor("#d9d9d9");
      return;
    }

    try {
      const payload = {
        scannedCode: scanned,           // full scanned barcode
        subChildPartCode: kitPartCode,  // expected part code
      };

      const response = await serverApi.post("/verifySubChildPart", payload);
      const resData = response.data;

      // Handle success response
      if (resData.responseCode === "200" && resData.responseDataMessage === "true") {
        setIndicatorColor("green");
        message.success("Child part successfully verified");
      } else {
        setIndicatorColor("red");
        message.error(resData.responseDataMessage || "Verification failed");
      }
    } catch (error) {
      console.error("Error verifying child part:", error);
      message.error("Error verifying child part");
      setIndicatorColor("red");
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
        <Form.Item label="Child Part Code">
          <Input value={kitPartCode} disabled />
        </Form.Item>

        <Form.Item label="Child Part Description">
          <Input value={kitPartDesc} disabled />
        </Form.Item>

        <Form.Item label="Scan Barcode">
          <Input
            placeholder="Scan barcode here"
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




const Kitting = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [showKittingCard, setShowKittingCard] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [labelForm] = Form.useForm();
  const [planOptions, setPlanOptions] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);

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
    setShowKittingCard(false);
    await fetchKittingPartDetails(values.plan);
  };

  // When a row (part) is clicked
  const handlePartClick = async (record) => {
    setSelectedPart(record);
    setShowKittingCard(true);

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
      } else {
        message.info("No child part details found for this part");
      }
    } catch (error) {
      console.error("Error fetching child part details:", error);
      message.error("Failed to fetch child part details");
    }

    setTimeout(() => {
      document
        .getElementById("kitting-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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
                kitPartCode={part.kitPartCode || "--"}
                kitPartDesc={part.kitPartDesc || "--"}
              />
            </Col>
          ))}
        </Row>

        {/* Label Print Button */}
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Button
              style={{ backgroundColor: "#001F3E", color: "white" }}
              block
              onClick={() => {
                const picklistQty = Number(selectedPart.picklistQty) || 0;
                labelForm.setFieldsValue({
                  childPartCode: selectedPart.childPartCode,
                  plan: picklistQty,
                  scanCount: "",
                  label: "",
                });
                setIsModalVisible(true);
              }}
            >
              Label Print
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
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Date">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="WO/Plan"
                  name="plan"
                  rules={[{ required: true, message: "Please select a plan" }]}
                >
                  <Select placeholder="Select Work Order" loading={loadingPlans} allowClear>
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
                style={{ marginLeft: 8 }}
                onClick={() => {
                  form.resetFields();
                  setShowTable(false);
                  setShowKittingCard(false);
                }}
              >
                Cancel
              </Button>
            </Row>
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
                Child Code: {selectedPart?.childPartCode}
              </span>
            }
          >
            {renderChildPartCard()}
          </Card>
        </div>
      )}

      {/* Label Printing Modal */}
      <Modal
        title="Label Printing"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          layout="vertical"
          form={labelForm}
          onFinish={(values) => {
            setSelectedQrData(values.childPartCode || "QR123");
            setIsModalVisible(false);
            setQrModalVisible(true);
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
                  onChange={(e) => {
                    const scanCount = Number(e.target.value) || 0;
                    const plan = Number(labelForm.getFieldValue("plan")) || 0;
                    const labelValue =
                      scanCount > 0 ? Number((plan / scanCount).toFixed(2)) : 0;
                    labelForm.setFieldsValue({ label: labelValue });
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item label="Label" name="label">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end">
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ backgroundColor: "#001F3E", color: "white" }}
            >
              Print
            </Button>
          </Row>
        </Form>
      </Modal>

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
