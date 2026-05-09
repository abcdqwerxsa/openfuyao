/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Button, Space, Modal } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useCallback, useState, useMemo } from 'openinula';
import { ResponseCode } from '@/common/constants';
import { getRolesData, deleteRole, getClusterRolesData, deleteClusterRole } from '@/api/containerApi';
import { Link, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import { sorterFirstAlphabet } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/workload.less';
import ResourceList from '@/components/layouts/ResourceList';

export default function Role() {
  const history = useHistory();

  const filterRoleTypeOptions = useMemo(() => ([
    { text: '角色', value: '角色' },
    { text: '集群角色', value: '集群角色' },
  ]), []);

  const yamlEditPath = (record) => {
    if (record.type === 'role') {
      return {
        pathname: `/${containerRouterPrefix}/userManage/role/${record.metadata.namespace}/${record.metadata.name}/yaml`,
        state: {
          roleType: 'role',
          roleNamespace: record.metadata.namespace,
          roleName: record.metadata.name,
        },
      };
    } else {
      return {
        pathname: `/${containerRouterPrefix}/userManage/clusterRole/${record.metadata.name}/yaml`,
        state: {
          roleName: record.metadata.name,
        },
      };
    }
  };

  const getAllRoles = useCallback(async (namespace) => {
    const roleItems = [];
    const clusterRoleItems = [];

    // role
    try {
      const res = await getRolesData(namespace, '', 1, 10000);
      if (res.status === ResponseCode.OK) {
        (res.data?.items || []).forEach((item) => {
          roleItems.push({ ...item, type: 'role' });
        });
      }
    } catch (e) {
      if (e?.response?.data?.code !== ResponseCode.NotFound) {
        throw e;
      }
    }

    // clusterRole
    try {
      const res = await getClusterRolesData('', '', 1, 10000);
      if (res.status === ResponseCode.OK) {
        (res.data?.items || []).forEach((item) => {
          clusterRoleItems.push({
            ...item,
            type: 'clusterRole',
            metadata: { ...item.metadata, namespace: 'all' },
          });
        });
      }
    } catch (e) {
      if (e?.response?.data?.code !== ResponseCode.NotFound) {
        throw e;
      }
    }

    const merged = [...clusterRoleItems, ...roleItems];
    merged.sort((a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name));
    return {
      status: ResponseCode.OK,
      data: { items: merged },
    };
  }, []);

  const roleColumns = useMemo(() => ([
    {
      title: '名称',
      key: 'role_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => {
        if (record.type === 'role') {
          return <Link
            to={{
              pathname: `/${containerRouterPrefix}/userManage/role/${record.metadata.namespace}/${record.metadata.name}`,
            }}
          >
            {record.metadata.name}
          </Link>;
        } else {
          return <Link
            to={{
              pathname: `/${containerRouterPrefix}/userManage/clusterRole/${record.metadata.name}`,
            }}
          >
            {record.metadata.name}
          </Link>;
        }
      },
    },
    {
      title: '类型',
      key: 'role_type',
      sorter: (a, b) => sorterFirstAlphabet(
        a.type === 'role' ? '角色' : '集群角色',
        b.type === 'role' ? '角色' : '集群角色',
      ),
      enableFilter: {
        target: (record) => (record.type === 'role' ? '角色' : '集群角色'),
        options: filterRoleTypeOptions,
      },
      render: (_, record) => (record.type === 'role' ? '角色' : '集群角色'),
    },
    {
      title: '命名空间',
      key: 'role_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => (record.metadata.namespace ? record.metadata.namespace : '--'),
    },
  ]), [filterRoleTypeOptions]);

  const createPopMenuItems = useMemo(() => ([
    {
      key: 'role',
      label: '角色',
      onClick: () => history.push(`/${containerRouterPrefix}/userManage/role/create`),
    },
    {
      key: 'clusterRole',
      label: '集群角色',
      onClick: () => history.push(`/${containerRouterPrefix}/userManage/clusterRole/create`),
    },
  ]), [history]);

  return (
    <div className="child_content withBread_content">
      <BreadCrumbCom
        className="create_bread"
        items={[
          { title: 'RBAC管理', disabled: true },
          { title: '角色' },
        ]}
      />
      <ResourceList
        resourceType="角色"
        columns={roleColumns}
        getResourceFn={getAllRoles}
        deleteResourceFn={(record) => (record.type === 'role'
          ? deleteRole(record.metadata.namespace, record.metadata.name)
          : deleteClusterRole(record.metadata.name))}
        yamlEditPath={yamlEditPath}
        createLabel={<>创建 <DownOutlined className='small_margin_adjust' /></>}
        createMenuItems={createPopMenuItems}
      />
    </div>
  );
}