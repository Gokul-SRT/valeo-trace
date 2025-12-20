import React, { useState, useEffect ,forwardRef, useImperativeHandle  } from "react";
import { Card, Form, Row, Col, Select, Input, Button, Table, DatePicker } from "antd";
import moment from "moment";
import { toast } from "react-toastify";
import serverApi from "../../../../serverAPI";
import { Label } from "recharts";
import { backendService } from "../../../../service/ToolServerApi";
import store from "store";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const PrintPage = forwardRef(({
  selectType,
  selectedPrintPart,
  qrData,
  setQrValue,
  showPrintDetails,
  setShowPrintDetails,
  setCurrentPage,
  handleQrBlur,
  printB2Columns,
  printB2Data,
  setPrintB2Data,
  handleViewQR,
  handlePrintAll,
  pickListCode,
  childPartCode,
  pickListQty,
  inputRef,
  resetQrField,
}, ref) => {

  const [addQty, setAddQty] = useState(0);
  const [binCount, setBinCount] = useState(0);
  const [picklistOptions, setPicklistOptions] = useState([]); // ✅ store API response here
  const [selectedPicklist, setSelectedPicklist] = useState(null); // ✅ selected picklist code
  const [childPartOptions, setChildPartOptions] = useState([]); // ✅ store child part options
  const [selectedChildPart, setSelectedChildPart] = useState(null);
  const [standPickQty, setStandPickQty] = useState([]);
  const [planQty, setPlanQty] = useState("");
  const binQty = 200; // fixed bin quantity
  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const empId = store.get("employeeId")
  const [noOfLabels, setNoOfLabels] = useState(0);
  const [printform] = Form.useForm()

  const navigate = useNavigate();

const handleAddQtyChange = (e) => {
 // if (selectType === "B2") return; // Ignore for B2
  const formValues = printform.getFieldsValue()
  const value = Number(e.target.value);
  const binQty = Number(printform.getFieldValue("binQty") || 0);
  const remainingQty = Number(printform.getFieldValue("remainingQty") || 0);

  if (value <= formValues.planQty) {
    printform.setFieldsValue({ addQty: value });
    setNoOfLabels(Math.floor(value / binQty));
  } else {
    printform.resetFields(["addQty"]);
    toast.warning(`Label Quantity cannot exceed ${formValues.planQty}`);
  }
};

useEffect(() => {
  if (resetQrField) {
    printform.resetFields(["qrCode"]); // reset only scan field
    inputRef.current?.focus();       // focus again
  }
}, [resetQrField]);

  const handlePicklistCodetoChildParts = (picklistCode) => {
    setSelectedPicklist(picklistCode)
    fetchPlscodetoChildPartDetails(picklistCode);
  }

useEffect(() => {
  if (qrData) {
    printform.setFieldsValue({
      custName: qrData.customerSno,
      supCode: qrData.supplierCode,
      packageNo: qrData.packageNo,
      deliveryDate: qrData.deliveryDate ? moment(qrData.deliveryDate, "YYYY-MM-DD") : null,
      manufacturingDate: qrData.manufactureDate ? moment(qrData.manufactureDate, "YYYY-MM-DD") : null,
      scanQty: qrData.quantity,
    });
/*
    if (selectType === "B2") {
      const scanQty = Number(qrData.quantity);
      const binQty = Number(printform.getFieldValue("binQty") || 0);
      const planQty = Number(printform.getFieldValue("planQty") || 0);

      // Ensure we do not exceed planQty
      const effectiveQty = Math.min(scanQty, planQty);
      if (binQty > 0) {   
        setNoOfLabels(Math.floor(effectiveQty / binQty));
        printform.setFieldsValue({ addQty: effectiveQty }); // optional
      }
    }
    */
  }

  fetchPicklistPLSDetails();
}, [qrData, selectType]);


useEffect(() => {
  if (pickListCode) {
    setSelectedPicklist(pickListCode);
    printform.setFieldsValue({ pickListCode });

    // Load child part list
    handlePicklistCodetoChildParts(pickListCode);
  }
}, [pickListCode]);

useEffect(() => {
  if (childPartOptions.length > 0 && childPartCode) {

    console.log("chiiiii",childPartCode)

    // 1. Find the record
    const selected = childPartOptions.find(
      item => item.childPartCode === childPartCode
    );

    if (selected) {
      // 2. Set dropdown
      setSelectedChildPart(selected.childPartDesc);

      // 3. Set form field
      printform.setFieldsValue({
        childPart: selected.childPartDesc,
        planQty: selected.planQty,
      });

      // 4. Fetch pickedQty / standardQty
      fetchPickedAndStandardQty(childPartCode);
    }
  }
}, [childPartOptions]);


useEffect(() => {
  if (pickListQty) {
    printform.setFieldsValue({ planQty: pickListQty });
  }
}, [pickListQty]);

useEffect(() => {
  const formValues=printform.getFieldsValue();
  const part = childPartOptions.find(item => item.childPartDesc === formValues.childPart) || {};
  const intervalId = setInterval(() => {
    getA2AndB2DetailsAgianstPlsCodeAndChildPartCode(formValues.pickListCode,part.childPartCode);
  }, 2000); // every 5 seconds

  // Cleanup when component unmounts
  return () => clearInterval(intervalId);
},);



const handleBack = () => {
 
  printform.resetFields();

  // navigate("/picklist");
  navigate(-1);
};

const getA2AndB2DetailsAgianstPlsCodeAndChildPartCode = async (pickListCode,childPartCode) => {
  setShowPrintDetails(true);
  try {
    const response = await serverApi.post("getA2AndB2DetailsAgianstPlsCodeAndChildPartCode", {
      tenantId,
      branchCode,
      pickListCode: pickListCode,
      childPartCode: childPartCode
    });

    const res = response.data;
  //  console.log(response.data, "list")
  //  console.log(response.responseData, "list1")
    if (res.responseCode === '200') {
      if (res.responseData !== null && res.responseData.length > 0) {
        const updatedData = res.responseData.map((item, index) => ({
          ...item,
          sno: index + 1,
        }));
      //  console.log(updatedData, "updatedData--------")
       setPrintB2Data(updatedData)
      }
    } else {
      setPrintB2Data([])
    }
  } catch (error) {
    setShowPrintDetails(false)
    toast.error("Error fetching Data. Please try again later.");
  }
}

  const handleSubmitData = async (empty) => {
    const formValues = printform.getFieldsValue()
    const part = childPartOptions.find(item => item.childPartDesc === formValues.childPart) || {};
    
    // Validate required fields
    if (!formValues.pickListCode || !formValues.childPart) {
      console.log("Missing required fields for handleSubmitData");
      return;
    }
    const labelQty = formValues.addQty;

  // Validation 1: Empty check
  if (!labelQty || String(labelQty).trim() === "") {
    toast.warning("Label Qty cannot be empty!");
    printform.resetFields(["addQty"]);
   // setShowPrintDetails(false)
    return;
  }

  // Validation 2: Convert and check value
  const qty = Number(labelQty);
       const bin=formValues.binQty;
       const binQuantity=Number(bin);

  if (isNaN(qty)) {
    toast.warning("Please enter a valid number!");
    printform.resetFields(["addQty"]);
    //setShowPrintDetails(false)
    return;
  }

  if (qty === 0) {
    toast.warning("Label Qty cannot be zero!");
    printform.resetFields(["addQty"]);
   // setShowPrintDetails(false)
    return;
  }

  if (qty < 0) {
    toast.warning("Label Qty cannot be negative!");
    printform.resetFields(["addQty"]);
   // setShowPrintDetails(false)
    return;
  }

  // Validation 4: Multiple of binQty check
if (qty % binQuantity !== 0) {
  toast.warning(`Label Qty must be a multiple of Bin Qty (${binQuantity})`);
  printform.resetFields(["addQty"]);
 // setShowPrintDetails(false)
  return;
}

    try {
      const response = await backendService({
        requestPath: 'insertAndUpdatePrintPage',
        requestData: {
          picklistCode: formValues.pickListCode,
          childPartCode: part.childPartCode,
          planQuantity: formValues.planQty,
          scanQrCode: formValues.qrCode,
          itemType:selectType,
          customerSno: formValues.custName,
          supplierCode: formValues.supCode,
          packageNo: formValues.packageNo,
          deliveryDate: formValues.deliveryDate.format("YYYY-MM-DD"),
          manufacturingDate: formValues.manufacturingDate.format("YYYY-MM-DD"),
          scannedQuantity: formValues.scanQty,
        //  inputQuantity: empty === "empty" ? "" : selectType === "A2" 
        inputQuantity: empty === "empty" ? "" : (selectType === "A2" || selectType === "B2") 
  ? Number(formValues.addQty || 0)
  : Number(formValues.scanQty || 0),
          binQuantity: formValues.binQty,
          BinCountQuantity: selectType === "A2"
                    ? formValues.binQty
                    : formValues.binQty, // same for B2
          binCount: noOfLabels,
          tenantId,
          branchCode,
          createdBy: empId,
          pickedQty: Number(printform.getFieldValue("pickedQty") || 0)
        }
      })
      if (response) {
        if (response.responseCode === '200') {
          if (response.responseData !== null && response.responseData.length > 0) {
            
            const updatedData = response.responseData.map((item, index) => ({
              ...item,
              sno: index + 1,
            }));
          //  console.log(updatedData, "updatedData--------")
          //  setPrintB2Data(updatedData)
      

            fetchPickedAndStandardQty(part.childPartCode)
            toast.success(response.responseMessage)
          }
        }else{
          toast.error(response.responseMessage)
          setShowPrintDetails(false)
          setPrintB2Data([])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPickedAndStandardQty = async (childCode) => {
    try {
      const response = await serverApi.post("getPLSCodePickedQuantity", {
        tenantId,
        branchCode,
        plsCode: printform.getFieldValue("pickListCode"),
        itemType: selectType,
        childPartCode: childCode
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        console.log("Fetched PickedQty Details:", res.responseData);
        setStandPickQty(res.responseData);
        const firstItem = res.responseData[0] || {};
        printform.setFieldsValue({
          binQty: firstItem.standardQuantity || "",
          pickedQty: firstItem.pickedQuantity || "",
          remainingQty: firstItem.remainingQuantity || ""
        });
      } else {
        setStandPickQty([]);
        printform.setFieldsValue({
          binQty: "0",
          pickedQty: "0"
        });
      }
    } catch (error) {
      toast.error("Error fetching picked quantity. Please try again later.");
    }
  }
  const fetchPicklistPLSDetails = async () => {
    try {
      const response = await serverApi.post("getPicklistWO", {
        tenantId,
        branchCode,
        planDate: "",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        console.log("Fetched PLS Details:", res.responseData);
        setPicklistOptions(res.responseData);
      } else {
        setPicklistOptions([]);
      }
    } catch (error) {
      toast.error("Error fetching picklist codes. Please try again later.");
    }
  };


  const fetchPlscodetoChildPartDetails = async (plsCode) => {
    try {
      const response = await serverApi.post("getPicklistCodetoChildPartCode", {
        tenantId,
        branchCode,
        plsCode: plsCode,
        itemType: selectType,
        childPartCode: ""
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        console.log("Fetched Product Details:", res.responseData);
        setChildPartOptions(res.responseData);
      } else {
        setChildPartOptions([]);
      }
    } catch (error) {
      toast.error("Error fetching picklist codes. Please try again later.");
    }
  };

  const handleChildPartCode = (val) => {
    const part = childPartOptions.find(item => item.childPartDesc === val) || {};
    setSelectedChildPart(val);
    printform.setFieldsValue({
      planQty: part.planQty || ""
    });
    fetchPickedAndStandardQty(part.childPartCode)
  }

  const handleCancel = () => {
    printform.resetFields();
    setNoOfLabels(0)
  }

   // Expose handleSubmitData to parent
  // useImperativeHandle(ref, () => ({
  //   handleSubmitData,
  //   fetchPickedAndStandardQty
  // }));

  return (
    <>
      <Card
        headStyle={{ backgroundColor: "#00264d", color: "white" }}
        title={`Print Page - ${selectType}`}
        style={{ marginTop: "20px" }}
      >
        <Form form={printform} layout="vertical">
          <Row gutter={16}>
            {/* ✅ Dynamic Picklist Select Box */}
            <Col span={4}>
              <Form.Item name="pickListCode" label="PickList Code">
                <Select
                  placeholder="Select PickList Code"
                  value={selectedPicklist}
                  onChange={(value) => handlePicklistCodetoChildParts(value)}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {picklistOptions.map((item, index) => (
                    <Option key={index} value={item.plsCode}>
                      {item.plsCode}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item name="childPart" label="Child Part">
                <Select
                  placeholder="Select Child Part"
                  value={selectedChildPart}
                  onChange={(value) => handleChildPartCode(value)}
                  allowClear
                  showSearch
                >
                  {childPartOptions.map((item, index) => (
                    <Option key={item.childPartCode} value={item.childPartDesc}>
                      {item.childPartDesc}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item name="planQty" label="Plan Quantity">
                <Input type="number" placeholder="Enter Quantity" value={planQty} readOnly disabled />
              </Form.Item>
            </Col>

            {/* <Col span={4}>
              <Form.Item name="qrCode" label="Scan QR">
                <Input type="text" placeholder="Scan QR" onBlur={handleQrBlur} />
              </Form.Item>
            </Col> */}

             <Col span={4}>
              <Form.Item name="qrCode" label="Scan QR">
                <Input type="text" placeholder="Scan QR" ref={inputRef} onKeyDown={handleQrBlur}
                 autoFocus />
              </Form.Item>
            </Col>

            {qrData && (
              <>
                <Col span={4}>
                  <Form.Item name="custName" label="Customer SNo">
                    <Input readOnly disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="supCode" label="Supplier Code">
                    <Input readOnly disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="packageNo" label="Package No">
                    <Input readOnly disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="deliveryDate" label="Delivery Date">
                    <DatePicker format="YYYY-MM-DD" disabled style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="manufacturingDate" label="Manufacturing Date">
                    <DatePicker format="YYYY-MM-DD" disabled style={{ width: "100%" }} />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="scanQty" label="Scanned Quantity">
                    <Input type="number" placeholder="Enter Quantity" disabled />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="addQty" label="Supply Quantity">
                    <Input
                      type="number"
                      placeholder="Enter Supply Quantity"
                    //  disabled={selectType === "B2"}   // <-- disable
                      onChange={handleAddQtyChange}
                    />
                  </Form.Item>
                </Col>

                <Col span={4}>
                  <Form.Item name="binQty" label="Bin Quantity">
                    <Input type="number" placeholder="Bin Quantity" readOnly disabled />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
          {qrData && (
            <div style={{ marginTop: 16, fontWeight: 500 }}>
              No. of Labels: {noOfLabels}
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <Button
              type="primary"
              style={{ marginRight: "5px" }}
              onClick={() => { setShowPrintDetails(true); handleSubmitData() }}
            >
              Submit
            </Button>
            <Button type="primary" onClick={() => { setShowPrintDetails(false); handleCancel() }}>
              Cancel
            </Button>
          </div>
        </Form>

        {/* <div style={{ textAlign: "center", marginTop: "15px" }}>
          <Button onClick={() => setCurrentPage("main")}>Back</Button>
        </div> */}
        {  pickListCode && childPartCode && pickListQty && (
        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <Button onClick={() => handleBack()}>Back</Button>
        </div>
         )}
      </Card>

      {showPrintDetails && (
        <Card
          headStyle={{ backgroundColor: "#00264d", color: "white" }}
          title={`Print Page - ${selectType}`}
          style={{ marginTop: "20px" }}
        >
       {printB2Data.length !== 0 &&(
          <div style={{ textAlign: "right" }}>
          <Button type="primary" onClick={handlePrintAll}>Print All</Button>
        </div>
         )}
          <Table
            columns={printB2Columns}
            dataSource={printB2Data}
            bordered
            pagination={{ pageSize: 5 }}
          />
        </Card>
      )}
    </>
  );
});

export default PrintPage;
