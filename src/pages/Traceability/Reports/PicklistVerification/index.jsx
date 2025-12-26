import React, { useRef, useEffect } from "react";
import { Table, Button, Card, Input, Form, Progress, Row, Col } from "antd";
import { FaQrcode } from "react-icons/fa";
import { PrinterOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import serverApi from "../../../../serverAPI";
import store from "store";
import dayjs from "dayjs";

const PicklistVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const inputRef = useRef(null);
  const scanTimerRef = useRef(null);

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");

  // State variables
  const [lineFeederDatas, setLineFeederDatas] = React.useState([]);
  const [plksCode, setPlksCode] = React.useState("");
  const [pickListCodeVerrify, setPickListCodeVerrify] = React.useState("");
  const [info, setInfo] = React.useState(null);

  const picklistInfo = location.state?.picklistInfo;

  // Get data from navigation state or sessionStorage
  useEffect(() => {
    if (location.state) {
      const { plksCode, lineFeederDatas, pickListCodeVerrify, picklistInfo } = location.state;
      setPlksCode(plksCode);
      setLineFeederDatas(lineFeederDatas);
      setPickListCodeVerrify(pickListCodeVerrify);
      setInfo(picklistInfo);

      // Save to sessionStorage for persistence (in case of print navigation)
      sessionStorage.setItem('picklistVerificationState', JSON.stringify({
        plksCode,
       // lineFeederDatas,
        pickListCodeVerrify
      }));
    } else {
      // Try to restore from sessionStorage (coming back from print page)
      const savedState = sessionStorage.getItem('picklistVerificationState');
      if (savedState) {
        const data = JSON.parse(savedState);
        setPlksCode(data.plksCode);
       // setLineFeederDatas(data.lineFeederDatas);
        setPickListCodeVerrify(data.pickListCodeVerrify);
        setInfo(data.picklistInfo);
       
      } else {
        // No data available, redirect back to picklist
        toast.error("No picklist data found");
        navigate("/picklist");
      }
    }
  }, [location, navigate]);

  const prevKeyRef = useRef(location.key);

  useEffect(() => {
    const savedState = sessionStorage.getItem('picklistVerificationState');
    const data = JSON.parse(savedState);
    console.log("prevKeyRef",prevKeyRef)
      console.log("current",location.key)
    if (location.key) {
      fetchLatestPicklistData(data.pickListCodeVerrify);
    }
    prevKeyRef.current = location.key;
  }, []);


  const fetchLatestPicklistData = async (pickListCodeVerrify) => {
    try {
      const response = await serverApi.post("getRetrievePickdetails", {
        tenantId: tenantId,
        branchCode: branchCode,
        plscode: pickListCodeVerrify,
      });
  
      const res = response.data;
      if (res.responseCode === "200" && res.responseData) {
        // Update with fresh data from backend
        setLineFeederDatas(structuredClone(res.responseData));
       
      }
    } catch (error) {
      console.error("Error fetching latest picklist data:", error);
    }
  };



  // Handle scanning with barcode parsing
  const handleScan = async (scanned) => {
    const scannedValue = scanned;
    console.log("Scanned Length:", scannedValue.length);

    if (scannedValue.length > 104) {
      toast.error("Invalid barcode length");
      return;
    }

    // Extract fields based on fixed positions
    const invoiceNumber = scannedValue.substring(0, 17);
    const childPartCode = scannedValue.substring(17, 35);
    const vendorCode = scannedValue.substring(35, 42);
    const pickedQtyStr = scannedValue.substring(42, 50);
    const labelNumber = scannedValue?.substring(50, 68)?.trim() || "";
    const batchNumber = scannedValue?.substring(68, 80)?.trim() || "";
    const deliveryDate = scannedValue.substring(80, 88);
    const productionDate = scannedValue.substring(88, 96);
    const expirationDate = scannedValue.substring(96, 104);

    const pickedQty = Number(pickedQtyStr.trim());
    if (isNaN(pickedQty)) {
      toast.error("Invalid quantity in barcode");
      return;
    }

    console.log("Parsed Barcode Data:");
    console.log("Invoice Number:", invoiceNumber);
    console.log("Child Part Code:", childPartCode);
    console.log("Vendor Code:", vendorCode);
    console.log("Picked Qty:", pickedQty);
    console.log("Label Number:", labelNumber);
    console.log("Batch Number:", batchNumber);
    console.log("Delivery Date:", deliveryDate);
    console.log("Production Date:", productionDate);
    console.log("Expiration Date:", expirationDate);

    const matchedChildPart = lineFeederDatas.find(cp =>
      childPartCode.includes(cp.childPartCode)
    );

    if (!matchedChildPart) {
      toast.error("Incorrect child part scanned");
      return;
    }

    console.log("Matched Child Part:", matchedChildPart.childPartCode);

    try {
      const response = await serverApi.post("updatePickedQtywithChildPartCode", {
        tenantId: tenantId,
        branchCode: branchCode,
        childPartCode: matchedChildPart.childPartCode,
        pickedQty: pickedQty,
        plsId: pickListCodeVerrify,
        packageNumber:labelNumber,
        batchCode:batchNumber,
        vendorCode:vendorCode,
      });

      if (response.data === "success") {
        
        fetchLatestPicklistData(pickListCodeVerrify);

        toast.success("Scan processed successfully!");
      } else {
        toast.error(response.data);
      }
    } catch (err) {
      toast.error("Error while processing scan");
      console.error(err);
    }
  };

  const processScan = async () => {
    const value = form.getFieldValue("scan")?.trim();
    if (!value) return;

    await handleScan(value);
    form.resetFields(["scan"]);
    inputRef.current?.focus();
  };

  const handleKeyDown = () => {
    clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      processScan();
    }, 300);
  };

  const submitCompleted = async (isCompleted) => {
    const finalSubmit = lineFeederDatas;

    if (!finalSubmit || finalSubmit.length === 0) {
      toast.error("No data to submit!");
      return;
    }

    try {
      const finalSubmitDatas = finalSubmit.map((item) => ({
        childPartCode: item.childPartCode,
        picklistQty: item.picklistQty,
        pickedQty: item.pickedQty,
        plsId: item.plsId,
        plsdId: item.plsdId,
        isCompleted: isCompleted,
        tenantId: tenantId,
        branchCode: branchCode,
      }));

      const response = await serverApi.post(
        "updateIssuedByChildPartCodeWithPlsId",
        finalSubmitDatas
      );

      if (response.data === "submitcompleted") {
        toast.success("Submit completed successfully!");
        sessionStorage.removeItem('picklistVerificationState');
        navigate("/picklist");
      } else if (response.data === "partiallycompleted") {
        toast.success("Partially completed successfully!");
        sessionStorage.removeItem('picklistVerificationState');
        navigate("/picklist");
      } else {
        toast.error(response.data);
      }
    } catch (err) {
      toast.error("Error while processing submission");
      console.error(err);
    }
  };

  // Handle back button
  const handleBack = () => {
    sessionStorage.removeItem('picklistVerificationState');
    navigate("/picklist");
  };

  const lineFeederColumns = [
    {
      title: "S.No",
      key: "sno",
      render: (text, record, index) => index + 1,
      width: 80
    },
    {
      title: "Child Part Code",
      dataIndex: "childPartCode",
      key: "childPartCode",
      width: 150
    },
    {
      title: "Child Part Description",
      dataIndex: "childPartDesc",
      key: "childPartDesc",
      width: 200
    },
    {
      title: "Item Type",
      dataIndex: "itemType",
      key: "itemType",
      width: 100,
      align: "center"
    },
    {
      title: "Picklist Qty(Nos)",
      dataIndex: "picklistQty",
      key: "picklistQty",
      align: "right",
      width: 150
    },
    {
      title: "Picked Qty(Nos)",
      dataIndex: "pickedQty",
      key: "pickedQty",
      align: "right",
      width: 150
    },
    {
      title: "Status",
      dataIndex: "pickedQty",
      key: "status",
      width: 150,
      render: (value, record) => {
        const picked = Number(value);
        const total = Number(record.picklistQty);

        if (!picked || picked === 0) {
          return <FaQrcode size={18} color="#002147" />;
        }

        const percent = Math.round((picked / total) * 100);

        return (
          <Progress
            percent={percent}
            percentPosition={{ align: "start", type: "inner" }}
            size={[100, 20]}
            strokeColor="#B7EB8F"
          />
        );
      },
    },
    {
      title: "Action",
      dataIndex: "itemType",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) =>
        record.itemType === "A2" || record.itemType === "B2" ? (
          <Button
            type="link"
            icon={<PrinterOutlined />}
            onClick={() => {
              // Save current state before navigating to print
              sessionStorage.setItem('picklistVerificationState', JSON.stringify({
                plksCode,
               // lineFeederDatas,
                pickListCodeVerrify
              }));

              navigate("/picklistprint", {
                state: {
                  pickListCode: plksCode,
                  childPartCode: record.childPartCode,
                  planQty: record.picklistQty,
                  itemType: record.itemType,
                },
              });
            }}
          >
            Split Label
          </Button>
        ) : null,
    },
  ];

  const pickedNumbers = lineFeederDatas.map(item => Number(item.pickedQty || 0));
  const picklistNumbers = lineFeederDatas.map(item => Number(item.picklistQty || 0));

  const hasZero = pickedNumbers.some(qty => qty === 0);
  const allFull = pickedNumbers.every((qty, i) => qty >= picklistNumbers[i]);
  const someFilledNotFull = pickedNumbers.some((qty, i) =>
    qty > 0 && qty < picklistNumbers[i]
  );

  const disablePartial = !(someFilledNotFull && !hasZero);

  return (
    <div style={{ padding: "20px" }}>
<Card
  size="small"
  style={{
    marginBottom: 16,
    background: "#f5f7fa",
    borderRadius: 8,
  }}
>
  <Row gutter={16}>
    <Col span={6}>
      <strong>Date</strong>
      <div>
        {info?.date
          ? dayjs(info.date).format("DD-MMM-YYYY")
          : "-"}
      </div>
    </Col>

    <Col span={6}>
      <strong>Line</strong>
      <div>{info?.line || "-"}</div>
    </Col>

    <Col span={6}>
      <strong>Product</strong>
      <div>{info?.product || "-"}</div>
    </Col>

    <Col span={6}>
      <strong>Status</strong>
      <div style={{ fontWeight: 600 }}>{info?.status || "-"}</div>
    </Col>
  </Row>
</Card>



      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{`Picklist Verification - ${plksCode}`}</span>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{
                backgroundColor: "transparent",
                border: "1px solid white",
                color: "white"
              }}
            >
              Back to Picklist
            </Button>
          </div>
        }
      >
        {/* Scan Input Section */}
        <div style={{ marginBottom: "20px" }}>
          <Form form={form} autoComplete="off">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label htmlFor="scanInput" style={{ fontWeight: "500", minWidth: "50px" }}>
                Scan:
              </label>
              <Form.Item name="scan" style={{ margin: 0, flex: 1 }}>
                <Input
                  id="scanInput"
                  placeholder="Scan or paste barcode here"
                  ref={inputRef}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{ width: "100%", maxWidth: "600px" }}
                />
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* Line Feeder Table */}
        <Table
          columns={lineFeederColumns}
          dataSource={lineFeederDatas}
          bordered
          pagination={{ pageSize: 10 }}
          rowKey={(record) => record.childPartCode}
          scroll={{ x: 1200 }}
        />

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "10px" }}>
          {!disablePartial && (
            <Button
              type="primary"
              onClick={() => submitCompleted("2")}
              style={{
                backgroundColor: "#1890ff",
                minWidth: "200px",
                height: "40px"
              }}
            >
              Allow to Partially Transfer
            </Button>
          )}

          {allFull && (
            <Button
              type="primary"
              onClick={() => submitCompleted("3")}
              disabled={!allFull}
              style={{
                backgroundColor: "#52c41a",
                minWidth: "150px",
                height: "40px"
              }}
            >
              Completed
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PicklistVerification;