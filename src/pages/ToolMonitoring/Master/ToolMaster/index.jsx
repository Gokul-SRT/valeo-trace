import React, { useRef, useEffect, useState, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { Select, Modal } from "antd";
import "ag-grid-enterprise";
import store from "store";
import { toast } from "react-toastify";
import { backendService, commonBackendService } from "../../../../service/ToolServerApi";
// import commonApi from "../../../../CommonserverApi";
import LineMstdropdown from "../../../../CommonDropdownServices/Service/LineMasterSerive";
import OperationMasterDropdown from "../../../../CommonDropdownServices/Service/OperationMasterService";
const ToolMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState(modulesprop);
  const [selectedScreen, setSelectedScreen] = useState(screensprop);
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [productData, setProductData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [operationData, setOpeartionData] = useState([]);
  const [isModelIdModalOpen, setIsModelIdModalOpen] = useState(false);
  const [editingToolData, setEditingToolData] = useState(null);
  const [selectedModelIds, setSelectedModelIds] = useState([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]); // State for customer multi-select
  const [editingField, setEditingField] = useState(null);
  const [selectedLineCode, setSelectedLineCode] = useState("getAll");
  const [selectedStatus, setSelectedStatus] = useState("GetAll");
  const gridRef = useRef(null);

  const tenantId = store.get("tenantId")
  const branchCode = store.get('branchCode');
  const employeeId = store.get("employeeId")

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

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      fetchData()
    }
  }, [modulesprop, screensprop, getLineDropDownData]);

  const fetchData = async (e) => {
    try {
      const response = await backendService({requestPath:"gettoolmasterdtl", 
        requestData: {
        lineCode: e || "getAll",
        tenantId,
        branchCode,
        status: "getAll"
      }});
      if (response?.responseCode === '200') {
        const updatedResponseData = response?.responseData.map((item) => ({
          ...item,
          isUpdate: 1,
        }));
        setMasterList(updatedResponseData);
        setOriginalList(updatedResponseData);
        getLineDropDownData()
        getOperationDropDownData()
        getProductDropDownData()
        getCustomerDropDownData()
      } else {
        setMasterList([]);
        setOriginalList([]);
        toast.error(response.responseMessage)
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Error fetching data. Please try again later.");
    }
  };

  const getProductDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        // branchCode,
        isActive: "1",
      }
      const response = await backendService({requestPath:"getProductDropdown", requestData:payload});

      let returnData = [];

      if (response?.responseCode === '200' && response.responseData) {
        returnData = response.responseData;
      } else {
        toast.error(response.responseMessage);
      }
      const options = returnData.map(item => ({
        key: item.productCode || "",
        value: item.productCode || "",
        label: item.productCode || ""
      }));
      setProductData(options);
      return returnData;

    } catch (error) {
      console.error('Error fetching child part dropdown data:', error);
      toast.error('Error fetching data. Please try again later.');
      return [];
    }
  }

  const getCustomerDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        branchCode,
        isActive: "1",
      }
      const response = await commonBackendService({requestPath:"getcustomerDropdown",requestData: payload});

      let returnData = [];
      console.log(response,"response customer")
      if (response?.responseCode === '200' && response.responseData) {
        returnData = response.responseData;
      } else {
        toast.error(response.responseMessage);
      }
      const options = returnData.map(item => ({
        key: item.customerId || "",
        value: item.customerId || "",
        label: item.customerName || ""
      }));
      setCustomerData(options);
      return returnData;

    } catch (error) {
      console.error('Error fetching child part dropdown data:', error);
      toast.error('Error fetching data. Please try again later.');
      return [];
    }
  }

  const createorUpdate = async () => {
    try {
      const ToolNoEmpty = masterList.filter((item) => !item.toolNo);
      if (ToolNoEmpty && ToolNoEmpty?.length === 0) {
        const updatedList = masterList.map(item => {
          const formatIds = (ids) => {
            return Array.isArray(ids)
              ? ids.join(',')
              : ids || '';
          };
          return {
            isUpdate: item.isUpdate,
            toolNo: item.toolNo,
            toolDesc: item.toolDesc,
            maxShots: item.maxShots,
            line: item.line,
            operation: item.operation,
            customerId: formatIds(item.customerId),
            modelId: formatIds(item.modelId),
            status: item.status,
            tenantId,
            updatedBy: employeeId,
            branchCode,
          };
        });

        const response = await backendService({requestPath:"saveOrUpdate", requestData:updatedList});

        if (response?.responseCode === '200') {
          toast.success(response.responseMessage);    
        } else {
          toast.error(response.responseMessage);
        }
        fetchData();
      }else {
        toast.error("Please enter the Tool No for all the rows.");
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

  const handleCellClick = (params) => {
    const { colDef, data } = params;
    setEditingToolData(data);
    setEditingField(colDef.field);

    let currentIds = [];
    if (colDef.field === 'modelId') {
      currentIds = Array.isArray(data.modelId) ? data.modelId : (data.modelId ? data.modelId.split(',').filter(id => id.trim() !== '') : []);
      setSelectedModelIds(currentIds);
      setSelectedCustomerIds([]);
    } else if (colDef.field === 'customerId') {
      currentIds = Array.isArray(data.customerId) ? data.customerId : (data.customerId ? data.customerId.split(',').filter(id => id.trim() !== '') : []);
      setSelectedCustomerIds(currentIds);
      setSelectedModelIds([]);
    }

    setIsModelIdModalOpen(true);
  };

  const ModelIdCellRenderer = (props) => {
    let displayValue = ''; let currentIds = [];
    const { value, colDef, context } = props;

    if (colDef.field === 'modelId') {
      displayValue = Array.isArray(value) ? value.join(', ') : value || '';
    } else if (colDef.field === 'customerId') {
      currentIds = Array.isArray(value) ? value : (value ? String(value).split(',').filter(id => id.trim() !== '') : []);
      const names = currentIds.map(id => {
        const customer = customerData.find(item => item.value === id);
        return customer ? customer.label : id;
      });
      displayValue = names.join(', ');
    }

    const content = displayValue || 'Select here..';
    const isNewRowOrEmpty = !displayValue;

    return (
      <span
        style={{
          cursor: 'pointer',
          color: isNewRowOrEmpty ? 'gray' : 'black',
        }}
        onClick={() => context.handleCellClick(props)} // Use the generic handler
        title={`Click to edit ${colDef.headerName}`}
      >
        {content}
      </span>
    );
  };


  const gridContext = {
    handleCellClick: handleCellClick,
    customerData: customerData,
  };

  const columnDefs = [
    { headerName: "Tool Id", field: "toolNo", filter: "agTextColumnFilter", editable: (params) => (params.data.isUpdate === "0" ? true : false), },
    { headerName: "Tool Desc", field: "toolDesc", filter: "agTextColumnFilter" },
    {
      headerName: "Maximum Shot Count (Nos.)",
      field: "maxShots",
      filter: "agNumberColumnFilter",
    },
    {
      headerName: "Line",
      field: "line",
      editable: true,
      cellEditor: "agSelectCellEditor",
      filter: "agSetColumnFilter",
      cellEditorParams: {
        values: lineData.map(item => item.key), // These are the Line Codes
      },
      valueFormatter: (params) => { // This displays the Line Description
        const option = lineData.find(item => item.key === params.value);
        return option ? option.value : params.value;
      },
    },
    {
      headerName: "Operation",
      field: "operation",
      editable: true,
      cellEditor: "agSelectCellEditor",
      filter: "agSetColumnFilter",
      cellEditorParams: {
        values: operationData.map(item => item.key),
      },
      valueFormatter: (params) => {
        const option = operationData.find(item => item.key === params.value);
        return option ? option.value : params.value;
      },
    },
    {
      headerName: "Customer",
      field: "customerId",
      editable: false,
      cellEditor: "agSelectCellEditor",
      suppressNavigable: true,
      // cellEditorParams: { values: customerOptions },
      filter: "agSetColumnFilter",
      cellRenderer: ModelIdCellRenderer,
      //   valueGetter: (params) => {
      //     const customerId = params.data.customerId;
      //     const customer = customerData.find(item => item.key === customerId);
      //     return customer ? customer.label : customerId;
      // },
    },
    {
      headerName: "Model Id",
      field: "modelId",
      filter: "agTextColumnFilter",
      editable: false,
      suppressNavigable: true,
      cellRenderer: ModelIdCellRenderer,
    },
    // {
    //   headerName: "Status",
    //   field: "status",
    //   filter: "agTextColumnFilter",
    //   editable: false,
    // },
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
        // params.data.status = params.newValue ? "Active" : "Inactive";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      toolNo: "",
      toolDesc: "",
      maxShots: "",
      line: "",
      operation: "",
      customerId: [],
      modelId: [],
      status: "1",
      isUpdate: "0",
      localId: Date.now().toString(),
    };

    const ToolNoEmpty = masterList.filter((item) => !item.toolNo);
    if (ToolNoEmpty && ToolNoEmpty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      toast.error("Please enter the Tool No for all the rows.");
    }
  };

  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
    fetchData();
  };

  const handleFilterChange = (type, value) => {
    let newSelectedLineCode = selectedLineCode;
    let newSelectedStatus = selectedStatus;

    if (type === 'line') {
      newSelectedLineCode = value;
      setSelectedLineCode(newSelectedLineCode);
    } else if (type === 'status') {
      newSelectedStatus = value;
      setSelectedStatus(newSelectedStatus);
    }

    let filteredList = originalList;

    // 1. Apply Line Filter
    if (newSelectedLineCode !== "getAll") {
      filteredList = filteredList.filter((item) => item.line === newSelectedLineCode);
    }

    // 2. Apply Status Filter (on the line-filtered list or the full list)
    if (newSelectedStatus === "Active") {
      filteredList = filteredList.filter((item) => item.status === "1");
    } else if (newSelectedStatus === "Inactive") {
      filteredList = filteredList.filter((item) => item.status === "0");
    }

    setMasterList(filteredList);
  };

  const handleModelModalSave = () => {
    if (editingToolData) {
      const updatedMasterList = masterList.map(item => {
        const isTargetRow = (item.toolNo && item.toolNo === editingToolData.toolNo) ||
          (item.localId && item.localId === editingToolData.localId);

        if (isTargetRow) {
          const updateObject = {
            ...item,
            isUpdate: item.isUpdate === '0' ? '0' : 1,
          };
          if (editingField === 'modelId') {
            updateObject.modelId = selectedModelIds;
          } else if (editingField === 'customerId') {
            updateObject.customerId = selectedCustomerIds;
          }
          return updateObject;
        }
        return item;
      });

      setMasterList(updatedMasterList);

      setIsModelIdModalOpen(false);
      setEditingToolData(null);
      setSelectedModelIds([]);
      setSelectedCustomerIds([]);
      setEditingField(null);
      gridRef.current?.api.refreshCells({ force: true });
    }
  };

  const handleModelModalCancel = () => {
    setIsModelIdModalOpen(false);
    setEditingToolData(null);
    setSelectedModelIds([]);
    setSelectedCustomerIds([]);
    setEditingField(null);
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `ToolMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  const modalTitle = editingField === 'customerId'
    ? `Customers for Tool: ${editingToolData?.toolNo || 'New Tool'}`
    : `Model IDs for Tool: ${editingToolData?.toolNo || 'New Tool'}`;

  const modalOptions = editingField === 'customerId'
    ? customerData
    : productData;

  const modalValue = editingField === 'customerId'
    ? selectedCustomerIds
    : selectedModelIds;

  const modalOnChange = editingField === 'customerId'
    ? setSelectedCustomerIds
    : setSelectedModelIds;

  return (
    <div className="container mt-1" style={{ padding: "0px" }}>
      <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Tool Master
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
                // value={selectedStatus}
                onChange={(e) => handleFilterChange('line', e.target.value)}
              >
                <option value="getAll">Get All</option>
                {lineData.map((line) => (
                  <option key={line.key} value={line.key}>
                    {line.value} {/* Display the line description */}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                // value={selectedLineCode}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
            paginationPageSize={10}
            pagination={true}
            domLayout="autoHeight"
            // singleClickEdit={true}
            onFirstDataRendered={autoSizeAllColumns}
            context={gridContext}
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
        {isModelIdModalOpen && (
          <Modal
            title={modalTitle}
            open={isModelIdModalOpen}
            onOk={handleModelModalSave}
            onCancel={handleModelModalCancel}
            okText="Save"
            cancelText="Cancel"
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select here.."
              value={modalValue}
              onChange={modalOnChange}
              options={modalOptions}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ToolMaster;
