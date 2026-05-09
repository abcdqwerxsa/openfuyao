/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Tabs } from 'antd';
import WarehouseConfiguration from '@/pages/applicationMarket/component/WarehouseConfiguration';
import ApplicationPackageManagement from '@/pages/applicationMarket/component/ApplicationPackageManagement';
import { containerRouterPrefix } from '@/constant.js';
import { Breadcrumb } from 'antd';
import { Link, useParams, useHistory } from 'inula-router';
import { useEffect, useState, useStore } from 'openinula';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/stash.less';

export default function TabComponent(params) {
  const history = useHistory();
  const { tabIndex } = useParams();
  const [activeIndex, setActiveIndex] = useState('wareHouse');
  const themeStore = useStore('theme');
  const handleChangeTabIndex = (key) => {
    setActiveIndex(key);
    history.push(`/${containerRouterPrefix}/appMarket/stash/${key}`);
  };
  const items = [
    {
      key: 'wareHouse',
      label: '仓库配置',
      children: <WarehouseConfiguration />,
      path: `/${containerRouterPrefix}/appMarket/stash/1`,
    },
    {
      key: 'applicationPackage',
      label: '包管理',
      children: <ApplicationPackageManagement />,
      path: `/${containerRouterPrefix}/appMarket/stash/2`,
    },
  ];

  useEffect(() => {
    setActiveIndex(tabIndex);
  }, [tabIndex]);
  return (
    <div className='configmap'>
      <BreadCrumbCom
        items={[
          { title: '仓库配置', path: `/${containerRouterPrefix}/appMarket/stash/1`, disabled: true },
          { title: '仓库', path: `/${containerRouterPrefix}/appMarket/stash/1` },
        ]}
      />
      <div style={{ marginBottom: '20px' }}>
        <Tabs
          activeKey={activeIndex}
          onChange={handleChangeTabIndex}
          items={items}
        />
      </div>
    </div>
  );
}