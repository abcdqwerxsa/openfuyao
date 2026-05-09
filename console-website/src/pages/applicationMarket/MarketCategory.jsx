/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Banner } from './Banner';
import { ApplicationList } from './ApplicationList';
import { ApplicationType } from './ApplicationType';
import { Pagination, ConfigProvider, message } from 'antd';
import '@/styles/applicationMarket/index.less';
import { useState, useEffect, useStore } from 'openinula';
import zhCN from 'antd/es/locale/zh_CN';
import { getHelmChartList } from '@/api/applicationMarketApi';
import { useLocation, useParams } from 'inula-router';
import qs from 'query-string';

const defaultPageSize = 50;
export default function MarketCategory() {
  const location = useLocation();
  const { scene, isFuyaoExtension, isCompute } = useParams();
  const [total, setTotal] = useState(0);
  const [helmChartListData, setHelmChartListData] = useState([]);
  const [chart, setChart] = useState('');
  const [sortType, setSortType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [sceneList, setSceneList] = useState(scene && scene !== 'null' ? [decodeURIComponent(scene)] : []);
  const [sourceList, setSourceList] = useState([]);
  const [isComputingEngine, setIsComputingEngine] = useState(isCompute === 'true');
  const [isSelectExtensionComponent, setIsSelectExtensionComponent] = useState(isFuyaoExtension === 'true' ? 'openfuyao-extension' : '');
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  const getHelmChartListData = async () => {
    let updatedSceneList = sceneList.filter(filterItem => filterItem !== 'undefined' && filterItem !== 'null');
    if (isComputingEngine) {
      updatedSceneList.push('compute-power-engine-plugin');
    };
    try {
      const params = {
        chart,
        sortType,
        sourceList,
        isSelectExtensionComponent,
        sceneList: updatedSceneList,
      };
      const res = await getHelmChartList(params, currentPage, limit);
      setHelmChartListData(res.data.data.items);
      setTotal(res.data.data.totalItems);
    } catch (error) {
      messageApi.error(error.response.data.msg);
    }
  };

  // 与来源筛选一致：只更新查询状态，实际拉取由统一的 getHelmChartListData 负责
  const handleSearchFn = (name) => {
    setChart(name || '');
    setCurrentPage(1);
  };

  const handleInputChartFn = (e) => {
    setChart(e);
    setCurrentPage(1);
  };
  const handleSelectFn = (type) => {
    setSortType(type);
    setCurrentPage(1);
  };

  const handleChange = (page, pageSize) => {
    setCurrentPage(page);
    setLimit(pageSize);
  };

  const handleSelectType = (list) => {
    setSceneList(list);
    setCurrentPage(1);
  };

  const handleSelectExtensionComponent = (e) => {
    setIsSelectExtensionComponent(e);
    setCurrentPage(1);
  };

  const handleSelectSource = (list) => {
    setSourceList(list);
    setCurrentPage(1);
  };

  const handleComputingEngine = (bool) => {
    setIsComputingEngine(bool);
    setCurrentPage(1);
  };
  const handleClearFilter = () => {
    setSourceList([]);
    setSceneList([]);
    setIsSelectExtensionComponent('');
    setIsComputingEngine(false);
    setCurrentPage(1);
  };
  useEffect(() => {
    getHelmChartListData();
  }, [
    chart,
    currentPage,
    limit,
    sortType,
    isSelectExtensionComponent,
    sourceList,
    isComputingEngine,
    sceneList,
  ]);

  useEffect(() => {
    if (location.state?.isQuery) {
      setChart(location?.state?.isQuery.trim());
    }
  }, [location.state?.isQuery]);
  return (
    <div style={{ height: 'calc(100vh - 100px)' }}>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <Banner />
      <div style={{ display: 'flex' }}>
        <ApplicationType
          sceneCheckedList={sceneList}
          sourceCheckedList={sourceList}
          extensionChecked={isSelectExtensionComponent === 'openfuyao-extension'}
          computingChecked={isComputingEngine}
          onSelectSource={handleSelectSource}
          onSelectType={handleSelectType}
          onExtensionComponent={handleSelectExtensionComponent}
          onComputingEngine={handleComputingEngine}
          onClearFilter={handleClearFilter}
        />
        <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(100vw - 200px)' }}>
          <ApplicationList
            total={total}
            searchName={chart}
            sortType={sortType || 'name'}
            helmChartListData={helmChartListData}
            onSearchFn={handleSearchFn}
            onSelectFn={handleSelectFn}
            onInputChartFn={handleInputChartFn}
          />
          < ConfigProvider locale={zhCN}>
            <Pagination
              className='page'
              showTotal={(totalNumber) => `共${totalNumber}条`}
              defaultPageSize={limit}
              showSizeChanger={false}
              showQuickJumper={true}
              total={total}
              onChange={handleChange}
            ></Pagination>
          </ConfigProvider>
        </div>
      </div>
    </div >
  );
}

