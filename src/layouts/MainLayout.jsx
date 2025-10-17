import React, { useState } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom"; 



const { Content } = Layout;

export default function MainLayout() {
 

 

  return (
    <Layout style={{ minHeight: "100vh" }}>
     
     
       <Layout
        style={{ 
          marginTop:0,
          transition: "all 0.3s ease",
        }}
      >
        <Content className="p-4" style={{ background: "#f0f2f5" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}


