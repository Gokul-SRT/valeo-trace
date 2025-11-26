import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import store from "store";
import { toast } from "react-toastify";
import { backendService, commonBackendService } from "../../../../service/ToolServerApi";
import Loader from "../../../.././Utills/Loader";

const CustomerProductMapping = ({ modulesprop, screensprop }) => {
  const [mappingList, setMappingList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("GetAll");
  const [loading, setLoading] = useState(false);
  const gridRef = useRef(null);

  const tenantId = store.get("tenantId");
  const branchCode = store.get('branchCode');
  const employeeId = store.get("employeeId");



  useEffect(() => {
    fetchData();
    getCustomerDropDownData();
    getProductDropDownData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await backendService({
        requestPath: "getCustomerProductMapping",
        requestData: { tenantId, branchCode }
      });
      
      if (response?.responseCode === '200') {
        const updatedData = response.responseData?.map((item, index) => ({
          ...item,
          id: item.mappingId || index + 1,
          isUpdate: 1
        })) || [];

        setMappingList(updatedData);
        setOriginalList(updatedData);
      } else {
        setMappingList([]);
        setOriginalList([]);
      }
    } catch (error) {
      console.error("Error fetching mapping data:", error);
      setMappingList([]);
      setOriginalList([]);
      toast.error("No data available");
    } finally {
      setLoading(false);
    }
  };

  const getCustomerDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        branchCode,
        isActive: "1",
      };
      
      const response = await commonBackendService({
        requestPath: "getcustomerDropdown",
        requestData: payload
      });
      
      if (response?.responseCode === '200' && response.responseData) {
        const options = response.responseData.map(item => ({
          customerId: item.customerId || "",
          customerName: item.customerName || ""
        }));
        setCustomerData(options);
      } else {
        toast.error("No data available");
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('No data available');
    }
  };

  const getProductDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        isActive: "1",
      };
      
      const response = await backendService({
        requestPath: "getProductDropdown",
        requestData: payload
      });
      
      if (response?.responseCode === '200' && response.responseData) {
        const options = response.responseData.map(item => ({
          productCode: item.productCode || "",
          productName: item.productDesc || ""
        }));
        setProductData(options);
      } else {
        toast.error("No data available");
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      toast.error('No data available');
    }
  };

  const createOrUpdate = async () => {
    try {
      // Check for empty required fields
      const emptyRows = mappingList.filter(row => !row.customerId || !row.productId);
      if (emptyRows.length > 0) {
        toast.error("Please fill all mandatory fields");
        return;
      }

      // Check for duplicates
      const duplicates = [];
      const seen = new Set();
      mappingList.forEach((row, index) => {
        const key = `${row.customerId}-${row.productId}`;
        if (seen.has(key)) {
          duplicates.push(index + 1);
        } else {
          seen.add(key);
        }
      });
      
      if (duplicates.length > 0) {
        toast.error("Duplicate entry");
        return;
      }

      const rowsToInsert = mappingList.filter(row => row.isUpdate === "0");
      const rowsToUpdate = mappingList.filter(row => row.isUpdate === "1" || row.isUpdate === 1);

      let payloadRows = [];
      if (rowsToInsert.length > 0 && rowsToUpdate.length > 0) {
        payloadRows = [...rowsToInsert, ...rowsToUpdate];
      } else if (rowsToInsert.length > 0) {
        payloadRows = rowsToInsert;
      } else if (rowsToUpdate.length > 0) {
        payloadRows = rowsToUpdate;
      } else {
        toast.info("No data available");
        return;
      }

      setLoading(true);
      const formattedRows = payloadRows.map(item => ({
        mappingId: item.mappingId || null,
        isUpdate: item.isUpdate,
        customerId: item.customerId,
        productId: item.productId,
        isActive: item.isActive,
        tenantId,
        updatedBy: employeeId,
        createdBy: employeeId,
        branchCode,
      }));

      const response = await backendService({
        requestPath: "saveCustomerProductMapping",
        requestData: formattedRows
      });
      
      if (response?.responseCode === '200') {
        toast.success("Add/Update successful");
        fetchData();
      } else {
        toast.error("Add/Update failed");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Add/Update failed");
    } finally {
      setLoading(false);
    }
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const MandatoryHeaderComponent = (props) => {
    return (
      <div>
        {props.displayName} <span style={{color: 'red'}}>*</span>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "S.No.",
      field: "sno",
      editable: false,
      filter: false,
      sortable: false,
      width: 80,
      valueGetter: (params) => {
        return params.node.rowIndex + 1;
      },
      cellStyle: { textAlign: "center" },
    },
    {
      headerName: "Customer",
      field: "customerId",
      editable: true,
      cellEditor: "agSelectCellEditor",
      filter: "agSetColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Customer" },
      cellEditorParams: {
        values: customerData.map(item => item.customerId),
      },
      valueFormatter: (params) => {
        const customer = customerData.find(item => item.customerId === params.value);
        return customer ? customer.customerName : params.value;
      },
    },
    {
      headerName: "Product Code",
      field: "productId",
      editable: true,
      cellEditor: "agSelectCellEditor",
      filter: "agSetColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Product Code" },
      cellEditorParams: {
        values: productData.map(item => item.productCode),
      },
      valueFormatter: (params) => {
        const product = productData.find(item => item.productCode === params.value);
        return product ? `${product.productName}` : params.value;
      },
    },
    {
      headerName: "Status",
      field: "isActive",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) => {
        return params.data.isActive === "1" || params.data.isActive === 1 || params.data.isActive === true;
      },
      valueSetter: (params) => {
        const newValue = params.newValue === true || params.newValue === "1" ? "1" : "0";
        if (params.data.isActive !== newValue) {
          params.data.isActive = newValue;
          params.data.isUpdate = params.data.isUpdate === '0' ? '0' : 1;
          return true;
        }
        return false;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      id: Date.now(),
      customerId: "",
      productId: "",
      isActive: "1",
      isUpdate: "0",
      localId: Date.now().toString(),
    };

    setMappingList((prev) => {
      const updated = [...prev, emptyRow];
      setTimeout(() => {
        const api = gridRef.current?.api;
        if (api) {
          const totalRows = updated.length;
          const pageSize = api.paginationGetPageSize();
          const lastPage = Math.floor((totalRows - 1) / pageSize);
          api.paginationGoToPage(lastPage);
          api.ensureIndexVisible(totalRows - 1, "bottom");
        }
      }, 100);
      return updated;
    });
  };

  const handleCancel = () => {
    setMappingList(originalList);
    setSelectedStatus("GetAll");
    fetchData();
  };

  const handleFilterChange = (value) => {
    setSelectedStatus(value);
    
    let filteredList = originalList;
    
    if (value === "Active") {
      filteredList = filteredList.filter((item) => item.isActive === "1");
    } else if (value === "Inactive") {
      filteredList = filteredList.filter((item) => item.isActive === "0");
    }
    
    setMappingList(filteredList);
  };

  const updateCellValue = (params) => {
    const { colDef, newValue, data } = params;
    const field = colDef.field;

    setMappingList((prev) =>
      prev.map((row) => {
        const isTargetRow = (row.id && row.id === data.id) ||
          (row.localId && row.localId === data.localId);
        
        if (!isTargetRow) return row;
        
        const updated = { 
          ...row, 
          [field]: newValue,
          isUpdate: row.isUpdate === '0' ? '0' : 1
        };
        
        return updated;
      })
    );
  };

  const onCellValueChanged = (params) => {
    const { colDef, newValue, oldValue, data } = params;
    const field = colDef.field;

    if ((newValue ?? "") === (oldValue ?? "")) return;

    setMappingList((prev) =>
      prev.map((row) => {
        const isTargetRow = (row.id && row.id === data.id) ||
          (row.localId && row.localId === data.localId);
        
        if (!isTargetRow) return row;
        
        const updated = { 
          ...row, 
          changed: true,
          isUpdate: row.isUpdate === '0' ? '0' : 1
        };
        
        updated[field] = newValue;
        return updated;
      })
    );
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `CustomerProductMapping.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  return (
    <div>
      <div className="card shadow mt-4" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          Customer Product Mapping
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
              <label className="form-label fw-bold">Status</label>
              <select
                className="form-select"
                value={selectedStatus}
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
          <div style={{ position: "relative" }}>
            {loading && (
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
              rowData={mappingList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={10}
              pagination={true}
              domLayout="autoHeight"
              onFirstDataRendered={autoSizeAllColumns}
              onCellValueChanged={onCellValueChanged}
            />
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => onExportExcel(gridRef)}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              disabled={loading}
            >
              Excel Export
            </button>
            <button
              type="submit"
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d", minWidth: "90px" }}
              onClick={createOrUpdate}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
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

export default CustomerProductMapping;