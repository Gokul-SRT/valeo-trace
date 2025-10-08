import React, { useState } from 'react'
import store from 'store'
import { Input, Button, Form, message } from 'antd'
import { InputOTP } from 'antd-input-otp'
import messageReturn from '_helpers/messageReturn'
import ChangePassword from '../ChangePassword'
// import { indentFileUpload } from '../../../../../services/common/AppeovedDocumentService/adddocumentservice'
 
// import { Link } from 'react-router-dom'
 
const ForgotPassword = ({
  backtoSignin = () => {},
  backtoLogin = () => {},
  updateNewName = () => {},
}) => {
  const [isOtp, setIsOtp] = useState(false)
  const [disable, setDisable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisibleUpd, setVisibleUpdScreen] = useState(false)
  const [username, setUsername] = useState(null)
 
  const [form] = Form.useForm()
  const tenantId = store.get('tenantId')
 
  const Displayhide = () => {
    backtoSignin()
    form.resetFields()
    setVisibleUpdScreen(false)
  }
 
  const onFinish = values => {
    if (isOtp && disable) {
      form
        .validateFields(['OTP'])
        .then(() => {
          setIsLoading(true)
          const otpValue = values.OTP
          setUsername(values.username)
          if (otpValue !== '' && otpValue.length === 6) {
            let otp = ''
            for (let i = 0; i <= otpValue.length - 1; i += 1) {
              otp += parseInt(otpValue[i], 10)
            }
            VerifyOTP(values, otp)
          } else {
            messageReturn(602)
          }
          setIsLoading(false)
        })
        .catch(errorInfo => {
          console.log(errorInfo)
        })
    } else {
      GetOtp()
    }
  }
 
  const VerifyOTP = async (e, otpval) => {
    const obj = {
      tenantId,
      userName: e.username,
      otp: otpval,
    }
    const response = await indentFileUpload({
      requestPath: 'verifyOtp',
      requestData: obj,
    })
    if (response) {
      if (response.responseCode === '200') {
        updateNewName(true)
        setVisibleUpdScreen(true)
      } else {
        message.error(response.responseDataMessage)
      }
    }
  }
 
  const ValidateOTP = (rule, value, callback) => {
    if ((value && value.length !== 6) || value[value.length - 1] === '') {
      callback('OTP must be 6 digits')
    } else {
      callback()
    }
  }
 
  const GetOtp = async () => {
    const uname = form.getFieldsValue()
    form.resetFields(['OTP'])
    const obj = {
      tenantId:'bgrn',
      userName: uname.username,
    }
    const response = await indentFileUpload({
      requestPath: 'generateOtp',
      requestData: obj,
    })
    if (response) {
      if (response?.responseCode === '200') {
        setIsOtp(true)
        setDisable(true)
        messageReturn(301)
      } else {
        message.error(response.responseDataMessage)
      }
    }
  }
 
  const onFinishFailed = errorInfo => {
    console.log(errorInfo)
  }
 
  return isVisibleUpd ? (
    <ChangePassword
      disable={disable}
      username={username}
      backtoLogin={backtoLogin}
      Displayhide={Displayhide}
      updateNewName={updateNewName}
    />
  ) : (
    <div>
      <Form
        layout="vertical"
        hideRequiredMark
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        className="mb-4"
        form={form}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'The Username field is required.' }]}
        >
          <Input size="large" placeholder="Username" disabled={disable} />
        </Form.Item>
        {isOtp && (
          <p style={{ textAlign: 'left', fontWeight: 'bold' }}>OTP has sent to your mail.</p>
        )}
        {isOtp && (
          <Form.Item
            name="OTP"
            rules={[
              // { required: true, message: 'Please enter your OTP' },
              { validator: ValidateOTP },
            ]}
          >
            <InputOTP
              autoFocus
              inputType="numeric"
              length={6}
              style={{ height: '45px', borderRadius: '10px' }}
            />
          </Form.Item>
        )}
 
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          className="text-center w-100"
          loading={isLoading}
        >
          <strong>{isOtp ? 'Verify OTP' : 'Generate OTP'}</strong>
        </Button>
      </Form>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onClick={backtoSignin}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              backtoSignin()
            }
          }}
        >
          <i className="fe fe-arrow-left mr-1 align-middle" />
          Go back Sign in
        </span>
        {isOtp && (
          <span
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={GetOtp}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                GetOtp()
              }
            }}
          >
            Resend OTP
          </span>
        )}
      </div>
    </div>
  )
}
 
export default ForgotPassword
 
 