/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
  
 *       http://license.coscl.org.cn/MulanPSL2
  
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import Detail from '@/pages/container/monitor/monitorGoalManage/detail/Detail';
import Yaml from '@/pages/container/monitor/monitorGoalManage/detail/Yaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams, useLocation } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getResourceExampleDetailDescription, editResourceExampleAnnotationOrlabels, deleteResourceExample } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import { disabledModifyMonitorServiceCr } from '@/common/constants';

export default function MonitorServiceDetail() {
  const { exampleName, namespace, activeKey } = useParams();
  const { state: prefixObj } = useLocation();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [serviceMonitorDelModalOpen, setServiceMonitorDelModalOpen] = useState(false); // 删除对话框展示
  const [isServiceMonitorDelCheck, setIsServiceMonitorDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [serviceMonitorDetailTabKey, setServiceMonitorDetailTabKey] = useState(activeKey || 'detail');

  const [serviceMonitorDetailData, setServiceMonitorDetailData] = useState({}); // 详情数据

  const [serviceMonitorPopOpen, setServiceMonitorPopOpen] = useState(false); // 气泡悬浮

  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [isMonitorAnnotationModalOpen, setIsMonitorAnnotationModalOpen] = useState(false);
  const [isMonitorLabelModalOpen, setIsMonitorLabelModalOpen] = useState(false);
  const [oldMonitorAnnotations, setOldMonitorAnnotataions] = useState();
  const [oldMonitorLabels, setOldMonitorLabels] = useState();

  const [serviceMonitorYaml, setServiceMonitorYaml] = useState(''); // 传递yaml

  const themeStore = useStore('theme');

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 气泡
  const handleServiceMonitorPopOpenChange = (open) => {
    setServiceMonitorPopOpen(open);
  };

  const handleSetServiceMonitorDetailTabKey = (key) => {
    setServiceMonitorDetailTabKey(key);
  };

  // 删除按钮
  const handleDeleteServiceMonitor = () => {
    setServiceMonitorPopOpen(false); // 气泡框
    setServiceMonitorDelModalOpen(true); // 打开弹窗
  };

  const handleDelpServiceMonitorCancel = () => {
    setServiceMonitorDelModalOpen(false);
  };

  const handleDelpServiceMonitorConfirm = async () => {
    try {
      const res = await deleteResourceExample({ ...prefixObj, namespace }, exampleName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setServiceMonitorDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor`);
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      }
    }
  };

  const handleServiceMonitorCheckFn = (e) => {
    setIsServiceMonitorDelCheck(e.target.checked);
  };

  const getServiceMonitorDetailInfo = useCallback(async () => {
    if (exampleName && namespace) {
      setDetailLoded(false);
      const res = await getResourceExampleDetailDescription({ ...prefixObj, namespace }, exampleName);
      if (res.status === ResponseCode.OK) {
        setServiceMonitorYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldMonitorAnnotataions([...res.data.metadata.annotations]);
        setOldMonitorLabels([...res.data.metadata.labels]);
        setServiceMonitorDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [exampleName, namespace]);

  const handleModify = () => {
    setServiceMonitorDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleMonitorAnnotationOk = async (monitorServiceData) => {
    if (JSON.stringify(oldMonitorAnnotations) === JSON.stringify(monitorServiceData)) {
      messageApi.info('注解未进行修改');
      setIsMonitorAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      monitorServiceData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldMonitorAnnotations, monitorServiceData, 'annotation');
        try {
          const res = await editResourceExampleAnnotationOrlabels({ ...prefixObj, namespace }, exampleName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getServiceMonitorDetailInfo();
              setIsMonitorAnnotationModalOpen(false);
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
    setIsMonitorAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsMonitorAnnotationModalOpen(true);
    setServiceMonitorPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsMonitorLabelModalOpen(true);
    setServiceMonitorPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (monitorServiceData) => {
    if (JSON.stringify(oldMonitorLabels) === JSON.stringify(monitorServiceData)) {
      messageApi.info('标签未进行修改');
      setIsMonitorLabelModalOpen(false);
    }
    const keyArr = [];
    monitorServiceData.map(item => keyArr.push(item.key));
    if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
      messageApi.error('存在相同key!');
    } else {
      // 请求接口添加
      // 比较前后是否一致 返回处理后的注解
      const addLabelList = solveAnnotationOrLabelDiff(oldMonitorLabels, monitorServiceData, 'label');
      try {
        const res = await editResourceExampleAnnotationOrlabels({ ...prefixObj, namespace }, exampleName, addLabelList);
        if (res.status === ResponseCode.OK) {
          messageApi.success('编辑标签成功');
          setTimeout(() => {
            getServiceMonitorDetailInfo();
            setIsMonitorLabelModalOpen(false);
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
  };

  // 标签失败回调
  const handleLabelCancel = () => {
    setIsMonitorLabelModalOpen(false);
  };

  useEffect(() => {
    if (serviceMonitorDetailTabKey === 'detail' || activeKey) {
      getServiceMonitorDetailInfo();
    }
  }, [serviceMonitorDetailTabKey, getServiceMonitorDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <Detail
        prefixObjProps={prefixObj}
        serviceMonitorName={exampleName}
        serviceMonitorNamespace={namespace}
        serviceMonitorDetailDataProps={serviceMonitorDetailData}
        refreshFn={getServiceMonitorDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <Yaml
        serviceMonitorYamlProps={serviceMonitorYaml}
        prefixObjProps={prefixObj}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getServiceMonitorDetailInfo} />,
    },
  ];

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '监控', path: `/${containerRouterPrefix}/monitor`, disabled: true },
      { title: '监控目标', path: `/monitorGoalManage` },
      { title: 'ServiceMonitor实例', path: `/serviceMonitor` },
      { title: '详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff', border: themeStore.$s.theme !== 'light' && 'none' }}>
      <h3>{exampleName}</h3>
      {!disabledModifyMonitorServiceCr.includes(exampleName) && <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button
              type="link"
              onClick={handleModify}
            >
              修改
            </Button>
            <Button type="link" onClick={handleEditLabel}>修改标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>修改注解</Button>
            <Button type="link" onClick={handleDeleteServiceMonitor}>删除</Button>
          </Space>
        }
        open={serviceMonitorPopOpen}
        onOpenChange={handleServiceMonitorPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      }
      {detailLoded && <AnnotationModal open={isMonitorAnnotationModalOpen} type="annotation" dataList={serviceMonitorDetailData?.metadata?.annotations} callbackOk={handleMonitorAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isMonitorLabelModalOpen} type="label" dataList={serviceMonitorDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除ServiceMonitor"
        open={serviceMonitorDelModalOpen}
        cancelFn={handleDelpServiceMonitorCancel}
        content={[
          '删除ServiceMonitor后将无法恢复，请谨慎操作。',
          `确定删除ServiceMonitor ${exampleName} 吗？`,
        ]}
        isCheck={isServiceMonitorDelCheck}
        showCheck={true}
        checkFn={handleServiceMonitorCheckFn}
        confirmFn={handleDelpServiceMonitorConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetServiceMonitorDetailTabKey} activeKey={serviceMonitorDetailTabKey}></Tabs>}
  </div>;
}
