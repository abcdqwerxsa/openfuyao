/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
 *       http://license.coscl.org.cn/MulanPSL2
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */

import { useEffect, useState, useCallback, Fragment, useRef } from 'openinula';
import { Space, Table, Tooltip, Form, Input, ConfigProvider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { filterRepeat } from '@/utils/common';
import { ReleaseStatus } from '@/common/constants';
import zhCN from 'antd/es/locale/zh_CN';
import { useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import { solveEncodePath } from '@/tools/utils';
import '@/styles/pages/helm.less';

let helmBackList = [];

/**
 * Application Resource Tab Component
 *
 * @param {Object} props
 * @param {Object} props.dataProps - Resource data
 */
export default function ApplicationResourceTab({ dataProps }) {
  const { Search } = Input;
  const history = useHistory();

  const [helmResourceList, setHelmResourceList] = useState([]);
  const [helmSearchForm] = Form.useForm();
  const helmFormRef = useRef(null);
  const [helmDetailFilterObj, setHelmDetailFilterObj] = useState({});
  const [helmDetailTotal, setHelmDetailTotal] = useState(0);
  const [helmDetailCurrent, setHelmDetailCurrent] = useState(1);
  const [helmDetailPageSize, setHelmDetailPageSize] = useState(10);
  const [kindArr, setKindArr] = useState([]);
  const [currentKind, setCurrentKind] = useState('');
  const [statusArr, setStatusArr] = useState([]);
  const [currentStatus, setCurrentStatus] = useState('');
  const [helmSortObj, setHelmSortObj] = useState({});
  const [helmStatusSortObj, setHelmStatusSortObj] = useState({});
  const [helmNamespaceSortObj, setHelmNamespaceSortObj] = useState({});
  const [helmTypeSortObj, setHelmTypeSortObj] = useState({});

  const linkArr = [
    'Pod', 'Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob', 'Service', 'Ingress', 'ConfigMap',
    'Secret', 'ServiceAccount', 'Role', 'RoleBinding', 'Namespace', 'ClusterRole', 'ClusterRoleBinding',
    'PersistentVolume', 'PersistentVolumeClaim', 'StorageClass', 'ServiceMonitor', 'CustomResourceDefinition',
    'ResourceQuota', 'LimitRange',
  ];

  const getHelmResource = () => {
    if (helmFormRef.current) {
      let filtertArr = [];
      if (helmSearchForm.getFieldsValue().name) {
        filtertArr = helmBackList.filter(item => (item.name).includes(helmSearchForm.getFieldsValue().name));
      } else {
        filtertArr = JSON.parse(JSON.stringify(helmBackList));
      }
      if (Object.keys(helmDetailFilterObj).length !== 0) {
        if (!helmDetailFilterObj.helmDetailStatus) {
          setCurrentStatus('');
        } else {
          let [temporyStatus] = helmDetailFilterObj.helmDetailStatus;
          setCurrentStatus(temporyStatus);
          filtertArr = filtertArr.filter(item => item.status?.Status === temporyStatus);
        }
        if (!helmDetailFilterObj.kind) {
          setCurrentKind('');
        } else {
          let [kind] = helmDetailFilterObj.kind;
          setCurrentKind(kind);
          filtertArr = filtertArr.filter(item => item.kind === kind);
        }
      }
      // Sorting logic
      if (helmSortObj.order === 'ascend') {
        filtertArr.sort((a, b) => a.name.localeCompare(b.name));
      } else if (helmSortObj.order === 'descend') {
        filtertArr.sort((a, b) => b.name.localeCompare(a.name));
      }
      if (helmStatusSortObj.order === 'ascend') {
        filtertArr.sort((a, b) => (ReleaseStatus[a.status.Status] || '').localeCompare(ReleaseStatus[b.status.Status] || ''));
      } else if (helmStatusSortObj.order === 'descend') {
        filtertArr.sort((a, b) => (ReleaseStatus[b.status.Status] || '').localeCompare(ReleaseStatus[a.status.Status] || ''));
      }
      if (helmNamespaceSortObj.order === 'ascend') {
        filtertArr.sort((a, b) => (a.namespace || '').localeCompare(b.namespace || ''));
      } else if (helmNamespaceSortObj.order === 'descend') {
        filtertArr.sort((a, b) => (b.namespace || '').localeCompare(a.namespace || ''));
      }
      if (helmTypeSortObj.order === 'ascend') {
        filtertArr.sort((a, b) => (a.kind || '').localeCompare(b.kind || ''));
      } else if (helmTypeSortObj.order === 'descend') {
        filtertArr.sort((a, b) => (b.kind || '').localeCompare(a.kind || ''));
      }
      setHelmDetailTotal(filtertArr.length);
      setHelmResourceList([...filtertArr]);
    }
  };

  const handleHelmDetailTableChange = (pagination, filter, _sorter, extra) => {
    if (extra.action === 'paginate') {
      setHelmDetailCurrent(pagination.current || 1);
      setHelmDetailPageSize(pagination.pageSize || 10);
    }
    if (extra.action === 'filter') {
      setHelmDetailFilterObj(filter);
    }
    if (extra.action === 'sort') {
      setHelmSortObj({});
      setHelmNamespaceSortObj({});
      setHelmTypeSortObj({});
      setHelmStatusSortObj({});
      if (_sorter.columnKey === 'helmDetailStatus') {
        setHelmStatusSortObj({ key: _sorter.columnKey, order: _sorter.order });
      } else if (_sorter.columnKey === 'namespace') {
        setHelmNamespaceSortObj({ key: _sorter.columnKey, order: _sorter.order });
      } else if (_sorter.columnKey === 'kind') {
        setHelmTypeSortObj({ key: _sorter.columnKey, order: _sorter.order });
      } else {
        setHelmSortObj({ key: _sorter.columnKey, order: _sorter.order });
      }
    }
  };

  const setFilterStatusData = useCallback(() => {
    const filterStatusArr = Object.keys(ReleaseStatus).map(element => ({
      text: ReleaseStatus[element],
      value: element,
    }));
    setStatusArr([...filterStatusArr]);
  }, []);

  const helmDetailColumns = [
    {
      title: '资源名称',
      dataIndex: 'name',
      sorter: true,
      sortOrder: helmSortObj.order,
      render: (_, record) => (
        <Space>
          {isShowLink(record.kind) ? (
            <p className='resource_name' onClick={() => jumpToDetail(record.kind, record.namespace, record.name)}>
              {record.name}
            </p>
          ) : (
            <p style={{ color: '#333' }}>{record.name}</p>
          )}
        </Space>
      ),
    },
    {
      title: '命名空间',
      key: 'namespace',
      sorter: true,
      sortOrder: helmNamespaceSortObj.order,
      render: (_, record) => record.namespace || '-',
    },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      filters: kindArr,
      filteredValue: currentKind ? [currentKind] : null,
      filterMultiple: false,
      sorter: true,
      sortOrder: helmTypeSortObj.order,
    },
    {
      title: '状态',
      key: 'helmDetailStatus',
      filters: statusArr,
      filteredValue: currentStatus ? [currentStatus] : null,
      filterMultiple: false,
      sorter: true,
      sortOrder: helmStatusSortObj.order,
      render: (_, record) => (
        <Space>
          <Tooltip title={ReleaseStatus[record.status?.Status] === '失败' ? record.status.Message : ''}>
            <div className="status">
              {ReleaseStatus[record.status?.Status] !== '创建中' && (
                <div className={ReleaseStatus[record.status?.Status] === '运行中' ? 'already_success' : 'already_error'}></div>
              )}
              {ReleaseStatus[record.status?.Status] === '创建中' && <LoadingOutlined id="wait_moment" />}
              <div className="word">{ReleaseStatus[record.status?.Status]}</div>
            </div>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getHelmDetail = useCallback(async () => {
    setHelmResourceList(dataProps.resources);
    helmBackList = dataProps.resources;
    setHelmDetailTotal(dataProps.resources?.length);
    if (dataProps.resources) {
      const temporyKindList = helmBackList.map(item => ({ text: item.kind, value: item.kind }));
      setKindArr([...filterRepeat(temporyKindList)]);
    }
  }, []);

  const isShowLink = (type) => linkArr.includes(type);

  const createResource = {
    Pod: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/workload/pod/${namespace}/${name}` }),
    Deployment: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/workload/deployment/${namespace}/${name}` }),
    StatefulSet: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/workload/statefulset/${namespace}/${name}` }),
    DaemonSet: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/workload/daemonset/${namespace}/${name}` }),
    Job: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/workload/job/${namespace}/${name}` }),
    CronJob: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/workload/cronjob/${namespace}/${name}` }),
    Service: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/network/service/${namespace}/${name}` }),
    Ingress: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/network/ingress/${namespace}/${name}` }),
    ConfigMap: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/configuration/configMap/${namespace}/${name}` }),
    Secret: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/configuration/secret/${namespace}/${name}` }),
    ServiceAccount: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/userManage/serviceAccount/${namespace}/${name}` }),
    Role: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/userManage/role/${namespace}/${name}` }),
    RoleBinding: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/userManage/roleBinding/${namespace}/${name}` }),
    Namespace: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/namespace/namespaceManage/${name}` }),
    LimitRange: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/namespace/limitRange/${namespace}/${name}` }),
    ResourceQuota: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/namespace/resourceQuota/${namespace}/${name}` }),
    ClusterRole: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/userManage/clusterRole/${name}`, state: { roleType: 'clusterrole', roleNamespace: '', roleName: name } }),
    ClusterRoleBinding: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/userManage/clusterRoleBinding/${name}` }),
    PersistentVolume: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/storage/pv/${name}` }),
    PersistentVolumeClaim: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/storage/pvc/${namespace}/${name}` }),
    StorageClass: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/storage/sc/${name}` }),
    ServiceMonitor: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor/${namespace}/${name}`, state: { group: 'monitoring.coreos.com', version: 'v1', plural: 'servicemonitors' } }),
    CustomResourceDefinition: (namespace, name) => history.push({ pathname: `/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(name)}` }),
  };

  const jumpToDetail = (type, namespace, name) => {
    createResource[type]?.(namespace, name);
  };

  useEffect(() => {
    getHelmResource();
  }, [helmDetailFilterObj, helmSortObj, helmNamespaceSortObj, helmTypeSortObj, helmStatusSortObj]);

  useEffect(() => {
    setFilterStatusData();
    getHelmDetail();
  }, [getHelmDetail, setFilterStatusData]);

  return (
    <div className="helm_tab_container container_margin_box tooltip_container_height">
      <div className="resource_card">
        <div className="resource_top_search">
          <Form form={helmSearchForm} ref={helmFormRef} className="toolsBox" autoComplete="off">
            <Form.Item name="name" className='search' style={{ marginBottom: '0' }}>
              <Search placeholder="资源名称" onSearch={() => getHelmResource()} maxLength={53} />
            </Form.Item>
          </Form>
        </div>
        <ConfigProvider locale={zhCN}>
          <Table
            className="table"
            rowKey="id"
            pagination={{
              className: 'page',
              pageSizeOptions: ['10', '20', '50'],
              current: helmDetailCurrent,
              pageSize: helmDetailPageSize,
              total: helmDetailTotal || 0,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
            }}
            dataSource={helmResourceList}
            columns={helmDetailColumns}
            onChange={handleHelmDetailTableChange}
          />
        </ConfigProvider>
      </div>
    </div>
  );
}