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
import RoleInfo from '@/pages/container/userManage/role/role/RoleInfo';
import RoleYaml from '@/pages/container/userManage/role/role/RoleYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getRoleDetailDescription, editAnnotationsOrLabels, deleteRole, getClusterRoleDetailDescription, deleteClusterRole } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import ToastMsg from '@/components/ToastMsg';

export default function RoleDetail() {
  const { roleNamespace, roleName, activeKey } = useParams();
  const roleType = 'role';

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [roleDelModalOpen, setRoleDelModalOpen] = useState(false); // 删除对话框展示
  const [isRoleDelCheck, setIsRoleDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [roleDetailTabKey, setRoleDetailTabKey] = useState(activeKey || 'detail');

  const [roleDetailData, setRoleDetailData] = useState({}); // 详情数据

  const [rolePopOpen, setRolePopOpen] = useState(false); // 气泡悬浮

  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [isRoleAnnotationModalOpen, setIsRoleAnnotationModalOpen] = useState(false);
  const [isRoleLabelModalOpen, setIsRoleLabelModalOpen] = useState(false);
  const [oldRoleAnnotations, setOldRoleAnnotataions] = useState();
  const [oldRoleLabels, setOldRoleLabels] = useState();

  const [roleYaml, setRoleYaml] = useState(''); // 传递yaml

  const themeStore = useStore('theme');

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  // 气泡
  const handleRolePopOpenChange = (open) => {
    setRolePopOpen(open);
  };

  const handleSetRoleDetailTabKey = (key) => {
    setRoleDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteRole = () => {
    setRolePopOpen(false); // 气泡框
    setRoleDelModalOpen(true); // 打开弹窗
  };

  const handleDelpRoleCancel = () => {
    setRoleDelModalOpen(false);
  };

  const handleDelpRoleConfirm = async () => {
    try {
      const res = (roleType === 'role') ? await deleteRole(roleNamespace, roleName) : await deleteClusterRole(roleName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setRoleDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/userManage/role`);
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

  const handleRoleCheckFn = (e) => {
    setIsRoleDelCheck(e.target.checked);
  };

  const getRoleDetailInfo = useCallback(async () => {
    if (!roleType || !roleName) {
      return;
    }
    if (roleType === 'role') {
      if (roleName && roleNamespace) {
        setDetailLoded(false);
        const res = await getRoleDetailDescription(roleNamespace, roleName);
        if (res.status === ResponseCode.OK) {
          setRoleYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
          res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
          res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
          setOldRoleAnnotataions([...res.data.metadata.annotations]);
          setOldRoleLabels([...res.data.metadata.labels]);
          setRoleDetailData(res.data);
        }
        setDetailLoded(true);
      }
    } else {
      if (roleName) {
        setDetailLoded(false);
        const res = await getClusterRoleDetailDescription(roleName);
        if (res.status === ResponseCode.OK) {
          setRoleYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
          res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
          res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
          setOldRoleAnnotataions([...res.data.metadata.annotations]);
          setOldRoleLabels([...res.data.metadata.labels]);
          setRoleDetailData(res.data);
        }
        setDetailLoded(true);
      }
    }
  }, [roleName, roleNamespace, roleType]);

  const handleModify = () => {
    setRoleDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleAnnotationOk = async (roleData) => {
    if (JSON.stringify(oldRoleAnnotations) === JSON.stringify(roleData)) {
      messageApi.info('注解未进行修改');
      setIsRoleAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      roleData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldRoleAnnotations, roleData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels(roleType === 'role' ? 'role' : 'clusterrole', roleNamespace, roleName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getRoleDetailInfo();
              setIsRoleAnnotationModalOpen(false);
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
    setIsRoleAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsRoleAnnotationModalOpen(true);
    setRolePopOpen(false);
  };

  const handleEditLabel = () => {
    setIsRoleLabelModalOpen(true);
    setRolePopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (roleData) => {
    if (JSON.stringify(oldRoleLabels) === JSON.stringify(roleData)) {
      messageApi.info('标签未进行修改');
      setIsRoleLabelModalOpen(false);
    } else {
      const keyArr = [];
      roleData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldRoleLabels, roleData, 'label');
        try {
          const res = await editAnnotationsOrLabels(roleType === 'role' ? 'role' : 'clusterrole', roleNamespace, roleName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getRoleDetailInfo();
              setIsRoleLabelModalOpen(false);
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
    setIsRoleLabelModalOpen(false);
  };

  useEffect(() => {
    if (roleDetailTabKey === 'detail' || activeKey) {
      getRoleDetailInfo();
    }
  }, [roleDetailTabKey, getRoleDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <RoleInfo
        roleName={roleName}
        roleNamespace={roleNamespace}
        roleDetailDataProps={roleDetailData}
        refreshFn={getRoleDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <RoleYaml
        roleYamlProps={roleYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getRoleDetailInfo} />,
    },
  ];

  return <div className="child_content withBread_content">
    <ToastMsg contextHolder={contextHolder} />
    <BreadCrumbCom items={[
      { title: 'RBAC管理', disabled: true },
      { title: '角色', path: `/${containerRouterPrefix}/userManage/role` },
      { title: '详情' },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{roleName}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleModify}>修改</Button>
            <Button type="link" onClick={handleEditLabel}>修改标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>修改注解</Button>
            <Button type="link" onClick={handleDeleteRole}>删除</Button>
          </Space>
        }
        open={rolePopOpen}
        onOpenChange={handleRolePopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isRoleAnnotationModalOpen} type="annotation" dataList={roleDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isRoleLabelModalOpen} type="label" dataList={roleDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除角色"
        open={roleDelModalOpen}
        cancelFn={handleDelpRoleCancel}
        content={[
          '删除角色后将无法恢复，请谨慎操作。',
          `确定删除角色 ${roleName} 吗？`,
        ]}
        isCheck={isRoleDelCheck}
        showCheck={true}
        checkFn={handleRoleCheckFn}
        confirmFn={handleDelpRoleConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetRoleDetailTabKey} activeKey={roleDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}