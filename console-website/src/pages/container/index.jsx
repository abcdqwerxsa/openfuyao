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

import '@/styles/pages/containerIndex.less';
import '@/styles/components/namespaceBar.less';
import MenuBar from '@/components/Menu.jsx';
import ContainerRouters from '@/routes/containerRouters.jsx';
import NamespaceBar from '@/components/NamepspaceBar';
import { useState, useEffect, useStore, Fragment } from 'openinula';
import clusterIcon from '@/assets/images/cluster_icon.png';
import { getClustersList } from '@/api/clusterApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory } from 'inula-router';
import '@/styles/components/navbar.less';
import { getEffectivePathname } from '@/utils/basePath';
import { containerRouterPrefix } from '@/constant.js';
import alertNoData from '@/assets/images/navbarAlert.png';
import { filterColor, filterAlertStatus } from '@/utils/common';
import dayjs from 'dayjs';
import { getAlertOptions } from '@/api/containerAlertApi';
import fastDeploy from '@/assets/images/fastDeploy.png';
import { AppstoreAddOutlined, AlertOutlined, CodeOutlined } from '@ant-design/icons';
import { Popover, Space, Button, Select, Checkbox, Timeline, Modal, Tooltip, message } from 'antd';
import NoPermissionsModal from '@/components/NoPermissionsModal';
import TerminalNewModal from '@/components/webTerminal/TerminalNewModal';
import { checkTerminalAccess } from '@/api/terminalApi';

let alertNum = 0;
function AlertBox({ onJump }) {
  const [critical, setCritical] = useState(0);
  const [warning, setWarning] = useState(0);
  const [info, setInfo] = useState(0);
  const [alertList, setAlertList] = useState([]);
  const [alertTimeLineItems, setAlertTimeLineItems] = useState([]);
  const history = useHistory();
  const themeStore = useStore('theme');
  const toAlarmPage = () => {
    history.push(`/${containerRouterPrefix}/alarm/alarmIndex`);
    onJump();
  };

  useEffect(() => {
    getAlertLists();
  }, []);

  const getAlertLists = async () => {
    let timeLine = [];
    const res = await getAlertOptions();
    let _alertList = [];
    if (res.status === ResponseCode.OK) {
      setAlertList(res.data);
      let _filterData = res.data.filter(
        (item) => item.status.state === 'active'
      );
      alertNum = _filterData.length;
      _filterData = _filterData.sort((a, b) => dayjs(b.startsAt).unix() - dayjs(a.startsAt).unix());
      _filterData.slice(0, 5).map((item) => {
        let _resourceType = '';
        if (item.labels.prometheus) {
          _resourceType = 'prometheus';
        }
        if (item.labels.loki) {
          _resourceType = 'loki';
        }
        let _color = '';
        let _style = {};
        let _level = {};
        if (item.labels.severity === 'warning') {
          _level = '警告';
          _color = '#f4840c';
          _style = {
            color: '#f4840c',
            background: '#fffaf3ff',
            border: '1px solid #f4840c',
          };
        } else if (item.labels.severity === 'critical') {
          _level = '严重';
          _color = '#f5595b';
          _style = {
            color: '#f5595b',
            background: '#fff2f0ff',
            border: '1px solid #f5595b',
          };
        } else {
          _level = '提示';
          _color = '#4b8bea';
          _style = {
            color: '#4b8bea',
            background: '#f0f8ff',
            border: '1px solid #4b8bea',
          };
        }

        _alertList.push({
          name: item.labels.alertname ? item.labels.alertname : '--',
          level: item.labels.severity ? item.labels.severity : '--',
          time: item.startsAt
            ? dayjs(item.startsAt).format('YYYY-MM-DD HH:mm:ss')
            : '--',
          resource: _resourceType,
          color: _color,
          style: _style,
          desc: item.annotations.description ? item.annotations.description : '--',
          summary: item.annotations.summary ? item.annotations.summary : '--',
          labels: item.labels,
        });
      });
      setCritical(_filterData.filter((item) => item.labels.severity === 'critical').length);
      setWarning(_filterData.filter((item) => item.labels.severity === 'warning').length);
      setInfo(_filterData.filter((item) => item.labels.severity === 'info').length);
    }
    _alertList.map((item) => {
      timeLine.push({
        color: item.color,
        children: (
          <Link
            className='alert_hover'
            to={{ pathname: `/${containerRouterPrefix}/alarm/alarmIndex/detail/${item.name}`, state: { currentdetail: item } }}
            onClick={toAlarmPage}
          >
            <div className='alert_timeLine_box'>
              <p className='alert_timeLine_box_level' style={item.style}>
                {filterAlertStatus(item.level)}
              </p>
              <div className='alert_timeLine_box_content'>
                <p className='alert_timeLine_box_content_title'>告警名称：</p>
                <p className='alert_timeLine_box_content_value'>{item.name}</p>
              </div>
              <div className='alert_timeLine_box_content'>
                <p className='alert_timeLine_box_content_title'>告警源：</p>
                <p className='alert_timeLine_box_content_value'>
                  {item.resource}
                </p>
              </div>
              <div className='alert_timeLine_box_content'>
                <p className='alert_timeLine_box_content_title'>触发时间：</p>
                <p className='alert_timeLine_box_content_value'>{item.time}</p>
              </div>
            </div>
          </Link>
        ),
      });
    });
    let _timeline = [
      {
        color: '#89939b',
        children: (
          <p style={{ fontSize: '12px', color: '#89939b' }}>
            更多信息请查看告警详情
          </p>
        ),
      },
    ];
    setAlertTimeLineItems([...timeLine.concat(_timeline)]);
  };

  return (
    <div className='alarm-notification-content'>
      <div className='alarm-notification-content-group'>
        <div className='alarm-notification-content-single'>
          <p className='alarm-notification-content-single-title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>严重：</p>
          <p className='single-count1'>{critical}</p>
        </div>
        <div className='alarm-notification-content-single'>
          <p className='alarm-notification-content-single-title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>警告：</p>
          <p className='single-count2'>{warning}</p>
        </div>
        <div className='alarm-notification-content-single'>
          <p className='alarm-notification-content-single-title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>提示：</p>
          <p className='single-count3'>{info}</p>
        </div>
      </div>
      <img src={alertNoData} className='alertImg' alt="" style={{ display: alertList.length === 0 ? 'block' : 'none' }} />
      <p className='alertTip' style={{ display: !alertList.length > 0 ? 'block' : 'none' }}>暂无告警信息</p>
      <Timeline items={alertTimeLineItems} style={{ display: alertList.length > 0 ? 'block' : 'none' }} />
      <div className='alarm-notification-content-bottom'>
        <Button
          type='link'
          className='alarm-notification-content-bottom-button'
          onClick={toAlarmPage}
        >
          告警详情
        </Button>
      </div>
    </div>
  );
}

function DeployBox({ onJump }) {
  const [rememberChecked, setRememberChecked] = useState(localStorage.getItem('rememberChecked') || false);
  const history = useHistory();

  const handleRemember = (e) => {
    setRememberChecked(e.target.checked);
    localStorage.setItem('rememberChecked', e.target.checked); // 将值存储到 localStorage
  };

  const jumpToDeploy = () => {
    history.push(`/${containerRouterPrefix}/appMarket/oneClickDeploy`);
    onJump();
  };
  return (
    <div className='deploy_container'>
      <div style={{ display: 'flex', gap: '22px' }}>
        <div>
          <img src={fastDeploy} style={{ width: '128px', height: '138px' }} />
        </div>
        <div className='deploy_content'>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            YAML一键部署
          </div>
          <div style={{ color: '#89939b' }}>
            使用YAML文件，一键部署符合Kubernetes标准的资源
          </div>
          <div style={{ color: '#89939b' }}>
            <Checkbox onChange={handleRemember} checked={rememberChecked}>
              不再提示
            </Checkbox>
          </div>
        </div>
      </div>
      <div className='btn_deploy'>
        <Button
          className='primary_btn'
          onClick={jumpToDeploy}
        >
          前往部署
        </Button>
      </div>
    </div>
  );
}
export default function ContainerPlatFormIndex() {
  const [openNotification, setOpenNotification] = useState(false);
  const [openDeploy, setOpenDeploy] = useState(false);
  const themeStore = useStore('theme');
  const terminalStore = useStore('terminal');
  const userStore = useStore('user');
  const collapsedStore = useStore('collapsed');
  const [collapsed, setCollapsed] = useState(false); // 折叠
  const [noPermissionsModalOpen, setNoPermissionsModalOpen] = useState(false); // 无权限弹窗
  const [newTerminalModal, setNewTerminalModal] = useState(false); // 终端重复
  const [isShow, setIsShow] = useState(false);
  const [clusterOption, setClusterOption] = useState();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [clusterName, setClusterame] = useState(sessionStorage.getItem('cluster'));
  const handleCollapseTrigger = (status) => {
    setCollapsed(status); // 切换
    // 存入storage
    localStorage.setItem('collapsed', status);
    collapsedStore.$a.setCollapsed(status);
  };

  const namespacedLinkKeys = ['workload', 'network', 'configuration', 'userManage'];
  const namespacedChildKeys = ['limitRange', 'resourceQuota', 'pvc'];
  const handleChangeCluser = (value) => {
    setClusterame(value);
    sessionStorage.setItem('cluster', value);
    window.location.reload();
  };
  const filterOption = (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
  const getClusters = async () => {
    const res = await getClustersList();
    if (res.status === ResponseCode.OK) {
      let option = [];
      if (Object.prototype.hasOwnProperty.call(res.data, 'info')) {
        Object.keys(res.data.info).map(item => {
          option.push({
            labe: item,
            value: item,
          });
        });
      }
      setClusterOption(option);
    }
  };
  // 通知Popover关闭
  const closeNotification = () => {
    setOpenNotification(false);
  };
  const handleOpenChange = (newOpen) => {
    setOpenNotification(newOpen);
  };
  const handleCancel = () => {
    setOpenNotification(false);
  };

  const goToDeploy = () => {
    setOpenDeploy(false);
  };

  const handleDeploy = (newopen) => {
    if (localStorage.getItem('rememberChecked') === 'true') {
      history.push(
        `/${containerRouterPrefix}/appMarket/oneClickDeploy`
      );
    } else {
      setOpenDeploy(true);
    }
  };

  const handleCloseDeploy = () => {
    setOpenDeploy(false);
  };

  useEffect(() => {
    getClusters();
    getAlertList();
  }, []);
  useEffect(() => {
    const handleLocationChange = () => {
      const [prefix, firstKey, linkKey, childKey] = getEffectivePathname().split('/');
      setIsShow(namespacedLinkKeys.find(item => item === linkKey) !== undefined ||
        namespacedChildKeys.find(item => item === childKey) !== undefined);
    };

    const observer = new MutationObserver(() => {
      handleLocationChange();
    });

    observer.observe(document, { subtree: true, childList: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleClosePermissionModal = () => {
    setNoPermissionsModalOpen(false);
  };

  const handleCancelNewTerminal = () => {
    setNewTerminalModal(false);
  };

  const handleOkNewTerminal = () => {
    terminalStore.$a.setTerminalInit({ type: 'cluster', name: sessionStorage.getItem('cluster') });
    terminalStore.$a.setTerminalScreenSize('middle');
    terminalStore.$a.setTerminalOpen(false);
    setTimeout(() => {
      terminalStore.$a.setTerminalOpen(true);
    });
    setNewTerminalModal(false);
  };

  const checkPermissions = async () => {
    try {
      const permissionsRes = await checkTerminalAccess(`/user/${userStore.$s.user.name}/terminal`);
      if (permissionsRes.data.Code === ResponseCode.OK) {
        if (terminalStore.$s.isOpen) {
          setNewTerminalModal(true);
        } else {
          terminalStore.$a.setTerminalInit({ type: 'cluster', name: sessionStorage.getItem('cluster') });
          terminalStore.$a.setTerminalScreenSize('middle');
          terminalStore.$a.setTerminalOpen(true);
        }
      }
      if (permissionsRes.data.Code === ResponseCode.Forbidden) {
        setNoPermissionsModalOpen(true);
      }
      if (permissionsRes.data.Code === ResponseCode.InternalServerError) {
        messageApi.error('服务错误');
      }
    } catch (e) {
      if (e.response.data.Code === ResponseCode.Forbidden) {
        setNoPermissionsModalOpen(true);
      } else if (e.response.data.Code === ResponseCode.InternalServerError) {
        messageApi.error('服务错误');
      } else {
        messageApi.error('调用检查权限接口失败！');
      }
    }
  };

  useEffect(() => {
    const collapsedStroage = localStorage.getItem('collapsed');
    if (collapsedStroage === 'true') {
      setCollapsed(true);
    }
  }, []);

  return <Fragment>
    <div className={`container_platform_box ${themeStore.$s.theme === 'dark' ? 'dark_box' : ''}`}>
      {contextHolder}
      <div className='container_platform_box_cluster_top'>
        <div className='container_platform_box_cluster_namespace'>
          <div className='clusterbar namespace_bar'>
            <img className='clusterbar_img' src={clusterIcon} alt="" />
            <p className='label'>集群：</p>
            <Select
              value={clusterName}
              showSearch
              filterOption={filterOption}
              popupMatchSelectWidth={false}
              popupClassName='namespace_popup_options'
              options={clusterOption}
              onChange={handleChangeCluser}
              getPopupContainer={() => document.getElementById('container')}
            />
          </div>
          {isShow && <NamespaceBar />}
        </div>
        <div className='nav_tools'>
          <Popover
            content={
              <div style={{ margin: '4px 8px' }}>
                <p>kubectl命令行工具</p>
              </div>
            }
            placement='bottom'
          >
            <CodeOutlined className='kubetcl_console_btn' style={{ color: themeStore.$s.theme === 'dark' ? '#fff' : '#333', fontSize: 20 }} onClick={checkPermissions} />
          </Popover>
          <Popover
            content={
              <div style={{ margin: '4px 8px' }}>
                <p>一键部署</p>
              </div>
            }
            placement='bottom'
          >
            <AppstoreAddOutlined style={{ color: themeStore.$s.theme === 'dark' ? '#fff' : '#333', fontSize: 20 }} className='tool_icon appStore' rotate={180} onClick={handleDeploy} />
          </Popover>
          <Modal open={openDeploy} onCancel={handleCloseDeploy} className='deployTopModal' footer={[]} mask={false}>
            <DeployBox onJump={goToDeploy} />
          </Modal>
          <Popover
            placement='bottom'
            content={
              <div style={{ margin: '4px 8px' }}>
                <p>告警通知</p>
              </div>
            }
          >
            <AlertOutlined className='tool_icon nav_tools_alert' style={{ color: themeStore.$s.theme === 'dark' ? '#fff' : '#333', fontSize: 20 }} onClick={handleOpenChange} />
          </Popover>
          <p className='alertNum' style={{ color: 'red', fontSize: 12, display: alertNum > 0 ? 'block' : 'none' }}>{alertNum > 999 ? 999 : alertNum}</p>
          <p className='alertNumPlus' style={{ color: 'red', fontSize: 12, display: alertNum > 999 ? 'block' : 'none' }}>+</p>
          <Modal title="告警" getContainer={false} forceRender open={openNotification} onCancel={handleCancel} className='alertTopModal' footer={[]} mask={false}>
            <AlertBox onJump={closeNotification} />
          </Modal>
        </div>
      </div>
      <div className='container_platform_box_content'>
        <div className={collapsed ? 'container_nav_bar collapse_self_bar' : 'container_nav_bar'}>
          <MenuBar collapsed={collapsed} handleCollapseChange={handleCollapseTrigger} />
        </div>
        <div className={collapsed ? 'container_content collapse_self_content' : 'container_content'}>
          {/* 后续根据路由取值隐藏该命名空间 */}

          <ContainerRouters />
        </div>
      </div>
      <NoPermissionsModal open={noPermissionsModalOpen} handleOpen={handleClosePermissionModal} />
      <TerminalNewModal open={newTerminalModal} handleOk={handleOkNewTerminal} cancelFn={handleCancelNewTerminal} />
    </div>
  </Fragment>;
}