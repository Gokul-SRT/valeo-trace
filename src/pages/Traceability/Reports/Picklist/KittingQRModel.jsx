import React, { useRef } from "react";
import { Modal,Button } from "antd";
import Barcode from "react-barcode";
import PDF417Barcode from "./PDF417Barcode";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const KittingQRModel = ({ qrModalVisible, setQrModalVisible, selectedQrData }) => {
  const qrLabelRef = useRef(null);
  if (!selectedQrData) {
    return null; // Prevent rendering
  }
  const scannedValue = selectedQrData.labelCode; // spaces are important, do not trim
  console.log("Length:", scannedValue.length);

  // Check if barcode is at least the expected length
  if (scannedValue.length > 104) {
    toast.error("Invalid barcode length");
    return;
  }

  // Extract fields based on fixed positions (spaces included)
  const type = scannedValue.substring(0, 1); // 0 - 16 (17 chars)
  const invoiceNumber = scannedValue.substring(1, 17); // 0 - 16 (17 chars)
  const childPartCode = scannedValue.substring(17, 35); // 17 - 34 (18 chars)
  const vendorCode = scannedValue.substring(35, 42); // 35 - 41 (7 chars)
  const lineQtyStr = scannedValue.substring(42, 50); // 42 - 49 (8 chars)
  const labelNumber = scannedValue.substring(50, 68); // 50 - 67 (18 chars)
  const batchNumber = scannedValue.substring(68, 80); // 68 - 79 (12 chars)
  const deliveryDate = scannedValue.substring(80, 88); // 80 - 87 (8 chars)
  const productionDate = scannedValue.substring(88, 96); // 88 - 95 (8 chars)
  const expirationDate = scannedValue.substring(96, 104); // 96 - 103 (8 chars)

  // Convert quantity to number safely
  const lineQt = Number(lineQtyStr.trim());
  if (isNaN(lineQt)) {
    toast.error("Invalid quantity");
    return;
  }

  console.log("Type:", type);
  console.log("Invoice Number:", invoiceNumber);
  console.log("Child Part Code:", childPartCode);
  console.log("Vendor Code:", vendorCode);
  console.log("Picked Qty:", lineQt);
  console.log("Label Number:", labelNumber);
  console.log("Batch Number:", batchNumber);
  console.log("Delivery Date:", deliveryDate);
  console.log("Production Date:", productionDate);
  console.log("Expiration Date:", expirationDate);

  const data = {
    consignee: "Amalgamations Valeo Clutch Pvt - Chennai",
    unloadingPoint: "CH35 - -",
    deliveryNoteNo: invoiceNumber || "",
    itemNo: `${selectedQrData?.childPartCode}`,
    deliveryDate: `D${deliveryDate?.replaceAll("-", "")}`,
    manufactureDate:`P${productionDate?.replaceAll("-", "")}`,
    expirationDate: `E${expirationDate?.replaceAll("-", "")}`,
    description: selectedQrData?.childPartDesc,
    quantityFilled: lineQt,
    packageRefNo:  `${selectedQrData?.packageRefNo}`,
    supplierNo: vendorCode,
    pkgNo: selectedQrData?.pakageNo,
    batchNo: batchNumber,
    traceability: scannedValue || ""
  };
/*
  const handleDownloadPDF = async () => {
    if (!qrLabelRef.current) return;
  
    // Capture the label exactly as it appears
    const canvas = await html2canvas(qrLabelRef.current, { scale: 1, backgroundColor: null });
    const imgData = canvas.toDataURL("image/png");
  
    // Convert canvas size from px to mm (1 px = 0.264583 mm)
    const pdfWidth = canvas.width * 0.264583;
    const pdfHeight = canvas.height * 0.264583;
  
    // Create PDF with custom size matching the label
    const pdf = new jsPDF({ orientation: pdfWidth > pdfHeight ? "landscape" : "portrait", unit: "mm", format: [pdfWidth, pdfHeight] });
  
    // Add image at full size
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("QR_Label.pdf");
  };
  */

  const handleDownloadPDF = async () => {
    if (!qrLabelRef.current) return;
  
    // Capture the label area as canvas
    const canvas = await html2canvas(qrLabelRef.current, { scale: 2, backgroundColor: null });
    const imgData = canvas.toDataURL("image/png");
  
    // Define small label size in mm (for example: 80mm x 50mm)
    const labelWidth = 80; // mm
    const labelHeight = 50; // mm
  
    // Create PDF with custom label size
    const pdf = new jsPDF({
      orientation: labelWidth > labelHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [labelWidth, labelHeight]
    });
  
    // Add the image to fill the PDF completely
    pdf.addImage(imgData, "PNG", 0, 0, labelWidth, labelHeight);
  
    pdf.save("QR_Label.pdf");
  };
  
  
  


  return (
 <Modal
  title="Label Preview"
  open={qrModalVisible}
onCancel={() => {
  setQrModalVisible(false);
 // setIsOverAllPrinting(false);
}}
footer={[
  <Button key="download" type="primary" onClick={handleDownloadPDF}>
    Download PDF
  </Button>,
]}
  width={1100}
  centered
  bodyStyle={{ padding: "20px" }}
>
  <div
    id="qr-label-area"
    ref={qrLabelRef}  // <-- attach ref here
    style={{
      border: "2px solid #000",
      fontFamily: "Arial, sans-serif",
      fontSize: "11px",
      color: "#000",
      backgroundColor: "#fff",
    }}
  >
    {/* -------------------- Row 1 -------------------- */}
    <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
      <div style={{ width: "40%", borderRight: "2px solid #000", padding: "6px 8px" }}>
        <div style={{ fontSize: "12px" }}>(1) Consignee</div>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.consignee}</div>
      </div>
      <div style={{ width: "30%", borderRight: "2px solid #000", padding: "6px 8px" }}>
        <div style={{ fontSize: "12px" }}>
          (2) Unloading point - storage location - purpose key
        </div>
        <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "6px" }}>
          {data.unloadingPoint}
        </div>
      </div>
      <div style={{ width: "30%", padding: "6px 8px" }}>
        <div style={{ fontSize: "12px" }}>(3) Delivery note number (N)</div>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.deliveryNoteNo}</div>
        <Barcode value={data.deliveryNoteNo} height={30} width={1.3} displayValue={false} />
      </div>
    </div>

    {/* -------------------- Row 2 -------------------- */}
    <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
      <div style={{ width: "28%", borderRight: "2px solid #000", padding: "6px 8px" }}>
        <div style={{ fontSize: "12px" }}>(8) Item no. customer (P)</div>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.itemNo}</div>
        <Barcode value={data.itemNo} height={30} width={1.3} displayValue={false} />
      </div>
      <div style={{ width: "24%", borderRight: "2px solid #000", padding: "6px 8px" }}>
        <div style={{ fontSize: "12px" }}>(4) Delivery date (D)</div>
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>{data.deliveryDate}</div>
      </div>
      <div style={{ width: "24%", borderRight: "2px solid #000", padding: "6px 8px" }}>
        <div style={{ fontSize: "12px" }}>(5) Manufacturing Date (P)</div>
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>{data.manufactureDate}</div>
      </div>
      <div style={{ width: "24%", padding: "6px 8px" }}>
        <div style={{ fontSize: "12px" }}>(6) Expiration date (E)</div>
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>{data.expirationDate}</div>
      </div>
    </div>

    {/* -------------------- Rows 3–5 + Traceability -------------------- */}
    <div style={{ display: "flex" }}>
      {/* Left section (Rows 3–5) */}
      <div style={{ flex: 1, borderRight: "2px solid #000" }}>
        {/* Row 3 */}
        <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
          <div style={{ width: "70%", borderRight: "2px solid #000", padding: "6px 8px" }}>
            <div style={{ fontSize: "12px" }}>(10) Description delivery service</div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.description}</div>
          </div>
          <div style={{ width: "30%", padding: "6px 8px" }}>
            <div style={{ fontSize: "12px" }}>(9) Quantity filled (Q)</div>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{data.quantityFilled}</div>
            <Barcode value={data.quantityFilled} height={25} width={1.2} displayValue={false} />
          </div>
        </div>

        {/* Row 4 */}
        <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
          <div style={{ width: "50%", borderRight: "2px solid #000", padding: "6px 8px" }}>
            <div style={{ fontSize: "12px" }}>(11) Package reference No (B)</div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.packageRefNo}</div>
            <Barcode value={data.packageRefNo} height={30} width={1.3} displayValue={false} />
          </div>
          <div style={{ width: "50%", padding: "6px 8px" }}>
            <div style={{ fontSize: "12px" }}>(12) Supplier number (V)</div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.supplierNo}</div>
            <Barcode value={data.supplierNo} height={30} width={1.3} displayValue={false} />
          </div>
        </div>

        {/* Row 5 */}
        <div style={{ display: "flex" }}>
          <div style={{ width: "50%", borderRight: "2px solid #000", padding: "6px 8px" }}>
            <div style={{ fontSize: "12px" }}>(15) PKG No. (S)</div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.pkgNo}</div>
            <Barcode value={data.pkgNo} height={30} width={1.3} displayValue={false} />
          </div>
          <div style={{ width: "50%", padding: "6px 8px" }}>
            <div style={{ fontSize: "12px" }}>(16) Batch No. (H)</div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>{data.batchNo}</div>
            <Barcode value={data.batchNo} height={30} width={1.3} displayValue={false} />
          </div>
        </div>
      </div>

      {/* Right section (Traceability spanning 3 rows) */}
      <div
        style={{
          width: "160px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          padding: "10px",
        }}
      >
        <div style={{ fontSize: "12px", marginBottom: "6px", textAlign: "center" }}>
          (17) Traceability (H)
        </div>
        <PDF417Barcode value={data.traceability} width={30} height={10} />
      </div>
    </div>
  </div>
</Modal>

  );
};

export default KittingQRModel;