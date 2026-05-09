/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Link } from 'inula-router';
import { containerRouterPrefix } from '@/constant';
import { Fragment, useState, useStore, useEffect, useMemo } from 'openinula';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import AnnotationModal from '@/components/AnnotationModal';
import { Table, ConfigProvider, Tag, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { getJobStatus, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import ToolTipComponent from '@/components/ToolTipComponent';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function JobInfo({ jobName, jobNamespace, jobDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const [jobDetailData, setJobDetailData] = useState(jobDetailDataProps); // 详情数据
  const [isJobDetailAnnotationModalOpen, setIsJobDetailAnnotationModalOpen] = useState(false);
  const [isJobDetailLabelModalOpen, setIsJobDetailLabelModalOpen] = useState(false);
  const [oldJobDetailAnnotations, setOldJobDetailAnnotataions] = useState(jobDetailDataProps.metadata.annotations);
  const [oldJobDetailLabels, setOldJobDetailLabels] = useState(jobDetailDataProps.metadata.labels);
  const [podData, setPodData] = useState(jobDetailDataProps.spec.template.spec.containers || []);
  const [containerData, setContainerData] = useState(jobDetailDataProps.status?.conditions || []);
  const themeStore = useStore('theme');

  const jobBaseInfoItems = useMemo(() => {
    const j = jobDetailData;
    return [
      { key: '负载名称：', value: j?.metadata.name, descriptionClassName: 'jobDetail' },
      { key: 'Pod选择器：', value: j?.kind },
      { key: '命名空间：', value: j?.metadata.namespace },
      { key: '创建时间：', value: Dayjs(j?.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm') },
    ];
  }, [jobDetailData]);

  const jobStatusInfoItems = useMemo(() => {
    const j = jobDetailData;
    const statusText = getJobStatus(j.status);
    return [
      { key: '状态：', value: <span className={`${statusText.toLowerCase()}_circle`}>{statusText}</span> },
      {
        key: '完成时间：',
        value: j.status.completionTime ? Dayjs(j.status.completionTime).format('YYYY-MM-DD HH:mm') : undefined,
      },
      { key: '开始时间：', value: Dayjs(j.status.startTime).format('YYYY-MM-DD HH:mm') },
    ];
  }, [jobDetailData]);

  const handleShowChange = () => {
    setIsShow(false);
  };

  // 注解成功回调
  const handleAnnotationOk = async (jobDetailTemporyData) => {
    if (JSON.stringify(oldJobDetailAnnotations) === JSON.stringify(jobDetailTemporyData)) {
      messageApi.info('注解未进行修改');
      setIsJobDetailAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      jobDetailTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldJobDetailAnnotations, jobDetailTemporyData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('job', jobNamespace, jobName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsJobDetailAnnotationModalOpen(false);
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
    setIsJobDetailAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (jobDetailTemporyData) => {
    if (JSON.stringify(oldJobDetailLabels) === JSON.stringify(jobDetailTemporyData)) {
      messageApi.info('标签未进行修改');
      setIsJobDetailLabelModalOpen(false);
    } else {
      const keyArr = [];
      jobDetailTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的标签
        const addLabelList = solveAnnotationOrLabelDiff(oldJobDetailLabels, jobDetailTemporyData, 'label');
        try {
          const res = await editAnnotationsOrLabels('job', jobNamespace, jobName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsJobDetailLabelModalOpen(false);
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
    setIsJobDetailLabelModalOpen(false);
  };

  // Pod组
  const podColumns = [
    {
      title: '名称',
      key: 'pod_name',
      render: (_, record) => record.name,
    },
    {
      title: '镜像',
      key: 'pod_image',
      render: (_, record) => record.image,
    },
    {
      title: '资源限制',
      key: 'pod_name',
      render: (_, record) => <div style={{ display: 'flex', alignItems: 'center' }}>
        {(record.resources && record.resources.requests) ?
          Object.entries(record.resources.requests).map(key, val => (
            <div className="label_item_table">
              <Tag
                color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#234c9e'}
                className="label_tag_key jobDetail"
              >
                {key}:{val}
              </Tag>
            </div>
          )) : '--'
        }
      </div>,
    },
    {
      title: '端口',
      key: 'pod_port',
      render: (_, record) => record.port || '--',
    },
  ];

  const containerColumns = [
    {
      title: '类型',
      key: 'container_type',
      render: (_, record) => record.type,
    },
    {
      title: '状态',
      key: 'container_status',
      render: (_, record) => <div className={`status_group`}>
        <span className={record.status === 'True' ? 'running_circle' : 'pending_circle'}></span>
        <span>{record.status}</span>
      </div>,
    },
    {
      title: '更新时间',
      key: 'container_updatedTime',
      render: (_, record) => Dayjs(record.lastTransitionTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '原因',
      key: 'container_reason',
      render: (_, _record) => jobDetailData.status.reason || '--',
    },
    {
      title: '消息',
      key: 'container_message',
      render: (_, _record) => jobDetailData.status.message || '--',
    },
  ];

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`${isShow ? '' : 'cant_show'}`}>
      <ToolTipComponent>
        <div className="jobDetail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className='promot-box'>工作负载监控详情请前往<Link to={`/${containerRouterPrefix}/monitor/monitorDashboard`}>监控大屏</Link>查看</div>
          <CloseOutlined onClick={handleShowChange} />
        </div>
      </ToolTipComponent>
    </div>
    <div className={`jobDetail tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={jobBaseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsJobDetailLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isJobDetailLabelModalOpen} type="label" dataList={jobDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {jobDetailData.metadata?.labels?.length ?
                jobDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsJobDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isJobDetailAnnotationModalOpen} type="annotation" dataList={jobDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {jobDetailData.metadata?.annotations?.length ?
                jobDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add jobDetail">
        <h3>Job状态</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={jobStatusInfoItems} columns={2} />
        </div>
      </div>

      <div className="detail_card container_card_add">
        <h3>Pod</h3>
        <ConfigProvider locale={zhCN}>
          <Table className="table_padding jodDetail" style={{ paddingRight: '0px' }} dataSource={podData} columns={podColumns}
            pagination={{
              className: 'page',
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
              showTotal: total => `共${total}条`,
            }} />
        </ConfigProvider>
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