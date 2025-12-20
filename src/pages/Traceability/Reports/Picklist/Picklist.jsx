import React, { useState, useEffect } from "react";
import { Table, Button, Card, Select, Form, Row, Col, DatePicker } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../../serverAPI";
import "./style.css";

const { Option } = Select;

const Picklist = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const todays = dayjs();

  // Dropdown lists
  const [productList, setProductList] = useState([]);
  const [lineList, setLineList] = useState([]);
  const [statusList, setStatusList] = useState([]);

  // Table data
  const [tableData, setTableData] = useState([]);
  const [completedDatas, setCompletedDatas] = useState([]);
  
  // UI states
  const [selectedStatus, setSelectedStatus] = useState("completed");
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [tableTitle, setTableTitle] = useState("Completed Picklist");
  const [selectedLine, setSelectedLine] = useState(null);

  // User credentials
  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");

  // Initialize on mount
  useEffect(() => {
    fetchLineDetails();
    fetchStatusDetails();
    fetchDefaultCompletedTable();
  }, []);

  // Fetch products when line changes
  useEffect(() => {
    if (selectedLine) {
      fetchProductDetails();
    }
  }, [selectedLine]);

  // Handle line selection change
  const handleLineChange = (value) => {
    setSelectedLine(value);
    form.setFieldsValue({ product: undefined });
  };

  // Fetch products based on selected line
  const fetchProductDetails = async () => {
    try {
      const response = await serverApi.post("getProductByLine", {
        tenantId,
        branchCode,
        lineCode: selectedLine,
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setProductList(res.responseData);
      } else {
        setProductList([]);
      }
    } catch (error) {
      toast.error("Error fetching productCode. Please try again later.");
      console.error(error);
    }
  };

  // Fetch line dropdown
  const fetchLineDetails = async () => {
    try {
      const response = await serverApi.post("getLineDropdown", {
        tenantId,
        branchCode,
        isActive: "1",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setLineList(res.responseData);
      } else {
        setLineList([]);
      }
    } catch (error) {
      toast.error("Error fetching lineCode. Please try again later.");
      console.error(error);
    }
  };

  // Fetch status dropdown
  const fetchStatusDetails = async () => {
    try {
      const response = await serverApi.post("getStatusDropdown", {
        tenantId,
        branchCode,
        isActive: "1",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setStatusList(res.responseData);

        const completedStatus = res.responseData.find(
          (item) => item.statusDesc?.toLowerCase() === "completed"
        );
        if (completedStatus) {
          form.setFieldsValue({ status: completedStatus.statusDesc });
          setSelectedStatus(completedStatus.statusDesc);
        }
      } else {
        setStatusList([]);
      }
    } catch (error) {
      toast.error("Error fetching statusCode. Please try again later.");
      console.error(error);
    }
  };

  // Fetch default completed table on load
  const fetchDefaultCompletedTable = async () => {
    try {
      const response = await serverApi.post("getCompletedPicklist", {
        tenantId: tenantId,
        branCode: branchCode,
        prodCode: "",
        lineCode: "",
        pickDate: dayjs().format("YYYY-MM-DD"),
        status: "3",
      });

      const resData = response.data;
      if (
        resData != null &&
        Array.isArray(resData.completedScanHdrList) &&
        resData.completedScanHdrList.length > 0
      ) {
        setCompletedDatas(resData.completedScanHdrList);
      } else {
        setCompletedDatas([]);
      }
    } catch (error) {
      toast.error("Error fetching default Completed table");
      console.error(error);
    }
  };

  // Fetch picklist data based on filters
  const fetchPicklistData = async ({ product, line, date, status }) => {
    try {
      const response = await serverApi.post("getPicklist", {
        tenantId: tenantId,
        branCode: branchCode,
        prodCode: product,
        lineCode: line,
        pickDate: date.format("YYYY-MM-DD"),
        status: status,
      });

      const resData = response.data;
      if (
        resData != null &&
        Array.isArray(resData.pendingScanHdrList) &&
        resData.pendingScanHdrList.length > 0
      ) {
        setTableData(resData.pendingScanHdrList);
      } else {
        setTableData([]);
        toast.info("No data found for selected filters");
      }
    } catch (error) {
      toast.error("Error fetching picklist data");
      console.error(error);
    }
  };

  // Get columns based on selected status
  const getColumns = () => {
    if (!selectedStatus) return completedColumns;
    const statusLower = selectedStatus.toLowerCase();
    if (statusLower === "3") return completedColumns;
    if (statusLower === "2") return partiallyCompletedColumns;
    if (statusLower === "1") return pendingColumns;
    return completedColumns;
  };

  // Get table title based on status
  const getTableTitle = (status) => {
    if (!status) return "Completed Picklist";
    const statusLower = status.toLowerCase();
    if (statusLower === "3") return "Completed Picklist";
    if (statusLower === "2") return "Partially Completed Picklist";
    if (statusLower === "1") return "Pending Picklist";
    return "Completed Picklist";
  };

  // Handle form submission
  const onFinish = (values) => {
    setSelectedStatus(values.status);
    setIsFilterApplied(true);
    fetchPicklistData(values);
    const dynamicTitle = getTableTitle(values.status);
    setTableTitle(dynamicTitle);
  };

  // Handle cancel/reset
  const onCancel = () => {
    form.resetFields();
    setSelectedStatus("3");
    setTableTitle("Completed Picklist");
    setIsFilterApplied(false);
    setTableData([]);
    setSelectedLine(null);
    fetchDefaultCompletedTable();
  };

  // ✅ Navigate to separate verification screen
  const handlePicklistClick = async (picklistCode, plseCode, record) => {
    try {
      const response = await serverApi.post("getRetrievePickdetails", {
        tenantId: tenantId,
        branchCode: branchCode,
        plscode: picklistCode,
      });

      const res = response.data;
      if (res.responseCode === "200") {
        // Navigate to separate verification screen
        navigate("/picklist-verification", {
          state: {
            plksCode: plseCode,
            lineFeederDatas: res.responseData,
            pickListCodeVerrify: picklistCode,
            picklistInfo: {
              date: record.plsLogDate,
              line: record.lineCode,
              product: record.plsgFgProdCode,
              status: record.status,
            },
          },
        });
      } else {
        toast.error("No details found for this picklist");
      }
    } catch (error) {
      toast.error("Error fetching line feeder data");
      console.error(error);
    }
  };

  // Column definitions for Partially Completed
  const partiallyCompletedColumns = [
    { title: "S.No", key: "sno", render: (text, record, index) => index + 1 },
    {
      title: "Picklist Code",
      dataIndex: "plsCode",
      key: "plsCode",
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handlePicklistClick(record.plsId, record.plsCode, record)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    { title: "Product", dataIndex: "plsgFgProdCode", key: "plsgFgProdCode" },
    { title: "Line", dataIndex: "lineCode", key: "lineCode" },
    {
      title: "Created Date",
      dataIndex: "plsLogDate",
      key: "plsLogDate",
      render: (text) => {
        if (!text) return "-";
        return dayjs(text).format("DD-MMM-YYYY");
      },
    },
    { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Partially Issued Qty", dataIndex: "partialQty", key: "partialQty" },
  ];

  // Column definitions for Pending
  const pendingColumns = [
    { title: "S.No", key: "sno", render: (text, record, index) => index + 1 },
    {
      title: "Picklist Code",
      dataIndex: "plsCode",
      key: "plsCode",
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handlePicklistClick(record.plsId, record.plsCode, record)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    { title: "Product", dataIndex: "plsgFgProdCode", key: "plsgFgProdCode" },
    { title: "Line", dataIndex: "lineCode", key: "lineCode" },
    {
      title: "Created Date",
      dataIndex: "plsLogDate",
      key: "plsLogDate",
      render: (text) => {
        if (!text) return "-";
        return dayjs(text).format("DD-MMM-YYYY");
      },
    },
    { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  // Column definitions for Completed
  const completedColumns = [
    { title: "S.No", key: "sno", render: (text, record, index) => index + 1 },
    { title: "Picklist Code", dataIndex: "plsCode", key: "plsCode" },
    { title: "Product", dataIndex: "plsgFgProdCode", key: "plsgFgProdCode" },
    { title: "Line", dataIndex: "lineCode", key: "lineCode" },
    {
      title: "Created Date",
      dataIndex: "plsLogDate",
      key: "plsLogDate",
      render: (text) => {
        if (!text) return "-";
        return dayjs(text).format("DD-MMM-YYYY");
      },
    },
    { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  // Render picklist table utility
  const renderPicklist = (title, data, columns) => (
    <div className="picklist-container">
      <Card headStyle={{ backgroundColor: "#00264d", color: "white" }} title={title}>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
          bordered
          locale={{ emptyText: "No data available" }}
          rowKey={(record) => record.plsId || record.plsCode}
        />
      </Card>
    </div>
  );

  return (
    <>
      {/* Filter Card */}
      <Card
        title="PickList"
        headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
        style={{ marginBottom: "10px" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ date: dayjs() }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Date"
                name="date"
                rules={[{ required: true, message: "Please select Date" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  defaultValue={todays}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Line"
                name="line"
                rules={[{ required: true, message: "Please select line" }]}
              >
                <Select placeholder="Select a line" onChange={handleLineChange}>
                  {lineList.map((linelis) => (
                    <Option
                      key={linelis.lineMstCode}
                      value={linelis.lineMstCode || linelis.lineMstDesc}
                    >
                      {linelis.lineMstDesc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Product"
                name="product"
                rules={[{ required: true, message: "Please select Product" }]}
              >
                <Select
                  placeholder="Select a Product"
                  disabled={!selectedLine || productList.length === 0}
                >
                  {productList.map((productLis) => (
                    <Option key={productLis.productCode} value={productLis.productCode}>
                      {productLis.prodDesc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: "Please select Status" }]}
              >
                <Select placeholder="Select a Status">
                  {statusList.map((statuslis) => (
                    <Option
                      key={statuslis.statusId}
                      value={statuslis.statusId || statuslis.statusDesc}
                    >
                      {statuslis.statusDesc}
                    </Option>
                  ))}
                </Select>
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
                style={{ marginLeft: 8, backgroundColor: "#001F3E", color: "white" }}
                onClick={onCancel}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Show filtered or default table */}
      {isFilterApplied
        ? renderPicklist(tableTitle, tableData, getColumns())
        : renderPicklist("Completed Picklist", completedDatas, completedColumns)}
    </>
  );
};

export default Picklist;