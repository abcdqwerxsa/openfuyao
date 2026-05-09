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

export default function TabComponent(params) {
  const items = [
    {
      key: '1',
      label: '仓库配置',
      children: <WarehouseConfiguration />,
    },
    {
      key: '2',
      label: '应用包管理',
      children: <ApplicationPackageManagement />,
    },
  ];
  return (
    <div style={{ marginBottom: '20px' }}>
      <Tabs items={items}></Tabs>
    </div>
  );
}
