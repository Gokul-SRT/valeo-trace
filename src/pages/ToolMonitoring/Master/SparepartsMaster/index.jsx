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
import { toast } from "react-toastify";
import axios from "axios";
import CommonserverApi from "../../../../CommonserverApi";

ModuleRegistry.registerModules([
  SetFilterModule,
  DateFilterModule,
  ExcelExportModule,
]);

const USED_IDS_STORAGE_KEY = "criticalSpare_usedIds_v1";

const CriticalSpareMaster = () => {
  const [masterList, setMasterList] = useState([]);
  const gridRef = useRef(null);

  const [selectedLine, setSelectedLine] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [lineOptions, setLineOptions] = useState([]);
  const [operationOptions, setOperationOptions] = useState([]);
  const [sparePartMstId, setSparePartMstId] = useState("");

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = JSON.parse(localStorage.getItem("employeeId"));

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
      const res = await CommonserverApi.post("getCommonMstdtl", payload);
      const data = Array.isArray(res?.data)
        ? res.data
        : res?.data?.responseData || [];
      setLineOptions(data);
    } catch {
      toast.error("Failed to load Line dropdown");
    }
  };

  // Fetch operation dropdown
  const fetchOperationDropdown = async () => {
    try {
      const payload = { isActive: "1", tenantId, branchCode };
      const res = await CommonserverApi.post("getOperationDropdown", payload);
      setOperationOptions(res?.data?.responseData || []);
    } catch {
      toast.error("Failed to load Operation dropdown");
    }
  };

  useEffect(() => {
    fetchLineDropdown();
    fetchOperationDropdown();
  }, []);

  // Fetch details for a single sparePartId
  const fetchCriticalSpareDetailById = async (mstId) => {
    try {
      const payload = { sparePartId: String(mstId) }; // single sparePartId retrieval
      const res = await axios.post(
        "http://localhost:8091/tool/getcriticalsparedetails",
        payload
      );
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((row) => {
          // mark as update (already in DB). Convert fields to strings where appropriate.
          return {
            ...row,
            isUpdate: "1",
            sparePartId: String(row.sparePartId),
            // Keep minimumThresholdQuantity as string or empty string — we do not coerce to 0/null
            minimumThresholdQuantity:
              row.minimumThresholdQuantity != null
                ? String(row.minimumThresholdQuantity)
                : "",
            criticalSpareName: row.criticalSpareName || "",
            status: String(row.status ?? "1"),
          };
        });
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
        // sort by sparePartId ascending numeric where possible
        allRows.sort(
          (a, b) => (Number(a.sparePartId) || 0) - (Number(b.sparePartId) || 0)
        );

        // update usedIds with these persistent IDs
        const newUsed = new Set(usedIds);
        allRows.forEach((r) => {
          if (r.sparePartId) newUsed.add(String(r.sparePartId));
        });
        setUsedIds(newUsed);
        saveUsedIds(newUsed);

        setMasterList(allRows);
      } else {
        // keep existing masterList intact (do not clear) but inform user
        toast.info("No spare details found");
      }
    } catch (err) {
      console.error("fetchAllDetailsAndSet error", err);
      toast.error("Failed to fetch spare details after save");
    }
  };

  // Columns
  const columnDefs = [
    {
      headerName: "Spare Part No",
      field: "sparePartId",
      editable: false, // AUTO GENERATED – NO MANUAL EDIT
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "Description",
      field: "criticalSpareName",
      editable: true,
    },
    {
      headerName: "Min Qty",
      field: "minimumThresholdQuantity",
      editable: true,
      cellEditor: "agTextCellEditor",
      valueParser: (params) => {
        let v = params.newValue;

        // Convert to string always (AG Grid sometimes sends number)
        v = v === null || v === undefined ? "" : String(v).trim();

        // If user typed nothing → empty string
        if (v === "") return "";

        // If user typed a valid number → ACCEPT IT
        if (/^\d+$/.test(v)) return v;

        // Otherwise reject and keep old value
        return params.oldValue;
      },

      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "Status",
      field: "status",
      editable: false,
      cellRendererFramework: (params) => {
        // Determine checked state: use isChecked if available, else fallback to status
        const checked =
          params.data.isChecked !== undefined
            ? params.data.isChecked
            : params.data.status === "1";

        const handleChange = (e) => {
          const newChecked = e.target.checked;
          params.node.setDataValue("status", newChecked ? "1" : "0");
          params.node.setDataValue("isChecked", newChecked); // update isChecked for rendering
        };

        return (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={handleChange}
              style={{ transform: "scale(1.2)" }}
            />
          </div>
        );
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const defaultColDef = { sortable: true, resizable: true, flex: 1 };

  // Auto-generate Spare Part No (avoids duplicates and avoids reuse of any used id stored in usedIds)
  const generateSparePartNo = () => {
    // Collect numeric candidate base from masterList and usedIds
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

    // ensure not colliding with masterList or usedIds
    while (
      masterList.some((r) => String(r.sparePartId) === String(candidate)) ||
      usedIds.has(String(candidate))
    ) {
      candidate += 1;
    }
    // persist candidate immediately to usedIds so it won't be regenerated on reload
    const newUsed = new Set(usedIds);
    newUsed.add(String(candidate));
    setUsedIds(newUsed);
    saveUsedIds(newUsed);

    return String(candidate);
  };

  // Add new row
  // Add new row
  const handleAddRow = () => {
    if (!selectedLine || !selectedOperation || selectedStatus === "") {
      toast.warning("Select Line, Operation, and Status first");
      return;
    }

    const newId = generateSparePartNo();
    const isActive = selectedStatus === "1"; // Active = checked

    const newRow = {
      isUpdate: "0", // new row
      sparePartId: newId,
      criticalSpareName: "",
      minimumThresholdQuantity: "",
      status: isActive ? "1" : "0", // payload
      isChecked: isActive, // important for checkbox rendering
    };

    setMasterList((prev) => [...prev, newRow]);

    setTimeout(() => {
      gridRef.current?.api?.ensureIndexVisible(masterList.length, "bottom");
    }, 50);
  };

  // onCellValueChanged: update state immutably and ensure isUpdate toggles to "1" when user edits a DB row
  const onCellValueChanged = (params) => {
    const { colDef, newValue, oldValue, data } = params;
    const field = colDef.field;

    // If unchanged, do nothing
    if ((newValue ?? "") === (oldValue ?? "")) return;

    setMasterList((prev) =>
      prev.map((row) => {
        // Identify exact edited row using sparePartId (NOT rowIndex)
        if (String(row.sparePartId) !== String(data.sparePartId)) return row;

        const updated = { ...row };

        // Update the edited field
        if (field === "criticalSpareName") {
          updated.criticalSpareName = String(newValue || "").trim();
        }

        if (field === "minimumThresholdQuantity") {
          const cleaned = String(newValue || "").trim();
          updated.minimumThresholdQuantity = cleaned;
        }

        // Mark only THIS row as updated if it already existed in DB
        if (row.isUpdate === "1") {
          updated.isUpdate = "1";
        } else if (row.isUpdate === "0") {
          updated.isUpdate = "0"; // new rows remain isUpdate = 0
        }

        return updated;
      })
    );
  };

  // Prepare and send payload for insert/update
  const handleUpdate = async () => {
    const isUpdateMaster = sparePartMstId ? "1" : "0";

    // Build payload: include only rows that are either new (isUpdate === "0") or edited DB rows (isUpdate === "1")
    // This ensures we only send changed/new rows.
    const rowsToSend = masterList.filter(
      (row) => row.isUpdate === "1" || row.isUpdate === "0"
    );

    if (rowsToSend.length === 0) {
      toast.info("Nothing to save.");
      return;
    }

    const spareDetailsPayload = rowsToSend.map((row) => {
      return {
        isUpdate: row.isUpdate,
        sparePartId: row.sparePartId,
        criticalSpareName: row.criticalSpareName || "",
        // ALWAYS send string typed by user – NEVER convert to number
        minimumThresholdQuantity:
          row.minimumThresholdQuantity === ""
            ? ""
            : row.minimumThresholdQuantity,
        status: Number(row.status),
      };
    });

    const payload =
      isUpdateMaster === "0"
        ? {
            isUpdate: "0",
            toolNo: "null",
            line: selectedLine,
            station: selectedOperation,
            spareDetails: spareDetailsPayload,
          }
        : {
            isUpdate: "1",
            spareDetails: spareDetailsPayload,
          };

    console.log("FINAL PAYLOAD:", payload);

    try {
      const res = await axios.post(
        "http://localhost:8091/tool/insertupdatecriticalsparemaster",
        payload
      );

      toast.success(
        isUpdateMaster === "1"
          ? "Updated successfully!"
          : "Inserted successfully!"
      );

      // After a successful save, refresh each spare part's data from backend and replace rows for those ids
      const idsToFetch = rowsToSend
        .map((r) => (r.sparePartId ? String(r.sparePartId) : null))
        .filter((v) => v);

      if (idsToFetch.length > 0) {
        await fetchAllDetailsAndSet(idsToFetch);
      }
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Error saving");
    }
  };

  const onExportExcel = () =>
    gridRef.current?.api?.exportDataAsExcel({
      fileName: "CriticalSpareMaster.xlsx",
    });

  const handleCancel = () => {
    // As requested: do not clear retrieved table data on Cancel.
    // Only clear selections (line/operation/status) and sparePartMstId.
    setSelectedLine("");
    setSelectedOperation("");
    setSelectedStatus("");
    setSparePartMstId("");
    toast.info("Selections cleared. Table contents retained.");
  };

  // Optional helper: load details for a specific sparePartId into grid (used where user may want to fetch manually)
  const loadDetailsBySparePartId = async (id) => {
    try {
      const rows = await fetchCriticalSpareDetailById(id);
      if (rows.length > 0) {
        // merge fetched rows with existing masterList but ensure we don't duplicate
        const existingMap = new Map(
          masterList.map((r) => [String(r.sparePartId), r])
        );
        rows.forEach((r) => {
          existingMap.set(String(r.sparePartId), r);
        });
        const merged = Array.from(existingMap.values()).sort(
          (a, b) => (Number(a.sparePartId) || 0) - (Number(b.sparePartId) || 0)
        );

        // update usedIds
        const newUsed = new Set(usedIds);
        merged.forEach((r) => {
          if (r.sparePartId) newUsed.add(String(r.sparePartId));
        });
        setUsedIds(newUsed);
        saveUsedIds(newUsed);

        setMasterList(merged);
      } else {
        toast.info("No spare details found for id: " + id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch details");
    }
  };

  return (
    <div className="container mt-1 p-0">
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
            <div className="col-md-4">
              <label className="form-label fw-semibold">Line</label>
              <select
                className="form-select"
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
              >
                <option value="">Select Line</option>
                {lineOptions.map((line) => (
                  <option key={line.lineMstCode} value={line.lineMstCode}>
                    {line.lineMstCode}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Operation</label>
              <select
                className="form-select"
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
              >
                <option value="">Select Operation</option>
                {operationOptions.map((op) => (
                  <option key={op.operationId} value={op.operationUniquecode}>
                    {op.operationUniquecode}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

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

          <div className="text-center mt-4">
            <button
              className="btn text-white me-2"
              onClick={onExportExcel}
              style={{ backgroundColor: "#00264d" }}
            >
              Excel
            </button>
            <button
              className="btn text-white me-2"
              onClick={handleUpdate}
              style={{ backgroundColor: "#00264d" }}
            >
              Update
            </button>
            <button
              className="btn text-white"
              onClick={handleCancel}
              style={{ backgroundColor: "#00264d" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalSpareMaster;
