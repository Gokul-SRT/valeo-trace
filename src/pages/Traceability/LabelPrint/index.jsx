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
  Modal,
} from "antd";
import moment from "moment";
import PicklistWODropdown from "../Kitting/dropdownService";
import serverApi from "../../../serverAPI";
import store from "store";
import { toast } from "react-toastify";

const { Option } = Select;

// Main Kitting Component
const LabelPrint = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const [form] = Form.useForm();
  const [reprintForm] = Form.useForm();
  const [planOptions, setPlanOptions] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [tableData, setTableData] = useState(null);

  const [showReprintModal, setShowReprintModal] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await PicklistWODropdown(
        tenantId,
        branchCode,
        selectedDate
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

  useEffect(() => {
    fetchPlans();
  }, [tenantId, branchCode, selectedDate]);

  const fetchPicklistData = async (plsCode) => {
    try {
      const response = await serverApi.post(
        "labelPrintRelatedPicklistDetails",
        {
          tenantId: tenantId,
          branchCode: branchCode,
          pickListCode: plsCode,
        }
      );

      const resData = response.data;
      if (resData != null) {
        console.log("resData", resData);
        setTableData(resData);
        setShowTable(true);
        console.log("showTable", showTable);
      } else {
        setTableData(null);
        setShowTable(false);
        toast.error("No Data Found");
      }
    } catch (error) {
      toast.error("Error fetching picklist data");
      console.error(error);
    }
  };

  const handleSubmit = async (values) => {
    setSelectedPlan(values.plan);
    fetchPicklistData(values.plan);
  };

  const verifyTraceabilityQRCode = async () => {
    try {
      const response = await serverApi.post("verifyTraceabilityQRCode", {
        tenantId: tenantId,
        branchCode: branchCode,
        qrCode: reprintForm.getFieldValue("serial"),
      });

      const res = response.data;
      if (res.responseCode === "200") {
        toast.success(res.responseDataMessage);
        handleReprintSubmit();
        
      } else {
        toast.error(res.responseDataMessage);
      }
    } catch (error) {
      toast.error("Error,Please try again later.");
    }
  };

  const insertTraceabilityQRCodeDetails = async (qrCodeVal) => {
    try {
      const currentDate = moment().format("YYYY-MM-DD");

      const response = await serverApi.post("insertTraceabilityQRCode", {
        tenantId: tenantId,
        branchCode: branchCode,
        qrDate: currentDate,
        plCode: selectedPlan,
        qrCode: qrCodeVal,
        printSts: "1",
      });

      const res = response.data;
      if (res.responseCode === "200") {
        toast.success(res.responseDataMessage);
      } else {
        toast.error(res.responseDataMessage);
      }
    } catch (error) {
      toast.error("Error,Please try again later.");
    }
  };

  const handlePrint = async () => {
    try {
      const lineCode = tableData.lineCode;
      const productGroupCode = tableData.productGroupCode;
      const productCode = tableData.productCode;
      const currentDateTime = moment().format("YYYYMMDDHHmmss");


/*
      let cleanProductCode = productCode;

      if (productGroupCode == 1) {
        cleanProductCode = productCode.replace(/OE$/, "");
      } else if (productGroupCode == 2) {
        cleanProductCode = productCode.replace(/OES$/, "");
      } else {
        cleanProductCode = productCode.replace(/IAM$/, "");
      }
      */
      const strData = `${lineCode} ${productGroupCode} ${productCode} ${currentDateTime}`;



      const payload = {
        printerName: "TSC MH241",
        data: strData, // PRN data
      };

      const response = await serverApi.post("/tscPrintQrByMachine", payload);
      const resData = response.data;

     console.log("resDataresDataresData",resData)
      // if (resData != null && resData === "200") {
         if (resData != null && resData == 200) {
        toast.success("Print Successfuly");

        insertTraceabilityQRCodeDetails(strData);
      } else {
        toast.error("Print Failed");
      }
    } catch (err) {
      toast.error("Print Error");
    }
  };

  const handleReprintSubmit = async () => {
    try {
      const payload = {
        data: serialNumber,
        printerName: "TSC MH241",
      };

      const response = await serverApi.post("/tscPrintQrByMachine", payload);

      const resData = response.data;
      if (resData != null && resData === "200") {
        toast.success("Re-Print Successful");
        setShowReprintModal(false);
        setSerialNumber("");
        handleReprintCancel(); // close and reset
      } else {
        toast.error("Re-Print Failed");
      }
    } catch (err) {
      toast.error("Re-Print API Error");
    }
  };

  const handleReprintCancel = () => {
    setShowReprintModal(false);
    reprintForm.resetFields();
    setSerialNumber("");
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Card
          title="Label Print"
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
                  <DatePicker
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD"
                    onChange={(date) =>
                      setSelectedDate(date ? date.format("YYYY-MM-DD") : null)
                    }
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="PickList Code"
                  name="plan"
                  rules={[
                    { required: true, message: "Please select a pickListCode" },
                  ]}
                >
                  <Select
                    placeholder="Select Work Order"
                    loading={loadingPlans}
                    allowClear
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
            title={`Print Details - ${selectedPlan}`}
            headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
          >
            {/* <div style={{ marginBottom: 16 }}>
        <a style={{ marginRight: 20 }} onClick={handlePrint}>Print</a>
        <a onClick={() => setShowReprintModal(true)}>Re-Print</a>
      </div> */}

            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                style={{ marginRight: 12 }}
                onClick={handlePrint}
              >
                Print
              </Button>

              <Button type="default" onClick={() => setShowReprintModal(true)}>
                Re-Print
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Modal
        title="Re-Print QR Code"
        open={showReprintModal}
        onCancel={() => setShowReprintModal(false)}
        footer={null}
      >
        <Form
          form={reprintForm}
          onFinish={verifyTraceabilityQRCode}
          layout="vertical"
        >
          <Form.Item
            label="Serial Number"
            name="serial"
            rules={[{ required: true, message: "Please enter Serial Number" }]}
          >
            <Input
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </Form.Item>

          {/* Buttons in same row */}
          <Form.Item>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
              <Button onClick={() => handleReprintCancel()}>Cancel</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LabelPrint;
