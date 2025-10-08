import React, { useState, useEffect } from 'react';
import { Card, Select, Input, Button, Table, Switch, Row, Col, Spin } from 'antd';

const { Option } = Select;

const Traceabilityreports = () => {
  // State management
  const [toggleValue, setToggleValue] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lineCode: null,
    productCode: null,
    serialNumber: null,
    fromDate: '',
    toDate: ''
  });
  
  // Data states
  const [lineOptions, setLineOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [serialNumbers, setSerialNumbers] = useState([]);
  
  // Display states
  const [showTraceReportHeader, setShowTraceReportHeader] = useState(false);
  const [showQualityTable, setShowQualityTable] = useState(false);
  const [showEmployeeTable, setShowEmployeeTable] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      fromDate: today,
      toDate: today
    }));
    loadLineDropdown();
    loadProductDropdown();
  };

  // Toggle switch handler
  const handleToggleChange = (checked) => {
    setToggleValue(checked);
    closeRetrieveCards();
  };

  const closeRetrieveCards = () => {
    setShowQualityTable(false);
    setShowEmployeeTable(false);
    setShowTraceReportHeader(false);
    setReportData(null);
    setSerialNumbers([]);
  };

  // Mock API calls (replace with actual API calls)
  const loadLineDropdown = async () => {
    // Simulate API call
    const mockLines = [
      { lineCode: 'LINE001', lineDesc: 'Disc Assy' },
      { lineCode: 'LINE002', lineDesc: 'Cover Assy' },
    ];
    setLineOptions(mockLines);
  };

  const loadProductDropdown = async () => {
    // Simulate API call
    const mockProducts = [
      { productCode: 'PROD001', productDescription: 'MSIL Z12E 200 OE' },
      { productCode: 'PROD002', productDescription: 'MSIL YTA 200 OE' },
      
    ];
    setProductOptions(mockProducts);
  };

  const fetchReportData = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      const mockResponse = {
        productdateTime: "2024-01-15 10:30:00 AM",
        trace_childpartReport: [
          {
            child_PRODUCT_CODE: "CHILD001",
            product_DESCRIPTION: "Child Part A",
            offtake: "5",
            lot_NUMBER: "LOT123"
          }
        ],
        qualityParams: [
          {
            equipment_DESCRIPTION: "Machine 1",
            pa_DESC: "Temperature",
            value: "25.5"
          },
          {
            equipment_DESCRIPTION: "Machine 2", 
            pa_DESC: "Pressure",
            value: "1.2"
          }
        ],
        trace_rep_op_info: [
          {
            operation_UNIQUECODE: "OP001",
            operation_DESCRIPTION: "Assembly",
            employee_name: "John Doe"
          }
        ]
      };

      setReportData(mockResponse);
      
      if (toggleValue) {
        // Serial number mode
        setShowTraceReportHeader(true);
        setShowQualityTable(true);
        setShowEmployeeTable(true);
      } else {
        // Date range mode
        setShowQualityTable(true);
        loadSerialNumbers();
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSerialNumbers = async () => {
    // Simulate API call for serial numbers
    const mockSerialNumbers = [
      { serial_no: "SN001", shift_date: "2024-01-15", shift: "Day" },
      { serial_no: "SN002", shift_date: "2024-01-15", shift: "Night" },
      { serial_no: "SN003", shift_date: "2024-01-16", shift: "Day" }
    ];
    setSerialNumbers(mockSerialNumbers);
  };

  const validateForm = () => {
    const { lineCode, productCode, serialNumber, fromDate, toDate } = formData;
    
    if (!lineCode || lineCode === "<--Select-->") {
      alert("Please select a line");
      return false;
    }
    
    if (!productCode || productCode === "<--Select-->") {
      alert("Please select a product");
      return false;
    }
    
    if (toggleValue && !serialNumber) {
      alert("Please enter a serial number");
      return false;
    }
    
    if (!toggleValue && (!fromDate || !toDate)) {
      alert("Please select date range");
      return false;
    }
    
    return true;
  };

  const handleSerialNumberClick = (serialNo) => {
    setFormData(prev => ({ ...prev, serialNumber: serialNo }));
    setToggleValue(true);
    fetchReportData();
  };

  const exportToPDF = () => {
    // Simulate PDF export
    alert("PDF export functionality would be implemented here");
  };

  // Table columns for child parts
  const childPartsColumns = [
    { title: 'S.No', key: 'sno', render: (_, __, index) => index + 1 },
    { title: 'Child Part Code', dataIndex: 'child_PRODUCT_CODE', key: 'childCode' },
    { title: 'Child Part Description', dataIndex: 'product_DESCRIPTION', key: 'childDesc' },
    { title: 'Count', dataIndex: 'offtake', key: 'count', render: (text) => parseInt(text) },
    { title: 'Lot Number', dataIndex: 'lot_NUMBER', key: 'lotNumber' }
  ];

  // Table columns for quality parameters
  const qualityParamsColumns = [
    { title: 'S.No', key: 'sno', render: (_, __, index) => index + 1 },
    { title: 'Equipment', dataIndex: 'equipment_DESCRIPTION', key: 'equipment' },
    { title: 'Parameter', dataIndex: 'pa_DESC', key: 'parameter' },
    { title: 'Value', dataIndex: 'value', key: 'value' }
  ];

  // Table columns for employee traceability
  const employeeColumns = [
    { title: 'Sequence', dataIndex: 'operation_UNIQUECODE', key: 'sequence' },
    { title: 'Operation Description', dataIndex: 'operation_DESCRIPTION', key: 'operation' },
    { title: 'Employee', dataIndex: 'employee_name', key: 'employee' }
  ];

  // Table columns for serial numbers
  const serialNumberColumns = [
    { 
      title: 'Serial Number', 
      dataIndex: 'serial_no', 
      key: 'serialNo',
      render: (text) => (
        <Button 
          type="link" 
          onClick={() => handleSerialNumberClick(text)}
          style={{ padding: 0, fontWeight: 'bold' }}
        >
          {text}
        </Button>
      )
    },
    { title: 'Shift Date', dataIndex: 'shift_date', key: 'shiftDate' },
    { title: 'Shift', dataIndex: 'shift', key: 'shift' }
  ];

  return (
    <div style={{ padding: '20px' }}>
        
      {/* Main Form Card */}
      <Card title="Traceability Report" style={{ marginBottom: '20px' }} headStyle={{ backgroundColor: '#001F3E', color: 'white' }}>
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={24}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ marginRight: '8px' }}>Log Date</strong>
              <Switch
                checked={toggleValue}
                onChange={handleToggleChange}
                style={{ margin: '0 8px' }}
              />
              <strong style={{ marginLeft: '8px' }}>Serial Number</strong>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
             <Col span={6}>
            <div style={{ marginBottom: '16px' }}>
              <strong>Product <span style={{ color: 'red' }}>*</span></strong>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="<--Select-->"
                value={formData.productCode}
                onChange={(value) => setFormData(prev => ({ ...prev, productCode: value }))}
              >
                <Option value="<--Select-->"> --Select-- </Option>
                {productOptions.map(product => (
                  <Option key={product.productCode} value={product.productCode}>
                    {product.productDescription}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          
          <Col span={6}>
            <div style={{ marginBottom: '16px' }}>
              <strong>Line <span style={{ color: 'red' }}>*</span></strong>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="<--Select-->"
                value={formData.lineCode}
                onChange={(value) => setFormData(prev => ({ ...prev, lineCode: value }))}
              >
                <Option value="<--Select-->">Select</Option>
                {lineOptions.map(line => (
                  <Option key={line.lineCode} value={line.lineCode}>
                    {line.lineDesc}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          {toggleValue && (
            <Col span={6}>
              <div style={{ marginBottom: '16px' }}>
                <strong>Serial Number <span style={{ color: 'red' }}>*</span></strong>
                <Input
                  style={{ marginTop: '4px' }}
                  placeholder="Enter Serial Number"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                />
              </div>
            </Col>
          )}

          {!toggleValue && (
            <>
              <Col span={6}>
                <div style={{ marginBottom: '16px' }}>
                  <strong>From Date <span style={{ color: 'red' }}>*</span></strong>
                  <Input
                    type="date"
                    style={{ marginTop: '4px' }}
                    value={formData.fromDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                  />
                </div>
              </Col>
              <Col span={6}>
                <div style={{ marginBottom: '16px' }}>
                  <strong>To Date <span style={{ color: 'red' }}>*</span></strong>
                  <Input
                    type="date"
                    style={{ marginTop: '4px' }}
                    value={formData.toDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, toDate: e.target.value }))}
                  />
                </div>
              </Col>
            </>
          )}
        </Row>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button
            type="primary"
            onClick={fetchReportData}
            loading={loading}
            style={{ marginRight: '8px' }}
          >
            Submit
          </Button>
          <Button
            onClick={closeRetrieveCards}
            style={{ marginRight: '8px' }}
          >
            Cancel
          </Button>
          {toggleValue && (
            <Button onClick={exportToPDF}>
              Download
            </Button>
          )}
        </div>
      </Card>

      {/* Report Header Card */}
       {toggleValue && (
        <Button
          onClick={exportToPDF}
          style={{ display: showTraceReportHeader ? 'inline-block' : 'none', margin:5 }}
        >
          Export to PDF
        </Button>
      )}
      {showTraceReportHeader && reportData && (
        <Card 
          title={`FG Traceability Report - ${formData.serialNumber}`}
          style={{ marginBottom: '20px' }}
          headStyle={{ backgroundColor: '#001F3E', color: 'white' }}
        >
          <Spin spinning={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#e6e6e6' }}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        Product Code
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        {formData.productCode}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f3f3f3' }}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        Line Name
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        {lineOptions.find(l => l.lineCode === formData.lineCode)?.lineDesc || ''}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#e6e6e6' }}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        FG Serial Number
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        {formData.serialNumber}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Col>
              <Col span={12}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#e6e6e6' }}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        Product Description
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        {productOptions.find(p => p.productCode === formData.productCode)?.productDescription || ''}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#f3f3f3' }}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        Produced Date
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        {reportData.productdateTime?.split(' ')[0] || ''}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: '#e6e6e6' }}>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        Produced Time
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>
                        {reportData.productdateTime?.split(' ').slice(1).join(' ') || ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Col>
            </Row>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontWeight: 'bold' }}>Child Part Lot Traceability</h4>
              <Table
                dataSource={reportData.trace_childpartReport}
                columns={childPartsColumns}
                rowKey={(record, index) => index}
                pagination={false}
                size="small"
              />
            </div>
          </Spin>
        </Card>
      )}

      {/* Quality Parameters Card */}
      {showQualityTable && (
        <Card 
          title={toggleValue ? `Quality Parameters - ${formData.serialNumber}` : "Serial Numbers"}
          style={{ marginBottom: '20px' }}
          headStyle={{ backgroundColor: '#001F3E', color: 'white' }}
        >
          <Spin spinning={loading}>
            {toggleValue && reportData?.qualityParams ? (
              <Table
                dataSource={reportData.qualityParams}
                columns={qualityParamsColumns}
                rowKey={(record, index) => index}
                pagination={false}
                size="small"
              />
            ) : (
              <Table
                dataSource={serialNumbers}
                columns={serialNumberColumns}
                rowKey="serial_no"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            )}
          </Spin>
        </Card>
      )}

      {/* Employee Traceability Card */}
      {showEmployeeTable && reportData && (
        <Card 
          title={`Employee Traceability - ${formData.serialNumber}`}
          style={{ marginBottom: '20px' }}
          headStyle={{ backgroundColor: '#001F3E', color: 'white' }}
        >
          <Spin spinning={loading}>
            <Table
              dataSource={reportData.trace_rep_op_info}
              columns={employeeColumns}
              rowKey={(record, index) => index}
              pagination={false}
              size="small"
            />
          </Spin>
        </Card>
      )}

    </div>
  );
};

export default Traceabilityreports;