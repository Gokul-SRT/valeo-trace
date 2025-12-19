import React, { useRef, useEffect, useState, forwardRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
// import "ag-grid-enterprise";
// import { ModuleRegistry } from "ag-grid-community";
// import { SetFilterModule, DateFilterModule } from "ag-grid-enterprise";
import { Select } from "antd";
import ServerApi from "../../../serverAPI";
import CommonserverApi from "../../../CommonserverApi";
import ExcelJS from "exceljs";
import moment from "moment";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import Loader from "../../../Utills/Loader";

// ModuleRegistry.registerModules([SetFilterModule, DateFilterModule]);

const tenantId = JSON.parse(localStorage.getItem("tenantId"));
const branchCode = JSON.parse(localStorage.getItem("branchCode"));
const employeeId = JSON.parse(localStorage.getItem("empID"));

// 🔹 Custom MultiSelect Cell Editor for Child Parts
const MultiSelectEditor = forwardRef((props, ref) => {
  const [selectedValues, setSelectedValues] = useState([]);

  useEffect(() => {
    if (props.data && props.colDef.field) {
      const initial = props.data[props.colDef.field];
      if (Array.isArray(initial)) {
        setSelectedValues(initial);
      } else if (typeof initial === "string" && initial.length > 0) {
        setSelectedValues(initial.split(",").map((v) => v.trim()));
      } else {
        setSelectedValues([]);
      }
    }
  }, [props.data, props.colDef.field]);

  React.useImperativeHandle(ref, () => ({
    getValue() {
      return selectedValues; // ✅ return as array
    },
  }));

  const handleChange = (values) => {
    setSelectedValues(values);
    props.data[props.colDef.field] = values; // ✅ store as array
  };

  return (
    <Select
      mode="multiple"
      value={selectedValues}
      style={{ width: "100%" }}
      onChange={handleChange}
      placeholder="Select Child Part Codes"
      options={props.values.map((item) => ({
        label: item.value,
        value: item.key,
      }))}
    />
  );
});

const ProductChildPartMapping = ({ modulesprop, screensprop, onCancel }) => {
  const [selectedScreen, setSelectedScreen] = useState("");
  const [mappingList, setMappingList] = useState([]);
  const [originalMappingList, setOriginalMappingList] = useState([]);
  const [productData, setProductData] = useState([]);
  const [childPartData, setChildPartData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const mappingGridRef = useRef(null);
  const [currentFilter, setCurrentFilter] = useState("GetAll");
  const [loading, setLoading] = useState(false);

  // 🔹 Initialize dropdowns and fetch mapping
  useEffect(() => {
    if (modulesprop && screensprop) {
      setSelectedScreen(screensprop || "Product to Child Part Mapping");
      getProductDropDown();
      getChildPartDropDown();
      fetchMappingData();
    }
  }, [modulesprop, screensprop]);

  // 🔹 Fetch Mapping Data
  const fetchMappingData = async () => {
    try {
      setLoading(true);
      const payload = { tenantId };
      const response = await ServerApi.post(
        "getProductChildPartMapDetails",
        payload
      );

      if (
        response?.data.responseCode === "200" &&
        Array.isArray(response?.data?.responseData)
      ) {
        const updatedData = response?.data?.responseData.map((item) => ({
          productCode: item.productCode || "",
          childPartId: Array.isArray(item.childPartId)
            ? item.childPartId
            : typeof item.childPartId === "string" &&
              item.childPartId.length > 0
            ? item.childPartId.split(",").map((i) => i.trim())
            : [],
          childPartDesc: Array.isArray(item.childPartDesc)
            ? item.childPartDesc
            : typeof item.childPartDesc === "string" &&
              item.childPartDesc.length > 0
            ? item.childPartDesc.split(",").map((i) => i.trim())
            : [],
          isActive: item.isActive !== undefined ? item.isActive : 1,
          isUpdate: "1",
        }));
        console.log("Fetched Mapping Data:", updatedData);
        setMappingList(updatedData);
        setOriginalMappingList(JSON.parse(JSON.stringify(updatedData))); // Deep copy
      } else {
        setMappingList([]);
        setOriginalMappingList([]);
      }
    } catch (error) {
      console.error("Error fetching mapping data:", error);
      setMappingList([]);
      setOriginalMappingList([]);
    } finally {
      setLoading(false); // ✅ stop loader
    }
  };

  // 🔹 Fetch Product Dropdown
  const getProductDropDown = async () => {
    try {
      const payload = { tenantId, branchCode, isActive: "1" };
      const response = await CommonserverApi.post(
        "getProductDropdown",
        payload
      );

      if (
        response?.data?.responseCode === "200" &&
        Array.isArray(response.data?.responseData)
      ) {
        const options = response.data?.responseData.map((item) => ({
          key: item.productCode,
          value: item.productCode,
        }));
        setProductData(options);
      } else {
        setProductData([]);
      }
    } catch (error) {
      console.error("Error fetching product dropdown:", error);
      setProductData([]);
    }
  };

  // 🔹 Fetch Child Part Dropdown
  const getChildPartDropDown = async () => {
    try {
      const payload = { tenantId, branchCode, isActive: "1" };
      const response = await CommonserverApi.post(
        "getChildPartDropDown",
        payload
      );

      if (
        response?.data?.responseCode === "200" &&
        Array.isArray(response.data?.responseData)
      ) {
        const options = response.data?.responseData.map((item) => ({
          key: item.childPartId,
          value: item.childPartDesc,
        }));
        setChildPartData(options);
      } else {
        setChildPartData([]);
      }
    } catch (error) {
      console.error("Error fetching child part dropdown:", error);
      setChildPartData([]);
    }
  };

  // 🔹 Auto-size columns
  const autoSizeAllColumns = (params) => {
    if (!params.columnApi?.getAllColumns) return;
    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  // 🔹 Column definitions
  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    resizable: true,
    minWidth: 150,
    flex: 1,
  };

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
          <span className="ag-header-cell-text">
            {" "}
            <span style={{ color: "red" }}>*</span>
            {props.displayName}
          </span>
        </div>
      </div>
    );
  };

  const mappingColumnDefs = [
    {
      headerName: "Product Code",
      field: "productCode",
      filter: "agTextColumnFilter",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: productData.map((item) => item.key),
      },
      valueFormatter: (params) => {
        const option = productData.find((item) => item.key === params.value);
        return option ? option.value : params.value;
      },
      headerComponent: RequiredHeader,
    },
    {
      headerName: "Child Part Code",
      field: "childPartId",
      filter: "agTextColumnFilter",
      editable: true,
      cellEditor: MultiSelectEditor,
      cellEditorParams: { values: childPartData },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const keys = Array.isArray(params.value)
          ? params.value
          : typeof params.value === "string"
          ? params.value.split(",")
          : [];
        return keys
          .map((k) => {
            const option = childPartData.find((item) => item.key === k.trim());
            return option ? option.value : k;
          })
          .join(", ");
      },
      headerComponent: RequiredHeader,
    },
    // {
    //   headerName: "Status",
    //   field: "isActive",
    //   editable: true,
    //   cellRenderer: "agCheckboxCellRenderer",
    //   cellEditor: "agCheckboxCellEditor",
    //   valueGetter: (params) => Number(params.data.isActive) === 1,
    //   valueSetter: (params) => {
    //     params.data.isActive = params.newValue ? 1 : 0;
    //     return true;
    //   },
    //   cellStyle: { textAlign: "center" },
    // },
  ];

  // 🔹 Add new mapping row
  const handleAddMappingRow = () => {
    const newRow = {
      productCode: "",
      childPartId: [],
      childPartDesc: [],
      isActive: 1,
      isUpdate: "0",
    };

    const updated = [...mappingList, newRow];
    setMappingList(updated);

    setTimeout(() => {
      const api = mappingGridRef.current?.api;
      if (api) {
        const totalPages = api.paginationGetTotalPages();
        const lastRowIndex = updated.length - 1;

        // Go to last page
        api.paginationGoToPage(totalPages - 1);

        setTimeout(() => {
          // Ensure last row is visible
          api.ensureIndexVisible(lastRowIndex, "bottom");

          // Flash last added row
          api.flashCells({
            rowNodes: [api.getDisplayedRowAtIndex(lastRowIndex)],
          });

          // Start editing first cell (productCode)
          api.startEditingCell({
            rowIndex: lastRowIndex,
            colKey: "productCode",
          });
        }, 150);
      }
    }, 100);
  };

  // 🔹 Filter handler
  const handleMappingFilterChange = (value) => {
    setCurrentFilter(value);
    if (!value || value === "GetAll") {
      setMappingList(originalMappingList);
    } else if (value === "Active") {
      setMappingList(
        originalMappingList.filter((item) => Number(item.isActive) === 1)
      );
    } else if (value === "Inactive") {
      setMappingList(
        originalMappingList.filter((item) => Number(item.isActive) === 0)
      );
    }
  };

  // 🔹 Cancel - reset to original
  const handleCancelMapping = () => {
    setMappingList(originalMappingList);
    if (onCancel) onCancel();
  };

  const onExportMappingExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Product Child Part Mapping");

      // ===== Column Widths =====
      const columnWidths = [30, 50];
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
      titleCell.value = `Product to Child Part Mapping Report\nGenerated On: ${moment().format(
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
      const startRow = 2;
      const headers = [
        "Product Code",
        "Child Part Codes",
        // "Status",
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
      mappingList.forEach((item, index) => {
        const rowNumber = startRow + index + 1;
        const row = worksheet.getRow(rowNumber);

        const childPartNames = Array.isArray(item.childPartId)
          ? item.childPartId
              .map((id) => {
                const opt = childPartData.find((c) => c.key === id);
                return opt ? opt.value : id;
              })
              .join(", ")
          : "";

        row.values = [
          item.productCode || "",
          childPartNames,
          // Number(item.isActive) === 1 ? "Active" : "Inactive",
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
        `Product_ChildPart_Mapping_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Product Child Part Mapping.");
    }
  };

  // 🔹 Insert or Update Mapping
  const insertUpdateMapping = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setLoading(true);

    try {
      // Stop any ongoing editing
      mappingGridRef.current?.api?.stopEditing();

      // ✅ Validate rows
      const invalidRow = mappingList.find(
        (item) => !item.productCode?.trim() || item.childPartId?.length === 0
      );
      console.log("Validating rows before save:", mappingList, invalidRow);
      if (invalidRow) {
        toast.info(
          "Please fill in both Product Code and Child Part Code for all rows before saving."
        );
        setIsSaving(false);
        return;
      }

      // Find new rows (isUpdate === "0")
      const newRows = mappingList.filter((item) => item.isUpdate === "0");

      // Find modified rows by comparing with originalMappingList
      const modifiedRows = mappingList.filter((currentRow) => {
        if (currentRow.isUpdate === "0") return false; // Skip new rows

        const originalRow = originalMappingList.find(
          (orig) => orig.productCode === currentRow.productCode
        );

        if (!originalRow) return false;

        // Compare all relevant fields
        return (
          currentRow.productCode !== originalRow.productCode ||
          JSON.stringify(currentRow.childPartId) !==
            JSON.stringify(originalRow.childPartId) ||
          currentRow.isActive !== originalRow.isActive
        );
      });

      // Combine new and modified rows
      const changedRows = [...newRows, ...modifiedRows];

      if (changedRows.length === 0) {
        toast.info("No new or modified rows to save.");
        setIsSaving(false);
        return;
      }

      console.log("Changed rows:", changedRows);

      // ✅ Prepare payload
      const dataToSend = changedRows.map((item) => ({
        productCode: item.productCode,
        childPartCode: Array.isArray(item.childPartId)
          ? item.childPartId
          : (item.childPartId || "").split(",").map((id) => id.trim()),
        tenantId,
        updatedBy: employeeId,
      }));

      console.log("Sending payload:", dataToSend);

      const response = await ServerApi.post(
        "insertAndUpdateProductChildPartMapDetails",
        dataToSend
      );

      if (response?.data?.responseCode === "200") {
        toast.success(
          response.data.responseDataMessage ||
            "Mapping data saved successfully!"
        );
        fetchMappingData();
      } else {
        toast.error("Failed to save records. Check console for details.");
      }
    } catch (error) {
      console.error("Error saving mapping data:", error);
      toast.error("Error while saving data!");
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
        {/* ✅ Header */}
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          <span style={{ fontSize: "1.1rem" }}>
            {selectedScreen || "Product to Child Part Mapping"}
          </span>
          <PlusOutlined
            onClick={handleAddMappingRow}
            title="Add Row"
            style={{
              fontSize: "22px",
              cursor: "pointer",
              color: "white",
              marginLeft: "auto",
            }}
          />
        </div>

        {/* 🔹 Filter Section */}
        {/* <div className="p-3">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                onChange={(e) => handleMappingFilterChange(e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div> */}

        {/* 🔹 AG Grid */}
        <div className="card-body p-3 ag-theme-alpine">
          <AgGridReact
            ref={mappingGridRef}
            rowData={mappingList}
            columnDefs={mappingColumnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            pagination
            domLayout="autoHeight"
            singleClickEdit={true}
            onFirstDataRendered={autoSizeAllColumns}
            onCellValueChanged={(params) => {
              const updatedList = [...mappingList];
              const rowIndex = params.rowIndex;

              if (rowIndex >= 0 && rowIndex < updatedList.length) {
                const row = updatedList[rowIndex];

                // Update the specific field that was changed
                if (params.colDef.field) {
                  row[params.colDef.field] = params.newValue;
                }

                // If it's not a new row, mark it as modified
                if (row.isUpdate !== "0") {
                  row.isUpdate = "1";
                }

                setMappingList(updatedList);
              }
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

          {/* 🔹 Action Buttons */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onExportMappingExcel}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
            >
              Excel Export
            </button>
            <button
              type="button"
              onClick={insertUpdateMapping}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Update"}
            </button>
            <button
              type="button"
              onClick={handleCancelMapping}
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

export default ProductChildPartMapping;
