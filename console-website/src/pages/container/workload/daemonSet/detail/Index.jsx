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
import DaemonSetEvents from '@/pages/container/workload/daemonSet/detail/DaemonSetEvents';
import DaemonSetInfo from '@/pages/container/workload/daemonSet/detail/DaemonSetInfo';
import DaemonSetYaml from '@/pages/container/workload/daemonSet/detail/DaemonSetYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getDaemonSetDetailDescription, editAnnotationsOrLabels, deleteDaemonSet } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function DaemonSetDetail() {
  const { name, namespace, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [daemonSetDelModalOpen, setDaemonSetDelModalOpen] = useState(false); // 删除对话框展示
  const [isDaemonSetDelCheck, setIsDaemonSetDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [daemonSetDetailTabKey, setDaemonSetDetailTabKey] = useState(activeKey || 'info');

  const [daemonSetDetailData, setDaemonSetDetailData] = useState({}); // 详情数据

  const [daemonSetPopOpen, setDaemonSetPopOpen] = useState(false); // 气泡悬浮
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [isDaemonSetAnnotationModalOpen, setIsDaemonSetAnnotationModalOpen] = useState(false);
  const [isDaemonSetLabelModalOpen, setIsDaemonSetLabelModalOpen] = useState(false);
  const [oldDaemonSetAnnotations, setOldDaemonsetAnnotataions] = useState();
  const [oldDaemonSetLabels, setOldDaemonSetLabels] = useState();

  const [daemonSetYaml, setDaemonSetYaml] = useState(''); // 传递yaml

  const themeStore = useStore('theme');

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  const handleModify = () => {
    setDaemonSetDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleAnnotationOk = async (daemonSetData) => {
    if (JSON.stringify(oldDaemonSetAnnotations) === JSON.stringify(daemonSetData)) {
      messageApi.info('注解未进行修改');
      setIsDaemonSetAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      daemonSetData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        const addAnnotationList = solveAnnotationOrLabelDiff(oldDaemonSetAnnotations, daemonSetData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('daemonset', namespace, name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getDaemonSetDetailInfo();
              setIsDaemonSetAnnotationModalOpen(false);
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
    setIsDaemonSetAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsDaemonSetAnnotationModalOpen(true);
    setDaemonSetPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsDaemonSetLabelModalOpen(true);
    setDaemonSetPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (daemonSetData) => {
    if (JSON.stringify(oldDaemonSetLabels) === JSON.stringify(daemonSetData)) {
      messageApi.info('标签未进行修改');
      setIsDaemonSetLabelModalOpen(false);
    } else {
      const keyArr = [];
      daemonSetData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldDaemonSetLabels, daemonSetData, 'label');
        try {
          const res = await editAnnotationsOrLabels('daemonset', namespace, name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getDaemonSetDetailInfo();
              setIsDaemonSetLabelModalOpen(false);
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
    setIsDaemonSetLabelModalOpen(false);
  };

  // 气泡
  const handleDaemonSetPopOpenChange = (open) => {
    setDaemonSetPopOpen(open);
  };

  const handleSetDaemonSetDetailTabKey = (key) => {
    setDaemonSetDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteDaemonSet = () => {
    setDaemonSetPopOpen(false); // 气泡框
    setDaemonSetDelModalOpen(true); // 打开弹窗
  };

  const handleDelpDaemonSetCancel = () => {
    setDaemonSetDelModalOpen(false);
  };

  const handleDelpDaemonSetConfirm = async () => {
    try {
      const res = await deleteDaemonSet(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setDaemonSetDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/workload/daemonSet`);
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

  const handleDaemonSetDetailCheckFn = (e) => {
    setIsDaemonSetDelCheck(e.target.checked);
  };

  const getDaemonSetDetailInfo = useCallback(async () => {
    if (name && namespace) {
      setDetailLoded(false);
      const res = await getDaemonSetDetailDescription(namespace, name);
      if (res.status === ResponseCode.OK) {
        setDaemonSetYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldDaemonsetAnnotataions([...res.data.metadata.annotations]);
        setOldDaemonSetLabels([...res.data.metadata.labels]);
        setDaemonSetDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  useEffect(() => {
    if (daemonSetDetailTabKey === 'info' || activeKey) {
      getDaemonSetDetailInfo();
    }
  }, [daemonSetDetailTabKey, getDaemonSetDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'info',
      label: '详情',
      children: <DaemonSetInfo
        daemonSetName={name}
        daemonSetNamespace={namespace}
        daemonSetDetailDataProps={daemonSetDetailData}
        refreshFn={getDaemonSetDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <DaemonSetYaml
        daemonSetYamlProps={daemonSetYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getDaemonSetDetailInfo}
      />,
    },
    {
      key: 'events',
      label: '事件',
      children: <DaemonSetEvents
        daemonSetName={name}
        daemonSetUid={daemonSetDetailData?.metadata?.uid}
        daemonSetNamespace={namespace} />,
    },
  ];

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '工作负载', path: `/${containerRouterPrefix}/workload`, disabled: true },
      { title: 'DaemonSet', path: `/daemonSet` },
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
            <Button type="link" onClick={handleDeleteDaemonSet}>删除</Button>
          </Space>
        }
        open={daemonSetPopOpen}
        onOpenChange={handleDaemonSetPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isDaemonSetAnnotationModalOpen} type="annotation" dataList={daemonSetDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isDaemonSetLabelModalOpen} type="label" dataList={daemonSetDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除DaemonSet"
        open={daemonSetDelModalOpen}
        cancelFn={handleDelpDaemonSetCancel}
        content={[
          '删除DaemonSet后将无法恢复，请谨慎操作。',
          `确定删除DaemonSet ${name} 吗？`,
        ]}
        isCheck={isDaemonSetDelCheck}
        showCheck={true}
        checkFn={handleDaemonSetDetailCheckFn}
        confirmFn={handleDelpDaemonSetConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetDaemonSetDetailTabKey} activeKey={daemonSetDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}