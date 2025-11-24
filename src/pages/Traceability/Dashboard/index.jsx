import React, { useEffect, useState, useCallback } from "react";
import { Card, Col, Row, Select, DatePicker, Form } from "antd";
import { ToolOutlined } from "@ant-design/icons";
import serverApi from "../../../serverAPI";
import ProductDropdown from "../../../CommonDropdownServices/Service/ProductDropdownService";
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
  const [productDataList, setProductDataList] = useState([]);
  const [lineData, setLineData] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const tenantId = store.get('tenantId');
  const branchCode = store.get('branchCode');


  // Set default product
  useEffect(() => {
    if (productDataList.length > 0 && !selectedProduct) {
      setSelectedProduct(productDataList[0].productCode);
    }
  }, [productDataList, selectedProduct]);

  // Set default line
  useEffect(() => {
    if (lineData.length > 0 && !selectedLine) {
      setSelectedLine(lineData[0].key);
    }
  }, [lineData, selectedLine]);

  // Default date = today
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(moment());
    }
  }, [selectedDate]);

  // Fetch product dropdown
  const getProductDropdown = useCallback(async () => {
    try {
      const response = await ProductDropdown();
      const returnData = response || [];
      setProductDataList(
        returnData.map((item) => ({
          productCode: item.productCode,
          productDesc: item.productDesc,
        }))
      );

      if (returnData.length > 0) {
        setSelectedProduct(returnData[0].productCode);
      }
    } catch (error) {
      console.error("Error fetching product dropdown:", error);
    }
  }, []);

  // Fetch line dropdown
  const getLineDropDownData = useCallback(async () => {
    try {
      const response = await LineMstdropdown();
      const returnData = response || [];
      setLineData(
        returnData.map((item) => ({
          key: item.lineMstCode,
          value: item.lineMstDesc,
        }))
      );

      if (returnData.length > 0) {
        setSelectedLine(returnData[0].key);
      }
    } catch (error) {
      console.error("Error fetching line dropdown:", error);
    }
  }, []);

  // Dashboard API
  const fetchLineDashboard = async (prod, line, date) => {
    try {
      const payload = {
        tenantId: tenantId,
        productCode: prod || "",
        lineCode: line || "",
        branchCode:branchCode,
        date: date ? date.format("YYYY-MM-DD") : "",
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

  // Load dashboard
  const onLoadDashboard = async () => {
    if (!selectedProduct || !selectedLine || !selectedDate) return;

    const data = await fetchLineDashboard(
      selectedProduct,
      selectedLine,
      selectedDate
    );
    setDataCard(data);
  };

  // Initial data load
  useEffect(() => {
    getProductDropdown();
    getLineDropDownData();
  }, []);

  // Reload dashboard when filters change
  useEffect(() => {
    if (selectedProduct && selectedLine && selectedDate) {
      onLoadDashboard();
    }
  }, [selectedProduct, selectedLine, selectedDate]);

  return (
    <>
      {/* Filters */}
      <div>
        <Row gutter={16} style={{ width: "auto" }}>
          {/* Product */}
          <Col span={6}>
            <Form.Item label="Product">
              <Select
                style={{ width: "100%" }}
                value={selectedProduct}
                onChange={(v) => setSelectedProduct(v)}
              >
                {productDataList.map((item, idx) => (
                  <Option key={idx} value={item.productCode}>
                    {item.productDesc}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Line */}
          <Col span={6}>
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

          {/* Date */}
          <Col span={6}>
            <Form.Item label="Select Date">
              <DatePicker
                style={{ width: "100%" }}
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

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
                      <div style={{ fontWeight: 600 }}>
                        Operation-{item.op}
                      </div>
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