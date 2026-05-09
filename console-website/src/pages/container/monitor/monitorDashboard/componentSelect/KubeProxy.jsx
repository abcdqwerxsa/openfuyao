/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import DataAreaChart from '@/components/echarts/DataAreaChart';
import { solveBytesToMiB, solveUnitMonitor } from '@/tools/utils';
import SkeletonArea from '@/components/SkeletonArea';

export default function KubeProxy({
  data,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title'>网络编程的操作速率</p>
      {loaded
        ? <DataAreaChart
          title="kube-proxy在进行网络编程的操作速率（opertations/second）"
          data={data.kube_proxy_network_programming_rate}
          type="area"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          id="kube_proxy_network_programming_rate"
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>Kube API请求QPS</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="kube-proxy对kube-apiserver发起的HTTP请求（requests/second）"
            data={solveBytesToMiB(data.xxRequestRate, false)}
            type="line"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="kube_proxy_kube_api"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container KubeProxy'>
      <p className='chart_title'>资源分析</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            className='KubeProxy'
            title="CPU使用量（cores）"
            data={solveBytesToMiB(data.kube_proxy_cpu_usage, false)}
            type="line" id="proxy_kube_proxy_cpu_usage"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title={`内存使用量（${solveUnitMonitor(data?.kube_proxy_memory_usage)}）`}
            data={solveBytesToMiB(data?.kube_proxy_memory_usage)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="proxy_kube_proxy_memory_usage"
            className='KubeProxy'
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container KubeProxy'>
      <div className='monitor_half each_half'>
        {loaded
          ? <DataAreaChart
            title="协程"
            data={data.kube_proxy_goroutines}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            className='KubeProxy'
            handleShowScreen={handleShowScreen}
            id="proxy_kube_proxy_goroutines"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
      </div>
    </div>
  </>;
}