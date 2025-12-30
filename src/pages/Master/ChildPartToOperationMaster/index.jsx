import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { Input, Button, Form, message } from "antd";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../serverAPI";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Loader from "../../../Utills/Loader";

const ChildPartToOperationMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [childPartOptions, setChildPartOptions] = useState([]);
  const [operationOptions, setOperationOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false); // 🔥 NEW: Track if dropdowns loaded

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
      // 🔥 Load options first, then data
      loadOptionsAndData();
    }
  }, [selectedModule, selectedScreen]);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = store.get("employeeId");

  // 🔥 NEW: Load dropdown options first, then grid data
  const loadOptionsAndData = async () => {
    try {
      setLoading(true);
      setOptionsLoaded(false);

      // Load both dropdown options in parallel
      await Promise.all([fetchChildParts(), fetchOperationMast()]);

      // Mark options as loaded
      setOptionsLoaded(true);

      // Now fetch the grid data
      await fetchData();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await serverApi.post("getoperationchildmappingdtl", {
        tenantId: tenantId,
        branchCode: branchCode,
      });

      if (!response.data || response.data.length === 0) {
        setMasterList([]);
        setOriginalList([]);
      } else {
        const updatedResponseData = response.data.map((item) => ({
          ...item,
          isUpdate: 1,
          changed: false,
        }));
        setMasterList(updatedResponseData);
        setOriginalList(structuredClone(updatedResponseData));
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

  const fetchOperationMast = async () => {
    try {
      const response = await serverApi.post("getOperationDropdown", {
        tenantId,
        branchCode,
        isActive: "1",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setOperationOptions(res.responseData);
      } else {
        setOperationOptions([]);
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
      toast.error("Error fetching Operation Details. Please try again later.");
    }
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  // const RequiredHeader = (props) => {
  //   return (
  //     <span>
  //       <span style={{ color: "red" }}>*</span> {props.displayName}
  //     </span>
  //   );
  // };

  // const RequiredHeaderRight = (props) => {
  //   return (
  //     <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", textAlign: "right" }}>
  //       <span style={{ color: "red" }}>*</span>
  //       <span>{props.displayName}</span>
  //     </div>
  //   );
  // };

  const RequiredHeader = (props) => {
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
     {
      headerName: "Operation Desc.",
      field: "operationId",
      editable: true,
      cellEditor: "agSelectCellEditor",
       headerComponent: RequiredHeader,
      cellEditorParams: {
        values: operationOptions.map((p) => p.operationId),
      },
      valueGetter: (params) => {
        return params.data.operationId;
      },
      valueSetter: (params) => {
        params.data.operationId = params.newValue;
        params.data.changed = true;
        return true;
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const found = operationOptions.find((p) => p.operationId === params.value);
        return found ? found.operationDesc : params.value;
      },
      filter: "agTextColumnFilter",
      filterValueGetter: (params) => {
        const found = operationOptions.find((p) => p.operationId === params.data.operationId);
        return found ? found.operationDesc : "";
      },
      
    },
    {
      headerName: "Child Part Desc. ",
      field: "childPartId",
      editable: true,
      cellEditor: "agSelectCellEditor",
       headerComponent: RequiredHeader,
      cellEditorParams: (params) => ({
        values: childPartOptions.map((p) => p.childPartId),
      }),
      valueGetter: (params) => {
        return params.data.childPartId;

      },
      valueSetter: (params) => {
  const newValue = params.newValue;
  params.data.changed = true;

  if (!newValue) {
    toast.error("Child Part Code is required!");
    return false;
  }

  const isDuplicate = masterList.some(
    (item, index) =>
      index !== params.node.rowIndex &&
      item.childPartId === newValue
  );

  if (isDuplicate) {
    const dupObj = childPartOptions.find(
      (p) => p.childPartId === newValue
    );

    toast.error(
      `Already mapped Child Part: ${
        dupObj ? dupObj.childPartDesc : newValue
      }`
    );
    return false; 
  }

  params.data.childPartId = newValue;
  return true;
},

      valueFormatter: (params) => {
        if (!params.value) return "";
        const found = childPartOptions.find((p) => p.childPartId === params.value);
        return found ? found.childPartDesc : params.value;
      },
      filter: "agTextColumnFilter",
      filterValueGetter: (params) => {
        const found = childPartOptions.find((p) => p.childPartId === params.data.childPartId);
        return found ? found.childPartDesc : "";
      },
    },

    {
      headerName: "Offset(Nos)",
      field: "offset",
      editable: true,
      filter: "agNumberColumnFilter",
      cellEditor: "agNumberCellEditor",
       headerComponent: RequiredHeader,
      cellEditorParams: {
        step: 1,
        min: 0,
      },
       valueSetter: (params) => {
    const value = params.newValue;
    params.data.changed = true;

    // allow only whole numbers
    if (!/^\d+$/.test(value)) {
      toast.error("Only numbers are allowed in Offset!");
      return false; // reject edit
    }

    params.data.offset = value;
    return true;
  },
      cellStyle: { textAlign: "right" },
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
        // when checkbox is clicked, set 1 for true, 0 for false
        params.data.status = params.newValue ? "1" : "0";
        params.data.changed = true;
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const opChildPartMapIdempty = masterList.filter((item) => !item.opChildPartMapId);
    console.log(opChildPartMapIdempty);
    if (opChildPartMapIdempty && opChildPartMapIdempty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);

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

          const firstColId = "operationId";
          api.setFocusedCell(lastRowIndex, firstColId);
          api.startEditingCell({
            rowIndex: lastRowIndex,
            colKey: firstColId,
          });
        }, 150);
      }, 100);
    } else {
      toast.error("Please enter the Map Id for all the rows.");
    }
  };

  const normalizeList = (list) => {
    return list.map((item) => ({
      ...item,
      isActive: item.isActive === "1" || item.isActive === 1 || item.isActive === true ? "1" : "0",
    }));
  };

  const hasChanges = () => {
    const normMaster = normalizeList(masterList);
    const normOriginal = normalizeList(originalList);
    return JSON.stringify(normMaster) !== JSON.stringify(normOriginal);
  };

  const createorUpdate = async () => {
    try {
      setLoading(true);
      gridRef.current.api.stopEditing();
      
      // if (!hasChanges()) {
      //   toast.info("No new or modified records found!");
      //   setLoading(false);
      //   return;
      // }

       const rowsToInsert = masterList.filter(row => row.isUpdate === "0" || row.isUpdate === 0);
              const rowsToUpdate = masterList.filter(row => row.changed === true && row.isUpdate !== "0" && row.isUpdate !== 0);
      
              console.log("masterList:", masterList);
              console.log("rowsToInsert:", rowsToInsert);
              console.log("rowsToUpdate:", rowsToUpdate);
      
              if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
                toast.info("No new or modified records found!");
                return;
              }

      // Duplicate ChildPartId check
      // const childPartIds = masterList.map((item) => item.childPartId);
      // const duplicateChildPartIds = childPartIds.filter(
      //   (id, index) => id && childPartIds.indexOf(id) !== index
      // );

      // if (duplicateChildPartIds.length > 0) {
      //   const duplicateId = duplicateChildPartIds[0];
      //   const dupObj = childPartOptions.find((item) => item.childPartId === duplicateId);
      //   const desc = dupObj ? dupObj.childPartDesc : duplicateId;
      //   toast.error(`Already Mapped This ChildPartDesc: ${desc}`);
      //   setLoading(false);
      //   return;
      // }

      // const invalidOffset = masterList.filter(
      //   (item) => !item.offset || !/^\d+$/.test(item.offset)
      // );

      // if (invalidOffset.length > 0) {
      //   toast.error("Offset must be a valid number!");
      //   setLoading(false);
      //   return;
      // }

      const invalidChildPart = masterList.filter((item) => !item.childPartId);
      const invalidOperation = masterList.filter((item) => !item.operationId);
      const invalidOffsetVal = masterList.filter((item) => !item.offset);


      if (invalidChildPart.length > 0 || invalidOperation.length > 0 || invalidOffsetVal.length > 0) {
        toast.error("Please fill all mandatory(*) fields");
        setLoading(false);
        return;
      }

      
      // if (invalidOperation.length > 0) {
      //   toast.error("Please fill OpertaionCode for all rows.");
      //   setLoading(false);
      //   return;
      // }

     
      // if (invalidOffsetVal.length > 0) {
      //   toast.error("Please fill Offset for all rows.");
      //   setLoading(false);
      //   return;
      // }

      const updatedList = masterList.map((item) => ({
        isUpdate: item.isUpdate,
        opChildPartMapId: item.opChildPartMapId,
        childPartId: item.childPartId,
        operationId: item.operationId,
        tenantId: tenantId,
        updatedBy: employeeId,
        branchCode: branchCode,
        offset: item.offset,
        status: item.status,
      }));

      const response = await serverApi.post("insertupdateoperationchildmapping", updatedList);

      if (response.data && response.data === "SUCCESS") {
        toast.success("Add/Update successfully!");
        await loadOptionsAndData(); //  Reload everything properly
      } else {
        toast.error("No Data To Save/Update");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("No Data To Save/Update!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
    loadOptionsAndData();
  };

 const handleFilterChange = (value) => {
  if (!value || value === "GetAll") {
    setMasterList(originalList);
  } else if (value === "Active") {
    setMasterList(originalList.filter((item) => item.status === "1"));
  } else if (value === "Inactive") {
    setMasterList(originalList.filter((item) => item.status === "0"));
  }
};


  const onExportExcelChildPartToOperationMaster = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Operation-ChildPartMapping");

    // ===== Column Widths =====
    const columnWidths = [20, 25, 35, 25, 35, 20, 15]; // Status column added
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
    worksheet.mergeCells("B1:F1");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = `Operation-ChildPartMapping\nGenerated On: ${moment().format(
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
        tl: { col: 6, row: 0 },
        br: { col: 7, row: 1 },
      });
    } catch {
      console.warn("Right logo not found");
    }

    // ===== Header Row =====
    const startRow = 3;
    const headers = [
      "Mapping ID",
      "Child Part Code",
      "Child Part Description",
      "Operation Code",
      "Operation Description",
      "Offset",
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

      const childPart = childPartOptions.find(
        (p) => p.childPartId === item.childPartId
      );
      const operation = operationOptions.find(
        (p) => p.operationId === item.operationId
      );

      row.values = [
        item.opChildPartMapId || "",
        childPart ? childPart.childPartId : item.childPartId || "",
        childPart ? childPart.childPartDesc : "",
        operation ? operation.operationId : item.operationId || "",
        operation ? operation.operationDesc : "",
        item.offset || "",
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
      `Operation-ChildPartMapping_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
    );
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Error exporting Operation-ChildPartMapping.");
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

         {/* Filter Dropdown */}
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

        <div className="card-body p-3" style={{ position: "relative" }}>
          {/*  Only render grid when options are loaded */}
          {optionsLoaded && (
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
              onCellEditingStopped={(params) => {
                const updatedList = [...masterList];
                updatedList[params.rowIndex] = { ...params.data };
                setMasterList(updatedList);
              }}
              overlayNoRowsTemplate="<span style='padding:10px; font-weight:600; color:#666;'>No data available</span>"
            />
          )}

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

          <div className="text-center mt-4">
            <button
              onClick={onExportExcelChildPartToOperationMaster}
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
    </div>
  );
};

export default ChildPartToOperationMaster;