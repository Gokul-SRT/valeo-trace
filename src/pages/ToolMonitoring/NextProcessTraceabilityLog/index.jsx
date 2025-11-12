import React, { useRef, useState, useEffect } from "react";
import { Table, Card, Button, Input, Form, Modal } from "antd";
import "antd/dist/reset.css";
import { toast } from "react-toastify";
import serverApi from "../../../serverAPI";
import store from "store";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const NextProcessTraceabilityLog = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const todays = dayjs(); // Default to current date

  const [toolMonitorDetails, setToolMonitorDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scannedIds, setScannedIds] = useState([]);

  const [lineCode, setLineCode] = useState(location.state?.lineCode || "");
  const [modelId, setModelId] = useState(location.state?.modelId || "");
  const [lineDesc, setLineDesc] = useState(location.state?.lineDesc || "");
  const [productDesc, setProductDesc] = useState(
    location.state?.productDesc || ""
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");

  useEffect(() => {
    fetchToolMonitorDetails();
  }, []);

  const fetchToolMonitorDetails = async () => {
    try {
      setLoading(true); //  Start loader
      const response = await serverApi.post("gettoolmasterWithLogdtl", {
        tenantId,
        branchCode,
        status: "1",
        lineCode: lineCode,
        modelId: modelId,
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setToolMonitorDetails(res.responseData);
      } else {
        setToolMonitorDetails([]);
        toast.error(
          response.data.responseMessage || "Failed to fetch ToolMoniter"
        );
      }
    } catch (error) {
      toast.error("Error fetching ToolMoniter. Please try again later.");
    } finally {
      setLoading(false); //  Stop loader
    }
  };

  //scanning process
  const handleScan = async (scanned) => {
    const scannedValue = scanned.trim();

    console.log("scannedValue", scannedValue);
    if (!scannedValue) return;

    // Regex: ignore anything before the 18-digit prefix
    const match = scannedValue.match(/\d{18}([A-Z0-9]+)\s+(\d+)/i);

    if (!match) {
      toast.error("Invalid barcode format");

      return;
    }

    const toolNo = match[1]; // e.g., 157042 or CF72760
    console.log(toolNo, "toolNo");

    const row = toolMonitorDetails.find((item) => item.toolNo === toolNo);
    if (row) {
      // setScannedIds(previoues=> new Set([...previoues,row.toolNo]))
      setScannedIds((prev) => {
        const updated = new Set(prev);
        updated.add(row.toolNo);
        return Array.from(updated);
      });
    }
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

  const toolMonitorColumns = [
    { title: "S.No", key: "sno", render: (text, record, index) => index + 1 },
    {
      title: "Tool Description",
      dataIndex: "toolDesc",
      key: "toolDesc",
    },
    {
      title: "Max Usage",
      dataIndex: "maxShots",
      key: "maxShots",
      align: "right",
      render: (value) =>
        value !== null && value !== undefined && value !== "" ? value : 0,
    },
    {
      title: "Remaining Usage",
      dataIndex: "remainingUsage",
      key: "remainingUsage",
      align: "right",
      render: (value) =>
        value !== null && value !== undefined && value !== "" ? value : 0,
    },
    {
      title: "Usage Till Date",
      dataIndex: "tillDate",
      key: "tillDate",
      align: "right",
      render: (value) =>
        value !== null && value !== undefined && value !== "" ? value : 0,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        scannedIds.includes(record.toolNo) ? (
          <span style={{ color: "green", fontSize: "18px" }}>✔</span>
        ) : (
          ""
        ),
    },
  ];

  const getRemainingUsage = (item) => {
    const value = item.remainingUsage;
    return !value || value === "0" || value === 0 ? item.maxShots : value;
  };

  const submitData = async (scannedDatas) => {
    const finalSubmitDatas = scannedDatas.map((item) => ({
      toolNo: item.toolNo,
      maxUsage: item.maxShots,
      remainingUsage: getRemainingUsage(item),
      tillDate: item.tillDate,
      tenantId: tenantId,
      branchCode: branchCode,
      modelId: modelId,
    }));

    try {
      const response = await serverApi.post(
        "toolmasterLogdtlInsertOrUpdate",
        finalSubmitDatas
      );

      if (response.data.responseCode === "200") {
        toast.success("Tools submitted successfully!");
        // Optionally reset scanned IDs or navigate back
        setScannedIds([]);

        setTimeout(() => navigate("/lineDashboard"), 2000);
      } else {
        toast.error(response.data.responseMessage || "Failed to submit tools");
      }
    } catch (error) {
      toast.error("Error submitting tools. Please try again.");
    }
  };

  const handleSubmit = async () => {
    if (scannedIds.length !== toolMonitorDetails.length) {
      // Instead of showing toast, show modal confirmation
      const scannedData = toolMonitorDetails.filter((row) =>
        scannedIds.includes(row.toolNo)
      );

      setPendingSubmitData(scannedData);
      setIsModalVisible(true);
      return;
    }

    // If all tools are scanned, submit directly
    await submitData(toolMonitorDetails);
  };

  // Back button handler: resets all states
  const handleBack = () => {
    setLineCode("");
    setModelId("");
    setLineDesc("");
    setProductDesc("");
    setToolMonitorDetails([]);
    setLoading(false);
    setScannedIds([]);
    setIsModalVisible(false);
    form.resetFields();

    navigate("/traceabilitylog");
  };

  return (
    <div>
      <Modal
  open={isModalVisible}
  centered
  width={400} //  makes the modal smaller
  footer={null} // remove default footer buttons
  closable={false} // optional: hide the default "X" button
  bodyStyle={{
    textAlign: "center",
    fontSize: "15px",
    padding: "24px 16px",
  }}
>
  {/* Custom Title */}
  <div
    style={{
      textAlign: "center",
      fontWeight: "700",
      fontSize: "18px",
      color: "#00264d",
      marginBottom: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}
  >
    Confirm Submission
  </div>

  {/* Modal Body */}
  <p style={{ marginBottom: "8px", color: "#333",fontWeight: 700 }}>
    You have scanned <b>{scannedIds.length}</b> out of{" "}
    <b>{toolMonitorDetails.length}</b> tools.
  </p>
  <p style={{ marginBottom: "0", color: "#444" }}>
    Do you want to proceed with submission?
  </p>

  {/* Custom Footer Buttons */}
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: "16px",
      marginTop: "22px",
    }}
  >
    <Button
      type="primary"
      onClick={async () => {
        if (pendingSubmitData) {
          await submitData(pendingSubmitData);
        }
        setIsModalVisible(false);
      }}
    >
      Yes
    </Button>
    <Button
      danger
      onClick={() => {
        toast.info("Submission cancelled.");
        setIsModalVisible(false);
      }}
    >
      No
    </Button>
    
  </div>
</Modal>


      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={`Tool Monitoring Details : Line: ${lineDesc}, Product: ${productDesc}`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // gap: "10px",
            margin: "10px 0",
          }}
        >
          <Form form={form} autoComplete="off">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "10px 0",
                width: "100%",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <label htmlFor="scanInput" style={{ fontWeight: "500" }}>
                  Scan Tool:
                </label>
                <span style={{ color: "red" }}>*</span>
              </div>

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
        </div>
        <Table
          columns={toolMonitorColumns}
          dataSource={toolMonitorDetails}
          bordered
          pagination={{ pageSize: 10 }}
          loading={loading} //  Show loader
        />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <Button type="primary" onClick={handleSubmit}>
            Submit
          </Button>
          <Button type="primary" onClick={handleBack}>
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
};
export default NextProcessTraceabilityLog;
