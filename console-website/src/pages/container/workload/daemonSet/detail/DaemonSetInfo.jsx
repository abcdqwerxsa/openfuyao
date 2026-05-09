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
import { Tag, message } from 'antd';
import { solveAnnotationOrLabelDiff, getDaemonSetStatus, forbiddenMsg } from '@/tools/utils';
import CpuIcon from '@/assets/images/cpuIcon.png';
import MemoryIcon from '@/assets/images/memoryIcon.png';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import ToolTipComponent from '@/components/ToolTipComponent';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function DaemonSetInfo({ daemonSetName, daemonSetNamespace, daemonSetDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);
  const [daemonSetDetailData, setDeploymentDetailData] = useState(daemonSetDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();
  const [isDaemonSetDetailAnnotationModalOpen, setIsDaemonSetDetailAnnotationModalOpen] = useState(false);
  const [isDaemonSetDetailLabelModalOpen, setIsDaemonSetDetailLabelModalOpen] = useState(false);
  const [oldDaemonSetDetailAnnotations, setOldDaemonSetDetailAnnotataions] = useState(daemonSetDetailDataProps.metadata.annotations);
  const [oldDaemonSetDetailLabels, setOldDaemonSetDetailLabels] = useState(daemonSetDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');

  const daemonSetBaseInfoItems = useMemo(() => {
    const d = daemonSetDetailData;
    const statusText = getDaemonSetStatus(d.status);
    return [
      { key: '负载名称：', value: d?.metadata.name, descriptionClassName: 'daemonsetDetail' },
      { key: '负载类型：', value: d?.kind },
      { key: '负载状态：', value: <span className={`${statusText.toLowerCase()}_circle`}>{statusText}</span> },
      { key: '创建时间：', value: Dayjs(d?.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm') },
      { key: '命名空间：', value: d?.metadata.namespace },
      {
        key: '实例（正常/总量）：',
        value: `${d.status.currentNumberScheduled}/${d.status.desiredNumberScheduled}`,
        keyStyle: { width: 'auto' },
        valueStyle: { marginLeft: '12px' },
      },
      { key: '容器镜像：', value: d.spec?.template?.spec?.containers[0]?.image },
    ];
  }, [daemonSetDetailData]);

  const handleShowChange = () => {
    setIsShow(false);
  };

  // 注解成功回调
  const handleAnnotationOk = async (daemonSetDetailTemporyData) => {
    if (JSON.stringify(oldDaemonSetDetailAnnotations) === JSON.stringify(daemonSetDetailTemporyData)) {
      messageApi.info('注解未进行修改');
      setIsDaemonSetDetailAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      daemonSetDetailTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldDaemonSetDetailAnnotations, daemonSetDetailTemporyData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('daemonset', daemonSetNamespace, daemonSetName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsDaemonSetDetailAnnotationModalOpen(false);
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
    setIsDaemonSetDetailAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (daemonSetDetailTemporyData) => {
    if (JSON.stringify(oldDaemonSetDetailLabels) === JSON.stringify(daemonSetDetailTemporyData)) {
      messageApi.info('标签未进行修改');
      setIsDaemonSetDetailLabelModalOpen(false);
    } else {
      const keyArr = [];
      daemonSetDetailTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldDaemonSetDetailLabels, daemonSetDetailTemporyData, 'label');
        try {
          const res = await editAnnotationsOrLabels('daemonset', daemonSetNamespace, daemonSetName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsDaemonSetDetailLabelModalOpen(false);
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
    setIsDaemonSetDetailLabelModalOpen(false);
  };

  return <Fragment>
    <div className="daemonsetMessage" style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`${isShow ? '' : 'cant_show'}`}>
      <ToolTipComponent>
        <div className="daemonsetDetail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className='promot-box'>工作负载监控详情请前往<Link to={`/${containerRouterPrefix}/monitor/monitorDashboard`}>监控大屏</Link>查看</div>
          <CloseOutlined onClick={handleShowChange} />
        </div>
      </ToolTipComponent>
    </div>
    <div className={`daemonsetDetail tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={daemonSetBaseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsDaemonSetDetailLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isDaemonSetDetailLabelModalOpen} type="label" dataList={daemonSetDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {daemonSetDetailData.metadata?.labels?.length ?
                daemonSetDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsDaemonSetDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isDaemonSetDetailAnnotationModalOpen} type="annotation" dataList={daemonSetDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {daemonSetDetailData.metadata?.annotations?.length ?
                daemonSetDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add daemonsetDetail">
        <h3>资源用量</h3>
        <div className="resource_list">
          <div className="resource_item">
            <img className="resource_icon" src={CpuIcon} />
            <div className="resource_word">
              <p>CPU（core）</p>
              <p>{daemonSetDetailData?.spec?.template?.spec?.containers[0].resources?.requests?.cpu || '--'}</p>
            </div>
          </div>

          <div className="resource_item">
            <img className="resource_icon" src={MemoryIcon} />
            <div className="resource_word">
              <p>内存（MB）</p>
              <p>{daemonSetDetailData?.spec?.template?.spec?.containers[0].resources?.requests?.memory || '--'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}