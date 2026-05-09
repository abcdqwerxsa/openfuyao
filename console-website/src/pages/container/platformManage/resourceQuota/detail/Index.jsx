/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import Detail from '@/pages/container/platformManage/resourceQuota/detail/Detail';
import ResourceQuotaDetailYaml from '@/pages/container/platformManage/resourceQuota/detail/ResourceQuotaDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getResourceQuota, deleteResourceQuota, editAnnotationsOrLabels } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg, jsonToYaml } from '@/tools/utils';
import ToastMsg from '@/components/ToastMsg';

export default function ResourceQuotaDetail() {
  const { namespace, name, activeKey } = useParams();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [resourceQuotaDelModalOpen, setResourceQuotaDelModalOpen] = useState(false);
  const [isResourceQuotaDelCheck, setIsResourceQuotaDelCheck] = useState(false);
  const [detailLoded, setDetailLoded] = useState(false);
  const [resourceQuotaDetailTabKey, setResourceQuotaDetailTabKey] = useState(activeKey || 'info');
  const [resourceQuotaDetailData, setResourceQuotaDetailData] = useState({});
  const [resourceQuotaPopOpen, setResourceQuotaPopOpen] = useState(false);
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState();
  const [oldLabels, setOldLabels] = useState();
  const [resourceQuotaYaml, setResourceQuotaYaml] = useState('');
  const [isReadyOnly, setIsReadyOnly] = useState(true);

  const themeStore = useStore('theme');

  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  const handleResourceQuotaPopOpenChange = (open) => {
    setResourceQuotaPopOpen(open);
  };

  const handleSetResourceQuotaDetailTabKey = (key) => {
    setResourceQuotaDetailTabKey(key);
    setIsReadyOnly(true);
  };

  const handleDeleteResourceQuota = () => {
    setResourceQuotaPopOpen(false);
    setResourceQuotaDelModalOpen(true);
  };

  const handleDelpResourceQuotaCancel = () => {
    setResourceQuotaDelModalOpen(false);
  };

  const handleDelResourceQuotaConfirm = async () => {
    try {
      const res = await deleteResourceQuota(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setResourceQuotaDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/namespace/resourceQuota`);
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

  const handleResourceQuotaCheckFn = (e) => {
    setIsResourceQuotaDelCheck(e.target.checked);
  };

  const getResourceQuotaDetailInfo = useCallback(async () => {
    if (name && namespace) {
      setDetailLoded(false);
      const res = await getResourceQuota(namespace, name);
      if (res.status === ResponseCode.OK) {
        setResourceQuotaYaml(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setResourceQuotaDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      data.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('resourcequota', namespace, name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getResourceQuotaDetailInfo();
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

  const handleAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsAnnotationModalOpen(true);
    setResourceQuotaPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsLabelModalOpen(true);
    setResourceQuotaPopOpen(false);
  };

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
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('resourcequota', namespace, name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getResourceQuotaDetailInfo();
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

  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const handleModify = () => {
    setResourceQuotaDetailTabKey('yaml');
    setIsReadyOnly(false);
  };

  const items = [
    {
      key: 'info',
      label: '详情',
      children: <Detail
        resourceQuotaName={name}
        resourceQuotaNamespace={namespace}
        resourceQuotaDetailDataProps={resourceQuotaDetailData}
        refreshFn={getResourceQuotaDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <ResourceQuotaDetailYaml
        resourceQuotaYamlProps={resourceQuotaYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getResourceQuotaDetailInfo}
      />,
    },
  ];

  useEffect(() => {
    if (resourceQuotaDetailTabKey === 'info' || activeKey) {
      getResourceQuotaDetailInfo();
    }
  }, [resourceQuotaDetailTabKey, getResourceQuotaDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  return (
    <div className="child_content withBread_content">
      <ToastMsg contextHolder={contextHolder} />
      <BreadCrumbCom items={[
        { title: '命名空间', path: `/${containerRouterPrefix}/namespace/resourceQuota`, disabled: true },
        { title: 'ResourceQuota', path: `/${containerRouterPrefix}/namespace/resourceQuota` },
        { title: '详情', path: '/detail' },
      ]}
      />
      <div className="pod_title" style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
        <h3>{name}</h3>
        <Popover placement="bottom"
          content={
            <Space className="column_pop">
              <Button type="link" onClick={handleModify}>修改</Button>
              <Button type="link" onClick={handleEditLabel}>编辑标签</Button>
              <Button type="link" onClick={handleEditAnnotation}>编辑注解</Button>
              <Button type="link" onClick={handleDeleteResourceQuota}>删除</Button>
            </Space>
          }
          open={resourceQuotaPopOpen}
          onOpenChange={handleResourceQuotaPopOpenChange}>
          <Button className="primary_btn">操作 <DownOutlined className="small_margin_adjust" /></Button>
        </Popover>
        {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={resourceQuotaDetailData?.metadata.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
        {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={resourceQuotaDetailData?.metadata.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
        <DeleteInfoModal
          title="删除资源配额"
          open={resourceQuotaDelModalOpen}
          cancelFn={handleDelpResourceQuotaCancel}
          content={[
            '删除资源配额后将无法恢复，请谨慎操作。',
            `确定删除资源配额 ${name} 吗？`,
          ]}
          isCheck={isResourceQuotaDelCheck}
          showCheck={true}
          checkFn={handleResourceQuotaCheckFn}
          confirmFn={handleDelResourceQuotaConfirm} />
      </div>
      {detailLoded && <Tabs items={items} onChange={handleSetResourceQuotaDetailTabKey} activeKey={resourceQuotaDetailTabKey} destroyInactiveTabPane={true} />}
    </div>
  );
}
