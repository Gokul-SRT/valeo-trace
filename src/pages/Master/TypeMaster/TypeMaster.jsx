import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
// import "ag-grid-enterprise";
// import { ModuleRegistry } from "ag-grid-community";
// import { SetFilterModule } from "ag-grid-enterprise";
// import { DateFilterModule } from "ag-grid-enterprise";
// import { ExcelExportModule } from "ag-grid-enterprise";
import { Input, Button, Form, message } from "antd";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../serverAPI";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment"; 
// ModuleRegistry.registerModules([
//   SetFilterModule,
//   DateFilterModule,
//   ExcelExportModule,
// ]);


const TypeMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]); // 🔹 keep backup for dynamic filtering
  const gridRef = useRef(null);

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;

    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  useEffect(() => {
    setSelectedModule(modulesprop);
    setSelectedScreen(screensprop);
  }, [modulesprop, screensprop]);

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      fetchData();
    }
  }, [selectedModule, selectedScreen]);
  // const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  // const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  // const employeeId = JSON.parse(localStorage.getItem("empID"));

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId")

  console.log("tenantId",tenantId);

  const fetchData = async () => {
  try {
    const response = await serverApi.post("gettypeMasterdtl", {
      tenantId,
      branchCode,
    });

    // Fix: Handle backend response wrapper
    if (response?.data?.responseCode === "200" && Array.isArray(response.data.responseData)) {
      const updatedResponseData = response.data.responseData.map((item) => ({
        ...item,
        // keep your original payload fields as-is
        isUpdate: 1,
      }));
      setMasterList(updatedResponseData);
      setOriginalList(updatedResponseData);
      console.log("Fetched TypeMaster:", updatedResponseData);
    } else {
      setMasterList([]);
      setOriginalList([]);
      toast.error(response?.data?.responseMessage || "No data found");
    }
  } catch (error) {
    console.error("Error fetching TypeMaster data:", error);
    toast.error("Error fetching data. Please try again later.");
  }
};


  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    //resizable: true, // allow manual resize too
    flex: 1,
  };

 

// const columnDefs = [
//   { headerName: "Packet ID", field: "packetId", filter: "agTextColumnFilter",  editable: (params) => (params.data.isUpdate === 0 ? true : false), },
//   { headerName: "Child Part ID", field: "childPartId", filter: "agTextColumnFilter" },
//   { headerName: "Packet Qty", field: "packetsQtys", filter: "agNumberColumnFilter" },
// ];


const columnDefs = [
 // { headerName: "Type ID", field: "type_id", filter: "agTextColumnFilter",editable: (params) => (params.data.isUpdate === 0 ? true : false), },
  { headerName: "Type Code", field: "typeCode", filter: "agTextColumnFilter", editable: (params) => (params.data.isUpdate === 0 ? true : false), },
  { headerName: "Type Description", field: "typeDescription", filter: "agTextColumnFilter" },
  { headerName: "Bin Quantity", field: "stantardQuantity", filter: "agTextColumnFilter",  cellStyle: { textAlign: "right" },  },
 // { headerName: "Tenant ID", field: "tenant_id", filter: "agTextColumnFilter" },
  // { headerName: "Created At", field: "created_at", filter: "agDateColumnFilter" },
  // { headerName: "Updated At", field: "updated_at", filter: "agDateColumnFilter" },
];


  // Add new empty row
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const TypeMasterempty = masterList.filter((item) => !item.typeCode);
    console.log(TypeMasterempty);
    if (TypeMasterempty && TypeMasterempty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      toast.error("Please enter the Type Code for all the rows.");
    }
  };

  const createorUpdate = async () => {
    try {

// Check EMPTY Type codes
const hasEmptyTypeCode = masterList.some(
  (item) => !item.typeCode || item.typeCode.trim() === ""
);

if (hasEmptyTypeCode) {
  toast.error("Please fill Type Code for all rows!");
  return;
}


 // Check DUPLICATE Type codes
 const typeCodes = masterList.map((item) => item.typeCode.trim());
 const duplicateCodes = typeCodes.filter(
   (code, index) => typeCodes.indexOf(code) !== index
 );

 if (duplicateCodes.length > 0) {
   toast.error(`Duplicate Type Code found: ${duplicateCodes[0]}`);
   return;
 }



      console.log('masterList',masterList)
      const updatedList = masterList.map((item) => ({
        isUpdate: item.isUpdate,
        typeCode: item.typeCode,
        typeDesc: item.typeDescription,
        tenantId: tenantId,
        updatedBy: employeeId,
        branchCode: branchCode,
        standardQty:item.stantardQuantity,
      }));

      const response = await serverApi.post(
        "insertupdatetypemaster",
        updatedList
      );

      if (response.data && response.data === "SUCCESS") {
        toast.success("Data saved successfully!");
        fetchData();
      } else if (response.data && response.data === "DUBLICATE") {
        toast.success("Do Not Allow Dublicate TypeCode!");

      }  else {
        toast.error("SaveOrUpdate failed.");
        
      }
    } catch (error) {
      console.error("Error saving TypeMaster data:", error);
       toast.error("Error while saving data!");
     
    }
  };

  // ✅ Cancel
  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
    fetchData();
  };

  // ✅ Filter change
  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "1") {
      setMasterList(originalList.filter((item) => item.isActive === "1"));
    } else if (value === "0") {
      setMasterList(originalList.filter((item) => item.isActive === "0"));
    }
  };

  // const onExportExcel = (ref) => {
  //   if (ref.current?.api) {
  //     ref.current.api.exportDataAsExcel({
  //       fileName: `TypeMaster.xlsx`,
  //     });
  //   } else {
  //     alert("Grid is not ready!");
  //   }
  // };

    const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("TypeMaster");

      // Row height
      worksheet.getRow(1).height = 60;

      // Column widths
      worksheet.getColumn(1).width = 25; // Type Code
      worksheet.getColumn(2).width = 40; // Type Description

      // === Left logo ===
      const imgResponse = await fetch("/pngwing.com.png");
      const imgBlob = await imgResponse.blob();
      const arrayBuffer = await imgBlob.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: arrayBuffer,
        extension: "png",
      });
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        br: { col: 1, row: 1 },
        editAs: "oneCell",
      });

      // === Title ===
      const titleCell = worksheet.getCell("B1");
      titleCell.value = `${selectedScreen} Report`;
      titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      // === Date ===
      worksheet.mergeCells("C1:D2");
      const dateCell = worksheet.getCell("C1");
      dateCell.value = `Generated On: ${moment().format("DD/MM/YYYY HH:mm:ss")}`;
      dateCell.font = { bold: true, size: 11, color: { argb: "FF00264D" } };
      dateCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      // === Right logo ===
      const img2 = await fetch("/smartrunLogo.png");
      const blob2 = await img2.blob();
      const buf2 = await blob2.arrayBuffer();
      const imgId2 = workbook.addImage({ buffer: buf2, extension: "png" });
      worksheet.mergeCells("E1:F2");
      worksheet.addImage(imgId2, {
        tl: { col: 4, row: 0 },
        br: { col: 6, row: 2 },
        editAs: "oneCell",
      });

      // === Headers ===
      const headers = ["Type Code", "Type Description"];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      headerRow.height = 25;

      // === Data ===
      masterList.forEach((item) => {
        const row = worksheet.addRow([
          item.typeCode || "",
          item.typeDescription || "",
        ]);
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { size: 10 };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // === Save file ===
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `TypeMaster_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );

      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Excel. Please try again.");
    }
  };



  return (
    <div>
      {/* Second Card - Table */}
      {/* {masterList.length > 0 && ( */}
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          {selectedScreen} Details
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={handleAddRow}
            title="Add Row"
          />
        </div>

        {/* 🔹 Filter Dropdown */}
        {/* <div className="p-3">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label fw-bold">Search Filter</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="1">Active</option>
                <option value="0">InActive</option>
              </select>
            </div>
          </div>
        </div> */}

        <div className="card-body p-3">
          <AgGridReact
            ref={gridRef}
            rowData={masterList}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            pagination
            domLayout="autoHeight"
            singleClickEdit={true}
            onFirstDataRendered={autoSizeAllColumns}
            onCellValueChanged={(params) => {
              const updatedList = [...masterList];
              updatedList[params.rowIndex] = params.data;
              setMasterList(updatedList);
              setOriginalList(updatedList);
            }}
          />
          <div className="text-center mt-4">
            <button
              onClick={onExportExcel}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
            >
              Excel Export
            </button>
            <button
              type="submit"
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              onClick={createorUpdate}
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn text-white"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      {/* )} */}
    </div>
  );
};

export default TypeMaster;
