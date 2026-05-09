/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Link, useHistory } from 'inula-router';
import { useEffect, useState, useStore } from 'openinula';
import '@/styles/components/navbar.less';
import { containerRouterPrefix, usermanageRouterPrefix } from '@/constant.js';
import { withBasePath, getEffectivePathname } from '@/utils/basePath';
import {
  QuestionCircleOutlined,
  UserOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Popover,
  Space,
  Button,
  message,
  Switch,
} from 'antd';
import { ResponseCode, docAddress, DOC_SITE_ROOT } from '@/common/constants';
import { logout } from '@/api/loginApi';
import { firstAlphabetUp } from '@/tools/utils';
import copilot from '@/assets/images/navbarCopilot.png';
import clusterIcon from '@/assets/images/topIcon/clusterIcon.png';
import userIcon from '@/assets/images/topIcon/userIcon.png';
import openFuyaoLogo from '@/assets/images/openFuyaoLogo.png';
import homeLogo from '@/assets/images/home/homeLogo.png';
import { HomeFilled } from '@ant-design/icons';
function OptionMenu({ onLogout }) {
  const [themeCheck, setThemeCheck] = useState(localStorage.theme || 'light');
  const themeStore = useStore('theme');

  const handleThemeCheck = (checked) => {
    const nowTheme = checked ? 'dark' : 'light';
    setThemeCheck(nowTheme);
    themeStore.$a.setTheme({ theme: nowTheme });
  };

  return (
    <Space style={{ flexDirection: 'column' }}>
      <Link to='/setting/userinfo'>
        <Button type='link'>用户设置</Button>
      </Link>
      <Button type='link' onClick={onLogout}>
        退出登录
      </Button>
    </Space>
  );
}

export default function NavBar() {
  const history = useHistory();
  const terminalStore = useStore('terminal');
  const userStore = useStore('user');
  const [key, setKey] = useState('containerPlatform');
  const [messageApi, contextHolder] = message.useMessage();
  // 挂载扩展组件
  const consolePluginStore = useStore('consolePlugins');
  const themeStore = useStore('theme');
  const [themeCheck, setThemeCheck] = useState(themeStore.$s.theme); // 选中进入深色
  const [navbarItems, setNavbarItems] = useState([]);

  useEffect(() => {
    const handleLocationChange = () => {
      const [prefix, firstName] = getEffectivePathname().split('/');
      let consolePluginLocation = [];
      consolePluginStore.$s.consolePlugins.map(({ pluginName }) => {
        let obj = {};
        consolePluginLocation.push(obj[pluginName] = pluginName);
      });
      const locationMap = {
        containerPlatform: 'containerPlatform',
        applicationMarket: 'applicationMarket',
        ...consolePluginLocation,
      };
      let temporaryKey = '';
      firstName.split('_').map((item, index) => {
        index ? temporaryKey += firstAlphabetUp(item) : temporaryKey += item;
      });
      let baseNavItems = [];
      consolePluginStore.$s.consolePlugins.map(item => {
        baseNavItems.push({ ...item, name: item.pluginName, path: item.pluginName });
      });
      baseNavItems.push({
        enabled: true,
        entrypoint: '/',
        name: 'userManagement',
        displayName: '用户管理',
        path: `${usermanageRouterPrefix}/user`,
      });
      const otherItems = baseNavItems.filter(item => item.name !== 'ai-copilot');
      const aiItems = baseNavItems.filter(item => item.name === 'ai-copilot');
      setNavbarItems([...otherItems, ...aiItems]);
      temporaryKey = locationMap[temporaryKey];
      setKey(temporaryKey);
    };

    const observer = new MutationObserver(() => {
      handleLocationChange();
    });

    observer.observe(document, { subtree: true, childList: true });

    return () => {
      observer.disconnect();
    };
  }, [consolePluginStore.$s.consolePlugins]);

  // 退出登录
  const handleLogout = async () => {
    logout()
      .then(res => {
        if (res.status === ResponseCode.NoContent) {
          messageApi.success('退出成功！');
          sessionStorage.removeItem('cluster');
          localStorage.clear();
          setTimeout(() => {
            window.location.href = withBasePath('/rest/auth/login');
          }, 1000);
        }
      })
      .catch(err => {
        messageApi.error('退出失败');
      });
  };

  const goDoc = () => {
    let path = `${DOC_SITE_ROOT}/quick_start.html`;
    docAddress.forEach(item => {
      if (window.location.href.includes(item.path)) {
        path = item.address;
      }
    });
    window.open(path, '_blank');
  };
  // 控制黑夜与白天模式
  const handleThemeCheck = (checked) => {
    const nowTheme = checked === 'dark' ? 'dark' : 'light';
    setThemeCheck(nowTheme);
    themeStore.$a.setTheme({ theme: nowTheme });
  };

  // logo赋值
  const getLogo = (data) => {
    switch (data.name) {
      case 'userManagement':
        return <img className='top_icon_size' src={userIcon} style={{ marginRight: '6px' }} />;
      case 'containerPlatform':
        return <img className='top_icon_size' src={openFuyaoLogo} style={{ marginRight: '6px' }} />;
      case 'multicluster':
        return <img className='top_icon_size' src={clusterIcon} style={{ marginRight: '6px' }} />;
      case 'ai-copilot':
        return <img className='top_icon_size' src={copilot} style={{ marginRight: '6px' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const handleCloseTerminal = () => {
    terminalStore.$a.setTerminalOpen(false);
  };

  return (
    <div className={`nav`}>
      <div className='flex_top'>
        <Link to='/home' onClick={handleCloseTerminal}>
          <img src={homeLogo} className='homeLogo'/>
        </Link>
        <div className='splitLine_top'></div>
        <HomeFilled style={{ color: '#fff', cursor: 'pointer' }} onClick={() => history.push(`/${containerRouterPrefix}`)} />
      </div>
      <div className='nav_tools'>
        <div className='navList'>
          {
            navbarItems.filter(item => item.entrypoint === '/' && item.enabled).map((item) => (
              <Link to={`/${item.path}`} className={key === item.name ? 'active' : ''}>
                {getLogo(item)}
                {item.displayName}
              </Link>
            ))
          }
        </div>
        <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
          {contextHolder}
        </div>
        <Popover
          placement='bottom'
          content={<Button type='link' onClick={goDoc}>帮助文档</Button>}
        >
          <div onClick={goDoc}>
            <QuestionCircleOutlined className='tool_icon' />
          </div>
        </Popover>
        <div className='tool_theme'>
          {themeCheck === 'light' ? <MoonOutlined className='tool_icon' onClick={() => handleThemeCheck('dark')} /> :
            <SunOutlined className='tool_icon' onClick={() => handleThemeCheck('light')} />}
        </div>
        <Popover
          placement='bottom'
          content={<OptionMenu onLogout={handleLogout} />}
          getPopupContainer={() => document.getElementById('container')}
        >
          <div className='user_info'>
            <Avatar icon={<UserOutlined />} className='avatar' />
            <p>{userStore.$s.user.name}</p>
          </div>
        </Popover>
      </div>
    </div >
  );
}
