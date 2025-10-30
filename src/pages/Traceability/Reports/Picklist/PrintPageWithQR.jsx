import React, { useState } from "react";
import PrintPage from "./PrintPage";
import QRModal from "./QRModal";

const PickListPrintMain = () => {
  const [selectType] = useState("A2");
  const [selectedPrintPart, setSelectedPrintPart] = useState("Part-001");
  const [qrData, setQrData] = useState(null);
  const [showPrintDetails, setShowPrintDetails] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedQrData, setSelectedQrData] = useState("");
  const [qrValue, setQrValue] = useState("");

  // Example table data and columns
  const printB2Columns = [
    { title: "S.No", dataIndex: "sno", key: "sno" },
    { title: "Part Name", dataIndex: "partName", key: "partName" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <a onClick={() => handleViewQR(record.qrValue)}>View QR</a>
      ),
    },
  ];

  const printB2Data = [
    { sno: 1, partName: "Part-001", quantity: 10, qrValue: "QR001" },
    { sno: 2, partName: "Part-002", quantity: 20, qrValue: "QR002" },
  ];

  const handleViewQR = (qrValue) => {
    setSelectedQrData(qrValue);
    setQrModalVisible(true);
  };

  const handleQrBlur = (e) => {
    const val = e.target.value.trim();
    const simulatedPartCode = val; // Example fixed-length string

    const customerSno = simulatedPartCode.substring(15, 35).trim();     // 000000000000199500
    const supplierCode = simulatedPartCode.substring(35, 41).trim();    // 157042
    const quantity = simulatedPartCode.substring(42, 45).trim();        // 400
    const packageNo = simulatedPartCode.substring(48, 56).trim();       // 169835
    const deliveryDate = simulatedPartCode.substring(simulatedPartCode.length - 16, simulatedPartCode.length - 8); // 20250723
    const manufactureDate = simulatedPartCode.substring(simulatedPartCode.length - 8); // 20250723

    const extractedData = {
      customerSno,
      supplierCode,
      quantity,
      packageNo,
      deliveryDate,
      manufactureDate,
    };

    if (val) {
      setQrData(extractedData);
      setQrValue(val);
    }
  };

  return (
    <>
      <PrintPage
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
        handleViewQR={handleViewQR}
      />

      <QRModal
        qrModalVisible={qrModalVisible}
        setQrModalVisible={setQrModalVisible}
        selectedQrData={selectedQrData}
      />
    </>
  );
};

export default PickListPrintMain;
