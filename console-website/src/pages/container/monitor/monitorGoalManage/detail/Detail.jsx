/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
  
 *       http://license.coscl.org.cn/MulanPSL2
  
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */
import { Fragment, useState, useStore } from 'openinula';
import { EditOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import AnnotationModal from '@/components/AnnotationModal';
import { Table, ConfigProvider, Tag, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import { editResourceExampleAnnotationOrlabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { disabledModifyMonitorServiceCr } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function Detail({ serviceMonitorName, prefixObjProps, serviceMonitorNamespace, serviceMonitorDetailDataProps, refreshFn }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [serviceMonitorDetailData, setServiceMonitorDetailData] = useState(serviceMonitorDetailDataProps); // 详情数据
  const [isMonitorGoalManageAnnotationModalOpen, setIsMonitorGoalManageAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState(serviceMonitorDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(serviceMonitorDetailDataProps.metadata.labels);
  const [containerData, setContainerData] = useState(serviceMonitorDetailDataProps.status?.conditions || []);
  const themeStore = useStore('theme');

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsMonitorGoalManageAnnotationModalOpen(false);
    } else {
      const monitorGoalManageKeyArr = [];
      data.map(item => monitorGoalManageKeyArr.push(item.key));
      if (monitorGoalManageKeyArr.filter((item, index) => monitorGoalManageKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editResourceExampleAnnotationOrlabels(
            { ...prefixObjProps, namespace: serviceMonitorNamespace },
            serviceMonitorName,
            addAnnotationList
          );
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsMonitorGoalManageAnnotationModalOpen(false);
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
  const handleAnnotationCancel = () => {
    setIsMonitorGoalManageAnnotationModalOpen(false);
  };

  // 标签成功回调
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
        // 请求接口添加
        // 比较前后是否一致 返回处理后的标签
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editResourceExampleAnnotationOrlabels({ ...prefixObjProps, namespace: serviceMonitorNamespace }, serviceMonitorName, addLabelList);
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
  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const containerColumns = [
    {
      title: '类型',
      key: 'container_type',
      sorter: (a, b) => a.type.slice(0, 1).charCodeAt(0) - b.type.slice(0, 1).charCodeAt(0),
      render: (_, record) => record.type,
    },
    {
      title: '状态',
      key: 'container_status',
      filters: [{
        text: 'True',
        value: 'True',
      },
      {
        text: 'False',
        value: 'False',
      }],
      showSorterTooltip: { target: 'full-header' },
      width: 220,
      onFilter: (value, record) => record.status.indexOf(value) === 0,
      sorter: (a, b) => a.status.slice(0, 1).charCodeAt(0) - b.status.slice(0, 1).charCodeAt(0),
      render: (_, record) => <div className={`status_group`}>
        <span className={record.status === 'True' ? 'running_circle' : 'pending_circle'}></span>
        <span>{record.status}</span>
      </div>,
    },
    {
      title: '更新时间',
      key: 'container_updatedTime',
      sorter: (a, b) => Dayjs(a.lastTransitionTime) - Dayjs(b.lastTransitionTime),
      render: (_, record) => Dayjs(record.lastTransitionTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '原因',
      key: 'container_reason',
      render: (_, _record) => serviceMonitorDetailData.status.reason || '--',
    },
    {
      title: '消息',
      key: 'container_message',
      render: (_, _record) => serviceMonitorDetailData.status.message || '--',
    },
  ];

  const monitorGoalBaseInfoItems = [
    { key: '名称：', value: serviceMonitorDetailData?.metadata?.name },
    { key: '命名空间：', value: serviceMonitorDetailData?.metadata?.namespace },
    { key: '创建时间：', value: Dayjs(serviceMonitorDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={monitorGoalBaseInfoItems} columns={1} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              {!disabledModifyMonitorServiceCr.includes(serviceMonitorName) && <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />}
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={serviceMonitorDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {serviceMonitorDetailData.metadata?.labels?.length ?
                serviceMonitorDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              {!disabledModifyMonitorServiceCr.includes(serviceMonitorName) && <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsMonitorGoalManageAnnotationModalOpen(true)} />}
            </div>
            <AnnotationModal open={isMonitorGoalManageAnnotationModalOpen} type="annotation" dataList={serviceMonitorDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {serviceMonitorDetailData.metadata?.annotations?.length ?
                serviceMonitorDetailData.metadata.annotations.map(item =>
                  <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="detail_card container_card_add">
        <h3>状态信息</h3>
        <ConfigProvider locale={zhCN}>
          <Table className="table_padding" style={{ paddingRight: '0px' }} dataSource={containerData} columns={containerColumns}
            pagination={{
              className: 'page',
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
              showTotal: total => `共${total}条`,
            }} />
        </ConfigProvider>
      </div>
    </div>
  </Fragment>;
}