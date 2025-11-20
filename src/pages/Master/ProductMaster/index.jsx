import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import { ModuleRegistry } from "ag-grid-community";
import {
  SetFilterModule,
  DateFilterModule,
  ExcelExportModule,
} from "ag-grid-enterprise";
import { Modal, Select, message } from "antd";
import { toast } from "react-toastify";
import {
  backendService,
  commonBackendService,
} from "../../../service/ToolServerApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";

ModuleRegistry.registerModules([
  SetFilterModule,
  DateFilterModule,
  ExcelExportModule,
]);

const ProductMaster = ({ modulesprop, screensprop }) => {
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
        setOriginalList(updated);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Error fetching data. Please try again later.");
    }
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  // ✅ Group Code Dropdown Editor (FIXED)
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
      setOriginalList(updatedList);
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

  const columnDefs = [
    {
      headerName: "Product Code",
      field: "productCode",
      filter: "agTextColumnFilter",
      editable: (params) => params.data.isUpdate === 0,
    },
    {
      headerName: "Product Description",
      field: "productDesc",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "UOM",
      field: "productUomCode",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Group Code",
      field: "groupCode", // ✅ Use groupCode instead of grpCode
      editable: true,
      cellEditor: GroupCodeDropdownEditor,
      cellRenderer: GroupCodeCellRenderer,
    },
    {
      headerName: "Operation Id",
      field: "operationDescription",
      editable: false,
      suppressNavigable: true,
      cellRenderer: OperationIdCellRenderer,
      cellStyle: { cursor: "pointer" },
    },
    {
      headerName: "IsActive",
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
      productUomCode: "",
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

    const productcodeempty = masterList.filter((item) => !item.productCode);
    if (productcodeempty.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      message.error("Please enter the Product code for all the rows.");
    }
  };

  // ✅ FIXED Update function
  const createorUpdate = async () => {
    try {
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
        toast.success("Data saved successfully!");

        // Refresh data after successful save
        fetchData();
      } else if (response === "DUBLICATE") {
        toast.warning("Duplicate Product Code not allowed!");
      } else {
        toast.error("Save or Update failed.");
      }
    } catch (error) {
      console.error("Error saving product data:", error);
      toast.error("Error while saving data!");
    }
  };

  const handleCancel = () => {
    fetchData();
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

      // === Column widths ===
      worksheet.getColumn(1).width = 20; // Product Code
      worksheet.getColumn(2).width = 30; // Product Description
      worksheet.getColumn(3).width = 15; // UOM
      worksheet.getColumn(4).width = 15; // Group Code
      worksheet.getColumn(5).width = 40; // Operation Description
      worksheet.getColumn(6).width = 12; // Is Active

      worksheet.getRow(1).height = 65;

      // === Valeo logo (left) ===
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
          br: { col: 1, row: 1 },
        });
      } catch (error) {
        console.warn("Left logo not found, continuing without it");
      }

      // === Title (center cell) ===
      const titleCell = worksheet.getCell("C1");

      // Filter data based on current selection from ORIGINAL LIST
      const currentFilter = "GetAll"; // You might want to track this state like in the previous example
      const dataToExport =
        currentFilter === "GetAll"
          ? originalList
          : currentFilter === "1"
          ? originalList.filter(
              (item) => item.isActive === "1" || item.isActive === 1
            )
          : originalList.filter(
              (item) => item.isActive === "0" || item.isActive === 0
            );

      const filterText =
        currentFilter === "GetAll"
          ? "All Records"
          : currentFilter === "1"
          ? "Active Records"
          : "Inactive Records";

      titleCell.value = `Product Master \n(${filterText})`;
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

      // === SmartRun logo (right) ===
      try {
        const logo2 = await fetch("/smartrunLogo.png");
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
      } catch (error) {
        console.warn("Right logo not found, continuing without it");
      }

      // === Table Header ===
      const startRow = 3;
      const headers = [
        "Product Code",
        "Product Description",
        "UOM",
        "Group Code",
        "Operation Description",
        "Is Active",
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
          fgColor: { argb: "FF305496" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // === Add Data Rows ===
      dataToExport.forEach((item, index) => {
        const rowNumber = startRow + index + 1;
        const row = worksheet.getRow(rowNumber);

        row.getCell(1).value = item.productCode || "";
        row.getCell(2).value = item.productDesc || "";
        row.getCell(3).value = item.productUomCode || "";
        row.getCell(4).value = item.groupCode || "";
        row.getCell(5).value = item.operationDescription || "";
        row.getCell(6).value =
          item.isActive === 1 || item.isActive === "1" || item.isActive === true
            ? "Active"
            : "Inactive";

        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // === AutoFilter ===
      if (dataToExport.length > 0) {
        worksheet.autoFilter = {
          from: { row: startRow, column: 1 },
          to: { row: startRow + dataToExport.length, column: headers.length },
        };
      }

      // === Save File ===
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `Product_Master_${filterText.replace(/\s+/g, "_")}_${new Date()
          .toISOString()
          .replace(/[-T:.Z]/g, "")
          .slice(0, 14)}.xlsx`
      );
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Error exporting Product Master report. Please try again.");
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
              <label className="form-label fw-bold">Search Filter</label>
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
            pagination={true}
            domLayout="autoHeight"
            singleClickEdit={true}
            onFirstDataRendered={autoSizeAllColumns}
            onCellValueChanged={(params) => {
              const updatedList = [...masterList];
              updatedList[params.rowIndex] = params.data;
              setMasterList(updatedList);
              setOriginalList(updatedList);
            }}
            onCellClicked={handlecellclicked}
          />

          <div className="text-center mt-4">
            <button
              onClick={onExportExcelProductMaster}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d" }}
            >
              Excel
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
          title={`Select Operation Ids for Product: ${
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
