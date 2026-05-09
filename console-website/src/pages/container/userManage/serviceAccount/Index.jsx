/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { getServiceAccountsData, deleteServiceAccount } from '@/api/containerApi';
import { Link } from 'inula-router';
import Dayjs from 'dayjs';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { sorterFirstAlphabet } from '@/tools/utils';
import '@/styles/pages/workload.less';
import ResourceList from '@/components/layouts/ResourceList';
import { containerRouterPrefix } from '@/constant.js';

export default function ServiceAccount() {
  const serviceAccountColumns = [
    {
      title: '服务账号名称',
      key: 'serviceAccount_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/userManage/serviceAccount/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '命名空间',
      key: 'serviceAccount_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '创建时间',
      key: 'serviceAccount_created_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) =>
        Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return <div className="child_content withBread_content">
    <BreadCrumbCom className="create_bread"
      items={[
        { title: 'RBAC管理', disabled: true },
        { title: '服务账号', path: `/${containerRouterPrefix}/userManage/serviceAccount` },
      ]}
    />
    <ResourceList
      resourceType="服务账号"
      columns={serviceAccountColumns}
      getResourceFn={getServiceAccountsData}
      deleteResourceFn={(record) => deleteServiceAccount(record.metadata.namespace, record.metadata.name)}
      yamlEditPath={(record) => `/${containerRouterPrefix}/userManage/serviceAccount/${record.metadata.namespace}/${record.metadata.name}/yaml`}
    />
  </div>;
}
