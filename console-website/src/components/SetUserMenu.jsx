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
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'openinula';
import { useLocation, Link } from 'inula-router';
import '@/styles/components/setMenu.less';
import { getEffectivePathname } from '@/utils/basePath';

function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}


// 渲染菜单项
const items = [
  getItem(<Link to='/setting/userinfo'>基本信息</Link>, 'userinfo', <UserOutlined />),
  getItem(<Link to='/setting/password'>密码设置</Link>, 'password', <LockOutlined />),
];
export default function SetUserMenu() {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const path = getEffectivePathname().split('/');
    let key = 'userinfo';
    const linkKey = path[path.length - 1]; // 取后缀后第一个路由
    switch (linkKey) {
      case 'userinfo': {
        key = 'userinfo';
        break;
      }
      case 'password': {
        key = 'password';
        break;
      }
      default: {
        key = 'userinfo';
      }
    }
    setSelectedKeys([key]);
  }, [location]);

  return <Menu
    mode='inline'
    className='user_menu'
    selectedKeys={selectedKeys}
    items={items}
  />;
}