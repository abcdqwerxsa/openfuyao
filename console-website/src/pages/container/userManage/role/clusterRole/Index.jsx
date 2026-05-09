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
import ClusterRoleInfo from '@/pages/container/userManage/role/clusterRole/ClusterRoleInfo';
import ClusterRoleYaml from '@/pages/container/userManage/role/clusterRole/ClusterRoleYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getClusterRoleDetailDescription, editAnnotationsOrLabels, deleteClusterRole } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import ToastMsg from '@/components/ToastMsg';

export default function ClusterRoleDetail() {
  const { roleName, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [roleDelModalOpen, setRoleDelModalOpen] = useState(false); // 删除对话框展示
  const [isRoleDelCheck, setIsRoleDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [roleDetailTabKey, setRoleDetailTabKey] = useState(activeKey || 'detail');

  const [roleDetailData, setRoleDetailData] = useState({}); // 详情数据

  const [rolePopOpen, setRolePopOpen] = useState(false); // 气泡悬浮

  const [isCrReadyOnly, setIsCrReadyOnly] = useState(true); // 是否只读

  const [isClusterRoleAnnotationModalOpen, setIsClusterRoleAnnotationModalOpen] = useState(false);
  const [isClusterRoleLabelModalOpen, setIsClusterRoleLabelModalOpen] = useState(false);
  const [oldClusterRoleAnnotations, setOldClusterRoleAnnotataions] = useState();
  const [oldClusterRoleLabels, setOldClusterRoleLabels] = useState();

  const [clusterRoleYaml, setClusterRoleYaml] = useState(''); // 传递yaml

  const themeStore = useStore('theme');

  // 处理只读
  const handleClusterRoleReadyOnly = (bool) => {
    setIsCrReadyOnly(bool);
  };

  // 气泡
  const handleClusterRolePopOpenChange = (open) => {
    setRolePopOpen(open);
  };

  const handleSetClusterRoleDetailTabKey = (key) => {
    setRoleDetailTabKey(key);
    setIsCrReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteClusterRole = () => {
    setRolePopOpen(false); // 气泡框
    setRoleDelModalOpen(true); // 打开弹窗
  };

  const handleClusterRoleCancel = () => {
    setRoleDelModalOpen(false);
  };

  const handleClusterRoleConfirm = async () => {
    try {
      const res = await deleteClusterRole(roleName);
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

  const handleClusterRoleCheckFn = (e) => {
    setIsRoleDelCheck(e.target.checked);
  };

  const getRoleDetailInfo = useCallback(async () => {
    if (!roleName) {
      return;
    }
    if (roleName) {
      setDetailLoded(false);
      const res = await getClusterRoleDetailDescription(roleName);
      if (res.status === ResponseCode.OK) {
        setClusterRoleYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldClusterRoleAnnotataions([...res.data.metadata.annotations]);
        setOldClusterRoleLabels([...res.data.metadata.labels]);
        setRoleDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [roleName]);

  const handleClusterRoleModify = () => {
    setRoleDetailTabKey('yaml'); // 跳向yaml
    setIsCrReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleAnnotationOk = async (clusterRoleData) => {
    if (JSON.stringify(oldClusterRoleAnnotations) === JSON.stringify(clusterRoleData)) {
      messageApi.info('注解未进行修改');
      setIsClusterRoleAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      clusterRoleData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldClusterRoleAnnotations, clusterRoleData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('clusterrole', '', roleName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getRoleDetailInfo();
              setIsClusterRoleAnnotationModalOpen(false);
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
    setIsClusterRoleAnnotationModalOpen(false);
  };

  const handleEditClusterRoleAnnotation = () => {
    setIsClusterRoleAnnotationModalOpen(true);
    setRolePopOpen(false);
  };

  const handleEditClusterRoleLabel = () => {
    setIsClusterRoleLabelModalOpen(true);
    setRolePopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (clusterRoleData) => {
    if (JSON.stringify(oldClusterRoleLabels) === JSON.stringify(clusterRoleData)) {
      messageApi.info('标签未进行修改');
      setIsClusterRoleLabelModalOpen(false);
    } else {
      const keyArr = [];
      clusterRoleData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldClusterRoleLabels, clusterRoleData, 'label');
        try {
          const res = await editAnnotationsOrLabels('clusterrole', '', roleName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getRoleDetailInfo();
              setIsClusterRoleLabelModalOpen(false);
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
    setIsClusterRoleLabelModalOpen(false);
  };

  useEffect(() => {
    if (roleDetailTabKey === 'detail' || activeKey) {
      getRoleDetailInfo();
    }
  }, [roleDetailTabKey, getRoleDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsCrReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'detail',
      label: '详情',
      children: <ClusterRoleInfo
        roleName={roleName}
        roleDetailDataProps={roleDetailData}
        refreshFn={getRoleDetailInfo} />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <ClusterRoleYaml
        clusterRoleYamlProps={clusterRoleYaml}
        readOnly={isCrReadyOnly}
        handleEditFn={handleClusterRoleReadyOnly}
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
    <div className='pod_title cluster_role_op' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{roleName}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleClusterRoleModify}>修改</Button>
            <Button type="link" onClick={handleEditClusterRoleLabel}>修改标签</Button>
            <Button type="link" onClick={handleEditClusterRoleAnnotation}>修改注解</Button>
            <Button type="link" onClick={handleDeleteClusterRole}>删除</Button>
          </Space>
        }
        open={rolePopOpen}
        onOpenChange={handleClusterRolePopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isClusterRoleAnnotationModalOpen} type="annotation" dataList={roleDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isClusterRoleLabelModalOpen} type="label" dataList={roleDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除角色"
        open={roleDelModalOpen}
        cancelFn={handleClusterRoleCancel}
        content={[
          '删除角色后将无法恢复，请谨慎操作。',
          `确定删除角色 ${roleName} 吗？`,
        ]}
        isCheck={isRoleDelCheck}
        showCheck={true}
        checkFn={handleClusterRoleCheckFn}
        confirmFn={handleClusterRoleConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetClusterRoleDetailTabKey} activeKey={roleDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}