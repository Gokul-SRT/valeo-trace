import React, { useState, useCallback } from "react";
import { Card, Form, Input, Select, Row, Col, Button } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Label
} from "recharts";
import { backendService } from "../../../../service/ToolServerApi";
import store from "store";
import ProductDropdown from "../../../../CommonDropdownServices/Service/ProductDropdownService"
import { toast } from "react-toastify";
const { Option } = Select;


const ToolChange = () => {
  const [form] = Form.useForm();
  const [remainingUsage, setRemainingUsage] = useState("55000");
  const [productDataList, setProductDataList] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const tenantId = store.get('tenantId')
  const branchCode = store.get('branchCode')
  const empId = store.get('employeeId')

  const handleUsageChange = () => {
    const usage = form.getFieldValue("usageTillDate");
    const max = form.getFieldValue("maxUsage");
    if (usage && max) {
      setRemainingUsage(max - usage);
    }
  };

  const getProductDropdown = useCallback(async () => {
    try {
      const response = await ProductDropdown();
      console.log(response)
      let returnData = [];
      if (response) {
        returnData = response;
        const options = returnData.map(item => ({
          productCode: item.productCode,
          productDesc: item.productDesc,
        }));
        setProductDataList(options);
        return returnData;
      } else {
        console.warn("LineMstdropdown returned no data.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching line dropdown data:", error);
      setProductDataList([]);
    }
  }, []);


  


   const getProductByTool = async () =>{
     const formValues = form.getFieldsValue()
     console.log(formValues,"formValues-------------")
     try{
          
      const response = await backendService({
        requestPath: 'getProductByTool',
        requestData: [{
          tenantId,
          toolNo: formValues.toolNo,
          enteredBy: empId,
        }]
      })
      if (response) {
        if (response.responseCode === '200') {
          toast.success(response.responseMessage)
        }else if (response.responseCode === '409'){
          toast.warning(response.responseMessage)
        }else{
          toast.error(response.responseMessage)
        }
        form.resetFields()
      }
     }catch (err){
       console.error(err)
     }
  }

  const createorUpdate = async () =>{
     const formValues = form.getFieldsValue()
     console.log(formValues,"formValues-------------")
     try{
          
      const response = await backendService({
        requestPath: 'saveOrUpdateToolLogHdr',
        requestData: [{
          tenantId,
          operation: formValues.operation,
          toolDesc: formValues.toolDesc,
          toolNo: formValues.toolNo,
          product: formValues.product,
          usageTillDate:formValues.usageTillDate,
          remainUseage: formValues.remainUseage,
          maxUseage: formValues.maxUsage,
          enteredBy: empId,
        }]
      })
      if (response) {
        if (response.responseCode === '200') {
          toast.success(response.responseMessage)
        }else if (response.responseCode === '409'){
          toast.warning(response.responseMessage)
        }else{
          toast.error(response.responseMessage)
        }
        form.resetFields()
      }
     }catch (err){
       console.error(err)
     }
  }

  const handleQrBlur = async () => {
    const formValues = form.getFieldsValue()
    try {
      const response = await backendService({
        requestPath: 'getToolLifeChangeLog',
        requestData: {
          tenantId,
          // branchCode,
          toolNo: formValues.toolNo,
          productId: formValues.product,
          isRunning: "1"
        }
      })
      if (response) {
        if (response.responseCode === '200') {
          if (response.responseData !== null && response.responseData.length > 0) {
            const updatedData = response.responseData[0]
            console.log(updatedData, "updatedData--------")
            form.setFieldsValue({
              toolDesc: updatedData.toolDesc,
              operation: updatedData.operation,
              maxUsage: updatedData.maxUseage || '',
              usageTillDate: updatedData.usageTillDate || '0',
              remainUseage: updatedData.remainUseage == null ? updatedData.maxUseage : updatedData.remainUseage
            });
            getProductDropdown()
          }
        }else{
          toast.warning(response.responseMessage)
          form.resetFields(['remainUseage', 'maxUsage', 'usageTillDate' ])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCancel = () =>  {
     form.resetFields()
  }

  const handleProductChange = (val) =>{
    setSelectedProduct(val)
    handleQrBlur()
    form.resetFields(['remainUseage', 'maxUsage', 'usageTillDate' ]);
  }

  // 🔹 Dummy data for 20 tools
  const chartData = [
    { toolName: "Greasing Fixture", maxUsage: 100000, usedUsage: 60000 },
    { toolName: "1st Top Tool", maxUsage: 90000, usedUsage: 70000 },
    { toolName: "1st Bottom Tool", maxUsage: 120000, usedUsage: 80000 },
    { toolName: "2nd Top Tool", maxUsage: 80000, usedUsage: 50000 },
    { toolName: "2nd Bottom Tool", maxUsage: 110000, usedUsage: 85000 },
    { toolName: "3rd Top Tool", maxUsage: 95000, usedUsage: 75000 },
    { toolName: "3rd Bottom Tool", maxUsage: 105000, usedUsage: 65000 },
    { toolName: "Balancing Fixture", maxUsage: 115000, usedUsage: 95000 },
    { toolName: "Balancing Riveting Fixture", maxUsage: 100000, usedUsage: 80000 },
    { toolName: "Rebalancing Fixture", maxUsage: 90000, usedUsage: 60000 },
    { toolName: "R/o Depositor", maxUsage: 95000, usedUsage: 70000 },
    { toolName: "R/o Lever", maxUsage: 100000, usedUsage: 85000 },
    { toolName: "R/o Bunk", maxUsage: 120000, usedUsage: 95000 },
    { toolName: "R/o Probe", maxUsage: 110000, usedUsage: 70000 },
    { toolName: "R/o Po Plate", maxUsage: 95000, usedUsage: 80000 },
    { toolName: "EOL Bunk", maxUsage: 100000, usedUsage: 90000 },
    { toolName: "EOL Top Plate", maxUsage: 95000, usedUsage: 85000 },
    { toolName: "EOL Bottom Plate", maxUsage: 105000, usedUsage: 95000 },
    { toolName: "EOL Po Plate", maxUsage: 115000, usedUsage: 100000 },
    { toolName: "EOL Marking Fixture", maxUsage: 100000, usedUsage: 85000 },
  ];


  return (
    <div style={{ padding: "20px" }}>
      {/* Tool Life Log Card */}
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
            {/* Tool ID Scan */}
            <Col span={4}>
              <Form.Item
                label="Scan Tool No."
                name="toolNo"
                // initialValue="T001"
                rules={[{ required: true, message: "Tool ID is required" }]}
              >
                <Input placeholder="Scan Tool" onBlur={handleQrBlur} style={{ backgroundColor: "#ffffff", }} />
              </Form.Item>
            </Col>

            {/* Tool Name */}
            <Col span={4}>
              <Form.Item label="Tool Desc" name="toolDesc">
                <Input
                  // value="1st Top Tool"
                  readOnly
                  style={{ backgroundColor: "#ffffff", }}
                />
              </Form.Item>
            </Col>

            {/* Operation */}
            <Col span={4}>
              <Form.Item
                label="Operation"
                name="operation"
                rules={[{ required: true, message: "Select Operation" }]}
              >
                <Input
                  // value="1st Top Tool"
                  readOnly
                  style={{ backgroundColor: "#ffffff", }}
                />
              </Form.Item>
            </Col>

            {/* Product */}
            <Col span={4}>
              <Form.Item
                label="Product"
                name="product"
                rules={[{ required: true, message: "Select Product" }]}
              >
                <Select
                  placeholder="Select Product"
                  value={selectedProduct}
                  onChange={(value) => handleProductChange(value)}
                >
                  {productDataList.map((prod) => (
                    <Option key={prod.productCode} value={prod.productCode}>
                      {prod.productCode}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Usage Till Date */}
            <Col span={4}>
              <Form.Item
                label="Usage Till Date (Nos.)"
                name="usageTillDate"
              // initialValue="45000"
              // rules={[{ required: true, message: "Enter usage till date" }]}
              >
                <Input
                  type="number"
                  readOnly
                  style={{ backgroundColor: "#ffffff", }}
                />
              </Form.Item>
            </Col>

            {/* Maximum Usage */}
            <Col span={4}>
              <Form.Item
                label="Maximum Usage (Nos.)"
                name="maxUsage"
              // initialValue="100000"
              // rules={[{ required: true, message: "Enter maximum usage" }]}
              >
                <Input
                  type="number"
                  readOnly
                  style={{ backgroundColor: "#ffffff", }}
                />
              </Form.Item>
            </Col>

            {/* Remaining Usage */}
            <Col span={4}>
              <Form.Item
                label="Remaining Usage (Nos.)"
                name="remainUseage"
              // initialValue={remainingUsage}
              // rules={[{ required: true, message: "Required field" }]}
              >
                <Input
                  readOnly
                  // value={remainingUsage}
                  style={{ backgroundColor: "#90EE90", }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <Button type="primary" style={{ marginRight: "10px" }} onClick={createorUpdate}>
              Submit
            </Button>
            <Button type="primary"  onClick={handleCancel} >Cancel</Button>
          </div>
        </Form>
      </Card>

      {/* Bar Chart Section */}
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        style={{ marginTop: "30px", borderRadius: "8px", height: "450px", display: 'none' }}
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Tool Usage vs Max Usage</span>
            <Select
              defaultValue="Cover Assembly"
              style={{ width: 150 }}
              onChange={(value) => console.log("Selected line:", value)}
            >
              <Option value="Cover Assembly">Cover Assembly</Option>
              <Option value="Disc Assembly 1">Disc Assembly 1</Option>
              <Option value="Disc Assembly 2">Disc Assembly 2</Option>
            </Select>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
            <XAxis
              dataKey="toolName"
              angle={-45}
              textAnchor="end"
              interval={0}
              height={80}
            >
              <Label
                value="Tools"
                offset={-5}
                position="insideBottom"
                style={{ fontSize: 12, }}
              />
            </XAxis>

            <YAxis>
              <Label
                value="Nos."
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: "middle", fontSize: 12, }}
              />
            </YAxis>
            <Tooltip />
            <Legend />

            {/* Max Usage Bars */}
            <Bar dataKey="maxUsage" fill="#82ca9d" name="Max Usage">
              <LabelList dataKey="maxUsage" position="top" fontSize={10} fill="#000" />
            </Bar>

            {/* Used Usage Bars */}
            <Bar dataKey="usedUsage" fill="#8884d8" name="Used Usage">
              <LabelList dataKey="usedUsage" position="top" fontSize={10} fill="#000" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ToolChange;
