import React from 'react'
import { FadeLoader } from 'react-spinners'

const Loader = () => {
  return (
   <div
         style={{
           position: "relative",
           top: 0,
           left: 0,
           width: "100%",
           height: "100%",
           display: "flex",
           justifyContent: "center",
           alignItems: "center",
           zIndex: 2,
         }}
       >
         <FadeLoader color="#004b8d" />
       </div>
  )
}

export default Loader