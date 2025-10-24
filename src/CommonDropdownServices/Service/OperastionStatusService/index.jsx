import React, { useEffect, useState } from "react";
import serverApi from "../../serverAPI";

const OperationStatusDropdown = ({ id, onChange }) => {
  const [operationStatusList, setOperationStatusList] = useState([]);

  useEffect(() => {
    const fetchOperationStatus = async () => {
      try {
        const payload = {
          tenantId: "bldc",
          isActive: "1",
          branchCode: "1",
        };

        const response = await serverApi.post("getOperationStatus", payload, {
          headers: { "Content-Type": "application/json" },
        });

        const data = response.data;
        if (data && data.length > 0) {
          setOperationStatusList(data);
        } else {
          console.error("No Operation Status data found.");
          setOperationStatusList([]);
        }
      } catch (error) {
        console.error("Error fetching Operation Status info:", error);
        setOperationStatusList([]);
      }
    };

    fetchOperationStatus();
  }, []);

  return (
    <select id={id} onChange={onChange}>
      <option value="<--Select-->">&lt;--Select--&gt;</option>
      {operationStatusList.map((item) => (
        <option key={item.operationStatusCode} value={item.operationStatusDescription}>
          {item.operationStatusDescription}
        </option>
      ))}
    </select>
  );
};

export default OperationStatusDropdown;
