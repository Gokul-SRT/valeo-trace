import React, { useEffect, useRef } from "react";
import bwipjs from "bwip-js";

const PDF417Barcode = ({ value, width = 3, height = 10 }) => {
  const canvasRef = useRef();

  useEffect(() => {
    if (canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "pdf417",      // Barcode type
          text: value,         // Value to encode
          scale: 4,            // 2x scaling factor
          width,
          height,
          includetext: false,  // Hide human-readable text
          eclevel: 7           // Error correction level 4
        });
      } catch (e) {
        // Handle rendering errors if any
      }
    }
  }, [value, width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height}></canvas>
  );
};

export default PDF417Barcode;
