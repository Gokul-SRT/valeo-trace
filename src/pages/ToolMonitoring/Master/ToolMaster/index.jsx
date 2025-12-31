import React, { useRef, useEffect, useState, useCallback , forwardRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { Select, Modal } from "antd";
// import "ag-grid-enterprise";
import store from "store";
import { toast } from "react-toastify";
import { backendService, commonBackendService } from "../../../../service/ToolServerApi";
// import commonApi from "../../../../CommonserverApi";
import LineMstdropdown from "../../../../CommonDropdownServices/Service/LineMasterSerive";
import OperationMasterDropdown from "../../../../CommonDropdownServices/Service/OperationMasterService";

import Loader from "../../../.././Utills/Loader";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";

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
   const [isLoading, setIsLoading] = useState(false);
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
        returnData = response?.responseData;
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
    setIsLoading(true);
            getLineDropDownData()
        getOperationDropDownData()
        getProductDropDownData()
        getCustomerDropDownData()
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
      } else {
        setMasterList([]);
        setOriginalList([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("No data available");
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
      // Stop any active editing to capture current cell values
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
      }

      // Validation checks for all mandatory fields
      const ToolNoEmpty = masterList.filter((item) => !item.toolNo || item.toolNo.trim() === "");
      const ToolDescEmpty = masterList.filter((item) => !item.toolDesc || item.toolDesc.trim() === "");
      const MaxShotsEmpty = masterList.filter((item) => !item.maxShots || item.maxShots.toString().trim() === "");
      const LineEmpty = masterList.filter((item) => !item.line || item.line.trim() === "");
      const OperationEmpty = masterList.filter((item) => !item.operation || item.operation.trim() === "");
      const ProductCodeEmpty = masterList.filter((item) => !item.modelId || (Array.isArray(item.modelId) ? item.modelId.length === 0 : item.modelId.toString().trim() === ""));
      const InvalidToolNo = masterList.filter((item) => item.toolNo && item.toolNo.length > 20);
      const InvalidMaxShots = masterList.filter((item) => item.maxShots && item.maxShots.toString().trim() !== "" && (isNaN(item.maxShots) || parseInt(item.maxShots) < 0 || parseInt(item.maxShots) > 100000000));
      
      // Check for any mandatory field missing
      if (ToolNoEmpty?.length > 0 || ToolDescEmpty?.length > 0 || MaxShotsEmpty?.length > 0 || LineEmpty?.length > 0 || OperationEmpty?.length > 0 || ProductCodeEmpty?.length > 0) {
        toast.error("Please fill all mandatory(*) fields");
        return;
      }
      
      if (InvalidToolNo && InvalidToolNo?.length > 0) {
        toast.error("Tool No cannot exceed 20 characters.");
        return;
      }
      
      if (InvalidMaxShots && InvalidMaxShots?.length > 0) {
        toast.error("Maximum Shot Count must be a valid positive number and cannot exceed 100000000.");
        return;
      }
      
      if (ToolNoEmpty?.length === 0 && ToolDescEmpty?.length === 0 && MaxShotsEmpty?.length === 0 && LineEmpty?.length === 0 && OperationEmpty?.length === 0 && ProductCodeEmpty?.length === 0 && InvalidToolNo?.length === 0 && InvalidMaxShots?.length === 0) {
        // Check for changes
        const rowsToInsert = masterList.filter(row => row.isUpdate === "0" || row.isUpdate === 0);
        const rowsToUpdate = masterList.filter(row => row.changed === true && row.isUpdate !== "0" && row.isUpdate !== 0);

        console.log("masterList:", masterList);
        console.log("rowsToInsert:", rowsToInsert);
        console.log("rowsToUpdate:", rowsToUpdate);

        if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
          toast.info("No data available");
          return;
        }

        // Send rows - either new rows or changed rows
        const payloadRows = [...rowsToInsert, ...rowsToUpdate];



        const formattedRows = payloadRows.map(item => {
          const formatIds = (ids) => {
            if (Array.isArray(ids)) {
              return ids.filter(v => v !== undefined && v !== null && v !== '').join(',');
            }
            if (typeof ids === 'string') {
              return ids;
            }
            return '';
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
            status: item.status == "1"  ? "1" : "0",
            tenantId,
            updatedBy: employeeId,
            branchCode,
          };
        });

        const response = await backendService({requestPath:"saveOrUpdate", requestData:formattedRows});

        if (response?.responseCode === '200') {
          toast.success("Add/Update successful");
        } else {
          toast.error("Add/Update failed");
        }
        fetchData();
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Add/Update failed");
    }
  }

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
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


  const NumberOnlyEditor = forwardRef((props, ref) => {
    const [value, setValue] = useState(props.value || "");
    const inputRef = useRef(null);
  
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, []);
  
    React.useImperativeHandle(ref, () => ({
      getValue() {
        return value;
      },
      isCancelBeforeStart() {
        return false;
      },
      isCancelAfterEnd() {
        return false;
      },
      afterGuiAttached() {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }
    }));
  
    const handleKeyDown = (e) => {
      // Allow: backspace, delete, tab, escape, enter, home, end, left, right
      if ([8, 9, 27, 13, 46, 35, 36, 37, 39].indexOf(e.keyCode) !== -1 ||
          // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true)) {
        return;
      }
      
      // Check if adding this digit would exceed the limit
      if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105) {
        const digit = e.keyCode >= 96 ? e.keyCode - 96 : e.keyCode - 48;
        const newValue = value + digit;
        const numericValue = parseInt(newValue) || 0;
        console.log('ncenec');
        
        if (numericValue > 1000000) {
          e.preventDefault();
          setTimeout(() => {
            toast.error("Maximum 1000000 reached");
          }, 0);
          return;
        }
      }
      
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    };
    
  
    const handleChange = (e) => {
      const newValue = e.target.value.replace(/[^0-9]/g, '');
      const numericValue = parseInt(newValue) || 0;
      
      if (numericValue > 1000000) {
        setValue("1000000");
        // Update the row data immediately
        if (props.data && props.colDef) {
          props.data[props.colDef.field] = "1000000";
          props.data.changed = true;
        }
        setTimeout(() => {
          toast.error("Maximum 1000000 reached");
        }, 0);
        return;
      }
      
      if (newValue.length <= 7) {
        setValue(newValue);
        // Update the row data immediately
        if (props.data && props.colDef) {
          props.data[props.colDef.field] = newValue;
          props.data.changed = true;
        }
      }
    };
  
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{ width: "100%", border: "none", outline: "none", padding: "4px" }}
        maxLength={7}
      />
    );
  });

  const MultiSelectEditor = forwardRef((props, ref) => {
    const [selectedValues, setSelectedValues] = useState([]);
  
    useEffect(() => {
      if (props.data && props.colDef.field) {
        const initial = props.data[props.colDef.field];
        if (typeof initial === "string" && initial.length > 0) {
          setSelectedValues(initial.split(",")); // string to array
        } else if (Array.isArray(initial)) {
          setSelectedValues(initial); // already array
        } else {
          setSelectedValues([]); // fallback empty
        }
      }
    }, [props.data, props.colDef.field]);
  
    React.useImperativeHandle(ref, () => ({
      getValue() {
        return selectedValues.join(","); // always string
      },
    }));
  
    const handleChange = (values) => {
      setSelectedValues(values);
      const newValue = values.join(",");
      props.data[props.colDef.field] = newValue; // update row data as string
      props.data.changed = true; // mark as changed
    };
  
    return (
      <Select
        mode="multiple"
        value={selectedValues}
        style={{ width: "100%" }}
        onChange={handleChange}
        placeholder="Select Product Codes"
        options={props.values.map((item) => ({
          label: item.value,
          value: item.key,
        }))}
      />
    );
  });

  const gridContext = {
    handleCellClick: handleCellClick,
    customerData: customerData,
  };

  const MandatoryHeaderComponent = (props) => {
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
      headerName: "Tool No.", 
      field: "toolNo", 
      editable: (params) => (params.data.isUpdate === "0" ? true : false),
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Tool No." }
    },
    { 
      headerName: "Tool Description", 
      field: "toolDesc",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Tool Description" },
      valueSetter: (params) => {
        params.data.toolDesc = params.newValue;
        params.data.changed = true;
        return true;
      }
    },
    {
      headerName: "Maximum Shot Count (Nos.)",
      field: "maxShots",
      cellEditor: NumberOnlyEditor,
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Maximum Shot Count (Nos.)" },
      valueSetter: (params) => {
        console.log('MaxShots valueSetter called:', params.newValue, 'Old:', params.oldValue);
        params.data.maxShots = params.newValue;
        params.data.changed = true;
        return true;
      }
    },
    {
      headerName: "Line",
      field: "line",
      editable: true,
      cellEditor: "agSelectCellEditor",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Line" },
      cellEditorParams: {
        values: lineData.map(item => item.key), // These are the Line Codes
      },
      valueFormatter: (params) => { // This displays the Line Description
        const option = lineData.find(item => item.key === params.value);
        return option ? option.value : params.value;
      },
      valueSetter: (params) => {
        params.data.line = params.newValue;
        params.data.changed = true;
        return true;
      }
    },
    {
      headerName: "Operation",
      field: "operation",
      editable: true,
      cellEditor: "agSelectCellEditor",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Operation" },
      cellEditorParams: {
        values: operationData.map(item => item.key),
      },
      valueFormatter: (params) => {
        const option = operationData.find(item => item.key === params.value);
        return option ? option.value : params.value;
      },
      valueSetter: (params) => {
        params.data.operation = params.newValue;
        params.data.changed = true;
        return true;
      }
    },
    // {
    //   headerName: "Customer",
    //   field: "customerId",
    //   editable: false,
    //   cellEditor: "agSelectCellEditor",
    //   suppressNavigable: true,
    //   // cellEditorParams: { values: customerOptions },
    //   filter: "agSetColumnFilter",
    //   cellRenderer: ModelIdCellRenderer,
    //   //   valueGetter: (params) => {
    //   //     const customerId = params.data.customerId;
    //   //     const customer = customerData.find(item => item.key === customerId);
    //   //     return customer ? customer.label : customerId;
    //   //   },
    // },

      {
      headerName: "Product Code",
      field: "modelId",
      editable: true,
      cellEditor: MultiSelectEditor,
      cellEditorParams: { values: productData },
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Product Code" },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const keys =
          typeof params.value === "string"
            ? params.value.split(",")
            : params.value;
        return keys
          .map((k) => {
            const option = productData.find((item) => item.key === k);
            return option ? option.value : k;
          })
          .join(", ");
      },
      valueSetter: (params) => {
        params.data.modelId = params.newValue;
        params.data.changed = true;
        return true;
      }
    },
    {
      headerName: "Status",
      field: "status",
      filter: false,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => params.data.status === "1" || params.data.status === 1,
      valueSetter: (params) => {
        params.data.status = params.newValue ? "1" : "0";
        params.data.changed = true;
        console.log("Status updated:", params.newValue, "-> Set to:", params.data.status);
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
      changed: true, // <-- mark as changed
      localId: Date.now().toString(),
    };

    // Validation before adding new row
    const ToolNoEmpty = masterList.filter((item) => !item.toolNo || item.toolNo.trim() === "");
    const LineEmpty = masterList.filter((item) => !item.line || item.line.trim() === "");
    const InvalidMaxShots = masterList.filter((item) => item.maxShots && (isNaN(item.maxShots) || item.maxShots < 0 || item.maxShots.toString().length > 8));
    
    if (ToolNoEmpty && ToolNoEmpty?.length > 0) {
      toast.error("Please fill all mandatory fields");
      return;
    }
    
    if (LineEmpty && LineEmpty?.length > 0) {
      toast.error("Please fill all mandatory fields");
      return;
    }
    
    if (InvalidMaxShots && InvalidMaxShots?.length > 0) {
      toast.error("Please enter valid Maximum Shot Count for all existing rows before adding a new row.");
      return;
    }
    
    if (ToolNoEmpty?.length === 0 && LineEmpty?.length === 0 && InvalidMaxShots?.length === 0) {
      setMasterList((prev) => {
        const updated = [...prev, emptyRow];
        setOriginalList(updated);
        setTimeout(() => {
          const api = gridRef.current?.api;
          if (api) {
            const totalRows = updated.length;
            const pageSize = api.paginationGetPageSize();
            const lastPage = Math.floor((totalRows - 1) / pageSize);
            api.paginationGoToPage(lastPage);
            api.ensureIndexVisible(totalRows - 1, "bottom");
            
            // Auto-focus on the first cell of the new row (Tool No.)
            setTimeout(() => {
              api.setFocusedCell(totalRows - 1, "toolNo");
              api.startEditingCell({
                rowIndex: totalRows - 1,
                colKey: "toolNo"
              });
            }, 200);
          }
        }, 100);
        return updated;
      });
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
    setIsLoading(true);
    
    setTimeout(() => {
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
        filteredList = filteredList.filter((item) => String(item.status) === "1");
      } else if (newSelectedStatus === "Inactive") {
        filteredList = filteredList.filter((item) => String(item.status) === "0");
      }

      setMasterList(filteredList);
      setIsLoading(false);
    }, 100);
  };

  const handleModelModalSave = () => {
    // Validation for modal save
    if (editingField === 'modelId' && (!selectedModelIds || selectedModelIds.length === 0)) {
      toast.error("Please select at least one Model ID.");
      return;
    }
    
    if (editingField === 'customerId' && (!selectedCustomerIds || selectedCustomerIds.length === 0)) {
      toast.error("Please select at least one Customer ID.");
      return;
    }
    
    if (editingToolData) {
      const updatedMasterList = masterList.map(item => {
        const isTargetRow = (item.toolNo && item.toolNo === editingToolData.toolNo) ||
          (item.localId && item.localId === editingToolData.localId);

        if (isTargetRow) {
          const updateObject = {
            ...item,
            changed: true,
          };
          if (editingField === 'modelId') {
            // Store as comma-separated string
            updateObject.modelId = Array.isArray(selectedModelIds) ? selectedModelIds.join(',') : selectedModelIds;
          } else if (editingField === 'customerId') {
            updateObject.customerId = Array.isArray(selectedCustomerIds) ? selectedCustomerIds.join(',') : selectedCustomerIds;
          }

          return updateObject;
        }
        return item;
      });

      setMasterList(updatedMasterList);

      // Update the grid node data to ensure AG Grid recognizes the change
      if (gridRef.current?.api) {
        gridRef.current.api.forEachNode((node) => {
          const isTargetRow = (node.data.toolNo && node.data.toolNo === editingToolData.toolNo) ||
            (node.data.localId && node.data.localId === editingToolData.localId);
          if (isTargetRow) {
            const updatedData = { ...node.data, changed: true };
            if (editingField === 'modelId') {
              // Store as comma-separated string
              updatedData.modelId = Array.isArray(selectedModelIds) ? selectedModelIds.join(',') : selectedModelIds;
            } else if (editingField === 'customerId') {
              updatedData.customerId = Array.isArray(selectedCustomerIds) ? selectedCustomerIds.join(',') : selectedCustomerIds;
            }
            node.setData(updatedData);
          }
        });
      }

      setIsModelIdModalOpen(false);
      setEditingToolData(null);
      setSelectedModelIds([]);
      setSelectedCustomerIds([]);
      setEditingField(null);
    }
  };

  const handleModelModalCancel = () => {
    setIsModelIdModalOpen(false);
    setEditingToolData(null);
    setSelectedModelIds([]);
    setSelectedCustomerIds([]);
    setEditingField(null);
  };

  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Tool Master");

      worksheet.getRow(1).height = 60;
      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 30;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 20;
      worksheet.getColumn(5).width = 20;
      worksheet.getColumn(6).width = 25;
      worksheet.getColumn(7).width = 15;

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
      titleCell.value = "Tool Master Report";
      titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

      worksheet.mergeCells("C1:D2");
      const dateCell = worksheet.getCell("C1");
      dateCell.value = `Generated On: ${moment().format("DD/MM/YYYY HH:mm:ss")}`;
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

      const headers = ["Tool No.", "Tool Description", "Max Shot Count", "Line", "Operation", "Product Code", "Status"];
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

      masterList.forEach((item) => {
        const lineDesc = lineData.find(line => line.key === item.line)?.value || item.line;
        const operationDesc = operationData.find(op => op.key === item.operation)?.value || item.operation;
        const row = worksheet.addRow([
          item.toolNo || "",
          item.toolDesc || "",
          item.maxShots || "",
          lineDesc || "",
          operationDesc || "",
          item.modelId || "",
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
        `ToolMaster_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Excel. Please try again.");
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



  // Check if update button should be disabled
  const isUpdateDisabled = () => {
    return masterList.some(item => 
      item.maxShots && 
      item.maxShots.toString().trim() !== "" && 
      parseInt(item.maxShots) > 1000000
    );
  };

  const onCellValueChanged = (params) => {
    const { colDef, newValue, oldValue, data } = params;
    const field = colDef.field;

     console.log("iceiec")

    if ((newValue ?? "") === (oldValue ?? "")) return;

    // Validation for tool number
    if (field === "toolNo") {
      if (!newValue || newValue.trim() === "") {
        toast.error("Tool No cannot be empty.");
        params.node.setDataValue(field, "");
        return;
      }
      
      if (newValue.length > 20) {
        toast.error("Tool No cannot exceed 20 characters.");
        params.node.setDataValue(field, oldValue || "");
        return;
      }
      
      // Check for duplicate tool number
      const isDuplicate = masterList.some(item => 
        item.toolNo === newValue && item.isUpdate != '0'
      );
      
      if (isDuplicate) {
        toast.error("Duplicate entry");
        params.node.setDataValue(field, "");
        return;
      }
    }
    
    // Validation for tool description
    if (field === "toolDesc") {
      if (newValue && newValue.length > 100) {
        toast.error("Tool Description cannot exceed 100 characters.");
        params.node.setDataValue(field, oldValue || "");
        return;
      }
      
      // Check for duplicate tool description
      if (newValue && newValue.trim() !== "") {
        const isDuplicate = masterList.some(item => 
          item.toolDesc === newValue && item !== data
        );
        
        if (isDuplicate) {
          toast.error("Duplicate Tool Description is not allowed");
          params.node.setDataValue(field, oldValue || "");
          return;
        }
      }
    }

    

    // Validation for max shots
    if (field === "maxShots") {
     
      // Remove any non-numeric characters
      const numericValue = newValue ? newValue.toString().replace(/[^0-9]/g, '') : '';
      
      if(numericValue === ""){
        params.node.setDataValue(field, oldValue || "10000000");
      }

      // Check if value exceeds 100000000
      if (parseInt(numericValue) > 10000000) {
        toast.error("Maximum Shot Count cannot exceed 10000000.");
        params.node.setDataValue(field, oldValue || "");
        return;
      }
      
      if (numericValue !== newValue.toString()) {
        // If non-numeric characters were removed, update with cleaned value
        params.node.setDataValue(field, numericValue);
        return;
      }
      
      if (newValue && (isNaN(newValue) || newValue < 0)) {
        toast.error("Maximum Shot Count must be a valid positive number.");
        params.node.setDataValue(field, oldValue || "");
        return;
      }
    }

    // Validation for line
    if (field === "line") {
      if (!newValue || newValue.trim() === "") {
        toast.error("Line is required.");
        params.node.setDataValue(field, oldValue || "");
        return;
      }
    }

    // Mark row as changed
    params.data.changed = true;
    
    // Update masterList state with the new value
    setMasterList((prev) => {
      return prev.map((row, idx) => {
        if (idx === params.node.rowIndex) {
          return { ...row, [field]: newValue, changed: true };
        }
        return row;
      });
    });
    
    console.log(`Cell changed - Field: ${field}, Old: ${oldValue}, New: ${newValue}, Row marked as changed:`, params.data.changed);
  };
  
  return (
    <div>
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
          <div className="ag-theme-alpine" style={{ width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={masterList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              pagination={true}
              domLayout="autoHeight"
              singleClickEdit={true}
              onFirstDataRendered={autoSizeAllColumns}
              context={gridContext}
              onCellValueChanged={onCellValueChanged}
            />
          </div>
          </div>
          {/* )} */}

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
              style={{ 
                backgroundColor: isUpdateDisabled() ? "#6c757d" : "#00264d", 
                minWidth: "90px",
                cursor: isUpdateDisabled() ? "not-allowed" : "pointer"
              }}
              onClick={createorUpdate}
              disabled={isUpdateDisabled()}
              title={isUpdateDisabled() ? "Please correct Maximum Shot Count values (must be ≤ 1000000)" : "Update"}
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
