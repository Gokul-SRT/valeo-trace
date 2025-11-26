import React, { useState, useEffect, useCallback } from "react";
import { Card, Form, Row, Col, Select, Input, Button, Table, DatePicker, Spin, Empty } from "antd";
import moment from "moment";
import { toast } from "react-toastify";
import serverApi from "../../../../serverAPI";
import { backendService } from "../../../../service/ToolServerApi";
import store from "store";

const { Option } = Select;

const PrintPage = ({
  selectType,
  qrData,
  setQrValue,
  showPrintDetails,
  setShowPrintDetails,
  handleQrBlur,
  printB2Columns,
  printB2Data,
  setPrintB2Data,
  handleViewQR,
  handlePrintAll,
  isLoading = false,
  refreshTrigger = 0
}) => {
  const [form] = Form.useForm();
  const [picklistOptions, setPicklistOptions] = useState([]);
  const [childPartOptions, setChildPartOptions] = useState([]);
  const [selectedChildPart, setSelectedChildPart] = useState(null);
  const [noOfLabels, setNoOfLabels] = useState(0);
  const [fetchingData, setFetchingData] = useState(false);

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const empId = store.get("employeeId");

  // Fetch picklist details
  const fetchPicklistDetails = useCallback(async () => {
    try {
      setFetchingData(true);
      const response = await serverApi.post("getPicklistWO", {
        tenantId,
        branchCode,
        planDate: ""
      });

      if (response.data?.responseCode === "200" && Array.isArray(response.data.responseData)) {
        setPicklistOptions(response.data.responseData);
      } else {
        setPicklistOptions([]);
        toast.warning("No picklists found");
      }
    } catch (error) {
      console.error("Error fetching picklist codes:", error);
      toast.error("Failed to load picklist codes");
      setPicklistOptions([]);
    } finally {
      setFetchingData(false);
    }
  }, [tenantId, branchCode]);

  // Fetch picked and standard quantity for child part
  const fetchPickedQuantity = useCallback(async (childCode, plsCode) => {
    try {
      const response = await serverApi.post("getPLSCodePickedQuantity", {
        tenantId,
        branchCode,
        plsCode,
        itemType: selectType,
        childPartCode: childCode
      });

      if (response.data?.responseCode === "200" && Array.isArray(response.data.responseData)) {
        const firstItem = response.data.responseData[0] || {};
        form.setFieldsValue({
          binQty: firstItem.standardQuantity || 0,
          pickedQty: firstItem.pickedQuantity || 0,
          remainingQty: firstItem.remainingQuantity || 0
        });
      } else {
        form.setFieldsValue({
          binQty: 0,
          pickedQty: 0,
          remainingQty: 0
        });
      }
    } catch (error) {
      console.error("Error fetching picked quantity:", error);
      toast.error("Failed to load quantity details");
    }
  }, [tenantId, branchCode, selectType, form]);

  // Fetch child parts for selected picklist
  const fetchChildParts = useCallback(async (plsCode) => {
    try {
      const response = await serverApi.post("getPicklistCodetoChildPartCode", {
        tenantId,
        branchCode,
        plsCode,
        itemType: selectType,
        childPartCode: ""
      });

      if (response.data?.responseCode === "200" && Array.isArray(response.data.responseData)) {
        setChildPartOptions(response.data.responseData);
      } else {
        setChildPartOptions([]);
      }
    } catch (error) {
      console.error("Error fetching child parts:", error);
      toast.error("Failed to load child parts");
      setChildPartOptions([]);
    }
  }, [tenantId, branchCode, selectType]);

  // Handle picklist selection
  const handlePicklistChange = useCallback((plsCode) => {
    form.resetFields(["childPart", "planQty", "binQty", "pickedQty", "remainingQty"]);
    fetchChildParts(plsCode);
  }, [form, fetchChildParts]);

  // Handle child part selection
  const handleChildPartChange = useCallback((childPartDesc) => {
    const part = childPartOptions.find(item => item.childPartDesc === childPartDesc);
    if (part) {
      setSelectedChildPart(childPartDesc);
      form.setFieldsValue({ planQty: part.planQty || 0 });
      fetchPickedQuantity(part.childPartCode, form.getFieldValue("pickListCode"));
    }
  }, [childPartOptions, form, fetchPickedQuantity]);

  // Handle form submission
  const handleSubmitData = useCallback(async () => {
    try {
      const formValues = form.getFieldsValue();
      
      // Validate required fields
      if (!formValues.pickListCode || !formValues.childPart || !formValues.qrCode) {
        toast.warning("Please fill in all required fields");
        return;
      }

      const part = childPartOptions.find(item => item.childPartDesc === formValues.childPart) || {};
      
      setFetchingData(true);

      const response = await backendService({
        requestPath: 'insertAndUpdatePrintPage',
        requestData: {
          picklistCode: formValues.pickListCode,
          childPartCode: part.childPartCode,
          planQuantity: Number(formValues.planQty) || 0,
          scanQrCode: formValues.qrCode,
          itemType: selectType,
          customerSno: formValues.custName,
          supplierCode: formValues.supCode,
          packageNo: formValues.packageNo,
          deliveryDate: formValues.deliveryDate?.format("YYYY-MM-DD") || "",
          manufacturingDate: formValues.manufacturingDate?.format("YYYY-MM-DD") || "",
          scannedQuantity: Number(formValues.scanQty) || 0,
          inputQuantity: Number(formValues.scanQty) || 0,
          binQuantity: Number(formValues.binQty) || 0,
          BinCountQuantity: Number(formValues.binQty) || 0,
          binCount: noOfLabels,
          tenantId,
          branchCode,
          createdBy: empId,
          pickedQty: Number(formValues.pickedQty) || 0
        }
      });

      if (response?.responseCode === "200") {
        if (response.responseData && Array.isArray(response.responseData) && response.responseData.length > 0) {
          const updatedData = response.responseData.map((item, index) => ({
            ...item,
            sno: index + 1
          }));
          setPrintB2Data(updatedData);
          setShowPrintDetails(true);
          toast.success("Data submitted successfully!");
          form.resetFields();
        }
      } else {
        toast.error(response?.responseMessage || "Failed to submit data");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error("Error submitting form. Check console.");
    } finally {
      setFetchingData(false);
    }
  }, [form, childPartOptions, selectType, noOfLabels, tenantId, branchCode, empId, setPrintB2Data, setShowPrintDetails]);

  // Handle form cancel
  const handleCancel = useCallback(() => {
    form.resetFields();
    setShowPrintDetails(false);
  }, [form, setShowPrintDetails]);

  // Update form when QR data changes
  useEffect(() => {
    if (qrData) {
      form.setFieldsValue({
        custName: qrData.customerSno,
        supCode: qrData.supplierCode,
        packageNo: qrData.packageNo,
        deliveryDate: qrData.deliveryDate ? moment(qrData.deliveryDate, "YYYY-MM-DD") : null,
        manufacturingDate: qrData.manufactureDate ? moment(qrData.manufactureDate, "YYYY-MM-DD") : null,
        scanQty: qrData.quantity
      });

      if (selectType === "B2") {
        const scanQty = Number(qrData.quantity);
        const binQty = Number(form.getFieldValue("binQty")) || 1;
        const planQty = Number(form.getFieldValue("planQty")) || 0;
        const effectiveQty = Math.min(scanQty, planQty);
        
        if (binQty > 0) {
          setNoOfLabels(Math.floor(effectiveQty / binQty));
        }
      }
    }
  }, [qrData, selectType, form]);

  // Fetch picklist on component mount
  useEffect(() => {
    fetchPicklistDetails();
  }, [fetchPicklistDetails, refreshTrigger]);

  return (
    <>
      <Spin spinning={fetchingData || isLoading} tip="Processing...">
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title={`Print Page - ${selectType}`}
          style={{ marginTop: "20px" }}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              {/* Dynamic Picklist Select Box */}
              <Col span={6}>
                <Form.Item 
                  name="pickListCode" 
                  label="PickList Code"
                  rules={[{ required: true, message: "Please select a picklist" }]}
                >
                  <Select
                    placeholder="Select PickList Code"
                    onChange={handlePicklistChange}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    loading={fetchingData}
                  >
                    {picklistOptions.map((item, index) => (
                      <Option key={index} value={item.plsCode}>
                        {item.plsCode}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item 
                  name="childPart" 
                  label="Child Part"
                  rules={[{ required: true, message: "Please select a child part" }]}
                >
                  <Select
                    placeholder="Select Child Part"
                    onChange={handleChildPartChange}
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

              <Col span={6}>
                <Form.Item name="planQty" label="Plan Quantity">
                  <Input type="number" placeholder="Enter Quantity" readOnly disabled />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item 
                  name="qrCode" 
                  label="Scan QR"
                  rules={[{ required: true, message: "Please scan QR code" }]}
                >
                  <Input type="text" placeholder="Scan QR" onBlur={handleQrBlur} />
                </Form.Item>
              </Col>

              {qrData && (
                <>
                  <Col span={6}>
                    <Form.Item name="custName" label="Customer SNo">
                      <Input readOnly disabled />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="supCode" label="Supplier Code">
                      <Input readOnly disabled />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="packageNo" label="Package No">
                      <Input readOnly disabled />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="deliveryDate" label="Delivery Date">
                      <DatePicker format="YYYY-MM-DD" disabled style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="manufacturingDate" label="Manufacturing Date">
                      <DatePicker format="YYYY-MM-DD" disabled style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="scanQty" label="Scanned Quantity">
                      <Input type="number" placeholder="Enter Quantity" disabled />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="binQty" label="Bin Quantity">
                      <Input type="number" placeholder="Bin Quantity" readOnly disabled />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="pickedQty" label="Picked Quantity">
                      <Input type="number" placeholder="Picked Quantity" readOnly disabled />
                    </Form.Item>
                  </Col>

                  <Col span={6}>
                    <Form.Item name="remainingQty" label="Remaining Quantity">
                      <Input type="number" placeholder="Remaining Quantity" readOnly disabled />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>

            {qrData && (
              <Row gutter={16}>
                <Col span={24}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#00264d" }}>
                    No. of Labels: {noOfLabels}
                  </div>
                </Col>
              </Row>
            )}

            <Row gutter={16} style={{ marginTop: "20px" }}>
              <Col span={24} style={{ textAlign: "center" }}>
                <Button
                  type="primary"
                  size="large"
                  style={{ marginRight: "10px" }}
                  onClick={handleSubmitData}
                  loading={fetchingData}
                >
                  Submit
                </Button>
                <Button
                  size="large"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {showPrintDetails && (
          <Card
            headStyle={{ backgroundColor: "#00264d", color: "white" }}
            title={`Print Details - ${selectType}`}
            style={{ marginTop: "20px" }}
          >
            <Row gutter={16} style={{ marginBottom: "20px" }}>
              <Col span={24} style={{ textAlign: "right" }}>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handlePrintAll}
                  loading={isLoading}
                >
                  Print All Labels
                </Button>
              </Col>
            </Row>

            {printB2Data && printB2Data.length > 0 ? (
              <Table
                columns={printB2Columns}
                dataSource={printB2Data}
                bordered
                pagination={{ pageSize: 5 }}
                rowKey={(record) => record.psDtlId || record.sno}
              />
            ) : (
              <Empty description="No data to display" />
            )}
          </Card>
        )}
      </Spin>
    </>
  );
};

export default PrintPage;
