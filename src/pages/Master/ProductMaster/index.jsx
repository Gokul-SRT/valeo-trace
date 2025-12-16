import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
// import "ag-grid-enterprise";
// import { ModuleRegistry } from "ag-grid-community";
// import {
//   SetFilterModule,
//   DateFilterModule,
//   ExcelExportModule,
// } from "ag-grid-enterprise";
import { Modal, Select, message } from "antd";
import { toast } from "react-toastify";
import {
  backendService,
  commonBackendService,
} from "../../../service/ToolServerApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Loader from "../../../Utills/Loader"

// ModuleRegistry.registerModules([
//   SetFilterModule,
//   DateFilterModule,
//   ExcelExportModule,
// ]);

const ProductMaster = ({ modulesprop, screensprop,onCancel }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [groupDropdown, setGroupDropdown] = useState([]);
  const [operationDropdown, setOperationDropdown] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const gridRef = useRef(null);
  const [currentFilter, setCurrentFilter] = useState("GetAll");
  const [loading, setLoading] = useState(false);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = JSON.parse(localStorage.getItem("empID"));

  // ✅ Fetch Group Dropdown
  useEffect(() => {
    const fetchGroupDropdown = async () => {
      try {
        const payload = { tenantId, branchCode };
        const response = await commonBackendService({
          requestPath: "getProductGrpDropdown",
          requestData: payload,
        });
        const data = response?.responseData || [];
        setGroupDropdown(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching group dropdown:", error);
        toast.error("Failed to load group dropdown values.");
      }
    };
    fetchGroupDropdown();
  }, [tenantId, branchCode]);

  // ✅ Fetch Operation Dropdown
  useEffect(() => {
    const fetchOperationDropdown = async () => {
      try {
        const payload = {
          isActive: "1",
          tenantId,
          branchCode,
        };

        const response = await backendService({
          requestPath: "getoperationMasterdtl",
          requestData: payload,
        });
        const data = response?.responseData || [];

        const formatted = data.map((item) => ({
          value: item.operationId,
          label: item.operationDesc,
        }));

        setOperationDropdown(formatted);
      } catch (error) {
        console.error("Error fetching Operation dropdown:", error);
        toast.error("Failed to load Operation Id dropdown values.");
      }
    };

    fetchOperationDropdown();
  }, [tenantId, branchCode]);

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
    if (selectedModule && selectedScreen) fetchData();
  }, [selectedModule, selectedScreen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await backendService({
        requestPath: "getproductmasterdtl",
        requestData: {
          isActive: "1",
          tenantId,
          branchCode,
        },
      });

      if (!response || response.length === 0) {
        setMasterList([]);
        setOriginalList([]);
      } else {
        // ✅ CORRECTED: Map API response fields to component fields
        const updated = response.map((item) => ({
          ...item,
          isUpdate: 1,
          // Map grpCode to groupCode for consistency
          groupCode: item.grpCode || "",
          groupId: item.grpId || "",
          // Handle operation data - convert to array format
          operationCodes: item.operationId ? [item.operationId] : [],
          operationDescription: item.operationDescription || "",
        }));
        console.log("Fetched and mapped data:", updated);
        setMasterList(updated);
       // setOriginalList(updated);
       setOriginalList(structuredClone(updated));
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Error fetching data. Please try again later.");
    }finally {
      setLoading(false); // ✅ Stop loader
    }
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  // ✅ Group Code Dropdown Editor (FIXED)
  /*
  const GroupCodeDropdownEditor = (props) => {
    const [selectedValue, setSelectedValue] = useState(props.value || "");

    useEffect(() => {
      setSelectedValue(props.value || "");
    }, [props.value]);

    const handleChange = (e) => {
      const value = e.target.value;
      setSelectedValue(value);

      const selectedGrp = groupDropdown.find((g) => g.grpCode === value);

      // ✅ Set both groupCode and groupId
      props.node.setDataValue("groupCode", selectedGrp?.grpCode || "");
      props.node.setDataValue("groupId", selectedGrp?.grpId || "");

      // Force refresh to show the selected value
      props.api.refreshCells({
        rowNodes: [props.node],
        columns: ["groupCode", "groupId"],
        force: true,
      });
    };

    return (
      <select
        value={selectedValue}
        onChange={handleChange}
        style={{ width: "100%", height: "100%" }}
        autoFocus
      >
        <option value="">Select Group Code</option>
        {groupDropdown.map((grp) => (
          <option key={grp.grpId} value={grp.grpCode}>
            {grp.grpCode}
          </option>
        ))}
      </select>
    );
  };
*/
const GroupCodeDropdownEditor = (props) => {
  const [selectedValue, setSelectedValue] = useState(props.value || "");

  useEffect(() => {
    setSelectedValue(props.value || "");
  }, [props.value]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
    // Do NOT setDataValue here; AG Grid will handle it when editing stops
  };

  // AG Grid calls this when editing stops to get the value
  useEffect(() => {
    return () => {
      const selectedGrp = groupDropdown.find((g) => g.grpCode === selectedValue);
      if (selectedGrp) {
        // Update both fields in the row
        props.node.setDataValue("groupCode", selectedGrp.grpCode);
        props.node.setDataValue("groupId", selectedGrp.grpId);
      }
    };
  }, [selectedValue, props.node]);

  return (
    <select
      value={selectedValue}
      onChange={handleChange}
      style={{ width: "100%", height: "100%" }}
      autoFocus
    >
      <option value="">Select Group Code</option>
      {groupDropdown.map((grp) => (
        <option key={grp.grpId} value={grp.grpCode}>
          {grp.grpCode}
        </option>
      ))}
    </select>
  );
};


  // ✅ Group Code Cell Renderer (NEW - to display selected value)
  const GroupCodeCellRenderer = (props) => {
    return <span>{props.value || ""}</span>;
  };

  // ✅ Operation Id Cell Renderer (FIXED)
  const OperationIdCellRenderer = (props) => {
    // Make sure we have an array of codes
    const rawCodes = props?.data.operationCodes || [];
    const operationCodes =
      typeof rawCodes[0] === "string"
        ? rawCodes[0].split(",") // split the comma-separated string
        : rawCodes;

    const getDescription = operationCodes
      .map((id) => {
        const op = operationDropdown.find((item) => item.value === id.trim());
        return op ? op.label : id;
      })
      .join(", ");

    console.log("Operation Descriptions:", getDescription);

    return <span title={getDescription}>{getDescription}</span>;
  };

  const handleOperationClick = (row) => {
    setEditingRow(row);
    const existingOps = Array.isArray(row.operationCodes)
      ? row.operationCodes
      : [];
    console.log("Existing operations:", existingOps);
    const latestOps =
      existingOps.length === 1 && typeof existingOps[0] === "string"
        ? existingOps[0].split(",").map((op) => op.trim())
        : existingOps;
    setSelectedOperations(latestOps);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    if (editingRow) {
      const updatedList = masterList.map((item) =>
        item.productCode === editingRow.productCode
          ? {
              ...item,
              operationCodes: selectedOperations,
              operationDescription: selectedOperations
                .map((opId) => {
                  const op = operationDropdown.find(
                    (item) => item.value === opId
                  );
                  return op ? op.label : opId;
                })
                .join(", "),
              isUpdate: 1,
            }
          : item
      );
      setMasterList(updatedList);
     // setOriginalList(updatedList);
      setIsModalOpen(false);
      setSelectedOperations([]);
      setEditingRow(null);
      gridRef.current?.api.refreshCells({ force: true });
      toast.success("Operations updated successfully!");
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedOperations([]);
    setEditingRow(null);
  };

  const RequiredHeader = (props) => {
    return (
      <span>
        <span style={{ color: "red" }}>*</span> {props.displayName}
      </span>
    );
  };

  const columnDefs = [
    {
      headerName: "Product Code",
      field: "productCode",
      filter: "agTextColumnFilter",
      // headerComponent: RequiredHeader,
      editable: (params) => params.data.isUpdate === 0,
    },
    {
      headerName: "Product Description",
      field: "productDesc",
      filter: "agTextColumnFilter",
      // headerComponent: RequiredHeader,
    },
    // {
    //   headerName: "UOM",
    //   field: "productUomCode",
    //   filter: "agTextColumnFilter",
    // },
    {
      headerName: "Group Code",
      field: "groupCode", // ✅ Use groupCode instead of grpCode
      editable: true,
      // headerComponent: RequiredHeader,
      cellEditor: GroupCodeDropdownEditor,
      cellRenderer: GroupCodeCellRenderer,
    },
    {
      headerName: "Operations",
      field: "operationDescription",
      editable: false,
      suppressNavigable: true,
      // headerComponent: RequiredHeader,
      cellRenderer: OperationIdCellRenderer,
      cellStyle: { cursor: "pointer" },
    },
    {
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
    },
  ];

  const handleAddRow = () => {
  const emptyRow = {
    isUpdate: 0,
    productCode: "",
    productDesc: "",
   // productUomCode: "",
    groupCode: "",
    groupId: "",
    operationCodes: [],
    operationDescription: "",
    isActive: "1",
    productCategoryCode: "FG",
    isInventory: "0",
    tenantId,
    branchCode,
    updatedBy: employeeId,
  };

  // Check if there is any row with empty productCode
  const productCodeEmpty = masterList.filter((item) => !item.productCode);
  if (productCodeEmpty.length > 0) {
    message.error("Please enter the Product code for all the rows.");
    return;
  }

  const updated = [...masterList, emptyRow];
  setMasterList(updated);
  setOriginalList(updated);

  // Scroll to last page and focus new row after a small delay
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

      // Focus and start editing on Product Code column
      const firstColId = "productCode"; // field name of first editable column
      api.setFocusedCell(lastRowIndex, firstColId);
      api.startEditingCell({
        rowIndex: lastRowIndex,
        colKey: firstColId,
      });
    }, 150);
  }, 100);
};


// Normalize each row for comparison
/*
const normalizeItem = (item) => ({
  productCode: item.productCode?.trim() || "",
  productDesc: item.productDesc?.trim() || "",
  groupCode: item.grpCode || "",
  groupId: item.grpId || "",
  isActive:
    item.isActive === "1" || item.isActive === 1 || item.isActive === true
      ? "1"
      : "0",
      operationId: Array.isArray(item.operationId)
    ? item.operationId.map((op) => op.trim()).sort()
    : item.operationId
    ? item.operationId.split(",").map((op) => op.trim()).sort()
    : [],
});

// Check if masterList has any changes compared to originalList
const hasChanges = () => {
  if (!masterList || !originalList || masterList.length !== originalList.length)
    return true;

  for (let i = 0; i < masterList.length; i++) {
    const m = normalizeItem(masterList[i]);
    const o = normalizeItem(originalList[i]);

    if (
      m.productCode !== o.productCode ||
      m.productDesc !== o.productDesc ||
      m.grpCode !== o.grpCode ||
      m.grpId !== o.grpId ||
      m.isActive !== o.isActive ||
      m.operationId.length !== o.operationId.length ||
      m.operationId.some((val, idx) => val !== o.operationId[idx])
    ) {
      return true; // found a difference
    }
  }

  return false; // no changes
};

*/

const normalizeList = (list) => {
  return list.map(item => ({
    ...item,
    isActive: item.isActive === "1" || item.isActive === 1 || item.isActive === true ? "1" : "0"
  }));
};

const hasChanges = () => {
  const normMaster = normalizeList(masterList);
  const normOriginal = normalizeList(originalList);
  return JSON.stringify(normMaster) !== JSON.stringify(normOriginal);
};



  // ✅ FIXED Update function
  const createorUpdate = async () => {
    try {
      setLoading(true);
      gridRef.current.api.stopEditing();
      if (!hasChanges()) {
        toast.error("Change any one field before saving.");
        return;
      }

      // Validate data before sending
      const invalidRows = masterList.filter(
        (item) =>
          item.isUpdate === 0 && (!item.productCode || !item.productDesc)
      );

      if (invalidRows.length > 0) {
        toast.error(
          "Please fill Product Code and Description for all new rows."
        );
        return;
      }


      const invalidGroupCode = masterList.filter(
        (item) =>
          item.isUpdate === 0 && (!item.groupCode || item.groupCode.trim() === "")
      );

      if (invalidGroupCode.length > 0) {
        toast.error(
          "Please fill GroupCode for all new rows."
        );
        return;
      }

      const invalidOperation = masterList.filter(
        (item) =>
          item.isUpdate === 0 && (!item.operationDescription || item.operationDescription.trim() === "")
      );

      if (invalidOperation.length > 0) {
        toast.error(
          "Please fill Operations for all new rows."
        );
        return;
      }



      const productCodes=masterList.map((item)=> item.productCode.trim());
      const duplicateCodes=productCodes.filter((code,index)=> productCodes.indexOf(code) !== index);

      if (duplicateCodes.length > 0) {
        toast.error(`Duplicate Product Code found: ${duplicateCodes[0]}`);
        return;
      }

      const updatedList = masterList.map((item) => {
        const matchedGroup = groupDropdown.find(
          (grp) => grp.grpCode === item.groupCode
        );

        let operationCodes = [];

        if (Array.isArray(item.operationCodes)) {
          // Handle case like ["O0007,O0006"]
          if (
            item.operationCodes.length === 1 &&
            typeof item.operationCodes[0] === "string" &&
            item.operationCodes[0].includes(",")
          ) {
            operationCodes = item.operationCodes[0]
              .split(",")
              .map((s) => s.trim());
          } else {
            // Already proper array
            operationCodes = item.operationCodes.map((s) => s.trim());
          }
        } else if (
          typeof item.operationCodes === "string" &&
          item.operationCodes.trim() !== ""
        ) {
          // Handle plain string like "O0007,O0006"
          operationCodes = item.operationCodes.split(",").map((s) => s.trim());
        }

        console.log("After fix:", operationCodes);
        // ✅ Prepare data for API - convert back to expected field names
        const payload = {
          isUpdate: item.isUpdate,
          productCode: item.productCode,
          productCategoryCode: "FG",
          productUomCode: item.productUomCode,
          productDesc: item.productDesc,
          grpCode: item.groupCode || "", // ✅ Send as grpCode
          groupId: matchedGroup ? matchedGroup.grpId : item.groupId || "", // ✅ Send as grpId
          operationCodes: operationCodes,
          operationDescription: item.operationDescription || "",
          tenantId,
          isActive: item.isActive,
          updatedBy: employeeId,
          branchCode,
          isInventory: item.isInventory || "0",
        };

        return payload;
      });

      console.log("Sending data to API:", updatedList);

      const response = await backendService({
        requestPath: "insertupdateproductmaster",
        requestData: updatedList,
      });

      if (response === "SUCCESS") {
        toast.success("Add/Update successfully!");

        // Refresh data after successful save
        fetchData();
      } else if (response === "DUBLICATE") {
        toast.warning("Duplicate Product Code not allowed!");
      } else {
        toast.error("Add/Update failed");
      }
    } catch (error) {
      console.error("Error saving product data:", error);
      toast.error("Error while saving data!");
    }finally {
      setLoading(false); // ✅ Stop loader
    }
  };

  const handleCancel = () => {
    fetchData();
    if (onCancel) onCancel();
  };

  const handleFilterChange = (value) => {
    if (value === "GetAll" || !value) setMasterList(originalList);
    else if (value === "1")
      setMasterList(originalList.filter((item) => item.isActive === "1"));
    else setMasterList(originalList.filter((item) => item.isActive === "0"));
  };

  const onExportExcelProductMaster = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Product Master");

    // ===== Column Setup =====
    worksheet.columns = [
      { width: 20 }, // Product Code
      { width: 30 }, // Product Description
      { width: 15 }, // Group Code
      { width: 40 }, // Operation Description
      { width: 15 }, // Status
    ];

    // ===== Logo + Title Row =====
    worksheet.getRow(1).height = 50;

    // Left Logo
    try {
      const logo1 = await fetch("/pngwing.com.png");
      const blob1 = await logo1.blob();
      const arr1 = await blob1.arrayBuffer();
      const imageId1 = workbook.addImage({
        buffer: arr1,
        extension: "png",
      });
      worksheet.addImage(imageId1, {
        tl: { col: 0, row: 0 },
        ext: { width: 120, height: 40 },
      });
    } catch {
      console.warn("Left logo not found");
    }

    // Title
    worksheet.mergeCells("B1:D1");
    const titleCell = worksheet.getCell("B1");
    titleCell.value = `Product Master\nGenerated: ${moment().format(
      "DD/MM/YYYY HH:mm"
    )}`;
    titleCell.font = { bold: true, size: 14, color: { argb: "FF00264D" } };
    titleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    // Right Logo
    try {
      const logo2 = await fetch("/smartrunLogo.png");
      const blob2 = await logo2.blob();
      const arr2 = await blob2.arrayBuffer();
      const imageId2 = workbook.addImage({
        buffer: arr2,
        extension: "png",
      });
       worksheet.addImage(imageId2, {
          tl: { col: 2, row: 0 },
          br: { col: 5, row: 1.6 },
      });
    } catch {
      console.warn("Right logo not found");
    }

    // ===== Table Header =====
    const headerRowIndex = 3;
    const headers = [
      "Product Code",
      "Product Description",
      "Group Code",
      "Operation Description",
      "Status",
    ];

    worksheet.getRow(headerRowIndex).height = 25;

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRowIndex, index + 1);
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

    // ===== Filtered Data =====
    const dataToExport =
      currentFilter === "GetAll"
        ? originalList
        : currentFilter === "1"
        ? originalList.filter((i) => i.isActive === "1")
        : originalList.filter((i) => i.isActive === "0");

    // ===== Data Rows =====
    dataToExport.forEach((item, index) => {
      const rowIndex = headerRowIndex + index + 1;
      const row = worksheet.getRow(rowIndex);
      row.height = 20;

      row.values = [
        item.productCode || "",
        item.productDesc || "",
        item.groupCode || "",
        item.operationDescription || "",
        item.isActive === "1" ? "Active" : "Inactive",
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
    if (dataToExport.length > 0) {
      worksheet.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: {
          row: headerRowIndex + dataToExport.length,
          column: headers.length,
        },
      };
    }

    // ===== Export File =====
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Product_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
    );
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error("Error exporting Product Master.");
  }
};


  const handlecellclicked = (params) => {
    console.log("cell clicked", params);
    if (params.colDef.field === "operationDescription") {
      handleOperationClick(params.data);
    }
  };

  useEffect(() => {
    console.log("selectedOperations", selectedOperations);
  }, [selectedOperations]);
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
              <label className="form-label fw-bold"><span className="text-danger">*</span>&nbsp;Status</label>
              <select
                className="form-select"
                value={currentFilter}
                onChange={(e) => {
                  setCurrentFilter(e.target.value);
                  handleFilterChange(e.target.value);
                }}
              >
                <option value="GetAll">Get All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </div>

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
            // onCellValueChanged={(params) => {
            //   const updatedList = [...masterList];
            //   updatedList[params.rowIndex] = params.data;
            //   setMasterList(updatedList);
            //  // setOriginalList(updatedList);
            // }}
             onCellClicked={handlecellclicked}
            onCellEditingStopped={(params) => {
              const updatedList = [...masterList];
              updatedList[params.rowIndex] = { ...params.data }; // copy updated row
              setMasterList(updatedList);
            }}
          />
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
              onClick={onExportExcelProductMaster}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d" }}
            >
              Excel Export
            </button>
            <button
              type="submit"
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d" }}
              onClick={createorUpdate}
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn text-white"
              style={{ backgroundColor: "#00264d" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modal for Operation Id multi-select */}
      {isModalOpen && (
        <Modal
          title={`Select Single or Multiple Operations: ${
            editingRow?.productCode || "New Product"
          }`}
          open={isModalOpen}
          onOk={handleModalSave}
          onCancel={handleModalCancel}
          okText="Save"
          cancelText="Cancel"
        >
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Select Operation Ids"
            value={selectedOperations}
            onChange={setSelectedOperations}
            options={operationDropdown}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductMaster;
