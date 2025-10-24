// src/Service/ReasonCodeCat.js
import serverApi from "../../serverAPI";

const ReasonCodeCatdropdown = async (tenantId,branchCode) => {
  try {
    const payload = {
      tenantId: tenantId,
      isActive: "1",
      branchCode: branchCode,
    };

    const response = await serverApi.post("getReasonCodeCatdtl", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const empInfo = response.data;

    if (empInfo && empInfo.length > 0) {
      return empInfo;
    } else {
      console.error("ReasonCodeCat information not found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching ReasonCodeCat info:", error);
    return [];
  }
};

export default ReasonCodeCatdropdown;