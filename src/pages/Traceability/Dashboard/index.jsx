
import React from "react";

import { Card, Col, Row, Select, DatePicker, Form } from "antd";

import { ToolOutlined } from "@ant-design/icons";

const { Option } = Select;

const dataCard = [

  {

    title: "Operation-1",

    desc: "Pressing",

    childPart: [

      { name: "Child Part", desc: "test", count: "170" },

      { name: "Child Part", desc: "test", count: "370" },

      { name: "Child Part", desc: "test", count: "70" },

    ],

  },

  {

    title: "Operation-2",

    desc: "Welding",

    childPart: [

      { name: "Child Part", desc: "welded", count: "270" },

      { name: "Child Part", desc: "welded", count: "220" },

    ],

  },

  {

    title: "Operation-3",

    desc: "Painting",

    childPart: [

      { name: "Child Part", desc: "painted", count: "200" },

      { name: "Child Part", desc: "painted", count: "250" },

    ],

  },

  {

    title: "Operation-4",

    desc: "Assembly",

    childPart: [

      { name: "Child Part", desc: "assembled", count: "500" },

      { name: "Child Part", desc: "assembled", count: "600" },

    ],

  },

  {

    title: "Operation-5",

    desc: "Inspection",

    childPart: [

      { name: "Child Part", desc: "inspected", count: "50" },

    ],

  },

  {

    title: "Operation-6",

    desc: "Packing",

    childPart: [

      { name: "Child Part", desc: "packed", count: "30" },

      { name: "Child Part", desc: "packed", count: "500" },

    ],

  },

  {

    title: "Operation-7",

    desc: "Dispatch",

    childPart: [

      { name: "Child Part", desc: "dispatched", count: "300" },

    ],

  },

  {

    title: "Operation-8",

    desc: "Machining",

    childPart: [

      { name: "Child Part", desc: "machined", count: "20" },

      { name: "Child Part", desc: "machined", count: "40" },

    ],

  },

  {

    title: "Operation-9",

    desc: "Testing",

    childPart: [

      { name: "Child Part", desc: "tested", count: "1000" },

    ],

  },

  {

    title: "Operation-10",

    desc: "Storage",

    childPart: [

      { name: "Child Part", desc: "stored", count: "100" },

      { name: "Child Part", desc: "stored", count: "2000" },

      { name: "Child Part", desc: "stored", count: "40" },

    ],

  },

];
 
 
const gradientColors = [

  "linear-gradient(90deg, #efd5ff 0%, #eab5e9ff 100%)",

  "linear-gradient(90deg, #efd5ff 0%, #c8ebd4ff 100%)",

  "linear-gradient(90deg, #efd5ff 0%, #ebefb4ff 100%)",

];
 
const LineDashboard = () => {

  return (
<>
<div>
<Row gutter={16} style={{ width: "auto" }}>
<Col span={6}>
<Form.Item label="Product">
<Select

                placeholder="Select product"

                style={{ width: "100%" }}

                defaultValue="Z12E"
>
<Option value="Z12E">Z12E</Option>
<Option value="YTA">YTA</Option>
</Select>
</Form.Item>
</Col>
<Col span={6}>
<Form.Item label="Line">
<Select

                placeholder="Select Line"

                style={{ width: "100%" }}

                defaultValue="cover"
>
<Option value="cover">Cover</Option>
<Option value="disk2">Disk 2</Option>
<Option value="disk3">Disk 3</Option>
</Select>
</Form.Item>
</Col>
<Col span={6}>
<Form.Item label="Select Date">
<DatePicker />
</Form.Item>
</Col>
</Row>
</div>
 
 
      <div style={{ padding: "0px" }}>
<Row gutter={[16, 16]}>

          {dataCard.map((item, index) => (
<Col key={index} xs={24} sm={12} md={8} lg={6}>
<Card

                bordered={false}

                style={{

                  height: 250, // fixed height

                  display: "flex",

                  flexDirection: "column",

                  justifyContent: "flex-start",

                  borderRadius: "12px",

                  overflow: "hidden",

                }}

                bodyStyle={{

                  padding: "16px",

                  background: "#fff",

                  flexGrow: 1,

                }}

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
<div style={{ fontWeight: 600 }}>{item.title}</div>
<div style={{ fontSize: "12px" }}>{item.desc}</div>
</div>
<ToolOutlined style={{ fontSize: 20, opacity: 0.9 }} />
</div>

                }
>
<div style={{ maxHeight: 130, overflowY: "auto" }}>

                  {item.childPart.map((child, i) => (
<div

                      key={i}

                      style={{

                        padding: "4px 0",

                        fontSize: "13px",

                        borderBottom: "1px solid #f0f0f0",

                      }}
>
<strong>{child.name}</strong>: {child.desc}

                      {child.count && (
<span style={{ float: "right", color: "#110101ff" }}>

                          (Count: {child.count})
</span>

                      )}
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
 