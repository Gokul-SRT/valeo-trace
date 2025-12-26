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
  Empty,
} from "antd";
import moment from "moment";
import PicklistWODropdown from "../../Traceability/Kitting/dropdownService";
import serverApi from "../../../serverAPI";
import KittingQRModel from "../../Traceability/Reports/Picklist/KittingQRModel";
import store from "store";
import { toast } from "react-toastify";
import Loader from "../../../Utills/Loader"; // Import your Loader component
import { backendService } from "../../../service/ToolServerApi";

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
  const [loading, setLoading] = useState(false); // Add loader state

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
      setLoading(true); // Start loader
      const payload = {
        scannedCode: scanned,
        subChildPartCode: kitPartCode,
        productCode:plsCode,
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
        if (onValidationComplete)
          onValidationComplete(kitPartCode, true, scanned);

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
        if (onValidationComplete)
          onValidationComplete(kitPartCode, false, scanned);
      }
    } catch (error) {
      message.error("Error verifying or inserting scan");
      setIndicatorColor("red");
      setIsVerified(false);
      if (onValidationComplete)
        onValidationComplete(kitPartCode, false, scanned);
    } finally {
      setLoading(false); // Stop loader
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
      style={{ marginRight: 8, position: "relative" }} // Add position relative
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            borderRadius: "8px",
          }}
        >
          <Loader />
        </div>
      )}
      <Form layout="vertical">
        <Form.Item label="Product Code">
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
  listTotalCount,
  childPartCountList,
}) => {
  const [form] = Form.useForm();
  const [binQty, setBinQty] = useState(100);
  const [labelCount, setLabelCount] = useState(0);
  const [quantity, setQuantity] = useState(planQty || 0);

  const [subAssemblyKittingList, setSubAssemblyKittingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [qrModal, setQrModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);

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
  useEffect(() => {
    form.setFieldsValue({
      pkgNo: "SRC",
    });
  }, []);
  useEffect(() => {
    fetchPickedAndStandardQty(childPartCode);
  }, [childPartCode]);

  const fetchPickedAndStandardQty = async (childCode) => {
    try {
      setLoading(true); // Start loader
      const response = await serverApi.post("getPLSCodePickedQuantity", {
        tenantId,
        branchCode,
        productCode: plsCode,
        itemType: "C",
        childPartCode: childCode,
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        console.log("Fetched PickedQty Details:", res.responseData);
        const firstItem = res.responseData[0] || {};
        form.setFieldsValue({
          binQty: firstItem.standardQuantity || "",
        });
        setBinQty(firstItem.standardQuantity || "");
      } else {
        form.setFieldsValue({
          binQty: "0",
        });
      }
    } catch (error) {
      toast.error("Error fetching picked quantity. Please try again later.");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  const subAssemblyColumns = [
    { title: "S.No", key: "sno", render: (text, record, index) => index + 1 },
    {
      title: "PicList Code",
      dataIndex: "plsCode",
      key: "plsCode",
    },
    {
        title: "Product Code",
        dataIndex: "productCode",
        key: "productCode",
      },
    {
      title: "ChildPart Code",
      dataIndex: "childPartCode",
      key: "childPartCode",
    },
    {
      title: "Quantity",
      dataIndex: "qty",
      key: "qty",
      align: "right",
      render: (value) =>
        value !== null && value !== undefined && value !== "" ? value : 0,
    },
    {
      title: "Label Code",
      dataIndex: "labelCode",
      key: "labelCode",
      render: (text) => (
        <div style={{ whiteSpace: "pre", fontFamily: "monospace" }}>{text}</div>
      ),
    },
    {
      title: "Action",
      key: "printSts",
      render: (_, record) => {
        const val = record.printSts; // 0 or 1

        return (
          <>
            {/* PRINT BUTTON */}
            <Button
              type="primary"
              disabled={val === "1"} // Disable when printSts = 1
              style={{
                marginRight: 8,
                opacity: val === "1" ? 0.5 : 1,
                cursor: val === "1" ? "not-allowed" : "pointer",
              }}
              onClick={() => handleSubAssemplyPrint(record)}
            >
              Print
            </Button>

            {/* REPRINT BUTTON */}
            <Button
              type="default"
              disabled={val === "0"} // Disable when printSts = 0
              style={{
                opacity: val === "0" ? 0.5 : 1,
                cursor: val === "0" ? "not-allowed" : "pointer",
              }}
              onClick={() => handleSubAssemplyRePrint(record)}
            >
              Reprint
            </Button>
          </>
        );
      },
    },
  ];

  const getItemById = (id) => {
    return subAssemblyKittingList.find((item) => item.id === id);
  };

  const updatePrintStatus = (id, newStatus) => {
    setSubAssemblyKittingList((prevList) =>
      prevList.map((item) =>
        item.id === id ? { ...item, printSts: newStatus } : item
      )
    );
  };

  const handleSubAssemplyPrint = async (record) => {
    try {
      console.log("PRINT clicked row:", record);
      setLoading(true); // Start loader

      const response = await serverApi.post("updateLabelSts", {
        tenantId: tenantId,
        branchCode: branchCode,
        exeId: record.id,
        sts: "1",
      });
      const res = response.data;
      if (res.responseCode === "200") {
        //update new printStatus
        console.log("setQrModal", qrModal);

        toast.success("Printed successfully!");
        updatePrintStatus(record.id, "1");

        // Example usage
        const itemObject = getItemById(record.id);
        setSelectedObject(itemObject);
        setQrModal(true);
      } else {
        toast.error("Printed Failure!");
      }
    } catch (err) {
      message.error("Print failed");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  const handleSubAssemplyRePrint = async (record) => {
    try {
      const itemObject = getItemById(record.id);
      setSelectedObject(itemObject);
      setQrModal(true);
      toast.success("RePrinted successfully!");
    } catch (err) {
      message.error("RePrint failed");
    }
  };

  const updateScannedCountForSubChildPart = async (
    plsCode,
    formattedValues
  ) => {
    try {
      setLoading(true); // Start loader

      const updatePayLoadList = childPartCountList.map((item) => ({
        tenantId: tenantId,
        branchCode: branchCode,
        minimumCount: listTotalCount,
        subChildParts: item.kittingChildPartCode,
        productCode: plsCode,
        childPartCode: formattedValues.childPartCode,
      }));

      const response = await serverApi.post(
        "updateScannedCountForKittingDtl",
        updatePayLoadList
      );
      const res = response.data;
      if (res.responseCode === "200") {
        toast.success("ScannedCount updated successfully!");
      } else {
        toast.error("ScannedCount updated Failure!");
      }
    } catch (err) {
      message.error("ScannedCount updated failed");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  //search
  const filteredData = subAssemblyKittingList.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  const insertSubAssemblyPartKittingDetails = async (
    plsCode,
    formattedValues
  ) => {
    console.log("date", formattedValues.expirationDate);
    setLoading(true);
    try {
      const payload = {
        tenantId: tenantId,
        branchCode: branchCode,
        employeeId: employeeId,
        productCode: plsCode,
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
        // pkgNo: "SRC",
        batchNo: formattedValues.batchNo,
      };

      const response = await serverApi.post(
        "insertAndRetrieveSubAssemblyPartDetails",
        payload
      );

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        toast.success(res.responseMessage);
        setSubAssemblyKittingList(res.responseData);
        console.log("setSubAssemblyKittingList", res.responseData);
        console.log("setSubAssemblyKittingList", res.responseData[0].labelCode);

        updateScannedCountForSubChildPart(plsCode, formattedValues);
      } else {
        setSubAssemblyKittingList([]);
        toast.error(res.responseMessage);
      }
    } catch (error) {
      toast.error("Error fetching SubAssembly. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    form
      .validateFields()
      .then((values) => {
        if (onPrint) {
          const formattedValues = {
            ...values,
            deliveryDate:
              values.deliveryDate && moment.isMoment(values.deliveryDate)
                ? values.deliveryDate.format("YYYY-MM-DD")
                : null,
            manufacturingDate:
              values.manufacturingDate &&
              moment.isMoment(values.manufacturingDate)
                ? values.manufacturingDate.format("YYYY-MM-DD")
                : null,
            binQty: binQty,
            labelCount: labelCount,
            childPartCode: childPartCode,
            childPartDesc: childPartDesc,
          };
          insertSubAssemblyPartKittingDetails(plsCode, formattedValues);
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
    <>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Loader />
        </div>
      )}

      {subAssemblyKittingList && subAssemblyKittingList.length > 0 && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title={`Sub Assembly Details`}
          style={{ position: "relative" }}
        >
          <Input
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16, width: 300 }}
          />
          <Table
            columns={subAssemblyColumns}
            dataSource={filteredData}
            bordered
            locale={{ emptyText: "No data " }}
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        </Card>
      )}

      {subAssemblyKittingList?.length === 0 && (
        <Card
          title="Consignee Details"
          headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
          style={{ marginTop: 16, position: "relative" }}
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
                  rules={[
                    { required: true, message: "Please enter delivery number" },
                  ]}
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
                  rules={[
                    { required: true, message: "Please select delivery date" },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Manufacturing Date"
                  name="manufacturingDate"
                  rules={[
                    {
                      required: true,
                      message: "Please select manufacturing date",
                    },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>

              {/* Third Row */}
              <Col span={6}>
                <Form.Item label="Expiration Date" name="expirationDate">
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
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
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onBlur={() => {
                      const quantityNum = Number(quantity);
                    //   if (quantityNum > planQty) {
                    //     toast.error("Quantity cannot exceed plan quantity!");
                    //     setQuantity("");
                    //     form.setFieldsValue({ quantity: "" });
                    //     setLabelCount(0);
                    //     form.setFieldsValue({ labelCount: 0 });
                    //     return;
                    //   }
                      if (quantityNum !== listTotalCount) {
                        toast.error(
                          "Quantity must be equal to totalCount minimum value!"
                        );
                        setQuantity("");
                        form.setFieldsValue({ quantity: "" });
                        setLabelCount(0);
                        form.setFieldsValue({ labelCount: 0 });
                        return;
                      }

                      if (quantityNum % binQty !== 0) {
                        console.log("vvvvvbin", binQty);
                        toast.error(
                          `Quantity must be a multiple of bin Quantity`
                        );
                        setQuantity("");
                        form.setFieldsValue({ quantity: "" });
                        setLabelCount(0);
                        form.setFieldsValue({ labelCount: 0 });
                        return;
                      }

                      // valid input
                      const newLabelCount = calculateLabelCount(
                        quantityNum,
                        binQty
                      );
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
                  rules={[
                    { required: true, message: "Please enter bin quantity" },
                  ]}
                >
                  <Input
                    type="number"
                    style={{ width: "100%" }}
                    placeholder="Enter bin quantity"
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
                  rules={[
                    {
                      required: true,
                      message: "Please enter package reference no",
                    },
                  ]}
                >
                  <Input placeholder="Enter package reference no" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Supplier Number"
                  name="supplierNumber"
                  rules={[
                    { required: true, message: "Please enter supplier number" },
                  ]}
                >
                  <Input placeholder="Enter supplier number" />
                </Form.Item>
              </Col>

              {/* Fifth Row */}
              <Col span={6}>
                <Form.Item
                  label="Pkg No."
                  name="pkgNo"
                  rules={[
                    { required: true, message: "Please enter package number" },
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Batch No."
                  name="batchNo"
                  rules={[
                    { required: true, message: "Please enter batch number" },
                  ]}
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
      )}
      <KittingQRModel
        qrModalVisible={qrModal}
        setQrModalVisible={setQrModal}
        selectedQrData={selectedObject}
      />
    </>
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
  const [listTotalCount, setListTotalCount] = useState("");
  const [loading, setLoading] = useState(false); // Main loader state

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");



  const getProductDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        isActive: "1",
      }
      const response = await backendService({requestPath:"getProductDropdown", requestData:payload});

      let returnData = [];

      if (response?.responseCode === '200' && response.responseData) {
       
        returnData = response.responseData;
        setPlanOptions(returnData);
      } else {

        toast.error(response.responseMessage || "Failed to load Product.");
        setPlanOptions([]);
      }
     
    } catch (error) {
      console.error("Error fetching Product dropdown data:", error);
      toast.error("Error fetching data. Please try again later.");
      setPlanOptions([]);
    }finally {
        setLoadingPlans(false);
      }
  };


/*
  const fetchPlans = async () => {
    // setLoadingPlans(true);
    try {
      const response = await PicklistWODropdown(
        tenantId,
        branchCode
      );
      const data = Array.isArray(response.data) ? response.data : response;
      setPlanOptions(data.map((item) => ({ code: item.plsCode })));
    } catch (err) {
      message.error("Failed to load work orders");
      setPlanOptions([]);
    } finally {
      setLoadingPlans(false);
    }
  };
*/

  useEffect(() => {
    // fetchPlans();
    getProductDropDownData();
  }, [tenantId, branchCode]);

  const fetchKittingPartDetails = async (planCode) => {
    setLoadingParts(true);
    setLoading(true); // Start main loader
    try {
    //   const payload = { tenantId, plscode: planCode };
    //   const response = await serverApi.post("/getKittingPartDetails", payload);
    //   const data = response.data.responseData || response.data || [];
    //   const formatted = data.map((item, index) => ({
    //     key: index + 1,
    //     plsdId: item.plsdId,
    //     childPartCode: item.childPartCode,
    //     childPartDesc: item.childPartDesc,
    //     itemType: item.itemType,
    //     picklistQty: item.picklistQty,
    //     pickedQty: item.pickedQty,
    //     productCode: item.productCode,
    //   }));

    const payload = { tenantId, productCode: planCode, branchCode: branchCode };
    const response = await serverApi.post("/getKitPartByProduct", payload);
    const data = response.data.responseData || response.data || [];
    // const formatted = data.map((item, index) => ({
    //   key: index + 1,
    //   plsdId: item.plsdId,
    //   childPartCode: item.childPartCode,
    //   childPartDesc: item.childPartDesc,
    //   itemType: item.itemType,
    //   picklistQty: item.picklistQty,
    //   pickedQty: item.pickedQty,
    //   productCode: item.productCode,
    // }));
      setTableData(data);
      setShowTable(true);
    } catch (error) {
      message.error("Failed to fetch Kitting part details");
    } finally {
      setLoadingParts(false);
      setLoading(false); // Stop main loader
    }
  };

  const handleSubmit = async (values) => {
    setSelectedPlan(values.plan);
   // setSelectedDate(values.date);
    await fetchKittingPartDetails(values.plan);
  };

  const handlePartClick = async (record) => {
    setSelectedPart(record);
    setShowKittingCard(true);
    setShowConsigneeCard(false);
    setVerificationStatus({});
    setScannedValues({});
    setAllChildPartsVerified(false);
    setLoading(true); // Start loader

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
    } finally {
      setLoading(false); // Stop loader
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

  const handleConsigneeClick = async () => {
    if (!allChildPartsVerified) return;
    setShowConsigneeCard(true);
    setLoading(true); // Start loader

    try {
      const payload = {
        tenantId,
        childPartCode: selectedPart.childPartCode,
        branchCode,
        productCode: selectedPlan,
      };

      const response = await serverApi.post("/getSubAssyCount", payload);
      console.log(response);
      const rawData = response.data?.responseData;
      if (rawData.length > 0) {
        console.log(rawData);
        setChildPartCountList(rawData);

        const totalCount = Math.min(
          ...rawData.map((item) => Number(item.totalCount))
        );
        if (totalCount !== null && totalCount !== undefined) {
          setListTotalCount(totalCount);
        } else {
          setListTotalCount(0);
        }
      } else {
        setChildPartCountList([]);
        message.info("Error");
      }
    } catch (error) {
      message.error("Failed to fetch count");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  const handleConsigneePrint = (printData) => {
    if (printData && printData.childPartCode) {
      setSelectedQrData(printData.childPartCode);
      setQrModalVisible(true);
      message.success(
        `Printing ${printData.labelCount} label(s) for ${printData.childPartCode}`
      );
    } else {
      message.error("Invalid print data");
    }
  };

  const handleConsigneeCardClose = () => setShowConsigneeCard(false);

  const columns = [
 //   { title: "PLSD ID", dataIndex: "plsdId", key: "plsdId" },
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
    {
      title: "Child Part Description",
      dataIndex: "childPartDesc",
      key: "childPartDesc",
    },
    { title: "Item Type", dataIndex: "typeCode", key: "typeCode" },
    // {
    //   title: "Picklist Qty",
    //   dataIndex: "picklistQty",
    //   key: "picklistQty",
    //   align: "right",
    // },
    // {
    //   title: "Picked Qty",
    //   dataIndex: "pickedQty",
    //   key: "pickedQty",
    //   align: "right",
    // },
   // { title: "Product Code", dataIndex: "productCode", key: "productCode" },
  ];

  // Build scan results table for ConsigneeDetailsCard, only after completion
  const scanResultsTable =
    childPartCountList && childPartCountList.length > 0 ? (
      <Card title="Sub Child Part Scan Results" style={{ marginBottom: 24 }}>
        <Table
          dataSource={childPartCountList}
          columns={[
            {
              title: "Kitting Child Part Code",
              dataIndex: "kittingChildPartCode",
              key: "kittingChildPartCode",
            },
            {
              title: "Total Count",
              dataIndex: "totalCount",
              key: "totalCount",
            },
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
      {/* Main Loader */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Loader />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        {/* <Card
          title="Kitting Process"
          headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
        > */}
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <Row gutter={16}>
              {/* <Col span={6}>
                <Form.Item
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: "Please select date" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD"
                    onChange={(date) =>
                      setSelectedDate(date ? date.format("YYYY-MM-DD") : null)
                    }
                  />
                </Form.Item>
              </Col> */}
              <Col span={6}>
                <Form.Item
                  label="Product"
                  name="plan"
                  rules={[{ required: true, message: "Please select a product" }]}
                >
                  <Select
                    placeholder="Select Product"
                    loading={loadingPlans}
                    allowClear
                    showSearch
                  >
                    {planOptions.map((plan) => (
                      <Option key={plan.productCode} value={plan.productCode}>
                        {plan.productDesc}
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
        {/* </Card> */}
      </div>

      {showTable && (
        <div style={{ marginBottom: 16 }}>
          <Card
            title={`Product Details - Product ${selectedPlan}`}
            headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
          >
            {tableData.length === 0 ? (
              <Empty description="No Data Available" />
            ) : (
              <Table rowKey="plsdId" columns={columns} dataSource={tableData} />
            )}
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
            listTotalCount={listTotalCount}
            childPartCountList={childPartCountList}
          />
        </div>
      )}
    </>
  );
};

export default Kitting;
