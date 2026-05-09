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

export default function Etcd({
  etcdData,
  loaded,
  propsColor,
  handleShowScreen,
  refreshFn,
}) {
  const themeStore = useStore('theme');

  return <>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>etcd leader</p>
      {loaded
        ? <DataAreaChart
          id="status"
          title="etcd leader状态"
          rangeColorProps={propsColor}
          data={[
            ...(etcdData.etcd_server_has_leader ? etcdData.etcd_server_has_leader : []),
            ...(etcdData.etcd_server_is_leader ? etcdData.etcd_server_is_leader : []),
          ]}
          handleShowScreen={handleShowScreen}
          tooltip={<div className='tooltip_box'>
            <p>etcd Leader是指被选举为当前集群的领导者的节点。</p>
            <p>etcd_has_leader：etcd是否有一个有效的leader使用Raft协议来管理复制和领导者选举，
              在Raft协议中，有一个leader负责处理所有的写请求，并将这些更改复制到其他节点。
            </p>
            <p>etcd_is_leader:：当前的etcd实例是否是leader。</p>
          </div>}
          refreshFn={refreshFn}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      {loaded
        ? <DataAreaChart
          title="过去一天内leader更换次数"
          data={etcdData.etcd_server_leader_changes_seen_1day}
          type="area"
          id="etcd_server_leader_changes_seen_1day"
          rangeColorProps={propsColor}
          refreshFn={refreshFn}
          tooltip={<div className='tooltip_box'>
            <p>过去一天内ectd leader更换的次数</p>
          </div>}
          handleShowScreen={handleShowScreen}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>键对总数</p>
      {loaded
        ? <DataAreaChart
          title="etcd集群键对总数"
          data={etcdData.etcd_debugging_mvcc_keys_total}
          type="line"
          id="debug"
          rangeColorProps={propsColor}
          handleShowScreen={handleShowScreen}
          refreshFn={refreshFn} />
        : <SkeletonArea />}
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>时延</p>
      {loaded
        ? <DataAreaChart
          title="统计API Server对etcd的请求时延（seconds）"
          data={etcdData.etcd_kube_api_request_latency}
          type="line"
          id="kube_api"
          rangeColorProps={propsColor}
          refreshFn={refreshFn}
          handleShowScreen={handleShowScreen}
        />
        : <SkeletonArea />
      }
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>资源分析</p>
      <div className='monitor_half'>
        {loaded
          ? <DataAreaChart
            title="CPU使用量（cores）"
            data={solveBytesToMiB(etcdData.etcd_cpu_usage, false)}
            type="line"
            id="cpu"
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
          />
          : <SkeletonArea />
        }
        {loaded
          ? <DataAreaChart
            title={`内存使用量（${solveUnitMonitor(etcdData.etcd_memory_usage)}）`}
            data={solveBytesToMiB(etcdData.etcd_memory_usage)}
            styleProps={{ gridRight: '40%' }}
            rangeColorProps={propsColor}
            handleShowScreen={handleShowScreen}
            refreshFn={refreshFn}
            type="line"
            id="memeory"
          />
          : <SkeletonArea />
        }
      </div>
    </div>
    <div className='monitor_chart_container'>
      <p className='chart_title' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>磁盘大小</p>
      {loaded
        ? <DataAreaChart
          title={`etcd backend db实际使用大小（${solveUnitMonitor([
            ...(etcdData.etcd_backend_db_usage ? etcdData.etcd_backend_db_usage : []),
            ...(etcdData.etcd_backend_db_total ? etcdData.etcd_backend_db_total : []),
          ])}）`}
          data={solveBytesToMiB([
            ...(etcdData.etcd_backend_db_usage ? etcdData.etcd_backend_db_usage : []),
            ...(etcdData.etcd_backend_db_total ? etcdData.etcd_backend_db_total : []),
          ])}
          type="area"
          id="disk"
          handleShowScreen={handleShowScreen}
          rangeColorProps={['#43CBB8', '#4B8BEA']}
          refreshFn={refreshFn}
        />
        : <SkeletonArea />
      }
    </div>
  </>;
}