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
import ConfigMapInfo from '@/pages/container/configuration/configMap/detail/ConfigMapInfo';
import ConfigMapYaml from '@/pages/container/configuration/configMap/detail/ConfigMapYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import '@/styles/pages/configuration.less';
import '@/styles/pages/podDetail.less';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import {
  getConfigMapsDetails,
  deleteConfigMaps,
  updateConfigMapsLabelAnnotation,
} from '@/api/containerApi';
import { solveAnnotation, jsonToYaml, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import ToastMsg from '@/components/ToastMsg';

export default function ConfigMapDetail() {
  const { namespace, name, activeKey } = useParams();
  const history = useHistory();
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();

  const [detailLoaded, setDetailLoaded] = useState(false);
  const [configurationData, setConfigurationData] = useState(null);
  const [yamlData, setYamlData] = useState('');
  const [dataInfo, setDataInfo] = useState('');
  const [configurationDetailTabKey, setConfigurationDetailTabKey] = useState(activeKey || 'info');
  const [isReadyOnly, setIsReadyOnly] = useState(true);
  const [headPopOpen, setHeadPopOpen] = useState(false);
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [delModalOpen, setDelModalOpen] = useState(false);
  const [isDelCheck, setIsDelCheck] = useState(false);
  const [oldAnnotations, setOldAnnotations] = useState([]);
  const [oldLabels, setOldLabels] = useState([]);

  const getConfigMapsDetailsInfo = useCallback(async () => {
    if (namespace && name) {
      setDetailLoaded(false);
      const res = await getConfigMapsDetails(namespace, name);
      if (res.status === ResponseCode.OK) {
        setYamlData(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        setOldAnnotations([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setConfigurationData(res.data);
        setDataInfo(jsonToYaml(JSON.stringify(res.data?.data)));
      }
      setDetailLoaded(true);
    }
  }, [name, namespace]);

  const handleHeadPopOpenChange = (open) => {
    setHeadPopOpen(open);
  };

  const handleChangeConfigurationIndex = (key) => {
    setConfigurationDetailTabKey(key);
    setIsReadyOnly(true);
  };

  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  const handleModify = () => {
    setConfigurationDetailTabKey('yaml');
    setIsReadyOnly(false);
  };

  const handleEditAnnotation = () => {
    setIsAnnotationModalOpen(true);
    setHeadPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsLabelModalOpen(true);
    setHeadPopOpen(false);
  };

  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
      return;
    }
    const keyArr = [];
    data.map(item => keyArr.push(item.key));
    if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    }
    const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
    try {
      const res = await updateConfigMapsLabelAnnotation(namespace, addAnnotationList, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('编辑注解成功');
        setTimeout(() => {
          getConfigMapsDetailsInfo();
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
  };

  const handleAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const handleLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
      return;
    }
    const keyArr = [];
    data.map(item => keyArr.push(item.key));
    if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
      return;
    }
    const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
    try {
      const res = await updateConfigMapsLabelAnnotation(namespace, addLabelList, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('编辑标签成功');
        setTimeout(() => {
          getConfigMapsDetailsInfo();
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
  };

  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const handleDelete = () => {
    setHeadPopOpen(false);
    setDelModalOpen(true);
    setIsDelCheck(false);
  };

  const handleDelCancel = () => {
    setDelModalOpen(false);
  };

  const handleDelConfirm = async () => {
    try {
      const res = await deleteConfigMaps(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/configuration/configMap`);
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(error.response.data.message);
      }
    }
  };

  const handleDelCheck = (e) => {
    setIsDelCheck(e.target.checked);
  };

  const items = [
    {
      label: '详情',
      key: 'info',
      children: (
        <ConfigMapInfo
          configurationName={name}
          configurationData={configurationData}
          dataInfo={dataInfo}
          configurationNameSpace={namespace}
          refreshFn={getConfigMapsDetailsInfo}
        />
      ),
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: (
        <ConfigMapYaml
          yamlProps={yamlData}
          readOnly={isReadyOnly}
          handleEditFn={handleReadyOnly}
          refreshFn={getConfigMapsDetailsInfo}
        />
      ),
    },
  ];

  useEffect(() => {
    if (configurationDetailTabKey === 'info' || configurationDetailTabKey === 'yaml') {
      getConfigMapsDetailsInfo();
    }
  }, [getConfigMapsDetailsInfo]);

  useEffect(() => {
    if (activeKey === 'yaml') {
      setConfigurationDetailTabKey('yaml');
      setIsReadyOnly(false);
    } else if (activeKey === 'info') {
      setConfigurationDetailTabKey('info');
      setIsReadyOnly(true);
    }
  }, [activeKey]);

  return (
    <div className='configmap child_content withBread_content ConfigurationDetail'>
      <ToastMsg contextHolder={contextHolder} />
      <BreadCrumbCom
        items={[
          { title: '配置与密钥', disabled: true },
          { title: 'ConfigMap', path: `/${containerRouterPrefix}/configuration/configMap` },
          { title: '详情' },
        ]}
      />
      <div
        className='pod_title'
        style={{
          border: themeStore.$s.theme !== 'light' && 'none',
          backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34',
        }}
      >
        <h3>{name}</h3>
        <Popover
          placement='bottom'
          content={
            <Space className='column_pop'>
              <Button type="link" onClick={handleModify}>修改</Button>
              <Button type="link" onClick={handleEditLabel}>修改标签</Button>
              <Button type="link" onClick={handleEditAnnotation}>修改注解</Button>
              <Button type="link" onClick={handleDelete}>删除</Button>
            </Space>
          }
          open={headPopOpen}
          onOpenChange={handleHeadPopOpenChange}
        >
          <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
        </Popover>
        {detailLoaded && (
          <AnnotationModal
            open={isAnnotationModalOpen}
            type="annotation"
            dataList={configurationData?.metadata?.annotations}
            callbackOk={handleAnnotationOk}
            callbackCancel={handleAnnotationCancel}
          />
        )}
        {detailLoaded && (
          <AnnotationModal
            open={isLabelModalOpen}
            type="label"
            dataList={configurationData?.metadata?.labels}
            callbackOk={handleLabelOk}
            callbackCancel={handleLabelCancel}
          />
        )}
        <DeleteInfoModal
          title="删除ConfigMap"
          open={delModalOpen}
          cancelFn={handleDelCancel}
          content={[
            '删除ConfigMap后将无法恢复，请谨慎操作。',
            `确定删除ConfigMap ${name} 吗？`,
          ]}
          isCheck={isDelCheck}
          showCheck={true}
          checkFn={handleDelCheck}
          confirmFn={handleDelConfirm}
        />
      </div>
      {detailLoaded && (
        <Tabs
          items={items}
          onChange={handleChangeConfigurationIndex}
          activeKey={configurationDetailTabKey}
          destroyInactiveTabPane={true}
        />
      )}
    </div>
  );
}
