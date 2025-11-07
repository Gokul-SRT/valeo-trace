import React, { useState, useEffect } from "react";
import { Card, Select, Row, Col, Button, Typography, Progress,Input } from "antd";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import serverApi from "../../../serverAPI";
import "./style.css";
import store from "store";

const { Option } = Select;
const { Text } = Typography;

const TraceabilityLog = () => {
  const [lines, setLines] = useState([]);
  const [products, setProducts] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [traceabilityData, setTraceabilityData] = useState([]);

  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [pickListCodeVerrify, setPickListCodeVerrify] = useState("");




  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId")
  // Fetch Lines on page load
  useEffect(() => {
    fetchLines();
  }, []);


  const fetchLines = async () => {
    try {
      const response = await serverApi.post("getLineDropdown", {
        tenantId,
        branchCode,
        isActive: "1",
      });
  
      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setLines(res.responseData);
      } else {
        setLines([]);
        toast.error(response.data.responseMessage || "Failed to fetch lines");
      }
    } catch (error) {
     
      toast.error("Error fetching lineCode. Please try again later.");
    }
  };

  

  // Fetch Products when Line changes
  useEffect(() => {
    if (selectedLine) {
      setSelectedProduct(null);
      setProducts([]);
      setSelectedWorkOrder(null);
      setWorkOrders([]);
      fetchProducts(selectedLine);
    }
  }, [selectedLine]);

  const fetchProducts = async (lineId) => {
    try {
      const response = await serverApi.post("getProductByLine", { tenantId:tenantId, branchCode:branchCode, lineCode:lineId });
      if (response?.data?.responseCode === "200") setProducts(response.data.responseData);
      else toast.error(response.data.responseMessage || "Failed to fetch products");
    } catch (error) {
      console.error(error);
      toast.error("Error fetching products");
    }
  };

  // Fetch Work Orders when Product changes
  useEffect(() => {
    if (selectedProduct) {
      setSelectedWorkOrder(null);
      setWorkOrders([]);
      fetchWorkOrders(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchWorkOrders = async (productId) => {
    try {
      const response = await serverApi.post("getplsCodeByProduct", { tenantId:tenantId, branchCode:branchCode, lineCode:productId });
      if (response?.data?.responseCode === "200") setWorkOrders(response.data.responseData);
      else toast.error(response.data.responseMessage || "Failed to fetch work orders");
    } catch (error) {
      console.error(error);
      toast.error("Error fetching work orders");
    }
  };

  // Fetch Traceability Data when Work Order is selected
  // useEffect(() => {
  //   if (selectedWorkOrder) fetchTraceabilityData(selectedWorkOrder);
  // }, [selectedWorkOrder]);

  const fetchTraceabilityData = async (workOrderId) => {
    setPickListCodeVerrify(workOrderId);
    try {
      const response = await serverApi.post("getTraceabilityLogDtails", {
        tenantId:tenantId,
        branchCode:branchCode,
        picklistCode:workOrderId,
      });
      if (response?.data?.length>0) {
        setTraceabilityData(response.data);
        setShowDetails(true);
      } else {
        setTraceabilityData([]);
        setShowDetails(false);
        toast.error(response.data || "Failed to fetch traceability data");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching traceability data");
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!selectedLine) newErrors.line = "Please select a Line";
    if (!selectedProduct) newErrors.product = "Please select a Product";
    if (!selectedWorkOrder) newErrors.workOrder = "Please select a Work Order";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && selectedWorkOrder) fetchTraceabilityData(selectedWorkOrder);
  };

  const handleCancel = () => {
    setSelectedLine(null);
    setSelectedProduct(null);
    setSelectedWorkOrder(null);
    setProducts([]);
    setWorkOrders([]);
    setTraceabilityData([]);
    setErrors({});
    setShowDetails(false);
  };

  const handleScan = async () => {
    const scannedValue = scanValue.trim();
    console.log("scannedValue",scannedValue)
   if (!scannedValue) return;
  
     // Regex: ignore anything before the 18-digit prefix
     const match = scannedValue.match(/\d{18}([A-Z0-9]+)\s+(\d+)/i);
  
     if (!match) {
       toast.error("Invalid barcode format");
       setScanValue("");
       return;
     }
   
     const childPartC = match[1];  // e.g., 157042 or CF72760
     const picketQt = Number(match[2]); // e.g., 400
   
     if (isNaN(picketQt)) {
       toast.error("Invalid line quantity");
       setScanValue("");
       return;
     }
   
     console.log("childPartCode:", childPartC);
     console.log("lineQty:", picketQt);
    
    try {
      // API call
      const response = await serverApi.post("updateLineQtywithChildPartCode", {
        tenantId:tenantId,
        branchCode:branchCode,
        childPartCode:childPartC,
        lineQty:picketQt,
        plsId:pickListCodeVerrify,
      });
  
      if (response.data==="success") {
        // Update table
        const updatedData = traceabilityData.map((r) =>
          r.childPartCode === childPartC ? { ...r, lineQty: Number(r.lineQty) + Number(picketQt) } : r
        );
        setTraceabilityData(updatedData);
       // setFinalSubmitAndPartialSubmitDatas(updatedData);
        toast.success("Scan processed successfully!");
      } else {
        toast.error(response.data);
      }
    } catch (err) {
      toast.error("Error while processing scan");
    }
  
    setScanValue(""); // reset input
  };



  return (
    <div className="traceability-container">
      <Card title="Traceability Log" headStyle={{ backgroundColor: "#00264d", color: "white" }} bodyStyle={{ padding: 24 }}>
      <Row gutter={[16, 24]}>
  {/* Line Dropdown */}
  <Col xs={24} md={8}>
    <Text strong>Line<span className="required">*</span></Text>
    <Select
      placeholder="Select Line"
      value={selectedLine}
      onChange={setSelectedLine}
      style={{ width: "100%", marginTop: 4 }}
    >
      {lines.map(line => (
        <Option key={line.lineMstCode} value={line.lineMstCode}>
          {line.lineMstDesc}
        </Option>
      ))}
    </Select>
    {errors.line && <div className="error-text">{errors.line}</div>}
  </Col>

  {/* Product Dropdown */}
  <Col xs={24} md={8}>
    <Text strong>Product<span className="required">*</span></Text>
    <Select
      placeholder="Select Product"
      value={selectedProduct}
      onChange={setSelectedProduct}
      style={{ width: "100%", marginTop: 4 }}
      disabled={!selectedLine}
    >
      {products.map(product => (
        <Option key={product.productCode} value={product.productCode}>{product.prodDesc}</Option>
      ))}
    </Select>
    {errors.product && <div className="error-text">{errors.product}</div>}
  </Col>

  {/* Work Order Dropdown */}
  <Col xs={24} md={8}>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <Text strong>Work Order<span className="required">*</span></Text>
    <Select
      placeholder="Select Work Order"
      value={selectedWorkOrder}
      onChange={setSelectedWorkOrder}
      style={{ width: '100%', marginTop: 4 }}
      disabled={!selectedProduct}
    >
      {workOrders.map(wo => (
        <Option key={wo.plsCode} value={wo.plsCode}>{wo.plsCode}</Option>
      ))}
    </Select>
    {errors.workOrder && <div className="error-text">{errors.workOrder}</div>}
  </div>
</Col>
</Row>


        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Button type="primary" onClick={handleSubmit} style={{ marginRight: 16 }}>Submit</Button>
          <Button type="default" onClick={handleCancel}>Cancel</Button>
        </div>
      </Card>

      {showDetails && traceabilityData.length > 0 && (
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
  {/* Scan Input */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
    <label htmlFor="scan" style={{ minWidth: "30px" }}>Scan:</label>
    <Input
      id="scanInput"
      placeholder="Scan or paste barcode here"
      value={scanValue}
      onChange={(e) => setScanValue(e.target.value)}
      onBlur={handleScan}
      style={{ marginBottom: "10px", width: "500px" }}
      autoFocus
    />
  </div>

  <div className="table-wrapper">
    {/* Table Header */}
    <Row
      className="table-header"
      style={{
        fontWeight: "bold",
        background: "#f2f2f2",
        textAlign: "center",
        padding: "8px 0",
        position: "relative"
      }}
    >
      <Col span={10}>Station Bin Barcode</Col>
      <div className="vertical-grey-line"></div>
      <Col span={14}>Child Part Lot Barcode</Col>
    </Row>

    <div className="table-content">
      <div className="vertical-grey-line"></div>

      {traceabilityData.map((op, idx) => {
        // Check if all child parts are 100%
        const allComplete = op.lineTraceabilityList.every(
          (part) => part.storeQty > 0 && part.lineQty === part.storeQty
        );
        const opColor = allComplete ? "#52c41a" : "#d9d9d9"; // green or gray

        return (
          <Row key={idx} align="middle" className="table-row">
            {/* OP Code */}
            <Col span={10} className="cell-center">
              <div
                className="green-box"
                style={{
                  backgroundColor: opColor,
                  color: allComplete ? "#fff" : "#000",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  textAlign: "center",
                }}
              >
                {op.operationCode}
              </div>
            </Col>

            {/* Child Parts */}
            <Col span={14}>
              <div style={{ display: "flex", gap: "40px", marginLeft: 20 }}>
                {op.lineTraceabilityList.map((part, pIndex) => {
                  let percent = 0;
                  if (part.storeQty > 0 && part.lineQty > 0) {
                    percent = Math.min((part.lineQty / part.storeQty) * 100, 100);
                  }
                  const boxColor = percent === 100 ? "#52c41a" : "#d9d9d9"; // green if 100%

                  return (
                    <div
                      key={pIndex}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="shifted-box"
                        style={{
                          backgroundColor: boxColor,
                          color: percent === 100 ? "#fff" : "#000",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          minWidth: "80px",
                          textAlign: "center",
                        }}
                      >
                        {part.childPartDesc}
                      </div>
                      <div style={{ width: 120, marginTop: 4 }}>
                        <Progress
                          percent={percent}
                          size="small"
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        );
      })}
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
        onClick={() => console.log("Next Process Clicked")}
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
