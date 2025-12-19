import React, { useRef, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import serverApi from "../../../serverAPI";
import store from "store";
import { toast } from "react-toastify"; 
import Loader from "../../../Utills/Loader";
import ExcelJS from "exceljs";
import moment from "moment";
import { saveAs } from "file-saver";

const VendorMaster = ({onCancel}) => {
  const [selectedModule, setSelectedModule] = useState("Master");
  const [selectedScreen, setSelectedScreen] = useState("Vendor Master");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const gridRef = useRef(null);

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);

    const payload = {
      tenantId: tenantId,
      branchCode: branchCode,
    };

    try {
      const response = await serverApi.post(
        "getVendordetails",
        payload
      );
      console.log("API Response:", response);
      
      if (response.data.responseCode === "200") {
        const apiData = response.data.responseData.map((item) => ({
          vendorId: item.vendorId,
          vendorCode: item.vendorCode,
          vendorName: item.vendorName,
          // Convert status to string for consistency with checkbox
          status: item.status,
          isUpdate: 1,
          changed: false
        }));

        setMasterList(apiData);
        setOriginalList(structuredClone(apiData)); // Use structuredClone like LineMaster
      } else {
        setMasterList([]);
        setOriginalList([]);
        toast.error("No data found");
      }
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Failed to load vendor data");
    } finally {
      setIsLoading(false);
    }
  };

  const onCellValueChanged = (params) => {
    if (!params.data) return;
    
    params.data.changed = true;
    setMasterList([...masterList]);
  };

  // Function to check if there are any changes
  const hasChanges = () => {
    // Normalize status values for comparison
    const normalizeStatus = (list) => list.map(item => ({
      ...item,
      status: item.status === "1" || item.status === 1 || item.status === true ? "1" : "0"
    }));

    const normMaster = normalizeStatus(masterList);
    const normOriginal = normalizeStatus(originalList);
    
    return JSON.stringify(normMaster) !== JSON.stringify(normOriginal);
  };

  const createorUpdate = async () => {
  
    gridRef.current.api.stopEditing(); 
  

  try {
    setIsLoading(true);

    // 🔹 Mandatory validation
    const hasInvalid = masterList.some(
      (item) =>
        !item.vendorCode ||
        !item.vendorName ||
        item.vendorCode.trim() === "" ||
        item.vendorName.trim() === ""
    );

    if (hasInvalid) {
      toast.error("Please fill all mandatory fields");
      setIsLoading(false);
      return;
    }

    // 🔹 Duplicate vendor code check
    const codes = masterList.map((i) => i.vendorCode.trim());
    const duplicate = codes.find(
      (code, index) => codes.indexOf(code) !== index
    );

    if (duplicate) {
      toast.error(`Duplicate Vendor Code found: ${duplicate}`);
      setIsLoading(false);
      return;
    }
   console.log(masterList,"masterList")
    // 🔹 Detect changed + new rows
    const rowsToSave = masterList.filter((row) => {
      if (!row.vendorId) return true; // new row
      
      const original = originalList.find(orig => orig.vendorId === row.vendorId);
      if (!original) return true; // new row

      return (
        row.vendorCode !== original.vendorCode ||
        row.vendorName !== original.vendorName ||
        row.status !== original.status
      );
    });

    if (rowsToSave.length === 0) {
      toast.error("No changes to save");
      setIsLoading(false);
      return;
    }

    // 🔹 Prepare payload
    const payload = rowsToSave.map((row) => ({
      tenantId,
      branchCode,
      vendorId: row.vendorId,
      vendorCode: row.vendorCode,
      vendorName: row.vendorName,
      status: row.status === "1" || row.status === 1 ? 1 : 0,
      updatedBy: employeeId,
    }));
   console.log(rowsToSave,payload,"payload");
    const response = await serverApi.post(
      "insertAndUpdateVendorDetails", payload
    );
console.log("response",response);
    if (response.data.responseCode === "200") {
      toast.success("Vendor details saved successfully");
      fetchData();
    } else if (response.data.responseCode === "DUBLICATE") {
      toast.error("Duplicate vendor code found!");
    } else {
      toast.error(response.data.responseMessage || "Save failed");
    }
  } catch (error) {
    console.error(error);
    toast.error("Error while saving vendor details");
  } finally {
    setIsLoading(false);
  }
};


  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const MandatoryHeaderComponent = (props) => {
     const buttonRef = React.useRef(null);
     
     return (
       <div className="ag-cell-label-container" role="presentation">
         <span 
           ref={buttonRef}
           className="ag-header-icon ag-header-cell-filter-button" 
           onClick={() => props.showColumnMenu(buttonRef.current)}
         >
           <span className="ag-icon ag-icon-filter" role="presentation"></span>
         </span>
         <div className="ag-header-cell-label" role="presentation">
           <span className="ag-header-cell-text"> <span style={{color: 'red'}}>*</span>{props.displayName}</span>
         </div>
       </div>
     );
   };

  const columnDefs = [
    // {
    //   headerName: "Vendor Id",
    //   field: "vendorId",
    //   filter: "agTextColumnFilter",
    //   editable: (params) => (params.data.isUpdate === 0 ? true : false),
    //   headerComponent: MandatoryHeaderComponent,
    //   headerComponentParams: { displayName: "Vendor Id" },
    // },
    {
      headerName: "Vendor Code",
      field: "vendorCode",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Vendor Code" },
    },
    {
      headerName: "Vendor Name",
      field: "vendorName",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Vendor Name" },
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) =>
        params.data.status === "1" || params.data.status === 1,
      valueSetter: (params) => {
        params.data.status = params.newValue ? "1" : "0";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    // Check if there are any empty vendorId rows
    const emptyRows = masterList.filter(
      (item) => !item.vendorId || !item.vendorCode
    );

    if (emptyRows.length === 0) {
      const emptyRow = {
        isUpdate: 0,
        vendorId:'',
        status: "1", // Default to active (checked)
        changed: true
      };
      
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      
      // Auto focus and edit the new row after a delay
      setTimeout(() => {
        const api = gridRef.current?.api;
        if (!api) return;

        const lastRowIndex = updated.length - 1;
        const totalPages = api.paginationGetTotalPages();

        // Go to last page
        api.paginationGoToLastPage();

        setTimeout(() => {
          api.ensureIndexVisible(lastRowIndex, "bottom");

          // Flash the new row to draw attention
          api.flashCells({
            rowNodes: [api.getDisplayedRowAtIndex(lastRowIndex)],
          });

          // Focus and start editing on Vendor Id column
          const firstColId = "vendorCode";
          api.setFocusedCell(lastRowIndex, firstColId);
          api.startEditingCell({
            rowIndex: lastRowIndex,
            colKey: firstColId,
          });
        }, 150);
      }, 100);

    } else {
      toast.error("Please fill all mandatory fields in the empty row first");
    }
  };

  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
    fetchData();
  };

  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "Active") {
      setMasterList(originalList.filter((item) => 
        item.status === "1" || item.status === 1
      ));
    } else if (value === "Inactive") {
      setMasterList(originalList.filter((item) => 
        item.status === "0" || item.status === 0
      ));
    }
  };

 const onExportExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Vendor Master");

    // ===== Column Widths =====
    const columnWidths = [30, 40, 20];
    columnWidths.forEach((w, i) => {
      worksheet.getColumn(i + 1).width = w;
    });

    // ===== Title Row Height =====
    worksheet.getRow(1).height = 65;

    // ===== Left Logo =====
    try {
      const imgUrl = `${window.location.origin}/pngwing.com.png`;
      const logo1 = await fetch(imgUrl);
      const blob1 = await logo1.blob();
      const arr1 = await blob1.arrayBuffer();
      const imageId1 = workbook.addImage({
        buffer: arr1,
        extension: "png",
      });
      worksheet.addImage(imageId1, {
        tl: { col: 0, row: 0 },
        br: { col: 1, row: 1 },
      });
    } catch {
      console.warn("Left logo not found");
    }

    // ===== Title Cell =====
    worksheet.mergeCells("B1");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = `Vendor Master Report\nGenerated On: ${moment().format(
      "DD/MM/YYYY HH:mm:ss"
    )}`;
    titleCell.font = { bold: true, size: 14, color: { argb: "FF00264D" } };
    titleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    titleCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // ===== Right Logo =====
    try {
      const imgUrl1 = `${window.location.origin}/smartrunLogo.png`;
      const logo2 = await fetch(imgUrl1);
      const blob2 = await logo2.blob();
      const arr2 = await blob2.arrayBuffer();
      const imageId2 = workbook.addImage({
        buffer: arr2,
        extension: "png",
      });
      worksheet.addImage(imageId2, {
        tl: { col: 2, row: 0 },
        br: { col: 3, row: 1.6 },
      });
    } catch {
      console.warn("Right logo not found");
    }

    // ===== Header Row =====
    const startRow = 3;
    const headers = ["Vendor Code", "Vendor Name", "Status"];

    const headerRow = worksheet.getRow(startRow);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ===== Data Rows =====
    masterList.forEach((item, index) => {
      const rowNumber = startRow + index + 1;
      const row = worksheet.getRow(rowNumber);

      row.values = [
        item.vendorCode || "",
        item.vendorName || "",
        item.status === "1" || item.status === 1 ? "Active" : "Inactive",
      ];

      row.eachCell((cell) => {
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // ===== AutoFilter =====
    worksheet.autoFilter = {
      from: { row: startRow, column: 1 },
      to: { row: startRow, column: headers.length },
    };

    // ===== Save File =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `Vendor_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
    );
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Error exporting Vendor Master.");
  }
};

  return (
    <div>
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

        <div className="p-3">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-3">
          <div style={{ position: "relative" }}>
            {isLoading && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  zIndex: 2,
                  borderRadius: "8px",
                }}
              >
                <Loader />
              </div>
            )}
            <div className="ag-theme-alpine" style={{ width: "100%" }}>
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
                onCellValueChanged={onCellValueChanged}
                overlayNoRowsTemplate="<span style='padding:10px; font-weight:600; color:#666;'>No data available</span>"
              />
            </div>
          </div>
          <div className="text-center mt-4">
            <button
              onClick={onExportExcel}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={isLoading}
            >
              Excel Export
            </button>
            <button
              onClick={createorUpdate}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update"}
            </button>
            <button
              onClick={handleCancel}
              className="btn text-white"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorMaster;