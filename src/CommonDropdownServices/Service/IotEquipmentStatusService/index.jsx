import React, { useEffect, useState } from "react";
import serverApi from "../../serverAPI";

const IotEquipStatusDropdown = ({ id, onChange }) => {
  const [iotEquipStatusList, setIotEquipStatusList] = useState([]);

  useEffect(() => {
    const fetchIotEquipStatus = async () => {
      try {
        const payload = {
          tenantId: "bldc",
          isActive: "1",
          branchCode: "1",
        };

        const response = await serverApi.post("getIotEquipStsdtl", payload, {
          headers: { "Content-Type": "application/json" },
        });

        const data = response.data;
        if (data && data.length > 0) {
          setIotEquipStatusList(data);
        } else {
          console.error("No IoT Equipment Status data found.");
          setIotEquipStatusList([]);
        }
      } catch (error) {
        console.error("Error fetching IoT Equipment Status info:", error);
        setIotEquipStatusList([]);
      }
    };

    fetchIotEquipStatus();
  }, []);

  return (
    <select id={id} onChange={onChange}>
      <option value="<--Select-->">&lt;--Select--&gt;</option>
      {iotEquipStatusList.map((item) => (
        <option key={item.iesId} value={item.equipmentStsCode}>
          {item.equipmentStsCode}
        </option>
      ))}
    </select>
  );
};

export default IotEquipStatusDropdown;
