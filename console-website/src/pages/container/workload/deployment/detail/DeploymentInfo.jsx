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
import { Fragment, useState, useEffect, useStore, useMemo } from 'openinula';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import { Tag, message } from 'antd';
import { getWorkloadStatusJudge, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import CpuIcon from '@/assets/images/cpuIcon.png';
import MemoryIcon from '@/assets/images/memoryIcon.png';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import ToolTipComponent from '@/components/ToolTipComponent';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function DeploymentInfo({ deploymentName, deploymentNamespace, deploymentDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);
  const [deploymentDetailData, setDeploymentDetailData] = useState(deploymentDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();
  const [isDeploymentAnnotationModalOpen, setIsDeploymentAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState(deploymentDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(deploymentDetailDataProps.spec.template.metadata.labels);
  const themeStore = useStore('theme');

  const deploymentBaseInfoItems = useMemo(() => {
    const d = deploymentDetailData;
    const statusText = getWorkloadStatusJudge(d.status);
    return [
      { key: '负载名称：', value: d.metadata.name, descriptionClassName: 'deploymentDetail' },
      { key: '负载类型：', value: d.kind },
      { key: '负载状态：', value: <span className={`${statusText.toLowerCase()}_circle`}>{statusText}</span> },
      { key: '创建时间：', value: Dayjs(d.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm') },
      { key: '命名空间：', value: d.metadata.namespace },
      { key: '实例(正常/总量)：', value: `${d.status.readyReplicas || 0}/${d.status.replicas || 0}` },
      { key: '容器镜像：', value: d.spec?.template?.spec?.containers[0]?.image },
    ];
  }, [deploymentDetailData]);

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsDeploymentAnnotationModalOpen(false);
    } else {
      const deploymentKeyArr = [];
      data.map(item => deploymentKeyArr.push(item.key));
      if (deploymentKeyArr.filter((item, index) => deploymentKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('deployment', deploymentNamespace, deploymentName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsDeploymentAnnotationModalOpen(false);
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
    setIsDeploymentAnnotationModalOpen(false);
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
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label', true);
        try {
          const res = await editAnnotationsOrLabels('deployment', deploymentNamespace, deploymentName, addLabelList);
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

  const handleShowChange = () => {
    setIsShow(false);
  };

  return <Fragment>
    <div className="deploymentMessage" style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`${isShow ? '' : 'cant_show'}`}>
      <ToolTipComponent>
        <div className="deploymentDetail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className='promot-box'>工作负载监控详情请前往<Link to={`/${containerRouterPrefix}/monitor/monitorDashboard`}>监控大屏</Link>查看</div>
          <CloseOutlined onClick={handleShowChange} />
        </div>
      </ToolTipComponent>
    </div>
    <div className={`deploymentDetail tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={deploymentBaseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={deploymentDetailData?.spec.template.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {deploymentDetailData.spec.template.metadata?.labels?.length ?
                deploymentDetailData.spec.template.metadata.labels.map(item =>
                  <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsDeploymentAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isDeploymentAnnotationModalOpen} type="annotation" dataList={deploymentDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {deploymentDetailData.metadata?.annotations?.length ?
                deploymentDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add deploymentDetail">
        <h3>资源用量</h3>
        <div className="resource_list">
          <div className="resource_item">
            <img className="resource_icon" src={CpuIcon} />
            <div className="resource_word">
              <p>CPU（core）</p>
              <p>{deploymentDetailData.spec?.template?.spec?.containers[0].resources?.requests?.cpu || '--'}</p>
            </div>
          </div>

          <div className="resource_item">
            <img className="resource_icon" src={MemoryIcon} />
            <div className="resource_word">
              <p>内存（MB）</p>
              <p>{deploymentDetailData.spec?.template?.spec?.containers[0].resources?.requests?.memory || '--'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}