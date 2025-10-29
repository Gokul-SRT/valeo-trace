import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import store from "store";
import serverApi from "../../../../service/ToolServerApi";
import { toast } from "react-toastify";

const CustomerMaster = ({ modulesprop, screensprop }) => {

  const [selectedModule, setSelectedModule] = useState(modulesprop);
  const [selectedScreen, setSelectedScreen] = useState(screensprop);
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const gridRef = useRef(null);
  
  const tenantId = store.get("tenantId")
  const branchCode = store.get('branchCode');
  
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
    }
  }, [modulesprop, screensprop]);

   const fetchData = async (e) => {
    try {
      const response = await serverApi.post("getCustmasterdtl", {
        tenantId,
        branchCode,
        status: "getAll"
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
      const CustNoEmpty = masterList.filter((item) => !item.custId);
      if (CustNoEmpty && CustNoEmpty?.length === 0) {
        const updatedList =  masterList.map((item) =>({
         
            isUpdate: item.isUpdate,
            custId: item.custId,
            custName: item.custName,
            status: item.status,
            tenantId,
            branchCode,
        }));
        const response = await serverApi.post("custDtlsaveOrUpdate", updatedList);

        if (response?.data?.responseCode === '200') {
          toast.success(response.data.responseMessage);
          fetchData();
        } else {
          toast.error(response.data.responseMessage);
        }
      
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

  // Custom renderer for handling disabled checkbox
  const CustomCheckboxRenderer = (props) => {
    const handleChange = (e) => {
      if (props.data.isDisabled) return;
      props.setValue(e.target.checked);
    };

    return (
      <input
        type="checkbox"
        checked={props.value}
        onChange={handleChange}
        disabled={props.data.isDisabled}
        style={{
          cursor: props.data.isDisabled ? "not-allowed" : "pointer",
        }}
      />
    );
  };

  const columnDefs = [
    {
      headerName: "Customer ID",
      field: "custId",
      filter: "agTextColumnFilter",
      editable: (params) => (params.data.isUpdate === "0" ? true : false)
    },
    {
      headerName: "Customer Name",
      field: "custName",
      filter: "agTextColumnFilter",
    },
    // {
    //   headerName: "Status",
    //   field: "status",
    //   filter: true,
    //   editable: true,
    //   cellRenderer: CustomCheckboxRenderer,
    //   valueGetter: (params) => params.data.status === "1" || params.data.status === 1,
    //   valueSetter: (params) => {
    //    params.data.status = params.newValue ? "1" : "0";
    //     return true;
    //   },
    //   cellStyle: { textAlign: "center" },
    // },
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
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  // + Button Click
  const handleAddRow = () => {
    const newRow = {
      custId: "",
      custName: "",
      status: "1",
      isUpdate: "0",
      isDisabled: true, 
    };
    const CustNoEmpty = masterList.filter((item) => !item.custId);
        if (CustNoEmpty && CustNoEmpty?.length === 0) {
          const updated = [...masterList, newRow];
          setMasterList(updated);
          setOriginalList(updated);
        } else {
          toast.error("Please enter the Customer Id for all the rows.");
        }
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
      console.log(originalList,'originalList-------------')
    } else if (value === "1") {
      setMasterList(originalList.filter((item) => item.status === "1"));
    } else if (value === "0") {
      setMasterList(originalList.filter((item) => item.status === "0"));
    }
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api) {
      ref.current.api.exportDataAsExcel({
        fileName: `CustomerMaster.xlsx`,
      });
    } else {
      alert("Grid is not ready!");
    }
  };

  return (
    <div className="container mt-1 p-0">
      {/* Match size and alignment with Tool Monitoring Master */}
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card shadow mt-4">
            {/* Card Header */}
            <div
              className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
              style={{
                backgroundColor: "#00264d",
                borderTopLeftRadius: "8px",
                borderTopRightRadius: "8px",
                padding: "10px 15px",
              }}
            >
              Customer Master
              <PlusOutlined
                style={{
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "white",
                }}
                onClick={handleAddRow}
                title="Add Row"
              />
            </div>

            {/* Card Body */}
            <div className="card-body p-3">
              {/* Filter Dropdown */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Status</label>
                  <select
                    className="form-select"
                    onChange={(e) => handleFilterChange(e.target.value)}
                  >
                    <option value="GetAll">Get All</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Grid */}
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

              {/* Buttons */}
              <div className="text-center mt-4">
                <button
                  onClick={() => onExportExcel(gridRef)}
                  className="btn text-white me-2"
                  style={{
                    backgroundColor: "#00264d",
                    minWidth: "90px",
                  }}
                >
                  Excel
                </button>
                <button
                  type="submit"
                  className="btn text-white me-2"
                  style={{
                    backgroundColor: "#00264d",
                    minWidth: "90px",
                  }}
                  onClick={createorUpdate}
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn text-white"
                  style={{
                    backgroundColor: "#00264d",
                    minWidth: "90px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMaster;
