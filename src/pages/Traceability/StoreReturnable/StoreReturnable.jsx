import React, { useState, useEffect } from "react";
import moment from "moment";
import {
  EyeOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  Card,
  Form,
  Select,
  Button,
  Space,
  Row,
  Col,
  Table,
  Dropdown,
  Modal,
  Input,
} from "antd";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import serverApi from "../../../serverAPI";
import store from "store";
import QRModal from "../../Traceability/StoreReturnable/QrCodeModel";
import Loader from "../../../Utills/Loader";

const { Option } = Select;

const tenantId = store.get("tenantId");
const branchCode = store.get("branchCode");

const StoreReturnable = () => {
  const [newCode, setReplaceqrcode] = useState("");
  const [returnChildPart, setReturnChildPart] = useState(null);
  const [pickListCode, setPickListCode] = useState(null);
  const [childPartCode, setChildPartCode] = useState(null);

  const [remainQty, setRemainQty] = useState("");
  const [balanceQty, setBalanceQty] = useState(""); // New state for balance quantity
  const [showTable, setShowTable] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [picklistOptions, setPicklistOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [childPartMastOptions, setChildPartMastOptions] = useState([]);
  const [selectQrData, setSelectQrData] = useState("");
  const [childPartDesc, setChildPartDesc] = useState("");
  const [rawScanned, setRawScanned] = useState("");
  const returnChildPartOptions = [
    { id: 1, name: "Used Qty" },
    { id: 2, name: "Unused Qty" },
  ];

  // Backend Data Retrieval State
  const [retrievedData, setRetrievedData] = useState([]);
  const [retrievalLoading, setRetrievalLoading] = useState(false);

  // Handlers
  const handlePickListChange = (value) => {
    setPickListCode(value);
  };
  const handleCancel = () => {
    form.resetFields();
    setReturnChildPart(null);
    setPickListCode(null);
    setChildPartCode(null);
    setRemainQty("");
    setBalanceQty(""); // Reset balance qty
    setRawScanned("");
    setChildPartDesc("");
    setShowTable(false);
  };
  const handleSearch = () => {
    setShowTable(true);
    toast.success("Search submitted");
  };
  const handleReset = () => {
    setReturnChildPart(null);
    setShowTable(false);
  };
  const onScanInputChange = (e) => {
    const value = e.target.value;
    setRawScanned(value);
  };
  const fetchPicklistPLSDetails = async () => {
    setLoading(true);
    try {
      const response = await serverApi.post("getPicklistWO", {
        tenantId,
        branchCode,
        planDate: "",
      });
      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setPicklistOptions(res.responseData);
      } else {
        setPicklistOptions([]);
        toast.warning("No picklist data available");
      }
    } catch (error) {
      toast.error("Error fetching picklist codes.");
      setPicklistOptions([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchChildPartByPicklist = async (plsCode) => {
    try {
      const response = await serverApi.post(
        "getChildPartDropDownBypicklistCode",
        {
          picklistCode: plsCode,
          tenantId,
          branchCode,
        }
      );
      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        const options = res.responseData.map((item) => ({
          value: item.productCode,
          label: item.childPartDesc || item.productCode,
          desc: item.childPartDesc,
        }));
        setChildPartMastOptions(options);
        if (options.length === 1) {
          setChildPartCode(options[0].value);
          setChildPartDesc(options[0].desc);
          // Fetch balance qty when only one child part is available
          fetchBalanceQty(plsCode, options[0].value);
        }
      } else {
        setChildPartMastOptions([]);
        setChildPartCode(null);
        setChildPartDesc("");
        setBalanceQty(""); // Clear balance qty
        toast.warning("No Child Part Found");
      }
    } catch (err) {
      toast.error("Error loading child parts");
    }
  };

  const fetchChildPartDescription = async (childCode) => {
    try {
      const response = await serverApi.post("getChildPartDescByChildpart", {
        childPartCode: childCode,
        tenantId,
        branchCode,
      });
      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        const desc = res.responseData[0].childPartDesc;
        setChildPartDesc(desc);
      } else {
        setChildPartDesc("");
        toast.warning("No Description Found");
      }
    } catch (error) {
      toast.error("Error loading child part description");
    }
  };

  // Fetch balance quantity from backend API
  const fetchBalanceQty = async (plsCode, childPartCode) => {
    try {
      const response = await serverApi.post("getPendingCount", {
        pickListCode: plsCode,
        childPartCode: childPartCode,
        tenantId: tenantId,
        branchCode: branchCode,
      });
      const res = response.data;
      if (
        res.responseCode === "200" &&
        Array.isArray(res.responseData) &&
        res.responseData.length > 0
      ) {
        const balanceQty =
          res.responseData[0].balanceQty || res.responseData[0].BALANCE_QTY;
        setBalanceQty(balanceQty ? balanceQty.toString() : "0");
        toast.success("Balance quantity loaded");
      } else {
        setBalanceQty("0");
        toast.warning("No balance quantity found");
      }
    } catch (error) {
      console.error("Error fetching balance quantity:", error);
      setBalanceQty("0");
      toast.error("Failed to load balance quantity");
    }
  };

  // Backend Retrieval API call
  const getStoreReturnableDtl = async () => {
    setRetrievalLoading(true);
    try {
      const response = await serverApi.post("getStoreReturnableDtl", {
        tenantId,
        branchCode,
      });
      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setRetrievedData(
          res.responseData.map((item, i) => ({
            key: i,
            plsCode: item.plsCode,
            childPartCode: item.childPartCode,
            returnChildPart: item.returnChildPart,
            childPartDesc: item.childPartDescription,
            childPartScan: item.childPartScan,
            qrCode: JSON.stringify(item),
          }))
        );
      } else {
        setRetrievedData([]);
        toast.warning("No store returnable details found");
      }
    } catch (error) {
      setRetrievedData([]);
      toast.error("Failed to load store returnable details");
    } finally {
      setRetrievalLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchPicklistPLSDetails();
    getStoreReturnableDtl();
  }, []);

  const callStoreReturnableInsertAPI = async () => {
    try {
      const scannedValue = form.getFieldValue("childPartScan");

      console.log(newCode,"newCode");
      console.log(scannedValue,"scannedValue");
      const payload = {
        plsCode: pickListCode,
        childPartCode: childPartCode || "",
        childPartDesc: childPartDesc,
        childPartScan:
          returnChildPart === "Unused Qty" ? scannedValue : newCode,
        returnChildPart: returnChildPart,
        tenantId: tenantId,
        branchCode: branchCode,
      };
      const response = await serverApi.post(
        "getStoreReturnableScanInsert",
        payload
      );
      const res = response.data;
      if (res.responseCode === "200") {
        setQrModalVisible(true);
        setSelectQrData(payload);
        toast.success("Inserted Successfully");
      } else {
        toast.error(res.responseMessage || "Insert Failed!");
      }
    } catch (error) {
      toast.error("API Error: " + error.message);
    }
  };
  const handlePrint = () => {
    callStoreReturnableInsertAPI();
    setReplaceqrcode("");
  };
  const unusedStoreReturnableInsert = async () => {
    try {
      const scannedValue = form.getFieldValue("childPartScan");
      const usedinputscanvalue = form.getFieldValue("child Part Scan");
      const payload = {
        plsCode: pickListCode,
        childPartCode: childPartCode || "",
        childPartDesc: "",
        childPartScan:
          returnChildPart === "Unused Qty" ? scannedValue : usedinputscanvalue,
        returnChildPart: returnChildPart,
        tenantId: tenantId,
        branchCode: branchCode,
      };
      const response = await serverApi.post(
        "getStoreReturnableScanInsert",
        payload
      );
      const res = response.data;
      if (res.responseCode === "200") {
        toast.success("Inserted Successfully");
      } else {
        toast.error(res.responseMessage || "Insert Failed!");
      }
    } catch (error) {
      toast.error("API Error: " + error.message);
    }
  };
  const handleRelease = () => {
    unusedStoreReturnableInsert();
  };
  const handleremainQty = (value) => {
    setRemainQty(value);
    let start = 42;
    let end = 50;
    const valueString = fixLength(value, 8);
    let result =
      rawScanned.substring(0, start) + valueString + rawScanned.substring(end);
    setReplaceqrcode(result);
  };
  const handletPickListCode = (value) => {
    setPickListCode(value);
    fetchChildPartByPicklist(value);
    // Clear balance qty when picklist changes
    setBalanceQty("");
  };
  function fixLength(value, length) {
    return value.toString().padEnd(length, " ");
  }
  const handleChildPartCode = (value) => {
    setChildPartCode(value);
    fetchChildPartDescription(value);

    // Fetch balance quantity when child part is selected
    if (pickListCode && value) {
      fetchBalanceQty(pickListCode, value);
    } else {
      setBalanceQty("");
    }
  };

  const columns = [
    { title: "Date", dataIndex: "date", width: 120 },
    { title: "Product", dataIndex: "product", width: 150 },
    { title: "Line", dataIndex: "line", width: 100 },
    { title: "Work Order", dataIndex: "workOrder", width: 130 },
    { title: "Child Part", dataIndex: "childPart", width: 200 },
    { title: "Quantity", dataIndex: "quantity", width: 100, align: "center" },
  ];
  // Backend columns
  const returnableColumns = [
    { title: "Pick List Code", dataIndex: "plsCode", width: 180 },
    { title: "Child Part Code", dataIndex: "childPartCode", width: 150 },
    { title: "Return Child Part", dataIndex: "returnChildPart", width: 120 },
    { title: "Child Part Desc", dataIndex: "childPartDesc", width: 180 },
    { title: "Child Part Scan", dataIndex: "childPartScan", width: 320 },
  ];
  const [form] = Form.useForm();

  const handleViewQR = (qrData) => {
    setSelectedQrData(qrData);
    setQrModalVisible(true);
  };
  const handleDownloadQR = () => {
    const el = document.getElementById("qr-code-container");
    if (!el) return toast.error("No QR to download");
    html2canvas(el).then((canvas) => {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `QRCode-${Date.now()}.png`;
      a.click();
    });
  };
  const handlePrintQR = () => {
    const el = document.getElementById("qr-code-container");
    if (!el) return;
    html2canvas(el).then((canvas) => {
      const url = canvas.toDataURL("image/png");
      const w = window.open("", "_blank");
      w.document.write(`
        <html><body>
        <img src="${url}" />
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          }
        </script>
        </body></html>
      `);
      w.document.close();
    });
  };

  return (
    <>
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 24, paddingBottom: 16 }}
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title="Store Returnable"
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Form.Item label="Return Child Part *">
                <Select
                  placeholder="Select Return Type"
                  value={returnChildPart}
                  onChange={(v) => {
                    setReturnChildPart(v);
                  }}
                >
                  {returnChildPartOptions.map((o) => (
                    <Option key={o.id} value={o.name}>
                      {o.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {returnChildPart === "Used Qty" && (
              <>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item label="Pick List Code *">
                    <Select
                      placeholder="Select Pick List Code"
                      value={pickListCode}
                      onChange={handletPickListCode}
                      loading={loading}
                    >
                      {picklistOptions.map((pl) => (
                        <Option key={pl.plsCode} value={pl.plsCode}>
                          {pl.plsCode}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item label="Child Part Code *">
                    <Select
                      placeholder={
                        pickListCode
                          ? "Select Child Part"
                          : "First select Pick List Code"
                      }
                      value={childPartCode}
                      onChange={handleChildPartCode}
                      disabled={!pickListCode}
                      showSearch
                      optionFilterProp="children"
                    >
                      {childPartMastOptions.map((cp) => (
                        <Option key={cp.value} value={cp.value}>
                          {cp.value}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item label="Child Part Description *">
                    <Input
                      placeholder="Child Part Description"
                      value={childPartDesc}
                      readOnly
                    />
                  </Form.Item>
                </Col>
                {/* NEW: Balance Qty Column */}
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item label="Balance Qty *">
                    <Input
                      placeholder="Balance Quantity"
                      value={balanceQty}
                      disabled
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item name="child Part Scan" label="Child Part Scan *">
                    <Input
                      placeholder="Scan Child Part"
                      value={newCode}
                      onChange={onScanInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item label="Remain Quantity *">
                    <Input
                      type="number"
                      placeholder="Enter Remain Qty"
                      value={remainQty}
                      onChange={(e) => handleremainQty(e.target.value)}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
            {returnChildPart === "Unused Qty" && (
              <>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item
                    label="Pick List Code *"
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder="Select Pick List Code"
                      value={pickListCode}
                      onChange={handlePickListChange}
                      style={{ width: "100%" }}
                      loading={loading}
                    >
                      {picklistOptions.map((pl) => (
                        <Option key={pl.plsCode} value={pl.plsCode}>
                          {pl.plsCode}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={6} lg={5}>
                  <Form.Item
                    name="childPartScan"
                    label="Child Part Scan *"
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Scan Child Part" />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
          <Form.Item style={{ textAlign: "center", marginTop: 24 }}>
            <Space>
              {returnChildPart === "Used Qty" && (
                <>
                  <Button
                    type="primary"
                    onClick={handlePrint}
                    style={{ backgroundColor: "#00264d" }}
                  >
                    Print
                  </Button>
                  <Button
                    htmlType="button"
                    onClick={handleCancel}
                    style={{ backgroundColor: "#00264d", color: "white" }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {returnChildPart === "Unused Qty" && (
                <>
                  <Button
                    type="primary"
                    onClick={handleRelease}
                    style={{ backgroundColor: "#00264d" }}
                  >
                    Release
                  </Button>
                  <Button
                    htmlType="button"
                    onClick={handleCancel}
                    style={{ backgroundColor: "#00264d", color: "white" }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {!returnChildPart && (
                <>
                  <Button
                    type="primary"
                    onClick={handleSearch}
                    style={{ backgroundColor: "#00264d" }}
                  >
                    Submit
                  </Button>
                  <Button
                    htmlType="button"
                    onClick={handleReset}
                    style={{ backgroundColor: "#00264d", color: "white" }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
      {/* BACKEND DATA TABLE BELOW */}
      <Card
        title="Store Returnable Retrieval Details"
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
      >
        <div style={{ position: "relative" }}>
          <Table
            columns={returnableColumns}
            dataSource={retrievedData}
            // loading={retrievalLoading}
            pagination={{ pageSize: 6 }}
            bordered
            scroll={{ x: 1200 }}
          />
          {retrievalLoading && (
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
              }}
            >
              <Loader />
            </div>
          )}
        </div>
      </Card>
      <Modal
        title="QR Code Details"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        centered
        width={400}
        footer={
          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadQR}
              style={{ marginRight: 8 }}
            >
              Download
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintQR}
              style={{ marginRight: 8 }}
            >
              Print
            </Button>
            <Button onClick={() => setQrModalVisible(false)}>Close</Button>
          </div>
        }
      >
        <div
          id="qr-code-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 200,
          }}
        >
          {/* <QRCode value={selectedQrData} size={200} /> */}
        </div>
      </Modal>
      <QRModal
        qrModalVisible={qrModalVisible}
        setQrModalVisible={setQrModalVisible}
        selectedQrData={selectQrData}
      />
    </>
  );
};
export default StoreReturnable;
