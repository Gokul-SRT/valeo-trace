import React, { useRef, useState, useEffect } from "react";
import {
  Card,
  Select,
  Row,
  Col,
  Button,
  Typography,
  Progress,
  Input,
  Form,
} from "antd";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import serverApi from "../../../serverAPI";
import "./style.css";
import store from "store";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { Text } = Typography;

const TraceabilityLog = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
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

  const [selectedLineDesc, setSelectedLineDesc] = useState("");
  const [selectedProductDesc, setSelectedProductDesc] = useState("");

  const [isProcess, setIsProcess] = useState(0);

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");
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
      const response = await serverApi.post("getProductByLine", {
        tenantId: tenantId,
        branchCode: branchCode,
        lineCode: lineId,
      });
      if (response?.data?.responseCode === "200")
        setProducts(response.data.responseData);
      else
        toast.error(
          response.data.responseMessage || "Failed to fetch products"
        );
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
      fetchWorkOrders(selectedProduct, selectedLine);
    }
  }, [selectedProduct]);

  const fetchWorkOrders = async (productCode, lineCode) => {
    try {
      const response = await serverApi.post("getplsCodeByProduct", {
        tenantId: tenantId,
        branchCode: branchCode,
        productCode: productCode,
        lineCode: lineCode,
      });
      if (response?.data?.responseCode === "200")
        setWorkOrders(response.data.responseData);
      else
        toast.error(
          response.data.responseMessage || "Failed to fetch work orders"
        );
    } catch (error) {
      console.error(error);
      toast.error("Error fetching work orders");
    }
  };

  const fetchTraceabilityData = async (workOrderId) => {
    setPickListCodeVerrify(workOrderId);
    try {
      const response = await serverApi.post("getTraceabilityLogDtails", {
        tenantId: tenantId,
        branchCode: branchCode,
        picklistCode: workOrderId,
      });
      if (response?.data?.length > 0) {
        setTraceabilityData(response.data);
        setShowDetails(true);
        // For Next Process
        const firstOp = response.data[0];
        const firstLineTrace = firstOp?.lineTraceabilityList?.[0];
        setIsProcess(String(firstLineTrace?.isProcess ?? "0"));
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
    if (!selectedLine) newErrors.line = "Please Select Line";
    if (!selectedProduct) newErrors.product = "Please Select Product";
    if (!selectedWorkOrder) newErrors.workOrder = "Please Select Work Order";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && selectedWorkOrder)
      fetchTraceabilityData(selectedWorkOrder);
  };

  const handleCancel = () => {
    setSelectedLine(null);
    setSelectedLineDesc("");
    setSelectedProduct(null);
    setSelectedProductDesc("");
    setSelectedWorkOrder(null);
    setProducts([]);
    setWorkOrders([]);
    setTraceabilityData([]);
    setErrors({});
    setShowDetails(false);
  };

  const getCurrentDateTime = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  /*
  const handleScan = async (scanned) => {
    const scannedValue = scanned.trim();
   
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
     const lineQt = Number(match[2]); // e.g., 400
   
     if (isNaN(lineQt)) {
       toast.error("Invalid line quantity");
       setScanValue("");
       return;
     }
   
     console.log("childPartCode:", childPartC);
     console.log("lineQty:", lineQt);
    
    try {
      // API call
      const response = await serverApi.post("updateLineQtywithChildPartCode", {
        tenantId:tenantId,
        branchCode:branchCode,
        childPartCode:childPartC,
        lineQty:lineQt,
        picklistCode:pickListCodeVerrify,
      });
  
      if (response.data==="success") {
      
        fetchTraceabilityData(selectedWorkOrder);
       
        toast.success("Scan processed successfully!");
      } else {
        toast.error(response.data);
      }
    } catch (err) {
      toast.error("Error while processing scan");
    }
  
    setScanValue(""); // reset input
  };
  */

  const handleScan = async (scanned) => {
    const scannedValue = scanned; // spaces are important, do not trim
    console.log("Length:", scannedValue.length);

    // Check if barcode is at least the expected length
    if (scannedValue.length > 104) {
      toast.error("Invalid barcode length");
      return;
    }

    // Extract fields based on fixed positions (spaces included)
    const invoiceNumber = scannedValue.substring(0, 17); // 0 - 16 (17 chars)
    const childPartCode = scannedValue.substring(17, 35); // 17 - 34 (18 chars)
    const vendorCode = scannedValue.substring(35, 42); // 35 - 41 (7 chars)
    const lineQtyStr = scannedValue.substring(42, 50); // 42 - 49 (8 chars)
    const labelNumber = scannedValue?.substring(50, 68)?.trim() || ""; // 50 - 67 (18 chars)
    const batchNumber = scannedValue.substring(68, 80); // 68 - 79 (12 chars)
    const deliveryDate = scannedValue.substring(80, 88); // 80 - 87 (8 chars)
    const productionDate = scannedValue.substring(88, 96); // 88 - 95 (8 chars)
    const expirationDate = scannedValue.substring(96, 104); // 96 - 103 (8 chars)

    // Convert quantity to number safely
    const lineQt = Number(lineQtyStr.trim());
    if (isNaN(lineQt)) {
      toast.error("Invalid quantity");
      return;
    }

    console.log("Invoice Number:", invoiceNumber);
    console.log("Child Part Code:", childPartCode);
    console.log("Vendor Code:", vendorCode);
    console.log("Picked Qty:", lineQt);
    console.log("Label Number:", labelNumber);
    console.log("Batch Number:", batchNumber);
    console.log("Delivery Date:", deliveryDate);
    console.log("Production Date:", productionDate);
    console.log("Expiration Date:", expirationDate);

    // Check if child part exists in your list

    const childPar = traceabilityData.flatMap(
      (op) => op.lineTraceabilityList || []
    );

    const matchedChildPart = childPar.find((cp) =>
      childPartCode.includes(cp.childPartCode)
    );

    if (!matchedChildPart) {
      toast.error("Incorrect lot/part barcode scanned");
      return;
    }

    console.log("Matched Child Part:", matchedChildPart.childPartCode);
    try {
      // API call
      const response = await serverApi.post("updateLineQtywithChildPartCode", {
        tenantId: tenantId,
        branchCode: branchCode,
        childPartCode: matchedChildPart.childPartCode,
        lineQty: lineQt,
        picklistCode: pickListCodeVerrify,
        packageNumber: labelNumber,
      });

      if (response.data === "success") {
        toast.success("Scan processed successfully!");
        // Call your second API here
        const scannedItem = {
          plsId: pickListCodeVerrify,
          itemNo: matchedChildPart.childPartCode,
          lineQty: lineQt,
          lotNumber: batchNumber.trim(),
          scanDateTime: getCurrentDateTime(),
          tenantId: tenantId,
          branchCode: branchCode,
        };

        const payload = {
          tenantId: tenantId,
          branchCode: branchCode,
          isProcess: "0",
          scannerId: "1",
          employeeId: employeeId,
          jsonMessage: JSON.stringify(scannedItem), // convert object to JSON string
        };

        try {
          const insertResponse = await serverApi.post(
            "insertScanDataChildPartConsumption",
            payload
          );

          if (insertResponse.data === "success") {
            toast.success("Scan data inserted successfully!");
          } else {
            toast.error(insertResponse.data || "Insert failed!");
          }
        } catch (insertErr) {
          toast.error("Error while inserting scan data!");
        }

        fetchTraceabilityData(selectedWorkOrder);
      } else {
        toast.error(response.data);
      }
    } catch (err) {
      toast.error("Error while processing scan");
    }

    setScanValue(""); // reset input
  };

  const inputRef = useRef(null);
  const scanTimerRef = useRef(null);

  const processScan = async () => {
    const value = form.getFieldValue("scan")?.trim();

    if (!value) return;

    const response = await handleScan(value); // API call

    form.resetFields(["scan"]); // clear only this field
    inputRef.current?.focus();
  };

  const handleKeyDown = () => {
    clearTimeout(scanTimerRef.current);

    scanTimerRef.current = setTimeout(() => {
      processScan();
    }, 300);
  };

  return (
    <div className="traceability-container">
      <Card
        title="Traceability Log"
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[16, 24]}>
          {/* Line Dropdown */}
          <Col xs={24} md={8}>
            <Text strong>
              Line<span className="required">*</span>
            </Text>
            <Select
              placeholder="Select Line"
              value={selectedLine}
              onChange={(value) => {
                setSelectedLine(value);
                const line = lines.find((l) => l.lineMstCode === value);
                setSelectedLineDesc(line ? line.lineMstDesc : "");
              }}
              style={{ width: "100%", marginTop: 4 }}
            >
              {lines.map((line) => (
                <Option key={line.lineMstCode} value={line.lineMstCode}>
                  {line.lineMstDesc}
                </Option>
              ))}
            </Select>
            {errors.line && <div className="error-text">{errors.line}</div>}
          </Col>

          {/* Product Dropdown */}
          <Col xs={24} md={8}>
            <Text strong>
              Product<span className="required">*</span>
            </Text>
            <Select
              placeholder="Select Product"
              value={selectedProduct}
              onChange={(value) => {
                setSelectedProduct(value);
                const product = products.find((p) => p.productCode === value);
                setSelectedProductDesc(product ? product.prodDesc : "");
              }}
              style={{ width: "100%", marginTop: 4 }}
              disabled={!selectedLine}
            >
              {products.map((product) => (
                <Option key={product.productCode} value={product.productCode}>
                  {product.prodDesc}
                </Option>
              ))}
            </Select>
            {errors.product && (
              <div className="error-text">{errors.product}</div>
            )}
          </Col>

          {/* Work Order Dropdown */}
          <Col xs={24} md={8}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text strong>
                Work Order<span className="required">*</span>
              </Text>
              <Select
                placeholder="Select Work Order"
                value={selectedWorkOrder}
                onChange={setSelectedWorkOrder}
                style={{ width: "100%", marginTop: 4 }}
                disabled={!selectedProduct}
              >
                {workOrders.map((wo) => (
                  <Option key={wo.plsCode} value={wo.plsCode}>
                    {wo.plsCode}
                  </Option>
                ))}
              </Select>
              {errors.workOrder && (
                <div className="error-text">{errors.workOrder}</div>
              )}
            </div>
          </Col>
        </Row>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ marginRight: 16 }}
          >
            Submit
          </Button>
          <Button type="primary" onClick={handleCancel}>
            Cancel
          </Button>
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
          <Form form={form} autoComplete="off">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                margin: "10px 0",
              }}
            >
              <label htmlFor="scanInput" style={{ minWidth: "30px" }}>
                Scan:
              </label>

              <Form.Item name="scan" style={{ margin: 0 }}>
                <Input
                  id="scanInput"
                  placeholder="Scan or paste barcode here"
                  ref={inputRef}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{
                    marginBottom: "10px",
                    width: "500px",
                  }}
                />
              </Form.Item>
            </div>
          </Form>

          <div className="table-wrapper">
            {/* Table Header */}
            <Row
              className="table-header"
              style={{
                fontWeight: "bold",
                background: "#f2f2f2",
                textAlign: "center",
                padding: "8px 0",
                position: "relative",
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
                //console.log("lineQt",part.lineQty)

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
                      <div
                        style={{ display: "flex", gap: "40px", marginLeft: 20 }}
                      >
                        {op.lineTraceabilityList.map((part, pIndex) => {
                          let percent = 0;
                          if (part.storeQty > 0 && part.lineQty > 0) {
                            percent = Math.min(
                              (part.lineQty / part.storeQty) * 100,
                              100
                            );
                          }
                          const boxColor =
                            percent === 100 ? "#52c41a" : "#d9d9d9"; // green if 100%

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
                                  strokeWidth={6}
                                  showInfo={true}
                                  format={(p) => `${Math.round(p)}%`}
                                  style={{ width: "120px" }}
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
            {(() => {
              if (!traceabilityData || traceabilityData.length === 0)
                return null;

              // Flatten all child part rows into one list
              const allParts = traceabilityData.flatMap((op) =>
                op.lineTraceabilityList.map((item) => ({
                  lineQty: Number(item.lineQty || 0),
                  storeQty: Number(item.storeQty || 0),
                }))
              );

              const hasZero = allParts.some((p) => p.lineQty === 0);
              const someFilledNotFull = allParts.some(
                (p) => p.lineQty > 0 && p.lineQty < p.storeQty
              );
              const allCompleted = allParts.every(
                (p) => p.storeQty > 0 && p.lineQty === p.storeQty
              );

              // ✅ Rule Implementation
              // Partial enabled ONLY if someFilledNotFull AND NO ZERO VALUES
              const showNextProcess = !(someFilledNotFull && !hasZero);

              return (
                <div style={{ textAlign: "center", marginTop: 30 }}>
                  {/* {(!showNextProcess || allCompleted) && ( */}
                  {isProcess === "0" && (!showNextProcess || allCompleted) && (
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
                      // onClick={() => navigate("/nextProcess",{
                      //   state:{
                      //     lineCode:selectedLine,
                      //     modelId:selectedProduct,
                      //     lineDesc:selectedLineDesc,
                      //     productDesc:selectedProductDesc,
                      //   }
                      // })}

                      onClick={async () => {
                        try {
                          // 1️ Call update API before navigation
                          const response = await serverApi.post(
                            "updateLineTraceabilityIsProcess",
                            {
                              tenantId,
                              branchCode,
                              picklistCode: pickListCodeVerrify, // or whatever identifies this record
                              isProcess: "1", // example status update
                            }
                          );

                          if (response.data === "success") {
                            // 2️ Update table in UI (refresh data)
                            await fetchTraceabilityData(pickListCodeVerrify);

                            toast.success(
                              "Traceability status updated successfully!"
                            );

                            // 3️ Navigate to next process screen
                            navigate("/nextProcess", {
                              state: {
                                lineCode: selectedLine,
                                modelId: selectedProduct,
                                lineDesc: selectedLineDesc,
                                productDesc: selectedProductDesc,
                              },
                            });
                          } else {
                            toast.error(
                              response.data ||
                                "Failed to update traceability status."
                            );
                          }
                        } catch (error) {
                          toast.error("Error updating traceability status");
                        }
                      }}
                    >
                      Next Process
                    </Button>
                  )}
                </div>
              );
            })()}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TraceabilityLog;
