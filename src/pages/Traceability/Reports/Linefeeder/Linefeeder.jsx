import React, { useState } from "react";
import moment from "moment";
import { Card, Form, Select, Button, Space, Table, Input } from "antd";

const { Option } = Select;

const PlanCard = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [planDate, setPlanDate] = useState(moment().format("YYYY-MM-DD"));
  const [plan, setPlan] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // keep backup for reset

  const products = [
    { id: 1, name: "MSIL Z12E 200 OE" },
    { id: 2, name: "MSIL YTA 200 OE" },
  ];

  const lines = [
    { id: 1, name: "Disc Assy" },
    { id: 2, name: "Cover Assy" },
  ];

  const plans = [
    { id: 1, name: "Plan 1" },
    { id: 2, name: "Plan 2" },
    { id: 3, name: "Plan 3" },
  ];

  // Table data
  const dataSource = [
    {
      key: 1,
      sno: 1,
      date: moment().format("YYYY-MM-DD"),
      operation: "Disc Assy",
      sfPartNumber: "CF86625SF",
      childPartCode: "CF72760",
      childPartDesc: "Cushion Disc - MSIL  Z12E 200 UX OE",
      type: "SFIN",
      fromSub: "STORES",
      picklistQty: "1,000",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 1",
    },
    {
      key: 2,
      sno: 2,
      date: moment().format("YYYY-MM-DD"),
      operation: "Disc Assy",
      sfPartNumber: "CF86625SF",
      childPartCode: "CF72760HF",
      childPartDesc: "Cushion Disc HF - MSIL  Z12E 200 UX OE",
      type: "SFIN",
      fromSub: "STORES",
      picklistQty: "1,000",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 3,
      sno: 3,
      date: moment().format("YYYY-MM-DD"),
      operation: "Disc Assy",
      sfPartNumber: "CF86625SF",
      childPartCode: "CF72760TE",
      childPartDesc: "Cushion Disc Temp - MSIL  Z12E 200 UX OE",
      type: "SFIN",
      fromSub: "STORES",
      picklistQty: "1,000",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 4,
      sno: 4,
      date: moment().format("YYYY-MM-DD"),
      operation: "Disc Assy",
      sfPartNumber: "CF86625SF",
      childPartCode: "612050700H",
      childPartDesc: "Steel Coil-MSIL Z12E Cushion Disc205X0.7",
      type: "COMP",
      fromSub: "STORES",
      picklistQty: "226",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 5,
      sno: 5,
      date: moment().format("YYYY-MM-DD"),
      operation: "Disc Assy",
      sfPartNumber: "CF86625SF",
      childPartCode: "1069282",
      childPartDesc: "Rivet - Cushion Disc DW",
      type: "COMP",
      fromSub: "STORES",
      picklistQty: "4,000",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 6,
      sno: 6,
      date: moment().format("YYYY-MM-DD"),
      operation: "Cover Assy",
      sfPartNumber: "CF89046SF",
      childPartCode: "CF89045",
      childPartDesc: "Cover Plate - MSIL Z12E 200 OE",
      type: "SFIN",
      fromSub: "STORES",
      picklistQty: "1,000",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 7,
      sno: 7,
      date: moment().format("YYYY-MM-DD"),
      operation: "Cover Assy",
      sfPartNumber: "CF89046SF",
      childPartCode: "CF89045HP",
      childPartDesc: "Cover Plate Forming - MSIL Z12E 200CPoV",
      type: "SFIN",
      fromSub: "STORES",
      picklistQty: "1,000",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 8,
      sno: 8,
      date: moment().format("YYYY-MM-DD"),
      operation: "Cover Assy",
      sfPartNumber: "CF89046SF",
      childPartCode: "CF89045BL",
      childPartDesc: "Cover Blank - MSIL Z12E 200CPoV",
      type: "SFIN",
      fromSub: "STORES",
      picklistQty: "1,000",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 9,
      sno: 9,
      date: moment().format("YYYY-MM-DD"),
      operation: "Cover Assy",
      sfPartNumber: "CF89046SF",
      childPartCode: "614853000",
      childPartDesc: "Steel Coil-MSIL Z12E Cover plate485X3.15",
      type: "COMP",
      fromSub: "STORES",
      picklistQty: "1,446",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
    {
      key: 10,
      sno: 10,
      date: moment().format("YYYY-MM-DD"),
      operation: "Cover Assy",
      sfPartNumber: "CF89046SF",
      childPartCode: "SCRAPMS",
      childPartDesc: "Scrap - MS Blank Scrap",
      type: "FING",
      fromSub: "STORES",
      picklistQty: "-462",
      status: "✔",
      product: "MSIL Z12E 200 OE",
      plan: "Plan 2",
    },
  ];

  // Columns
  const columns = [
    { title: "S.No", dataIndex: "sno", key: "sno" },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Operation", dataIndex: "operation", key: "operation" },
    {
      title: "Child Part Code",
      dataIndex: "childPartCode",
      key: "childPartCode",
    },
    {
      title: "Child Part Description",
      dataIndex: "childPartDesc",
      key: "childPartDesc",
    },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "FromSub", dataIndex: "fromSub", key: "fromSub" },
    { title: "SF Part Number", dataIndex: "sfPartNumber", key: "sfPartNumber" },
    { title: "Picklist Qty", dataIndex: "picklistQty", key: "picklistQty" },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  const handleSubmit = () => {
    const filtered = dataSource.filter(
      (row) =>
        (!selectedProduct || row.product === selectedProduct) &&
        (!selectedLine || row.operation === selectedLine) &&
        (!plan || row.plan === plan) &&
        (!planDate || row.date === planDate)
    );
    setFilteredData(filtered);
    setOriginalData(filtered);
    setShowTable(true);
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setSelectedLine(null);
    setPlanDate(moment().format("YYYY-MM-DD"));
    setPlan(null);
    setFilteredData([]);
    setOriginalData([]);
    setShowTable(false);
  };

  return (
    <>
      {/* Search Card */}
      <Card
        style={{ marginBottom: 24 }}
        bodyStyle={{ padding: 24 }}
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={<span>Line Feeder</span>}
      >
        <Form layout="vertical">
          <Space wrap size="large">
            <Form.Item
              label={
                <>
                  Product <span style={{ color: "red" }}>*</span>
                </>
              }
            >
              <Select
                placeholder="Select Product"
                value={selectedProduct}
                onChange={setSelectedProduct}
                style={{ width: 300 }}
              >
                {products.map((p) => (
                  <Option key={p.id} value={p.name}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <>
                  Line <span style={{ color: "red" }}>*</span>
                </>
              }
            >
              <Select
                placeholder="Select Line"
                value={selectedLine}
                onChange={setSelectedLine}
                style={{ width: 300 }}
              >
                {lines.map((l) => (
                  <Option key={l.id} value={l.name}>
                    {l.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Date">
              <input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                style={{
                  width: 300,
                  padding: "4px 11px",
                  borderRadius: 4,
                  border: "1px solid #d9d9d9",
                }}
              />
            </Form.Item>

            <Form.Item label="Plan">
              <Select
                placeholder="Select Plan"
                value={plan}
                onChange={setPlan}
                style={{ width: 300 }}
              >
                {plans.map((p) => (
                  <Option key={p.id} value={p.name}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          {/* Buttons */}
          <Form.Item style={{ textAlign: "center", marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                onClick={handleSubmit}
                style={{ backgroundColor: "#00264d" }}
              >
                Submit
              </Button>
              <Button
                htmlType="button"
                onClick={handleCancel}
                style={{ backgroundColor: "#00264d", color: "white" }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Table */}
      {showTable && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title="Line Feeder Details"
        >
          {/* Search Box inside card */}
          <div style={{ marginBottom: 16, textAlign: "right" }}>
            <Input.Search
              placeholder="Search..."
              allowClear
              style={{ width: 200 }}
              onSearch={(value) => {
                if (!value) {
                  setFilteredData(originalData);
                  return;
                }
                const searched = originalData.filter(
                  (row) =>
                    row.childPartCode
                      .toLowerCase()
                      .includes(value.toLowerCase()) ||
                    row.childPartDesc
                      .toLowerCase()
                      .includes(value.toLowerCase()) ||
                    row.sfPartNumber.toLowerCase().includes(value.toLowerCase())
                );
                setFilteredData(searched);
              }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            bordered
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Card>
      )}
    </>
  );
};

export default PlanCard;
