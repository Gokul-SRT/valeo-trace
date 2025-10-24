import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { Select, Modal } from "antd";
import "ag-grid-enterprise";
import store from "store";
import { toast } from "react-toastify";
import serverApi from "../../../../service/ToolServerApi";
import api from "../../../../serverAPI"
import commonApi from "../../../../CommonserverApi";

const ToolMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState(modulesprop);
  const [selectedScreen, setSelectedScreen] = useState(screensprop);
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [productData, setProductData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [isModelIdModalOpen, setIsModelIdModalOpen] = useState(false);
  const [editingToolData, setEditingToolData] = useState(null);
  const [selectedModelIds, setSelectedModelIds] = useState([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]); // State for customer multi-select
  const [editingField, setEditingField] = useState(null);
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

  useEffect(() => {
    if (selectedModule && selectedScreen) {
      fetchData()
      getProductDropDownData()
      getCustomerDropDownData()
    }
  }, [modulesprop, screensprop]);

  const fetchData = async (e) => {
    try {
      const response = await serverApi.post("gettoolmasterdtl", {
        lineCode: e || "getAll",
        tenantId,
        branchCode,
        status: "getAll"
      });
      if (response?.data?.responseCode === '200') {
        console.log(response)
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
      // console.log(response,"response--")
      // setMasterList(response.data);
      // setOriginalList(response.data);
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
      const response = await api.post("getProductDropdown", payload);

      let returnData = [];

      if (response?.data?.responseCode === '200' && response.data.responseData) {
        returnData = response.data.responseData;
      } else {
        toast.error(response.data.responseMessage || "Failed to load Child Parts.");
      }
      const options = returnData.map(item => ({
        key: item.productCode || "",
        value: item.productCode || "",
        label: item.productCode || ""
      }));
      console.log(options, 'options------')
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
      const response = await commonApi.post("getcustomerDropdown", payload);

      let returnData = [];

      if (response?.data?.responseCode === '200' && response.data.responseData) {
        returnData = response.data.responseData;
      } else {
        toast.error(response.data.responseMessage || "Failed to load Child Parts.");
      }
      const options = returnData.map(item => ({
        key: item.customerId || "",
        value: item.customerId || "",
        label: item.customerName || ""
      }));
      console.log(options, 'options------')
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

      const response = await serverApi.post("saveOrUpdate", updatedList);

      if (response?.data?.responseCode === '200') {
        toast.success(response.data.responseMessage);
        fetchData();
      } else {
        toast.error(response.data.responseMessage);
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

  const lineOptions = ["Cover Assembly", "Disc Assembly - 1", "Disc Assembly - 2"];
  const machineOptions = ["Machine-A", "Machine-B", "Machine-C"];
  // const customerOptions = ["Maruthi"];

  // const handleModelIdCellClick = (params) => {
  //   const toolData = params.data;
  //   setEditingToolData(toolData);

  //   let currentModelIds = [];
  //   if (toolData.modelId) {
  //     if (Array.isArray(toolData.modelId)) {
  //       currentModelIds = toolData.modelId;
  //     } else {
  //       currentModelIds = toolData.modelId.split(',').filter(id => id.trim() !== '');
  //     }
  //   }
  //   console.log("Model ID Clicked for Tool:", toolData.toolNo || `New Row (${toolData.localId})`);
  //   setSelectedModelIds(currentModelIds);
  //   setIsModelIdModalOpen(true);
  // };

  const handleCellClick = (params) => {
    const { colDef, data } = params;
    setEditingToolData(data);
    setEditingField(colDef.field); // Set which field is being edited

    let currentIds = [];
    if (colDef.field === 'modelId') {
      currentIds = Array.isArray(data.modelId) ? data.modelId : (data.modelId ? data.modelId.split(',').filter(id => id.trim() !== '') : []);
      setSelectedModelIds(currentIds);
      setSelectedCustomerIds([]); // Clear customer selection
    } else if (colDef.field === 'customerId') {
      currentIds = Array.isArray(data.customerId) ? data.customerId : (data.customerId ? data.customerId.split(',').filter(id => id.trim() !== '') : []);
      setSelectedCustomerIds(currentIds);
      setSelectedModelIds([]); // Clear model selection
    }

    setIsModelIdModalOpen(true);
  };

  const ModelIdCellRenderer = (props) => {
    let displayValue = ''; let currentIds = [];
    const { value, colDef, context } = props;

    if (colDef.field === 'modelId') {
      // For modelId, value is an array of product codes
      displayValue = Array.isArray(value) ? value.join(', ') : value || '';
    } else if (colDef.field === 'customerId') {
      // Handle customerId logic (string or array)
      currentIds = Array.isArray(value) ? value : (value ? String(value).split(',').filter(id => id.trim() !== '') : []);

      // Now map the IDs to names
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
    { headerName: "Tool ID", field: "toolNo", filter: "agTextColumnFilter", editable: (params) => (params.data.isUpdate === "0" ? true : false), },
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
      cellEditorParams: { values: lineOptions },
      filter: "agSetColumnFilter",
    },
    {
      headerName: "Operation",
      field: "operation",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: machineOptions },
      filter: "agSetColumnFilter",
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
    const updated = [...masterList, emptyRow];
    setMasterList(updated);
    setOriginalList(updated);
  };

  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
    fetchData();
  };

  const handleFilterChange = (value) => {
    if (!value || value === "GetAll") {
      setMasterList(originalList);
    } else if (value === "Active") {
      setMasterList(originalList.filter((item) => item.status === "1"));
    } else if (value === "Inactive") {
      setMasterList(originalList.filter((item) => item.status === "0"));
    }

    if (value === "Cover Assembly" || value === "Disc Assembly - 1" || value === "Disc Assembly - 2") {
      setMasterList(originalList.filter((item) => item.line === value));
    }
  };

  const handleModelModalSave = () => {
    console.log(editingToolData, "editingToolData--------")
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
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="GetAll">Get All</option>
                <option value="Cover Assembly">Cover Assembly</option>
                <option value="Disc Assembly - 1">Disc Assembly - 1</option>
                <option value="Disc Assembly - 2">Disc Assembly - 2</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                onChange={(e) => handleFilterChange(e.target.value)}
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
