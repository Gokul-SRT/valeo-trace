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
import Loader from "../../../Utills/Loader";

const ChildPartToVendorMapping = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [childPartOptions, setChildPartOptions] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

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
      loadOptionsAndData();
    }
  }, [selectedModule, selectedScreen]);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = store.get("employeeId");

  // Load dropdown options first, then grid data
  const loadOptionsAndData = async () => {
    try {
      setLoading(true);
      setOptionsLoaded(false);

      // Load dropdown options first using Promise.allSettled
      const optionsResults = await Promise.allSettled([
        fetchChildParts(),
        fetchVendors()
      ]);

      // Handle results for each promise
      const [childPartsResult, vendorsResult] = optionsResults;

      if (childPartsResult.status === 'rejected') {
        console.error("Error fetching child parts:", childPartsResult.reason);
        toast.error("Error fetching child parts. Some data may be incomplete.");
      }

      if (vendorsResult.status === 'rejected') {
        console.error("Error fetching vendors:", vendorsResult.reason);
        toast.error("Error fetching vendor data. Some data may be incomplete.");
      }

      // Mark options as loaded even if some failed
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
      const response = await serverApi.post("getchildtoVendorMappingDetails", {
        tenantId: tenantId,
        branchCode: branchCode,
      });

      if (response.data.responseCode === "200" && Array.isArray(response.data.responseData)) {
        if (response.data.responseData.length === 0) {
          setMasterList([]);
          setOriginalList([]);
          return;
        }

        // Transform the API response to match our grid structure
        const transformedData = response.data.responseData.map((item) => ({
          cvMapId: item.cvMapId,  // Changed from childVendorMapId to cvMapId
          childPartId: item.childPartId,
          vendorId: item.vendorId,
          childPartDesc: item.childPartDesc,
          vendorDesc: item.vendorDesc,
          isUpdate: 1,
        }));

        setMasterList(transformedData);
        setOriginalList(structuredClone(transformedData));
      } else {
        setMasterList([]);
        setOriginalList([]);
        if (response.data.responseMessage) {
          toast.info(response.data.responseMessage);
        }
      }
    } catch (error) {
      console.error("Error fetching mapping data:", error);
      toast.error("Error fetching data. Please try again later.");
      setMasterList([]);
      setOriginalList([]);
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
      throw error; // Re-throw to be caught by Promise.allSettled
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await serverApi.post("getVendorMasterDetails", {
        tenantId,
        branchCode,
        isActive: "1",
      });

      const res = response.data;
      if (res.responseCode === "200" && Array.isArray(res.responseData)) {
        setVendorOptions(res.responseData);
      } else {
        setVendorOptions([]);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw error; // Re-throw to be caught by Promise.allSettled
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
          <span className="ag-header-cell-text">{props.displayName} <span style={{color: 'red'}}>*</span></span>
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
      headerName: "Child Part Code",
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
        params.data.childPartId = params.newValue;
        // Update description when child part changes
        const found = childPartOptions.find(
          (p) => p.childPartId === params.newValue
        );
        if (found) {
          params.data.childPartDesc = found.childPartDesc;
        }
        return true;
      },
      // Show childPartDesc in the grid instead of childPartId
      valueFormatter: (params) => {
        if (!params.value) return "";
        const found = childPartOptions.find(
          (p) => p.childPartId === params.value
        );
        return found ? found.childPartDesc : params.data.childPartDesc || params.value;
      },
      filter: "agTextColumnFilter",
      filterValueGetter: (params) => {
        const found = childPartOptions.find(
          (p) => p.childPartId === params.data.childPartId
        );
        return found ? found.childPartDesc : params.data.childPartDesc || "";
      },
    },
    {
      headerName: "Vendor Code",
      field: "vendorId",
      filter: "agTextColumnFilter",
      editable: true,
      headerComponent: RequiredHeader,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: (params) => ({
        values: vendorOptions.map((item) => item.vendorId),
      }),
      valueGetter: (params) => {
        return params.data.vendorId;
      },
      valueSetter: (params) => {
        params.data.vendorId = params.newValue;
        // Update description when vendor changes
        const found = vendorOptions.find(
          (item) => item.vendorId === params.newValue
        );
        if (found) {
          params.data.vendorDesc = `${found.vendorCode}-${found.vendorName}`;
        }
        return true;
      },
      // Show vendorDesc in the grid instead of vendorId
      valueFormatter: (params) => {
        if (!params.value) return "";
        const option = vendorOptions.find((item) => item.vendorId === params.value);
        return option ? `${option.vendorCode}-${option.vendorName}` : params.data.vendorDesc || params.value;
      },
      filterValueGetter: (params) => {
        const option = vendorOptions.find((item) => item.vendorId === params.data.vendorId);
        return option ? `${option.vendorCode}-${option.vendorName}` : params.data.vendorDesc || "";
      },
    },
    {
      headerName: "ID",
      field: "cvMapId",  // Changed from childVendorMapId to cvMapId
      hide: true,
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
      childPartId: "",
      vendorId: "",
    };

    const emptyRows = masterList.filter((item) => !item.cvMapId);  // Changed from childVendorMapId to cvMapId
    
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
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
      }

      if (!hasChanges()) {
        toast.error("Change any one field before saving.");
        setLoading(false);
        return;
      }

      // Duplicate ChildPartId check
      // const childPartIds = masterList.map((item) => item.childPartId);
      // const duplicateChildPartIds = childPartIds.filter(
      //   (id, index) => id && childPartIds.indexOf(id) !== index
      // );

      // if (duplicateChildPartIds.length > 0) {
      //   const duplicateId = duplicateChildPartIds[0];
      //   const dupObj = childPartOptions.find(
      //     (item) => item.childPartId === duplicateId
      //   );
      //   const desc = dupObj ? dupObj.childPartDesc : duplicateId;
      //   toast.error(`Already Mapped This Child Part: ${desc}`);
      //   setLoading(false);
      //   return;
      // }

      // Validate required fields
      const invalidChildPart = masterList.filter((item) => !item.childPartId);
      if (invalidChildPart.length > 0) {
        toast.error("Please fill Child Part Code for all rows.");
        setLoading(false);
        return;
      }

      const invalidVendor = masterList.filter((item) => !item.vendorId);
      if (invalidVendor.length > 0) {
        toast.error("Please fill Vendor Code for all rows.");
        setLoading(false);
        return;
      }

      // Prepare data for API with the new structure
      const updatedList = masterList.map((item) => {
        const baseData = {
          childPartId: parseInt(item.childPartId) || 0,
          vendorId: parseInt(item.vendorId) || 0,
          tenantId: tenantId,
          branchCode: branchCode,
          updatedBy: employeeId,
        };

        // Add cvMapId if it exists (for updates)
        if (item.cvMapId) {  // Changed from childVendorMapId to cvMapId
          baseData.cvMapId = parseInt(item.cvMapId);
        }

        // Determine sts: 1 for update, 2 for insert
        // If isUpdate is 0 (from handleAddRow) or no cvMapId, it's an insert
        if (item.isUpdate === 0 || !item.cvMapId) {  // Changed from childVendorMapId to cvMapId
          baseData.sts = 2; // Insert
        } else {
          baseData.sts = 1; // Update
        }

        return baseData;
      });

      console.log("Sending data:", updatedList); // For debugging

      // Call the new API
      const response = await serverApi.post(
        "insertAndUpdateChildtoVendorMappingDetails",
        updatedList
      );

      // Handle response based on your API's structure
      if (response.data && response.data.responseCode === "200") {
        toast.success("Add/Update successful");
        await loadOptionsAndData();
      } else if (response.data && response.data.responseMessage) {
        if (response.data.responseMessage.includes("DUPLICATE") || 
            response.data.responseMessage.includes("DUBLICATE")) {
          toast.error("Duplicate entry found!");
        } else {
          toast.error(response.data.responseMessage);
        }
      } else {
        toast.error("Failed to save data. Please try again.");
      }
    } catch (error) {
      console.error("Error saving mapping data:", error);
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

  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Child Part To Vendor Mapping");

      // Column Widths
      const columnWidths = [30, 40, 30];
      columnWidths.forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      // Title Row Height
      worksheet.getRow(1).height = 65;

      // Left Logo
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

      // Title Cell
      worksheet.mergeCells("B1");
      const titleCell = worksheet.getCell("B1");
      titleCell.value = `Child Part To Vendor Mapping\nGenerated On: ${moment().format(
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

      // Right Logo
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

      // Header Row
      const startRow = 3;
      const headers = [
        "S.No",
        "Child Part Code",
        "Vendor Code",
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

      // Data Rows - Use descriptions from the data
      masterList.forEach((item, index) => {
        const rowNumber = startRow + index + 1;
        const row = worksheet.getRow(rowNumber);

        // Use the stored descriptions from data
        row.values = [
          index + 1,
          item.childPartDesc || "",
          item.vendorDesc || "",
        ];

        const snoCell = row.getCell(1);
        snoCell.alignment = { horizontal: "center", vertical: "middle" };
        snoCell.font = { bold: true };

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

      // AutoFilter
      worksheet.autoFilter = {
        from: { row: startRow, column: 1 },
        to: { row: startRow, column: headers.length },
      };

      // Save File
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `Child_Part_To_Vendor_Mapping_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting to Excel.");
    }
  };

  return (
    <div>
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          {selectedScreen || "Child Part To Vendor Mapping"} Details
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={handleAddRow}
            title="Add Row"
          />
        </div>

        <div className="card-body p-3" style={{ position: "relative" }}>
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
              onClick={createOrUpdate}
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

export default ChildPartToVendorMapping;