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
import ClusterRoleBindingInfo from '@/pages/container/userManage/roleBinding/clusterRoleBind/ClusterRoleBindingInfo';
import ClusterRoleBindingYaml from '@/pages/container/userManage/roleBinding/clusterRoleBind/ClusterRoleBindingYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getClusterRoleBindingDetailDescription, editAnnotationsOrLabels, deleteClusterRoleBinding } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import ToastMsg from '@/components/ToastMsg';

export default function ClusterRoleBindDetail() {
  const { roleBindName, activeKey } = useParams();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [roleBindDelModalOpen, setRoleBindDelModalOpen] = useState(false);
  const [isRoleBindDelCheck, setIsRoleBindDelCheck] = useState(false);
  const [detailLoded, setDetailLoded] = useState(false);
  const [roleBindDetailTabKey, setRoleBindDetailTabKey] = useState(activeKey || 'detail');
  const [roleBindDetailData, setRoleBindDetailData] = useState({});
  const [roleBindPopOpen, setRoleBindPopOpen] = useState(false);
  const [isReadyOnly, setIsReadyOnly] = useState(true);
  const [isClusterRoleBindAnnotationModalOpen, setIsClusterRoleBindAnnotationModalOpen] = useState(false);
  const [isClusterRoleBindLabelModalOpen, setIsClusterRoleBindLabelModalOpen] = useState(false);
  const [oldClusterRoleBindAnnotations, setOldClusterRoleBindAnnotataions] = useState();
  const [oldClusterRoleBindLabels, setOldClusterRoleBindLabels] = useState();
  const [roleBindYaml, setRoleBindYaml] = useState('');
  const themeStore = useStore('theme');

  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  const handleRoleBindPopOpenChange = (open) => {
    setRoleBindPopOpen(open);
  };

  const handleSetRoleBindDetailTabKey = (key) => {
    setRoleBindDetailTabKey(key);
    setIsReadyOnly(true);
  };

  const handleDeleteRoleBind = () => {
    setRoleBindPopOpen(false);
    setRoleBindDelModalOpen(true);
  };

  const handleDelpRoleBindCancel = () => {
    setRoleBindDelModalOpen(false);
  };

  const handleDelpRoleBindConfirm = async () => {
    try {
      const res = await deleteClusterRoleBinding(roleBindName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setRoleBindDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/userManage/roleBinding`);
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

  const handleRoleBindCheckFn = (e) => {
    setIsRoleBindDelCheck(e.target.checked);
  };

  const getRoleBindDetailInfo = useCallback(async () => {
    if (roleBindName) {
      setDetailLoded(false);
      const res = await getClusterRoleBindingDetailDescription(roleBindName);
      if (res.status === ResponseCode.OK) {
        setRoleBindYaml(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldClusterRoleBindAnnotataions([...res.data.metadata.annotations]);
        setOldClusterRoleBindLabels([...res.data.metadata.labels]);
        setRoleBindDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [roleBindName]);

  const handleModify = () => {
    setRoleBindDetailTabKey('yaml');
    setIsReadyOnly(false);
  };

  const handleAnnotationOk = async (clusterRoleBindData) => {
    if (JSON.stringify(oldClusterRoleBindAnnotations) === JSON.stringify(clusterRoleBindData)) {
      messageApi.info('注解未进行修改');
      setIsClusterRoleBindAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      clusterRoleBindData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldClusterRoleBindAnnotations, clusterRoleBindData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('clusterrolebinding', '', roleBindName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getRoleBindDetailInfo();
              setIsClusterRoleBindAnnotationModalOpen(false);
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
    setIsClusterRoleBindAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsClusterRoleBindAnnotationModalOpen(true);
    setRoleBindPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsClusterRoleBindLabelModalOpen(true);
    setRoleBindPopOpen(false);
  };

  const handleLabelOk = async (clusterRoleBindData) => {
    if (JSON.stringify(oldClusterRoleBindLabels) === JSON.stringify(clusterRoleBindData)) {
      messageApi.info('标签未进行修改');
      setIsClusterRoleBindLabelModalOpen(false);
    } else {
      const keyArr = [];
      clusterRoleBindData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldClusterRoleBindLabels, clusterRoleBindData, 'label');
        try {
          const res = await editAnnotationsOrLabels('clusterrolebinding', '', roleBindName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getRoleBindDetailInfo();
              setIsClusterRoleBindLabelModalOpen(false);
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
    setIsClusterRoleBindLabelModalOpen(false);
  };

  useEffect(() => {
    if (roleBindDetailTabKey === 'detail' || activeKey) {
      getRoleBindDetailInfo();
    }
  }, [roleBindDetailTabKey, getRoleBindDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <ClusterRoleBindingInfo
        roleBindName={roleBindName}
        roleBindDetailDataProps={roleBindDetailData}
        refreshFn={getRoleBindDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <ClusterRoleBindingYaml
        roleBindYamlProps={roleBindYaml}
        handleEditFn={handleReadyOnly}
        readOnly={isReadyOnly}
        refreshFn={getRoleBindDetailInfo} />,
    },
  ];

  return <div className="child_content withBread_content ClusterRoleBindDetail">
    <ToastMsg contextHolder={contextHolder} />
    <BreadCrumbCom items={[
      { title: 'RBAC管理', disabled: true },
      { title: '角色绑定', path: `/${containerRouterPrefix}/userManage/roleBinding` },
      { title: '详情' },
    ]} />
    <div className='pod_title ClusterRoleBindDetail' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{roleBindName}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleModify}>修改</Button>
            <Button type="link" onClick={handleEditLabel}>修改标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>修改注解</Button>
            <Button type="link" onClick={handleDeleteRoleBind}>删除</Button>
          </Space>
        }
        open={roleBindPopOpen}
        onOpenChange={handleRoleBindPopOpenChange}>
        <Button className='primary_btn ClusterRoleBindDetail'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isClusterRoleBindAnnotationModalOpen} type="annotation" dataList={roleBindDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isClusterRoleBindLabelModalOpen} type="label" dataList={roleBindDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除角色绑定"
        open={roleBindDelModalOpen}
        cancelFn={handleDelpRoleBindCancel}
        content={[
          '删除角色绑定后将无法恢复，请谨慎操作。',
          `确定删除角色绑定 ${roleBindName} 吗？`,
        ]}
        isCheck={isRoleBindDelCheck}
        showCheck={true}
        checkFn={handleRoleBindCheckFn}
        confirmFn={handleDelpRoleBindConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetRoleBindDetailTabKey} activeKey={roleBindDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}
