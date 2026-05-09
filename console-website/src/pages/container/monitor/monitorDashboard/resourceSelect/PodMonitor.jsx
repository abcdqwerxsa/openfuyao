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
import { Table, ConfigProvider, Skeleton } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { solveBytesToMiB, solveUnitMonitor } from '@/tools/utils';
import SkeletonArea from '@/components/SkeletonArea';
import { useStore, useEffect } from 'openinula';

const columns = [
  {
    title: 'Pod',
    key: 'Pod',
    render: (_, record) => record.pod,
  },
  {
    title: 'IOPS(Reads)',
    key: 'iopsRead',
    render: (_, record) => `${record.iopsRead !== -1 ? record.iopsRead : '--'}io/second`,
  },
  {
    title: 'IOPS(Writes)',
    key: 'iopsWrite',
    render: (_, record) => `${record.iopsWrite !== -1 ? record.iopsWrite : '--'}io/second`,
  },
  {
    title: 'IOPS(Reads+Writes)',
    key: 'iopsReadWrite',
    render: (_, record) => `${record.iopsReadWrite !== -1 ? record.iopsReadWrite : '--'}io/second`,
  },
  {
    title: 'Throughput(Reads)',
    key: 'throughputRead',
    render: (_, record) => `${record.throughputRead !== -1 ? record.throughputRead : '--'}bytes/second`,
  },
  {
    title: 'Throughput(Writes)',
    key: 'throughputWrite',
    render: (_, record) => `${record.throughputWrite !== -1 ? record.throughputWrite : '--'}bytes/second`,
  },
  {
    title: 'Throughput(Reads+Writes)',
    key: 'throughputReadWrite',
    render: (_, record) => `${record.throughputReadWrite !== -1 ? record.throughputReadWrite : '--'}bytes/second`,
  },
];
export default function PodMonitor({
  data,
  timelyData,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  const themeStore = useStore('theme');

  return <>
    <div className='monitor_chart_container PodMonitor'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>CPU</p>
      {loaded
        ? <DataAreaChart
          title="CPU使用量（cores）"
          data={solveBytesToMiB(data.pod_cpu_usage, false)}
          type="line"
          id="pod_cpu_usage"
          className='PodMonitor'
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          refreshFn={refreshFn}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container PodMonitor'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>内存</p>
      {loaded
        ? <DataAreaChart
          title={`内存使用量（${solveUnitMonitor(data.pod_memory_usage)}）`}
          data={solveBytesToMiB(data.pod_memory_usage)}
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          type="line"
          id="pod_memory_usage"
          refreshFn={refreshFn}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>包速率</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="pod接收网络数据包的速率（packets/second）"
            data={solveBytesToMiB(data.pod_network_packets_received, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="pod_network_packets_received"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="pod传输网络数据包的速率（packets/second）"
            data={solveBytesToMiB(data.pod_network_packets_transmitted, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="pod_network_packets_transmitted"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container PodMonitor'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>丢包速率</p>
      <div className='monitor_half PodMonitor'>
        {loaded
          ? <DataAreaChart
            title="pod从网络接收但被丢弃的数据包的速率（packets/second）"
            data={solveBytesToMiB(data.pod_network_packets_received_dropped, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            className='PodMonitor'
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            id="pod_network_packets_received_dropped"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            className='PodMonitor'
            title="pod从网络传输但被丢弃的数据包的速率（packets/second）"
            data={solveBytesToMiB(data.pod_network_packets_transmitted_dropped, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="pod_network_packets_transmitted_dropped"
            refreshFn={refreshFn}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>存储读写</p>
    <div className='monitor_chart_container' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <ConfigProvider locale={zhCN}>
        {loaded ?
          <Table className='chart_table_monitor PodMonitor'
            style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}
            columns={columns}
            dataSource={timelyData.storage}
            pagination={{
              style: { paddingBottom: 0 },
              className: 'page PodMonitor',
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共${total}条`,
            }} />
          : <Skeleton active />
        }
      </ConfigProvider>
    </div>
  </>;
}