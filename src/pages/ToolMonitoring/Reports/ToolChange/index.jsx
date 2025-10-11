import React, { useState } from "react";
import { Card, Form, Input, Select, Row, Col, Button } from "antd";

const { Option } = Select;

const ToolChange = () => {
  const [form] = Form.useForm();
  const [remainingUsage, setRemainingUsage] = useState("55000");

  const handleUsageChange = () => {
    const usage = form.getFieldValue("usageTillDate");
    const max = form.getFieldValue("maxUsage");
    if (usage && max) {
      setRemainingUsage(max - usage);
    }
  };

  return (
    <Card
      headStyle={{ backgroundColor: "#00264d", color: "white" }}
      title="Tool Life Log"
      style={{ marginTop: "20px", borderRadius: "8px" }}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleUsageChange}
        style={{ marginTop: "10px" }}
      >
        <Row gutter={16}>
          {/* Tool ID Scan - Static Value */}
          <Col span={4}>
            <Form.Item
              label="Tool ID Scan"
              name="toolId"
              initialValue="D001"
              rules={[{ required: true, message: "Tool ID is required" }]}
            >
              <Input
                readOnly
                style={{
                  backgroundColor: "#ffffffff",
                  fontWeight: "bold",
                }}
              />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item
              label="Tool Name / Description"
              // no `name` since it's static
            >
              <Input
                value="3rd Top & Bottom Tool"
                readOnly
                style={{
                  backgroundColor: "#ffffff",
                  fontWeight: "bold",
                }}
              />
            </Form.Item>
          </Col>

          {/* Tool Location / Rack */}
          <Col span={4}>
            <Form.Item
              label="Tool Location / Rack"
              name="toolLocation"
              rules={[{ required: true, message: "Select Tool Location" }]}
            >
              <Select placeholder="<select>">
                <Option value="rack1">Rack 1</Option>
                <Option value="rack2">Rack 2</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Machine */}
          <Col span={4}>
            <Form.Item
              label="Machine"
              name="machine"
              rules={[{ required: true, message: "Select Machine" }]}
            >
              <Select placeholder="<select>">
                <Option value="machine1">Machine 1</Option>
                <Option value="machine2">Machine 2</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Usage Till Date - Static Value */}
          <Col span={4}>
            <Form.Item
              label="Usage Till Date"
              name="usageTillDate"
              initialValue="45000"
              rules={[{ required: true, message: "Enter usage till date" }]}
            >
              <Input
                type="number"
                readOnly
                style={{
                  backgroundColor: "#ffffffff",
                  fontWeight: "bold",
                }}
              />
            </Form.Item>
          </Col>

          {/* Maximum Usage - Static Value */}
          <Col span={4}>
            <Form.Item
              label="Maximum Usage"
              name="maxUsage"
              initialValue="100000"
              rules={[{ required: true, message: "Enter maximum usage" }]}
            >
              <Input
                type="number"
                readOnly
                style={{
                  backgroundColor: "#ffffffff",
                  fontWeight: "bold",
                }}
              />
            </Form.Item>
          </Col>

          {/* Remaining Usage - Static Value */}
          <Col span={4}>
            <Form.Item
              label="Remaining Usage"
              name="remainingUsage"
              initialValue="55000"
              rules={[{ required: true, message: "Required field" }]}
            >
              <Input
                readOnly
                style={{
                  backgroundColor: "#90EE90",
                  fontWeight: "bold",
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Buttons */}
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <Button type="primary" style={{ marginRight: "10px" }}>
            Submit
          </Button>
          <Button>Cancel</Button>
        </div>
      </Form>
    </Card>
  );
};

export default ToolChange;
