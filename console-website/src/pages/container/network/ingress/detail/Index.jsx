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
import IngressInfo from '@/pages/container/network/ingress/IngressInfo';
import IngressYaml from '@/pages/container/network/ingress/IngressYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import { getIngressDetailDescription, deleteIngress, editIngressLabelOrAnnotation } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import ToastMsg from '@/components/ToastMsg';

export default function IngressDetail() {
  const themeStore = useStore('theme');
  const { name, namespace, activeKey } = useParams();

  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [ingressTabDeleteModal, setIngressTabDeleteModal] = useState(false);

  const [isIngressDelCheck, setisIngressDelCheck] = useState(false);

  const [ingressDetailTabKey, setIngressDetailTabKey] = useState(activeKey || 'detail');

  const [ingressDetailData, setIngressDetailData] = useState({});

  const [ingressYamlData, setIngressYamlData] = useState('');

  const [ingressPopOpen, setIngressPopOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);

  const [detailLoded, setDetailLoded] = useState(false);

  const [isIngressReadyOnly, setIsIngressReadyOnly] = useState(true);

  const [oldAnnotations, setOldAnnotataions] = useState([]);

  const [oldLabels, setOldLabels] = useState([]);

  const handleSetIngressDetailTabKey = (key) => {
    setIngressDetailTabKey(key);
    setIsIngressReadyOnly(true);
  };

  const handleIngressPopOpenChange = (open) => {
    setIngressPopOpen(open);
  };

  const handleEditIngressYaml = () => {
    setIngressDetailTabKey('yaml');
    setIsIngressReadyOnly(false);
  };

  const handleReadyOnly = (bool) => {
    setIsIngressReadyOnly(bool);
  };

  const handleDeleteIngress = () => {
    setIngressPopOpen(false);
    setIngressTabDeleteModal(true);
  };

  const handleDelpIngressCancel = () => {
    setIngressTabDeleteModal(false);
  };

  const handleDelpIngressConfirm = async () => {
    try {
      const res = await deleteIngress(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setIngressTabDeleteModal(false);
          history.push(`/${containerRouterPrefix}/network/ingress`);
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

  const handleIngressCheckFn = (e) => {
    setisIngressDelCheck(e.target.checked);
  };

  const getIngressDetailInfo = useCallback(async () => {
    if (namespace && name) {
      setDetailLoded(false);
      const res = await getIngressDetailDescription(namespace, name);
      if (res.status === ResponseCode.OK) {
        setIngressYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setIngressDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  const handleIngressLabelOk = async (data) => {
    const ingressLabKeyArr = [];
    data.map(item => ingressLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      if (ingressLabKeyArr.filter((item, index) => ingressLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addIngressLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editIngressLabelOrAnnotation(namespace, name, addIngressLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              setIsLabelModalOpen(false);
              getIngressDetailInfo();
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败!${error.response.data.message}`);
          }
        }
      }
    }
  };

  const handleIngressLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const handleIngressAnnotationOk = async (data) => {
    const ingressAnnKeyArr = [];
    data.map(item => ingressAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      if (ingressAnnKeyArr.filter((item, index) => ingressAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addIngressAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editIngressLabelOrAnnotation(namespace, name, addIngressAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              setIsAnnotationModalOpen(false);
              getIngressDetailInfo();
            });
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败!${error.response.data.message}`);
          }
        }
      }
    }
  };

  const handleIngressAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <IngressInfo ingressDetailDataProps={ingressDetailData} refreshFn={getIngressDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <IngressYaml
        ingressYamlProps={ingressYamlData}
        isIngressReadyOnly={isIngressReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getIngressDetailInfo} />,
    },
  ];

  useEffect(() => {
    if (ingressDetailTabKey === 'detail' || activeKey) {
      getIngressDetailInfo();
    }
  }, [ingressDetailTabKey, getIngressDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsIngressReadyOnly(false);
    }
  }, [activeKey]);

  return <div className="child_content withBread_content">
    <ToastMsg contextHolder={contextHolder} />
    <BreadCrumbCom items={[
      { title: '网络', path: `/${containerRouterPrefix}/network`, disabled: true },
      { title: 'Ingress', path: `/${containerRouterPrefix}/network/ingress` },
      { title: '详情', path: '/detail' },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <div style={{ marginRight: '64px' }}>
        <h3>{name}</h3>
      </div>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleEditIngressYaml}>修改</Button>
            <Button type="link" onClick={() => setIsLabelModalOpen(true)}>修改标签</Button>
            <Button type="link" onClick={() => setIsAnnotationModalOpen(true)}>修改注解</Button>
            <Button type="link" onClick={handleDeleteIngress}>删除</Button>
          </Space>
        }
        open={ingressPopOpen}
        onOpenChange={handleIngressPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={ingressDetailData?.metadata?.labels} callbackOk={handleIngressLabelOk} callbackCancel={handleIngressLabelCancel} />}
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={ingressDetailData?.metadata?.annotations} callbackOk={handleIngressAnnotationOk} callbackCancel={handleIngressAnnotationCancel} />}
      <DeleteInfoModal
        title="删除Ingress"
        open={ingressTabDeleteModal}
        cancelFn={handleDelpIngressCancel}
        content={[
          '删除Ingress后将无法恢复，请谨慎操作。',
          `确定删除Ingress ${name} 吗？`,
        ]}
        isCheck={isIngressDelCheck}
        showCheck={true}
        checkFn={handleIngressCheckFn}
        confirmFn={handleDelpIngressConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetIngressDetailTabKey} activeKey={ingressDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}
