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
import Detail from '@/pages/container/platformManage/customResourceDefinition/detail/Detail';
import CustomResourceDefinitionDetailYaml from '@/pages/container/platformManage/customResourceDefinition/detail/CustomResourceDefinitionDetailYaml';
import CustomResourceDefinitionDetailExample from '@/pages/container/platformManage/customResourceDefinition/detail/CustomResourceDefinitionDetailExample';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, act, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getCustomResourceDefinitionDetailDescription, deleteCustomResourceDefinition, editAnnotationsOrLabels } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, solveDecodePath, forbiddenMsg } from '@/tools/utils';

export default function CustomResourceDefinitionDetail() {
  const { customResourceName, activeKey } = useParams();

  const [customResourceDefinitionName, setCustomResourceDefinitionName] = useState('');

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [customResourceDefinitionDelModalOpen, setCustomResourceDefinitionDelModalOpen] = useState(false); // 删除对话框展示
  const [isCustomResourceDefinitionDelCheck, setIsCustomResourceDefinitionDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [customResourceDefinitionDetailTabKey, setCustomResourceDefinitionDetailTabKey] = useState('detail' || activeKey);

  const [customResourceDefinitionDetailData, setCustomResourceDefinitionDetailData] = useState({}); // 详情数据

  const [customResourceDefinitionPopOpen, setCustomResourceDefinitionPopOpen] = useState(false); // 气泡悬浮
  // 对话框展示
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [oldAnnotations, setOldAnnotataions] = useState();
  const [oldLabels, setOldLabels] = useState();

  const [customResourceDefinitionYaml, setCustomResourceDefinitionYaml] = useState(''); // 传递yaml
  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const themeStore = useStore('theme');

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 气泡
  const handleCustomResourceDefinitionPopOpenChange = (open) => {
    setCustomResourceDefinitionPopOpen(open);
  };

  const handleSetCustomResourceDefinitionDetailTabKey = (key) => {
    setCustomResourceDefinitionDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteCustomResourceDefinition = () => {
    setCustomResourceDefinitionPopOpen(false); // 气泡框
    setCustomResourceDefinitionDelModalOpen(true); // 打开弹窗
  };

  const handleDelpCustomResourceDefinitionCancel = () => {
    setCustomResourceDefinitionDelModalOpen(false);
  };

  const handleDelCustomResourceDefinitionConfirm = async () => {
    try {
      const res = await deleteCustomResourceDefinition(customResourceDefinitionName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setCustomResourceDefinitionDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/customResourceDefinition`);
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

  const handleCustomResourceDefinitionCheckFn = (e) => {
    setIsCustomResourceDefinitionDelCheck(e.target.checked);
  };

  const getCustomResourceDefinitionDetailInfo = useCallback(async () => {
    if (customResourceDefinitionName) {
      setDetailLoded(false);
      const res = await getCustomResourceDefinitionDetailDescription(customResourceDefinitionName);
      if (res.status === ResponseCode.OK) {
        setCustomResourceDefinitionYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setCustomResourceDefinitionDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [customResourceDefinitionName]);

  // 注解成功回调
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
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('customresourcedefinition', '', customResourceDefinitionName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getCustomResourceDefinitionDetailInfo();
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
    setCustomResourceDefinitionPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsLabelModalOpen(true);
    setCustomResourceDefinitionPopOpen(false);
  };

  // 标签成功回调
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
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('customresourcedefinition', '', customResourceDefinitionName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getCustomResourceDefinitionDetailInfo();
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

  // 标签失败回调
  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const handleModify = () => {
    setCustomResourceDefinitionDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <Detail
        customResourceDefinitionName={customResourceDefinitionName}
        customResourceDefinitionDetailDataProps={customResourceDefinitionDetailData}
        refreshFn={getCustomResourceDefinitionDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <CustomResourceDefinitionDetailYaml
        customResourceDefinitionYamlProps={customResourceDefinitionYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getCustomResourceDefinitionDetailInfo}
      />,
    },
    {
      key: 'example',
      label: '实例',
      children: <CustomResourceDefinitionDetailExample
        customResourceDefinitionDetailDataProps={customResourceDefinitionDetailData}
      />,
    },
  ];

  useEffect(() => {
    if (activeKey) {
      setCustomResourceDefinitionDetailTabKey(activeKey);
      window.history.replaceState({}, '', `${window.location.href.slice(0, window.location.href.lastIndexOf('/'))}`);
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  useEffect(() => {
    if (customResourceDefinitionDetailTabKey === 'detail' || activeKey) {
      getCustomResourceDefinitionDetailInfo();
    }
  }, [customResourceDefinitionDetailTabKey, getCustomResourceDefinitionDetailInfo]);

  useEffect(() => {
    setCustomResourceDefinitionName(solveDecodePath(customResourceName));
  }, [customResourceName]);

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '自定义资源', path: `/${containerRouterPrefix}/customResourceDefinition` },
      { title: '详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{customResourceDefinitionName}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleModify}>修改</Button>
            <Button type="link" onClick={handleEditLabel}>编辑标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>编辑注解</Button>
            <Button type="link" onClick={handleDeleteCustomResourceDefinition}>删除</Button>
          </Space>
        }
        open={customResourceDefinitionPopOpen}
        onOpenChange={handleCustomResourceDefinitionPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={customResourceDefinitionDetailData?.metadata.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={customResourceDefinitionDetailData?.metadata.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除自定义资源"
        open={customResourceDefinitionDelModalOpen}
        cancelFn={handleDelpCustomResourceDefinitionCancel}
        content={[
          '删除自定义资源后将无法恢复，请谨慎操作。',
          `确定删除自定义资源 ${customResourceDefinitionName} 吗？`,
        ]}
        isCheck={isCustomResourceDefinitionDelCheck}
        showCheck={true}
        checkFn={handleCustomResourceDefinitionCheckFn}
        confirmFn={handleDelCustomResourceDefinitionConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetCustomResourceDefinitionDetailTabKey} activeKey={customResourceDefinitionDetailTabKey}></Tabs>}
  </div>;
}