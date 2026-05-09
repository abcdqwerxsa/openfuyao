/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Menu } from 'antd';
import { useEffect, useState, useLayoutEffect, Fragment, useStore, useCallback } from 'openinula';
import '@/styles/components/menu.less';
import { Link, useLocation, useRouteMatch, useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import OverviewIcon from '@/assets/icons/OverviewIcon';
import ApplicationIcon from '@/assets/icons/ApplicationIcon';
import ExtensionIcon from '@/assets/icons/ExtensionIcon';
import WorkloadIcon from '@/assets/icons/WorkloadIcon';
import NetworkIcon from '@/assets/icons/NetworkIcon';
import ConfigIcon from '@/assets/icons/ConfigIcon';
import LogIcon from '@/assets/icons/LogIcon';
import AlarmIcon from '@/assets/icons/AlarmIcon';
import MonitorIcon from '@/assets/icons/MonitorIcon';
import UserManageIcon from '@/assets/icons/UserManageIcon';
import EventIcon from '@/assets/icons/EventIcon';
import ComputingPowerEngineIcon from '@/assets/icons/ComputingPowerEngineIcon';
import MonitoringDashboardIcon from '@/assets/icons/MonitoringDashboardIcon';
import ColocationIcon from '@/assets/icons/ColocationIcon';
import AppMarketIcon from '@/assets/icons/AppMarketIcon';
import VolcanoConfigIcon from '@/assets/icons/VolcanoConfigIcon';
import StorageIcon from '@/assets/icons/StorageIcon';
import NamespaceIcon from '@/assets/icons/NamespaceIcon';
import NodeIcon from '@/assets/icons/NodeIcon';
import CustomizeIcon from '@/assets/icons/CustomizeIcon';
import ClusterMemberIcon from '@/assets/icons/ClusterMemberIcon';
import ClusterRoleIcon from '@/assets/icons/ClusterRoleIcon';
import ClusterLifeIcon from '@/assets/icons/ClusterLifeIcon';
import RayIcon from '@/assets/icons/RayIcon';
import MisManagementIcon from '@/assets/icons/MisManagementIcon';
import { expandComponent } from '@/common/constants';
import { getEffectivePathname } from '@/utils/basePath';


export default function MenuBar({ collapsed, handleCollapseChange }) {
  const location = useLocation();
  const history = useHistory();
  const [openKeys, setOpenKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const consolePluginStore = useStore('consolePlugins');
  const [collapsedHidden, setCollapsedHidden] = useState(false);
  const [items, setItems] = useState([]);

  function getItem(label, key, icon, children, type) {
    return {
      key,
      icon,
      children,
      label,
      type,
    };
  }

  const getPluginConfig = (item) => (
    {
      key: item.pluginName,
      isPlugin: true,
      name: item.displayName,
      path: `/${item.pluginName}`,
      icon: ExtensionIcon,
      children: item.subPages ? item.subPages.map(sub => ({
        key: sub.pageName,
        name: sub.displayName,
        path: `/${sub.pageName}`,
      })) : null,
    }
  );

  const themeStore = useStore('theme');
  const fixItems = [
    {
      key: 'overview',
      name: '总览',
      icon: OverviewIcon,
      path: '/overview',
    },
    {
      key: 'appMarket',
      name: '应用市场',
      icon: AppMarketIcon,
      path: '/appMarket',
      children: [
        {
          key: 'appOverview',
          name: '概览',
          path: '/appOverview',
        },
        {
          key: 'marketCategory',
          name: '应用列表',
          path: '/marketCategory',
        },
        {
          key: 'stash',
          name: '仓库配置',
          path: '/stash/wareHouse',
        },
      ],
    },
    {
      key: 'applicationManageHelm',
      name: '应用管理',
      icon: ApplicationIcon,
      path: '/applicationManageHelm',
    },
    {
      key: 'extendManage',
      name: '扩展组件管理',
      icon: ExtensionIcon,
      path: '/extendManage',
    },
    {
      key: 'storage',
      name: '资源管理',
      type: 'group',
      children: [
        {
          key: 'workload',
          name: '工作负载',
          icon: WorkloadIcon,
          path: '/workload',
          children: [
            {
              key: 'pod',
              name: 'Pod',
              path: '/pod',
            },
            {
              key: 'deployment',
              name: 'Deployment',
              path: '/deployment',
            },
            {
              key: 'statefulSet',
              name: 'StatefulSet',
              path: '/statefulSet',
            },
            {
              key: 'daemonSet',
              name: 'DaemonSet',
              path: '/daemonSet',
            },
            {
              key: 'job',
              name: 'Job',
              path: '/job',
            },
            {
              key: 'cronJob',
              name: 'CronJob',
              path: '/cronJob',
            },
          ],
        },
        {
          key: 'network',
          name: '网络',
          icon: NetworkIcon,
          path: '/network',
          children: [
            {
              key: 'service',
              name: 'Service',
              path: '/service',
            },
            {
              key: 'ingress',
              name: 'Ingress',
              path: '/ingress',
            },
          ],
        },
        {
          key: 'storage',
          name: '存储',
          icon: StorageIcon,
          path: '/storage',
          children: [
            {
              key: 'pv',
              name: '数据卷(PV)',
              path: '/pv',
            },
            {
              key: 'pvc',
              name: '数据卷声明(PVC)',
              path: '/pvc',
            },
            {
              key: 'sc',
              name: '存储池(SC)',
              path: '/sc',
            },
          ],
        },
        {
          key: 'nodeManage',
          name: '节点',
          icon: NodeIcon,
          path: '/nodeManage',
        },
        {
          key: 'configuration',
          name: '配置与密钥',
          icon: ConfigIcon,
          path: '/configuration',
          children: [
            {
              key: 'configMap',
              name: 'ConfigMap',
              path: '/configMap',
            },
            {
              key: 'secret',
              name: 'Secret',
              path: '/secret',
            },
          ],
        },
        {
          key: 'namespace',
          name: '命名空间',
          path: '/namespace',
          icon: NamespaceIcon,
          children: [
            {
              key: 'namespaceManage',
              name: 'Namespace',
              path: '/namespaceManage',
            },
            {
              key: 'limitRange',
              name: 'LimitRange',
              path: '/limitRange',
            },
            {
              key: 'resourceQuota',
              name: 'ResourceQuota',
              path: '/resourceQuota',
            },
          ],
        },
        {
          key: 'customResourceDefinition',
          name: '自定义资源',
          icon: CustomizeIcon,
          path: '/customResourceDefinition',
        },
      ],
    },
    {
      key: 'observeCenter',
      name: '观测中心',
      type: 'group',
      children: [
        {
          key: 'monitor',
          name: '监控',
          icon: MonitorIcon,
          path: '/monitor',
          children: [
            {
              key: 'monitorDashboard',
              name: '监控看板',
              path: '/monitorDashboard',
            },
            {
              key: 'monitorGoalManage',
              name: '监控目标',
              path: '/monitorGoalManage',
            },
            {
              key: 'monitorRuleManage',
              name: '告警规则',
              path: '/monitorRuleManage',
            },
          ],
        },
        {
          key: 'alarm',
          name: '告警',
          icon: AlarmIcon,
          path: '/alarm',
          children: [
            {
              key: 'alarmIndex',
              name: '当前告警',
              path: '/alarmIndex',
            },
            {
              key: 'silentAlarm',
              name: '静默告警',
              path: '/silentAlarm',
            },
          ],
        },
        {
          key: 'event',
          name: '事件',
          icon: EventIcon,
          path: '/event',
        },
      ],
    },
    {
      key: 'roleManagementCenter',
      name: '权限管理',
      type: 'group',
      children: [
        {
          key: 'clusterUser',
          name: '集群角色',
          icon: ClusterRoleIcon,
          path: '/clusterUser',
        },
        {
          key: 'clusterMember',
          name: '集群成员',
          icon: ClusterMemberIcon,
          path: '/clusterMember',
        },
        {
          key: 'userManage',
          name: 'RBAC管理',
          icon: UserManageIcon,
          path: '/userManage',
          children: [
            {
              key: 'serviceAccount',
              name: '服务账号',
              path: '/serviceAccount',
            },
            {
              key: 'role',
              name: '角色',
              path: '/role',
            },
            {
              key: 'roleBinding',
              name: '角色绑定',
              path: '/roleBinding',
            },
          ],
        },
      ],
    },
  ];

  const getMenuItems = () => {
    let temporyItems = [...fixItems];
    const plugins = consolePluginStore.$s.consolePlugins.filter(item => item.entrypoint === `/${containerRouterPrefix}` && item.enabled);
    const isExistComputing = plugins.filter(item =>
      item.pluginName === expandComponent.ComputingPowerEngine || item.pluginName === expandComponent.Volcano ||
      item.pluginName === expandComponent.Colocation || item.pluginName === expandComponent.Ray);
    if (isExistComputing.length) {
      temporyItems.splice(5, 0, {
        key: 'computingOptimizationCenter',
        name: '算力优化中心',
        type: 'group',
        children: [],
      });
    }
    let clusterConfig = {};
    plugins.sort((a, b) => a.pluginName.localeCompare(b.pluginName));
    for (const plugin of plugins) {
      const pluginConfig = getPluginConfig(plugin);
      if (pluginConfig.key === expandComponent.Logging) {
        // 更换日志icon
        pluginConfig.icon = LogIcon;
        const index = temporyItems.findIndex(indexItem => indexItem.key === 'observeCenter');
        temporyItems[index].children.splice(-2, 0, pluginConfig);
      } else if (pluginConfig.key === expandComponent.ComputingPowerEngine) {
        pluginConfig.icon = ComputingPowerEngineIcon;
        temporyItems[5].children.unshift(pluginConfig);
      } else if (pluginConfig.key === expandComponent.MonitoringDashboard) {
        pluginConfig.icon = MonitoringDashboardIcon;
        const index = temporyItems.findIndex(indexItem => indexItem.key === 'observeCenter');
        temporyItems[index].children.splice(1, 0, pluginConfig);
      } else if (pluginConfig.key === expandComponent.Cluster) {
        clusterConfig = pluginConfig;
      } else if (pluginConfig.key === expandComponent.Colocation) {
        pluginConfig.icon = ColocationIcon;
        temporyItems[5].children.splice(1, 0, pluginConfig);
      } else if (pluginConfig.key === expandComponent.Volcano) {
        pluginConfig.icon = VolcanoConfigIcon;
        temporyItems[5].children.push(pluginConfig);
      } else if (pluginConfig.key === expandComponent.Ray) {
        pluginConfig.icon = RayIcon;
        temporyItems[5].children.push(pluginConfig);
      } else if (pluginConfig.key === expandComponent.MisManagement) {
        pluginConfig.icon = MisManagementIcon;
        const index = temporyItems.findIndex(indexItem => indexItem.key === 'storage');
        temporyItems[index].children.push(pluginConfig);
      } else {
        const index = temporyItems.findIndex(indexItem => indexItem.key === 'storage');
        temporyItems[index].children.push(pluginConfig);
      }
    }

    // 最后执行
    if (Object.keys(clusterConfig).length) {
      clusterConfig.icon = ClusterLifeIcon;
      temporyItems.splice(4, 0, clusterConfig);
    }
    return temporyItems;
  };

  let menuItems = getMenuItems();
  // 渲染菜单项
  const getIcon = (item) => (
    item.icon(getEffectivePathname().split('/')[2] === item.path.slice(1), themeStore.$s.theme)
  );

  const handleClickAnotherHistory = (e, child) => {
    if (!child) {
      window.postMessage({ type: 'relayRouter', isHome: true });
    }
  };

  const getLink = (item, child = null) => {
    const path = child ? `/${containerRouterPrefix}${item.path}${child.path}` : `/${containerRouterPrefix}${item.path}`;
    if (item.isPlugin) {
      return <Link className={`${child ? child.key : item.key}_scrollView`} to={path} onClick={e => handleClickAnotherHistory(e, child)}>{child ? child.name : item.name}</Link>;
    }
    return <Link className={`${child ? child.key : item.key}_scrollView`} to={path}>{child ? child.name : item.name}</Link>;
  };

  const getChildItems = (item, isCol = false) => (
    item.children.map(child => {
      if (child.children) {
        return isCol ? getItem(child.name, child.key, getIcon(child), [getItem(child.name, null, null, [...getChildItems(child)], 'group')]) : getItem(child.name, child.key, getIcon(child), getChildItems(child));
      }
      return child.icon ? getItem(getLink(child), child.key, getIcon(child)) : getItem(getLink(item, child), child.key);
    }
    )
  );

  const getMenuItem = (item, isCol = false) => {
    if (item.children) {
      if (item.type === 'group') {
        return getItem(item.name, item.key, null, getChildItems(item, isCol), 'group');
      }
      return isCol
        ? getItem(item.name, item.key, getIcon(item), [getItem(item.name, null, null, [...getChildItems(item)], 'group')])
        : getItem(item.name, item.key, getIcon(item), getChildItems(item));
    }
    return getItem(getLink(item), item.key, getIcon(item));
  };

  useEffect(() => {
    setItems([...menuItems.map(item => getMenuItem(item, collapsed))]);
  }, [location, themeStore.$s.theme, collapsed]);

  const solveMenuScroll = scrollItem => {
    if (scrollItem) {
      const menuContainer = document.querySelector('.container_nav_bar');
      const domMenuKey = document.querySelector(`.${scrollItem}_scrollView`);
      const selectedMenuItemRect = domMenuKey.getBoundingClientRect();
      const menuContainerRect = menuContainer.getBoundingClientRect();
      const offsetTop = selectedMenuItemRect.top - menuContainerRect.top;
      if (offsetTop + selectedMenuItemRect.height > menuContainerRect.height) {
        menuContainer.scrollTop += offsetTop;
      } else if (offsetTop < 0) {
        menuContainer.scrollTop = offsetTop;
      }
    }
  };

  useEffect(() => {
    const [selectedMenuItem, ...resets] = selectedKeys;
    solveMenuScroll(selectedMenuItem);
  }, [selectedKeys]);

  const handlePassMessage = useCallback(event => {
    if (event.data.type === 'subToMainMsg') {
      const url = event.data.isInsertMainPrefix ? `/${containerRouterPrefix}${event.data.url}` : event.data.url;
      history.push(url);
      solveMenuScroll(event.data.data);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handlePassMessage);
    return () => window.removeEventListener('message', handlePassMessage);
  }, []);

  const getLevelKeysList = (menuItem) => {
    const key = {};
    const func = (menuSubItem, level = 1) => {
      menuSubItem.forEach((item) => {
        if (item.key) {
          key[item.key] = level;
        }
        if (item.children) {
          func(item.children, level + 1);
        }
      });
    };
    func(menuItem);
    return key;
  };

  const keyLevelList = getLevelKeysList(items);
  const onOpenChange = (keys) => {
    const currentOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (currentOpenKey !== undefined) {
      const repeatIndex = keys
        .filter((key) => key !== currentOpenKey)
        .findIndex((key) => keyLevelList[key] === keyLevelList[currentOpenKey]);
      setOpenKeys(
        keys
          .filter((_, index) => index !== repeatIndex)
          .filter((key) => keyLevelList[key] <= keyLevelList[currentOpenKey]), // 小于等于
      );
    } else {
      setOpenKeys(keys);
    }
  };

  // 判断屏幕尺寸
  useLayoutEffect(() => {
    //
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1280) { // 尺寸小于1280
        setCollapsedHidden(true);
        handleCollapseChange(true);
      } else {
        setCollapsedHidden(false);
        handleCollapseChange(false);
      }
    });

    // 首次小屏进入
    if (window.innerWidth < 1280) {
      setCollapsedHidden(true);
      handleCollapseChange(true);
    }
  }, []);

  useEffect(() => {
    let [prefix, firstKey, linkKey, childKey] = getEffectivePathname().split('/');
    // 例外
    if (childKey === 'clusterRole') {
      childKey = 'role';
    }
    if (childKey === 'clusterRoleBinding') {
      childKey = 'roleBinding';
    }
    if (linkKey === 'nodeManage' || linkKey === 'customResourceDefinition') {
      childKey = linkKey;
    }
    if (linkKey === 'clusterUser' || linkKey === 'clusterMember') {
      childKey = linkKey;
    }
    let result = menuItems.find(item => item.type === 'group' ? item.children.find(childItem => childItem.path.slice(1) === linkKey) : item.path.slice(1) === linkKey);
    if (result) {
      if (result.children) {
        if (linkKey === 'event' || linkKey === expandComponent.MonitoringDashboard) {
          childKey = linkKey;
        }
        setSelectedKeys([childKey]);
        window.screen.width < 1280 || collapsed ? setOpenKeys([]) : setOpenKeys([linkKey]);
      } else {
        setSelectedKeys([linkKey]);
        setOpenKeys([]);
      }
    } else {
      setSelectedKeys([]);
      setOpenKeys([]);
    }
  }, [location, collapsed]);

  const handleCollapseTrigger = () => {
    if (window.screen.width < 1280) { // 1280下禁止点击
      setCollapsedHidden(true);
      return;
    }
    handleCollapseChange(!collapsed); // 切换
  };

  const onSelectChange = (e) => {
    setSelectedKeys([e.key]);
  };

  return <Fragment>
    <Menu
      mode='inline'
      className='menu'
      openKeys={openKeys}
      selectedKeys={selectedKeys}
      onOpenChange={onOpenChange}
      onSelect={onSelectChange}
      inlineCollapsed={collapsed}
      items={items}
    />
    {!collapsedHidden && <div className='collapse_arrow' onClick={handleCollapseTrigger}>{!collapsed ? <LeftOutlined /> :
      <RightOutlined />}</div>}
  </Fragment>;
}