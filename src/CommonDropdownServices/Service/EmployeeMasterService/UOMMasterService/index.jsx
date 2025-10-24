import React, { useEffect, useState } from "react";
import serverApi from "../../serverAPI";

const UomMstDropdown = ({ id, onChange }) => {
  const [uomList, setUomList] = useState([]);

  useEffect(() => {
    const fetchUom = async () => {
      try {
        const payload = {
          tenantId: "bldc",
          isActive: "1",
          branchCode: "1",
        };

        const response = await serverApi.post("getUomMst", payload, {
          headers: { "Content-Type": "application/json" },
        });

        const data = response.data;
        if (data && data.length > 0) {
          setUomList(data);
        } else {
          console.error("No UOM data found.");
          setUomList([]);
        }
      } catch (error) {
        console.error("Error fetching UOM info:", error);
        setUomList([]);
      }
    };

    fetchUom();
  }, []);

  return (
    <select id={id} onChange={onChange}>
      <option value="<--Select-->">&lt;--Select--&gt;</option>
      {uomList.map((item) => (
        <option key={item.uomCode} value={item.uomLongDescription}>
          {item.uomLongDescription}
        </option>
      ))}
    </select>
  );
};

export default UomMstDropdown;
