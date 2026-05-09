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

export default function KubeLet({
  data,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title'>kubelet对存储操作</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="kubelet对存储操作的执行速率（operations/second）"
            data={solveBytesToMiB(data.kubelet_storage_operation_rate, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="kubelet_storage_rate"
            tooltip={<div className='tooltip_box'>
              <p>kubelet对存储操作的执行速率，按操作名称和卷插件分类统计，其中卷插件包括用于管理和访问存储资源的插件，如ConifgMap、EmptyDir、HostPath等。</p>
            </div>}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded ?
          <DataAreaChart
            title="kubelet组件对存储操作中出现的错误的速率（operations/second）"
            data={solveBytesToMiB(data.kubelet_storage_operation_error_rate, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            tooltip={<div className='tooltip_box'>
              <p>kubelet组件对存储操作中出现的错误的速率，按操作名称和卷插件分类统计，其中卷插件包括用于管理和访问存储资源的插件，如ConifgMap、EmptyDir、HostPath等。</p>
            </div>}
            id="kubelet_storage_error_rate"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>kubelet中PLEG重新检测所有pod的状态的间隔时长</p>
      {loaded
        ? <DataAreaChart
          title="kubelet中PLEG重新检测所有pod的状态的间隔时长（operations/second）"
          data={solveBytesToMiB(data.kubelet_pleg_relist_interval, false)}
          type="line"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          id="kubelet_pleg_relist"
          tooltip={<div className='tooltip_box'>
            <p>PLEG（Pod Lifecycle Event Generator）是kubelet的一个组件，负责监测和缓存Pod的生命周期事件。</p>
          </div>}
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>Kube API请求QPS</p>
      {loaded
        ? <DataAreaChart
          title="kubelet对kube-apiserver发起的HTTP请求（requests/second）"
          data={solveBytesToMiB(data.xxRequestRate, false)}
          type="line"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          id="kubelet_kube_api"
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>资源分析</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="CPU使用量（cores）"
            data={solveBytesToMiB(data.kubelet_cpu_usage, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="kubelet_cpu_usage"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title={`内存使用量（${solveUnitMonitor(data?.kubelet_memory_usage)}）`}
            data={solveBytesToMiB(data?.kubelet_memory_usage)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="kubelet_memory_usage"
            refreshFn={refreshFn}
            className='KubeLet'
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container KubeLet'>
      <div className='monitor_half each_half'>
        {loaded
          ? <DataAreaChart
            title="协程"
            data={data.kubelet_goroutines}
            type="line"
            className='KubeLet'
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="kubelet_goroutines"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
      </div>
    </div>
  </>;
}