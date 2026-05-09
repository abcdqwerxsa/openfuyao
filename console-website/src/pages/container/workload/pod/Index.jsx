/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useMemo } from 'openinula';
import { podStatus } from '@/common/constants';
import { deletePod, listPods } from '@/api/containerApi';
import { Link } from 'inula-router';
import Dayjs from 'dayjs';
import { firstAlphabetUp, sorterFirstAlphabet } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/workload.less';
import ResourceList from '@/components/layouts/ResourceList';
import { containerRouterPrefix } from '@/constant.js';

export default function Pod() {
  const filterPodStatus = useMemo(() => {
    return podStatus.map(item => ({ text: firstAlphabetUp(item), value: item }));
  }, []);
  const sortPod = (a, b) => {
    let firstTime = a.metadata.annotations?.lastUpdateTime ? a.metadata.annotations.lastUpdateTime : a.metadata.creationTimestamp;
    let endTime = b.metadata.annotations?.lastUpdateTime ? b.metadata.annotations.lastUpdateTime : b.metadata.creationTimestamp;
    return Dayjs(firstTime) - Dayjs(endTime);
  };

  // 列表项
  const podColumns = useMemo(() => [
    {
      title: 'Pod名称',
      key: 'pod_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/pod/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      key: 'status',
      width: 220,
      sorter: (a, b) => sorterFirstAlphabet(a.status.phase, b.status.phase),
      render: (_, record) => <p className={`resource_status ${(record.status.phase).toLowerCase()}_circle`}>
        {record.status.phase}
      </p>,
      enableFilter: {
        target: (record) => record.status.phase,
        options: filterPodStatus,
      },
    },
    {
      title: '命名空间',
      key: 'pod_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '所属工作节点',
      key: 'pod_work_node',
      sorter: (a, b) => sorterFirstAlphabet(a.status.hostIP, b.status.hostIP),
      render: (_, record) => record.status.hostIP || '--',
    },
    {
      title: 'Pod IP地址',
      key: 'pod_ip',
      sorter: (a, b) => sorterFirstAlphabet(a.status.podIP, b.status.podIP),
      render: (_, record) => record.status.podIP || '--',
    },
    {
      title: '更新时间',
      key: 'pod_update_time',
      sorter: (a, b) => sortPod(a, b),
      render: (_, record) =>
        Dayjs(record.metadata.annotations?.lastUpdateTime ? record.metadata.annotations.lastUpdateTime : record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
  ], []);

  return <div className="child_content withBread_content">
    <BreadCrumbCom className="create_bread" items={[
      { title: '工作负载', disabled: true },
      { title: 'Pod' }
    ]} />
    <ResourceList
      resourceType={'Pod'}
      columns={podColumns}
      getResourceFn={listPods}
      deleteResourceFn={(record) => deletePod(record.metadata.namespace, record.metadata.name)}
      yamlEditPath={(record) => `/${containerRouterPrefix}/workload/pod/${record.metadata.namespace}/${record.metadata.name}/yaml`}
    />
  </div>;
}