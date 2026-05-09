/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_CURRENT_PAGE = 1;

export const ResponseCode = {
  OK: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  Found: 302,
  BadRequest: 400,
  UnAuthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  InternalServerError: 500,
  BadGateway: 502,
  GatewayTimeout: 504,
};

export const podStatus = ['pending', 'running', 'succeeded', 'failed', 'unknown'];
export const workloadStatus = ['active', 'updating', 'failed'];
export const jobStatus = ['complete','active','failed'];
export const cronJobStatus = ['completed', 'active'];
export const podContainerOptions = ['Waiting', 'Running', 'Terminated', 'Unknown'];
// 节点状态
export const nodeStatusOptions = {
  normal: '正常',
  failed: '异常',
};

// 节点类型
export const nodeTypeOptions = {
  workerNode: '工作节点',
  manageNode: '管理节点',
};

export const namespaceStatusOptions = {
  active: 'Active',
  terminating: 'Terminating',
};

// helm状态
export const manageStatusFilterOptions = ['部署成功', '部署失败', '处理中', '卸载中'];

// helm turbo
export const manageTurboFilterOptions = ['true', 'false'];

export const ReleaseStatus = {
  Current: '运行中',
  Failed: '失败',
  InProgress: '创建中',
  Terminating: '删除中',
};

// deployment状态
export const deploymentStatus = {
  Active: 'active',
  Updating: 'updating',
  Failed: 'failed',
};


export const timePeriodOptions = [
  {
    label: '近10分钟',
    value: '10m',
  },
  {
    label: '近30分钟',
    value: '30m',
  },
  {
    label: '近1小时',
    value: '1h',
  },
  {
    label: '近3小时',
    value: '3h',
  },
  {
    label: '近6小时',
    value: '6h',
  },
  {
    label: '近1天',
    value: '1d',
  },
  {
    label: '近3天',
    value: '3d',
  },
  {
    label: '近7天',
    value: '7d',
  },
  {
    label: '近14天',
    value: '14d',
  },
];

export const refreshTimeOptions = [
  {
    label: '不自动刷新',
    value: 0,
  },
  {
    label: '刷新间隔 15秒',
    value: 15,
  },
  {
    label: '刷新间隔 30秒',
    value: 30,
  },
  {
    label: '刷新间隔 1分钟',
    value: 60,
  },
  {
    label: '刷新间隔 5分钟',
    value: 300,
  },
  {
    label: '刷新间隔 1天',
    value: 86400,
  },
];

export const controllMonitorOptions = [
  {
    label: 'ETCD',
    value: 'etcd',
  },
  {
    label: 'kube-apiserver',
    value: 'kube-apiserver',
  },
  {
    label: 'kube-scheduler',
    value: 'kube-scheduler',
  },
  {
    label: 'kube-controller-manager',
    value: 'kube-controller-manager',
  },
];

export const nodeMonitorOptions = [
  {
    label: 'kubelet',
    value: 'kubelet',
  },
  {
    label: 'kube-proxy',
    value: 'kube-proxy',
  },
];

export const typeOptions = [
  {
    label: 'deployment',
    value: 'deployment',
  },
  {
    label: 'StatefulSet',
    value: 'statefulset',
  },
  {
    label: 'DaemonSet',
    value: 'daemonset',
  },
];

export const monitorGoalFilterOptions = [
  {
    label: 'up',
    value: 'up',
  },
  {
    label: 'down',
    value: 'down',
  },
  {
    label: 'unknown',
    value: 'unknown',
  },
];

export const alarmStatusOptions = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '未触发(inactive)',
    value: 'inactive',
  },
  {
    label: '待定(pending)',
    value: 'pending',
  },
  {
    label: '触发(firing)',
    value: 'firing',
  },
];

export const alarmLevelOptions = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '严重',
    value: 'critical',
  },
  {
    label: '提示',
    value: 'info',
  },
  {
    label: '警告',
    value: 'warning',
  },
];


export const alarmStatusEx = {
  inactive: '未触发',
  firing: '触发',
  pending: '待定',
};

export const alarmLevelEx = {
  critical: '严重',
  info: '提示',
  warning: '警告',
};

export const stepList = {
  '10m': '2s',
  '30m': '6s',
  '1h': '14s',
  '3h': '72s',
  '6h': '86s',
  '1d': '345s',
  '3d': '1035s',
  '7d': '2419s',
  '14d': '4838s',
}; // 基于prometheus 5min-1s

export const disabledModifyMonitorServiceCr = [
  'alertmanager-main',
  'blackbox-exporter',
  'coredns', 'etcd',
  'kube-apiserver',
  'kube-controller-manager',
  'kube-proxy',
  'kube-scheduler',
  'kube-state-metrics',
  'kubelet',
  'node-exporter',
  'prometheus-k8s',
  'prometheus-operator',
]; // 禁止修改的serviceminitor实例

export const eventLevelOptions = [
  {
    label: '全部',
    value: '',
  },
  {
    label: '警告',
    value: 'Warning',
  },
  {
    label: '正常',
    value: 'Normal',
  },
];

export const silentOptions = [
  { label: '分', value: 'm' },
  { label: '时', value: 'h' },
  { label: '天', value: 'd' },
];
// 终端类型
export const terminalType = {
  cluster: '集群',
  container: '容器',
};

/** 在线文档根路径（中文，与 docs.openfuyao.cn 文档中心默认版本一致） */
export const DOC_SITE_ROOT = 'https://docs.openfuyao.cn/zh/docs/v26.03';

/** 对外参考链接（kubectl、用户指南入口等） */
export const publicLink = {
  kubectlLink: 'https://kubernetes.io/zh-cn/docs/reference/kubectl/',
  helpWordLink: `${DOC_SITE_ROOT}/user_guide/getting_started.html`,
};

export const docAddress = [
  {
    path: '/container_platform/overview',
    address: `${DOC_SITE_ROOT}/user_guide/summary.html`,
  },
  {
    path: '/container_platform/appMarket/appOverview',
    address: `${DOC_SITE_ROOT}/user_guide/application_market.html#概览`,
  },
  {
    path: '/container_platform/appMarket/marketCategory',
    address: `${DOC_SITE_ROOT}/user_guide/application_market.html#使用应用列表`,
  },
  {
    path: '/container_platform/appMarket/stash',
    address: `${DOC_SITE_ROOT}/user_guide/application_market.html#使用仓库配置`,
  },
  {
    path: '/container_platform/applicationManageHelm',
    address: `${DOC_SITE_ROOT}/user_guide/application_management.html`,
  },
  {
    path: '/container_platform/extendManage',
    address: `${DOC_SITE_ROOT}/user_guide/extension_management.html`,
  },
  {
    path: '/container_platform/workload/pod',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/workloads.html#使用pod`,
  },
  {
    path: '/container_platform/workload/deployment',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/workloads.html#后续操作`,
  },
  {
    path: '/container_platform/workload/statefulSet',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/workloads.html#后续操作`,
  },
  {
    path: '/container_platform/workload/daemonSet',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/workloads.html#后续操作`,
  },
  {
    path: '/container_platform/workload/job',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/workloads.html#后续操作`,
  },
  {
    path: '/container_platform/workload/cronJob',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/workloads.html#后续操作`,
  },
  {
    path: '/container_platform/network/service',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/networking.html#使用service`,
  },
  {
    path: '/container_platform/network/ingress',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/networking.html#使用ingress`,
  },
  {
    path: '/container_platform/storage/pv',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/storage.html#使用pv`,
  },
  {
    path: '/container_platform/storage/pvc',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/storage.html#使用pvc`,
  },
  {
    path: '/container_platform/storage/sc',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/storage.html#使用sc`,
  },
  {
    path: '/container_platform/nodeManage',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/nodes.html`,
  },
  {
    path: '/container_platform/configuration/configMap',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/configmap_and_secrets.html#使用configmap`,
  },
  {
    path: '/container_platform/configuration/secret',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/configmap_and_secrets.html#使用secret`,
  },
  {
    path: '/container_platform/namespace/namespaceManage',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/namespaces.html#使用namespace`,
  },
  {
    path: '/container_platform/namespace/limitRange',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/namespaces.html#使用limitrange`,
  },
  {
    path: '/container_platform/namespace/resourceQuota',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/namespaces.html#使用resourcequota`,
  },
  {
    path: '/container_platform/customResourceDefinition',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/custom_resources.html`,
  },
  {
    path: '/container_platform/computing-power-engine/computingOverview',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/multi_core_scheduling.html#特性介绍`,
  },
  {
    path: '/container_platform/computing-power-engine/console',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/multi_core_scheduling.html#开启调度策略`,
  },
  {
    path: '/container_platform/computing-power-engine/sceneManage',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/openfuyao_ray.html#查看概览`,
  },
  {
    path: '/container_platform/computing-power-engine/pluginManage',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/openfuyao_ray.html#使用raycluster`,
  },
  {
    path: '/container_platform/computing-power-engine/tuningReport',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/multi_core_scheduling.html#开启调度策略`,
  },
  {
    path: '/container_platform/colocation/ColocationOverview',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/colocation.html#查看概览`,
  },
  {
    path: '/container_platform/colocation/ColocationNodeManagement',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/colocation.html#打开或关闭节点的混部标签`,
  },
  {
    path: '/container_platform/colocation/ColocationWorkloadManagement',
    address: `${DOC_SITE_ROOT}/user_guide/resource_management/workloads.html`,
  },
  {
    path: '/container_platform/colocation/ColocationRulesManagement',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/colocation.html#使用混部策略参数配置`,
  },
  {
    path: '/container_platform/scheduling/NumaOverview',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/numa-aware_scheduling_user_guide.html#查看概览页`,
  },
  {
    path: '/container_platform/scheduling/AffinityPolicyConfiguration',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/numa-aware_scheduling_user_guide.html#使用亲和策略配置`,
  },
  {
    path: '/container_platform/scheduling/numaMonitor',
    address: `${DOC_SITE_ROOT}/user_guide/computing_power_optimization_center/numa-aware_scheduling_user_guide.html#使用集群numa监控`,
  },
  {
    path: '/container_platform/monitor/monitorDashboard',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/monitoring.html#使用监控看板`,
  },
  {
    path: '/container_platform/monitor/monitorGoalManage',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/monitoring.html#使用监控目标`,
  },
  {
    path: '/container_platform/monitor/monitorRuleManage',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/monitoring.html#告警规则`,
  },
  {
    path: '/container_platform/monitoring-dashboard/dashboard',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/custom_monitoring_dashboard.html`,
  },
  {
    path: '/container_platform/logging/logSearch',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/logs.html#使用日志查询`,
  },
  {
    path: '/container_platform/logging/logSet',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/logs.html#使用日志配置`,
  },
  {
    path: '/container_platform/alarm/alarmIndex',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/alerts.html#使用当前告警`,
  },
  {
    path: '/container_platform/alarm/silentAlarm',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/alerts.html#使用静默告警`,
  },
  {
    path: '/container_platform/event',
    address: `${DOC_SITE_ROOT}/user_guide/observability_center/events.html`,
  },
  {
    path: '/container_platform/clusterUser',
    address: `${DOC_SITE_ROOT}/user_guide/user_management.html#分配集群角色`,
  },
  {
    path: '/container_platform/clusterMember',
    address: `${DOC_SITE_ROOT}/user_guide/user_management.html#查看集群成员`,
  },
  {
    path: '/container_platform/userManage/serviceAccount',
    address: `${DOC_SITE_ROOT}/user_guide/permission_management/rbac_management.html#使用服务账号`,
  },
  {
    path: '/container_platform/userManage/role',
    address: `${DOC_SITE_ROOT}/user_guide/permission_management/rbac_management.html#使用角色`,
  },
  {
    path: '/container_platform/userManage/roleBinding',
    address: `${DOC_SITE_ROOT}/user_guide/permission_management/rbac_management.html#使用角色绑定`,
  },
  {
    path: '/multicluster',
    address: `${DOC_SITE_ROOT}/user_guide/multi_cluster_management.html`,
  },
  {
    path: '/user_manage/user',
    address: `${DOC_SITE_ROOT}/user_guide/user_management.html#查看用户信息`,
  },
  {
    path: '/user_manage/role',
    address: `${DOC_SITE_ROOT}/user_guide/user_management.html#查看平台级角色列表`,
  },
  {
    path: '/setting/userinfo',
    address: `${DOC_SITE_ROOT}/user_guide/user_management.html#使用用户视角的用户管理`,
  },
  {
    path: '/ai-copilot',
    address: `${DOC_SITE_ROOT}/user_guide/ai_inference_infernex.html`,
  },
];
// 终端ws前缀
export function getWsPrefix() {
  let clusterName = sessionStorage.getItem('cluster');
  let paramObj = {
    terminalUrl: `/clusters/${clusterName}/rest/webterminal/v1`,
  };
  return paramObj;
}

// 扩展组件前缀匹配
export const expandComponent = {
  Logging: 'logging',
  ComputingPowerEngine: 'computing-power-engine',
  MonitoringDashboard: 'monitoring-dashboard',
  Colocation: 'colocation',
  Volcano: 'scheduling',
  Cluster: 'cluster',
  Ray: 'ray',
  MisManagement: 'mis-management',
};
