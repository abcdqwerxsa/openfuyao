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
import '@/styles/applicationMarket/index.less';
import { useState, useStore } from 'openinula';
import { CloudUploadOutlined } from '@ant-design/icons';
import uploadPackage from '@/assets/images/uploadPackage.png';
import axios from 'axios';
import { getLimitPackageNumber } from '@/api/applicationMarketApi';
import { ResponseCode } from '@/common/constants';
import { checkSessionStorage } from '@/tools/utils';

const applicationMarketApi = '/applicationMarketApi/';

export default function CreateApplicationPackage({ openAdd, onCancelFn }) {
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [errorInfo, setErrorInfo] = useState('');

  const props = {
    onRemove: (file) => {
      setErrorInfo('');
      setFileList([]); // 清空文件列表
    },
    beforeUpload: async (file) => {
      // 先进行数量限制
      try {
        const res = await getLimitPackageNumber();
        if (res.status === ResponseCode.OK) {
          if (res.data && res.data.data && res.data.data.total >= res.data.data.limit) {
            messageApi.error('文件超出上传限制！');
            return false;
          }
        }
      } catch (e) {
        messageApi.error('检测文件上传数量失败！');
      }
      setErrorInfo('');
      const isLt10M = file.size / 1024 / 1024 < 2;
      if (!isLt10M) {
        messageApi.error('文件大小不超过2MB!');
        return false;
      }
      const isGzipFile = file.name.endsWith('.tgz') || file.name.endsWith('.gz');
      if (isGzipFile) {
        setFileList([file]); // 替换文件列表，确保只有一个文件
        return false; // 创建应用包取消默认上传行为
      } else {
        messageApi.error('仅支持.tgz 或 .gz 格式的文件!');
        return false;
      }
    },
    fileList,
  };

  const handleUpload = async () => {
    const appFormData = new FormData();
    fileList.forEach((file) => {
      appFormData.append('chart', file);
    });
    setUploading(true);
    let clusterName = checkSessionStorage('cluster') ? sessionStorage.getItem('cluster') : 'host';
    try {
      const response = await axios({
        method: 'post',
        url: `/clusters/${clusterName}/rest/marketplace/v1beta1/helm-charts`,
        data: appFormData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFileList([]);
      messageApi.success('文件上传成功');
      onCancelFn();
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        setErrorInfo(error.response.data.msg);
        messageApi.error(error.data.response.msg || '文件上传失败');
      }
    } finally {
      setUploading(false);
    };
  };

  const handleCancel = () => {
    setFileList([]); // 清空上传文件列表
    setErrorInfo('');
    onCancelFn();
  };
  return (
    <Modal
      onCancel={handleCancel}
      open={openAdd}
      width={720}
      title='添加包'
      footer={[
        <Button
          onClick={handleCancel}
          className='cancel_btn'
        >
          取消
        </Button>,
        <Button
          className='primary_btn'
          onClick={handleUpload}
          loading={uploading}
        >
          确定
        </Button>,
      ]}
    >
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className='upload_container'>
        <div>
          <img src={uploadPackage} />
        </div>
        <div>
          <Upload {...props}>
            <Button icon={<CloudUploadOutlined />} type='text' style={{ padding: '0 8px', borderRadius: 6 }}>
              上传文件
            </Button>
            <div style={{ color: '#89939b' }}>
              文件最大限制2M，支持上传.tgz、.gz格式。
            </div>
          </Upload>
        </div>
      </div>
      <div style={{ color: '#e7434a' }}>{errorInfo}</div>
    </Modal>
  );
}
