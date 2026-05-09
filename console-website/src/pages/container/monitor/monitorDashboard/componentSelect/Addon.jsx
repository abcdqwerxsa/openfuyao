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
import { solveBytesToMiB, solveUnitMonitor, solveRate } from '@/tools/utils';
import SkeletonArea from '@/components/SkeletonArea';

export default function Addon({
  data,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title'>请求</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="coredns的请求时延（second）"
            data={solveBytesToMiB(data.coredns_requests_latency, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="coredns_requests_latecy"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="coredns接收到的请求数"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            data={solveBytesToMiB(data.coredns_requests_rate, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="coredns_requests_rate"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="coredns服务器在处理DNS查询请求时返回NXDOMAIN响应的比率（%）"
            data={solveRate(data.coredns_NXDOMAIN_response_rate)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            tooltip={<div className='tooltip_box'>
              <p>coredns服务器在处理DNS查询请求时返回NXDOMAIN（非存在域）响应的比率。</p>
            </div>}
            id="coredns_NXDOMAIN_response_rate"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="coredns panics的总数"
            data={solveBytesToMiB(data.coredns_panic_count, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="coredns_panic_count"
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>Response(size)</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title={`coredns接收到的UDP型请求的响应时长（${solveUnitMonitor(data?.coredns_udp_responses_size_bytes)}）`}
            data={solveBytesToMiB(data?.coredns_udp_responses_size_bytes)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="coredns_udp_responses_size_bytes"
            tooltip={<div className='tooltip_box'>
              <p>coredns接收到的UDP（用户数据报协议）型请求的响应时长。</p>
            </div>}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title={`coredns接收到的TCP型请求的响应时长（${solveUnitMonitor(data?.coredns_tcp_responses_size_bytes)}）`}
            data={solveBytesToMiB(data?.coredns_tcp_responses_size_bytes)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="coredns_tcp_response"
            tooltip={<div className='tooltip_box'>
              <p>coredns接收到的TCP（传输控制协议）型请求的响应时长。</p>
            </div>}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title'>coredns_cache</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="coredns当前缓存结果数"
            data={solveBytesToMiB(data.coredns_cache_size, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="coredns_cache_size"
            tooltip={<div className='tooltip_box'>
              <p>coredns当前缓存结果数。</p>
            </div>}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="coredns缓存命中率（%）"
            data={solveRate(data.coredns_cache_hitrate)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="coredns_cache_hitrate"
            tooltip={<div className='tooltip_box'>
              <p>coredns当前缓存命中率。</p>
            </div>}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
      </div>
    </div>
  </>;
}