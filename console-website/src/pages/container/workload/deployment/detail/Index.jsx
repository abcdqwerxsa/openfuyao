/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import DeploymentEvents from '@/pages/container/workload/deployment/detail/DeploymentEvents';
import DeploymentInfo from '@/pages/container/workload/deployment/detail/DeploymentInfo';
import DeploymentYaml from '@/pages/container/workload/deployment/detail/DeploymentYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getDeployment, editAnnotationsOrLabels, deleteDeployment } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';

export default function DeploymentDetail() {
  const { name, namespace, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [deploymentDelModalOpen, setDeploymentDelModalOpen] = useState(false); // 删除对话框展示
  const [isDeploymentDelCheck, setIsDeploymentDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [deploymentDetailTabKey, setDeploymentDetailTabKey] = useState(activeKey || 'info');

  const [deploymentDetailData, setDeploymentDetailData] = useState({}); // 详情数据

  const [deploymentPopOpen, setDeploymentPopOpen] = useState(false); // 气泡悬浮

  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [isDeploymentDetailAnnotationModalOpen, setIsDeploymentDetailAnnotationModalOpen] = useState(false);
  const [isDeploymentLabelModalOpen, setIsDeploymentLabelModalOpen] = useState(false);
  const [oldDeploymentAnnotations, setOldDeploymentAnnotataions] = useState();
  const [oldDeploymentLabels, setOldDeploymentLabels] = useState();

  const [deploymentYaml, setDeploymentYaml] = useState(''); // 传递yaml

  const themeStore = useStore('theme');

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 气泡
  const handleDeploymentPopOpenChange = (open) => {
    setDeploymentPopOpen(open);
  };

  const handleSetDeploymentDetailTabKey = (key) => {
    setDeploymentDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteDeployment = () => {
    setDeploymentPopOpen(false); // 气泡框
    setDeploymentDelModalOpen(true); // 打开弹窗
  };

  const handleDelpDeploymentCancel = () => {
    setDeploymentDelModalOpen(false);
  };

  const handleDelpDeploymentConfirm = async () => {
    try {
      const res = await deleteDeployment(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setDeploymentDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/workload/deployment`);
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleDeploymentDetailCheckFn = (e) => {
    setIsDeploymentDelCheck(e.target.checked);
  };

  const getDeploymentDetailInfo = useCallback(async () => {
    if (name && namespace) {
      setDetailLoded(false);
      const res = await getDeployment(namespace, name);
      if (res.status === ResponseCode.OK) {
        setDeploymentYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.spec.template.metadata.labels = solveAnnotation(res.data.spec.template.metadata.labels);
        setOldDeploymentAnnotataions([...res.data.metadata.annotations]);
        setOldDeploymentLabels([...res.data.spec.template.metadata.labels]);
        setDeploymentDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  const handleModify = () => {
    setDeploymentDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleAnnotationOk = async (deploymentData) => {
    if (JSON.stringify(oldDeploymentAnnotations) === JSON.stringify(deploymentData)) {
      messageApi.info('注解未进行修改');
      setIsDeploymentDetailAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      deploymentData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldDeploymentAnnotations, deploymentData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('deployment', namespace, name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getDeploymentDetailInfo();
              setIsDeploymentDetailAnnotationModalOpen(false);
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
  const handleDeploymentDetailAnnotationCancel = () => {
    setIsDeploymentDetailAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsDeploymentDetailAnnotationModalOpen(true);
    setDeploymentPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsDeploymentLabelModalOpen(true);
    setDeploymentPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (deploymentData) => {
    if (JSON.stringify(oldDeploymentLabels) === JSON.stringify(deploymentData)) {
      messageApi.info('标签未进行修改');
      setIsDeploymentLabelModalOpen(false);
    } else {
      const keyArr = [];
      deploymentData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldDeploymentLabels, deploymentData, 'label', true);
        try {
          const res = await editAnnotationsOrLabels('deployment', namespace, name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getDeploymentDetailInfo();
              setIsDeploymentLabelModalOpen(false);
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
    setIsDeploymentLabelModalOpen(false);
  };

  useEffect(() => {
    if (deploymentDetailTabKey === 'info' || activeKey) {
      getDeploymentDetailInfo();
    }
  }, [deploymentDetailTabKey, getDeploymentDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'info',
      label: '详情',
      children: <DeploymentInfo
        deploymentName={name}
        deploymentNamespace={namespace}
        deploymentDetailDataProps={deploymentDetailData}
        refreshFn={getDeploymentDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <DeploymentYaml
        deploymentYamlProps={deploymentYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getDeploymentDetailInfo} />,
    },
    {
      key: 'events',
      label: '事件',
      children: <DeploymentEvents
        deploymentName={name}
        deploymentUid={deploymentDetailData?.metadata?.uid}
        deploymentNamespace={namespace} />,
    },
  ];

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '工作负载', path: `/${containerRouterPrefix}/workload`, disabled: true },
      { title: 'Deployment', path: `/deployment` },
      { title: '详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{name}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleModify}>修改</Button>
            <Button type="link" onClick={handleEditLabel}>修改标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>修改注解</Button>
            <Button type="link" onClick={handleDeleteDeployment}>删除</Button>
          </Space>
        }
        open={deploymentPopOpen}
        onOpenChange={handleDeploymentPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isDeploymentDetailAnnotationModalOpen} type="annotation" dataList={deploymentDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleDeploymentDetailAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isDeploymentLabelModalOpen} type="label" dataList={deploymentDetailData?.spec.template.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除Deployment"
        open={deploymentDelModalOpen}
        cancelFn={handleDelpDeploymentCancel}
        content={[
          '删除Deployment后将无法恢复，请谨慎操作。',
          `确定删除Deployment ${name} 吗？`,
        ]}
        isCheck={isDeploymentDelCheck}
        showCheck={true}
        checkFn={handleDeploymentDetailCheckFn}
        confirmFn={handleDelpDeploymentConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetDeploymentDetailTabKey} activeKey={deploymentDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}