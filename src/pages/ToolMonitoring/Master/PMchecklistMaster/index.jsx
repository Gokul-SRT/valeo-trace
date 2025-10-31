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
  const [selectedLine, setSelectedLine] = useState('getall')
  const [selectedTool, setSelectedTool] = useState('getall')
  const [selectedOperat, setSelectedOperat] = useState('getall')
  const [selectedStatus, setSelectedStatus] = useState('getall')
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
        returnData = response;
        const options = returnData.map(item => ({
          key: item.lineMstCode || "",
          value: item.lineMstDesc || "",
          // label: item.productCode || ""
        }));
        setLineData(options);
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

  const getOperationDropDownData = useCallback(async () => {
    try {
      const response = await OperationMasterDropdown();
      console.log(response)
      let returnData = [];
      if (response) {
        returnData = response;
        const options = returnData.map(item => ({
          key: item.operationUniqueCode || item.operationId || "",
          value: item.operationDescription || "",
          // label: item.productCode || ""
        }));
        setOpeartionData(options);
        return returnData;
      } else {
        console.warn("OperationMstdropdown returned no data.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching operation dropdown data:", error);
      setOpeartionData([]);
    }
  }, []);


  const toolDropDownData = async (e) => {
    try {
      const response = await backendService("gettoolmasterdtl", {
        lineCode: e || "getAll",
        tenantId,
        branchCode,
        status: "getAll"
      });
      if (response?.data?.responseCode === '200') {
        const options = response?.data?.responseData.map((item) => ({
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
      // Sample data for PM Checklist Master
      getLineDropDownData()
      getOperationDropDownData()
      toolDropDownData()
      fetchData()
    }
  }, [modulesprop, screensprop]);

  const fetchData = async (type, e) => {
    try {
      const response = await backendService("getPmCheckListDtl", {
        status: type === 'status' ? e : selectedStatus,
        lineCode: type === 'line' ? e : selectedLine,
        operationCode: type === 'operation' ? e : selectedOperat,
        toolNo: type === 'tool' ? e : selectedTool,
        tenantId,
        branchCode,
      });
      if (response?.data?.responseCode === '200') {
        const updatedResponseData = response?.data?.responseData.map((item) => ({
          ...item,
          isUpdate: 1,
        }));
        setMasterList(updatedResponseData);
        setOriginalList(updatedResponseData);
      } else {
        setMasterList([]);
        setOriginalList([]);
        toast.error(response.data.responseMessage)
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Error fetching data. Please try again later.");
    }
  };

  const createorUpdate = async () => {
    try {
      const characteristicNameEmpty = masterList.filter((item) => !item.characteristicName);
      if (selectedLine && selectedTool && selectedOperat !== 'getall') {
        if (characteristicNameEmpty && characteristicNameEmpty?.length === 0) {
          const updatedList = [{
            line: selectedLine,
            toolNo: selectedTool,
            operation: selectedOperat,
            status: "1",
            tenantId,
            branchCode,
            dtlList: masterList
          }];
          const response = await backendService("pmCheckListMstsaveOrUpdate", updatedList);

          if (response?.data?.responseCode === '200') {
            toast.success(response.data.responseMessage);
            fetchData();
          } else {
            toast.error(response.data.responseMessage);
          }

        } else {
          toast.error("Please enter for the added row.");
        }
      } else {
        toast.error("Please select any one of the drop-down value.");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Error while saving data!");
    }
  }

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const columnDefs = [
    { headerName: "S.NO", field: "characteristicId", filter: "agNumberColumnFilter", editable: "false" },
    {
      headerName: "Characteristic",
      field: "characteristicName",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "SPEC/UNIT",
      field: "specUnit",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Measurement Tools",
      field: "mesurementType",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Sequence No",
      field: "seqNo",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Is Active",
      field: "status",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.status === "1" || params.data.status === 1,
      valueSetter: (params) => {
        params.data.status = params.newValue ? "1" : "0";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      status: "1",
      isUpdate: "0",
    };
    const CustNoEmpty = masterList.filter((item) => !item.characteristicName);
    if (CustNoEmpty && CustNoEmpty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      toast.error("Please enter the characteristic Name for the row.");
    }
  };

  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
  };

  const handleFilterChange = (type, value) => {
    const setters = {
      line: setSelectedLine,
      tool: setSelectedTool,
      operation: setSelectedOperat,
      status: setSelectedStatus,
    };
    setters[type]?.(value);
    fetchData(type, value)
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
    <div className="container mt-1 p-0">
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
              <label className="form-label fw-bold">Line</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange('line', e.target.value)}
                value={selectedLine}
              >
                <option value="getAll">Get All</option>
                {lineData.map((line) => (
                  <option key={line.key} value={line.key}>
                    {line.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">Tool Desc</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange('tool', e.target.value)}
                value={selectedTool}
              >
                <option value="getAll">Get All</option>
                {toolData.map((tool) => (
                  <option key={tool.key} value={tool.key}>
                    {tool.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-bold">Operation</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange('operation', e.target.value)}
                value={selectedOperat}
              >
                <option value="getAll">Get All</option>
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
          {/* {masterList.length > 0 && ( */}
          <AgGridReact
            ref={gridRef}
            rowData={masterList}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={100}
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
          />
          {/* )} */}

          <div className="text-center mt-4">
            <button
              onClick={() => onExportExcel(gridRef)}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
            >
              Excel
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

export default PMChecklistMaster;
