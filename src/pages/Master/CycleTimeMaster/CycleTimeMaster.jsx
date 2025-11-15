import React, { useEffect, useState } from "react";
import { Table, Button, message, Typography, Card, Space,Input } from "antd";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../serverAPI";
import * as XLSX from "xlsx";

const { Title } = Typography;

const CycleTimeMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");

  useEffect(() => {
    setSelectedModule(modulesprop);
    setSelectedScreen(screensprop);
  }, [modulesprop, screensprop]);

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      fetchData();
    }
  }, [selectedModule, selectedScreen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await serverApi.post("getCycleTimeMasterDetails", {
        type: "cycletimemaster",
        tenantId,
        branchCode,
      });

      if (response?.data?.responseCode === "200") {
        setMasterList(response.data.responseData || []);
      } else {
        setMasterList([]);
        toast.error(response?.data?.responseMessage || "No data found");
      }
    } catch (error) {
      toast.error("Error fetching data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  //search
  const filteredData = masterList.filter((item) =>
    Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  //filter
  const getUniqueValues = (data, key) => {
    return [...new Set(data.map((item) => item[key]))].map((value) => ({
      text: value,
      value: value,
    }));
  };
  

//   const columns = [
//     { title: "Product Code", dataIndex: "productCode", sorter: true },
//     { title: "Product Description", dataIndex: "productDesc", sorter: true },
//     { title: "Operation Code", dataIndex: "opCode", sorter: true },
//     { title: "Operation Description", dataIndex: "opDesc", sorter: true },
//     { title: "Cycle Time", dataIndex: "cycleTime", sorter: true },
//   ];

const columns = [
    {
      title: "Product Code",
      dataIndex: "productCode",
      sorter: (a, b) => a.productCode.localeCompare(b.productCode),
      filters: getUniqueValues(masterList, "productCode"),
      onFilter: (value, record) => record.productCode === value,
    },
    {
      title: "Product Description",
      dataIndex: "productDesc",
      sorter: (a, b) => a.productDesc.localeCompare(b.productDesc),
      filters: getUniqueValues(masterList, "productDesc"),
      onFilter: (value, record) => record.productDesc === value,
    },
    {
      title: "Operation Code",
      dataIndex: "opCode",
      sorter: (a, b) => a.opCode.localeCompare(b.opCode),
      filters: getUniqueValues(masterList, "opCode"),
      onFilter: (value, record) => record.opCode === value,
    },
    {
      title: "Operation Description",
      dataIndex: "opDesc",
      sorter: (a, b) => a.opDesc.localeCompare(b.opDesc),
      filters: getUniqueValues(masterList, "opDesc"),
      onFilter: (value, record) => record.opDesc === value,
    },
    {
      title: "Cycle Time",
      dataIndex: "cycleTime",
      sorter: (a, b) => a.cycleTime - b.cycleTime,
      filters: getUniqueValues(masterList, "cycleTime"),
      onFilter: (value, record) => record.cycleTime === value,
    },
  ];
  
  const exportToExcel = () => {
    // Map data to use custom headers
    const exportData = masterList.map((item) => ({
      "Product Code": item.productCode,
      "Product Description": item.productDesc,
      "Operation Code": item.opCode,
      "Operation Description": item.opDesc,
      "Cycle Time": item.cycleTime,
    }));
  
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CycleTimeMaster");
    XLSX.writeFile(wb, "CycleTimeMaster.xlsx");
  };

  return (
    // <div className="container mt-3 p-2">
    <>
      {/* <Card
        bordered={false}
        style={{ borderRadius: 8, backgroundColor: "#00264d" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <Title level={5} style={{ color: "#fff", margin: 0 }}>
            {selectedScreen} Details
          </Title>

          <Button
            type="default"
            onClick={exportToExcel}
            style={{
              backgroundColor: "#fff",
              color: "#00264d",
              fontWeight: "bold",
            }}
          >
            Export Excel
          </Button>
        </div>
      </Card> */}

      {/* <Card className="mt-2 shadow-sm" style={{ borderRadius: 8 }}>
        <Table
          dataSource={masterList}
          columns={columns}
          loading={loading}
          rowKey={(record, index) => index}
          pagination={{ pageSize: 10 }}
        />
      </Card> */}

<Button
  type="default"
  onClick={exportToExcel}
  style={{
    backgroundColor: "#28a745", // ✅ Bootstrap success green
    color: "#fff",              // ✅ White text
    fontWeight: "bold",
    border: "2px solid #28a745",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "#218838"; // darker green hover
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "#28a745";
  }}
>
  Export Excel
</Button>
      {/* <div className="picklist-container"> */}
      <div
  style={{
    background: "#fff",
    borderRadius: "6px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    marginBottom: "20px",
  }}
>
  
      
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title= {selectedScreen}  style={{ width: "100%" }}
      >
         <Input
        placeholder="Search..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, width: 300 }}
      />
        <Table
          columns={columns}
          size="small"
          scroll={{
            y: 500,
          }}
          loading={loading}
          dataSource={filteredData }
          pagination={{ pageSize: 10, 
            showTotal: (total, range) =>
            `Showing ${range[0]} to ${range[1]} of ${total} entries`,
        }}
          bordered
          locale={{ emptyText: "No data available in table" }}
          style={{ width: "100%" }}
        />
      </Card>
    </div>

   
    {/* </div> */}
    </>
  );
};

export default CycleTimeMaster;
