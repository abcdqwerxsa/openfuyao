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
import DataDonutChart from '@/components/echarts/DataDountChart';
import { Table, Progress, ConfigProvider, Skeleton } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { solveBytesToMiB, solveUnitMonitor, solveEachBytesToMB } from '@/tools/utils';
import SkeletonArea from '@/components/SkeletonArea';
import { useEffect, useStore } from 'openinula';

const colorsRange = {
  '0%': '#09aa71',
  '80%': '#f4840c',
};

const solveColor = (rate) => {
  if ((rate * 100).toFixed(1) > 80) {
    return colorsRange;
  } else if ((rate * 100) < 50) {
    return '#77AEF7';
  } else {
    return '#09aa71';
  }
};

const columns = [
  {
    title: 'Mounted',
    width: 500,
    ellipsis: true,
    key: 'mounted',
    render: (_, record) => record.mounted,
  },
  {
    title: 'Size',
    key: 'size',
    render: (_, record) => `${solveEachBytesToMB(record.size)}MB`,
  },
  {
    title: 'Available',
    key: 'available',
    render: (_, record) => `${solveEachBytesToMB(record.available)}MB`,
  },
  {
    title: 'Used',
    key: 'used',
    render: (_, record) => `${solveEachBytesToMB(record.used)}MB`,
  },
  {
    title: 'Used %',
    key: 'usedRate',
    render: (_, record) => <Progress percent={((record.usedRate) * 100).toFixed(1)}
      strokeColor={() => solveColor(record.usedRate)} />,
  },
];

export default function NodeMonitor({
  data,
  timelyData,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  const themeStore = useStore('theme');
  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>CPU</p>
      {loaded
        ? <DataAreaChart
          title="CPU使用量（cores）"
          data={solveBytesToMiB(data.node_cpu_usage, false)}
          type="line"
          id="node_cpu_usage"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      {loaded
        ? <DataAreaChart
          title="过去一段时间内的平均负载（cores）"
          data={data.nodeLoadUsage}
          type="line"
          id="node_load_average"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          refreshFn={refreshFn} />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>内存</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title={`内存使用量（${solveUnitMonitor(data.node_memory_usage)}）`}
            data={solveBytesToMiB(data.node_memory_usage)}
            type="line"
            styleProps={{ gridRight: '40%' }}
            id="node_memory_usage"
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn} />
          : <SkeletonArea />
        }
        <div className='donut_chart'>
          {loaded ? <DataDonutChart
            className='empty_node_data'
            styleProps={{ height: 300 }}
            data={timelyData.nodeMemoryUtilisationRate}
            type={'node'}
            id="node_memory_utilisation"
            title="内存使用率"
            refreshFn={refreshFn}
          />
            : <SkeletonArea />
          }
        </div>
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>磁盘</p>
      {loaded ? <DataAreaChart
        title="磁盘读写（bytes/second）"
        data={solveBytesToMiB(data.disk, false)}
        type="line"
        id="node_disk_io"
        rangeColorProps={propsColor}
        handleShowScreen={handleShowScreen}
        refreshFn={refreshFn}
      />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container monitor_bk' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <ConfigProvider locale={zhCN}>
        <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>磁盘空间</p>
        {loaded
          ? <Table className='chart_table_monitor NodeMonitor' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }} columns={columns} dataSource={timelyData?.diskUsage}
            pagination={{
              style: { paddingBottom: 0 },
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              className: 'page NodeMonitor',
              showTotal: total => `共${total}条`,
            }} />
          : <Skeleton active />
        }
      </ConfigProvider>
    </div>
  </>;
}