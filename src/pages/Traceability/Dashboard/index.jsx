import React, { useEffect, useState, useCallback } from "react";
import { Card, Col, Row, Select, Form } from "antd";
import { ToolOutlined } from "@ant-design/icons";
import serverApi from "../../../serverAPI";
import commonServerApi from "../../../CommonserverApi";
import LineMstdropdown from "../../../CommonDropdownServices/Service/LineMasterSerive";
import moment from "moment/moment";
import store from "store";

const { Option } = Select;

const gradientColors = [
  "linear-gradient(90deg, #efd5ff 0%, #eab5e9ff 100%)",
  "linear-gradient(90deg, #efd5ff 0%, #c8ebd4ff 100%)",
  "linear-gradient(90deg, #efd5ff 0%, #ebefb4ff 100%)",
];

const LineDashboard = () => {
  const [dataCard, setDataCard] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [shiftData, setShiftData] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);

  const tenantId = store.get("tenantId");

  // Fetch line dropdown
 const getLineDropDownData = useCallback(async () => {
  try {
    const response = await LineMstdropdown();
    const returnData = response || [];

    const mappedData = returnData.map((item) => ({
      key: item.lineMstCode,
      value: item.lineMstDesc,
    }));

    setLineData(mappedData);

    // Set default selected line (index 0)
    if (mappedData.length > 0) {
      setSelectedLine(mappedData[0].key);
    }
  } catch (error) {
    console.error("Error fetching line dropdown:", error);
  }
}, []);

  // Fetch shift dropdown from backend API
 const fetchShiftData = useCallback(
  async (dateStr) => {
    try {
      const response = await commonServerApi.post("shiftlogShiftMst", {
        tenantId: tenantId,
        date: dateStr,
      });

      // Correct response handling
      const shiftList =
        response?.data?.responseData && Array.isArray(response.data.responseData)
          ? response.data.responseData
          : [];

      setShiftData(shiftList);

      if (shiftList.length > 0) {
        setSelectedShift(shiftList[0].hdrId);
      }
    } catch (error) {
      console.error("Error fetching shift data:", error);
    }
  },
  [tenantId]
);


  // Fetch shifts on mount with today's date
  useEffect(() => {
    const today = moment().format("YYYY-MM-DD");
    fetchShiftData(today);
  }, [fetchShiftData]);

  // Dashboard API
  const fetchLineDashboard = async (line) => {
    try {
      const payload = {
        tenantId: tenantId,
        lineCode: line || "",
        shiftHdrId: selectedShift,
      };

      const response = await serverApi.post("getTraceDashBoard", payload);

      if (
        response.data &&
        response.data.responseCode === "200" &&
        Array.isArray(response.data.responseData)
      ) {
        return response.data.responseData;
      }

      return [];
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      return [];
    }
  };

  // Load dashboard data on line change
  const onLoadDashboard = async () => {
    if (!selectedLine) return;

    const data = await fetchLineDashboard(selectedLine);
    setDataCard(data);
  };

  // Initial load for line dropdown
  useEffect(() => {
    getLineDropDownData();
  }, [getLineDropDownData]);

  // Reload dashboard when selected line changes
  useEffect(() => {
    if (selectedLine && selectedShift) {
      onLoadDashboard();
    }
  }, [selectedLine,selectedShift]);

  return (
    <>
      {/* Filters Row */}
      <Row
        gutter={16}
        justify="end"
        style={{ width: "auto", marginBottom: 16 }}
      >
        

        {/* Line Dropdown */}
        <Col span={4}>
          <Form.Item label="Line">
            <Select
              style={{ width: "100%" }}
              value={selectedLine}
              onChange={(v) => setSelectedLine(v)}
            >
              {lineData.map((item, idx) => (
                <Option key={idx} value={item.key}>
                  {item.value}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* Shift Dropdown Top Right */}
        <Col span={4}>
          <Form.Item label="Shift">
            <Select
              style={{ width: "100%" }}
              value={selectedShift}
              onChange={(val) => setSelectedShift(val)}
              placeholder="Select Shift"
            >
              {shiftData.map((shift) => (
                <Option key={shift.hdrId} value={shift.hdrId}>
                  {shift.shiftName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Cards */}
      <div style={{ padding: "0px" }}>
        <Row gutter={[16, 16]}>
          {dataCard.map((item, index) => (
            <Col key={index} xs={24} sm={12} md={8} lg={6}>
              <Card
                bordered={false}
                style={{
                  height: 250,
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: "16px", background: "#fff" }}
                title={
                  <div
                    style={{
                      background: gradientColors[index % gradientColors.length],
                      padding: "12px 16px",
                      borderTopLeftRadius: "12px",
                      borderTopRightRadius: "12px",
                      color: "#090000ff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>Operation-{item.op}</div>
                      <div style={{ fontSize: "12px" }}>{item.opDesc}</div>
                    </div>
                    <ToolOutlined style={{ fontSize: 20, opacity: 0.9 }} />
                  </div>
                }
              >
                {/* OK Qty */}
                <div
                  style={{
                    background: "#e6e6e6",
                    padding: "0px",
                    borderRadius: "6px",
                    textAlign: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{ fontSize: "32px", fontWeight: 700, color: "#333" }}
                  >
                    {item.qty}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    Prod Qty
                  </div>
                </div>

                {/* Child Parts */}
                <div style={{ maxHeight: 110, overflowY: "auto" }}>
                  {item.childPart?.map((child, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "4px 0",
                        fontSize: "13px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <strong>{child.childPartCode}</strong>:{" "}
                      {child.childPartDesc}
                      <span style={{ float: "right", color: "#110101ff" }}>
                        {child.childPartQty}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </>
  );
};

export default LineDashboard;
