import React, { useState } from "react";
import { Card, Switch } from "antd";
import PlanKitting from "./PlanKitting";
import ProductKitting from "./ProductKitting";

const KittingContainer = () => {
  const [mode, setMode] = useState("PLAN"); // PLAN | PRODUCT

  return (
    <Card
      title="Kitting Process"
      headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
      extra={
        <Switch
          checked={mode === "PRODUCT"}
          checkedChildren="Product"
          unCheckedChildren="Plan"
          onChange={(checked) => setMode(checked ? "PRODUCT" : "PLAN")}
          style={{
            transform: "scale(1.2)",
            backgroundColor: mode === "PRODUCT" ? "#52c41a" : "#ff4d4f",
          }}
        />
      }
    >
      {mode === "PLAN" ? <PlanKitting /> : <ProductKitting />}
    </Card>
  );
};

export default KittingContainer;
