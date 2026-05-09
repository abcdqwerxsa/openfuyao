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
import { useStore, useEffect } from 'openinula';

export default function WorkloadMonitor({
  data,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  const themeStore = useStore('theme');

  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff'}}>CPU</p>
      {loaded
        ? <DataAreaChart
          title="CPU使用量（cores）"
          data={solveBytesToMiB(data.workload_cpu_usage, false)}
          type="line"
          id="workload_cpu_usage"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff'}}>内存</p>
      {loaded
        ? <DataAreaChart
          title={`内存使用量（${solveUnitMonitor(data.workload_memory_usage)}）`}
          data={solveBytesToMiB(data.workload_memory_usage)}
          type="line"
          id="workload_memory_usage"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff'}}>包速率</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="workload从网络接收的数据量的速率（packets/second）"
            data={solveBytesToMiB(data.workload_network_packets_received, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="workload_network_packets_received"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="workload从网络传输的数据量速率（packets/second）"
            data={solveBytesToMiB(data.workload_network_packets_transmitted, false)}
            type="line"
            id="workload_network_packets_transmitted"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff'}}>丢包速率</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="workload从网络接收但被丢弃的数据包的速率（packets/second）"
            data={solveBytesToMiB(data.workload_network_packets_received_dropped, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="workload_network_packets_received_dropped"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="workload从网络传输但被丢弃的数据包的速率（packets/second）"
            data={solveBytesToMiB(data.workload_network_packets_transmitted_dropped, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="workload_network_packets_transmitted_dropped"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
  </>;
}