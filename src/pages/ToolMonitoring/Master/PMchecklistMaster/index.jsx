import React, { useRef, useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import LineMstdropdown from "../../../../CommonDropdownServices/Service/LineMasterSerive";
import OperationMasterDropdown from "../../../../CommonDropdownServices/Service/OperationMasterService";
import { backendService } from "../../../../service/ToolServerApi";
import store from "store";
import { toast } from "react-toastify";
import Loader from "../../../.././Utills/Loader";

const PMChecklistMaster = ({ modulesprop, screensprop }) => {

  const tenantId = store.get("tenantId")
  const branchCode = store.get('branchCode');

  const [selectedModule, setSelectedModule] = useState(modulesprop);
  const [selectedScreen, setSelectedScreen] = useState(screensprop);
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [lineData, setLineData] = useState([])
  const [operationData, setOpeartionData] = useState([])
  const [toolData, setToolData] = useState([])
  const [selectedLine, setSelectedLine] = useState('')
  const [selectedTool, setSelectedTool] = useState('')
  const [selectedOperat, setSelectedOperat] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('getall')
  const [isLoading, setIsLoading] = useState(false);
  const gridRef = useRef(null);

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  const getLineDropDownData = useCallback(async () => {
    try {
      const response = await LineMstdropdown();
      console.log(response)
      let returnData = [];
      if (response) {
        returnData = response?.responseData;
        const options = returnData.map(item => ({
          key: item.lineMstCode || "",
          value: item.lineMstDesc || "",
          // label: item.productCode || ""
        }));
        setLineData(options);
        console.log("options" , options);
        return returnData;
      } else {
        console.warn("LineMstdropdown returned no data.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching line dropdown data:", error);
      setLineData([]);
    }
  }, []);


    const getOperationDropDownData = async (tool) => {
      try {
        const payload = { tenantId, branchCode , lineCode: selectedLine , toolNo: tool };
  
        const res = await backendService({
          requestPath: "getOperationByLineCode",
          requestData: payload,
        });
         const options = res.responseData?.map(item => ({
          key: item.operationId || "",
          value: item.operationDesc || "",
          // label: item.productCode || ""
        }));
        
        setOpeartionData(options);
      } catch {
        toast.error("No data available");
        setOpeartionData([]);
      }
    };


  // const getOperationDropDownData = useCallback(async () => {
  //   try {
  //     const response = await OperationMasterDropdown();
  //     console.log(response)
  //     let returnData = [];
  //     if (response) {
  //       returnData = response?.responseData;
  //       const options = returnData.map(item => ({
  //         key: item.operationUniqueCode || item.operationId || "",
  //         value: item.operationDescription || "",
  //         // label: item.productCode || ""
  //       }));
  //       setOpeartionData(options);
  //       return returnData;
  //     } else {
  //       console.warn("OperationMstdropdown returned no data.");
  //       return [];
  //     }
  //   } catch (error) {
  //     console.error("Error fetching operation dropdown data:", error);
  //     setOpeartionData([]);
  //   }
  // }, []);


  const toolDropDownData = async (e) => {
    try {
      const response = await backendService({requestPath:"gettoolmasterdtl",
        requestData: {
        lineCode: e || "getAll",
        tenantId,
        branchCode,
        status: "getAll"
      }});
      if (response?.responseCode === '200') {
        const options = response?.responseData.map((item) => ({
          key: item.toolNo || "",
          value: item.toolDesc || "",
        }));
        setToolData(options);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      getLineDropDownData()
    }
  }, [modulesprop, screensprop]);

  const fetchData = async (type, e) => {
    const currentLine = type === 'line' ? e : selectedLine;
    const currentTool = type === 'tool' ? e : selectedTool;
    const currentOperation = type === 'operation' ? e : selectedOperat;
    
    if (!currentLine || !currentTool || !currentOperation) {
      setMasterList([]);
      setOriginalList([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await backendService({requestPath:"getPmCheckListDtl",
        requestData:{
        status: type === 'status' ? e : selectedStatus,
        lineCode: currentLine,
        operationCode: type === 'operation' ? e : selectedOperat,
        toolNo: currentTool,
        tenantId,
        branchCode,
      }});
      if (response?.responseCode === '200') {
        const updatedResponseData = response?.responseData.map((item , index) => ({
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
      console.error("Error fetching master data:", error);
      toast.error("No data available");
    } finally {
      setIsLoading(false);
    }
  };

  // const createorUpdate = async () => {
  //   try {
  //     const characteristicNameEmpty = masterList.filter((item) => !item.characteristicName);
  //     if (selectedLine && selectedTool && selectedOperat !== 'getall' ) {
  //       if (characteristicNameEmpty && characteristicNameEmpty?.length === 0) {
  //         const updatedList = [{
  //           line: selectedLine,
  //           toolNo: selectedTool,
  //           operation: selectedOperat,
  //           status: "1",
  //           tenantId,
  //           branchCode,
  //           dtlList: masterList
  //         }];
  //         const response = await backendService({requestPath:"pmCheckListMstsaveOrUpdate", requestData: updatedList});

  //         if (response?.responseCode === '200') {
  //           toast.success(response.responseMessage);
  //         } else {
  //           toast.error(response.responseMessage);
  //         }
  //          fetchData();
  //       } else {
  //         toast.error("Please enter for the added row.");
  //       }
  //     } else {
  //       toast.error("Please select any one of the drop-down value.");
  //     }
  //   } catch (error) {
  //     console.error("Error saving data:", error);
  //     toast.error("Error while saving data!");
  //   }
  // }

  const createorUpdate = async () => {
    try {
      // Stop any active editing to capture current cell values
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
      }

      // Check for changes
      const rowsToInsert = masterList.filter(row => row.isUpdate === "0");
      const rowsToUpdate = masterList.filter(row => row.changed === true && row.isUpdate === "1");

      if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
        toast.info("No data available");
        return;
      }

      // Validation for new rows
      const missingNames = rowsToInsert.some(item => !item.characteristicName);
      if (rowsToInsert.length > 0) {
        if (!selectedLine || !selectedTool || !selectedOperat) {
          toast.error("Please fill all mandatory fields");
          return;
        }
        if (missingNames) {
          toast.error("Please fill all mandatory fields");
          return;
        }
      }

      // Only send changed rows (new + modified)
      const changedRows = [...rowsToInsert, ...rowsToUpdate];
      
      const formattedRows = changedRows.map(item => ({
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

      const updatedList = [{
        line: selectedLine,
        toolNo: selectedTool,
        operation: selectedOperat,
        status: "1",
        tenantId,
        branchCode,
        dtlList: formattedRows,
      }];

      const response = await backendService({
        requestPath: "pmCheckListMstsaveOrUpdate",
        requestData: updatedList,
      });

      if (response?.responseCode === '200') {
        toast.success("Add/Update successful");
      } else {
        toast.error("Add/Update failed");
      }

      fetchData();

    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Add/Update failed");
    }
  };


  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const onCellValueChanged = (params) => {
    params.data.changed = true;
    // Update masterList state immediately
    setMasterList(prevList => 
      prevList.map(item => 
        item === params.data ? { ...item, changed: true } : item
      )
    );
  };

  const onCellEditingStarted = (params) => {
    // Mark as changed when editing starts
    params.data.changed = true;
  };

  const onCellEditingStopped = (params) => {
    // Ensure changes are captured when editing stops
    params.data.changed = true;
    setMasterList(prevList => 
      prevList.map(item => 
        item === params.data ? { ...item, changed: true } : item
      )
    );
  };

  const MandatoryHeaderComponent = (props) => {
    return (
      <div>
        {props.displayName} <span style={{color: 'red'}}>*</span>
      </div>
    );
  };

  const columnDefs = [
    { headerName: "S.NO", field: "id", filter: "agNumberColumnFilter", editable: false },
    {
      headerName: "Characteristic",
      field: "characteristicName",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Characteristic" }
    },
    {
      headerName: "SPEC/UNIT",
      field: "specUnit",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "SPEC/UNIT" }
    },
    {
      headerName: "Measurement Tools",
      field: "mesurementType",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Measurement Tools" }
    },
    {
      headerName: "Sequence No",
      field: "seqNo",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Sequence No" }
    },
    {
      headerName: "Status",
      field: "status",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.status === "1" || params.data.status === 1,
      valueSetter: (params) => {
        params.data.status = params.newValue ? "1" : "0";
        params.data.changed = true;
        setMasterList(prevList => 
          prevList.map(item => 
            item === params.data ? { ...item, changed: true } : item
          )
        );
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    if (!selectedLine || !selectedTool || !selectedOperat) {
      toast.error("Please fill all mandatory fields");
      return;
    }
    const emptyRow = {
      status: "1",
      isUpdate: "0",
      changed: true,
    };
    const CustNoEmpty = masterList.filter((item) => !item.characteristicName);
    if (CustNoEmpty && CustNoEmpty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      toast.error("Please fill all mandatory fields");
    }
  };

  const handleCancel = () => {
    setSelectedLine("");
    setSelectedTool("");
    setSelectedOperat("");
    setSelectedStatus("getall");
    setMasterList([]);
    setOriginalList([]);
  };

  const handleFilterChange = (type, value) => {
    if(type === 'line'){
      setSelectedLine(value);
      setSelectedTool('');
      setSelectedOperat('');
      setToolData([]);
      setOpeartionData([]);
      if(value) {
        toolDropDownData(value);
      }
    } else if(type === 'tool'){
      setSelectedTool(value);
      setSelectedOperat('');
      setOpeartionData([]);
      if(value) {
        getOperationDropDownData(value);
      }
    } else if(type === 'operation'){
      setSelectedOperat(value);
    } else if(type === 'status'){
      setSelectedStatus(value);
    }
    
    fetchData(type, value);
  };


  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `PMChecklistMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div>
      <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          PM Checklist Master
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
              <label className="form-label fw-bold">Line <span style={{color: 'red'}}>*</span></label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange('line', e.target.value)}
                value={selectedLine}
              >
                <option value="">Select Line</option>
                {lineData.map((line) => (
                  <option key={line.key} value={line.key}>
                    {line.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">Tool Desc <span style={{color: 'red'}}>*</span></label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange('tool', e.target.value)}
                value={selectedTool}
              >
                <option value="">Select Tool</option>
                {toolData.map((tool) => (
                  <option key={tool.key} value={tool.key}>
                    {tool.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">Operation <span style={{color: 'red'}}>*</span></label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange('operation', e.target.value)}
                value={selectedOperat}
              >
                <option value="">Select Operation</option>
                {operationData.map((operat) => (
                  <option key={operat.key} value={operat.key}>
                    {operat.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange('status', e.target.value)}
                value={selectedStatus}
              >
                <option value="getAll">Get All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-3">
          {!selectedLine || !selectedTool || !selectedOperat ? (
            <div className="text-center p-4">
              <p className="text-muted">No data available</p>
            </div>
          ) : masterList.length > 0 ? (
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
            paginationPageSize={100}
            pagination={true}
            domLayout="autoHeight"
            onFirstDataRendered={autoSizeAllColumns}
            onCellEditingStarted={onCellEditingStarted}
            onCellEditingStopped={onCellEditingStopped}
            onCellValueChanged={onCellValueChanged}
                />
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={() => onExportExcel(gridRef)}
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

export default PMChecklistMaster;
