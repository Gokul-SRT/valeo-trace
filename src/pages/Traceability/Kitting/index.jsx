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
  message,
} from "antd";
import moment from "moment";
import PicklistWODropdown from "../../Traceability/Kitting/dropdownService";
import serverApi from "../../../serverAPI";
import QRModal from "../../Traceability/Reports/Picklist/QRModal";
import store from "store";
import { toast } from "react-toastify";

const { Option } = Select;

// Child Part Validation Card
const ChildPartValidationCard = ({
  plsCode,
  childPartCode,
  kitPartCode,
  kitPartDesc,
  onValidationComplete,
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
      if (onValidationComplete) onValidationComplete(kitPartCode, false, "");
      return;
    }

    const tenantId = store.get("tenantId");
    const branchCode = store.get("branchCode");

    try {
      const payload = {
        scannedCode: scanned,
        subChildPartCode: kitPartCode,
        plsCode,
        childPartCode,
        tenantId,
        branchCode,
      };

      const verifyResponse = await serverApi.post(
        "/verifySubChildPart",
        payload
      );
      const verifyData = verifyResponse.data;

      if (
        verifyData.responseCode === "200" &&
        verifyData.responseDataMessage === "true"
      ) {
        setIndicatorColor("green");
        setIsVerified(true);
        message.success("Child part successfully verified");
        if (onValidationComplete) onValidationComplete(kitPartCode, true, scanned);

        const insertResponse = await serverApi.post(
          "/insertSubChildPart",
          payload
        );
        const insertData = insertResponse.data;
        if (insertData.responseCode === "200") {
          message.success("Scan record inserted successfully!");
        } else {
          message.error(
            insertData.responseDataMessage || "Failed to insert scan record"
          );
        }
      } else {
        setIndicatorColor("red");
        setIsVerified(false);
        message.error(verifyData.responseDataMessage || "Verification failed");
        if (onValidationComplete) onValidationComplete(kitPartCode, false, scanned);
      }
    } catch (error) {
      message.error("Error verifying or inserting scan");
      setIndicatorColor("red");
      setIsVerified(false);
      if (onValidationComplete) onValidationComplete(kitPartCode, false, scanned);
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

// Consignee Details Card with scanResultsTable on top
const ConsigneeDetailsCard = ({
  tenantId,
  branchCode,
  employeeId,
  plsCode,
  childPartCode,
  childPartDesc,
  planQty,
  onPrint,
  onCancel,
  scanResultsTable,
}) => {
  const [form] = Form.useForm();
  const [binQty, setBinQty] = useState(100);
  const [labelCount, setLabelCount] = useState(0);
  const [quantity, setQuantity] = useState(planQty || 0);

  const[subAssemblyKittingList ,setSubAssemblyKittingList] = useState([]);

  const getCurrentDate = () => moment();

  const calculateLabelCount = (planQtyValue, binQtyValue) => {
    const planQtyNum = Number(planQtyValue) || 0;
    const binQtyNum = Number(binQtyValue) || 100;
    if (binQtyNum === 0) return 0;
    return Math.ceil(planQtyNum / binQtyNum);
  };

  const handleBinQtyChange = (e) => {
    const value = e.target.value;
    const newBinQty = value ? Number(value) : 100;
    setBinQty(newBinQty);
    const planQtyValue = form.getFieldValue("quantity") || planQty;
    const newLabelCount = calculateLabelCount(planQtyValue, newBinQty);
    setLabelCount(newLabelCount);
    form.setFieldsValue({ labelCount: newLabelCount });
  };
/*
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    const quantitys = value ? Number(value) : 0;
    const planQtyNum = Number(planQty) || 0;
    
    if (quantitys > planQtyNum) {
      toast.error("Quantity cannot exceed plan quantity!");
      setQuantity(""); // clear input
      setLabelCount(0);
      form.setFieldsValue({ quantity: "", labelCount: 0 }); // sync Form value
      return;
    }

    if (quantitys % Number(binQty) !== 0) {
      toast.error(`Quantity must be a multiple of ${binQty}`);
      setQuantity(""); // clear input
      setLabelCount(0);
      form.setFieldsValue({ quantity: "", labelCount: 0 }); // sync Form value
      return;
    }

    // valid quantity
    setQuantity(quantitys);

    const newLabelCount = calculateLabelCount(quantitys, binQty);
    setLabelCount(newLabelCount);
    form.setFieldsValue({ labelCount: newLabelCount });
  };
*/
const insertSubAssemblyPartKittingDetails = async (plsCode,formattedValues) => {
  try {
    const payload = {
      tenantId: tenantId,
      branchCode: branchCode,
      employeeId: employeeId,
      plsCode: plsCode,
      childPartCode: formattedValues.childPartCode,
      childPartDesc: formattedValues.childPartDesc,
      consignee: formattedValues.consignee,
      storageLocation: formattedValues.storageLocation,
      deliveryNo: formattedValues.deliveryNo,
      itemNoCustomer: formattedValues.itemNo,
      deliveryDate: formattedValues.deliveryDate,
      manufacturingDate: formattedValues.manufacturingDate,
      expirationDate: formattedValues.expirationDate,
      description: formattedValues.description,
      quantity: formattedValues.quantity,
      binQuantity: formattedValues.binQty,
      labelCount: formattedValues.labelCount,
      packageReferenceNo: formattedValues.packageReferenceNo,
      supplierNumber: formattedValues.supplierNumber,
      pkgNo: formattedValues.pkgNo,
      batchNo: formattedValues.batchNo,
    };

    const response = await serverApi.post("insertAndRetrieveSubAssemblyPartDetails", payload
      );

    const res = response.data;
    if (res.responseCode === "200" && Array.isArray(res.responseData)) {
      setSubAssemblyKittingList(res.responseData);
      toast.success(res.responseData.setResponseMessage);

      console.log("setSubAssemblyKittingList",subAssemblyKittingList)
    } else {
      setSubAssemblyKittingList([]);
      toast.error(res.responseData.setResponseMessage);
    }
  } catch (error) {
   
    toast.error("Error fetching SubAssembly. Please try again later.");
  }
};



  const handlePrint = () => {
    form.validateFields()
      .then((values) => {
        if (onPrint) {
          const formattedValues = {
            ...values,
            deliveryDate:
              values.deliveryDate && moment.isMoment(values.deliveryDate)
                ? values.deliveryDate.format("YYYY-MM-DD")
                : null,
            manufacturingDate:
              values.manufacturingDate && moment.isMoment(values.manufacturingDate)
                ? values.manufacturingDate.format("YYYY-MM-DD")
                : null,
            expirationDate:
              values.expirationDate && moment.isMoment(values.expirationDate)
                ? values.expirationDate.format("YYYY-MM-DD")
                : null,
            binQty: binQty,
            labelCount: labelCount,
            childPartCode: childPartCode,
            childPartDesc: childPartDesc,
          };
          //onPrint(formattedValues);
          insertSubAssemblyPartKittingDetails(plsCode,formattedValues);


        }
      })
      .catch(() => {
        message.error("Please fill all required fields correctly");
      });
  };

  useEffect(() => {
    const initialLabelCount = calculateLabelCount(planQty, binQty);
    setLabelCount(initialLabelCount);
    setQuantity(planQty || 0);
    form.setFieldsValue({
      consignee: "Amalgamations Valeo Clutch Private - Chennai",
      storageLocation: "CH35",
      deliveryDate: getCurrentDate(),
      manufacturingDate: getCurrentDate(),
      description: childPartDesc || "Delivery Service",
      planQty: planQty || 0,
      quantity: planQty || 0,
      itemNo: `000000000000${childPartCode}`,
      binQty: binQty,
      labelCount: initialLabelCount,
    });
  }, [planQty, binQty, form, childPartCode, childPartDesc]);

  return (
    <Card
      title="Consignee Details"
      headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
      style={{ marginTop: 16 }}
    >
      {/* Show scan results table here */}
      {scanResultsTable}

      <Form layout="vertical" form={form}>
        <Row gutter={[16, 8]}>
          {/* First Row */}
          <Col span={6}>
            <Form.Item label="Consignee" name="consignee">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Storage Location" name="storageLocation">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="Delivery No"
              name="deliveryNo"
              rules={[{ required: true, message: "Please enter delivery number" }]}
            >
              <Input placeholder="Enter delivery number" />
            </Form.Item>
          </Col>

          {/* Second Row */}
          <Col span={6}>
            <Form.Item label="Item No. Customer" name="itemNo">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label="Delivery Date" 
              name="deliveryDate"
              rules={[{ required: true, message: "Please select delivery date" }]}
            >
              <DatePicker 
                style={{ width: "100%" }} 
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label="Manufacturing Date" 
              name="manufacturingDate"
              rules={[{ required: true, message: "Please select manufacturing date" }]}
            >
              <DatePicker 
                style={{ width: "100%" }} 
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>

          {/* Third Row */}
          <Col span={6}>
            <Form.Item label="Expiration Date" name="expirationDate">
              <DatePicker 
                style={{ width: "100%" }} 
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Description" name="description">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Plan Qty" name="planQty">
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item 
              label="Quantity" 
              name="quantity"
              rules={[{ required: true, message: "Please enter quantity" }]}
            >
              <Input 
                type="number"
                style={{ width: "100%" }}
                placeholder="Enter quantity" 
                value={quantity}      // controlled input
              //  onChange={handleQuantityChange}
              onChange={(e) => setQuantity(e.target.value)} // just update state while typing
              onBlur={() => {
                const quantityNum = Number(quantity);
                if (quantityNum > planQty) {
                  toast.error("Quantity cannot exceed plan quantity!");
                  setQuantity(""); // now clear after typing
                  form.setFieldsValue({ quantity: "" });
                  setLabelCount(0);
                  form.setFieldsValue({ labelCount: 0 });
                  return;
                }
                if (quantityNum % binQty !== 0) {
                  toast.error(`Quantity must be a multiple of ${binQty}`);
                  setQuantity("");
                  form.setFieldsValue({ quantity: "" });
                  setLabelCount(0);
                  form.setFieldsValue({ labelCount: 0 });
                  return;
                }
          
                // valid input
                const newLabelCount = calculateLabelCount(quantityNum, binQty);
                setLabelCount(newLabelCount);
                form.setFieldsValue({ labelCount: newLabelCount });
              }}
                min={0}
              />
            </Form.Item>
          </Col>

          {/* Fourth Row - Bin Qty and Label Count */}
          <Col span={6}>
            <Form.Item 
              label="Bin Qty" 
              name="binQty"
              rules={[{ required: true, message: "Please enter bin quantity" }]}
            >
              <Input 
                type="number"
                style={{ width: "100%" }}
                placeholder="Enter bin quantity"
                defaultValue={100}
                onChange={handleBinQtyChange}
                min={1}
                disabled
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Label Count" name="labelCount">
              <Input 
                style={{ width: "100%" }}
                value={labelCount}
                disabled
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label="Package Reference No" 
              name="packageReferenceNo"
              rules={[{ required: true, message: "Please enter package reference no" }]}
            >
              <Input placeholder="Enter package reference no" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label="Supplier Number" 
              name="supplierNumber"
              rules={[{ required: true, message: "Please enter supplier number" }]}
            >
              <Input placeholder="Enter supplier number" />
            </Form.Item>
          </Col>

          {/* Fifth Row */}
          <Col span={6}>
            <Form.Item 
              label="Pkg No." 
              name="pkgNo"
              rules={[{ required: true, message: "Please enter package number" }]}
            >
              <Input placeholder="Enter package number" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              label="Batch No." 
              name="batchNo"
              rules={[{ required: true, message: "Please enter batch number" }]}
            >
              <Input placeholder="Enter batch number" />
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
            disabled={labelCount === 0}
          >
            Print {labelCount > 0 ? `${labelCount} Label(s)` : "Labels"}
          </Button>
        </Row>
      </Form>
    </Card>
  );
};

// Main Kitting Component
const Kitting = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [showKittingCard, setShowKittingCard] = useState(false);
  const [showConsigneeCard, setShowConsigneeCard] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [form] = Form.useForm();
  const [planOptions, setPlanOptions] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({});
  const [scannedValues, setScannedValues] = useState({});
  const [allChildPartsVerified, setAllChildPartsVerified] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState(null);
  const [childPartCountList, setChildPartCountList] = useState([]);

  
  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId")

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await PicklistWODropdown(tenantId, branchCode);
      const data = Array.isArray(response.data) ? response.data : response;
      setPlanOptions(data.map((item) => ({ code: item.plsCode })));
    } catch (err) {
      message.error("Failed to load work orders");
      setPlanOptions([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchKittingPartDetails = async (planCode) => {
    setLoadingParts(true);
    try {
      const payload = { tenantId, plscode: planCode };
      const response = await serverApi.post("/getKittingPartDetails", payload);
      const data = response.data.responseData || response.data || [];
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
      message.error("Failed to fetch Kitting part details");
    } finally {
      setLoadingParts(false);
    }
  };

  const handleSubmit = async (values) => {
    setSelectedPlan(values.plan);
    setSelectedDate(values.date);
    await fetchKittingPartDetails(values.plan);
  };

  const handlePartClick = async (record) => {
    setSelectedPart(record);
    setShowKittingCard(true);
    setShowConsigneeCard(false);
    setVerificationStatus({});
    setScannedValues({});
    setAllChildPartsVerified(false);

    try {
      const payload = {
        tenantId,
        childPartCode: record.childPartCode,
        branchCode,
      };
      const response = await serverApi.post("/getKittingChildPartDetails", payload);
      const rawData = response.data?.responseData;
      const data = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
      if (data.length > 0) {
        setSelectedPart((prev) => ({
          ...prev,
          childParts: data,
        }));
        const initialStatus = {};
        data.forEach((part) => {
          initialStatus[part.kitPartCode] = false;
        });
        setVerificationStatus(initialStatus);
      } else {
        message.info("No child part details found for this part");
      }
    } catch (error) {
      message.error("Failed to fetch child part details");
    }
  };

  const handleValidationComplete = (kitPartCode, isVerified, scannedValue) => {
    setVerificationStatus((prev) => ({
      ...prev,
      [kitPartCode]: isVerified,
    }));
    if (isVerified && scannedValue) {
      setScannedValues((prev) => ({
        ...prev,
        [kitPartCode]: scannedValue,
      }));
    } else if (!isVerified) {
      setScannedValues((prev) => ({
        ...prev,
        [kitPartCode]: "",
      }));
    }
  };

  useEffect(() => {
    if (
      selectedPart?.childParts &&
      Object.keys(verificationStatus).length > 0
    ) {
      const allVerified = selectedPart.childParts.every(
        (part) => verificationStatus[part.kitPartCode] === true
      );
      setAllChildPartsVerified(allVerified);
      if (allVerified) {
        message.success("All child parts verified successfully!");
      }
    }
  }, [verificationStatus, selectedPart]);

  const handleConsigneeClick = async() => {
    if (!allChildPartsVerified) return;
    setShowConsigneeCard(true);
    try {
      const payload = {
        tenantId,
        childPartCode: selectedPart.childPartCode,
        branchCode,
        plsCode: selectedPlan
      };
      
      const response = await serverApi.post("/getSubAssyCount", payload);
      console.log(response);
      const rawData = response.data?.responseData;
      if (rawData.length > 0) {
        console.log(rawData);
        setChildPartCountList(rawData);
      } else {
        setChildPartCountList([]);
        message.info("Error");
      }
    } catch (error) {
      message.error("Failed to fetch count");
    }
  };
  

  const handleConsigneePrint = (printData) => {
    if (printData && printData.childPartCode) {
      setSelectedQrData(printData.childPartCode);
      setQrModalVisible(true);
      message.success(`Printing ${printData.labelCount} label(s) for ${printData.childPartCode}`);
    } else {
      message.error("Invalid print data");
    }
  };

  const handleConsigneeCardClose = () => setShowConsigneeCard(false);

  const columns = [
    { title: "PLSD ID", dataIndex: "plsdId", key: "plsdId" },
    {
      title: "Child Part Code",
      dataIndex: "childPartCode",
      key: "childPartCode",
      render: (text, record) => (
        <a
          onClick={() => handlePartClick(record)}
          style={{
            color: "#1890ff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {text}
        </a>
      ),
    },
    { title: "Child Part Description", dataIndex: "childPartDesc", key: "childPartDesc" },
    { title: "Item Type", dataIndex: "itemType", key: "itemType" },
    { title: "Picklist Qty", dataIndex: "picklistQty", key: "picklistQty", align: "right" },
    { title: "Picked Qty", dataIndex: "pickedQty", key: "pickedQty", align: "right" },
    { title: "Product Code", dataIndex: "productCode", key: "productCode" },
  ];

  // Build scan results table for ConsigneeDetailsCard, only after completion
  const scanResultsTable = childPartCountList && childPartCountList.length > 0 ? (
    <Card title="Sub Child Part Scan Results" style={{ marginBottom: 24 }}>
      <Table
        dataSource={childPartCountList}
        columns={[
          { title: "Kitting Child Part Code", dataIndex: "kittingChildPartCode", key: "kittingChildPartCode" },
          { title: "Total Count", dataIndex: "totalCount", key: "totalCount" },
        ]}
        pagination={false}
        bordered
        size="small"
      />
    </Card>
  ) : null;

  // Render child part cards and Completed button
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
        <Row style={{ marginTop: 16 }}>
          <Col span={24}>
            <Button
              style={{
                backgroundColor: allChildPartsVerified ? "#001F3E" : "#d9d9d9",
                color: allChildPartsVerified ? "white" : "#666666",
              }}
              block
              onClick={handleConsigneeClick}
              // disabled={!allChildPartsVerified}
            >
              {allChildPartsVerified
                ? "Completed"
                : `Complete ${
                    Object.values(verificationStatus).filter(Boolean).length
                  }/${childParts.length} Child Parts`}
            </Button>
          </Col>
        </Row>
      </Col>
    );
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Card
          title="Kitting Process"
          headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: "Please select date" }]}
                >
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
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
            <Row justify="center" style={{ marginTop: 8 }} gutter={16}>
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{
                    backgroundColor: "#001F3E",
                    borderColor: "#001F3E",
                    color: "white",
                  }}
                >
                  Submit
                </Button>
              </Col>
              <Col>
                <Button
                  style={{
                    backgroundColor: "#001F3E",
                    borderColor: "#001F3E",
                    color: "white",
                  }}
                  onClick={() => {
                    form.resetFields();
                    setShowTable(false);
                    setShowKittingCard(false);
                    setShowConsigneeCard(false);
                    setSelectedPart(null);
                    message.info("Search form reset");
                  }}
                >
                  Cancel
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>
      </div>

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

      {showConsigneeCard && (
        <div id="consignee-card">
          <ConsigneeDetailsCard
            tenantId={tenantId}
            branchCode={branchCode}
            employeeId={employeeId}
            plsCode={selectedPlan}
            childPartCode={selectedPart?.childPartCode || ""}
            childPartDesc={selectedPart?.childPartDesc || ""}
            planQty={selectedPart?.picklistQty || 0}
            onPrint={handleConsigneePrint}
            onCancel={handleConsigneeCardClose}
            scanResultsTable={scanResultsTable}
          />
        </div>
      )}

      <QRModal
        qrModalVisible={qrModalVisible}
        setQrModalVisible={setQrModalVisible}
        selectedQrData={selectedQrData}
      />
    </>
  );
};

export default Kitting;