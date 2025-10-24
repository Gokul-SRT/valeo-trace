// src/Service/EquipCategory.js
import serverApi from "../../serverAPI";


const EquipCategoryDropdown = async (tenantId,branchCode) => {
  try {
    const payload = {
      tenantId: tenantId,
      isActive: "1",
      branchCode: branchCode, // Uncomment if needed
    };

    const response = await serverApi.post("getEquipCatMstdtl", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const equipInfo = response.data;

    if (equipInfo && equipInfo.length > 0) {
      return equipInfo;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching equipment category info:", error);
    return [];
  }
};

export default EquipCategoryDropdown;
