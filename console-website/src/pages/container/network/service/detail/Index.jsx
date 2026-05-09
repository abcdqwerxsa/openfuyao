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
import ServiceInfo from '@/pages/container/network/service/ServiceInfo';
import ServiceYaml from '@/pages/container/network/service/ServiceYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import { getServiceDetailDescription, deleteService, editServiceLabelOrAnnotation } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import ToastMsg from '@/components/ToastMsg';

export default function ServiceDetail() {
  const { name, namespace, activeKey } = useParams();
  const themeStore = useStore('theme');
  const history = useHistory();

  const [messageApi, contextHolder] = message.useMessage();

  const [serviceTabDeleteModal, setServiceTabDeleteModal] = useState(false);

  const [isServiceDelCheck, setisServiceDelCheck] = useState(false);

  const [serviceDetailTabKey, setServiceDetailTabKey] = useState(activeKey || 'detail');

  const [serviceDetailData, setServiceDetailData] = useState({});

  const [serviceYamlData, setServiceYamlData] = useState('');

  const [servicePopOpen, setServicePopOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);

  const [detailLoded, setDetailLoded] = useState(false);

  const [isServiceReadyOnly, setIsServiceReadyOnly] = useState(true);

  const [oldAnnotations, setOldAnnotataions] = useState([]);

  const [oldLabels, setOldLabels] = useState([]);

  const handleSetServiceDetailTabKey = (key) => {
    setServiceDetailTabKey(key);
    setIsServiceReadyOnly(true);
  };

  const handleServicePopOpenChange = (open) => {
    setServicePopOpen(open);
  };

  const handleEditServiceYaml = () => {
    setServiceDetailTabKey('yaml');
    setIsServiceReadyOnly(false);
  };

  const handleReadyOnly = (bool) => {
    setIsServiceReadyOnly(bool);
  };

  const handleDeleteService = () => {
    setServicePopOpen(false);
    setServiceTabDeleteModal(true);
  };

  const handleDelpServiceCancel = () => {
    setServiceTabDeleteModal(false);
  };

  const handleDelpServiceConfirm = async () => {
    try {
      const res = await deleteService(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setServiceTabDeleteModal(false);
          history.push(`/${containerRouterPrefix}/network/service`);
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

  const handleServiceCheckFn = (e) => {
    setisServiceDelCheck(e.target.checked);
  };

  const getServiceDetailInfo = useCallback(async () => {
    if (namespace && name) {
      setDetailLoded(false);
      const res = await getServiceDetailDescription(namespace, name);
      if (res.status === ResponseCode.OK) {
        setServiceYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setServiceDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  const handleServiceLabelOk = async (data) => {
    const serviceLabKeyArr = [];
    data.map(item => serviceLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      if (serviceLabKeyArr.filter((item, index) => serviceLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addServiceLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editServiceLabelOrAnnotation(namespace, name, addServiceLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              setIsLabelModalOpen(false);
              getServiceDetailInfo();
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

  const handleServiceLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const handleServiceAnnotationOk = async (data) => {
    const serviceAnnKeyArr = [];
    data.map(item => serviceAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      if (serviceAnnKeyArr.filter((item, index) => serviceAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addServiceAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editServiceLabelOrAnnotation(namespace, name, addServiceAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              setIsAnnotationModalOpen(false);
              getServiceDetailInfo();
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

  const handleServiceAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <ServiceInfo serviceDetailDataProps={serviceDetailData} refreshFn={getServiceDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <ServiceYaml
        serviceYamlProps={serviceYamlData}
        isServiceReadyOnly={isServiceReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getServiceDetailInfo} />,
    },
  ];

  useEffect(() => {
    if (serviceDetailTabKey === 'detail' || activeKey) {
      getServiceDetailInfo();
    }
  }, [serviceDetailTabKey, getServiceDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsServiceReadyOnly(false);
    }
  }, [activeKey]);

  return <div className="child_content withBread_content">
    <ToastMsg contextHolder={contextHolder} />
    <BreadCrumbCom items={[
      { title: '网络', path: `/${containerRouterPrefix}/network`, disabled: true },
      { title: 'Service', path: `/${containerRouterPrefix}/network/service` },
      { title: '详情', path: '/detail' },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <div style={{ marginRight: '64px' }}>
        <h3>{name}</h3>
      </div>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleEditServiceYaml}>修改</Button>
            <Button type="link" onClick={() => setIsLabelModalOpen(true)}>修改标签</Button>
            <Button type="link" onClick={() => setIsAnnotationModalOpen(true)}>修改注解</Button>
            <Button type="link" onClick={handleDeleteService}>删除</Button>
          </Space>
        }
        open={servicePopOpen}
        onOpenChange={handleServicePopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={serviceDetailData?.metadata?.labels} callbackOk={handleServiceLabelOk} callbackCancel={handleServiceLabelCancel} />}
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={serviceDetailData?.metadata?.annotations} callbackOk={handleServiceAnnotationOk} callbackCancel={handleServiceAnnotationCancel} />}
      <DeleteInfoModal
        title="删除Service"
        open={serviceTabDeleteModal}
        cancelFn={handleDelpServiceCancel}
        content={[
          '删除Service后将无法恢复，请谨慎操作。',
          `确定删除Service ${name} 吗？`,
        ]}
        isCheck={isServiceDelCheck}
        showCheck={true}
        checkFn={handleServiceCheckFn}
        confirmFn={handleDelpServiceConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetServiceDetailTabKey} activeKey={serviceDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}
