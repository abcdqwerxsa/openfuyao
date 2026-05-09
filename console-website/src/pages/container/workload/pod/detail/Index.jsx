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
import PodEvents from '@/pages/container/workload/pod/detail/PodEvents';
import PodInfo from '@/pages/container/workload/pod/detail/PodInfo';
import PodYaml from '@/pages/container/workload/pod/detail/PodYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getPod, editAnnotationsOrLabels, deletePod } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import ToastMsg from '@/components/ToastMsg';

export default function PodDetail() {
  const { name, namespace, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [podDelModalOpen, setPodDelModalOpen] = useState(false); // 删除对话框展示
  const [isPodDelCheck, setIsPodDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [oldAnnotations, setOldAnnotataions] = useState([]); // 未修改前注解
  const [oldLabels, setOldLabels] = useState([]);

  const [podDetailTabKey, setPodDetailTabKey] = useState(activeKey || 'info');

  const [podDetailData, setPodDetailData] = useState({}); // 详情数据

  const [podPopOpen, setPodPopOpen] = useState(false); // 气泡悬浮
  // 对话框展示
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [podYaml, setPodYaml] = useState('');

  const themeStore = useStore('theme');

  // 气泡
  const handlePodPopOpenChange = (open) => {
    setPodPopOpen(open);
  };

  const handleSetPodDetailTabKey = (key) => {
    setPodDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeletePod = () => {
    setPodPopOpen(false); // 气泡框
    setPodDelModalOpen(true); // 打开弹窗
  };

  const handleDelpPodCancel = () => {
    setPodDelModalOpen(false);
  };

  const handleDelpPodConfirm = async () => {
    try {
      const res = await deletePod(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setPodDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/workload/pod`);
        }, 2000);
      }
    } catch (podDetailError) {
      if (podDetailError.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, podDetailError);
      } else {
        messageApi.error(`删除失败!${podDetailError.response.data.message}`);
      }
    }
  };

  const handlePodDetailCheckFn = (e) => {
    setIsPodDelCheck(e.target.checked);
  };

  const getPodDetailInfo = useCallback(async () => {
    if (name && namespace) {
      setDetailLoded(false);
      const res = await getPod(namespace, name);
      if (res.status === ResponseCode.OK) {
        setPodYaml(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        // 备份一份annotations
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setPodDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      const podDetailAnnotationkeyArr = [];
      data.map(item => podDetailAnnotationkeyArr.push(item.key));
      if (podDetailAnnotationkeyArr.filter((item, index) => podDetailAnnotationkeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const resPodDetailAnnotation = await editAnnotationsOrLabels('pod', namespace, name, addAnnotationList);
          if (resPodDetailAnnotation.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getPodDetailInfo();
              setIsAnnotationModalOpen(false);
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
    setIsAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsAnnotationModalOpen(true);
    setPodPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsLabelModalOpen(true);
    setPodPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const podDetailLabelkeyArr = [];
      data.map(item => podDetailLabelkeyArr.push(item.key));
      if (podDetailLabelkeyArr.filter((item, index) => podDetailLabelkeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const resPodDetailLabel = await editAnnotationsOrLabels('pod', namespace, name, addLabelList);
          if (resPodDetailLabel.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getPodDetailInfo();
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

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 标签失败回调
  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const handleModify = () => {
    setPodDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  useEffect(() => {
    if (podDetailTabKey === 'info' || activeKey) {
      getPodDetailInfo();
    }
  }, [podDetailTabKey, getPodDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'info',
      label: '详情',
      children: <PodInfo
        podName={name}
        podNamespace={namespace}
        podDetailDataProps={podDetailData}
        refreshFn={getPodDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <PodYaml
        podYamlProps={podYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getPodDetailInfo} />,
    },
    {
      key: '3',
      label: '事件',
      children: <PodEvents
        podName={name}
        podUid={podDetailData?.metadata?.uid}
        podNamespace={namespace}
      />,
    },
  ];

  return <div className="child_content withBread_content">
    <ToastMsg contextHolder={contextHolder} />
    <BreadCrumbCom items={[
      { title: '工作负载', path: `/${containerRouterPrefix}/workload`, disabled: true },
      { title: 'Pod', path: `/pod` },
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
            <Button type="link" onClick={handleDeletePod}>删除</Button>
          </Space>
        }
        open={podPopOpen}
        onOpenChange={handlePodPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal
        open={isAnnotationModalOpen}
        type="annotation"
        dataList={podDetailData?.metadata?.annotations}
        callbackOk={handleAnnotationOk}
        callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal
        open={isLabelModalOpen}
        type="label"
        dataList={podDetailData?.metadata?.labels}
        callbackOk={handleLabelOk}
        callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除Pod"
        open={podDelModalOpen}
        cancelFn={handleDelpPodCancel}
        content={[
          '删除Pod后将无法恢复，请谨慎操作。',
          `确定删除Pod ${name} 吗？`,
        ]}
        isCheck={isPodDelCheck}
        showCheck={true}
        checkFn={handlePodDetailCheckFn}
        confirmFn={handleDelpPodConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetPodDetailTabKey} activeKey={podDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}