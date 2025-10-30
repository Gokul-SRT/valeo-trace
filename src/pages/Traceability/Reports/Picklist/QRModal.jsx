import React from "react";
import { Modal } from "antd";
import Barcode from "react-barcode";
import PDF417Barcode from "./PDF417Barcode";

const QRModal = ({ qrModalVisible, setQrModalVisible, selectedQrData }) => {
  const data = {
    consignee: "Amalgamations Valeo Clutch Pvt - Chennai",
    unloadingPoint: "CH35 - -",
    deliveryNoteNo: "TEST",
    itemNo: "PKKT0002",
    deliveryDate: "D20250417",
    manufactureDate: "",
    expirationDate: "",
    description: "Packing Kit - AL 380 CA 480X480X90",
    quantityFilled: "50",
    packageRefNo: "PKPL0001",
    supplierNo: "185267",
    pkgNo: "125",
    batchNo: "123456",
    traceability: selectedQrData || "QR123"
  };

  return (
 <Modal
  title="Label Preview"
  open={qrModalVisible}
  onCancel={() => setQrModalVisible(false)}
  footer={null}
  width={1100}
  centered
  bodyStyle={{ padding: "20px" }}
>
  <div
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
          width: "150px",
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

export default QRModal;
