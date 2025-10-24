import serverApi from "../../serverAPI";
import store from "store";

export const fetchProductMstList = async () => {
  const tenantId = JSON.parse(localStorage.getItem("tenantId"));
  const branchCode = JSON.parse(localStorage.getItem("branchCode"));

  try {
    const payload = { tenantId, branchCode };

    const response = await serverApi.post("getProductMst", payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;

    if (Array.isArray(data) && data.length > 0) {
      return data; // each record may have productCode, productDesc, etc.
    } else {
      console.warn("No Product Master records found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching Product Master data:", error);
    return [];
  }
};
