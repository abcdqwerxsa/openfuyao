/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Link } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/workload.less';
import ResourceList from '@/components/layouts/ResourceList';
import { getIngressData, deleteIngress } from '@/api/containerApi';
import { sorterFirstAlphabet } from '@/tools/utils';
import { Space } from 'antd';

function filterService(arr) {
  if (!arr?.length) {
    return '--';
  }
  const names = [];
  arr.forEach(item => {
    if (item.http?.paths) {
      item.http.paths.forEach(i => {
        names.push(i.backend.service.name);
      });
    }
  });
  return names.length ? names.toString('') : '--';
}

export default function Ingress() {
  const ingressColumns = [
    {
      title: '服务名称',
      key: 'ingress_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => (
        <Link to={`/${containerRouterPrefix}/network/ingress/${record.metadata.namespace}/${record.metadata.name}`}>
          {record.metadata.name}
        </Link>
      ),
    },
    {
      title: '服务',
      key: 'ingress_service',
      sorter: (a, b) => sorterFirstAlphabet(filterService(a.spec.rules), filterService(b.spec.rules)),
      render: (_, record) => <Space>{filterService(record.spec?.rules)}</Space>,
    },
    {
      title: '命名空间',
      key: 'ingress_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => <Space>{record.metadata.namespace}</Space>,
    },
    {
      title: '创建时间',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      key: 'create_time',
      render: (_, record) => (
        <Space>
          {Dayjs(record.metadata.creationTimestamp ? record.metadata.creationTimestamp : '--').format(
            'YYYY-MM-DD HH:mm',
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="child_content withBread_content">
      <BreadCrumbCom
        className="create_bread"
        items={[
          { title: '网络', path: `/${containerRouterPrefix}/network`, disabled: true },
          { title: 'Ingress', path: '/' },
        ]}
      />
      <ResourceList
        resourceType="Ingress"
        columns={ingressColumns}
        getResourceFn={getIngressData}
        deleteResourceFn={(record) => deleteIngress(record.metadata.namespace, record.metadata.name)}
        yamlEditPath={(record) => `/${containerRouterPrefix}/network/ingress/${record.metadata.namespace}/${record.metadata.name}/yaml`}
      />
    </div>
  );
}
