import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Card, Form, Input, Button, message } from 'antd'
import { User, Mail, Phone, CheckCircle } from 'lucide-react'
import { updateProfile } from '../../redux/candidatesSlice'

function ProfileCollector({ candidate = {}, onNext = () => {} }) {
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [isComplete, setIsComplete] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    // Set initial form values only when candidate changes
    form.setFieldsValue({
      name: candidate.name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
    })

    const complete = Boolean(candidate.name && candidate.email && candidate.phone)
    setIsComplete(complete)
  }, [candidate, form])

  const handleSubmit = (values) => {
    dispatch(
      updateProfile({
        id: candidate.id,
        profile: values,
      })
    )

    messageApi.success('Profile updated successfully!')
    // small delay for UX then proceed
    setTimeout(() => {
      try {
        onNext()
      } catch (e) {}
    }, 700)
  }

  const missingFields = []
  if (!candidate.name) missingFields.push('name')
  if (!candidate.email) missingFields.push('email')
  if (!candidate.phone) missingFields.push('phone')

  return (
    <Card>
      {contextHolder}
      <div className="max-w-lg mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">
            {missingFields.length > 0
              ? `Please provide your ${missingFields.join(', ')} to continue.`
              : 'Your profile is complete!'}
          </p>
        </div>

        {isComplete ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Profile Complete!</h3>
            <p className="text-gray-600 mb-6">Ready to start your interview.</p>
            <Button type="primary" onClick={onNext} size="large">
              Proceed to Interview
            </Button>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-4">
            <Form.Item
              label="Full Name"
              name="name"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input prefix={<User className="text-gray-400" size={16} />} placeholder="Enter your full name" size="large" />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input prefix={<Mail className="text-gray-400" size={16} />} placeholder="Enter your email address" size="large" />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input prefix={<Phone className="text-gray-400" size={16} />} placeholder="Enter your phone number" size="large" />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" block>
              Update Profile
            </Button>
          </Form>
        )}
      </div>
    </Card>
  )
}

export default ProfileCollector
