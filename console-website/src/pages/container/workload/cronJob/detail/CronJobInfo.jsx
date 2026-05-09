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
import { Link } from 'inula-router';
import { containerRouterPrefix } from '@/constant';
import { Fragment, useState, useStore, useMemo } from 'openinula';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import AnnotationModal from '@/components/AnnotationModal';
import zhCN from 'antd/es/locale/zh_CN';
import { Table, ConfigProvider, Tag, message } from 'antd';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import ToolTipComponent from '@/components/ToolTipComponent';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function CronJobInfo({ cronJobName, cronJobNamespace, cronJobDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);
  const [cronJobDetailData, setCronJobDetailData] = useState(cronJobDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();
  const [isCronJobDetailAnnotationModalOpen, setIsCronJobDetailAnnotationModalOpen] = useState(false);
  const [isCronJobDetailLabelModalOpen, setIsCronJobDetailLabelModalOpen] = useState(false);
  const [oldCronJobDetailAnnotations, setOldCronJobDetailAnnotataions] = useState(cronJobDetailDataProps.metadata.annotations);
  const [oldCronJobDetailLabels, setOldCronJobDetailLabels] = useState(cronJobDetailDataProps.metadata.labels);
  const [podData, setPodData] = useState(cronJobDetailDataProps.spec.jobTemplate.spec.template.spec.containers);
  const themeStore = useStore('theme');

  const cronJobBaseInfoItems = useMemo(() => {
    const c = cronJobDetailData;
    const startingSec = c?.spec?.startingDeadlineSeconds;
    return [
      { key: '负载名称：', value: c?.metadata.name, descriptionClassName: 'cornjobDetail' },
      { key: '上次调度时间：', value: Dayjs(c?.status.lastScheduleTime).format('YYYY-MM-DD HH:mm') },
      { key: '调度：', value: c?.spec.schedule },
      { key: '并发策略：', value: c?.spec.concurrencyPolicy },
      { key: '命名空间：', value: c?.metadata.namespace },
      { key: '创建时间：', value: Dayjs(c.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm') },
      { key: '挂起：', value: c?.spec.suspend ? 'true' : 'false' },
      { key: '起始期限：', value: startingSec ? `${startingSec}秒` : undefined },
    ];
  }, [cronJobDetailData]);

  const handleShowChange = () => {
    setIsShow(false);
  };
  // 注解成功回调
  const handleAnnotationOk = async (cronJobTemporyData) => {
    if (JSON.stringify(oldCronJobDetailAnnotations) === JSON.stringify(cronJobTemporyData)) {
      messageApi.info('注解未进行修改');
      setIsCronJobDetailAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      cronJobTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldCronJobDetailAnnotations, cronJobTemporyData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('cronjob', cronJobNamespace, cronJobName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsCronJobDetailAnnotationModalOpen(false);
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
    setIsCronJobDetailAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (cronJobTemporyData) => {
    if (JSON.stringify(oldCronJobDetailLabels) === JSON.stringify(cronJobTemporyData)) {
      messageApi.info('标签未进行修改');
      setIsCronJobDetailLabelModalOpen(false);
    } else {
      const keyArr = [];
      cronJobTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldCronJobDetailLabels, cronJobTemporyData, 'label');
        try {
          const res = await editAnnotationsOrLabels('cronjob', cronJobNamespace, cronJobName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsCronJobDetailLabelModalOpen(false);
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
    setIsCronJobDetailLabelModalOpen(false);
  };

  // Pod组
  const podColumns = [
    {
      key: 'pod_name',
      title: '名称',
      render: (_, record) => record.name,
    },
    {
      key: 'pod_image',
      title: '镜像',
      render: (_, record) => record.image,
    },
    {
      key: 'pod_name',
      title: '资源限制',
      render: (_, record) => <div style={{ display: 'flex', alignItems: 'center' }}>
        {(record.resources && record.resources.requests) ?
          Object.entries(record.resources.requests).map(key, val => (
            <div className="label_item_table cornjobDetail">
              <Tag
                color={themeStore.$s.theme === 'light' ? '#cce6ff' : '#234c9e'}
                className="label_tag_key cornjobDetail"
              >
                {key}:{val}
              </Tag>
            </div>
          )) : '--'
        }
      </div>,
    },
    {
      key: 'pod_port',
      title: '端口',
      render: (_, record) => record.ports && record.ports.length ? record.ports[0].containerPort : '--',
    },
  ];

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`${isShow ? '' : 'cant_show'}`}>
      <ToolTipComponent>
        <div className="cornjobDetail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className='promot-box'>工作负载监控详情请前往<Link to={`/${containerRouterPrefix}/monitor/monitorDashboard`}>监控大屏</Link>查看</div>
          <CloseOutlined onClick={handleShowChange} />
        </div>
      </ToolTipComponent>
    </div>
    <div className={`cornjobDetail tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={cronJobBaseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsCronJobDetailLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isCronJobDetailLabelModalOpen} type="label" dataList={cronJobDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {cronJobDetailData.metadata?.labels?.length ?
                cronJobDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsCronJobDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isCronJobDetailAnnotationModalOpen} type="annotation" dataList={cronJobDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {cronJobDetailData.metadata?.annotations?.length ?
                cronJobDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="detail_card container_card_add cornjobDetail">
        <h3>Pod</h3>
        <ConfigProvider locale={zhCN}>
          <Table className="table_padding cornjobDetail" style={{ paddingRight: '0px' }} dataSource={podData} columns={podColumns}
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