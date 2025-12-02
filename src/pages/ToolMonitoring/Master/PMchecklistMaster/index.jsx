import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import LineMstdropdown from "../../../../CommonDropdownServices/Service/LineMasterSerive";
import { backendService } from "../../../../service/ToolServerApi";
import store from "store";
import { toast } from "react-toastify";
import Loader from "../../../.././Utills/Loader";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import { ModuleRegistry } from "ag-grid-community";
import { CellStyleModule } from "ag-grid-community";
import { CheckboxEditorModule } from "ag-grid-community";

ModuleRegistry.registerModules([CellStyleModule, CheckboxEditorModule]);

// Custom Spec/Unit Editor
const SpecUnitRenderer = ({ data, update }) => {
  const [isSplit, setIsSplit] = useState(data.specUnit?.includes("±") || false);
  const [base, setBase] = useState(isSplit ? data.specUnit.split("±")[0].trim() : data.specUnit || "");
  const [tolerance, setTolerance] = useState(isSplit ? data.specUnit.split("±")[1]?.trim() : "");

  useEffect(() => {
    update(isSplit ? `${base}±${tolerance}` : base);
  }, [base, tolerance, isSplit]);

  // AG Grid input style
  const inputStyle = {
    border: "1px solid #d9d9d9",
    borderRadius: "2px",
    padding: "2px 4px",
    height: "24px",
    fontSize: "13px",
    width: "100px",
    boxSizing: "border-box",
  };

  const checkboxStyle = {
    margin: "0 4px",
    width: "16px",
    height: "16px",
  };

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    height: "100%",
  };

  return (
    <div style={containerStyle}>
      <input
        style={inputStyle}
        value={base}
        onChange={(e) => setBase(e.target.value)}
      />
      <input
        type="checkbox"
        checked={isSplit}
        onChange={(e) => setIsSplit(e.target.checked)}
        title="Enable ± split"
        style={checkboxStyle}
      />
      {isSplit && (
        <>
          <span style={{ fontSize: "13px" }}>±</span>
          <input
            style={inputStyle}
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
          />
        </>
      )}
    </div>
  );
};


const SpecUnitCellEditor = forwardRef((props, ref) => {
  const initialValue = props.value || "";
  const hasPlusMinus = initialValue.includes("±");

  const [isSplitMode, setIsSplitMode] = useState(hasPlusMinus);
  const [baseValue, setBaseValue] = useState(
    hasPlusMinus ? initialValue.split("±")[0].trim() : initialValue
  );
  const [toleranceValue, setToleranceValue] = useState(
    hasPlusMinus ? initialValue.split("±")[1].trim() : ""
  );

  useImperativeHandle(ref, () => ({
    getValue: () => (isSplitMode ? `${baseValue} ± ${toleranceValue}` : baseValue),
    isPopup: () => true,
  }));

  const handleSingleChange = (e) => {
    const newVal = e.target.value.replace(/[+\-±]/g, "");
    setBaseValue(newVal);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <input
        style={{ width: "140px" }}
        value={baseValue}
        onChange={isSplitMode ? (e) => setBaseValue(e.target.value) : handleSingleChange}
      />
      <input
        type="checkbox"
        checked={isSplitMode}
        onChange={(e) => setIsSplitMode(e.target.checked)}
        title="Enable ± split mode"
      />
      {isSplitMode && (
        <>
          <span>±</span>
          <input
            style={{ width: "120px" }}
            value={toleranceValue}
            onChange={(e) => setToleranceValue(e.target.value)}
          />
        </>
      )}
    </div>
  );
});

const PMChecklistMaster = ({ modulesprop, screensprop }) => {
  const tenantId = store.get("tenantId");
  const branchCode = store.get("branchCode");

  const [selectedModule, setSelectedModule] = useState(modulesprop);
  const [selectedScreen, setSelectedScreen] = useState(screensprop);
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [operationData, setOpeartionData] = useState([]);
  const [toolData, setToolData] = useState([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedTool, setSelectedTool] = useState("");
  const [selectedOperat, setSelectedOperat] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("getall");
  const [isLoading, setIsLoading] = useState(false);
  const gridRef = useRef(null);

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi.getAllColumns().map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  const getLineDropDownData = useCallback(async () => {
    try {
      const response = await LineMstdropdown();
      let options = [];
      if (response) {
        options = response.map((item) => ({
          key: item.lineMstCode || "",
          value: item.lineMstDesc || "",
        }));
        setLineData(options);
      }
    } catch (error) {
      console.error(error);
      setLineData([]);
    }
  }, []);

  const getOperationDropDownData = async (tool) => {
    try {
      const payload = { tenantId, branchCode, lineCode: selectedLine, toolNo: tool };
      const res = await backendService({ requestPath: "getOperationByLineCode", requestData: payload });
      const options = res.responseData?.map((item) => ({
        key: item.operationId || "",
        value: item.operationDesc || "",
      }));
      setOpeartionData(options);
    } catch {
      toast.error("No data available");
      setOpeartionData([]);
    }
  };

  const toolDropDownData = async (e) => {
    try {
      const response = await backendService({
        requestPath: "gettoolmasterdtl",
        requestData: { lineCode: e || "getAll", tenantId, branchCode, status: "getAll" },
      });
      if (response?.responseCode === "200") {
        const options = response.responseData.map((item) => ({
          key: item.toolNo || "",
          value: item.toolDesc || "",
        }));
        setToolData(options);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedModule && selectedScreen) getLineDropDownData();
  }, [modulesprop, screensprop]);

  const fetchData = async (type, e) => {
    const currentLine = type === "line" ? e : selectedLine;
    const currentTool = type === "tool" ? e : selectedTool;
    const currentOperation = type === "operation" ? e : selectedOperat;

    if (!currentLine || !currentTool || !currentOperation) {
      setMasterList([]);
      setOriginalList([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await backendService({
        requestPath: "getPmCheckListDtl",
        requestData: {
          status: type === "status" ? e : selectedStatus,
          lineCode: currentLine,
          operationCode: type === "operation" ? e : selectedOperat,
          toolNo: currentTool,
          tenantId,
          branchCode,
        },
      });
      if (response?.responseCode === "200") {
        const updatedResponseData = response.responseData.map((item, index) => ({
          ...item,
          id: index + 1,
          isUpdate: "1",
        }));
        setMasterList(updatedResponseData);
        setOriginalList(updatedResponseData);
      } else {
        setMasterList([]);
        setOriginalList([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("No data available");
    } finally {
      setIsLoading(false);
    }
  };

  const createorUpdate = async () => {
    try {
      if (gridRef.current?.api) gridRef.current.api.stopEditing();

      const rowsToInsert = masterList.filter((row) => row.isUpdate === "0");
      const rowsToUpdate = masterList.filter((row) => row.changed && row.isUpdate === "1");

      if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
        toast.info("No data available");
        return;
      }

      const missingNames = rowsToInsert.some((item) => !item.characteristicName);
      if (rowsToInsert.length > 0 && (!selectedLine || !selectedTool || !selectedOperat || missingNames)) {
        toast.error("Please fill all mandatory fields");
        return;
      }

      const changedRows = [...rowsToInsert, ...rowsToUpdate];
      const formattedRows = changedRows.map((item) => ({
        isUpdate: item.isUpdate,
        characteristicId: item.characteristicId,
        characteristicName: item.characteristicName,
        specUnit: item.specUnit,
        mesurementType: item.mesurementType,
        seqNo: item.seqNo,
        status: item.status,
        tenantId,
        branchCode,
      }));

      const updatedList = [
        { line: selectedLine, toolNo: selectedTool, operation: selectedOperat, status: "1", tenantId, branchCode, dtlList: formattedRows },
      ];

      const response = await backendService({ requestPath: "pmCheckListMstsaveOrUpdate", requestData: updatedList });

      if (response?.responseCode === "200") toast.success("Add/Update successful");
      else toast.error("Add/Update failed");

      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Add/Update failed");
    }
  };

  const defaultColDef = { sortable: true, filter: true, editable: true, flex: 1 };

  const onCellValueChanged = (params) => {
    params.data.changed = true;
    setMasterList((prevList) =>
      prevList.map((item) => (item === params.data ? { ...item, changed: true } : item))
    );
  };

  const onCellEditingStarted = (params) => (params.data.changed = true);
  const onCellEditingStopped = (params) => (params.data.changed = true);

  const MandatoryHeaderComponent = (props) => (
    <div>{props.displayName} <span style={{ color: "red" }}>*</span></div>
  );

  const frameworkComponents = { specUnitCellEditor: SpecUnitCellEditor };

  const columnDefs = [
    { headerName: "S.NO", field: "id", filter: "agNumberColumnFilter", editable: false },
    {
      headerName: "Characteristic",
      field: "characteristicName",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Characteristic" },
    },
    {
  headerName: "SPEC/UNIT",
  field: "specUnit",
  filter: "agTextColumnFilter",
  editable: false, // disable default editing
  cellRenderer: (params) => <SpecUnitRenderer data={params.data} update={(val) => {
    params.data.specUnit = val;
    params.data.changed = true;
  }} />,
},
    {
      headerName: "Measurement Tools",
      field: "mesurementType",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Measurement Tools" },
    },
    {
      headerName: "Sequence No",
      field: "seqNo",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Sequence No" },
    },
    {
      headerName: "Status",
      field: "status",
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.status === "1" || params.data.status === 1,
      valueSetter: (params) => { params.data.status = params.newValue ? "1" : "0"; return true; },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    if (!selectedLine || !selectedTool || !selectedOperat) { toast.error("Please fill all mandatory fields"); return; }
    const emptyRow = { status: "1", isUpdate: "0", changed: true };
    const emptyCheck = masterList.filter((item) => !item.characteristicName);
    if (emptyCheck.length === 0) { const updated = [...masterList, emptyRow]; setMasterList(updated); setOriginalList(updated); }
    else toast.error("Please fill all mandatory fields");
  };

  const handleCancel = () => {
    setSelectedLine(""); setSelectedTool(""); setSelectedOperat(""); setSelectedStatus("getall");
    setMasterList([]); setOriginalList([]);
  };

  const handleFilterChange = (type, value) => {
    if (type === "line") { setSelectedLine(value); setSelectedTool(""); setSelectedOperat(""); setToolData([]); setOpeartionData([]); if (value) toolDropDownData(value); }
    else if (type === "tool") { setSelectedTool(value); setSelectedOperat(""); setOpeartionData([]); if (value) getOperationDropDownData(value); }
    else if (type === "operation") setSelectedOperat(value);
    else if (type === "status") setSelectedStatus(value);

    fetchData(type, value);
  };

  // Excel export remains same...
  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("PM Checklist Master");

      worksheet.getRow(1).height = 60;
      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 30;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 15;

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
      titleCell.value = "PM Checklist Master Report";
      titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
      titleCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      worksheet.mergeCells("C1:D2");
      const dateCell = worksheet.getCell("C1");
      dateCell.value = `Generated On: ${moment().format(
        "DD/MM/YYYY HH:mm:ss"
      )}`;
      dateCell.font = { bold: true, size: 11, color: { argb: "FF00264D" } };
      dateCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

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

      const headers = [
        "S.NO",
        "Characteristic",
        "SPEC/UNIT",
        "Measurement Tools",
        "Sequence No",
        "Status",
      ];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      headerRow.height = 25;

      masterList.forEach((item) => {
        const row = worksheet.addRow([
          item.id || "",
          item.characteristicName || "",
          item.specUnit || "",
          item.mesurementType || "",
          item.seqNo || "",
          item.status === "1" ? "Active" : "Inactive",
        ]);
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { size: 10 };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `PMChecklistMaster_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Excel. Please try again.");
    }
  };

  return (
    <div>
      <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
        <div className="card-header text-white fw-bold d-flex justify-content-between align-items-center" style={{ backgroundColor: "#00264d" }}>
          PM Checklist Master
          <PlusOutlined style={{ fontSize: "20px", cursor: "pointer", color: "white" }} onClick={handleAddRow} title="Add Row" />
        </div>

        {/* Filter Dropdown */}
        <div className="p-3">
          <div className="row">
            {/* Line */}
            <div className="col-md-3">
              <label className="form-label fw-bold">Line <span style={{ color: "red" }}>*</span></label>
              <select className="form-select" onChange={(e) => handleFilterChange("line", e.target.value)} value={selectedLine}>
                <option value="">Select Line</option>
                {lineData.map((line) => (<option key={line.key} value={line.key}>{line.value}</option>))}
              </select>
            </div>
            {/* Tool */}
            <div className="col-md-3">
              <label className="form-label fw-bold">Tool Desc <span style={{ color: "red" }}>*</span></label>
              <select className="form-select" onChange={(e) => handleFilterChange("tool", e.target.value)} value={selectedTool}>
                <option value="">Select Tool</option>
                {toolData.map((tool) => (<option key={tool.key} value={tool.key}>{tool.value}</option>))}
              </select>
            </div>
            {/* Operation */}
            <div className="col-md-3">
              <label className="form-label fw-bold">Operation <span style={{ color: "red" }}>*</span></label>
              <select className="form-select" onChange={(e) => handleFilterChange("operation", e.target.value)} value={selectedOperat}>
                <option value="">Select Operation</option>
                {operationData.map((operat) => (<option key={operat.key} value={operat.key}>{operat.value}</option>))}
              </select>
            </div>
            {/* Status */}
            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select className="form-select" onChange={(e) => handleFilterChange("status", e.target.value)} value={selectedStatus}>
                <option value="getAll">Get All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="card-body p-3">
          {!selectedLine || !selectedTool || !selectedOperat ? (
            <div className="text-center p-4"><p className="text-muted">No data available</p></div>
          ) : masterList.length > 0 ? (
            <div style={{ position: "relative" }}>
              {isLoading && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(255,255,255,0.6)", zIndex: 2, borderRadius: "8px" }}>
                  <Loader />
                </div>
              )}
              <AgGridReact
                ref={gridRef}
                rowData={masterList}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                paginationPageSize={100}
                pagination
                domLayout="autoHeight"
                onFirstDataRendered={autoSizeAllColumns}
                frameworkComponents={frameworkComponents}
                onCellEditingStarted={onCellEditingStarted}
                onCellEditingStopped={onCellEditingStopped}
                onCellValueChanged={onCellValueChanged}
              />
              <div className="text-center mt-4">
                <button className="btn text-white me-2" style={{ backgroundColor: "#00264d", minWidth: "90px" }} onClick={createorUpdate}>Update</button>
                <button type="button" onClick={handleCancel} className="btn text-white" style={{ backgroundColor: "#00264d", minWidth: "90px" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4"><p className="text-muted">No data available</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PMChecklistMaster;
