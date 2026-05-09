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
import { workloadStatus } from '@/common/constants';
import { listStatefulSets, deleteStatefulSet } from '@/api/containerApi';
import { Link } from 'inula-router';
import Dayjs from 'dayjs';
import { firstAlphabetUp, sorterFirstAlphabet, getWorkloadStatusJudge } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/workload.less';
import ResourceList from '@/components/layouts/ResourceList';
import { containerRouterPrefix } from '@/constant.js';

export default function StatefulSet() {
  const filterStatus = useMemo(() => {
    return workloadStatus.map(item => ({ text: firstAlphabetUp(item), value: item }));
  }, []);
  // 列表项
  const statefulSetColumns = useMemo(() => [
    {
      title: '负载名称',
      key: 'statefulSet_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/workload/statefulSet/${record.metadata.namespace}/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: '状态',
      key: 'status',
      width: 220,
      sorter: (a, b) => sorterFirstAlphabet(getWorkloadStatusJudge(a.status), getWorkloadStatusJudge(b.status)),
      render: (_, record) => <p className={`resource_status ${getWorkloadStatusJudge(record.status).toLowerCase()}_circle`}>
        {getWorkloadStatusJudge(record.status)}
      </p>,
      enableFilter: {
        target: (record) => getWorkloadStatusJudge(record.status),
        options: filterStatus,
      }
    },
    {
      title: '命名空间',
      key: 'statefulSet_namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      width: 220,
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '实例（正常/总量）',
      key: 'statefulSet_example',
      render: (_, record) => `${record.status.readyReplicas || 0}/${record.status.replicas}`,
    },
    {
      title: '创建时间',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      key: 'statefulSet_create_time',
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
  ], []);

  return <div className="child_content withBread_content">
    <BreadCrumbCom className="create_bread" items={[
      { title: '工作负载', disabled: true },
      { title: 'StatefulSet' }
    ]} />
    <ResourceList
      resourceType={'StatefulSet'}
      columns={statefulSetColumns}
      getResourceFn={listStatefulSets}
      deleteResourceFn={(record) => deleteStatefulSet(record.metadata.namespace, record.metadata.name)}
      yamlEditPath={(record) => `/${containerRouterPrefix}/workload/statefulSet/${record.metadata.namespace}/${record.metadata.name}/yaml`}
    />
  </div>;
}