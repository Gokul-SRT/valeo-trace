import React, { useState,useEffect } from "react";
import { Table, Button, Modal, Card, Select, Input, Form, Row, Col, Progress, Space,DatePicker } from "antd";
import { PlusCircleOutlined, PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import { FaQrcode } from "react-icons/fa";
import QRCode from "antd/lib/qr-code";
import html2canvas from "html2canvas";
import "./style.css";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../../serverAPI";



const { Option } = Select;

const Picklist = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const todays = dayjs(); // Default to current date

  const [productList, setProductList] = useState([]);
  const [lineList,setLineList]= useState([]);
  const[statusList,setStatusList]= useState([]);

  const [tableData, setTableData] = useState([]);
  const [completedDatas, setCompletedDatas] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("completed");
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [lineFeederDatas, setLineFeederDatas] = useState([]);
// 🟢 State for title
const [tableTitle, setTableTitle] = useState("Completed Picklist");

const [pickListCodeVerrify, setPickListCodeVerrify] = useState("");
const [scanValue, setScanValue] = useState("");
const [finalSubmitAndPartialSubmitDatas,setFinalSubmitAndPartialSubmitDatas] = useState([]);


  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = store.get("employeeId")


  


  useEffect(() => {
    setShowLineFeeder(false);
    fetchProductDetails();
    fetchLineDetails();
    fetchStatusDetails();
    fetchDefaultCompletedTable();
    setScanValue(""); // reset input
  }, []);

  const fetchProductDetails = async () => {
    try {
      const response = await serverApi.post("getProductDropdown", {
        tenantId,
        branchCode,
        isActive: "1",
      });
  
      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setProductList(res.responseData);
      } else {
        setProductList([]);
      }
    } catch (error) {
     
      toast.error("Error fetching productCode. Please try again later.");
    }
  };


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
    }
  };
  

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

      const completedStatus=res.responseData.find((item)=>item.statusDesc?.toLowerCase()==="completed");
       if(completedStatus){
         form.setFieldsValue({status:completedStatus.statusDesc})
         setSelectedStatus(completedStatus.statusDesc);
       }

      } else {
        setStatusList([]);
      }
    } catch (error) {
     
      toast.error("Error fetching ststusCode. Please try again later.");
    }
  };



  const fetchDefaultCompletedTable = async () => {
    try {
      const response = await serverApi.post("getCompletedPicklist", {
        tenantId:tenantId,
        branCode:branchCode,
        prodCode: "",
        lineCode: "",
        pickDate: dayjs().format("YYYY-MM-DD"),
        status: "3",
      });
     // const res = response.data;
      // if (res.responseCode === "200" && Array.isArray(res.responseData)) {
      //   setCompletedDatas(res.responseData);
      // }
      const resData = response.data;
      if (resData != null && Array.isArray(resData.completedScanHdrList) && resData.completedScanHdrList.length > 0) {
        setCompletedDatas(resData.completedScanHdrList);
      }else {
        setCompletedDatas([]); // fallback to empty array
      }
    } catch (error) {
      toast.error("Error fetching default Completed table");
      console.error(error);
    }
  };

  const fetchPicklistData = async ({ product, line, date, status }) => {
    try {
      const response = await serverApi.post("getPicklist", {
        tenantId:tenantId,
        branCode:branchCode,
        prodCode:product,
        lineCode:line,
        pickDate: date.format("YYYY-MM-DD"),
        status:status,
      });
    //  const res = response.data;
      /*if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setTableData(res.responseData);
      } else {
        setTableData([]);
      }*/
      const resData = response.data;
      if (resData != null && Array.isArray(resData.pendingScanHdrList) && resData.pendingScanHdrList.length > 0) {
        setTableData(resData.pendingScanHdrList);
      }else {
        setTableData([]); // fallback to empty array
      }
    } catch (error) {
      toast.error("Error fetching picklist data");
      console.error(error);
    }
  };

  // const getColumns = () => {
  //   if (selectedStatus.toLowerCase() === "completed") return completedColumns;
  //   if (selectedStatus === "Partially Completed") return partiallyCompletedColumns;
  //   return pendingColumns;
  // };


  const getColumns = () => {
    if (!selectedStatus) return completedColumns; // default
    const statusLower = selectedStatus.toLowerCase();
    if (statusLower === "3") return completedColumns;
    if (statusLower === "2") return partiallyCompletedColumns;
    if (statusLower === "1") return pendingColumns;
    return completedColumns; // fallback
  };
  
  // Function to get table title based on status
  const getTableTitle = (status) => {
    console.log("getTableTitle",status)
    if (!status) return "Completed Picklist"; // default
    const statusLower = status.toLowerCase();
    if (statusLower === "3") return "Completed Picklist";
    if (statusLower === "2") return "Partially Completed Picklist";
    if (statusLower === "1") return "Pending Picklist";
    return "Completed Picklist"; // fallback
  };



// Single API call on Submit
const onFinish = (values) => {
  setSelectedStatus(values.status);
  setShowLineFeeder(false);
  setIsFilterApplied(true);
  fetchPicklistData(values);
  const dynamicTitle = getTableTitle(values.status);
    setTableTitle(dynamicTitle);
};


// ✅ Optional cancel function
const onCancel = () => {
  form.resetFields(); // resets form fields
  setSelectedStatus("3");
    setTableTitle("Completed Picklist");
    setShowLineFeeder(false);
    setIsFilterApplied(false);
    setTableData([]);
    fetchDefaultCompletedTable();
    setPickListCodeVerrify();
};



const handlePicklistClick = async (picklistCode) => {
  setPickListCodeVerrify(picklistCode);
  try {
    const response = await serverApi.post("getRetrievePickdetails", {
      tenantId:tenantId,
      branchCode:branchCode,
      plscode:picklistCode,
    });

    const res = response.data;
    console .log("responseCode",response);
    console .log("responseCode",res);
    console.log("responseData",res);
    if (res.responseCode === "200") {
      setLineFeederDatas(res.responseData);
      setShowLineFeeder(true); // show the Line Feeder table
      console .log("showLineFeeder",showLineFeeder);
      setCurrentPage("main");   // if you need to track current page
      setScanValue("");
    } else {
      setLineFeederDatas([]);
      setShowLineFeeder(false);
      setScanValue("");
    }
  } catch (error) {
    toast.error("Error fetching line feeder data", error);
    setLineFeederDatas([]);
    setShowLineFeeder(false);
    setScanValue("");
  }
};



const partiallyCompletedColumns = [
  { title: "S.No", key: "sno",render:(text,reord,index)=>index+1},
  { title: "Picklist Code", dataIndex: "plsCode", key: "plsCode", 
     render: (text, record) => (
    // <Button
    //   type="link"
    //   onClick={() => {
    //     setShowLineFeeder(true);
    //     setCurrentPage("main");
    //   }}
    //   style={{ padding: 0 }}
    // >
    //   {text}
    // </Button>

    <Button
    type="link"
    onClick={() => handlePicklistClick(record.plsId)}
    style={{ padding: 0 }}
  >
    {text}
  </Button>

  ), },
  { title: "Product", dataIndex: "plsgFgProdCode", key: "plsgFgProdCode" },
  { title: "Line", dataIndex: "lineCode", key: "lineCode" },
  { title: "Created Date", dataIndex: "plsLogDate", key: "plsLogDate" },
  { title: "Shift", dataIndex: "shift", key: "shift" },
  { title: "Status", dataIndex: "status", key: "status" },
  { title: "Partially Issued Qty", dataIndex: "partialQty", key: "partialQty" },
  //{ title: "Issue Status", dataIndex: "issueStatus", key: "issueStatus" },
];


 // Handle scanning
 const handleScan = async () => {
  const scannedValue = scanValue.trim();
  console.log("scannedValue",scannedValue)
 if (!scannedValue) return;

  // Extract values using regex for your barcode format
 /* const match = scannedValue.match(/(\d{18})(\d{6})\s+(\d+)/);
  
  if (!match) {
    toast.error("Invalid barcode format");
    setScanValue("");
    return;
  }


  const childPartC = match[2]; // 157042
  const picketQt = Number(match[3]); // 400
  */


   // Regex: ignore anything before the 18-digit prefix
   const match = scannedValue.match(/\d{18}([A-Z0-9]+)\s+(\d+)/i);

   if (!match) {
     toast.error("Invalid barcode format");
     setScanValue("");
     return;
   }
 
   const childPartC = match[1];  // e.g., 157042 or CF72760
   const picketQt = Number(match[2]); // e.g., 400
 
   if (isNaN(picketQt)) {
     toast.error("Invalid picked quantity");
     setScanValue("");
     return;
   }
 
   console.log("childPartCode:", childPartC);
   console.log("pickedQty:", picketQt);
  
  try {
    // API call
    const response = await serverApi.post("updatePickedQtywithChildPartCode", {
      tenantId:tenantId,
      branchCode:branchCode,
      childPartCode:childPartC,
      pickedQty:picketQt,
      plsId:pickListCodeVerrify,
    });

    if (response.data==="success") {
      // Update table
      const updatedData = lineFeederDatas.map((r) =>
        r.childPartCode === childPartC ? { ...r, pickedQty: Number(r.pickedQty) + Number(picketQt) } : r
      );
      setLineFeederDatas(updatedData);
      setFinalSubmitAndPartialSubmitDatas(updatedData);
      toast.success("Scan processed successfully!");
    } else {
      toast.error(response.data);
    }
  } catch (err) {
    toast.error("Error while processing scan");
  }

  setScanValue(""); // reset input
};



const submitCompleted=async (isCompleted)=>{
const finalSubmit=lineFeederDatas;

  if (!finalSubmit || finalSubmit.length === 0) {
    toast.error("No data to submit!");
    return;
  }
try {
  // API call
const finalSubmitDatas=finalSubmit.map((item)=>({
  childPartCode:item.childPartCode,
  picklistQty:item.picklistQty,
  pickedQty:item.pickedQty,
  plsId:item.plsId,
  plsdId:item.plsdId,
  isCompleted:isCompleted,

}))

  const response = await serverApi.post("updateIssuedByChildPartCodeWithPlsId", finalSubmitDatas);

  if (response.data==="submitcompleted") {
    toast.success("Submit completed successfully!");
    setShowLineFeeder(false);
    setIsFilterApplied(false);
  } else if(response.data==="partiallycompleted"){
    toast.success("Partially completed successfully!");
    setShowLineFeeder(false);
     setIsFilterApplied(false);
  }else {
    toast.error(response.data);
  }
} catch (err) {
  toast.error("Error while processing");
}

}


  
  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLineFeeder, setShowLineFeeder] = useState(false);
  const [currentPage, setCurrentPage] = useState("main"); // main | printPage
  const [selectedPrintPart, setSelectedPrintPart] = useState(null);
  const [selectType, setSelectedType] = useState(null);
  const [showPrintDetails, setShowPrintDetails] = useState(false);


  // QR modal states
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState("");

  // QR Handlers
  const handleViewQR = (qrData) => {
    setSelectedQrData(qrData);
    setQrModalVisible(true);

    setTimeout(() => {
      handleDownloadQR();
    }, 500); // 0.5s delay to ensure QR is rendered
  };

  const handleDownloadQR = () => {
    const qrElement = document.getElementById("qr-code-container");
    html2canvas(qrElement).then((canvas) => {
      const imageURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageURL;
      link.download = `QRCode-${Date.now()}.png`;
      link.click();
    });
  };
  
  // Line Feeder Details Table
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-").toLowerCase();
 

  const lineFeederColumns = [
    { title: "S.No", key: "sno",render:(text,record,index)=>index+1 },

    { title: "Child Part Code", dataIndex: "childPartCode", key: "childPartCode" },
    { title: "Child Part Description", dataIndex: "childPartDesc", key: "childPartDesc" },
    { title: "Picklist Qty", dataIndex: "picklistQty", key: "picklistQty" },
    { title: "Picked Qty", dataIndex: "pickedQty", key: "pickedQty" },
    

  /*{
      title: "Status",
      dataIndex: "pickedQty",
      key: "pickedQty",
      render: (value, record) => {
       
        if (value === 0 || value === null || value === undefined) {
          return <FaQrcode size={18} color="#002147" />;
        } else {
          const percent=(value / record.picklistQty) * 100; 
          return (
            <Progress
              percent={percent}
              percentPosition={{ align: "start", type: "inner" }}
              size={[100, 20]}
              strokeColor="#B7EB8F"
            />
          );
        }
      },
    },*/

    {
      title: "Status",
      dataIndex: "pickedQty",
      key: "pickedQty",
      render: (value, record) => {
    
        const picked = Number(value); // ✅ convert to number
        const total = Number(record.picklistQty);
    
        if (!picked || picked === 0) { 
          return <FaQrcode size={18} color="#002147" />;
        }
    
        const percent = (picked / total) * 100;
    
        return (
          <Progress
            percent={percent}
            percentPosition={{ align: "start", type: "inner" }}
            size={[100, 20]}
            strokeColor="#B7EB8F"
          />
        );
      },
    },
    
  
    {
      title: "Action",
      dataIndex: "itemType",
      key: "itemType",
      render: (_, record) =>
        record.itemType === "A2" || record.itemType === "B2" || record.itemType === "A1"? (
          <Button
            type="link"
            icon={<PrinterOutlined />}
            onClick={() => {
              setSelectedType(record.itemType);
              setSelectedPrintPart(record.childPartCode);
              setCurrentPage("printPage");
              setShowPrintDetails(false);
            }}
          >
            Print
          </Button>
        ) : record.itemType === "C" ? (
          <Button
            type="link"
            icon={<PrinterOutlined />}
            onClick={() => {
              setSelectedType(record.itemType);
              navigate("/Kittingprocessscreen");

            }}
          >
            Print
          </Button>
        ) : null,
    }

  ];

  // Columns for Pending Picklist
  const pendingColumns = [
    { title: "S.No", key: "sno",render:(text,reord,index)=>index+1},
    {
      title: "Picklist Code",
      dataIndex: "plsCode",
      key: "plsCode",
      render: (text, record) => (
        // <Button
        //   type="link"
        //   onClick={() => {
        //     setShowLineFeeder(true);
        //     setCurrentPage("main");
        //   }}
        //   style={{ padding: 0 }}
        // >
        //   {text}
        // </Button>

        <Button
        type="link"
        onClick={() => handlePicklistClick(record.plsId)}
        style={{ padding: 0 }}
      >
        {text}
      </Button>

      ),
    },
    { title: "Product", dataIndex: "plsgFgProdCode", key: "plsgFgProdCode" },
    { title: "Line", dataIndex: "lineCode", key: "lineCode" },
    { title: "Created Date", dataIndex: "plsLogDate", key: "plsLogDate" },
    { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Status", dataIndex: "status", key: "status" },
   // { title: "Issue Status", dataIndex: "issueStatus", key: "issueStatus" },
  ];

  const completedColumns = [
    //{ title: "S.No", dataIndex: "sno", key: "sno" },
    {
      title: "S.No",
      key: "sno",
      render: (text, record, index) => index + 1, // 👈 Auto increments
    },
    { title: "Picklist Code", dataIndex: "plsCode", key: "plsCode" },
    { title: "Product", dataIndex: "plsgFgProdCode", key: "plsgFgProdCode" },
    { title: "Line", dataIndex: "lineCode", key: "lineCode" },
    { title: "Created Date", dataIndex: "plsLogDate", key: "plsLogDate" },
    { title: "Shift", dataIndex: "shift", key: "shift" },
    { title: "Status", dataIndex: "status", key: "status" },
    //{ title: "Issue Status", dataIndex: "issueStatus", key: "issueStatus" },
  ];

  // Print Page - B2 details sample table
  const printB2Data = [
    { key: 1, product: "Product A", line: "Line 1", workOrder: "WO-001", childPart: "Child Part X (CPX-001)", addQty: 50 },
    { key: 2, product: "Product B", line: "Line 2", workOrder: "WO-002", childPart: "Child Part Y (CPY-002)", addQty: 75 },
    { key: 3, product: "Product C", line: "Line 3", workOrder: "WO-003", childPart: "Child Part Z (CPZ-003)", addQty: 100 },
    { key: 4, product: "Product A", line: "Line 1", workOrder: "WO-001", childPart: "Child Part X (CPX-001)", addQty: 25 },
    { key: 5, product: "Product B", line: "Line 2", workOrder: "WO-002", childPart: "Child Part Y (CPY-002)", addQty: 60 },
  ];

  const printB2Columns = [
    { title: "Product", dataIndex: "product", key: "product" },
    { title: "Line", dataIndex: "line", key: "line" },
    { title: "Work Order", dataIndex: "workOrder", key: "workOrder" },
    { title: "Child Part", dataIndex: "childPart", key: "childPart" },
    { title: "Add Quantity", dataIndex: "addQty", key: "addQty" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          icon={<FaQrcode size={18} color="#002147" />}
          onClick={() => handleViewQR(record.childPart)}
        />
      ),
    },
  ];

  // Utility: render picklist card
  const renderPicklist = (title, data, columns, showAddButton = false) => (
    <div className="picklist-container">
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={title}
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 10 }}
          bordered
          locale={{ emptyText: "No data available in table" }}
        />
      </Card>
    </div>
  );

  

  return (
    <>
      {/* MAIN PAGE */}
      <Card
        title="Pick List"
        headStyle={{ backgroundColor: "#001F3E", color: "#fff" }}
        style={{marginBottom:"10px"}}
      >
         <Form
        form={form}
        layout="vertical"
        onFinish={onFinish} // ✅ Handles submit
        initialValues={{
          date: dayjs(), // ✅ default to today
        }}
      >
          <Row gutter={16}>
            <Col span={6}>
            <Form.Item label="Product" name="product" rules={[{ required: true }]}>
                <Select placeholder="Select a Product">
                {productList.map((productLis) => (
                <Option key={productLis.productCode} value={productLis.productCode}>
                  {productLis.productCode+"-"+productLis.productDesc}
                </Option>
              ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
            <Form.Item label="Line" name="line" rules={[{ required: true }]}>
                <Select placeholder="Select a line">
                 {lineList.map((linelis)=>(
                  <Option key={linelis.lineMstCode} value={linelis.lineMstCode || linelis.lineMstDesc} >
                    {linelis.lineMstDesc}
                  </Option>
                 ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
            <Form.Item label="Date" name="date" rules={[{ required: true }]}>
              <DatePicker
                style={{ width: "100%" }}
                defaultValue={todays}
                format="YYYY-MM-DD"
              />

              </Form.Item>
            </Col>
            <Col span={6}>
            <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select placeholder="Select a Status">
                {statusList.map((statuslis)=>(
                  <Option key={statuslis.statusId} value={statuslis.statusId || statuslis.statusDesc} >
                    {statuslis.statusDesc}
                  </Option>
                 ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'center' }}>
              <Button style={{ backgroundColor: "#001F3E", color: "white" }} htmlType="submit">
                Submit
              </Button>
              <Button style={{ marginLeft: 8 ,backgroundColor: "#001F3E", color: "white"}} onClick={onCancel}>
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
      {currentPage === "main" && (
        <>

          {/* {renderPicklist("Pending Picklist", pendingData, pendingColumns, true)} */}


           {/* Render table: Default Completed or Filtered */}
          {/* {isFilterApplied ? (
         renderPicklist(
          selectedStatus.toLowerCase() === "completed" ? "Completed Picklist" : "Pending Picklist",
          tableData,
          getColumns()
        )
      ) : (
        renderPicklist("Completed Picklist", completedDatas, completedColumns)
      )} */}


        {isFilterApplied ? (
         renderPicklist(
         // getTableTitle(), // table title based on selected status
         tableTitle,
         tableData,       // filtered data based on submit
         getColumns()     // columns based on selected status
        )
        ) : (
      renderPicklist(
        "Completed Picklist", 
        completedDatas, 
       completedColumns
     )
     )}


          {/* Show Line Feeder below Pending Picklist */}
          {showLineFeeder && (
            <Card headStyle={{ backgroundColor: "#00264d", color: "white" }} title="Picklist Verification">
               <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
      <label htmlFor="scan" style={{ minWidth: "30px" }}>Scan:</label>
      <Input
        id="scanInput"
        placeholder="Scan or paste barcode here"
        value={scanValue}
        onChange={(e) => setScanValue(e.target.value)}
        onBlur={handleScan} // Enter key triggers API
        style={{ marginBottom: "10px", width: "500px" }}
        autoFocus
      />
       </div>
              <Table
                columns={lineFeederColumns}
                dataSource={lineFeederDatas}
                bordered
                pagination={{ pageSize: 10 }}
                //rowKey="plsdId"
              />
              {/* <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                <Button type="primary" style={{ marginRight: "5px" }}>Allow to Partially Transfer</Button>
                <Button type="primary">Submit</Button>
              </div> */}

{(() => {
      // const hasZero = lineFeederDatas.some(item => !item.pickedQty || item.pickedQty === 0);
      // const allFull = lineFeederDatas.every(item => item.pickedQty >= item.picklistQty);
      // const someFilledNotFull = !hasZero && lineFeederDatas.some(item =>
      //   item.pickedQty > 0 && item.pickedQty < item.picklistQty
      // );

      const pickedNumbers = lineFeederDatas.map(item => Number(item.pickedQty || 0));
      const picklistNumbers = lineFeederDatas.map(item => Number(item.picklistQty || 0));
    
      const hasZero = pickedNumbers.some(qty => qty === 0);
      const allFull = pickedNumbers.every((qty, i) => qty >= picklistNumbers[i]);
      const someFilledNotFull = pickedNumbers.some((qty, i) =>
        qty > 0 && qty < picklistNumbers[i]
      );
    
      // ✅ Rule Implementation
      // Partial enabled ONLY if someFilledNotFull AND NO ZERO VALUES
      const disablePartial = !(someFilledNotFull && !hasZero);

      return (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
          
          {/* Allow Partial Transfer Button */}
          <Button
            type="primary"
            style={{ marginRight: "5px" }}
            onClick={()=>submitCompleted("2")}
            //disabled={!someFilledNotFull}
            disabled={disablePartial}
          >
            Allow to Partially Transfer
          </Button>

          {/* Submit Button */}
          <Button
            type="primary"
            onClick={()=>submitCompleted("3")}
            disabled={!allFull}
          >
            Submit
          </Button>

        </div>
      );
    })()}

              
            </Card>
          )}

          {/* Hide Completed Picklist when Line Feeder is open */}
          {/* {!showLineFeeder && (
            <div style={{ marginTop: "30px" }}>
              {renderPicklist("Completed Picklist", completedData, completedColumns)}
            </div>
          )} */}
        </>
      )}

      {/* PRINT PAGE */}
      {currentPage === "printPage" && (
        <>
          {/* Print Page - Form */}
          <Card
            headStyle={{ backgroundColor: "#00264d", color: "white" }}
            title={`Print Page - ${selectType}`}
            style={{ marginTop: "20px" }}
          >
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={4}>
                  <Form.Item label="Product">
                    <Select placeholder="Select Product">
                      <Option value="prod1">Product 1</Option>
                      <Option value="prod2">Product 2</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Line">
                    <Select placeholder="Select Line">
                      <Option value="line1">Line 1</Option>
                      <Option value="line2">Line 2</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Work Order">
                    <Select placeholder="Select Work Order">
                      <Option value="wo1">Work Order 1</Option>
                      <Option value="wo2">Work Order 2</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Child Part">
                    <Select value={selectedPrintPart}>
                      <Option value={selectedPrintPart}>{selectedPrintPart}</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item label="Add Quantity">
                    <Input type="number" placeholder="Enter Quantity" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: "center" }}>
                <Button
                  type="primary"
                  style={{ marginRight: "5px" }}
                  onClick={() => setShowPrintDetails(true)}
                >
                  Submit
                </Button>
                <Button
                  type="primary"
                  onClick={() => setShowPrintDetails(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>

            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <Button onClick={() => setCurrentPage("main")}>Back</Button>
            </div>
          </Card>

          {/* Print Page - B2 Details Table (only show after Submit) */}
          {showPrintDetails && (
            <Card
              headStyle={{ backgroundColor: "#00264d", color: "white" }}
              title={`Print Page - ${selectType}`}
              style={{ marginTop: "20px" }}
            >
              <Table
                columns={printB2Columns}
                dataSource={printB2Data}
                bordered
                pagination={{ pageSize: 5 }}
              />
            </Card>
          )}
        </>
      )}

      {/* QR Modal */}
      <Modal
        title="QR Code Details"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <div
            key="footer"
            style={{
              width: "100%",
              textAlign: "center", // centers buttons
            }}
          >
            <Button key="close" onClick={() => setQrModalVisible(false)}>
              Close
            </Button>
          </div>,
        ]}
        centered
        width={400}
      >
        <div
          id="qr-code-container"
          style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}
        >
          <QRCode value={selectedQrData} size={200} />
        </div>
      </Modal>
    </>
  );
};

export default Picklist;
