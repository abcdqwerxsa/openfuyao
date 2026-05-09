/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useState, useStore, useEffect } from 'openinula';
import Dayjs from 'dayjs';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { EditOutlined } from '@ant-design/icons';
import { Tag, Progress, message } from 'antd';
import { ResponseCode } from '@/common/constants';
import { solveAnnotationOrLabelDiff, solveResourceEcharts, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
export default function Detail({ resourceQuotaName, resourceQuotaNamespace, resourceQuotaDetailDataProps, refreshFn }) {
  const [resourceQuotaDetailData, setResourceQuotaDetailData] = useState(resourceQuotaDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();
  const [isResourceQuotaAnnotationModalOpen, setIsResourceQuotaAnnotationModalOpen] = useState(false);
  const [isResourceQuotaLabelModalOpen, setIsResourceQuotaLabelModalOpen] = useState(false);
  const [resourceQuotaEchartsData, setResourceQuotaEchartsData] = useState(solveResourceEcharts(resourceQuotaDetailDataProps.status));
  const [oldAnnotations, setOldAnnotataions] = useState(resourceQuotaDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(resourceQuotaDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');

  // 注解成功回调
  const handleResourceQuotaAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsResourceQuotaAnnotationModalOpen(false);
    } else {
      const resourceQuotaAnnKeyArr = [];
      data.map(item => resourceQuotaAnnKeyArr.push(item.key));
      if (resourceQuotaAnnKeyArr.filter((item, index) => resourceQuotaAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addResourceQuotaAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('resourcequota', resourceQuotaNamespace, resourceQuotaName, addResourceQuotaAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsResourceQuotaAnnotationModalOpen(false);
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
  const handleResourceQuotaAnnotationCancel = () => {
    setIsResourceQuotaAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleResourceQuotaLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsResourceQuotaLabelModalOpen(false);
    } else {
      const resourceQuotaLabelKeyArr = [];
      data.map(item => resourceQuotaLabelKeyArr.push(item.key));
      if (resourceQuotaLabelKeyArr.filter((item, index) => resourceQuotaLabelKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addResourceQuotaLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('resourcequota', resourceQuotaNamespace, resourceQuotaName, addResourceQuotaLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsResourceQuotaLabelModalOpen(false);
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
  const handleResourceQuotaLabelCancel = () => {
    setIsResourceQuotaLabelModalOpen(false);
  };

  const resourceQuotaBaseInfoItems = [
    { key: '资源配额名称：', value: resourceQuotaDetailData?.metadata?.name },
    { key: '命名空间：', value: resourceQuotaDetailData?.metadata?.namespace },
    { key: '创建时间：', value: Dayjs(resourceQuotaDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={resourceQuotaBaseInfoItems} columns={1} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsResourceQuotaLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isResourceQuotaLabelModalOpen} type="label" dataList={resourceQuotaDetailData?.metadata.labels} callbackOk={handleResourceQuotaLabelOk} callbackCancel={handleResourceQuotaLabelCancel} />
            <div className="key_value">
              {resourceQuotaDetailData.metadata?.labels?.length ?
                resourceQuotaDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsResourceQuotaAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isResourceQuotaAnnotationModalOpen} type="annotation" dataList={resourceQuotaDetailData?.metadata.annotations} callbackOk={handleResourceQuotaAnnotationOk} callbackCancel={handleResourceQuotaAnnotationCancel} />
            <div className="key_value">
              {resourceQuotaDetailData.metadata?.annotations?.length ?
                resourceQuotaDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add">
        <h3>资源配额详情</h3>
        <div className="echarts_list">
          {resourceQuotaEchartsData.map(item => (
            <div className="echarts_item">
              <p className="ecahrts_title">{item.title}</p>
              <Progress
                type="circle"
                percent={item.rate}
                strokeColor={item.rate >= 100 ? '#e7434a' : '#09aa71'}
                format={(_percent) => `${item.rate}%`}></Progress>
              <div className="word_flex">
                <p>
                  <span>使用配额</span>
                  <span>{item.used}</span>
                </p>
                <p>
                  <span>配额上限</span>
                  <span>{item.max}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Fragment>;
}