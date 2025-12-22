import React, { useState ,useEffect , useRef } from "react";
import PrintPage from "./PrintPage";
import QRModal from "./QRModal";
import { backendService } from "../../../../service/ToolServerApi";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { CheckCircleTwoTone } from "@ant-design/icons";
import store from "store";
import { useLocation } from "react-router-dom";
import {Button} from "antd";

const PickListPrintMain = () => {
  // Ref to call handleSubmitData from PrintPage
  const location = useLocation();
 // const { pickListCode, childPartCode, planQty } = location.state || {};

  const [pickListCode, setPickListCode] = useState(location.state?.pickListCode || "");
  const [childPartCode, setChildPartCode] = useState(location.state?.childPartCode || "");
  const [planQty, setPlanQty] = useState(location.state?.planQty || "");
  const [itemType, setItemType] = useState(location.state?.itemType || "");
 
  const printPageRef = useRef();
  const [selectType,setSelectType] = useState(itemType || "B2");
  const [selectedPrintPart, setSelectedPrintPart] = useState("");
  const [qrData, setQrData] = useState(null);
  const [printB2Data, setPrintB2Data] = useState([]);
  const [showPrintDetails, setShowPrintDetails] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [isOverAllPrinting, setIsOverAllPrinting] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState("");

  const [labelCode,SetLabelCode]= useState("");
  const [qrValue, setQrValue] = useState("");
  const [resetQrField, setResetQrField] = useState(false);

  const [totalLabels, setTotalLabels] = useState(0);
  const [remainingLabels, setRemainingLabels] = useState(0);
  const [printedLabels, setPrintedLabels] = useState(0);


    const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");


  // Example table data and columns


  //console.log("hi",pickListCode,childPartCode,planQty)

const printB2Columns = [
  { title: "S.No", dataIndex: "sno", key: "sno" },
  { title: "Part Name", dataIndex: "childPartDesc", key: "childPartDesc" },
  { title: "Quantity", dataIndex: "binCountQty", key: "binCountQty" },
  {
    title: "Is Printed",
    dataIndex: "isLabelPrinted",
    key: "isLabelPrinted",
    render: (value) => {
      if (value === 1) {
        return <CheckCircleTwoTone twoToneColor="#52c41a" />;
      }
      return "–";
    }
  },
  {
    title: "Printed Date & Time",
    dataIndex: "isLabelPrintedLastDateTime",
    key: "isLabelPrintedLastDateTime",
    render: (value, record) => {
      if (record.isLabelPrinted === 1) {
        return value || "-";
      }
      return "-";
    }
  },

  {
    title: "Action",
    key: "action",
    render: (_, record) => {
      const val = record.isLabelPrinted;  // 0 or 1
  
      return (
        <>
          {/* PRINT BUTTON */}
          <Button
            type="primary"
            disabled={val === 1}      // Disable when printSts = 1
            style={{
              marginRight: 8,
              opacity: val === 1 ? 0.5 : 1,
              cursor: val === 1 ? "not-allowed" : "pointer",
            }}
            onClick={() => handleViewQR(record)}
          >
            Print
          </Button>
  
          {/* REPRINT BUTTON */}
          <Button
            type="default"
            disabled={val === 0}      // Disable when printSts = 0
            style={{
              opacity: val === 0 ? 0.5 : 1,
              cursor: val === 0 ? "not-allowed" : "pointer",
            }}
          onClick={()=>handleViewQR(record)}  
          >
            Reprint
          </Button>
        </>
      );
    },
  },
  /*
    {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <a onClick={() => handleViewQR(record)}>View QR</a>
    )
  },
  */
];

  // const printB2Data = [
  //   { sno: 1, partName: "Part-001", quantity: 10, qrValue: "QR001" },
  //   { sno: 2, partName: "Part-002", quantity: 20, qrValue: "QR002" },
  // ];


  const handleViewQR = async (qrValue) => {
  const binCountQty=qrValue.binCountQty; 
      //  const label=labelCode;
      const label=qrValue.scanQrCode;
      

      const prefix = label.substring(0, 1).trim();
      const deliveryNoteNos = label.substring(1, 17).trim();      // 16 digits
      const customerSnos = label.substring(17, 35).trim();         // 18 digits
      const supplierCodes = label.substring(35, 42).trim();        // 7 digits
      const quantityss = label.substring(42, 50).trim();            // 8 digits
      const packageNos = label.substring(50, 68).trim();           // 18 digits
      const batchNos = label.substring(68, 80).trim();             // 12 digits
      const deliveryDates = label.substring(80, 88).trim();        // YYYYMMDD
      const manufactureDates = label.substring(88, 96).trim();     // YYYYMMDD
      const expirationDates = label.length >= 104 
                              ? label.substring(96, 104).trim()   // optional
                              : "";





       const start = 42;  
      const end = 50;   

      const newValue = qrValue.binCountQty.toString();  // whatever dynamic value
      const paddedValue = newValue.padEnd(8, " ");

      const updatedLabelCode = label.substring(0, start) + paddedValue + label.substring(end);
      

      const sNo=qrValue.psDtlId.toString();
     const itemType=selectType;
     const newPakNo="S"+itemType+sNo;

      const pakNoPadVal=newPakNo.padEnd(18, " ");

      const pakNoStart=50;
      const pakNoEnd=68;
      const updatedPakNo = updatedLabelCode.substring(0, pakNoStart) + pakNoPadVal + label.substring(pakNoEnd);
      
       
  //printB2Data
    
    console.log("qrValue",qrValue);
const updatedQrValue = {
  ...qrValue,
  deliveryNoteNos,
  deliveryDates,
  manufactureDates,
  batchNos,
  updatedPakNo,
  newPakNo
};
setSelectedQrData(updatedQrValue);
    setQrModalVisible(true);
    const response = await handleUpdateLabel(qrValue, false, []); // single update
    // Only reload print data if backend update succeeded
    if (response && response.responseCode === "200") {
        printPageRef.current?.handleSubmitData("empty");
    }
  };

const handlePrintAll = async () => {
  if (!printB2Data || printB2Data.length === 0) {
    toast.warning("No labels available to print!");
    return;
  }

  // 1️⃣ Update all label statuses
  const response = await handleUpdateLabel(null, true, printB2Data);
  

  // 2️⃣ Generate PDF for all labels
  await downloadAllLabelsAsPDF(printB2Data);

  // 3️⃣ Reload print data only if backend update succeeded
  if (response && response.responseCode === "200") {
      printPageRef.current?.handleSubmitData("empty");
  }
};


const downloadAllLabelsAsPDF = async (allItems) => {
  setIsOverAllPrinting(true);
  const pdf = new jsPDF("landscape", "mm", "a4");
  let isFirstPage = true;

  for (const item of allItems) {
    // update DOM with the current item

// const label=labelCode;
const label=item.scanQrCode;

 const prefix = label.substring(0, 1).trim();
      const deliveryNoteNos = label.substring(1, 17).trim();      // 16 digits
      const customerSnos = label.substring(17, 35).trim();         // 18 digits
      const supplierCodes = label.substring(35, 42).trim();        // 7 digits
      const quantityss = label.substring(42, 50).trim();            // 8 digits
      const packageNos = label.substring(50, 68).trim();           // 18 digits
      const batchNos = label.substring(68, 80).trim();             // 12 digits
      const deliveryDates = label.substring(80, 88).trim();        // YYYYMMDD
      const manufactureDates = label.substring(88, 96).trim();     // YYYYMMDD
      const expirationDates = label.length >= 104 
                              ? label.substring(96, 104).trim()   // optional
                              : "";

    const binCountQty=item.binCountQty; 
    
    const start = 42;  
   const end = 50;   
  
   const newValue = item.binCountQty.toString();  // whatever dynamic value
   const paddedValue = newValue.padEnd(8, " ");
  
   const updatedLabelCode = label.substring(0, start) + paddedValue + label.substring(end);
   
  
   const sNo=item.psDtlId.toString();
  const itemType=selectType;
  const newPakNo="S"+itemType+sNo;
  
   const pakNoPadVal=newPakNo.padEnd(18, " ");
  
   const pakNoStart=50;
   const pakNoEnd=68;
   const updatedPakNo = updatedLabelCode.substring(0, pakNoStart) + pakNoPadVal + label.substring(pakNoEnd);
   
    
  //printB2Data
  
  const updatedQrValue = {
  ...item,
  deliveryNoteNos,
  batchNos,
  deliveryDates,
  manufactureDates,
  updatedPakNo,
  newPakNo
  };
  setSelectedQrData(updatedQrValue);
  





  //  setSelectedQrData(item);
    setQrModalVisible(true);
    // Wait for UI render
    await new Promise((res) => setTimeout(res, 300));

    const element = document.getElementById("qr-label-area");
    if (!element) {
      console.error("qr-label-area not found");
      continue;
    }

    let canvas;

    try {
      canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
    } catch (error) {
      console.error("html2canvas failed:", error);
      continue;
    }

    // ⚠ Validation to prevent jsPDF scale issue
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.error("Canvas invalid:", canvas);
      continue;
    }

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    // ⚠ Validate base64 before sending to jsPDF
    if (!imgData || typeof imgData !== "string" || !imgData.startsWith("data:image")) {
      console.error("Invalid image data, skipping.");
      continue;
    }

    // PDF Dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Maintain QR ratio
    const imgWidth = pdfWidth - 20; // margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (!isFirstPage) pdf.addPage();

    try {
      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
    } catch (error) {
      console.error("addImage failed:", error);
      continue;
    }

    isFirstPage = false;
  }

  pdf.save("All_Labels.pdf");
  toast.success("All labels downloaded!");
};


// For single or multiple label update
const handleUpdateLabel = async (qrValue, isPrintAll = false, fullList = []) => {
  try {
    // Build dtlId array based on mode
    const dtlIdArray = isPrintAll 
      ? fullList.map(item => item.psDtlId)        // Print All → send all psDtlId
      : [qrValue.psDtlId];                        // Single click → send one psDtlId

    const response = await backendService({
      requestPath: 'updatePrintLabel',
      requestData: {
        dtlId: dtlIdArray,
        tenantId,
        branchCode,
      }
    });

    if (response && response.responseCode === "200") {
      toast.success("Label updated successfully");
    }
    return response;
  } catch (err) {
    console.error(err);
    return null;
  }
};


  useEffect(() => {
  if (qrModalVisible && isOverAllPrinting === false) {
    const timer = setTimeout(() => {
      downloadPDF();
    }, 500); // wait for DOM render

    return () => clearTimeout(timer);
  }
}, [qrModalVisible]);



const downloadPDF = async () => {
  const element = document.getElementById("qr-label-area");
  if (!element) {
    console.error("Label area not found!");
    return;
  }

  let canvas;
  try {
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff", // avoid transparent backgrounds that sometimes break PNG handling
    });
  } catch (err) {
    console.error("html2canvas failed:", err);
    alert("Could not capture label for PDF (html2canvas error). Check console.");
    return;
  }

  // helper to compute sizes and save pdf
  const saveCanvasToPdf = (imgData, format) => {
    try {
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10; // mm
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // jsPDF expects raw base64 (without "data:image/..;base64,") in many builds
      const base64 = imgData.split(",")[1];

      // addImage(base64, format, x, y, width, height, alias, compression)
      pdf.addImage(base64, format, margin, margin, imgWidth, imgHeight);
      pdf.save("label.pdf");
      return true;
    } catch (err) {
      console.error(`addImage(${format}) failed:`, err);
      return false;
    }
  };

  // Try PNG first (preferred)
  try {
    const pngData = canvas.toDataURL("image/png");
    const ok = saveCanvasToPdf(pngData, "PNG");
    if (ok) return;
    // else fallthrough to JPEG
  } catch (err) {
    console.warn("toDataURL('image/png') failed or PNG addImage failed:", err);
  }

  // Fallback to JPEG
  try {
    const jpegData = canvas.toDataURL("image/jpeg", 1.0);
    const ok = saveCanvasToPdf(jpegData, "JPEG");
    if (ok) return;
  } catch (err) {
    console.error("JPEG fallback failed:", err);
  }

  alert("Failed to generate PDF. Check the console for errors.");
};

const [deliveryNoteNo, setDeliveryNoteNo] = useState("");
const [batchNo, setBatchNo] = useState("");

/*

const handleQrBlur = (e) => {
  const val = e.target.value.trim();

  SetLabelCode(val);
  if (!val) return;

  const qr = val; // full scanned QR string
  console.log("Scanned QR:", qr);

  // Fixed-position extraction (based on your image)
  const prefix = qr.substring(0, 1).trim();
  const deliveryNoteNo = qr.substring(1, 17).trim();      // 16 digits
  const customerSno = qr.substring(17, 35).trim();         // 18 digits
  const supplierCode = qr.substring(35, 42).trim();        // 7 digits
  const quantity = qr.substring(42, 50).trim();            // 8 digits
  const packageNo = qr.substring(50, 68).trim();           // 18 digits
  const batchNo = qr.substring(68, 80).trim();             // 12 digits
  const deliveryDate = qr.substring(80, 88).trim();        // YYYYMMDD
  const manufactureDate = qr.substring(88, 96).trim();     // YYYYMMDD
  const expirationDate = qr.length >= 104 
                          ? qr.substring(96, 104).trim()   // optional
                          : "";
  setDeliveryNoteNo(deliveryNoteNo);
  setBatchNo(batchNo);

console.log("childPartCodes",childPartCode,customerSno)

const vals = customerSno.includes(childPartCode);
console.log("childPartis there or not there",vals)
 const childPartCodeValidation=childPartCode;
 if (!childPartCodeValidation || !customerSno) {
  toast.error("ChildPartCode cannot be empty");
   return;
}

if (!customerSno.includes(childPartCodeValidation)) {
  toast.error("Invalid ChildPartCode Scanned");
   return
}



  const extractedData = {
    prefix,
    deliveryNoteNo,
    customerSno,
    supplierCode,
    quantity,
    packageNo,
    batchNo,
    deliveryDate,
    manufactureDate,
    expirationDate
  };

  setQrData(extractedData);
  setQrValue(val);
};


*/



useEffect(() => {
  if (resetQrField) {
    setResetQrField(false);
  }
}, [resetQrField]);

const inputRef = useRef(null);
  const scanTimerRef = useRef(null);
  
const handleQrBlur = (e) => {
  const fieldName = e.target.name;
  clearTimeout(scanTimerRef.current);

  // Wait 300ms after barcode typing completes
  scanTimerRef.current = setTimeout(async () => {

  const val = e.target.value.trim();

  SetLabelCode(val);
  if (!val){
    setResetQrField(true);
  inputRef.current?.focus();
    return
  } ;

  const qr = val; // full scanned QR string
  console.log("Scanned QR:", qr);

  // Fixed-position extraction (based on your image)
  const prefix = qr.substring(0, 1).trim();
  const deliveryNoteNo = qr.substring(1, 17).trim();      // 16 digits
  const customerSno = qr.substring(17, 35).trim();         // 18 digits
  const supplierCode = qr.substring(35, 42).trim();        // 7 digits
  const quantity = qr.substring(42, 50).trim();            // 8 digits
  const packageNo = qr.substring(50, 68).trim();           // 18 digits
  const batchNo = qr.substring(68, 80).trim();             // 12 digits
  const deliveryDate = qr.substring(80, 88).trim();        // YYYYMMDD
  const manufactureDate = qr.substring(88, 96).trim();     // YYYYMMDD
  const expirationDate = qr.length >= 104 
                          ? qr.substring(96, 104).trim()   // optional
                          : "";
  setDeliveryNoteNo(deliveryNoteNo);
  setBatchNo(batchNo);

console.log("childPartCodes",childPartCode,customerSno)

const vals = customerSno.includes(childPartCode);
console.log("childPartis there or not there",vals)
 const childPartCodeValidation=childPartCode;
 if (!childPartCodeValidation || !customerSno) {
  toast.error("ChildPartCode cannot be empty");
  setResetQrField(true);
  inputRef.current?.focus();
   return;
}

if (!customerSno.includes(childPartCodeValidation)) {
  toast.error("Invalid ChildPartCode Scanned");
  setResetQrField(true);
  inputRef.current?.focus();
   return
}



  const extractedData = {
    prefix,
    deliveryNoteNo,
    customerSno,
    supplierCode,
    quantity,
    packageNo,
    batchNo,
    deliveryDate,
    manufactureDate,
    expirationDate
  };

  setQrData(extractedData);
  setQrValue(val);
}, 300);
};


  return (
    <>
      <PrintPage
        ref={printPageRef}
        selectType={selectType}
        selectedPrintPart={selectedPrintPart}
        qrData={qrData}
        setQrValue={setQrValue}
        showPrintDetails={showPrintDetails}
        setShowPrintDetails={setShowPrintDetails}
        setCurrentPage={() => {}}
        handleQrBlur={handleQrBlur}
        printB2Columns={printB2Columns}
        printB2Data={printB2Data}
        setPrintB2Data={setPrintB2Data}
        handleViewQR={handleViewQR}
        handlePrintAll={handlePrintAll}
        handleUpdateLabel={handleUpdateLabel}
        pickListCode={pickListCode}
        childPartCode={childPartCode}
        pickListQty={planQty}
        inputRef={inputRef}
        resetQrField={resetQrField}
        totalLabels={totalLabels}
        remainingLabels={remainingLabels}
        printedLabels={printedLabels}
        setTotalLabels={setTotalLabels}
        setRemainingLabels={setRemainingLabels}
        setPrintedLabels={setPrintedLabels}

      />

      <QRModal
        qrModalVisible={qrModalVisible}
        setQrModalVisible={setQrModalVisible}
        setIsOverAllPrinting={setIsOverAllPrinting}
        selectedQrData={selectedQrData}

      />
    </>
  );
};

export default PickListPrintMain;
