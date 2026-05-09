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
import CpuIcon from '@/assets/images/cpuIcon.png';
import MemoryIcon from '@/assets/images/memoryIcon.png';
import AnnotationModal from '@/components/AnnotationModal';
import { Tag, message } from 'antd';
import { getWorkloadStatusJudge, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import ToolTipComponent from '@/components/ToolTipComponent';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function StatefulSetDetail({ statefulSetName, statefulSetNamespace, statefulSetDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);
  const [statefulSetDetailData, setStatefulSetDetailData] = useState(statefulSetDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();
  const [isStatefulSetDetailAnnotationModalOpen, setIsStatefulSetDetailAnnotationModalOpen] = useState(false);
  const [isStatefulSetDetailLabelModalOpen, setIsStatefulSetDetailLabelModalOpen] = useState(false);
  const [oldStatefulSetDetailAnnotations, setOldStatefulSetDetailAnnotataions] = useState(statefulSetDetailDataProps.metadata.annotations);
  const [oldStatefulSetDetailLabels, setOldStatefulSetDetailLabels] = useState(statefulSetDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');

  const statefulSetBaseInfoItems = useMemo(() => {
    const d = statefulSetDetailData;
    const statusText = getWorkloadStatusJudge(d.status);
    return [
      { key: '负载名称：', value: d?.metadata.name, descriptionClassName: 'statefulsetDetail' },
      { key: '负载类型：', value: d?.kind },
      { key: '负载状态：', value: <span className={`${statusText.toLowerCase()}_circle`}>{statusText}</span> },
      { key: '创建时间：', value: Dayjs(d?.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm') },
      { key: '命名空间：', value: d?.metadata.namespace },
      { key: '实例(正常/总量)：', value: `${d.status.readyReplicas || 0}/${d.status.replicas}` },
      { key: '容器镜像：', value: d?.spec?.template?.spec?.containers[0]?.image },
    ];
  }, [statefulSetDetailData]);

  const handleShowChange = () => {
    setIsShow(false);
  };

  // 注解成功回调
  const handleAnnotationOk = async (statefulSetTemporyData) => {
    if (JSON.stringify(oldStatefulSetDetailAnnotations) === JSON.stringify(statefulSetTemporyData)) {
      messageApi.info('注解未进行修改');
      setIsStatefulSetDetailAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      statefulSetTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldStatefulSetDetailAnnotations, statefulSetTemporyData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('statefulset', statefulSetNamespace, statefulSetName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsStatefulSetDetailAnnotationModalOpen(false);
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
    setIsStatefulSetDetailAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (statefulSetTemporyData) => {
    if (JSON.stringify(oldStatefulSetDetailLabels) === JSON.stringify(statefulSetTemporyData)) {
      messageApi.info('标签未进行修改');
      setIsStatefulSetDetailLabelModalOpen(false);
    } else {
      const keyArr = [];
      statefulSetTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldStatefulSetDetailLabels, statefulSetTemporyData, 'label');
        try {
          const res = await editAnnotationsOrLabels('statefulset', statefulSetNamespace, statefulSetName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsStatefulSetDetailLabelModalOpen(false);
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
    setIsStatefulSetDetailLabelModalOpen(false);
  };

  return <Fragment>
    <div className="statefulsetMessage" style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`${isShow ? '' : 'cant_show'}`}>
      <ToolTipComponent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className='promot-box'>工作负载监控详情请前往<Link to={`/${containerRouterPrefix}/monitor/monitorDashboard`}>监控大屏</Link>查看</div>
          <CloseOutlined onClick={handleShowChange} />
        </div>
      </ToolTipComponent>
    </div>
    <div className={`statefulsetDetail tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={statefulSetBaseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsStatefulSetDetailLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isStatefulSetDetailLabelModalOpen} type="label" dataList={statefulSetDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {statefulSetDetailData.metadata?.labels?.length ?
                statefulSetDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsStatefulSetDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isStatefulSetDetailAnnotationModalOpen} type="annotation" dataList={statefulSetDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {statefulSetDetailData.metadata?.annotations?.length ?
                statefulSetDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add statefulsetDetail">
        <h3>资源用量</h3>
        <div className="resource_list">
          <div className="resource_item">
            <img className="resource_icon" src={CpuIcon} />
            <div className="resource_word">
              <p>CPU（core）</p>
              <p>{statefulSetDetailData?.spec?.template?.spec?.containers[0].resources?.requests?.cpu || '--'}</p>
            </div>
          </div>

          <div className="resource_item">
            <img className="resource_icon" src={MemoryIcon} />
            <div className="resource_word">
              <p>内存（MB）</p>
              <p>{statefulSetDetailData?.spec?.template?.spec?.containers[0].resources?.requests?.memory || '--'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}