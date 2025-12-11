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


const PacketQtyMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]); // 🔹 keep backup for dynamic filtering
  const [childPartOptions, setChildPartOptions] = useState([]);
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
      fetchChildParts();
    }
  }, [selectedModule, selectedScreen]);
  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = store.get("employeeId")
  const fetchData = async () => {
    try {
      const response = await serverApi.post("getpocketqtyMasterdtl", {
       
        /* tenantId: store.get('tenantId'),
        branchCode: store.get('branchCode')
        */
        tenantId: tenantId,
        branchCode: branchCode,
      });

      // ✅ Handle if backend sends null, undefined, or empty array
      if (!response.data || response.data.length === 0) {
        setMasterList([]);
        setOriginalList([]);
      } else {
        const updatedResponseData = response.data.map((item) => ({
          ...item,
          isUpdate: 1,
        }));
        setMasterList(updatedResponseData);
        setOriginalList(updatedResponseData);
        console.log(updatedResponseData);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Error fetching data. Please try again later.");
    }
  };



  const fetchChildParts = async () => {
    try {
      const response = await serverApi.post("getChildPartDropDown", {
        tenantId,
        branchCode,
        isActive: "1",
      });
  
      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setChildPartOptions(res.responseData);
      } else {
        setChildPartOptions([]);
      }
    } catch (error) {
      console.error("Error fetching child parts:", error);
      toast.error("Error fetching child parts. Please try again later.");
    }
  };
  

  const defaultColDef = {
    sortable: true,
    filter: true,
    //floatingFilter: true,
    editable: true,
    //resizable: true, // allow manual resize too
    flex: 1,
  };

 

const columnDefs = [
 // { headerName: "Packet ID", field: "packetId", filter: "agTextColumnFilter",  editable: (params) => (params.data.isUpdate === 0 ? true : false), },
 // { headerName: "Child Part Code", field: "childPartId", filter: "agTextColumnFilter" },
 {
  headerName: "Child Part Code",
  field: "childPartId",
  editable: true,
  cellEditor: "agSelectCellEditor",
  cellEditorParams: (params) => ({
    values: childPartOptions.map((p) => p.childPartCode), // show part IDs in dropdown
  }),
  valueFormatter: (params) => {
    const found = childPartOptions.find((p) => p.childPartCode === params.value);
    return found ? `${found.childPartDesc}` : params.value; // display description in grid
  },
  filter: "agTextColumnFilter",
  filterValueGetter: (params) => {
    const found = childPartOptions.find((p) => p.childPartCode === params.data.childPartId);
    return found ? found.childPartDesc : ""; // search/filter by description
  },
},
  // { headerName: "Packet Qty", field: "packetsQtys", filter: "agNumberColumnFilter" },
  { headerName: "Packet Qty", field: "packetsQtys", filter: "agTextColumnFilter" },
];



  // Add new empty row
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const packetIdempty = masterList.filter((item) => !item.packetId);
    console.log(packetIdempty);
    if (packetIdempty && packetIdempty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      toast.error("Please enter the Packet ID for all the rows.");
    }
  };

  const createorUpdate = async () => {
    try {
      console.log('masterList',masterList)
      const updatedList = masterList.map((item) => ({
        isUpdate: item.isUpdate,
        packetId: item.packetId,
        childPartCode: item.childPartId,
        packetQtys: item.packetsQtys,
        tenantId: tenantId,
        updatedBy: employeeId,
        branchCode: branchCode,
      }));

      const response = await serverApi.post(
        "insertupdatepocketqtymaster",
        updatedList
      );

      if (response.data && response.data === "SUCCESS") {
        toast.success("Data saved successfully!");
        fetchData();
      } else if (response.data && response.data === "DUBLICATE") {
        toast.success("Do Not Allow Dublicate PacketId!");

      }  else {
        toast.error("SaveOrUpdate failed.");
        
      }
    } catch (error) {
      console.error("Error saving PacketMaster data:", error);
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
  //       fileName: `PacketQtyMaster.xlsx`,
  //     });
  //   } else {
  //     alert("Grid is not ready!");
  //   }
  // };

  // ✅ Professional Excel Export — Same Format as ProductMaster
const onExportExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Packet Qty Master");

    // === Row Height for header ===
    worksheet.getRow(1).height = 60;

    // === Define Columns ===
    worksheet.columns = [
      { header: "Child Part Code", key: "childPartCode", width: 25 },
      { header: "Child Part Description", key: "childPartDesc", width: 35 },
      { header: "Packet Qty", key: "packetQtys", width: 15 },
    ];

    // === Insert Valeo Logo (optional) ===
    try {
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
    } catch (err) {
      console.warn("Logo image not found, skipping logo insert.");
    }

    // === Title ===
    worksheet.mergeCells("B1:D2");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = `${selectedScreen || "Packet Qty Master"} Report`;
    titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    // === Date Cell (top right) ===
    worksheet.mergeCells("E1:F2");
    const dateCell = worksheet.getCell("E1");
    dateCell.value = `Generated On: ${moment().format("DD/MM/YYYY HH:mm:ss")}`;
    dateCell.font = { bold: true, size: 11, color: { argb: "FF00264D" } };
    dateCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    // === Header Row ===
    const headerRow = worksheet.addRow([
      "Child Part Code",
      "Child Part Description",
      "Packet Qty",
    ]);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    headerRow.height = 25;

    // === Data Rows ===
    masterList.forEach((item) => {
      const childPart = childPartOptions.find(
        (p) => p.childPartCode === item.childPartId
      );

      const newRow = worksheet.addRow({
        childPartCode: item.childPartId || "",
        childPartDesc: childPart ? childPart.childPartDesc : "",
        packetQtys: item.packetsQtys || "",
      });

      newRow.eachCell((cell) => {
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

    // ✅ Apply AutoFilter after all rows are added
    const lastRow = worksheet.lastRow.number;
    worksheet.autoFilter = {
      from: { row: headerRow.number, column: 1 },
      to: { row: lastRow, column: worksheet.columns.length },
    };

    // // === Footer (Optional) ===
    // const footerRow = worksheet.addRow([]);
    // // footerRow.getCell(1).value = `Total Records: ${masterList.length}`;
    // worksheet.mergeCells(`A${footerRow.number}:C${footerRow.number}`);
    // footerRow.getCell(1).font = { bold: true, color: { argb: "FF00264D" } };
    // footerRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };

    // === Save File ===
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `Packet_Qty_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
    );
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Error exporting to Excel. Please try again.");
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

export default PacketQtyMaster;
