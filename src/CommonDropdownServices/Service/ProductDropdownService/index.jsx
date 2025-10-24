import serverApi from "../../CommonserverApi";

const ProductDropdown = async () => {
  try {
    const tenantId = JSON.parse(localStorage.getItem("tenantId"));
    const branchCode = JSON.parse(localStorage.getItem("branchCode"));

    const payload = {
      tenantId,
      branchCode,
      isActive: "1",
    };

    const response = await serverApi.post("getProductDropdown", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const productInfo = response.data?.responseData || [];
    if (productInfo.length > 0) {
      return productInfo;
    } else {
      console.warn("No product data found.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching Product Dropdown info:", error);
    return [];
  }
};

export default ProductDropdown;
