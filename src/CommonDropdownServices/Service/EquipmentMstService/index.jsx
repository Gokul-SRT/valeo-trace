// src/Service/EquipmentMstService.js
import serverApi from "../../../CommonserverApi";

const EquipMstdropdown = async () => {
  try {
    // 🔹 Dynamically get tenantId from localStorage
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      branchCode,
      isActive: "1",
    };

    const response = await serverApi.post("getequipMstdtl", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const equipInfo = response.data?.responseData;
    console.log("Equipment Master Info:", equipInfo);

    if (equipInfo && equipInfo.length > 0) {
      return equipInfo;
    } else {
      console.warn("No equipment master data found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching equipment master info:", error);
    return [];
  }
};

export default EquipMstdropdown;
