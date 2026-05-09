/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Upload, Button, message, Modal } from 'antd';
import { ResponseCode } from '@/common/constants';
import '@/styles/applicationMarket/index.less';
import { useState, useStore } from 'openinula';
import { CloudUploadOutlined } from '@ant-design/icons';
import uploadPackage from '@/assets/images/uploadPackage.png';
import axios from 'axios';
import { checkSessionStorage } from '@/tools/utils';

const applicationMarketApi = '/applicationMarketApi/';

export default function CreateVersion({ openAdd, onCancelFn, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [fileListVersion, setFileListVersion] = useState([]);
  const [errorInfo, setErrorInfo] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const props = {
    onRemove: (file) => {
      setErrorInfo('');
      setFileListVersion([]); // 清空文件列表
    },
    beforeUpload: (file) => {
      setErrorInfo('');
      const isLt10M = file.size / 1024 / 1024 < 2;
      if (!isLt10M) {
        messageApi.error('文件大小不超过2MB!');
        return false;
      }
      const isGzipFile = file.name.endsWith('.tgz') || file.name.endsWith('.gz');
      if (isGzipFile) {
        setFileListVersion([file]); // 替换文件列表，确保只有一个文件
        return false; // 创建版本取消默认上传行为
      } else {
        messageApi.error('仅支持.tgz 或 .gz 格式的文件!');
        return false;
      }
    },
    fileList: fileListVersion,
  };

  const handleUpload = async () => {
    const versionFormData = new FormData();
    fileListVersion.forEach((file) => {
      versionFormData.append('chart', file);
    });
    setUploading(true);
    let clusterName = checkSessionStorage('cluster') ? sessionStorage.getItem('cluster') : 'host';
    try {
      const response = await axios({
        method: 'post',
        url: `/clusters/${clusterName}/rest/marketplace/v1beta1/helm-charts`,
        data: versionFormData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFileListVersion([]);
      messageApi.success('文件上传成功');
      onRefresh();
    } catch (error) {
      setErrorInfo(error.response.data.msg);
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(error.response.data.msg || '文件上传失败');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setErrorInfo('');
    setFileListVersion([]); // 清空文件列表
    onCancelFn();
  };
  return (
    <Modal
      onCancel={handleCancel}
      width={720}
      open={openAdd}
      title='添加版本'
      footer={[
        <Button
          className='cancel_btn'
          onClick={handleCancel}
        >
          取消
        </Button>,
        <Button
          className='primary_btn'
          loading={uploading}
          onClick={handleUpload}
        >
          确定
        </Button>,
      ]}
    >
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className='upload_container versionUpload'>
        <div>
          <img src={uploadPackage} />
        </div>
        <div className='versionUpload'>
          <Upload {...props}>
            <Button icon={<CloudUploadOutlined />} type='text' style={{ padding: '0 8px', borderRadius: 6 }}>
              上传文件
            </Button>
            <div className='versionUpload' style={{ color: '#89939b' }}>
              文件最大限制2M，支持上传.tgz、.gz格式。
            </div>
          </Upload>
        </div>
      </div>
      <div className='versionUpload' style={{ color: '#e7434a' }}>{errorInfo}</div>
    </Modal>
  );
}
