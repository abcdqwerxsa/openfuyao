/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useEffect, useRef, useStore } from 'openinula';
import * as echarts from 'echarts';
import { useHistory } from 'inula-router';
import { filterOverviewRouter, filterOverviewType } from '@/utils/common';

export default function OverviewEcharts({
  overOption,
  echartHeight,
  idProps,
  type,
}) {
  const chartRef = useRef(null);
  const collapsedStore = useStore('collapsed');

  const history = useHistory();
  useEffect(() => {
    const chart = echarts.init(chartRef.current);
    chartRef.current = chart;
    chart.on('click', params => {
      if (params.componentType === 'series') {
        history.push({
          pathname: filterOverviewRouter(filterOverviewType(idProps, params), params).url,
          state: { status: filterOverviewRouter(filterOverviewType(idProps, params), params).status },
        });
      }
    });
    window.addEventListener('resize', () => {
      if (chart && type !== 'circle') {
        chart.resize();
      }
    });
    return () => {
      chart.dispose(); // 清理chart实例
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.resize();
    }
  }, [collapsedStore.$s.collapsed]);

  useEffect(() => {
    const chart = chartRef.current;
    if (chart && overOption) {
      chart.setOption(overOption);
    }
  }, [overOption]);
  return <div className='overviewEcharts' ref={chartRef} style={{ width: '100%', height: echartHeight }}></div>;
};