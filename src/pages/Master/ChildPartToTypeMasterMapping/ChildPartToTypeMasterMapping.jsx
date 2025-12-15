import React, { useRef, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AgGridReact } from "ag-grid-react";
import { PlusOutlined } from "@ant-design/icons";
import { Input, Button, Form, message } from "antd";
import { toast } from "react-toastify";
import store from "store";
import serverApi from "../../../serverAPI";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import moment from "moment";
import Loader from "../../../Utills/Loader";

const ChildPartToTypeMasterMapping = ({ modulesprop, screensprop }) => {
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [masterList, setMasterList] = useState([]);
  const [childPartData, setChildPartData] = useState([]);
  const [typeIdData, setTypeIdData] = useState([]);
  const [originalList, setOriginalList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const gridRef = useRef(null);

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
    if (selectedModule && selectedScreen) {
      loadOptionsAndData();
    }
  }, [selectedModule, selectedScreen]);

  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));
  const employeeId = JSON.parse(localStorage.getItem("employeeId"));

  //  Load dropdown options first, then grid data
  const loadOptionsAndData = async () => {
    try {
      setLoading(true);
      setOptionsLoaded(false);

      // Load both dropdown options in parallel
      await Promise.all([
        getChildPartDropDownData(),
        getTypeMasterDropDownData()
      ]);

      // Mark options as loaded
      setOptionsLoaded(true);

      // Now fetch the grid data
      await fetchData();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const payload = {
        tenantId,
        branchCode,
      };
      const response = await serverApi.post("getchildpartTypeMappingdtl", payload);

      if (response?.data?.responseCode === "200") {
        console.log(response);
        const updatedResponseData = response?.data?.responseData.map((item) => ({
          ...item,
          isUpdate: 1,
        }));
        setMasterList(updatedResponseData);
        setOriginalList(structuredClone(updatedResponseData));
      } else {
        setMasterList([]);
        setOriginalList([]);
        toast.error(response.data.responseMessage);
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

  const RequiredHeader = (props) => {
    return (
      <span>
        <span style={{ color: "red" }}>*</span> {props.displayName}
      </span>
    );
  };

  const getTypeMasterDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        branchCode,
      };
      const response = await serverApi.post("gettypeMasterdtl", payload);

      let returnData = [];

      if (response?.data?.responseCode === "200" && response.data.responseData) {
        returnData = response.data.responseData;
      } else {
        toast.error(response.data.responseMessage || "Failed to load Type Id.");
      }
      
      // Store full data from API
      setTypeIdData(returnData);
      return returnData;
    } catch (error) {
      console.error("Error fetching Type Id dropdown data:", error);
      toast.error("Error fetching data. Please try again later.");
      return [];
    }
  };

  const getChildPartDropDownData = async () => {
    try {
      const payload = {
        tenantId,
        branchCode,
        isActive: "1",
      };
      const response = await serverApi.post("getChildPartDropDown", payload);

      let returnData = [];

      if (response?.data?.responseCode === "200" && response.data.responseData) {
        returnData = response.data.responseData;
      } else {
        toast.error(response.data.responseMessage || "Failed to load Child Parts.");
      }
      
      // Store full data from API
      setChildPartData(returnData);
      return returnData;
    } catch (error) {
      console.error("Error fetching child part dropdown data:", error);
      toast.error("Error fetching data. Please try again later.");
      return [];
    }
  };

  const columnDefs = [
    // {
    //   headerName: "Child Map Id",
    //   field: "childPacMapId",
    //   filter: "agTextColumnFilter",
    //   editable: (params) => params.data.isUpdate === 0,
    // },

    {
      headerName: "SNo",
      valueGetter: (params) => params.node.rowIndex + 1,
      editable: false,
      filter: true,
    },
    {
      headerName: "Child Part Code",
      field: "childPartId",
      filter: "agTextColumnFilter",
      editable: true,
      cellEditor: "agSelectCellEditor",
      //headerComponent: RequiredHeader,
      //headerClass: "required-header", // Add red * via CSS
      cellEditorParams: (params) => ({
        values: childPartData.map((p) => p.childPartId),
      }),
      valueGetter: (params) => {
        return params.data.childPartId;
      },
      valueSetter: (params) => {
        params.data.childPartId = params.newValue;
        return true;
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const found = childPartData.find((p) => p.childPartId === params.value);
        return found ? `${found.childPartCode}-${found.childPartDesc}` : params.value;
      },
      
      filterValueGetter: (params) => {
        const found = childPartData.find((p) => p.childPartId === params.data.childPartId);
        return found ? `${found.childPartCode}-${found.childPartDesc}` : "";
      },
    },
    {
      headerName: "Type Code",
      field: "typeId",
      filter: "agTextColumnFilter",
      editable: true,
      cellEditor: "agSelectCellEditor",
    //  headerComponent: RequiredHeader,
     // headerClass: "required-header", 
  //    headerComponent: RequiredHeader,
  // headerComponentParams: { displayName: "Type Code" },
  
      cellEditorParams: {
        values: typeIdData.map((item) => item.typeId),
      },
      valueGetter: (params) => {
        return params.data.typeId;
      },
      valueSetter: (params) => {
        params.data.typeId = params.newValue;
        return true;
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        const option = typeIdData.find((item) => item.typeId === params.value.toString());
        return option ? `${option.typeCode}-${option.typeDescription}` : params.value;
      },
      filterValueGetter: (params) => {
        const option = typeIdData.find((item) => item.typeId === params.data.typeId?.toString());
        return option ? `${option.typeCode}-${option.typeDescription}` : "";
      },
    },
  ];

  const handleAddRow = () => {
    const emptyRow = {
      isUpdate: 0,
    };

    const ChildPartToTypeMasterempty = masterList.filter((item) => !item.childPacMapId);
    console.log(ChildPartToTypeMasterempty);
    if (ChildPartToTypeMasterempty && ChildPartToTypeMasterempty?.length === 0) {
      const updated = [...masterList, emptyRow];
      setMasterList(updated);
      setOriginalList(updated);

      // Scroll to last page and focus new row
      setTimeout(() => {
        const api = gridRef.current?.api;
        if (!api) return;

        const lastRowIndex = updated.length - 1;
        api.paginationGoToLastPage();

        setTimeout(() => {
          api.ensureIndexVisible(lastRowIndex, "bottom");
          api.flashCells({
            rowNodes: [api.getDisplayedRowAtIndex(lastRowIndex)],
          });

          const firstColId = "childPartId";
          api.setFocusedCell(lastRowIndex, firstColId);
          api.startEditingCell({
            rowIndex: lastRowIndex,
            colKey: firstColId,
          });
        }, 150);
      }, 100);
    } else {
      toast.error("Please enter the ChildMapId for all the rows.");
    }
  };

  const normalizeList = (list) => {
    return list.map((item) => ({
      ...item,
      isActive: item.isActive === "1" || item.isActive === 1 || item.isActive === true ? "1" : "0",
    }));
  };

  const hasChanges = () => {
    const normMaster = normalizeList(masterList);
    const normOriginal = normalizeList(originalList);
    return JSON.stringify(normMaster) !== JSON.stringify(normOriginal);
  };

  const createorUpdate = async () => {
    try {
      setLoading(true);
      gridRef.current.api.stopEditing();

      if (!hasChanges()) {
        toast.error("Change any one field before saving.");
        setLoading(false);
        return;
      }

      // Duplicate ChildPartId check
      const childPartIds = masterList.map((item) => item.childPartId);
      const duplicateChildPartIds = childPartIds.filter(
        (id, index) => id && childPartIds.indexOf(id) !== index
      );

      if (duplicateChildPartIds.length > 0) {
        const duplicateId = duplicateChildPartIds[0];
        const dupObj = childPartData.find((item) => item.childPartId === duplicateId);
        const desc = dupObj ? `${dupObj.childPartCode}-${dupObj.childPartDesc}` : duplicateId;
        toast.error(`Already Mapped This ChildPart: ${desc}`);
        setLoading(false);
        return;
      }

      // Validate required fields
      const invalidChildPart = masterList.filter((item) => !item.childPartId);
      if (invalidChildPart.length > 0) {
        toast.error("Please fill Child Part Code for all rows.");
        setLoading(false);
        return;
      }

      const invalidTypeCode = masterList.filter((item) => !item.typeId);
      if (invalidTypeCode.length > 0) {
        toast.error("Please fill Type Code for all rows.");
        setLoading(false);
        return;
      }

      console.log("masterList", masterList);
      const updatedList = masterList.map((item) => ({
        isUpdate: item.isUpdate,
        childPacMapId: item.childPacMapId,
        childPartId: item.childPartId,
        typeId: item.typeId,
        tenantId: tenantId,
        updatedBy: employeeId,
        branchCode: branchCode,
      }));

      const response = await serverApi.post("insertupdatechildparttypemapping", updatedList);

      if (response.data && response.data === "SUCCESS") {
        toast.success("Add/Update successfully!");
        await loadOptionsAndData();
      } else if (response.data && response.data === "DUBLICATE") {
        toast.error("Do Not Allow Duplicate ChildMapId!");
      } else {
        toast.error("SaveOrUpdate failed.");
      }
    } catch (error) {
      console.error("Error saving Child Part To Type Master data:", error);
      toast.error("Error while saving data!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedModule("");
    setSelectedScreen("");
    setMasterList([]);
    setOriginalList([]);
    loadOptionsAndData();
  };

  const onExportExcelChildPartToTypeMaster = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("ChildPartToTypeMaster");

      worksheet.getRow(1).height = 60;

      worksheet.columns = [
        { header: "Child Map ID", key: "childPacMapId", width: 20 },
        { header: "Child Part Code", key: "childPartCode", width: 50 },
        { header: "Type Code", key: "typeCode", width: 35 },
      ];

      try {
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
      } catch (err) {
        console.warn("Logo image not found, skipping logo insert.");
      }

      worksheet.mergeCells("B1:D2");
      const titleCell = worksheet.getCell("B1");
      titleCell.value = "Child Part To Type Master Report";
      titleCell.font = { bold: true, size: 16, color: { argb: "FF00264D" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("E1:F2");
      const dateCell = worksheet.getCell("E1");
      dateCell.value = `Generated On: ${moment().format("DD/MM/YYYY HH:mm:ss")}`;
      dateCell.font = { bold: true, size: 11, color: { argb: "FF00264D" } };
      dateCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };

      const headerRow = worksheet.addRow([
        "Child Map ID",
        "Child Part Code",
        "Type Code",
      ]);

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      headerRow.height = 25;

      masterList.forEach((row) => {
        const childPart = childPartData.find((item) => item.childPartId === row.childPartId);
        const typeInfo = typeIdData.find((item) => item.typeId === row.typeId?.toString());

        const newRow = worksheet.addRow({
          childPacMapId: row.childPacMapId || "",
          childPartCode: childPart 
            ? `${childPart.childPartCode}-${childPart.childPartDesc}` 
            : row.childPartDesc || "",
          typeCode: typeInfo 
            ? `${typeInfo.typeCode}-${typeInfo.typeDescription}` 
            : row.typeCode || "",
        });

        newRow.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { size: 10 };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      const lastRow = worksheet.lastRow.number;
      worksheet.autoFilter = {
        from: { row: headerRow.number, column: 1 },
        to: { row: lastRow, column: worksheet.columns.length },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `ChildPartToTypeMaster_${moment().format("YYYYMMDD_HHmmss")}.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Error exporting to Excel. Please try again.");
    }
  };

  return (
    <div>
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

        <div className="card-body p-3" style={{ position: "relative" }}>
          {optionsLoaded && (
            <AgGridReact
              ref={gridRef}
              rowData={masterList}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              pagination
              domLayout="autoHeight"
              singleClickEdit={true}
              onFirstDataRendered={autoSizeAllColumns}
              onCellEditingStopped={(params) => {
                const updatedList = [...masterList];
                updatedList[params.rowIndex] = { ...params.data };
                setMasterList(updatedList);
              }}
            />
          )}

          {loading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,255,255,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <Loader />
            </div>
          )}

          <div className="text-center mt-4">
            <button
              onClick={onExportExcelChildPartToTypeMaster}
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
        </div>
      </div>
    </div>
  );
};

export default ChildPartToTypeMasterMapping;