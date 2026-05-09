/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import MonitorPod from '@/assets/images/monitor/monitorPod.png';
import MonitorNormal from '@/assets/images/monitor/monitorNormal.png';
import MonitorNodeUnNormal from '@/assets/images/monitor/monitorNodeUnnormal.png';
import DataAreaChart from '@/components/echarts/DataAreaChart';
import DataDonutChart from '@/components/echarts/DataDountChart';
import { Table, ConfigProvider, Skeleton } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { solveBytesToMiB, solveUnitMonitor } from '@/tools/utils';
import SkeletonArea from '@/components/SkeletonArea';
import { useStore, useEffect } from 'openinula';

const columns = [
  {
    title: 'namespace',
    key: 'namespace',
    render: (_, record) => record.namespace,
  },
  {
    title: 'pods',
    key: 'pods',
    render: (_, record) => record.pods !== '--' && !isNaN(record.pods) ? record.pods : '--',
  },
  {
    title: 'workloads',
    key: 'workloads',
    render: (_, record) => record.workloads !== '--' && !isNaN(record.workloads) ? record.workloads : '--',
  },
  {
    title: 'Memory Usage',
    key: 'memory',
    render: (_, record) => record.usage !== '--' && !isNaN(record.usage) ? `${record.usage} MiB` : '--',
  },
  {
    title: 'Memory Requests %',
    key: 'requests',
    render: (_, record) => record.requests !== '--' && !isNaN(record.requests) ? `${record.requests}%` : '--',
  },
  {
    title: 'Memory Limits',
    key: 'limitsValue',
    render: (_, record) => record.memoryLimits !== '--' && !isNaN(record.memoryLimits) ? `${record.memoryLimits}MiB` : '--',
  },
  {
    title: 'Memory Limits %',
    key: 'limitsRate',
    render: (_, record) => record.memoryLimitsRate !== '--' && !isNaN(record.memoryLimitsRate) ? `${record.memoryLimitsRate}%` : '--',
  },
];
export default function ClusterMonitor({
  data,
  timelyData,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  const themeStore = useStore('theme');

  return <>
    <div className='monitor_chart_container' >
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>概览</p>
      <div className="monitor_overview">
        <div className="info_box" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
          <div className="info_item">
            <div className="info_title" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>未就绪节点数量</div>
            <div className="info_content">
              <img src={MonitorNodeUnNormal} />
              <div className="number_count" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{timelyData?.nodesReadyCount || 0}</div>
            </div>
          </div>
          <div className="info_item">
            <div className="info_title" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>节点数量</div>
            <div className="info_content">
              <img src={MonitorNormal} />
              <div className="number_count" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{timelyData?.nodesCount || 0}</div>
            </div>
          </div>
          <div className="info_item">
            <div className="info_title" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>Pod数量</div>
            <div className="info_content">
              <img src={MonitorPod} />
              <div className="number_count" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{timelyData?.podsCount || 0}</div>
            </div>
          </div>
        </div>
        <div className='monitor_chart_container donut_chart'>
          {loaded
            ? <DataDonutChart
              className='empty_data_area'
              data={timelyData?.clusterCpuUtilisationRate}
              id="cluster_cpu_utilisation"
              type={'cluster'}
              title="CPU使用率"
              refreshFn={refreshFn}
            />
            : <SkeletonArea height='188px' />
          }
        </div>
      </div>
      <div className='monitor_chart_container'>
        <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>CPU</p>
        {loaded
          ? <DataAreaChart
            title="按命名空间维度分析CPU使用量（cores）"
            data={solveBytesToMiB(data?.cluster_cpu_usage_by_namespace, false)}
            type="line"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="cluster_cpu_usage_by_namespace"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
      <div className='monitor_chart_container'>
        <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>内存</p>
        {loaded
          ? <DataAreaChart
            title={`按命名空间维度分析不包含缓存的内存使用量（${solveUnitMonitor(data?.cluster_memory_usage_without_cache_by_namespace)}）`}
            data={solveBytesToMiB(data?.cluster_memory_usage_without_cache_by_namespace)}
            type="line"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="cluster_memory_usage_by_namespace"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
      <div className='monitor_chart_container'>
        <ConfigProvider locale={zhCN}>
          <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>内存请求</p>
          {loaded ? <Table
            className='chart_table_monitor ClusterMonitor'
            style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}
            columns={columns}
            dataSource={timelyData?.requests}
            pagination={{
              style: { paddingBottom: 0 },
              showTotal: total => `共${total}条`,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
              showQuickJumper: true,
              className: 'page ClusterMonitor',
            }} />
            : <Skeleton active />
          }
        </ConfigProvider>
      </div>
      <div className='monitor_chart_container'>
        <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>包速率</p>
        <div className='monitor_half'>
          {loaded
            ? <DataAreaChart
              title="namespace接收网络数据包的速率（packets/second）"
              data={solveBytesToMiB(data?.cluster_rate_of_received_packets_by_namespace, false)}
              type="line"
              styleProps={{ gridRight: '40%' }}
              id="cluster_rate_of_received"
              rangeColorProps={propsColor}
              handleShowScreen={handleShowScreen}
              refreshFn={refreshFn}
            />
            : <SkeletonArea />
          }
          {loaded
            ? <DataAreaChart
              title="namespace传输网络数据包的速率（packets/second）"
              data={solveBytesToMiB(data?.cluster_rate_of_transmitted_packets_by_namespace, false)}
              type="line"
              styleProps={{ gridRight: '40%' }}
              id="cluster_rate_of_transmitted"
              rangeColorProps={propsColor}
              handleShowScreen={handleShowScreen}
              refreshFn={refreshFn}
            />
            : <Skeleton />
          }
        </div>
      </div>
      <div className='monitor_chart_container'>
        <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>丢包速率</p>
        <div className='monitor_half'>
          {loaded
            ? <DataAreaChart
              title="namespace从网络接收但被丢弃的数据包的速率（packets/second）"
              data={data?.cluster_rate_of_received_packets_dropped_by_namespace}
              type="line"
              styleProps={{ gridRight: '40%' }}
              id="rate_received_dropped_namespace"
              rangeColorProps={propsColor}
              handleShowScreen={handleShowScreen}
              refreshFn={refreshFn}
            />
            : <SkeletonArea />
          }
          {loaded
            ? <DataAreaChart
              title="namespace从网络传输但被丢弃的数据包的速率（packets/second）"
              data={data?.cluster_rate_of_transmitted_packets_dropped_by_namespace}
              type="line"
              styleProps={{ gridRight: '40%' }}
              id="rate_transmitted_dropped_namespace"
              rangeColorProps={propsColor}
              handleShowScreen={handleShowScreen}
              refreshFn={refreshFn}
            />
            : <SkeletonArea />
          }
        </div>
      </div>
    </div>
  </>;
}