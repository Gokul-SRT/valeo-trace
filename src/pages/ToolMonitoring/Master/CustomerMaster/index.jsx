import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import "ag-grid-enterprise";
import store from "store";
import { backendService } from "../../../../service/ToolServerApi";
import { toast } from "react-toastify";
import Loader from "../../../.././Utills/Loader";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";

const CustomerMaster = ({ modulesprop, screensprop }) => {

  const [selectedModule, setSelectedModule] = useState(modulesprop);
  const [selectedScreen, setSelectedScreen] = useState(screensprop);
  const [masterList, setMasterList] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    try {
      const response = await backendService({
        requestPath: "getCustmasterdtl",
        requestData: {
          tenantId,
          branchCode,
          status: "getAll",
        },
      });
       console.log(response,"response--------")
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
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("No data available");
    } finally {
      setIsLoading(false);
    }
  };

  const createorUpdate = async () => {
    try {
      // Stop any active editing to capture current cell values
      if (gridRef.current?.api) {
        gridRef.current.api.stopEditing();
      }

      const CustNoEmpty = masterList.filter((item) => !item.custId);
      if (CustNoEmpty && CustNoEmpty?.length === 0) {
        // Check for changes
        const rowsToInsert = masterList.filter(row => row.isUpdate === "0");
        const rowsToUpdate = masterList.filter(row => row.changed === true);

        if (rowsToInsert.length === 0 && rowsToUpdate.length === 0) {
          toast.info("No data available");
          return;
        }

        const updatedList = masterList.map((item) => ({
          isUpdate: item.isUpdate,
          custId: item.custId,
          custName: item.custName,
          status: item.status,
          tenantId,
          branchCode,
        }));
        const response = await backendService({requestPath: "custDtlsaveOrUpdate", 
          requestData: updatedList});

        if (response?.responseCode === '200') {
          toast.success("Add/Update successful");
        } else {
          toast.error("Add/Update failed");
        }
        fetchData();
      } else {
        toast.error("Please fill all mandatory fields");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Add/Update failed");
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

  const MandatoryHeaderComponent = (props) => {
    return (
      <div>
        {props.displayName} <span style={{color: 'red'}}>*</span>
      </div>
    );
  };

  const columnDefs = [
    {
      headerName: "Customer No.",
      field: "custId",
      filter: "agTextColumnFilter",
      editable: (params) => (params.data.isUpdate === "0" ? true : false),
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Customer No." }
    },
    {
      headerName: "Customer Name",
      field: "custName",
      filter: "agTextColumnFilter",
      headerComponent: MandatoryHeaderComponent,
      headerComponentParams: { displayName: "Customer Name" }
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
        console.log("Status updated:", params.newValue, "-> Set to:", params.data.status);
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
      toast.error("Please fill all mandatory fields");
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
    setIsLoading(true);
    
    setTimeout(() => {
      if (!value || value === "GetAll") {
        setMasterList(originalList);
        console.log(originalList, 'originalList-------------')
      } else if (value === "1") {
        setMasterList(originalList.filter((item) => item.status === "1"));
      } else if (value === "0") {
        setMasterList(originalList.filter((item) => item.status === "0"));
      }
      setIsLoading(false);
    }, 100);
  };

  const onCellValueChanged = (params) => {
    const { colDef, newValue, oldValue, data } = params;
    const field = colDef.field;

    if ((newValue ?? "") === (oldValue ?? "")) return;

    // Check for duplicate customer ID
    if (field === "custId" && newValue) {
      const isDuplicate = masterList.some(item => 
        item.custId === newValue && item.isUpdate != '0'
      );
      
      if (isDuplicate) {
        toast.error("Duplicate entry");
        params.node.setDataValue(field, "");
        return;
      }
    }

    // Mark row as changed
    data.changed = true;

    const updatedList = [...masterList];
    updatedList[params.rowIndex] = params.data;
    setMasterList(updatedList);
    setOriginalList(updatedList);
  };

  const onExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Customer Master");

      worksheet.getRow(1).height = 60;
      worksheet.getColumn(1).width = 25;
      worksheet.getColumn(2).width = 40;
      worksheet.getColumn(3).width = 15;

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
      titleCell.value = "Customer Master Report";
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

      const headers = ["Customer No.", "Customer Name", "Status"];
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
        const row = worksheet.addRow([
          item.custId || "",
          item.custName || "",
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
        `CustomerMaster_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting Excel. Please try again.");
    }
  };

  return (
    <div>
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
              {masterList.length > 0 ? (
                <>
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
                    singleClickEdit={true}
                    onFirstDataRendered={autoSizeAllColumns}
                    onCellValueChanged={onCellValueChanged}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted">No data available</p>
                </div>
              )}

              {/* Buttons */}
              {masterList.length > 0 && (
                <div className="text-center mt-4">
                  <button
                    onClick={onExportExcel}
                    className="btn text-white me-2"
                    style={{
                      backgroundColor: "#00264d",
                      minWidth: "90px",
                    }}
                  >
                    Excel Export
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMaster;
