/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import ApplicationRecommetItem from './ApplicationRecommetItem';
import { Select, Input, message } from 'antd';
import { useStore } from 'openinula';
import EmptyData from '@/components/EmptyData';
import ToastMsg from '@/components/ToastMsg';

const limitSearch = 53;
const { Search } = Input;
export function ApplicationList({
  helmChartListData,
  searchName,
  sortType = 'name',
  onSearchFn,
  onSelectFn,
  onInputChartFn,
  total,
}) {
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  const handleSearch = (repoName) => {
    onSearchFn(repoName);
  };

  const handleSelect = (e) => {
    onSelectFn(e);
  };

  const handleInput = (e) => {
    if (e.target.value.length >= limitSearch) {
      messageApi.error(`搜索名称不能超过${limitSearch}个字符`);
      return;
    }
    onInputChartFn(e.target.value);
  };
  return (
    <div>
      <ToastMsg contextHolder={contextHolder} />
      <div className='pod_search'>
        <div style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>共{total}个应用</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Search
            value={searchName}
            placeholder='搜索应用名称'
            onSearch={handleSearch}
            onChange={handleInput}
            maxLength={limitSearch}
          />
          <Select
            value={sortType}
            style={{ width: '160px' }}
            onChange={handleSelect}
            options={[
              { value: 'name', label: '按名称排序' },
              { value: 'time', label: '按时间排序' },
            ]}
          />
        </div>
      </div>
      {helmChartListData.length !== 0 ?
        <div className='application_list'>
          {helmChartListData.map((el) => (
            <ApplicationRecommetItem itemMeta={el.metadata} repo={el.repo} types={true} />
          ))}
        </div>
        :
        <EmptyData />}
    </div>
  );
}
