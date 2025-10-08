import React from "react";
import { Layout } from "antd";
import { MenuOutlined} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const { Header } = Layout;

export default function HeaderBar({ collapsed, toggleSidebar }) {
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <Header
      theme="dark"
      style={{
        // background: "#b6e9efff",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        height: 64,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        width: "100%"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          gap: "20px"
        }}>
          {/* Logo - always visible */}
          <div style={{ 
            width: 32, 
            height: 32, 
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <img 
              src={logo} 
              alt="Smartrun Logo" 
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Company name - hidden when collapsed */}
          {!collapsed && (
            <span style={{ 
              fontSize: 18, 
              fontWeight: "bold",
              transition: "opacity 0.3s ease-in-out",
              whiteSpace: "nowrap"
            }}>
              Smartrun
            </span>
          )}

          {/* Menu Icon with proper spacing */}
          <MenuOutlined
            onClick={toggleSidebar}
            style={{ 
              fontSize: 20, 
              cursor: "pointer",
              padding: "4px",
              marginLeft: collapsed ? "8px" : "16px",
              transition: "margin 0.2s ease-in-out"
            }}
          />
        </div>
        
       
      </div>
    </Header>
  );
}