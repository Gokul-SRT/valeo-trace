import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Select,
  Form,
  Row,
  Col,
  DatePicker,
  Input,
} from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../serverAPI";
import { SearchOutlined } from "@ant-design/icons";
import LabelGenrationQRModel from "../../Traceability/LabelGeneration/LabelGenrationQRModel"
const { Option } = Select;

const LabelGeneration = () => {
  const [form] = Form.useForm();
  const todaysDelicary = dayjs();
  const todaysManufactured = dayjs();
  const todaysExpiration = dayjs();

  // Dropdown lists
  const [childPartList, setChildPartList] = useState([]);
  const [childPartDesc, setChildPartDesc] = useState("");
  const [supplierList, setSupplierList] = useState([]);

  // Table data
  const [completedDatas, setCompletedDatas] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [qrModal, setQrModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);

  // User credentials
  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");

  // Initialize on mount
  useEffect(() => {
    getSupplierDetails();
    getChildPartDetails();
  }, []);

  // Fetch supplier dropdown
  const getSupplierDetails = async () => {
    try {
      const response = await serverApi.post("getVendorMasterDetails", {
        tenantId,
        branchCode,
        isActive: "1",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setSupplierList(res.responseData);
      } else {
        setSupplierList([]);
      }
    } catch (error) {
      toast.error("Error fetching ChildPart. Please try again later.");
      console.error(error);
    }
  };

  // Fetch childPart dropdown
  const getChildPartDetails = async () => {
    try {
      const response = await serverApi.post("getChildPartDropDown", {
        tenantId,
        branchCode,
        isActive: "1",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setChildPartList(res.responseData);
      } else {
        setChildPartList([]);
      }
    } catch (error) {
      toast.error("Error fetching ChildPart. Please try again later.");
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    const tenantId = store.get("tenantId");
    const branchCode = store.get("branchCode");

    try {
      const payload = {
        consignee :e.consignee,
        lableType :e.lableType,
        unloadingPoint :e.unloadingPoint,
        invoiceNumber :e.delivaryNoteNumber,
        customerItemNo :e.childPartcode,
        deliveryDate :e.delivaryDate,
        manufacturingDate :e.manufacturedDate,
        expirationDate :e.expirationDate,
        itemDescription : e.childPartDesc,
        quantity :e.quantity,
        packageReferenceNo :e.packageReferenceNo,
        supplierNumber :e.supplierNo,
        pkgNo :e.packageNo,
        batchNo :e.batchNumber
      };

      const verifyResponse = await serverApi.post(
        "/manualLabelGeneration",
        payload
      );
      const insertData = verifyResponse.data;

      if (insertData.responseCode === "200") {
        form.resetFields();
        toast.success("inserted successfully!");
        if (
          insertData != null &&
          Array.isArray(insertData.responseData) &&
          insertData.responseData.length > 0
        ) {
          setCompletedDatas(insertData.responseData);
        } else {
          setCompletedDatas([]);
        }
      } else {
        toast.error("Failed to insert record");
      }
    } catch (error) {
      toast.error("Error verifying or inserting ");
    }
  };

  // Handle form submission
  const onFinish = (values) => {
    handleSubmit(values);
  };

  // Handle cancel/reset
  const onCancel = () => {
    form.resetFields();
  };

  // Filter data based on search
  const filteredData = completedDatas.filter((item) =>
    Object.values(item).some((val) =>
      String(val)
        .toLowerCase()
        .includes(searchText.toLowerCase())
    )
  );


  const getItemById = (id) => {
    return completedDatas.find((item) => item.labelId === id);
  };

  const handleSubAssemplyPrint = async (record) => {
    try {
      const itemObject = getItemById(record.labelId);
      setSelectedObject(itemObject);
      setQrModal(true);
      toast.success("Printed successfully!");
    } catch (err) {
      toast.error("Print failed");
    }
  };



  // Column definitions for Completed
  const completedColumns = [
    { title: "S.No", key: "sno", render: (text, record, index) => index + 1 },
    { title: "Consignee", dataIndex: "consignee", key: "consignee" },
    { title: "LableType", dataIndex: "lableType", key: "lableType" },
    {
      title: "UnloadingPoint",
      dataIndex: "unloadingPoint",
      key: "unloadingPoint",
    },
    {
      title: "Customer Item No",
      dataIndex: "customerItemNo",
      key: "customerItemNo",
    },
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Invoice Number",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
    },
    {
      title: "Delivery Date",
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      render: (text) => {
        if (!text) return "-";
        return dayjs(text).format("DD-MMM-YYYY");
      },
    },
    {
      title: "Manufacturing Date",
      dataIndex: "manufacturingDate",
      key: "manufacturingDate",
      render: (text) => {
        if (!text) return "-";
        return dayjs(text).format("DD-MMM-YYYY");
      },
    },
    {
      title: "Expiration Date",
      dataIndex: "expirationDate",
      key: "expirationDate",
      render: (text) => {
        if (!text) return "-";
        return dayjs(text).format("DD-MMM-YYYY");
      },
    },

    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Package Reference No",
      dataIndex: "packageReferenceNo",
      key: "packageReferenceNo",
    },
    {
      title: "Supplier Number",
      dataIndex: "supplierNumber",
      key: "supplierNumber",
    },
    { title: "Pkg No", dataIndex: "pkgNo", key: "pkgNo" },
    { title: "Batch No", dataIndex: "batchNo", key: "batchNo" },
    {
      title: "Traceability Code",
      dataIndex: "traceabilityCode",
      key: "traceabilityCode",
      render: (text) => (
        <span style={{ whiteSpace: 'pre', fontFamily: 'monospace' }}>
          {text}
        </span>
      )
    },
    {
      title: "Action",
      key: "printSts",
      render: (_, record) => {
        const val = record.printSts; // 0 or 1

        return (
          <>
            {/* PRINT BUTTON */}
            <Button
              type="primary"
             // disabled={val === "1"} // Disable when printSts = 1
              // style={{
              //   marginRight: 8,
              //   opacity: val === "1" ? 0.5 : 1,
              //   cursor: val === "1" ? "not-allowed" : "pointer",
              // }}
              onClick={() => handleSubAssemplyPrint(record)}
            >
              Print
            </Button>

            {/* REPRINT BUTTON */}
            {/* <Button
              type="default"
              disabled={val === "0"} // Disable when printSts = 0
              style={{
                opacity: val === "0" ? 0.5 : 1,
                cursor: val === "0" ? "not-allowed" : "pointer",
              }}
              onClick={() => handleSubAssemplyRePrint(record)}
            >
              Reprint
            </Button> */}
          </>
        );
      },
    },
  ];

  return (
    <>
      {/* Filter Card */}
      <Card
        title="Label Generation"
        headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
        style={{ marginBottom: "10px" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            delivaryDate: dayjs(),
            manufacturedDate: dayjs(),
            expirationDate: dayjs(),
            consignee: "Amalgamations Valeo Clutch Private - Chennai",
            unloadingPoint: "CH35 - -",
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="consignee"
                label="Consignee"
                rules={[{ required: true, message: "Please select Consignee" }]}
              >
                <Input type="text" placeholder="Enter Consignee" disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="unloadingPoint"
                label="Unloading Point"
                rules={[
                  { required: true, message: "Please select Unloading Point" },
                ]}
              >
                <Input
                  type="text"
                  placeholder="Enter unloadingPoint"
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Label Type"
                name="lableType"
                rules={[
                  { required: true, message: "Please select Label Type" },
                ]}
              >
                <Select placeholder="Select a Label Type">
                  <Option value="H">H</Option>
                  <Option value="S">S</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="delivaryNoteNumber"
                label="Delivery Note Number"
                rules={[
                  {
                    required: true,
                    message: "Please select Delivery Note Number",
                  },
                  {
                    min: 1,
                    max: 16,
                    message:
                      "Delivery Note Number must be between 1 and 16 characters",
                  },
                ]}
              >
                <Input
                  type="text"
                  placeholder="Enter Quantity"
                  maxLength={16}
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Child Part Code"
                name="childPartcode"
                rules={[
                  { required: true, message: "Please select ChildPartcode" },
                ]}
              >
                <Select
                showSearch
                  placeholder="Select a ChildPartcode"
                  onChange={(value) => {
                    // Find the selected item and set the description
                    const selectedItem = childPartList.find(
                      (item) => item.childPartCode === value
                    );
                    if (selectedItem) {
                      setChildPartDesc(selectedItem.childPartDesc);
                      form.setFieldsValue({
                        childPartDesc: selectedItem.childPartDesc,
                      });
                    }
                  }}
                >
                  {childPartList.map((childPartList) => (
                    <Option
                      key={childPartList.childPartCode}
                      value={childPartList.childPartCode}
                    >
                      {childPartList.childPartCode}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="childPartDesc"
                label="Child Part Descrption"
                rules={[
                  { required: true, message: "Please select Child Part Desc" },
                ]}
              >
                <Input
                  type="text"
                  placeholder="Enter Child Part Descrption"
                  value={childPartDesc}
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Delivery Date"
                name="delivaryDate"
                rules={[
                  { required: true, message: "Please select Delivery Date" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  defaultValue={todaysDelicary}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Manufactured Date"
                name="manufacturedDate"
                rules={[
                  {
                    required: true,
                    message: "Please select Manufactured Date",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  defaultValue={todaysManufactured}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Expiration Date"
                name="expirationDate"
                rules={[
                  { required: true, message: "Please select Expiration Date" },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  defaultValue={todaysExpiration}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[
                  { required: true, message: "Please enter Quantity" },
                  {
                    pattern: /^[1-9]\d{0,7}$/, // 1-8 digits, no leading zero
                    message: "Quantity must be between 1 and 8 digits",
                  },
                ]}
              >
                <Input
                  type="number"
                  placeholder="Enter Quantity"
                  min={1}
                  max={99999999} // 8 digits maximum
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="packageReferenceNo"
                label="Package Reference No"
                rules={[{ required: true, message: "Please Select Package Reference No" }]}
              >
                <Input
                  type="text"
                  placeholder="Enter Package Reference No"
                 
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Supplier Number"
                name="supplierNo"
                rules={[
                  { required: true, message: "Please select Supplier Number" },
                ]}
              >
                <Select 
                showSearch 
                placeholder="Select a Supplier Number"
                optionFilterProp="children">
                  
                  {supplierList.map((statuslis) => (
                    <Option
                      key={statuslis.vendorCode}
                      value={statuslis.vendorCode}
                    >
                      {statuslis.vendorName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="packageNo"
                label="Package No"
                rules={[
                  { required: true, message: "Please select Package No" },
                  {
                    min: 1,
                    max: 18,
                    message:
                      "Package No must be between 1 and 18 characters",
                  },
                ]}
              >
                <Input
                  type="text"
                  placeholder="Enter Package No"
                  maxLength={18}
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                name="batchNumber"
                label="Batch Number"
                rules={[
                  { required: true, message: "Please select Batch Number" },
                  {
                    min: 1,
                    max: 18,
                    message:
                      "Batch Number must be between 1 and 12 characters",
                  },
                ]}
              >
                <Input
                  type="text"
                  placeholder="Enter Batch Number"
                  maxLength={12}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24} style={{ textAlign: "center" }}>
              <Button
                style={{ backgroundColor: "#001F3E", color: "white" }}
                htmlType="submit"
              >
                Submit
              </Button>
              <Button
                style={{
                  marginLeft: 8,
                  backgroundColor: "#001F3E",
                  color: "white",
                }}
                onClick={onCancel}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
      {completedDatas && completedDatas.length > 0 && (
        <div className="picklist-container">
          <Card
            headStyle={{ backgroundColor: "#00264d", color: "white" }}
            title="Label Generation Details"
          >
            {/* Search Box */}
            <div style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search in table..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </div>

            <Table
              columns={completedColumns}
              dataSource={filteredData}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                pageSizeOptions: ["10", "20", "50", "100"],
              }}
              bordered
              scroll={{
                y: 400, // Vertical scroll height
                x: "max-content", // Horizontal scroll if needed
              }}
              locale={{ emptyText: "No data available" }}
              rowKey={(record) => record.labelId}
            />
          </Card>
        </div>
      )}
      <LabelGenrationQRModel
        qrModalVisible={qrModal}
        setQrModalVisible={setQrModal}
        selectedQrData={selectedObject}
      />
    </>
  );
};

export default LabelGeneration;
