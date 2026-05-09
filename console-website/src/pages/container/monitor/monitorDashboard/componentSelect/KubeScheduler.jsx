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

export default function KubeScheduler({
  data,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title'>概览</p>
      {loaded
        ? <DataAreaChart
          title="Pending Pod的数量"
          data={data.kube_scheduler_pending_pods_count}
          type="area"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          tooltip={<div className='tooltip_box'>
            <p>Pending Pod的数量</p>
            <p>unschedulable：表示不可调度的Pod的数量。</p>
            <p>backoff：表示backoffQ的Pod的数量。</p>
            <p>active：表示actvieQ的Pod的数量。</p>
          </div>}
          id="kube_scheduler_pending_pods_count"
          refreshFn={refreshFn}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      {loaded
        ? <DataAreaChart
          title="调度器尝试成功调度Pod的次数"
          data={data.kube_scheduler_pod_scheduling_attempts}
          type="area"
          rangeColorProps={propsColor}
          tooltip={<div className='tooltip_box'>
            <p>kube-scheduler尝试调度Pod的次数</p>
          </div>}
          handleShowScreen={handleShowScreen}
          id="kube_scheduler_pod_scheduling_attempts"
          refreshFn={refreshFn}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>Kube API 请求QPS</p>
      {loaded
        ? <DataAreaChart
          title="kube-scheduler对kube-apiserver组件发起的HTTP请求（requests/second）"
          data={solveBytesToMiB(data.xxRequestRate, false)}
          type="line"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          id="kube_scheduler_kube_api_request_rate"
          refreshFn={refreshFn}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>资源分析</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="CPU使用量（cores）"
            data={solveBytesToMiB(data.kube_scheduler_cpu_usage, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            className='KubeScheduler'
            id="resource_cpu"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title={`内存使用量（${solveUnitMonitor(data?.kube_scheduler_memory_usage)}）`}
            data={solveBytesToMiB(data?.kube_scheduler_memory_usage)}
            type="line"
            className='KubeScheduler'
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="resource_memory"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
  </>;
}