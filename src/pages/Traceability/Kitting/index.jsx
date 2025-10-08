
import React, { use, useState } from "react";

import { Card, Col, DatePicker, Form, Input, Row, Select, Button, Switch, Title, Typography } from 'antd';

const { Option } = Select;

const Kitting = () => {

  const [isStock, setIsStock] = useState(true);

  const name = "Type C"

  const handleSwitchChange = (checked) => {

    setIsStock(checked);

  };

  return (
<>
<div>
<Card

          title="Kitting Process"

          headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
>
<Form layout="vertical">
<Row gutter={16}>
<Col span={6}>
<Form.Item label="Date">
<DatePicker style={{ width: "100%" }} />
</Form.Item>
</Col>
<Col span={6}>
<Form.Item label="Product">
<Select placeholder="Select a Product">
<Option value="z12e">Z12E</Option>
<Option value="yta">YTA</Option>
</Select>
</Form.Item>
</Col>
<Col span={6}>
<Form.Item label="Line">
<Select placeholder="Select a line">
<Option value="cover">Cover</Option>
<Option value="disk">Disk</Option>
</Select>
</Form.Item>
</Col>
 
              <Col span={6}>
<Form.Item label="WO/Plan">
<Select placeholder="Select a Plan">
<Option value="1">Plan 1</Option>
<Option value="2">Plan 2</Option>
<Option value="3">Plan 3</Option>
</Select>
</Form.Item>
</Col>
</Row>
<Row>
<Col span={24} style={{ textAlign: 'center' }}>
<Button style={{ backgroundColor: "#001F3E", color: "white" }} htmlType="submit">

                  Submit
</Button>
<Button style={{ marginLeft: 8 }}>

                  Cancel
</Button>
</Col>
</Row>
</Form>
</Card>
</div>
<div>
<Card

          title={`Kitting - ${name}`}

          headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
>
<Row gutter={16}>
<div style={{ marginBottom: 16 }}>

              {isStock ? "Stock Quantity" : "Build In Quantity"}:{" "}
<Switch checked={isStock} onChange={handleSwitchChange} />
</div>
</Row>

          {isStock ?

            // <Form layout="vertical">
<Row gutter={16}>
<Col xs={24} sm={20} md={12} lg={8}>
<Card title="Kitting Part Stock Qty" headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}>
<Form layout="vertical">
<Form.Item label="Stock QTY">
<Input defaultValue={45} disabled />
</Form.Item>
 
                    <Form.Item label="Label Print QTY">
<Input placeholder="Please enter the Qty"/>
</Form.Item>
 
                    <Form.Item>
<Button style={{ backgroundColor: "#001F3E", color: "white" }} block>

                        Submit
</Button>
</Form.Item>
</Form>
</Card>
</Col>
</Row>
 
 
 
            // </Form>
 
            :
<Row gutter={16} justify="center" style={{ padding: 20 }}>

              {/* Left Section */}
<Col span={10}>
<Card title="KIT PART A" headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}>
<Form layout="vertical">
<Row gutter={16} align="middle" wrap={true} style={{ display: "flex", flexWrap: "wrap" }}>
<Col xs={24} sm={12}>
<Form.Item label="Child Part A">
<Input placeholder="Input 1" />
</Form.Item>
</Col>
 
                      <Col xs={24} sm={12}>
<Form.Item label="Scanned Count">
<Input placeholder="Input 2" />
</Form.Item>
</Col>
 
                    </Row>
<span style={{ fontStyle: "italic", fontSize: 12 }}>(scan)</span>
 
 
                    <Row gutter={16} align="middle" wrap={true} style={{ display: "flex", flexWrap: "wrap" }}>
<Col xs={24} sm={12}>
<Form.Item label="Child Part B">
<Input placeholder="Input 1" />
</Form.Item>
</Col>
 
                      <Col xs={24} sm={12}>
<Form.Item label="Scanned Count">
<Input placeholder="Input 2" />
</Form.Item>
</Col>
 
                    </Row>
 
                    <Form.Item>
<Button style={{ backgroundColor: "#001F3E", color: "white" }} block>

                        Label Print
</Button>
</Form.Item>
</Form>
</Card>
</Col>
 
              {/* Right Section */}
<Col span={10}>
<Card title="KIT PART B" headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}>
<Form layout="vertical">
 
                    <Row gutter={16} align="middle" wrap={true} style={{ display: "flex", flexWrap: "wrap" }}>
<Col xs={24} sm={12}>
<Form.Item label="Child Part A">
<Input placeholder="Input 1" />
</Form.Item>
</Col>
 
                      <Col xs={24} sm={12}>
<Form.Item label="Scanned Count">
<Input placeholder="Input 2" />
</Form.Item>
</Col>
 
                    </Row>
 
                    <Row gutter={16} align="middle" wrap={true} style={{ display: "flex", flexWrap: "wrap" }}>
<Col xs={24} sm={12}>
<Form.Item label="Child Part A">
<Input placeholder="Input 1" />
</Form.Item>
</Col>
 
                      <Col xs={24} sm={12}>
<Form.Item label="Scanned Count">
<Input placeholder="Input 2" />
</Form.Item>
</Col>
 
                    </Row>
 
                    <Row gutter={16} align="middle" wrap={true} style={{ display: "flex", flexWrap: "wrap" }}>
<Col xs={24} sm={12}>
<Form.Item label="Child Part A">
<Input placeholder="Input 1" />
</Form.Item>
</Col>
 
                      <Col xs={24} sm={12}>
<Form.Item label="Scanned Count">
<Input placeholder="Input 2" />
</Form.Item>
</Col>
 
                    </Row>
 
                    <Form.Item>
<Button style={{ backgroundColor: "#001F3E", color: "white" }} block>

                        Label Print
</Button>
</Form.Item>
</Form>
</Card>
</Col>
</Row>

          }
</Card>
</div>
</>

  );

}

export default Kitting;
 