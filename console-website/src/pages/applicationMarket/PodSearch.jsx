/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Select, Input } from 'antd';

const { Search } = Input;
export function PodSearch({ helmChartListData, onSearchFn }) {
  function handleSearch(e) {
    getHelmChartListData(e);
  }
  return (
    <div className='pod_search'>
      <div>共有{helmChartListData.length}个应用</div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Search placeholder='搜索pod名称' onSearch={handleSearch} />
        <Select
          value='10'
          style={{ width: '160px' }}
          options={[
            { value: '10', label: '近10分钟' },
            { value: '20', label: '近20分钟' },
            { value: '30', label: '近30分钟' },
          ]}
        />
      </div>
    </div>
  );
}
