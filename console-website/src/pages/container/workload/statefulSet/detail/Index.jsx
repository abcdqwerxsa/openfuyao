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
import StatefulSetEvents from '@/pages/container/workload/statefulSet/detail/StatefulSetEvents';
import StatefulSetInfo from '@/pages/container/workload/statefulSet/detail/StatefulSetInfo';
import StatefulSetYaml from '@/pages/container/workload/statefulSet/detail/StatefulSetYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getStatefulSet, editAnnotationsOrLabels, deleteStatefulSet } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function StatefulSetDetail() {
  const { name, namespace, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [statefulSetDelModalOpen, setStatefulSetDelModalOpen] = useState(false); // 删除对话框展示
  const [isStatefulSetDelCheck, setIsStatefulSetDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [statefulSetDetailTabKey, setStatefulSetDetailTabKey] = useState(activeKey || 'info');

  const [statefulSetDetailData, setStatefulSetDetailData] = useState({}); // 详情数据

  const [statefulSetPopOpen, setStatefulSetPopOpen] = useState(false); // 气泡悬浮

  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [isStatefulSetAnnotationModalOpen, setIsStatefulSetAnnotationModalOpen] = useState(false);
  const [isStatefulSetLabelModalOpen, setIsStatefulSetLabelModalOpen] = useState(false);
  const [statefulSetYaml, setStatefulSetYaml] = useState('');
  const [oldStatefulSetAnnotations, setOldStatefulSetAnnotataions] = useState();
  const [oldStatefulSetLabels, setOldStatefulSetLabels] = useState();
  const themeStore = useStore('theme');

  // 气泡
  const handleStatefulSetPopOpenChange = (open) => {
    setStatefulSetPopOpen(open);
  };

  const handleSetStatefulSetDetailTabKey = (key) => {
    setStatefulSetDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteStatefulSet = () => {
    setStatefulSetPopOpen(false); // 气泡框
    setStatefulSetDelModalOpen(true); // 打开弹窗
  };

  const handleDelpStatefulSetCancel = () => {
    setStatefulSetDelModalOpen(false);
  };

  const handleDelpStatefulSetConfirm = async () => {
    try {
      const res = await deleteStatefulSet(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setStatefulSetDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/workload/statefulSet`);
        }, 2000);
      }
    } catch (e) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${e.response.data.message}`);
      }
    }
  };

  const handleStatefulSetCheckFn = (e) => {
    setIsStatefulSetDelCheck(e.target.checked);
  };

  const getStatefulSetDetailInfo = useCallback(async () => {
    if (name && namespace) {
      setDetailLoded(false);
      const res = await getStatefulSet(namespace, name);
      if (res.status === ResponseCode.OK) {
        setStatefulSetYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldStatefulSetAnnotataions([...res.data.metadata.annotations]);
        setOldStatefulSetLabels([...res.data.metadata.labels]);
        setStatefulSetDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  const handleModify = () => {
    setStatefulSetDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleAnnotationOk = async (statefulSetData) => {
    if (JSON.stringify(oldStatefulSetAnnotations) === JSON.stringify(statefulSetData)) {
      messageApi.info('注解未进行修改');
      setIsStatefulSetAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      statefulSetData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldStatefulSetAnnotations, statefulSetData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('statefulset', namespace, name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getStatefulSetDetailInfo();
              setIsStatefulSetAnnotationModalOpen(false);
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
    setIsStatefulSetAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsStatefulSetAnnotationModalOpen(true);
    setStatefulSetPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsStatefulSetLabelModalOpen(true);
    setStatefulSetPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (statefulSetData) => {
    if (JSON.stringify(oldStatefulSetLabels) === JSON.stringify(statefulSetData)) {
      messageApi.info('标签未进行修改');
      setIsStatefulSetLabelModalOpen(false);
    } else {
      const keyArr = [];
      statefulSetData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldStatefulSetLabels, statefulSetData, 'label');
        try {
          const res = await editAnnotationsOrLabels('statefulset', namespace, name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getStatefulSetDetailInfo();
              setIsStatefulSetLabelModalOpen(false);
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
    setIsStatefulSetLabelModalOpen(false);
  };

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  useEffect(() => {
    if (statefulSetDetailTabKey === 'info' || activeKey) {
      getStatefulSetDetailInfo();
    }
  }, [statefulSetDetailTabKey, getStatefulSetDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'info',
      label: '详情',
      children: <StatefulSetInfo
        statefulSetName={name}
        statefulSetNamespace={namespace}
        statefulSetDetailDataProps={statefulSetDetailData}
        refreshFn={getStatefulSetDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <StatefulSetYaml
        statefulSetYamlProps={statefulSetYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getStatefulSetDetailInfo} />,
    },
    {
      key: 'events',
      label: '事件',
      children: <StatefulSetEvents
        statefulSetName={name}
        statefulSetUid={statefulSetDetailData?.metadata?.uid}
        statefulSetNamespace={namespace} />,
    },
  ];

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '工作负载', path: `/${containerRouterPrefix}/workload`, disabled: true },
      { title: 'StatefulSet', path: `/statefulSet` },
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
            <Button type="link" onClick={handleDeleteStatefulSet}>删除</Button>
          </Space>
        }
        open={statefulSetPopOpen}
        onOpenChange={handleStatefulSetPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isStatefulSetAnnotationModalOpen} type="annotation" dataList={statefulSetDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isStatefulSetLabelModalOpen} type="label" dataList={statefulSetDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除StatefulSet"
        open={statefulSetDelModalOpen}
        cancelFn={handleDelpStatefulSetCancel}
        content={[
          '删除StatefulSet后将无法恢复，请谨慎操作。',
          `确定删除StatefulSet ${name} 吗？`,
        ]}
        isCheck={isStatefulSetDelCheck}
        showCheck={true}
        checkFn={handleStatefulSetCheckFn}
        confirmFn={handleDelpStatefulSetConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetStatefulSetDetailTabKey} activeKey={statefulSetDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}