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
import { Modal, Select, message } from "antd";
import { toast } from "react-toastify";
import serverApi from "../../../serverAPI";
import CommonserverApi from "../../../CommonserverApi";

ModuleRegistry.registerModules([
  SetFilterModule,
  DateFilterModule,
  ExcelExportModule,
]);

const ProductMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [groupDropdown, setGroupDropdown] = useState([]);
  const [operationDropdown, setOperationDropdown] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [selectedOperations, setSelectedOperations] = useState([]);
  const gridRef = useRef(null);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = JSON.parse(localStorage.getItem("empID"));

  // ✅ Fetch Group Dropdown
  useEffect(() => {
    const fetchGroupDropdown = async () => {
      try {
        const payload = { tenantId, branchCode };
        const response = await CommonserverApi.post(
          "getProductGrpDropdown",
          payload
        );
        const data = response?.data?.responseData || response?.data || [];
        setGroupDropdown(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching group dropdown:", error);
        toast.error("Failed to load group dropdown values.");
      }
    };
    fetchGroupDropdown();
  }, [tenantId, branchCode]);

  // ✅ Fetch Operation Dropdown
  useEffect(() => {
    const fetchOperationDropdown = async () => {
      try {
        // ✅ Updated payload as per reference
        const payload = {
          isActive: "1",
          tenantId,
          branchCode,
        };

        const response = await serverApi.post("getoperationMasterdtl", payload);

        // Handle both response formats gracefully
        const data = response?.data?.responseData || response?.data || [];

        const formatted = data.map((item) => ({
          value: item.operationId,
          label: item.operationId,
        }));

        setOperationDropdown(formatted);
      } catch (error) {
        console.error("Error fetching Operation dropdown:", error);
        toast.error("Failed to load Operation Id dropdown values.");
      }
    };

    fetchOperationDropdown();
  }, [tenantId, branchCode]);

  const autoSizeAllColumns = (params) => {
    if (!params.columnApi || !params.columnApi.getAllColumns) return;
    const allColumnIds = params.columnApi
      .getAllColumns()
      .map((col) => col.getId());
    params.api.autoSizeColumns(allColumnIds);
  };

  useEffect(() => {
    setSelectedModule(modulesprop);
    setSelectedScreen(screensprop);
  }, [modulesprop, screensprop]);

  useEffect(() => {
    if (selectedModule && selectedScreen) fetchData();
  }, [selectedModule, selectedScreen]);

  const fetchData = async () => {
    try {
      const response = await serverApi.post("getproductmasterdtl", {
        isActive: "1",
        tenantId,
        branchCode,
      });

      if (!response.data || response.data.length === 0) {
        setMasterList([]);
        setOriginalList([]);
      } else {
        const updated = response.data.map((item) => ({
          ...item,
          isUpdate: 1,
          op: item.op || [],
        }));
        setMasterList(updated);
        setOriginalList(updated);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Error fetching data. Please try again later.");
    }
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  // ✅ Group Code Dropdown Editor (keeps selected value after update)
  const GroupCodeDropdownEditor = (props) => {
    const [selectedValue, setSelectedValue] = useState(props.value || "");

    useEffect(() => {
      setSelectedValue(props.value || "");
    }, [props.value]);

    const handleChange = (e) => {
      const value = e.target.value;
      setSelectedValue(value);

      const selectedGrp = groupDropdown.find((g) => g.grpCode === value);
      props.node.setDataValue("groupCode", selectedGrp?.grpCode || "");
      props.node.setDataValue("groupId", selectedGrp?.grpId || "");
    };

    return (
      <select
        value={selectedValue}
        onChange={handleChange}
        style={{ width: "100%", height: "100%" }}
      >
        <option value="">Select Group Code</option>
        {groupDropdown.map((grp) => (
          <option key={grp.grpId} value={grp.grpCode}>
            {grp.grpCode}
          </option>
        ))}
      </select>
    );
  };

  // ✅ Operation Id Cell Renderer
  const OperationIdCellRenderer = (props) => {
    const value = props.value || [];
    const names = Array.isArray(value)
      ? value.map((id) => {
          const op = operationDropdown.find((item) => item.value === id);
          return op ? op.label : id;
        })
      : [];
    const displayValue = names.join(", ");
    return (
      <span
        style={{ cursor: "pointer", color: displayValue ? "black" : "gray" }}
        onClick={() => handleOperationClick(props.data)}
        title="Click to edit Operation Ids"
      >
        {displayValue || "Select here.."}
      </span>
    );
  };

  const handleOperationClick = (row) => {
    setEditingRow(row);
    const existingOps = Array.isArray(row.op)
      ? row.op
      : row.op
      ? String(row.op).split(",")
      : [];
    setSelectedOperations(existingOps);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    if (editingRow) {
      const updatedList = masterList.map((item) =>
        item.productCode === editingRow.productCode
          ? { ...item, op: selectedOperations, isUpdate: 1 }
          : item
      );
      setMasterList(updatedList);
      setOriginalList(updatedList);
      setIsModalOpen(false);
      setSelectedOperations([]);
      setEditingRow(null);
      gridRef.current?.api.refreshCells({ force: true });
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedOperations([]);
    setEditingRow(null);
  };

  const columnDefs = [
    {
      headerName: "Product Code",
      field: "productCode",
      filter: "agTextColumnFilter",
      editable: (params) => params.data.isUpdate === 0,
    },
    {
      headerName: "Product Description",
      field: "productDesc",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "UOM",
      field: "productUomCode",
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Group Code",
      field: "groupCode",
      editable: true,
      cellEditor: GroupCodeDropdownEditor,
      cellRenderer: (params) => params.value || "",
    },
    {
      headerName: "Operation Id",
      field: "op",
      editable: false,
      suppressNavigable: true,
      cellRenderer: OperationIdCellRenderer,
    },
    {
      headerName: "IsActive",
      field: "isActive",
      filter: true,
      editable: true,
      cellRenderer: "agCheckboxCellRenderer",
      cellEditor: "agCheckboxCellEditor",
      valueGetter: (params) =>
        params.data.isActive === "1" || params.data.isActive === 1,
      valueSetter: (params) => {
        params.data.isActive = params.newValue ? "1" : "0";
        return true;
      },
      cellStyle: { textAlign: "center" },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
      groupCode: "",
      groupId: "",
      op: [],
    };
    const productcodeempty = masterList.filter((item) => !item.productCode);
    if (productcodeempty.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);
    } else {
      message.error("Please enter the Product code for all the rows.");
    }
  };

  // ✅ Update function sends both Group Code & Group Id
  const createorUpdate = async () => {
    try {
      const updatedList = masterList.map((item) => {
        const matchedGroup = groupDropdown.find(
          (grp) => grp.grpCode === item.groupCode
        );

        return {
          isUpdate: item.isUpdate,
          productCode: item.productCode,
          productCategoryCode: "FG",
          productUomCode: item.productUomCode,
          productDesc: item.productDesc,
          groupCode: item.groupCode || "",
          groupId: matchedGroup ? matchedGroup.grpId : item.groupId || "",
          op: Array.isArray(item.op) ? item.op : [],
          tenantId,
          isActive: item.isActive,
          updatedBy: employeeId,
          branchCode,
          isInventory: "0",
        };
      });

      const response = await serverApi.post(
        "insertupdateproductmaster",
        updatedList
      );

      if (response.data === "SUCCESS") {
        toast.success("Data saved successfully!");

        // ✅ After successful update, retain current Group Code values
        const refreshedData = masterList.map((row) => {
          const selectedGrp = groupDropdown.find(
            (g) => g.grpCode === row.groupCode
          );
          return {
            ...row,
            groupCode: selectedGrp?.grpCode || row.groupCode,
            groupId: selectedGrp?.grpId || row.groupId,
          };
        });
        setMasterList(refreshedData);
        setOriginalList(refreshedData);
        gridRef.current?.api.refreshCells({ force: true });
      } else if (response.data === "DUBLICATE") {
        toast.warning("Duplicate Product Code not allowed!");
      } else {
        toast.error("Save or Update failed.");
      }
    } catch (error) {
      console.error("Error saving product data:", error);
      toast.error("Error while saving data!");
    }
  };

  const handleCancel = () => {
    fetchData();
  };

  const handleFilterChange = (value) => {
    if (value === "GetAll" || !value) setMasterList(originalList);
    else if (value === "1")
      setMasterList(originalList.filter((item) => item.isActive === "1"));
    else setMasterList(originalList.filter((item) => item.isActive === "0"));
  };

  const onExportExcel = (ref) => {
    if (ref.current?.api)
      ref.current.api.exportDataAsExcel({ fileName: "ProductMaster.xlsx" });
  };

  return (
    <div className="container mt-1 p-0">
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          {selectedScreen} Details
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={handleAddRow}
            title="Add Row"
          />
        </div>

        <div className="p-3">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label fw-bold">Search Filter</label>
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
        </div>

        <div className="card-body p-3">
          <AgGridReact
            ref={gridRef}
            rowData={masterList}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={10}
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

          <div className="text-center mt-4">
            <button
              onClick={() => onExportExcel(gridRef)}
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d" }}
            >
              Excel
            </button>
            <button
              type="submit"
              className="btn text-white me-2"
              style={{ backgroundColor: "#00264d" }}
              onClick={createorUpdate}
            >
              Update
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn text-white"
              style={{ backgroundColor: "#00264d" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modal for Operation Id multi-select */}
      {isModalOpen && (
        <Modal
          title={`Select Operation Ids for Product: ${
            editingRow?.productCode || "New Product"
          }`}
          open={isModalOpen}
          onOk={handleModalSave}
          onCancel={handleModalCancel}
          okText="Save"
          cancelText="Cancel"
        >
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Select Operation Ids"
            value={selectedOperations}
            onChange={setSelectedOperations}
            options={operationDropdown}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductMaster;
