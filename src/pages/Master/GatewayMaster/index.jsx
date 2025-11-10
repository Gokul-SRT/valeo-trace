import React, { useRef, useEffect, useState, forwardRef } from "react";
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
import { Select, message } from "antd";
import { toast } from "react-toastify";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import serverApi from "../../../serverAPI";
import store from "store";
import EquipMstdropdown from "../../../CommonDropdownServices/Service/EquipmentMstService"; 

// Register AG Grid modules
ModuleRegistry.registerModules([
  SetFilterModule,
  DateFilterModule,
  ExcelExportModule,
]);

// 🔹 Custom MultiSelect Editor for Equipment IDs
const MultiSelectEditor = forwardRef((props, ref) => {
  const [selectedValues, setSelectedValues] = useState([]);

  useEffect(() => {
    if (props.value) {
      setSelectedValues(
        Array.isArray(props.value) ? props.value : props.value.split(",")
      );
    }
  }, [props.value]);

  React.useImperativeHandle(ref, () => ({
    getValue() {
      return selectedValues.join(",");
    },
  }));

  const handleChange = (values) => {
    setSelectedValues(values);
    props.data[props.colDef.field] = values;
  };

  return (
    <Select
      mode="multiple"
      value={selectedValues}
      style={{ width: "100%" }}
      placeholder="Select Equipment IDs"
      onChange={handleChange}
      options={props.values.map((item) => ({
        label: item.value,
        value: item.key,
      }))}
    />
  );
});

const GatewayMaster = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]); // 🔹 Dropdown options
  const [loading, setLoading] = useState(false);
  const gridRef = useRef(null);

  const defaultColDef = {
    sortable: true,
    filter: true,
    editable: true,
    flex: 1,
  };

  const tenantId = store.get("tenantId") || "";
  const branchCode = store.get("branchCode") || "";

  // 🔹 Load initial props
  useEffect(() => {
    setSelectedModule(modulesprop);
    setSelectedScreen(screensprop);
  }, [modulesprop, screensprop]);

  
  useEffect(() => {
    if (selectedModule && selectedScreen) {
      fetchGatewayMasterData();
      fetchEquipmentDropdown(); 
    }
  }, [selectedModule, selectedScreen]);

  
  const fetchEquipmentDropdown = async () => {
    try {
      const result = await EquipMstdropdown();
      if (Array.isArray(result)) {
        const formatted = result.map((item) => ({
          key: item.equipmentId,
          value: item.equipmentDesc ,
        }));
        setEquipmentData(formatted);
      } else {
        setEquipmentData([]);
        toast.warning("No equipment data found.");
      }
    } catch (error) {
      console.error("Error fetching equipment dropdown:", error);
      toast.error("Failed to load equipment dropdown data");
    }
  };


  const fetchGatewayMasterData = async () => {
    try {
      setLoading(true);
      const payload = { tenantId, branchCode };
      const response = await serverApi.post("getGateWayMasterRetrieve", payload);

      if (
        response.data?.responseCode === "200" &&
        Array.isArray(response.data?.responseData)
      ) {
        const apiData = response.data?.responseData.map((item) => ({
          gatewayId: item.gatewayId,
          gatewayLocation: item.gatewayLocation,
          equipmentId: item.equipmentId ? item.equipmentId.split(",") : [],
          equipmentDescriptions: item.equipmentDescriptions ? item.equipmentDescriptions : [],
          isUpdate: 1, 
        }));

        setMasterList(apiData);
        setOriginalList(apiData);
      } else {
        toast.warning("No data found for Gateway Master");
        setMasterList([]);
        setOriginalList([]);
      }
    } catch (error) {
      console.error("Error fetching Gateway Master data:", error);
      toast.error("Failed to fetch Gateway Master data");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 AG Grid column definitions
  const columnDefs = [
    {
      headerName: "Gateway ID",
      field: "gatewayId",
      filter: "agTextColumnFilter",
      editable: (params) => params.data.isUpdate === 0, // Editable only for new rows
    },
    {
      headerName: "Equipment ID(s)",
      field: "equipmentId",
      editable: true,
      cellEditor: MultiSelectEditor,
      cellEditorParams: { values: equipmentData },
      valueFormatter: (params) => {
        const ids = Array.isArray(params.value)
          ? params.value
          : params.value?.split(",") || [];
        return ids
          .map((id) => {
            const eq = equipmentData.find((item) => item.key === id);
            return eq ? eq.value : id;
          })
          .join(", ");
      },
    },
  ];

  // 🔹 Add new blank row
  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
      gatewayId: "",
      gatewayLocation: "",
      equipmentId: [],
      equipmentDescriptions: [],
    };

    const hasEmpty = masterList.some((item) => !item.gatewayId);
    if (hasEmpty) {
      message.error("Please enter Gateway ID for all rows first.");
      return;
    }

    const updated = [...masterList, emptyRow];
    setMasterList(updated);
    setOriginalList(updated);
  };

  // 🔹 Insert / Update API Integration
  const createOrUpdate = async () => {
    try {
      const payload = masterList.map((item) => ({
        gatewayId: item.gatewayId,
        location: item.gatewayLocation || "",
        tenantId,
        branchCode,
        isFlag: item.isUpdate === 0 ? 1 : 0, // 1 = Insert, 0 = Update
        eqidList: Array.isArray(item.equipmentId)
          ? item.equipmentId
          : (item.equipmentId || "").split(","),
      }));

      console.log("Sending payload:", payload);

      const response = await serverApi.post(
        "getGateWayMasterInsertAndUpdate",
        payload
      );

      if (response.data?.responseCode === "200") {
        toast.success(response.data?.responseDataMessage || "Success");
        fetchGatewayMasterData(); 
      } else {
        toast.error(response.data?.responseDataMessage || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving Gateway Master:", error);
      toast.error("Failed to save Gateway Master data");
    }
  };


  const handleCancel = () => {
    setMasterList(originalList);
    setSelectedModule("");
    setSelectedScreen("");
    setOriginalList([]);
  };

  // 🔹 Excel export
  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Gateway Master");

      worksheet.columns = [
        { header: "Gateway ID", key: "gatewayId", width: 20 },
        { header: "Gateway Location", key: "gatewayLocation", width: 25 },
        { header: "Equipment ID(s)", key: "equipmentId", width: 40 },
        { header: "Equipment Description(s)", key: "equipmentDescriptions", width: 50 },
      ];

      masterList.forEach((row) => {
        worksheet.addRow({
          gatewayId: row.gatewayId,
          gatewayLocation: row.gatewayLocation,
          equipmentId: Array.isArray(row.equipmentId)
            ? row.equipmentId.join(", ")
            : row.equipmentId,
          equipmentDescriptions: row.equipmentDescriptions,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `Gateway_Master_Report_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (err) {
      toast.error("Error exporting to Excel");
    }
  };

  return (
    <div className="container mt-1 p-0">
      <div className="card shadow" style={{ borderRadius: "6px" }}>
        <div
          className="card-header text-white fw-bold d-flex justify-content-between align-items-center"
          style={{ backgroundColor: "#00264d" }}
        >
          {selectedScreen || "Gateway Master"} Details
          <PlusOutlined
            style={{ fontSize: "20px", cursor: "pointer", color: "white" }}
            onClick={handleAddRow}
            title="Add Row"
          />
        </div>

        <div className="p-3">
          {loading ? (
            <div className="text-center text-secondary">Loading data...</div>
          ) : (
            <>
              <div className="card-body p-3">
                <AgGridReact
                  ref={gridRef}
                  rowData={masterList}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  pagination={true}
                  paginationPageSize={10}
                  domLayout="autoHeight"
                  singleClickEdit={true}
                  onCellValueChanged={(params) => {
                    const updatedList = [...masterList];
                    updatedList[params.rowIndex] = params.data;
                    setMasterList(updatedList);
                    setOriginalList(updatedList);
                  }}
                />

                <div className="text-center mt-4">
                  <button
                    onClick={onExportExcel}
                    className="btn text-white me-2"
                    style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                  >
                    Excel
                  </button>
                  <button
                    onClick={createOrUpdate}
                    className="btn text-white me-2"
                    style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                  >
                    Update
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn text-white"
                    style={{ backgroundColor: "#00264d", minWidth: "90px" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GatewayMaster;
