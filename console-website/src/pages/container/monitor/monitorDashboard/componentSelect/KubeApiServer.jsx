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

export default function KubeApiServer({
  data,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title'>QPS</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="按Verb维度分析QPS（requests/second）"
            data={solveBytesToMiB(data?.kube_apiserver_qps_by_verb, false)}
            type="line" id="qps_verb"
            rangeColorProps={propsColor}
            styleProps={{ gridRight: '40%' }}
            tooltip={<div className='tooltip_box'>
              <p>按verb维度，统计单位时间（1s）内的请求QPS。</p>
              <p>verb：HTTP请求的类型，如GET，POST，DELETE，PUT，等。</p>
            </div>}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="按Verb+Resource维度分析QPS（requests/second）"
            data={solveBytesToMiB(data?.kube_apiserver_qps_by_verb_resource, false)}
            type="line" id="qps_verb_resource"
            rangeColorProps={propsColor}
            styleProps={{ gridRight: '40%' }}
            tooltip={<div className='tooltip_box'>
              <p>按verb+resource维度，统计单位时间（1s）内的请求QPS。</p>
              <p>resource：请求目标的Kubernetes资源类型，如pods，nodes，deployments 等。</p>
            </div>}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>时延</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="按Verb维度分析请求时延（seconds）"
            data={solveBytesToMiB(data?.kube_apiserver_request_latency_by_verb, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="latency_qps_request_verb"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="按Verb+Resource维度分析请求时延（seconds）"
            data={solveBytesToMiB(data?.kube_apiserver_request_latency_by_verb_resource, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="qps_request_verb_resource"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>资源分析</p>
      <div className='monitor_half KubeApiServer'>
        {loaded
          ? <DataAreaChart
            className='KubeApiServer'
            title="CPU使用量（cores）"
            data={solveBytesToMiB(data?.kube_apiserver_cpu_usage, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="qps_cpu"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title={`内存使用量（${solveUnitMonitor(data?.kube_apiserver_memory_usage)}）`}
            data={solveBytesToMiB(data?.kube_apiserver_memory_usage)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="qps_memeory"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
  </>;
}