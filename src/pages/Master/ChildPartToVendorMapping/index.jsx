import React, { useRef, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Loader from "../../../Utills/Loader";


const ChildPartToVendorMapping = () => {
  const [masterList, setMasterList] = useState([]);
  const [childPartData, setChildPartData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [loading, setLoading] = useState(false);

  const gridRef = useRef(null);

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi.getAllColumns().map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  useEffect(() => {
    loadStaticData();
  }, []);

  const loadStaticData = () => {
    // Static Child Part Data
    const staticChildParts = [
      { childPartId: "CP001", childPartCode: "CHLD-001", childPartDesc: "Engine Component A" },
      { childPartId: "CP002", childPartCode: "CHLD-002", childPartDesc: "Transmission Part B" },
      { childPartId: "CP003", childPartCode: "CHLD-003", childPartDesc: "Brake System C" },
      { childPartId: "CP004", childPartCode: "CHLD-004", childPartDesc: "Suspension Unit D" },
      { childPartId: "CP005", childPartCode: "CHLD-005", childPartDesc: "Steering Component E" },
    ];

    // Static Vendor Data
    const staticVendors = [
      { vendorId: "V001", vendorCode: "VND-001", vendorName: "Auto Parts Supply Co." },
      { vendorId: "V002", vendorCode: "VND-002", vendorName: "Premium Components Ltd." },
      { vendorId: "V003", vendorCode: "VND-003", vendorName: "Global Manufacturing Inc." },
      { vendorId: "V004", vendorCode: "VND-004", vendorName: "Quality Parts Supplier" },
      { vendorId: "V005", vendorCode: "VND-005", vendorName: "Industrial Solutions Corp." },
    ];

    // Static Mapping Data
    const staticMappings = [
      {
        childVendorMapId: "CVM001",
        childPartId: "CP001",
        vendorId: "V001",
        isUpdate: 1,
      },
      {
        childVendorMapId: "CVM002",
        childPartId: "CP002",
        vendorId: "V002",
        isUpdate: 1,
      },
      {
        childVendorMapId: "CVM003",
        childPartId: "CP003",
        vendorId: "V003",
        isUpdate: 1,
      },
    ];

    setChildPartData(staticChildParts);
    setVendorData(staticVendors);
    setMasterList(staticMappings);
    setOriginalList(JSON.parse(JSON.stringify(staticMappings)));
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
    {
      headerName: "S.No",
      valueGetter: (params) => params.node.rowIndex + 1,
      editable: false,
      filter: true,
      maxWidth: 100,
    },
    {
      headerName: "Child Part Code *",
      field: "childPartId",
      filter: "agTextColumnFilter",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: (params) => ({
        values: childPartData.map((p) => p.childPartId),
      }),
      valueGetter: (params) => {
        return params.data.childPartId;
      },
      valueSetter: (params) => {
        params.data.childPartId = params.newValue;
        return true;
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const found = childPartData.find((p) => p.childPartId === params.value);
        return found ? `${found.childPartCode}-${found.childPartDesc}` : params.value;
      },
      filterValueGetter: (params) => {
        const found = childPartData.find((p) => p.childPartId === params.data.childPartId);
        return found ? `${found.childPartCode}-${found.childPartDesc}` : "";
      },
    },
    {
      headerName: "Vendor Code *",
      field: "vendorId",
      filter: "agTextColumnFilter",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: vendorData.map((item) => item.vendorId),
      },
      valueGetter: (params) => {
        return params.data.vendorId;
      },
      valueSetter: (params) => {
        params.data.vendorId = params.newValue;
        return true;
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const option = vendorData.find((item) => item.vendorId === params.value);
        return option ? `${option.vendorCode}-${option.vendorName}` : params.value;
      },
      filterValueGetter: (params) => {
        const option = vendorData.find((item) => item.vendorId === params.data.vendorId);
        return option ? `${option.vendorCode}-${option.vendorName}` : "";
      },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const emptyRows = masterList.filter((item) => !item.childVendorMapId);
    
    if (emptyRows.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);

      setTimeout(() => {
        const api = gridRef.current?.api;
        if (!api) return;

        const lastRowIndex = updated.length - 1;
        api.paginationGoToLastPage();

        setTimeout(() => {
          api.ensureIndexVisible(lastRowIndex, "bottom");
          api.flashCells({
            rowNodes: [api.getDisplayedRowAtIndex(lastRowIndex)],
          });

          const firstColId = "childPartId";
          api.setFocusedCell(lastRowIndex, firstColId);
          api.startEditingCell({
            rowIndex: lastRowIndex,
            colKey: firstColId,
          });
        }, 150);
      }, 100);
    } else {
      alert("Please complete all empty rows before adding a new one.");
    }
  };

  const showToast = (message, type = "info") => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const hasChanges = () => {
    return JSON.stringify(masterList) !== JSON.stringify(originalList);
  };

  const createOrUpdate = () => {
    try {
      setLoading(true);
      gridRef.current.api.stopEditing();

      if (!hasChanges()) {
        showToast("Change any one field before saving.", "error");
        setLoading(false);
        return;
      }

      // Duplicate ChildPartId check
      const childPartIds = masterList.map((item) => item.childPartId);
      const duplicateChildPartIds = childPartIds.filter(
        (id, index) => id && childPartIds.indexOf(id) !== index
      );

      if (duplicateChildPartIds.length > 0) {
        const duplicateId = duplicateChildPartIds[0];
        const dupObj = childPartData.find((item) => item.childPartId === duplicateId);
        const desc = dupObj ? `${dupObj.childPartCode}-${dupObj.childPartDesc}` : duplicateId;
        showToast(`Already Mapped This Child Part: ${desc}`, "error");
        setLoading(false);
        return;
      }

      // Validate required fields
      const invalidChildPart = masterList.filter((item) => !item.childPartId);
      if (invalidChildPart.length > 0) {
        showToast("Please fill Child Part Code for all rows.", "error");
        setLoading(false);
        return;
      }

      const invalidVendor = masterList.filter((item) => !item.vendorId);
      if (invalidVendor.length > 0) {
        showToast("Please fill Vendor Code for all rows.", "error");
        setLoading(false);
        return;
      }

      // Generate IDs for new rows
      const updatedList = masterList.map((item) => {
        if (item.isUpdate === 0) {
          const newId = `CVM${String(masterList.length + 1).padStart(3, '0')}`;
          return {
            ...item,
            childVendorMapId: newId,
            isUpdate: 1,
          };
        }
        return item;
      });

      setMasterList(updatedList);
      setOriginalList(JSON.parse(JSON.stringify(updatedList)));
      
      showToast("Add/Update successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Error saving data:", error);
      showToast("Error while saving data!");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    loadStaticData();
  };

  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Child Part To Vendor Mapping");

      const columnWidths = [10, 30, 40];
      columnWidths.forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      worksheet.getRow(1).height = 50;

      const titleCell = worksheet.getCell("B1");
      const currentDate = new Date().toLocaleString();
      titleCell.value = `Child Part To Vendor Mapping\nGenerated On: ${currentDate}`;
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

      const startRow = 3;
      const headers = ["S.No", "Child Part Code", "Vendor Code"];

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

      masterList.forEach((item, index) => {
        const rowNumber = startRow + index + 1;
        const row = worksheet.getRow(rowNumber);

        const childPart = childPartData.find((p) => p.childPartId === item.childPartId);
        const vendor = vendorData.find((v) => v.vendorId === item.vendorId);

        row.values = [
          index + 1,
          childPart ? `${childPart.childPartCode}-${childPart.childPartDesc}` : "",
          vendor ? `${vendor.vendorCode}-${vendor.vendorName}` : "",
        ];

        const snoCell = row.getCell(1);
        snoCell.alignment = { horizontal: "center", vertical: "middle" };
        snoCell.font = { bold: true };

        row.eachCell({ includeEmpty: true }, (cell) => {
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

      worksheet.views = [{ state: "frozen", ySplit: startRow }];

      worksheet.autoFilter = {
        from: { row: startRow, column: 1 },
        to: { row: startRow, column: headers.length },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `Child_Part_To_Vendor_Mapping_${timestamp}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      showToast("Error exporting to Excel.", "error");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ 
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)", 
        borderRadius: "6px",
        backgroundColor: "white"
      }}>
        <div
          style={{
            backgroundColor: "#00264d",
            color: "white",
            padding: "15px 20px",
            fontWeight: "bold",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px",
          }}
        >
          Child Part To Vendor Mapping Details
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer" }}
            onClick={handleAddRow}
            title="Add Row"
          />
        </div>

        <div style={{ padding: "20px", position: "relative" }}>
          <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
            <AgGridReact
              ref={gridRef}
              rowData={masterList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              pagination
              domLayout="normal"
              singleClickEdit={true}
              onFirstDataRendered={autoSizeAllColumns}
              onCellEditingStopped={(params) => {
                const updatedList = [...masterList];
                updatedList[params.rowIndex] = { ...params.data };
                setMasterList(updatedList);
              }}
              overlayNoRowsTemplate="<span style='padding:10px; font-weight:600; color:#666;'>No data available</span>"
            />
          </div>

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
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>Loading...</div>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={onExportExcel}
              style={{
                backgroundColor: "#00264d",
                color: "white",
                border: "none",
                padding: "10px 20px",
                marginRight: "10px",
                minWidth: "90px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              Excel Export
            </button>
            <button
              onClick={createOrUpdate}
              style={{
                backgroundColor: "#00264d",
                color: "white",
                border: "none",
                padding: "10px 20px",
                marginRight: "10px",
                minWidth: "90px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              Update
            </button>
            <button
              onClick={handleCancel}
              style={{
                backgroundColor: "#00264d",
                color: "white",
                border: "none",
                padding: "10px 20px",
                minWidth: "90px",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildPartToVendorMapping;