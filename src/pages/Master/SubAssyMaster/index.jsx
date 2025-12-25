import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import store from "store";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import serverApi from "../../../serverAPI";
import Loader from "../../../Utills/Loader";

const SubAssyMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [childPartOptions, setChildPartOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const gridRef = useRef(null);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = store.get("employeeId");

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;

    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  useEffect(() => {
    setSelectedModule(modulesprop || "Default Module");
    setSelectedScreen(screensprop || "SubChild Part Master");
  }, [modulesprop, screensprop]);

  // Initialize data when component mounts
  useEffect(() => {
    if (selectedModule && selectedScreen) {
      loadOptionsAndData();
    }
  }, [selectedModule, selectedScreen]);

  const loadOptionsAndData = async () => {
    try {
      setLoading(true);
      setOptionsLoaded(false);

      // Load dropdown options first
      await fetchChildParts();

      // Now fetch the grid data
      await fetchSubChildPartDetails();

      // Mark options as loaded
      setOptionsLoaded(true);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubChildPartDetails = async () => {
    try {
      const payload = {
        tenantId,
        branchCode,
      };

      const response = await serverApi.post("getSubChildPartDetails", payload);

      if (response?.data?.responseCode === "200") {
        const apiData = response.data.responseData || [];

        // Map backend response to grid structure
        const transformedData = apiData.map((item) => {
          // Find the child part option that matches the childPartCode from API
          const childPartOption = childPartOptions.find(
            (option) => option.childPartCode === item.childPartCode
          );

          return {
            id: item.kitPartId || "", // Using kitPartId as primary key
            kitPartCode: item.kitPartCode || "",
            kitPartDesc: item.kitPartDesc || "",
            childPartCode: item.childPartCode || "", // Store code for API
            childPartId: item.childPartId,
            childPartDesc: childPartOption
              ? `${childPartOption.childPartCode} - ${childPartOption.childPartDesc}`
              : item.childPartDesc || "", // Display description
            isActive: item.status || "1",
            isUpdate: 1,
          };
        });

        setMasterList(transformedData);
        setOriginalList(structuredClone(transformedData));
      } else {
        toast.warning("No data found");
        setMasterList([]);
        setOriginalList([]);
      }
    } catch (error) {
      console.error("SubChildPart fetch error:", error);
      toast.error("Failed to load Sub Child Part data");
    }
  };

  const fetchChildParts = async () => {
    try {
      const payload = {
        tenantId,
        branchCode,
        isActive: "1",
      };
      const response = await serverApi.post("getChildPartDropDown", payload);

      if (
        response?.data?.responseCode === "200" &&
        response.data.responseData
      ) {
        // Store both code and description for mapping
        const options = response.data.responseData.map((option) => ({
          childPartCode: option.childPartCode || "",
          childPartDesc: option.childPartDesc || "",
          childPartId: option.childPartId,
          displayText:
            `${option.childPartCode} - ${option.childPartDesc}` || "",
        }));
        setChildPartOptions(options);
        console.log("Child part options loaded:", options);
      } else {
        setChildPartOptions([]);
        toast.error(
          response?.data?.responseMessage || "Failed to load Child Parts."
        );
      }
    } catch (error) {
      console.error("Error fetching child part dropdown data:", error);
      toast.error("Error fetching data. Please try again later.");
      setChildPartOptions([]);
    }
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
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
            {props.displayName} <span style={{ color: "red" }}>*</span>
          </span>
        </div>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "S.No",
      valueGetter: (params) => params.node.rowIndex + 1,
      editable: false,
      filter: true,
      maxWidth: 100,
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "SubChild Part Code",
      field: "kitPartCode",
      filter: "agTextColumnFilter",
      headerComponent: RequiredHeader,
      editable: (params) => params.data.isUpdate === 0,
      valueSetter: (params) => {
        const newValue = params.newValue?.trim();

        if (!newValue) {
          toast.error("SubChild Part Code is required!");
          return false;
        }

        const isDuplicate = masterList.some(
          (item) =>
            item.kitPartCode &&
            item.kitPartCode.toString().toLowerCase() === newValue.toLowerCase()
        );

        if (isDuplicate) {
          toast.error(`"${newValue}" already exists!`);
          return false;
        }

        params.data.kitPartCode = newValue;
        params.data.changed = true;
        return true;
      },
    },

    {
      headerName: "SubChild Part Description",
      field: "kitPartDesc",
      filter: "agTextColumnFilter",
      headerComponent: RequiredHeader,
    },
    {
      headerName: "Child Part",
      field: "childPartDesc",
      editable: true,
      cellEditor: "agSelectCellEditor",
      headerComponent: RequiredHeader,
      cellEditorParams: {
        values: childPartOptions.map((option) => option.displayText),
      },
      valueGetter: (params) => {
        // Return the display value
        return params.data.childPartDesc || "";
      },
      valueSetter: (params) => {
        const selectedValue = params.newValue;
        if (selectedValue) {
          // Find the selected option
          const selectedOption = childPartOptions.find(
            (option) => option.displayText === selectedValue
          );

          if (selectedOption) {
            params.data.childPartCode = selectedOption.childPartCode;
            params.data.childPartId = selectedOption.childPartId;
            params.data.childPartDesc = selectedOption.displayText;
          } else {
            // If not found in options, try to parse the value
            const parts = selectedValue.split(" - ");
            if (parts.length >= 2) {
              params.data.childPartCode = parts[0];
              params.data.childPartDesc = selectedValue;
            } else {
              params.data.childPartCode = selectedValue;
              params.data.childPartDesc = selectedValue;
            }
          }
        } else {
          params.data.childPartCode = "";
          params.data.childPartDesc = "";
          params.data.childPartId = "";
        }
        return true;
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        return params.value;
      },
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Status",
      field: "isActive",
      filter: true,
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

  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
      kitPartCode: "",
      kitPartDesc: "",
      childPartCode: "",
      childPartId: 0,
      childPartDesc: "",
      isActive: "1",
    };

    const emptyRows = masterList.filter((item) => !item.id);

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

          const firstColId = "kitPartCode";
          api.setFocusedCell(lastRowIndex, firstColId);
          api.startEditingCell({
            rowIndex: lastRowIndex,
            colKey: firstColId,
          });
        }, 150);
      }, 100);
    } else {
      toast.error("Please complete all empty rows before adding a new one.");
    }
  };

  const normalizeList = (list) => {
    return list.map((item) => ({
      ...item,
      isActive:
        item.isActive === "1" || item.isActive === 1 || item.isActive === true
          ? "1"
          : "0",
      kitPartCode: item.kitPartCode ? item.kitPartCode.trim() : "",
      kitPartDesc: item.kitPartDesc ? item.kitPartDesc.trim() : "",
      childPartCode: item.childPartCode ? item.childPartCode.trim() : "",
      childPartDesc: item.childPartDesc ? item.childPartDesc.trim() : "",
      childPartId: item.childPartId,
    }));
  };

  const hasChanges = () => {
    const normMaster = normalizeList(masterList);
    const normOriginal = normalizeList(originalList);
    return JSON.stringify(normMaster) !== JSON.stringify(normOriginal);
  };

  const createOrUpdate = async () => {
    try {
      setLoading(true);

      // Stop any ongoing editing
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
      }

      // Check if there are any changes
      if (!hasChanges()) {
        toast.error("Change any one field before saving.");
        setLoading(false);
        return;
      }

      // Check for empty rows that shouldn't be submitted
      // const invalidRows = masterList.filter((item) =>
      //   (!item.kitPartCode || !item.kitPartDesc || !item.childPartDesc) && item.isUpdate === 0
      // );

      // if (invalidRows.length > 0) {
      //   toast.error("Please complete all required fields in new rows before saving.");
      //   setLoading(false);
      //   return;
      // }

      // Check for duplicate kitPartCode
      // const codes = masterList
      //   .filter(item => item.kitPartCode)
      //   .map(item => item.kitPartCode.trim().toUpperCase());
      // const seen = new Set();
      // const duplicates = codes.filter(code => {
      //   if (seen.has(code)) return true;
      //   seen.add(code);
      //   return false;
      // });

      // if (duplicates.length > 0) {
      //   toast.error(`Duplicate SubChild Part Code found: ${duplicates[0]}`);
      //   setLoading(false);
      //   return;
      // }

      const hasEmptySubChildCode = masterList.filter(
        (item) => !item.kitPartCode
      );
      if (hasEmptySubChildCode.length > 0) {
        toast.error("Please fill subChildPartCode for all rows!");
        setLoading(false);
        return;
      }

      const hasEmptySubChildDesc = masterList.filter(
        (item) => !item.kitPartDesc
      );
      if (hasEmptySubChildDesc.length > 0) {
        toast.error("Please fill subChildPartDesc for all rows.");
        setLoading(false);
        return;
      }

      const hasEmptyChildCode = masterList.filter((item) => !item.childPartId);
      if (hasEmptyChildCode.length > 0) {
        toast.error("Please fill Child Part Code for all rows.");
        setLoading(false);
        return;
      }

      // Prepare data for API according to backend structure
      const updatedList = masterList
        .filter((item) => {
          // Only include rows that have all required data
          return item.kitPartCode && item.kitPartDesc && item.childPartDesc;
        })
        .map((item) => {
          // Extract childPartCode and find childPartId
          let childPartCode = item.childPartCode;
          let childPartId = item.childPartId;

          // If childPartCode is not set but childPartDesc has the format "CODE - DESC"
          if (!childPartCode && item.childPartDesc) {
            const parts = item.childPartDesc.split(" - ");
            if (parts.length > 0) {
              childPartCode = parts[0].trim();

              // Find the child part in options to get the correct ID
              const childPartOption = childPartOptions.find(
                (option) => option.childPartCode === childPartCode
              );
              if (childPartOption) {
                childPartId = childPartOption.childPartId;
              }
            }
          }

          // If we have childPartCode but no childPartId, try to find it
          if (childPartCode && !childPartId) {
            const childPartOption = childPartOptions.find(
              (option) => option.childPartCode === childPartCode
            );
            if (childPartOption) {
              childPartId = childPartOption.childPartId;
            }
          }

          // Build the subChildPartDesc - use just the description, not repeated codes
          const subChildPartDesc = item.kitPartDesc || "";

          const baseData = {
            subChildPartCode: item.kitPartCode,
            subChildPartDesc: subChildPartDesc,
            chilPartId: childPartId,
            isActive: item.isActive === "1" || item.isActive === 1 ? "1" : "0",
            tenantId: tenantId,
            branchCode: branchCode,
            updatedBy: employeeId,
          };

          // Add kitPartId if it exists (for updates)
          if (item.id) {
            baseData.kitPartId = parseInt(item.id);
          }
          if (item.isUpdate === 0) {
            baseData.sts = 2; // Insert
          } else {
            baseData.sts = 1; // Update
          }

          return baseData;
        });

      console.log("Sending data to backend:", updatedList);

      // Call the API
      const response = await serverApi.post(
        "insertAndUpdateSubAssyPart",
        updatedList
      );

      // Handle response
      if (response.data && response.data.responseCode === "200") {
        toast.success(
          response.data.responseDataMessage || "Add/Update successful"
        );
        await loadOptionsAndData();
      } else if (response.data && response.data.responseMessage) {
        if (
          response.data.responseMessage.includes("DUPLICATE") ||
          response.data.responseMessage.includes("DUBLICATE")
        ) {
          toast.error("Duplicate entry found!");
        } else {
          toast.error(response.data.responseMessage);
        }
      } else {
        toast.error("Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Error saving data. Please try again.");
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
    } else if (value === "1") {
      setMasterList(originalList.filter((item) => item.isActive === "1"));
    } else if (value === "0") {
      setMasterList(originalList.filter((item) => item.isActive === "0"));
    }
  };

  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("SubChild Part Master");

      // ===== Column Widths =====
      const columnWidths = [10, 30, 45, 45, 20];
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
      worksheet.mergeCells("B1:E1");
      const titleCell = worksheet.getCell("B1");
      titleCell.value = `SubChild Part Master Report\nGenerated On: ${moment().format(
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
          tl: { col: 4, row: 0 },
          br: { col: 5, row: 1.4 },
        });
      } catch {
        console.warn("Right logo not found");
      }

      // ===== Header Row =====
      const startRow = 2;
      const headers = [
        "S.No",
        "SubChild Part Code",
        "SubChild Part Description",
        "Child Part",
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
          index + 1,
          item.kitPartCode || "",
          item.kitPartDesc || "",
          item.childPartDesc || "",
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
      worksheet.autoFilter = {
        from: { row: startRow, column: 1 },
        to: { row: startRow, column: headers.length },
      };

      // ===== Save File =====
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `SubChild_Part_Master_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting SubChild Part Master.");
    }
  };

  return (
    <div>
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          {selectedScreen || "SubChild Part Master"} Details
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={handleAddRow}
            title="Add Row"
          />
        </div>
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

        <div className="card-body p-3" style={{ position: "relative" }}>
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
              <Loader />
            </div>
          )}

          <div className="text-center mt-4">
            <button
              onClick={onExportExcel}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={!optionsLoaded || loading}
            >
              Excel Export
            </button>
            <button
              type="submit"
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              onClick={createOrUpdate}
              disabled={!optionsLoaded || loading}
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

export default SubAssyMaster;
