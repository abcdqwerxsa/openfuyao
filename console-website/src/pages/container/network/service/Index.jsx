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
import { getServicesData, deleteService } from '@/api/containerApi';
import { sorterFirstAlphabet } from '@/tools/utils';
import { Space } from 'antd';

function filterNodePort(value) {
  if (!value?.length) {
    return '--';
  }
  const nodePortArr = [];
  value.forEach(item => {
    if (item.nodePort) {
      nodePortArr.push(item.nodePort);
    }
  });
  return nodePortArr.length ? nodePortArr.toString('') : '--';
}

export default function Service() {
  const serviceColumns = [
    {
      title: '服务名称',
      key: 'service_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => (
        <Link to={`/${containerRouterPrefix}/network/service/${record.metadata.namespace}/${record.metadata.name}`}>
          {record.metadata.name}
        </Link>
      ),
    },
    {
      title: '命名空间',
      key: 'service_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => <Space>{record.metadata.namespace}</Space>,
    },
    {
      title: '外部端口',
      key: 'service_port',
      sorter: (a, b) => sorterFirstAlphabet(filterNodePort(a.spec.ports), filterNodePort(b.spec.ports)),
      render: (_, record) => <Space>{filterNodePort(record.spec.ports)}</Space>,
    },
    {
      title: '内部IP地址',
      key: 'service_ip',
      sorter: (a, b) => sorterFirstAlphabet(a.spec.clusterIP, b.spec.clusterIP),
      render: (_, record) => (
        <Space>{record.spec.clusterIP !== 'None' ? record.spec.clusterIP : '--'}</Space>
      ),
    },
    {
      title: '创建时间',
      key: 'create_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
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
          { title: 'Service', path: '/' },
        ]}
      />
      <ResourceList
        resourceType="Service"
        columns={serviceColumns}
        getResourceFn={getServicesData}
        deleteResourceFn={(record) => deleteService(record.metadata.namespace, record.metadata.name)}
        yamlEditPath={(record) => (`/${containerRouterPrefix}/network/service/${record.metadata.namespace}/${record.metadata.name}/yaml`)}
      />
    </div>
  );
}
