import serverApi from "../serverAPI";


export const gettypeMasterdtl = (tenantId,branchCode)=>{
    return serverApi.post("gettypeMasterdtl",{
        tenantId,
        branchCode,
    })
    .then((response)=>{
        if(response.data !== null && response.data !== undefined){
            return response.data
        }
    })
    .catch((error)=>{
        return error;
    })
} 