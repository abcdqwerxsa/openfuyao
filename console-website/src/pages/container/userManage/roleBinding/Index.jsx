/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { DownOutlined } from '@ant-design/icons';
import { useCallback, useMemo, useState } from 'openinula';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import {
  getRoleBindsData,
  deleteRoleBind,
  getClusterRoleBindingsData,
  deleteClusterRoleBinding,
} from '@/api/containerApi';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import ResourceList from '@/components/layouts/ResourceList';
import { sorterFirstAlphabet } from '@/tools/utils';

export default function RoleBinding() {
  const history = useHistory();
  const [roleFilterOptions, setRoleFilterOptions] = useState([]);
  const [themeNameFilterOptions, setThemeNameFilterOptions] = useState([]);

  const getAllRoleBinds = useCallback(async (namespace) => {
    const roleBindingItems = [];
    const clusterRoleBindingItems = [];

    try {
      const res = await getRoleBindsData(namespace, '', DEFAULT_CURRENT_PAGE, 10000);
      if (res.status === ResponseCode.OK) {
        (res.data?.items || []).forEach((item) => {
          roleBindingItems.push({ ...item, type: 'roleBinding' });
        });
      }
    } catch (e) {
      if (e?.response?.data?.code !== ResponseCode.NotFound) {
        throw e;
      }
    }

    try {
      const res = await getClusterRoleBindingsData('', '', DEFAULT_CURRENT_PAGE, 10000);
      if (res.status === ResponseCode.OK) {
        (res.data?.items || []).forEach((item) => {
          clusterRoleBindingItems.push({
            ...item,
            type: 'clusterRoleBinding',
            metadata: { ...item.metadata, namespace: 'all' },
          });
        });
      }
    } catch (e) {
      if (e?.response?.data?.code !== ResponseCode.NotFound) {
        throw e;
      }
    }

    const merged = [...clusterRoleBindingItems, ...roleBindingItems];
    merged.sort((a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name));

    const roleNames = [...new Set(merged.map(item => item.roleRef?.name).filter(Boolean))];
    const themeNames = [...new Set(merged.map(item => item.subjects?.[0]?.name).filter(Boolean))];
    setRoleFilterOptions(roleNames.map(item => ({ text: item, value: item })));
    setThemeNameFilterOptions(themeNames.map(item => ({ text: item, value: item })));

    return {
      status: ResponseCode.OK,
      data: { items: merged },
    };
  }, []);

  const yamlEditPath = (record) => {
    if (record.type === 'roleBinding') {
      return `/${containerRouterPrefix}/userManage/roleBinding/${record.metadata.namespace}/${record.metadata.name}/yaml`;
    }
    return `/${containerRouterPrefix}/userManage/clusterRoleBinding/${record.metadata.name}/yaml`;
  };

  const roleBindColumns = useMemo(() => ([
    {
      title: '绑定名称',
      key: 'roleBind_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={
        record.type === 'roleBinding'
          ? `/${containerRouterPrefix}/userManage/roleBinding/${record.metadata.namespace}/${record.metadata.name}`
          : `/${containerRouterPrefix}/userManage/clusterRoleBinding/${record.metadata.name}`
      }>{record.metadata.name}</Link>,
    },
    {
      title: '绑定类型',
      key: 'roleBind_type',
      sorter: (a, b) => sorterFirstAlphabet(
        a.type === 'roleBinding' ? '角色绑定' : '集群角色绑定',
        b.type === 'roleBinding' ? '角色绑定' : '集群角色绑定',
      ),
      enableFilter: {
        target: (record) => (record.type === 'roleBinding' ? '角色绑定' : '集群角色绑定'),
        options: [
          { text: '角色绑定', value: '角色绑定' },
          { text: '集群角色绑定', value: '集群角色绑定' },
        ],
      },
      render: (_, record) => (record.type === 'roleBinding' ? '角色绑定' : '集群角色绑定'),
    },
    {
      title: '角色',
      key: 'role_name',
      sorter: (a, b) => sorterFirstAlphabet(a.roleRef?.name || '--', b.roleRef?.name || '--'),
      enableFilter: {
        target: (record) => record.roleRef?.name || '',
        options: roleFilterOptions,
      },
      render: (_, record) => record.roleRef?.name || '--',
    },
    {
      title: '角色类型',
      key: 'role_type',
      sorter: (a, b) => sorterFirstAlphabet(
        a.roleRef?.kind === 'Role' ? '角色' : '集群角色',
        b.roleRef?.kind === 'Role' ? '角色' : '集群角色',
      ),
      enableFilter: {
        target: (record) => (record.roleRef?.kind === 'Role' ? '角色' : '集群角色'),
        options: [
          { text: '角色', value: '角色' },
          { text: '集群角色', value: '集群角色' },
        ],
      },
      render: (_, record) => (record.roleRef?.kind === 'Role' ? '角色' : '集群角色'),
    },
    {
      title: '主题种类',
      key: 'roleBind_theme_kind',
      sorter: (a, b) => sorterFirstAlphabet(a.subjects?.[0]?.kind || '--', b.subjects?.[0]?.kind || '--'),
      render: (_, record) => record.subjects?.[0]?.kind || '--',
    },
    {
      title: '主题名称',
      key: 'roleBind_theme_title',
      sorter: (a, b) => sorterFirstAlphabet(a.subjects?.[0]?.name || '--', b.subjects?.[0]?.name || '--'),
      enableFilter: {
        target: (record) => record.subjects?.[0]?.name || '',
        options: themeNameFilterOptions,
      },
      render: (_, record) => record.subjects?.[0]?.name || '--',
    },
    {
      title: '命名空间',
      key: 'roleBind_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace || '--',
    },
  ]), [roleFilterOptions, themeNameFilterOptions]);

  const createPopMenuItems = useMemo(() => ([
    {
      key: 'roleBinding',
      label: '角色绑定',
      onClick: () => history.push(`/${containerRouterPrefix}/userManage/roleBinding/create`),
    },
    {
      key: 'clusterRoleBinding',
      label: '集群角色绑定',
      onClick: () => history.push(`/${containerRouterPrefix}/userManage/clusterRoleBinding/create`),
    },
  ]), [history]);

  return (
    <div className="child_content withBread_content">
      <BreadCrumbCom
        className="create_bread"
        items={[
          { title: 'RBAC管理', disabled: true },
          { title: '角色绑定' },
        ]}
      />
      <ResourceList
        resourceType="角色绑定"
        columns={roleBindColumns}
        getResourceFn={getAllRoleBinds}
        deleteResourceFn={(record) => (record.type === 'roleBinding'
          ? deleteRoleBind(record.metadata.namespace, record.metadata.name)
          : deleteClusterRoleBinding(record.metadata.name))}
        yamlEditPath={yamlEditPath}
        createLabel={<>创建 <DownOutlined className='small_margin_adjust' /></>}
        createMenuItems={createPopMenuItems}
      />
    </div>
  );
}