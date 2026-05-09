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
import { useEffect, useStore } from 'openinula';
const columns = [
  {
    title: 'container',
    key: 'container',
    render: (_, record) => record.pod || '--',
  },
  {
    title: 'IOPS(Reads)',
    key: 'iopsRead',
    render: (_, record) => `${record.iopsRead}io/second`,
  },
  {
    title: 'IOPS(Reads+Writes)',
    key: 'iopsReadWrite',
    id: 'iopsReadWrite',
    render: (_, record) => `${record.iopsReadWrite}io/second`,
  },
  {
    title: 'Throughput(Reads)',
    key: 'throughputRead',
    id: 'throughputRead',
    render: (_, record) => `${record.throughputRead}bytes/second`,
  },
  {
    title: 'Throughput(Writes)',
    key: 'throughputWrite',
    id: 'throughputWrite',
    render: (_, record) => `${record.throughputWrite}bytes/second`,
  },
  {
    title: 'Throughput(Reads+Writes)',
    key: 'throughputReadWrite',
    id: 'throughputReadWrite',
    render: (_, record) => `${record.throughputReadWrite}bytes/second`,
  },
];

export default function ContainerMonitor({
  data,
  timelyData,
  propsColor,
  handleShowScreen,
  refreshFn,
  loaded,
}) {
  const themeStore = useStore('theme');

  return <>
    <div className='monitor_chart_container ContainerMonitor'>
      <p className='chart_title ContainerMonitor' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>CPU</p>
      {loaded
        ? <DataAreaChart
          title="CPU使用量（cores）"
          data={solveBytesToMiB(data.pod_cpu_usage, false)}
          type="line"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          id="container_cpu_usage"
          className='ContainerMonitor'
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container ContainerMonitor'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>Memory</p>
      {loaded
        ? <DataAreaChart
          title={`内存使用量（${solveUnitMonitor(data.pod_memory_usage)}）`}
          data={solveBytesToMiB(data.pod_memory_usage)}
          type="line"
          id="container_memory_usage"
          className='ContainerMonitor'
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container ContainerMonitor'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>包速率</p>
      <div className='monitor_half ContainerMonitor'>
        {loaded
          ? <DataAreaChart
            title="container接收网络数据包的速率（packets/second）"
            data={solveBytesToMiB(data.pod_network_packets_received, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="container_network_packets_received"
            className='ContainerMonitor'
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            data={solveBytesToMiB(data.pod_network_packets_transmitted, false)}
            title="container传输网络数据包的速率（packets/second）"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="container_network_packets_transmitted"
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>丢包速率</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="container从网络接收但被丢弃的数据包的速率（packets/second）"
            data={solveBytesToMiB(data.pod_network_packets_received_dropped, false)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="container_network_packets_received_dropped"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title="container从网络传输但被丢弃的数据包的速率（packets/second）"
            data={solveBytesToMiB(data.pod_network_packets_transmitted_dropped, false)}
            type="line"
            id="container_network_packets_transmitted_dropped"
            rangeColorProps={propsColor}
            styleProps={{ gridRight: '40%' }}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>存储读写</p>
    <div className='monitor_chart_container' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <ConfigProvider locale={zhCN}>
        {loaded
          ? <Table className='chart_table_monitor ContainerMonitor'
            style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}
            columns={columns}
            dataSource={timelyData.storage}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: total => `共${total}条`,
              style: { paddingBottom: 0 },
              pageSizeOptions: [10, 20, 50],
              className: 'page ContainerMonitor',
            }} />
          : <Skeleton active />
        }
      </ConfigProvider>
    </div>
  </>;
}