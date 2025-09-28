import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Card, Upload, Button, message, Spin } from 'antd'
import { Upload as UploadIcon, FileText, CheckCircle } from 'lucide-react'
import { updateProfile } from '../../redux/candidatesSlice'
import { parseResume } from '../../utils/resumeParser'

const { Dragger } = Upload

function ResumeUploader({ candidate = {}, onNext = () => {} }) {
  const dispatch = useDispatch()
  const [uploading, setUploading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

  const handleUpload = async (file) => {
    // basic validation
    if (!file) return false
    if (file.size > MAX_SIZE_BYTES) {
      messageApi.error('File too large. Maximum allowed size is 10MB.')
      return false
    }

    setUploading(true)

    try {
      const parsedData = await parseResume(file)

      dispatch(
        updateProfile({
          id: candidate.id,
          profile: {
            resume: {
              fileName: file.name,
              textExtracted: true,
            },
            ...parsedData,
          },
        })
      )

      messageApi.success('Resume uploaded and parsed successfully!')

      // Small delay for UX then proceed
      setTimeout(() => {
        try {
          onNext()
        } catch (e) {
          // swallow
        }
      }, 700)
    } catch (error) {
      console.error('Resume parsing error:', error)
      messageApi.error('Failed to parse resume. Please try again.')
    } finally {
      setUploading(false)
    }

    // Prevent default Upload behavior (we handle file client-side)
    return false
  }

  const uploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf,.docx',
    beforeUpload: handleUpload,
    showUploadList: false,
  }

  return (
    <Card>
      {contextHolder}
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upload Your Resume</h2>
          <p className="text-gray-600">
            Upload your resume in PDF or DOCX format. We'll extract your information automatically.
          </p>
        </div>

        {candidate.resume ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Resume Uploaded Successfully!</h3>
            <p className="text-gray-600 mb-6">File: {candidate.resume.fileName}</p>
            <Button type="primary" onClick={onNext} size="large">
              Continue to Profile
            </Button>
          </div>
        ) : (
          <Spin spinning={uploading} tip="Parsing resume...">
            <Dragger {...uploadProps} className="upload-dragger">
              <p className="ant-upload-drag-icon">
                <UploadIcon size={48} className="text-blue-500" />
              </p>
              <p className="ant-upload-text text-lg font-medium">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint text-gray-500">Support for PDF and DOCX files. Maximum file size: 10MB</p>
            </Dragger>
          </Spin>
        )}
      </div>
    </Card>
  )
}

export default ResumeUploader
