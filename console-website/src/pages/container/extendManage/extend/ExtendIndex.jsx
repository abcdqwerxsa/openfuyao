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

import { useStore } from 'openinula';
import { Space } from 'antd';
import ApplicationListLayout from '@/components/layouts/ApplicationListLayout';

export default function ExtendIndex() {
  const consolePluginStore = useStore('consolePlugins');

  // Extra column for extension: plugin toggle
  const extraColumns = [
    {
      title: '启动/停止界面',
      key: 'enablement',
      render: (_, record) => (
        <Space size="middle">
          <span>
            {consolePluginStore.$s.consolePlugins.filter(item => item.release === record.name && item.enabled).length}
            /
            {consolePluginStore.$s.consolePlugins.filter(item => item.release === record.name && !item.enabled).length}
          </span>
        </Space>
      ),
    },
  ];

  return (
    <ApplicationListLayout
      type="extension"
      extraColumns={extraColumns}
      pluginStore={consolePluginStore}
    />
  );
}