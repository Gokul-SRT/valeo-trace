
import serverApi from "../../../../../serverAPI";

const GatewayDropdown = async (tenantId, branchCode) => {
  try {
    const payload = {
      
      tenantId: tenantId,
      branchCode: branchCode,
    };

    const response = await serverApi.post("getGateWayMasterDtl", payload, {
      headers: { 
        "Content-Type": "application/json" 
      },
    });

    const data = response.data;
    console.log("Gateway Dropdown Data:", data);
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

export default GatewayDropdown;