import React, { useState } from "react";
import { Layout, Menu } from "antd";
import { DashboardOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider } = Layout;

export default function SidebarMenu({ collapsed }) {
  const navigate = useNavigate();
  const [openKeys, setOpenKeys] = useState([]);

  const rootSubmenuKeys = ["dashboard", "Production", "Traceability"];

  const handleMenuClick = (e) => {
    if (e.key === "logout") {
      localStorage.removeItem("isAuthenticated");
      navigate("/");
    } else {
      navigate(`/${e.key}`);
    }
  };

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (rootSubmenuKeys.includes(latestOpenKey)) {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    } else {
      setOpenKeys(keys);
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      theme="dark"
      width={200}
      style={{
        marginTop: 64,
        height: "100vh",
        position: "fixed",
        left: 0,
        overflow: "hidden", // prevents double scrollbar
      }}
    >
      <div
        style={{
          height: "calc(100vh - 64px)", // subtract header height if needed
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          onClick={handleMenuClick}
          defaultSelectedKeys={["dashboard"]}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: "Dashboard",
              children: [
                { key: "foolproof", label: "Fool Proof Reports" },
                { key: "ngMasterValidation", label: "NG Master Validation" },
                { key: "ftt", label: "FTT (Overall Machines) Reports" },
                { key: "eolreport", label: "EOL FTT Reports" },
                { key: "opertionreport", label: "Operation Miss Reports" },
                { key: "ngpart", label: "NG Part Handling Reports" },
                { key: "bypass", label: "ByPass Reports" },
                { key: "datamissreport", label: "Data Miss Reports" },
                { key: "oversteyreport", label: "Overstay Reports" },
                { key: "overalldashboard", label: "Overall Dashboard" },
                {
                  key: "Line side overall dashboard(Traceability)",
                  label: "Line side overall dashboard(Traceability)",
                },
              ],
            },
            { key: "profile", icon: <UserOutlined />, label: "Profile" },
            // { key: "reports", icon: <FileTextOutlined />, label: "Reports" },
            { key: "master", icon: <UserOutlined />, label: "Master" },
            // {
            //   key: "Production",
            //   icon: <DashboardOutlined />,
            //   label: "Production",
            //   children: [
            //     { key: "productionPlanScreen", label: "Production Plan Screen" },
            //     { key: "lossreport", label: "Loss Reason booking Screen" },
            //     { key: "qualityloss", label: "Quality Loss booking Screen" },
            //     { key: "cboard", label: "C-Board Dashboard" },
            //     { key: "ProductionDashboard", label: "Production Dashboard" },
            //     { key: "productionReports", label: "Reports" },
            //   ],
            // },
            {
              key: "Traceability",
              icon: <DashboardOutlined />,
              label: "Traceability",
              children: [
                { key: "Picklist screen", label: "Picklist screen" },
                {
                  key: "picklist verification screen",
                  label: "picklist verification screen",
                },
                { key: "Store returnable", label: "Store returnable" },
                {
                  key: "line side child part verification screen",
                  label: "line side child part verification screen",
                },
                {
                  key: "Kittingprocessscreen",
                  label: "Kitting process screen",
                },
                {
                  key: "A2 and B2 type label print screen",
                  label: "A2 and B2 type label print screen",
                },
                { key: "lineDashboard", label: "Line Dashboard" },
                { key: "traceabilityReports", label: "Reports" },
                { key: "linefeeder", label: "Line Feeder" },
                { key: "storeReturnable", label: "Store Returnable" },
                { key: "Traceabilityreports1", label: "TraceabilityReports" },
                {
                  key: "reversetraceabilityReports",
                  label: "ReverseTreaceabilityReports",
                },
                {
                  key: "toolmonitoring  ",
                  label: "Tool Monitoring",
                  children: [
                    { key: "toolChange", label: "Tool Change" },
                    { key: "ToolHistoryLog", label: "Tool History Log" },
                    {
                      key: "CriticalSparePartsList",
                      label: "Critical Spare Parts List",
                    },
                    {
                      key: "PreventiveMaintenanceCheckList",
                      label: "PM Checklist Log",
                    },
                    {
                      key: "toolmonitoringmaster",
                      label: "Tool Monitoring Master",
                    },
                  ],
                },
              ],
            },
          ]}
        />
      </div>
    </Sider>
  );
}
