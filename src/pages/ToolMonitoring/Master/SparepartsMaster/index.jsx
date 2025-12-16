import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import Loader from "../../../.././Utills/Loader";
import axios from "axios";
import CommonserverApi from "../../../../CommonserverApi";
import { backendService } from "../../../../service/ToolServerApi";
import store from 'store'
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import LineMstdropdown from "../../../../CommonDropdownServices/Service/LineMasterSerive";

const USED_IDS_STORAGE_KEY = "criticalSpare_usedIds_v1";

const CriticalSpareMaster = () => {
  const [masterList, setMasterList] = useState([]);
  const gridRef = useRef(null);

  const [selectedLine, setSelectedLine] = useState("");
  const [selectedTool, setSelectedTool] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("getAll");
  const [lineOptions, setLineOptions] = useState([]);
  const [toolOptions, setToolOptions] = useState([]);
  const [sparePartMstId, setSparePartMstId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");
  const employeeId = store.get("employeeId");

  // load used IDs from localStorage to avoid reusing IDs across reloads
  const loadUsedIds = () => {
    try {
      const raw = localStorage.getItem(USED_IDS_STORAGE_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.map((v) => String(v)));
    } catch {
      return new Set();
    }
  };

  const saveUsedIds = (setOfIds) => {
    try {
      const arr = Array.from(setOfIds);
      localStorage.setItem(USED_IDS_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn("Failed to save used ids", e);
    }
  };

  // usedIds persists assigned sparePartIds so they aren't regenerated
  const [usedIds, setUsedIds] = useState(() => loadUsedIds());

  // Fetch line dropdown
  const fetchLineDropdown = async () => {
    try {
      const payload = { isActive: "1", tenantId, branchCode };
      const res = await LineMstdropdown();
      const data = Array.isArray(res)
        ? res
        : res || [];
      setLineOptions(data);
    } catch {
      toast.error("No data available");
    }
  };

  // Fetch tool dropdown
  const fetchToolDropdown = async (lineCode) => {
    try {
      const payload = {
        lineCode,
        tenantId,
        branchCode,
        isActive: "1",
      };

      const res = await CommonserverApi.post("getToolByLineCode", payload);
      const rawData = Array.isArray(res?.data)
        ? res.data
        : res?.data?.responseData || [];

      const tools = rawData.map((tool) => ({
        label: tool.toolDesc,
        value: tool.toolNo,
      }));

      setToolOptions(tools);
    } catch {
      toast.error("Failed to load Tool dropdown");
    }
  };

  useEffect(() => {
    fetchLineDropdown();
  }, []);

  // Fetch critical spare details based on line, tool, and status
  const fetchCriticalSpareDetails = async (line, toolNo, status) => {
    if (!line || !toolNo || !status) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        lineCode: line,
        toolNo: toolNo,
        status: status,
        tenantId:tenantId,
        branchCode:branchCode,
      };

      const res = await backendService({
        requestPath: "getcriticalsparedetails",
        requestData: payload,
      });

      console.log("res", res);

      if (Array.isArray(res) && res.length > 0) {
        const formattedRows = res.map((row , index) => ({
          ...row,
          isUpdate: "1",
          id:index+1,
          sparePartId: String(row.sparePartId),
          minimumThresholdQuantity:
            row.minimumThresholdQuantity != null
              ? String(row.minimumThresholdQuantity)
              : "",
          criticalSpareName: row.criticalSpareName || "",
          status: String(row.status ?? "1"),
          isChecked: String(row.status ?? "1") === "1",
        }));

        // Sort by sparePartId
        formattedRows.sort(
          (a, b) => (Number(a.sparePartId) || 0) - (Number(b.sparePartId) || 0)
        );

        // Update usedIds
        const newUsed = new Set(usedIds);
        formattedRows.forEach((r) => {
          if (r.sparePartId) newUsed.add(String(r.sparePartId));
        });
        setUsedIds(newUsed);
        saveUsedIds(newUsed);

        setMasterList(formattedRows);
        
        // Set sparePartMstId if available in response
        if (res[0]?.sparePartMstId) {
          setSparePartMstId(res.data[0].sparePartMstId);
        }
        
      } else {
        setMasterList([]);
        setSparePartMstId("");
        toast.info("No data available");
      }
    } catch (err) {
      console.error("fetchCriticalSpareDetails error", err);
      toast.error("No data available");
      setMasterList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data whenever line, tool, or status changes
  useEffect(() => {
    if (selectedLine && selectedTool && selectedStatus) {
      fetchCriticalSpareDetails(selectedLine, selectedTool, selectedStatus);
    } else {
      setMasterList([]);
    }
  }, [selectedLine, selectedTool, selectedStatus]);

  // Check if table should be displayed
  const shouldShowTable = selectedLine && selectedTool && selectedStatus;

  // Fetch details for a single sparePartId
  const fetchCriticalSpareDetailById = async (mstId) => {
    try {
      const payload = { sparePartId: String(mstId) };
      const res = await backendService({
        requestPath: "getcriticalsparedetails",
        requestData: payload,
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((row) => ({
          ...row,
          isUpdate: "1",
          sparePartId: String(row.sparePartId),
          minimumThresholdQuantity:
            row.minimumThresholdQuantity != null
              ? String(row.minimumThresholdQuantity)
              : "",
          criticalSpareName: row.criticalSpareName || "",
          status: String(row.status ?? "1"),
        }));
      } else {
        return [];
      }
    } catch (err) {
      console.error("fetchCriticalSpareDetailById error", err);
      return [];
    }
  };

  // Fetch details for a list of sparePartIds and set masterList (after save)
  const fetchAllDetailsAndSet = async (spareIds) => {
    try {
      const uniqueIds = Array.from(new Set(spareIds.map((id) => String(id))));
      const allRows = [];
      for (const id of uniqueIds) {
        const rows = await fetchCriticalSpareDetailById(id);
        if (rows.length > 0) {
          rows.forEach((r) => allRows.push(r));
        }
      }
      if (allRows.length > 0) {
        allRows.sort(
          (a, b) => (Number(a.sparePartId) || 0) - (Number(b.sparePartId) || 0)
        );

        const newUsed = new Set(usedIds);
        allRows.forEach((r) => {
          if (r.sparePartId) newUsed.add(String(r.sparePartId));
        });
        setUsedIds(newUsed);
        saveUsedIds(newUsed);

        setMasterList(allRows);
      } else {
        toast.info("No spare details found");
      }
    } catch (err) {
      console.error("fetchAllDetailsAndSet error", err);
      toast.error("Failed to fetch spare details after save");
    }
  };

  // Columns
  const MandatoryHeaderComponent = (props) => {
    return (
      <div>
        {props.displayName} <span style={{color: 'red'}}>*</span>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "S.No",
      field: "id",
      editable: false,
      filter: true,
      cellStyle: { textAlign: "left" },
      valueGetter: (params) => params.node.rowIndex + 1,
    },
    {
      headerName: "Spare Description *",
      field: "criticalSpareName",
      editable: true,
      filter: true,
    },
    {
      headerName: "Spare Min. Qty(Nos.) *",
      field: "minimumThresholdQuantity",
      editable: true,
      filter: true,
      cellEditor: "agTextCellEditor",
      valueParser: (params) => {
        let v = params.newValue;
        v = v === null || v === undefined ? "" : String(v).trim();
        if (v === "") return "";
        if (/^\d+$/.test(v)) return v;
        return params.oldValue;
      },
      cellStyle: { textAlign: "left" },
    },
    {
      headerName: "Status",
      field: "status",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.status === "1" || params.data.status === 1,
      valueSetter: (params) => {
        params.data.status = params.newValue ? "1" : "0";
        params.data.changed = true;
        return true;
      },
      cellStyle: { textAlign: "center" },
    }
  ];

  const defaultColDef = { sortable: true, resizable: true, flex: 1 };

  // Auto-generate Spare Part No
  const generateSparePartNo = () => {
    const numericFromList = masterList.map((a) => {
      const n = Number(a.sparePartId);
      return Number.isNaN(n) ? 0 : n;
    });
    const numericFromUsedIds = Array.from(usedIds).map((s) => {
      const n = Number(s);
      return Number.isNaN(n) ? 0 : n;
    });
    const maxFromList = numericFromList.length
      ? Math.max(...numericFromList)
      : 0;
    const maxFromUsed = numericFromUsedIds.length
      ? Math.max(...numericFromUsedIds)
      : 0;
    let candidate = Math.max(maxFromList, maxFromUsed, 0) + 1;

    while (
      masterList.some((r) => String(r.sparePartId) === String(candidate)) ||
      usedIds.has(String(candidate))
    ) {
      candidate += 1;
    }
    
    const newUsed = new Set(usedIds);
    newUsed.add(String(candidate));
    setUsedIds(newUsed);
    saveUsedIds(newUsed);

    return String(candidate);
  };

  // Add new row
  const handleAddRow = () => {
    if (!selectedLine || !selectedTool || !selectedStatus) {
      toast.error("Please fill all mandatory fields");
      return;
    }

    const newId = generateSparePartNo();
    const isActive = selectedStatus === "1";

    const newRow = {
      isUpdate: "0",
      sparePartId: newId,
      criticalSpareName: "",
      minimumThresholdQuantity: "",
      status: "1",
      isChecked: true,
    };

    setMasterList((prev) => {
      const updated = [...prev, newRow];
      // After state update, go to last page, scroll to last row, and start editing
      setTimeout(() => {
        const api = gridRef.current?.api;
        if (api) {
          const totalRows = updated.length;
          const pageSize = api.paginationGetPageSize();
          const lastPage = Math.floor((totalRows - 1) / pageSize);
          api.paginationGoToPage(lastPage);
          api.ensureIndexVisible(totalRows - 1, "bottom");
          
          // Start editing the Spare Description cell of the new row
          setTimeout(() => {
            api.startEditingCell({
              rowIndex: totalRows - 1,
              colKey: "criticalSpareName"
            });
          }, 200);
        }
      }, 100);
      return updated;
    });
  };

  // onCellValueChanged
  const onCellValueChanged = (params) => {
    const { colDef, newValue, oldValue, data } = params;
    const field = colDef.field;

    if ((newValue ?? "") === (oldValue ?? "")) return;

    // Mark row as changed
    data.changed = true;

    setMasterList((prev) =>
      prev.map((row) => {
        if (String(row.sparePartId) !== String(data.sparePartId)) return row;

        const updated = { ...row };

        if (field === "criticalSpareName") {
          updated.criticalSpareName = String(newValue || "").trim();
        }

        if (field === "minimumThresholdQuantity") {
          const cleaned = String(newValue || "").trim();
          updated.minimumThresholdQuantity = cleaned;
        }

        if (field === "status") {
          updated.status = newValue ? "1" : "0";
        }

        if (row.isUpdate === "1") {
          updated.isUpdate = "1";
        } else if (row.isUpdate === "0") {
          updated.isUpdate = "0";
        }

        // Mark as changed
        updated.changed = true;

        return updated;
      })
    );
  };

  // Prepare and send payload for insert/update
  const handleUpdate = async () => {
    // Check mandatory fields first
    if (!selectedLine || !selectedTool || !selectedStatus) {
      toast.error("Please fill all mandatory fields");
      return;
    }

    // Check if there's any data in the grid
    if (masterList.length === 0) {
      toast.error("No data available");
      return;
    }

    // Stop any active editing to capture current cell values
    if (gridRef.current?.api) {
      gridRef.current.api.stopEditing();
    }

    // Validate mandatory fields in grid data
    const emptySpareNames = masterList.filter(row => !row.criticalSpareName || row.criticalSpareName.trim() === "");
    const emptyMinQty = masterList.filter(row => !row.minimumThresholdQuantity || row.minimumThresholdQuantity.trim() === "");
    const zeroMinQty = masterList.filter(row => {
      const qty = row.minimumThresholdQuantity ? row.minimumThresholdQuantity.trim() : "";
      return qty !== "" && Number(qty) <= 0;
    });
    
    if (emptySpareNames.length > 0 || emptyMinQty.length > 0) {
      toast.error("Please fill all mandatory fields");
      return;
    }
    
    if (zeroMinQty.length > 0) {
      toast.error("Spare Min. Qty. must be greater than 0");
      return;
    }

    // Check for duplicate Spare Description values
    const spareNames = masterList.map(row => row.criticalSpareName.trim().toLowerCase());
    const duplicateNames = spareNames.filter((name, index) => spareNames.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      toast.error("Duplicate Spare Description values are not allowed");
      return;
    }

    const isUpdateMaster = sparePartMstId ? "1" : "0";

    // Check for changes
    const rowsToInsert = masterList.filter(row => row.isUpdate === "0");
    const rowsToUpdate = masterList.filter(row => row.changed === true);

    if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
      toast.info("No data added/updated");
      return;
    }

    const rowsToSend = masterList.filter(
      (row) => row.isUpdate === "1" || row.isUpdate === "0"
    );

    if (rowsToSend.length === 0) {
      toast.info("No data added/updated");
      return;
    }

    const spareDetailsPayload = rowsToSend.map((row) => ({
      isUpdate: row.isUpdate,
      sparePartId: row.sparePartId,
      criticalSpareName: row.criticalSpareName || "",
      minimumThresholdQuantity:
        row.minimumThresholdQuantity === ""
          ? ""
          : row.minimumThresholdQuantity,
      status: Number(row.status),
    }));

    const payload =
      isUpdateMaster === "0"
        ? {
            isUpdate: "0",
            toolNo: selectedTool,
            line: selectedLine,
            spareDetails: spareDetailsPayload,
          }
        : {
            isUpdate: "1",
            spareDetails: spareDetailsPayload,
          };

    console.log("FINAL PAYLOAD:", payload);

    try {
      const res = await backendService({
        requestPath: "insertupdatecriticalsparemaster",
        requestData: payload,
      });

      toast.success("Add/Update successful");

      // Always reload table data after update/insert
      await fetchCriticalSpareDetails(selectedLine, selectedTool, selectedStatus);
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Add/Update failed");
    }
  };

  const onExportExcel = async () => {
    if (masterList.length === 0) {
      toast.error("No data available");
      return;
    }
    
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Critical Spare Master");

      worksheet.getRow(1).height = 60;
      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 35;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 15;

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

      const titleCell = worksheet.getCell("B1");
      titleCell.value = "Critical Spare Master Report";
      titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

      worksheet.mergeCells("C1:D2");
      const dateCell = worksheet.getCell("C1");
      const selectedLineName = lineOptions.find(line => line.lineMstCode === selectedLine)?.lineMstDesc || selectedLine;
      const selectedToolName = toolOptions.find(tool => tool.value === selectedTool)?.label || selectedTool;
      dateCell.value = `Line: ${selectedLineName}\nTool: ${selectedToolName}`;
      dateCell.font = { bold: true, size: 11, color: { argb: "FF00264D" } };
      dateCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

      const img2 = await fetch("/smartrunLogo.png");
      const blob2 = await img2.blob();
      const buf2 = await blob2.arrayBuffer();
      const imgId2 = workbook.addImage({ buffer: buf2, extension: "png" });
      worksheet.mergeCells("E1:F2");
      worksheet.addImage(imgId2, {
        tl: { col: 4, row: 0 },
        br: { col: 6, row: 2 },
        editAs: "oneCell",
      });

      const headers = ["S.No", "Spare Description", "Spare Min. Qty(Nos.)", "Status"];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" }
        };
      });
      headerRow.height = 25;

      masterList.forEach((item, index) => {
        const row = worksheet.addRow([
          index + 1,
          item.criticalSpareName || "",
          item.minimumThresholdQuantity || "",
          item.status === "1" ? "Active" : "Inactive"
        ]);
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { size: 10 };
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" }
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `CriticalSpareMaster_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Excel. Please try again.");
    }
  };

  const handleCancel = () => {
    setSelectedLine("");
    setSelectedTool("");
    setSelectedStatus("getAll");
    setSparePartMstId("");
    setMasterList([]);
    setToolOptions([]);
  };


  const handleLineOnChange = (e) => {
    setSelectedLine(e.target.value);
    setSelectedTool("");
    setMasterList([]);
    
    if (e.target.value) {
      fetchToolDropdown(e.target.value);
    } else {
      setToolOptions([]);
    }
  };

  return (
    <div>
      <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Critical Spare Master
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={handleAddRow}
          />
        </div>

        <div className="card-body p-3">
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Line <span style={{color: 'red'}}>*</span></label>
              <select
                className="form-select"
                value={selectedLine}
                onChange={(e) => handleLineOnChange(e)}
                disabled={isLoading}
              >
                <option value="">Select Line</option>
                {lineOptions.map((line) => (
                  <option key={line.lineMstCode} value={line.lineMstCode}>
                    {line.lineMstDesc}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Tool Desc <span style={{color: 'red'}}>*</span></label>
              <select
                className="form-select"
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select Tool Desc</option>
                {toolOptions.map((tool) => (
                  <option key={tool.value} value={tool.value}>
                    {tool.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select Status</option>
                <option value="getAll">Get All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>


          {shouldShowTable ? (
            <>
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
                <AgGridReact
                  ref={gridRef}
                  rowData={masterList}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  pagination
                  paginationPageSize={10}
                  domLayout="autoHeight"
                  onCellValueChanged={onCellValueChanged}
                  rowSelection="single"
                  suppressClickEdit={false}
                  stopEditingWhenCellsLoseFocus={true}
                />
              </div>
              <div className="text-center mt-4">
                <button
                  className="btn text-white me-2"
                  onClick={onExportExcel}
                  style={{ backgroundColor: "#00264d" }}
                  disabled={isLoading || masterList.length === 0}
                >
                  Excel Export
                </button>
                <button
                  className="btn text-white me-2"
                  onClick={handleUpdate}
                  style={{ backgroundColor: "#00264d" }}
                  disabled={isLoading}
                >
                  Update
                </button>
                <button
                  className="btn text-white"
                  onClick={handleCancel}
                  style={{ backgroundColor: "#00264d" }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <p className="text-muted">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CriticalSpareMaster;