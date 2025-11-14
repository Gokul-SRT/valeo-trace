import React, { useState, useEffect } from "react";
import LiquidFillGauge from "react-liquid-gauge";
import TimelineChart from "./D3timelineChart";
import serverApi from "../../../../serverAPI";
import store from "store";
import GatewayDropdown from "../../Dashboard/GatewayDashboard/GatewayDropdown";

const tenantId = store.get("tenantId") || "";
const branchCode = store.get("branchCode") || "";

const GatewayDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [gatewayOptions, setGatewayOptions] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);

  // ✅ Fetch Gateway List from API
  const fetchGatewayList = async () => {
    const data = await GatewayDropdown(tenantId, branchCode);
    if (data && data.length > 0) {
      setGatewayOptions(data);
      setSelectedGateway(data[0]); // default select first gateway
    } else {
      console.warn("No gateway list found");
      setGatewayOptions([]);
    }
  };

  // ✅ Fetch gateway metrics (CPU / Memory / Disk)
  const fetchGatewayData = async (gatewayId) => {
    try {
      const requestData = { tenantId, branchCode, gatewayId };

      const response = await serverApi.post("getGateWayDashboard", requestData);

      if (
        response.data?.responseCode === "200" &&
        response.data?.responseData?.length > 0
      ) {
        const data = response.data.responseData[0];
        setMetrics({
          cpu: parseFloat(data.cpuPercent || 0),
          memory: parseFloat(data.memPercent || 0),
          disk: parseFloat(data.diskPercent || 0),
          memoryTotal: parseFloat(data.memTotal || 0),
          memoryUsed: parseFloat(data.memUsed || 0),
          diskTotal: parseFloat(data.diskTotal || 0),
          diskUsed: parseFloat(data.diskUsed || 0),
          bytesSent: parseFloat(data.bytesSent || 0),
          bytesReceived: parseFloat(data.bytesRecv || 0),
        });
      } else {
        console.warn("No data found for gateway metrics");
        setMetrics(null);
      }
    } catch (error) {
      console.error("Error fetching gateway metrics:", error);
      setMetrics(null);
    }
  };

  // ✅ Fetch timeline chart data (Online/Offline)
  const fetchGatewayTimeline = async (gatewayId) => {
    try {
      const requestData = { tenantId, branchCode, gatewayId };

      const response = await serverApi.post(
        "getGatewayDashboardTimelineChart",
        requestData
      );

      if (
        response.data?.responseCode === "200" &&
        Array.isArray(response.data.responseData)
      ) {
        const apiData = response.data.responseData;

        const transformedData = apiData.map((item) => {
          const start =
            item.startTime === "NOW" ? new Date() : new Date(item.startTime);
          const end =
            item.endTime === "NOW" ? new Date() : new Date(item.endTime);
          const isOnline = item.status === "ONLINE";

          return {
            start,
            end,
            color: isOnline ? "#4CAF50" : "#F44336",
            label: isOnline ? "Online" : "Offline",
          };
        });

        setTimelineData(transformedData);
      } else {
        console.warn("No timeline data found");
        setTimelineData([]);
      }
    } catch (error) {
      console.error("Error fetching timeline data:", error);
      setTimelineData([]);
    }
  };

  // ✅ Initial Load: Fetch Gateway List
  useEffect(() => {
    fetchGatewayList();
  }, []);

  // ✅ Fetch data when gateway changes
  useEffect(() => {
    if (selectedGateway?.gatewayId) {
      fetchGatewayData(selectedGateway.gatewayId);
      fetchGatewayTimeline(selectedGateway.gatewayId);
    }
  }, [selectedGateway]);

  // ✅ Auto-refresh timeline every 60s
  useEffect(() => {
    if (!selectedGateway?.gatewayId) return;
    const interval = setInterval(() => {
      fetchGatewayData(selectedGateway.gatewayId);
      fetchGatewayTimeline(selectedGateway.gatewayId);
    }, 6000);
    return () => clearInterval(interval);
  }, [selectedGateway]);

  const handleGatewaySelect = (gateway) => {
    setSelectedGateway(gateway);
    setIsDropdownOpen(false);
  };

  // ✅ Calculate uptime %
  const uptimePercentage =
    timelineData.length > 0
      ? (
          (timelineData.filter((p) => p.label === "Online").length /
            timelineData.length) *
          100
        ).toFixed(1)
      : 0;

  if (!metrics) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px", color: "#555" }}>
        <h2>Loading Gateway Data...</h2>
      </div>
    );
  }

  const gaugeConfigs = [
    { name: "CPU (%)", value: metrics.cpu, color: "#4CAF50" },
    { name: "Memory (%)", value: metrics.memory, color: "#2196F3" },
    { name: "Disk (%)", value: metrics.disk, color: "#FF9800" },
  ];

  const memoryUsedPercentage = (metrics.memoryUsed / metrics.memoryTotal) * 100;
  const diskUsedPercentage = (metrics.diskUsed / metrics.diskTotal) * 100;

  return (
    <div
      className="dashboard-container"
      style={{
        padding: "20px",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "0 10px",
        }}
      >
        <h1
          style={{
            color: "#333",
            fontSize: "28px",
            fontWeight: "600",
            margin: 0,
          }}
        >
          Gateway Dashboard
        </h1>

        {/* Gateway Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              padding: "10px 16px",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: "180px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            <span>
              {selectedGateway
                ? selectedGateway.gatewayName || selectedGateway.gatewayId
                : "Select Gateway"}
            </span>
            <span
              style={{
                transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              ▼
            </span>
          </button>

          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 1000,
                minWidth: "220px",
                marginTop: "5px",
              }}
            >
              {gatewayOptions.map((gateway, index) => (
                <div
                  key={index}
                  onClick={() => handleGatewaySelect(gateway)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom:
                      index < gatewayOptions.length - 1
                        ? "1px solid #f0f0f0"
                        : "none",
                    backgroundColor:
                      selectedGateway?.gatewayId === gateway.gatewayId
                        ? "#f5f5f5"
                        : "transparent",
                    color:
                      selectedGateway?.gatewayId === gateway.gatewayId
                        ? "#2196F3"
                        : "#333",
                    fontWeight:
                      selectedGateway?.gatewayId === gateway.gatewayId
                        ? "600"
                        : "400",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  {gateway.gatewayName || gateway.gatewayId}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for dropdown click-outside */}
      {isDropdownOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Gauges */}
      <div
        style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {gaugeConfigs.map((kpi, index) => (
            <div key={index} style={{ textAlign: "center", padding: "15px" }}>
              <h4 style={{ marginBottom: "15px", color: "#333" }}>
                {kpi.name}
              </h4>
              <LiquidFillGauge
                style={{ margin: "0 auto" }}
                value={kpi.value}
                text={`${Math.round(kpi.value)}%`}
                textSize={1}
                height={130}
                width={130}
                waveFrequency={2}
                waveAmplitude={2}
                gradient
                circleStyle={{
                  fill: "#fff",
                  stroke: kpi.color,
                  strokeWidth: 1,
                }}
                waveStyle={{ fill: kpi.color }}
                textStyle={{
                  fill: kpi.color,
                  fontSize: "1.3em",
                  fontWeight: "bold",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      <div
        style={{
          backgroundColor: "white",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ margin: 0, color: "#333" }}>
            {selectedGateway?.gatewayName || selectedGateway?.gatewayId} Status
            - Last 24 Hours
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#4CAF50",
                  borderRadius: "2px",
                }}
              ></div>
              <span>
                Online (
                {timelineData.filter((d) => d.label === "Online").length}h)
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#F44336",
                  borderRadius: "2px",
                }}
              ></div>
              <span>
                Offline (
                {timelineData.filter((d) => d.label === "Offline").length}h)
              </span>
            </div>
            <div
              style={{
                padding: "5px 10px",
                backgroundColor: "#E8F5E9",
                borderRadius: "15px",
                color: "#2E7D32",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              Uptime: {uptimePercentage}%
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", padding: "10px 0" }}>
          <TimelineChart
            data={timelineData}
            width={Math.min(1200, window.innerWidth - 100)}
            height={80}
          />
        </div>
      </div>

      {/* Memory / Disk / Network Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "15px",
        }}
      >
        {/* Memory */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            borderTop: "3px solid #2196F3",
          }}
        >
          <h4 style={{ color: "#333", margin: "0 0 10px 0", fontSize: "16px" }}>
            Memory Usage
          </h4>
          <div
            style={{
              width: "100%",
              backgroundColor: "#e0e0e0",
              borderRadius: "5px",
              overflow: "hidden",
              height: "10px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: `${memoryUsedPercentage}%`,
                backgroundColor: "#2196F3",
                height: "100%",
              }}
            ></div>
          </div>
          <div style={{ fontSize: "12px", color: "#666", textAlign: "right" }}>
            {metrics.memoryUsed} GB / {metrics.memoryTotal} GB
          </div>
        </div>

        {/* Disk */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            borderTop: "3px solid #FF9800",
          }}
        >
          <h4 style={{ color: "#333", margin: "0 0 10px 0", fontSize: "16px" }}>
            Disk Usage
          </h4>
          <div
            style={{
              width: "100%",
              backgroundColor: "#e0e0e0",
              borderRadius: "5px",
              overflow: "hidden",
              height: "10px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: `${diskUsedPercentage}%`,
                backgroundColor: "#FF9800",
                height: "100%",
              }}
            ></div>
          </div>
          <div style={{ fontSize: "12px", color: "#666", textAlign: "right" }}>
            {metrics.diskUsed} GB / {metrics.diskTotal} GB
          </div>
        </div>

        {/* Bytes Sent */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            borderTop: "3px solid #4CAF50",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#E8F5E9",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "10px",
              }}
            >
              <span style={{ color: "#4CAF50", fontSize: "18px" }}>↑</span>
            </div>
            <h4 style={{ margin: 0, color: "#333", fontSize: "16px" }}>
              Bytes Sent
            </h4>
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#4CAF50" }}
          >
            {metrics.bytesSent} Bytes
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Total transmitted
          </div>
        </div>

        {/* Bytes Received */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            borderTop: "3px solid #2196F3",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#E3F2FD",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "10px",
              }}
            >
              <span style={{ color: "#2196F3", fontSize: "18px" }}>↓</span>
            </div>
            <h4 style={{ margin: 0, color: "#333", fontSize: "16px" }}>
              Bytes Received
            </h4>
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "bold", color: "#2196F3" }}
          >
            {metrics.bytesReceived} Bytes
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Total received</div>
        </div>
      </div>
    </div>
  );
};

export default GatewayDashboard;
