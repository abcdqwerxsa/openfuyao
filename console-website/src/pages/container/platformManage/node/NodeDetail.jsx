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
import NodeEvents from '@/pages/container/platformManage/node/detail/NodeEvents';
import Detail from '@/pages/container/platformManage/node/detail/Detail';
import NodePod from '@/pages/container/platformManage/node/detail/NodePod';
import { Tabs, message, Popover, Space, Button } from 'antd';
import { useState, useCallback, useEffect, useStore } from 'openinula';
import { DownOutlined } from '@ant-design/icons';
import { useParams } from 'inula-router';
import '@/styles/pages/nodeDetail.less';
import '@/styles/pages/podDetail.less';
import AnnotationModal from '@/components/AnnotationModal';
import { ResponseCode } from '@/common/constants';
import { editAnnotationsOrLabels, getNode } from '@/api/containerApi';
import { solveAnnotation, solveAnnotationOrLabelDiff, solveNodeHealthyStatus, solveNodeResource, forbiddenMsg } from '@/tools/utils';


export default function NodeDetail() {
  const { nodeName } = useParams();

  const [messageApi, contextHolder] = message.useMessage();
  const [nodeDetailTabKey, setNodeDetailTabKey] = useState('1');
  const [isNodeAnnotationModalOpen, setIsNodeAnnotationModalOpen] = useState(false);
  const [isNodeLabelModalOpen, setIsNodeLabelModalOpen] = useState(false);
  const [nodePopOpen, setNodePopOpen] = useState(false); // 气泡悬浮

  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [nodeDetailData, setNodeDetailData] = useState();

  const [oldNodeAnnotations, setOldNodeAnnotataions] = useState();
  const [oldNodeLabels, setOldNodeLabels] = useState();
  const themeStore = useStore('theme');

  const handleSetNodeDetailTabKey = (key) => {
    setNodeDetailTabKey(key);
  };

  // 气泡
  const handleNodePopOpenChange = (open) => {
    setNodePopOpen(open);
  };

  // 注解成功回调
  const handleAnnotationOk = async (nodeData) => {
    if (JSON.stringify(oldNodeAnnotations) === JSON.stringify(nodeData)) {
      messageApi.info('注解未进行修改');
      setIsNodeAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      nodeData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldNodeAnnotations, nodeData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('node', '', nodeName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getNodeDetailInfo();
              setIsNodeAnnotationModalOpen(false);
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
    setIsNodeAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsNodeAnnotationModalOpen(true);
    setNodePopOpen(false);
  };

  const handleEditLabel = () => {
    setIsNodeLabelModalOpen(true);
    setNodePopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (nodeData) => {
    if (JSON.stringify(oldNodeLabels) === JSON.stringify(nodeData)) {
      messageApi.info('标签未进行修改');
      setIsNodeLabelModalOpen(false);
    } else {
      const keyArr = [];
      nodeData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldNodeLabels, nodeData, 'label');
        try {
          const res = await editAnnotationsOrLabels('node', '', nodeName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getNodeDetailInfo();
              setIsNodeLabelModalOpen(false);
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
    setIsNodeLabelModalOpen(false);
  };

  const getNodeDetailInfo = useCallback(async () => {
    setDetailLoded(false);
    const res = await getNode(nodeName);
    if (res.status === ResponseCode.OK) {
      res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
      res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
      // 修改健康状态
      res.data.healthy = solveNodeHealthyStatus(res.data.status.conditions);
      res.data.selfResourceQuota = solveNodeResource(res.data.status.allocatable, res.data.status.capacity);
      setOldNodeAnnotataions([...res.data.metadata.annotations]);
      setOldNodeLabels([...res.data.metadata.labels]);
      setNodeDetailData(res.data);
    }
    setDetailLoded(true);
  }, [nodeName]);

  useEffect(() => {
    if (nodeDetailTabKey === '1') {
      getNodeDetailInfo();
    }
  }, [nodeDetailTabKey, getNodeDetailInfo]);

  const items = [
    {
      key: '1',
      label: '详情',
      children: <Detail
        nodeName={nodeName}
        nodeDetailDataProps={nodeDetailData}
        refreshFn={getNodeDetailInfo}
      />,
    },
    {
      key: '2',
      label: 'Pod',
      children: <NodePod nodeName={nodeName} />,
    },
  ];
  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '节点', path: `/${containerRouterPrefix}/nodeManage` },
      { title: '节点详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{nodeName}</h3>
      {detailLoded && <AnnotationModal open={isNodeAnnotationModalOpen} type="annotation" dataList={nodeDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isNodeLabelModalOpen} type="label" dataList={nodeDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetNodeDetailTabKey} activeKey={nodeDetailTabKey}></Tabs>}
  </div>;
}