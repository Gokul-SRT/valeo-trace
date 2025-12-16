import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../serverAPI";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Loader from "../../../Utills/Loader"; // Add this import

const TypeMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [loading, setLoading] = useState(false); // Add loading state
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

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await serverApi.post("gettypeMasterdtl", {
        tenantId,
        branchCode,
      });

      if (
        response?.data?.responseCode === "200" &&
        Array.isArray(response.data.responseData)
      ) {
        const updatedResponseData = response.data.responseData.map((item) => ({
          ...item,
          isUpdate: 1,
        }));
        setMasterList(updatedResponseData);
        setOriginalList(structuredClone(updatedResponseData)); // Use structuredClone
        console.log("Fetched TypeMaster:", updatedResponseData);
      } else {
        setMasterList([]);
        setOriginalList([]);
        toast.error(response?.data?.responseMessage || "No data found");
      }
    } catch (error) {
      console.error("Error fetching TypeMaster data:", error);
      toast.error("Error fetching data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  // Add Required Header Component
  const RequiredHeader = (props) => {
    return (
      <span>
        <span style={{ color: "red" }}>*</span> {props.displayName}
      </span>
    );
  };

  const RequiredHeaderRight = (props) => {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", textAlign: "right" }}>
        {/* <span style={{ color: "red" }}>*</span> */}
        <span>{props.displayName}</span>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "Type Code",
      field: "typeCode",
      filter: "agTextColumnFilter",
   //   headerComponent: RequiredHeader, // Add required indicator
      editable: (params) => (params.data.isUpdate === 0 ? true : false),
    },
    {
      headerName: "Type Description",
      field: "typeDescription",
      filter: "agTextColumnFilter",
    //  headerComponent: RequiredHeader, // Add required indicator
    },
    {
      headerName: "Bin Quantity",
      field: "stantardQuantity",
      filter: "agTextColumnFilter",
      headerComponent: RequiredHeaderRight,
      cellStyle: { textAlign: "right" },
      valueFormatter: (params) => {
        return params.value ? Number(params.value).toLocaleString() : "";
      },
    },
    {
      // Add Status column
      headerName: "Status",
      field: "isActive",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) =>
        params.data.isActive === "1" || params.data.isActive === 1,
      valueSetter: (params) => {
        params.data.isActive = params.newValue ? "1" : "0";
        return true;
      },
      cellStyle: { textAlign: "center" },
      minWidth: 120,
      maxWidth: 160,
      flex: 1,
    },
  ];

  // Add new empty row with improved UX
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
      isActive: "1", // Default to active
    };

    const typeCodeEmpty = masterList.filter((item) => !item.typeCode);

    if (typeCodeEmpty && typeCodeEmpty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);

      // Scroll to last page and focus new row
      setTimeout(() => {
        const api = gridRef.current?.api;
        if (!api) return;

        const lastRowIndex = updated.length - 1;
        const totalPages = api.paginationGetTotalPages();

        // Go to last page
        api.paginationGoToLastPage();

        // Ensure the last row is visible at the bottom
        setTimeout(() => {
          api.ensureIndexVisible(lastRowIndex, "bottom");

          // Flash the new row to draw attention
          api.flashCells({
            rowNodes: [api.getDisplayedRowAtIndex(lastRowIndex)],
          });

          // Focus and start editing on Type Code column
          api.setFocusedCell(lastRowIndex, "typeCode");
          api.startEditingCell({
            rowIndex: lastRowIndex,
            colKey: "typeCode",
          });
        }, 150);
      }, 100);
    } else {
      toast.error("Please enter the Type Code for all the rows.");
    }
  };

  // Normalize list for comparison (convert boolean/string status to consistent format)
  const normalizeList = (list) => {
    return list.map((item) => ({
      ...item,
      isActive:
        item.isActive === "1" || item.isActive === 1 || item.isActive === true
          ? "1"
          : "0",
    }));
  };

  // Check if there are changes
  const hasChanges = () => {
    const normMaster = normalizeList(masterList);
    const normOriginal = normalizeList(originalList);
    return JSON.stringify(normMaster) !== JSON.stringify(normOriginal);
  };

  const createorUpdate = async () => {
    try {
      setLoading(true);

      // Commit any ongoing edits
      gridRef.current.api.stopEditing();

      if (!hasChanges()) {
        toast.error("Change any one field before saving.");
        return;
      }

      // Check EMPTY Type codes
      const hasEmptyTypeCode = masterList.some(
        (item) => !item.typeCode || item.typeCode.trim() === ""
      );

      if (hasEmptyTypeCode) {
        toast.error("Please fill Type Code for all rows!");
        return;
      }

      // Validate: Type Description mandatory
     const invalidTypeDesc = masterList.some(
  (item) =>
    !item.typeDescription ||
    item.typeDescription.trim() === "" ||
    /\d/.test(item.typeDescription)
);

if (invalidTypeDesc) {
  toast.error("Type Description is required and should not contain numbers!");
  return;
}


      // Validate: Bin Quantity should be positive number if provided
      // ✅ Bin Quantity validation with 3 different messages
      for (let item of masterList) {
        const qty = item.stantardQuantity;

        // 1️⃣ Empty check
        if (qty === undefined || qty === null || qty.toString().trim() === "") {
          toast.error("Bin Quantity is mandatory");
          return;
        }

        const qtyNumber = Number(qty);
        if ((!qtyNumber) || !/^\d+$/.test(qtyNumber)) {
          toast.error("Please enter only Valid Numbers.");
          return;
        }
        // 2️⃣ Not a number or negative
        if (isNaN(qtyNumber) || qtyNumber < 0) {
          toast.error("Please enter only positive values");
          return;
        }

        // 3️⃣ Zero value
        if (qtyNumber === 0) {
          toast.error("Bin Quantity must be greater than 0!");
          return;
        }
      
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

      const updatedList = masterList.map((item) => ({
        isUpdate: item.isUpdate,
        typeCode: item.typeCode,
        typeDesc: item.typeDescription,
        tenantId: tenantId,
        updatedBy: employeeId,
        branchCode: branchCode,
        standardQty: item.stantardQuantity || "0", // Default to 0 if empty
        isActive:
          item.isActive === "1" || item.isActive === 1 || item.isActive === true
            ? "1"
            : "0",
      }));

      const response = await serverApi.post(
        "insertupdatetypemaster",
        updatedList
      );

      if (response.data && response.data === "SUCCESS") {
        toast.success("Add/Update successfully!");
        fetchData();
      } else if (response.data && response.data === "DUBLICATE") {
        toast.error("Do Not Allow Duplicate Type Code!");
      } else {
        toast.error("SaveOrUpdate failed.");
      }
    } catch (error) {
      console.error("Error saving TypeMaster data:", error);
      toast.error("Error while saving data!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cancel with improved functionality
  const handleCancel = () => {
    setSelectedModule("");
    setMasterList([]);
    setOriginalList([]);
    fetchData();
  };

  // ✅ Filter change for status
  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "1") {
      setMasterList(originalList.filter((item) => item.isActive === "1"));
    } else if (value === "0") {
      setMasterList(originalList.filter((item) => item.isActive === "0"));
    }
  };

  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Type Master");

      // ===== Column Widths =====
      const columnWidths = [25, 35, 25, 18];
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
      worksheet.mergeCells("B1:C1");
      const titleCell = worksheet.getCell("B1");
      titleCell.value = `Type Master\nGenerated On: ${moment().format(
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
          tl: { col: 3, row: 0 },
          br: { col: 4, row: 1 },
        });
      } catch {
        console.warn("Right logo not found");
      }

      // ===== Header Row =====
      const startRow = 3;
      const headers = [
        "Type Code",
        "Type Description",
        "Bin Quantity",
        "Status",
      ];

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
          item.typeCode || "",
          item.typeDescription || "",
          item.stantardQuantity ? Number(item.stantardQuantity).toLocaleString() : "",
          item.isActive === "1" ? "Active" : "Inactive",
        ];

        row.eachCell((cell, colNumber) => {
          cell.alignment = {
            horizontal: colNumber === 3 ? "right" : "center", // Right align Bin Quantity
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
        `Type_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
      
      // toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      // toast.error("Error exporting Type Master.");
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

        {/* 🔹 Filter Dropdown - Add Status filter */}
        <div className="p-3">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label fw-bold">
                <span className="text-danger">*</span>&nbsp;Status
              </label>
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
        </div>

        <div className="card-body p-3">
          {/* Loading Overlay */}
          {loading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <Loader />
            </div>
          )}

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
            // Update masterList immediately after cell editing stops
            onCellEditingStopped={(params) => {
              const updatedList = [...masterList];
              updatedList[params.rowIndex] = { ...params.data };
              setMasterList(updatedList);
            }}
          />

          <div className="text-center mt-4">
            <button
              onClick={onExportExcel}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={loading || masterList.length === 0}
            >
              Excel Export
            </button>
            <button
              type="submit"
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              onClick={createorUpdate}
              disabled={loading}
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn text-white"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypeMaster;
