/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useState, useEffect, useStore } from 'openinula';
import { EditOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import { message } from 'antd';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function ServiceAccountInfo({ serviceAccountName, serviceAccountNamespace, serviceAccountDetailDataProps, refreshFn }) {
  const [serviceAccountDetailData, setServiceAccountDetailData] = useState(serviceAccountDetailDataProps);
  const [messageApi, contextHolder] = message.useMessage();

  const [isServiceAccountDetailAnnotationModalOpen, setIsServiceAccountDetailAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState(serviceAccountDetailDataProps?.metadata?.annotations ?? []);
  const [oldLabels, setOldLabels] = useState(serviceAccountDetailDataProps?.metadata?.labels ?? []);
  const themeStore = useStore('theme');

  useEffect(() => {
    setServiceAccountDetailData(serviceAccountDetailDataProps);
    setOldAnnotataions(serviceAccountDetailDataProps?.metadata?.annotations ?? []);
    setOldLabels(serviceAccountDetailDataProps?.metadata?.labels ?? []);
  }, [serviceAccountDetailDataProps]);

  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsServiceAccountDetailAnnotationModalOpen(false);
    } else {
      const serviceAccountDetailKeyArr = [];
      data.map(item => serviceAccountDetailKeyArr.push(item.key));
      if (serviceAccountDetailKeyArr.filter((item, index) => serviceAccountDetailKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('serviceaccount', serviceAccountNamespace, serviceAccountName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsServiceAccountDetailAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败！${error.response.data.message}`);
          }
        }
      }
    }
  };

  const handleAnnotationCancel = () => {
    setIsServiceAccountDetailAnnotationModalOpen(false);
  };

  const handleLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const keyArr = [];
      data.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('serviceaccount', serviceAccountNamespace, serviceAccountName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsLabelModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败！${error.response.data.message}`);
          }
        }
      }
    }
  };

  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const serviceAccountBaseInfoItems = [
    { key: '服务账号名称：', value: serviceAccountDetailData?.metadata?.name },
    { key: '命名空间：', value: serviceAccountDetailData?.metadata?.namespace },
    { key: '创建时间：', value: Dayjs(serviceAccountDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];

  if (!serviceAccountDetailData?.metadata) {
    return null;
  }

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={serviceAccountBaseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={serviceAccountDetailData.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {serviceAccountDetailData.metadata?.labels?.length ?
                serviceAccountDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsServiceAccountDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isServiceAccountDetailAnnotationModalOpen} type="annotation" dataList={serviceAccountDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {serviceAccountDetailData.metadata?.annotations?.length ?
                serviceAccountDetailData.metadata.annotations.map(item =>
                  <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}
