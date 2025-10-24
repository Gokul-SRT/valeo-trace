// src/Service/UserRole.js
import serverApi from "../../serverAPI";

const UiModuleDropdown = async (tenantId, branchCode) => {
  try {
    const payload = {
      tenantId: tenantId,
      isActive: "1",
      branchCode: branchCode,
    };

    const response = await serverApi.post("getUiModuleMstdtl", payload, {
      headers: { 
        "Content-Type": "application/json" 
      },
    });

    const data = response.data;

    if (data && data.length > 0) {
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching User Role info:", error);
    return [];
  }
};

export default UiModuleDropdown;