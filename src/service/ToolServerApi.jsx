import serverApi from "../serverAPI";
import commonApi from "../CommonserverApi"
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

const backendService = async function({ requestPath, requestData }) {
  return serverApi
    .post(requestPath, requestData, { headers })
    .then(response => {
      if (response) {
        return response.data
      }
      return false
    })
    .catch(err => console.error(err))
}

const commonBackendService = async function({ requestPath, requestData }) {
  return commonApi
    .post(requestPath, requestData, { headers })
    .then(response => {
      if (response) {
        return response.data
      }
      return false
    })
    .catch(err => console.error(err))
}

export { backendService, commonBackendService }
