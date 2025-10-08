import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Table, 
  Form, 
  Row, 
  Col, 
  Typography,
  Space,
  message
} from 'antd';
import { 
  DownloadOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const ReverseTraceabilityReport = () => {
  const [form] = Form.useForm();
  const [childPartDescription, setChildPartDescription] = useState('');
  const [serialData, setSerialData] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // ✅ Static dataset with code -> description mapping
  const childParts = [
    { code: "C0021", description: "Cover Plate - MSIL Z12E 200 OE" },
    { code: "CF72760", description: "Cushion Disc - MSIL Z12E 200 UX OE" },
    { code: "612050700H", description: "Steel Coil-MSIL Z12E Cushion Disc205X0.7" },
  ];

  // ✅ Static serial data (dummy records)
  const staticSerialData = [
    { key: '1', serialnum: 'SN001234567', shiftDate: '2024-01-15T10:30:00', shift: 'Morning' },
    { key: '2', serialnum: 'SN001234568', shiftDate: '2024-01-15T18:30:00', shift: 'Evening' },
    { key: '3', serialnum: 'SN001234569', shiftDate: '2024-01-16T02:30:00', shift: 'Night' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        
        return date.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        return 'N/A';
    }
};
  

  // ✅ Auto populate description based on part code
  const handleChildPartChange = (e) => {
    const code = e.target.value.trim();
    if (code) {
      const foundPart = childParts.find((p) => p.code.toLowerCase() === code.toLowerCase());
      if (foundPart) {
        setChildPartDescription(foundPart.description);
      } 
      // else {
      //   setChildPartDescription("Not Found");
      // }
    } else {
      setChildPartDescription('');
    }
  };

  const onFinish = (values) => {
    const { childPartCode } = values;
    if (!childPartCode) {
      message.error('Enter Child Part Code!');
      return;
    }

    // In real case, filter serials based on code from API/dataset
    setSerialData(staticSerialData);
    setShowResults(true);
    message.success(`Found ${staticSerialData.length} records`);
  };

  const onReset = () => {
    form.resetFields();
    setChildPartDescription('');
    setSerialData([]);
    setShowResults(false);
  };

  const exportToPDF = () => {
    message.info('Export to PDF functionality to be implemented');
  };

  // Table columns
  const columns = [
    {
      title: 'Log ID',
      dataIndex: 'key',
      key: 'logId',
      render: (text, record, index) => index + 1,
      align: 'center'
    },
    {
      title: 'Serial Number',
      dataIndex: 'serialnum',
      key: 'serialnum',
      render: (text) => text || 'N/A',
      align: 'center'
    },
    {
      title: 'Shift Date',
      dataIndex: 'shiftDate',
      key: 'shiftDate',
      render: (text) => formatDate(text),
      align: 'center'
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      render: (text) => text || 'N/A',
      align: 'center'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1800px', margin: '0 auto' }}>
      {/* Search Form Card */}
      <Card 
        title="Reverse Traceability Report"
        headStyle={{ backgroundColor: '#001f3e', color:'#fff'}}
        style={{ marginBottom: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={10} sm={5}>
              <Form.Item
                label="Child Part Code"
                name="childPartCode"
                rules={[{ required: true, message: 'Please enter Child Part Code!' }]}
              >
                <Input 
                  placeholder="Enter child part code" 
                  onChange={handleChildPartChange} 
                />
              </Form.Item>
            </Col>

            <Col xs={10} sm={8}>
              <Form.Item label="Child Part Description">
                <Input
                  value={childPartDescription}
                  placeholder="Description will auto-populate"
                  readOnly
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="center">
            <Col>
              <Space size="middle">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{ backgroundColor: '#001F3E' }}
                >
                  Submit
                </Button>
                <Button
                  htmlType="button"
                  onClick={onReset}
                  size="large"
                  style={{ backgroundColor: '#001F3E' ,color: '#fff'}}
                >
                  Cancel
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Results Card */}
      {showResults && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#fff' }}>
                Child Part Traceability - Serial Number Details
              </Title>
              {serialData.length > 0 && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportToPDF}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  Export PDF
                </Button>
              )}
            </div>
          }
          headStyle={{ backgroundColor: '#001f3e' }}
        >
          <Table
            columns={columns}
            dataSource={serialData}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            locale={{
              emptyText: serialData.length === 0 ? 
                'No records found for the specified criteria.' : undefined
            }}
            scroll={{ x: 800 }}
            size="middle"
            bordered
          />
        </Card>
      )}
    </div>
  );
};

export default ReverseTraceabilityReport;
