/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useCallback, useEffect, useState, useStore } from 'openinula';
import Dayjs from 'dayjs';
import { firstAlphabetUp, solveAnnotationOrLabelDiff, solveNamepaceShowName, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import { EditOutlined } from '@ant-design/icons';
import { Tag, message } from 'antd';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
export default function Detail({ namespaceName, namespaceDetailDataProps, refreshFn }) {
  const [namespaceDetailData, setNamespaceDetailData] = useState(namespaceDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();
  // 对话框展示
  const [isNamespaceAnnotationModalOpen, setIsNamespaceAnnotationModalOpen] = useState(false);
  // 对话框展示
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState(namespaceDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(namespaceDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');
  // 注解成功回调
  const handleNamespaceAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsNamespaceAnnotationModalOpen(false);
    } else {
      const namespaceDetailAnnKeyArr = [];
      data.map(item => namespaceDetailAnnKeyArr.push(item.key));
      if (namespaceDetailAnnKeyArr.filter((item, index) => namespaceDetailAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addNamespaceAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('namespace', '', namespaceName, addNamespaceAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsNamespaceAnnotationModalOpen(false);
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
  // 注解失败回调
  const handleNamespaceAnnotationCancel = () => {
    setIsNamespaceAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleNamespaceLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const namespaceDetailLabKeyArr = [];
      data.map(item => namespaceDetailLabKeyArr.push(item.key));
      if (namespaceDetailLabKeyArr.filter((item, index) => namespaceDetailLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addNamespaceLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('namespace', '', namespaceName, addNamespaceLabelList);
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
  // 标签失败回调
  const handleNamespaceLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const namespaceBaseInfoItems = [
    { key: '命名空间名称：', value: namespaceDetailData?.metadata?.name },
    {
      key: '命名空间状态：',
      value: <span className={`${namespaceDetailData?.status?.phase === 'Active' ? 'running' : 'terminating'}_circle`}>
        {namespaceDetailData?.status?.phase ? firstAlphabetUp(namespaceDetailData.status.phase) : '--'}
      </span>,
    },
    { key: '创建时间：', value: Dayjs(namespaceDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];

  return <Fragment>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={namespaceBaseInfoItems} columns={1} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={namespaceDetailData?.metadata.labels} callbackOk={handleNamespaceLabelOk} callbackCancel={handleNamespaceLabelCancel} />
            <div className="key_value">
              {namespaceDetailData.metadata?.labels?.length ?
                namespaceDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsNamespaceAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isNamespaceAnnotationModalOpen} type="annotation" dataList={namespaceDetailData?.metadata.annotations} callbackOk={handleNamespaceAnnotationOk} callbackCancel={handleNamespaceAnnotationCancel} />
            <div className="key_value">
              {namespaceDetailData.metadata?.annotations?.length ?
                namespaceDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}