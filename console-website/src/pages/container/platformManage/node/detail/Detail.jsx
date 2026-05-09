/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import Dayjs from 'dayjs';
import { InfoCircleFilled, CheckCircleFilled, EditOutlined, FileSearchOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useState, useStore } from 'openinula';
import { ResponseCode } from '@/common/constants';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import DiskNodeIcon from '@/assets/images/diskNodeIcon.png';
import MemoryIcon from '@/assets/images/memoryIcon.png';
import NetworkIsUseNodeIcon from '@/assets/images/networkIsUseNodeIcon.png';
import NetworkSendNodeIcon from '@/assets/images/networkSendNodeIcon.png';
import AnnotationModal from '@/components/AnnotationModal';
import { Tag, message, Progress, Tooltip } from 'antd';
import { solveAnnotationOrLabelDiff, solveNodeIpAddress, nodeDetailIsBusy, transformUnifiedUnit, forbiddenMsg } from '@/tools/utils';
import { getResourceControllMonitor } from '@/api/monitorApi';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
export default function Detail({ nodeName, nodeDetailDataProps, refreshFn }) {
  const [nodeDetailData, setNodeDetailData] = useState(nodeDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();
  // 对话框展示
  const [isNodeDetailLabelModalOpen, setIsNodeDetailLabelModalOpen] = useState(false);
  const [isNodeDetailAnnotationModalOpen, setIsNodeDetailAnnotationModalOpen] = useState(false);
  const [oldNodeDetailAnnotations, setOldNodeDetailAnnotataions] = useState(nodeDetailDataProps?.metadata.annotations);
  const [oldNodeDetailLabels, setOldNodeDetailLabels] = useState(nodeDetailDataProps?.metadata.labels);
  const [networkCpuRate, setNetwworkCpuRate] = useState({
    cpuUsage: 0,
    cpuTotal: 0,
    cpuUtilisation: 0,
  }); // 监控cpu使用率
  const [networkMemoryRate, setNetwworkMemoryRate] = useState({
    memoryUsage: 0,
    memoryTotal: 0,
    memoryUtilisation: 0,
  }); // 监控内存使用率
  const [clusterPodCount, setClusterPodCount] = useState(0); // pod数
  const themeStore = useStore('theme');

  // 标签成功回调
  const handleLabelOk = async (nodeDetailTemporyData) => {
    if (JSON.stringify(oldNodeDetailLabels) === JSON.stringify(nodeDetailTemporyData)) {
      messageApi.info('标签未进行修改');
      setIsNodeDetailLabelModalOpen(false);
    } else {
      const keyArr = [];
      nodeDetailTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldNodeDetailLabels, nodeDetailTemporyData, 'label');
        try {
          const res = await editAnnotationsOrLabels('node', '', nodeName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsNodeDetailLabelModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败！${error.response.data.message}`);
          }
        }
      }
    }
  };
  // 标签失败回调
  const handleLabelCancel = () => {
    setIsNodeDetailLabelModalOpen(false);
  };

  // 注解成功回调
  const handleAnnotationOk = async (nodeDetailTemporyData) => {
    if (JSON.stringify(oldNodeDetailAnnotations) === JSON.stringify(nodeDetailTemporyData)) {
      messageApi.info('注解未进行修改');
      setIsNodeDetailAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      nodeDetailTemporyData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldNodeDetailAnnotations, nodeDetailTemporyData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('node', '', nodeName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsNodeDetailAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败！${error.response.data.message}`);
          }
        }
      }
    }
  };
  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsNodeDetailAnnotationModalOpen(false);
  };

  // 获取监控信息
  const getNetworkInfo = useCallback(async () => {
    const clusterRes = await getResourceControllMonitor({ cluster: 'main', value: 'cluster' });
    if (clusterRes.status === ResponseCode.OK) {
      clusterRes.data.results.map(item => {
        if (item.metricName === 'cluster_pods_count') {
          if (item.data.result && item.data.result.length) {
            const [filterObj, ...resets] = item.data.result.filter(filterItem => filterItem.labels?.node === nodeName);
            setClusterPodCount(filterObj.sample?.value);
          }
        }
      });
    }
    const nodeRes = await getResourceControllMonitor({ cluster: 'main', value: 'node', start: '', end: '', conditions: { instance: nodeName } });
    if (nodeRes.status === ResponseCode.OK) {
      let nodeCpuInfo = networkCpuRate;
      let nodeMemoryInfo = networkMemoryRate;
      nodeRes.data.results.map(item => {
        if (item.metricName === 'node_cpu_usage') {
          const [nodeInfo, ...resets] = item.data.result;
          nodeCpuInfo.cpuUsage = nodeInfo.sample?.value;
        }
        if (item.metricName === 'node_cpu_total') {
          const [nodeInfo, ...resets] = item.data.result;
          nodeCpuInfo.cpuTotal = nodeInfo.sample?.value;
        }
        if (item.metricName === 'node_cpu_utilisation') {
          const [nodeInfo, ...resets] = item.data.result;
          nodeCpuInfo.cpuUtilisation = nodeInfo.sample?.value;
        }
        if (item.metricName === 'node_memory_usage') {
          const [nodeInfo, ...resets] = item.data.result;
          nodeMemoryInfo.memoryUsage = nodeInfo.sample?.value / 1024 / 1024 / 1024;
        }
        if (item.metricName === 'node_memory_total') {
          const [nodeInfo, ...resets] = item.data.result;
          nodeMemoryInfo.memoryTotal = nodeInfo.sample?.value / 1024 / 1024 / 1024;
        }
        if (item.metricName === 'node_memory_utilisation') {
          const [nodeInfo, ...resets] = item.data.result;
          nodeMemoryInfo.memoryUtilisation = nodeInfo.sample?.value;
        }
      });
      setNetwworkCpuRate({ ...nodeCpuInfo });
      setNetwworkMemoryRate({ ...nodeMemoryInfo });
    }
  }, []);

  useEffect(() => {
    getNetworkInfo();
  }, [getNetworkInfo]);

  const nodeBaseInfoItems = [
    { key: '节点名称：', value: nodeDetailData?.metadata?.name },
        {
      key: '节点规格：',
      value: nodeDetailData?.status?.capacity
        ? `${nodeDetailData.status.capacity.cpu}核 ${(parseInt(nodeDetailData.status.capacity.memory) / 1024 / 1024).toFixed(2)}GB`
        : '--',
    },
    {
      key: '节点状态：',
      value: <span className='running_circle'>正常</span>,
    },
    { key: '节点IP地址：', value: solveNodeIpAddress(nodeDetailData?.status?.addresses) },
    { key: '操作系统：', value: nodeDetailData?.status?.nodeInfo?.osImage || '--' },
    { key: '节点ID：', value: nodeDetailData?.metadata?.uid },
    { key: '创建时间：', value: Dayjs(nodeDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
    { key: '是否繁忙：', value: nodeDetailIsBusy(nodeDetailData?.status?.conditions) ? '是' : '否' },
  ];

  return <div className='tab_container container_margin_box normal_container_height'>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="detail_card">
      <h3>基本信息</h3>
      <div className="detail_info_box">
        <DetailBaseInfoList items={nodeBaseInfoItems} columns={2} />
        <div className="annotation">
          <div className="ann_title">
            <p>标签：</p>
            <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsNodeDetailLabelModalOpen(true)} />
          </div>
          <AnnotationModal open={isNodeDetailLabelModalOpen} type="label" dataList={nodeDetailData?.metadata.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
          <div className="key_value">
            {nodeDetailData.metadata?.labels?.length ?
              nodeDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
              <span style={{ marginTop: '13px' }}>0个</span>}
          </div>
        </div>
        <div className="annotation">
          <div className="ann_title">
            <p>注解：</p>
            <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsNodeDetailAnnotationModalOpen(true)} />
          </div>
          <AnnotationModal open={isNodeDetailAnnotationModalOpen} type="annotation" dataList={nodeDetailData?.metadata.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
          <div className="key_value">
            {nodeDetailData.metadata?.annotations?.length ?
              nodeDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
              <span style={{ marginTop: '13px' }}>0个</span>}
          </div>
        </div>
      </div>
    </div>
    <div className="detail_card container_card_add">
      <h3>健康状态</h3>
      <div className="resource_list node_resource_list">
        <div className="resource_item">
          <img className="resource_icon" src={NetworkIsUseNodeIcon} />
          <div className="resource_word">
            <p>网络可用性</p>
            <p>
              {!nodeDetailData?.healthy?.networkUnavailable ? <CheckCircleFilled style={{ color: '#09aa71' }} /> : <InfoCircleFilled style={{ color: '#e7434a' }} />}
              <span className="node_healthy_status">{!nodeDetailData?.healthy?.networkUnavailable ? '健康' : '异常'}</span>
              {nodeDetailData?.healthy?.networkUnavailable && <Tooltip title={nodeDetailData?.healthy.networkReason}><FileSearchOutlined className="unset_svg" /></Tooltip>}
            </p>
          </div>
        </div>

        <div className="resource_item">
          <img className="resource_icon" src={MemoryIcon} />
          <div className="resource_word">
            <p>内存压力</p>
            <p>
              {!nodeDetailData?.healthy?.memoryPressure ? <CheckCircleFilled style={{ color: '#09aa71' }} /> : <InfoCircleFilled style={{ color: '#e7434a' }} />}
              <span className="node_healthy_status">{!nodeDetailData?.healthy?.memoryPressure ? '健康' : '异常'}</span>
              {nodeDetailData?.healthy?.memoryPressure && <Tooltip title={nodeDetailData?.healthy.memoryReason}><FileSearchOutlined className="unset_svg" /></Tooltip>}
            </p>
          </div>
        </div>

        <div className="resource_item">
          <img className="resource_icon" src={DiskNodeIcon} />
          <div className="resource_word">
            <p>磁盘压力</p>
            <p>
              {!nodeDetailData?.healthy?.diskPressure ? <CheckCircleFilled style={{ color: '#09aa71' }} /> : <InfoCircleFilled style={{ color: '#e7434a' }} />}
              <span className="node_healthy_status">{!nodeDetailData?.healthy?.diskPressure ? '健康' : '磁盘压力'}</span>
              {nodeDetailData?.healthy?.diskPressure && <Tooltip title={nodeDetailData?.healthy.diskReason}><FileSearchOutlined className="unset_svg" /></Tooltip>}
            </p>
          </div>
        </div>

        <div className="resource_item">
          <img className="resource_icon" src={NetworkSendNodeIcon} />
          <div className="resource_word">
            <p>是否接收Pod</p>
            <p>
              {nodeDetailData?.healthy?.ready ? <CheckCircleFilled style={{ color: '#09aa71' }} /> : <InfoCircleFilled style={{ color: '#e7434a' }} />}
              <span className="node_healthy_status">{nodeDetailData?.healthy?.ready ? '健康' : '异常'}</span>
              {!nodeDetailData?.healthy?.ready && <Tooltip title={nodeDetailData?.healthy.readyReason}><FileSearchOutlined className="unset_svg" /></Tooltip>}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="detail_card container_card_add">
      <h3>资源配额详情</h3>
      <div className="echarts_list" style={{ justifyContent: 'space-around' }}>
        <div className="echarts_item">
          <p className="ecahrts_title">cpu</p>
          <Progress type="circle"
            percent={networkCpuRate.cpuUtilisation ? ((networkCpuRate.cpuUtilisation) * 100).toFixed(2) : 0}
            strokeColor={networkCpuRate.cpuUtilisation >= 1 ? '#e7434a' : '#09aa71'}
            format={(_percent) => `${_percent}%`}></Progress>
          <div className="word_flex">
            <p>
              <span>使用量</span>
              <span>{!transformUnifiedUnit(networkCpuRate.cpuUsage) ? (networkCpuRate.cpuUsage).toFixed(2) : '--'} cores</span>
            </p>
            <p>
              <span>最大值</span>
              <span>{!transformUnifiedUnit(networkCpuRate.cpuTotal) ? networkCpuRate.cpuTotal : '--'} cores</span>
            </p>
          </div>
        </div>
        <div className="echarts_item">
          <p className="ecahrts_title">memory</p>
          <Progress type="circle"
            percent={((networkMemoryRate.memoryUtilisation) * 100).toFixed(2)}
            strokeColor={networkMemoryRate.memoryUtilisation >= 1 ? '#e7434a' : '#09aa71'}
            format={(_percent) => `${_percent}%`}></Progress>
          <div className="word_flex">
            <p>
              <span>使用量</span>
              <span>{!transformUnifiedUnit(networkMemoryRate.memoryUsage) ? (networkMemoryRate.memoryUsage).toFixed(2) : '--'}Gi</span>
            </p>
            <p>
              <span>最大值</span>
              <span>{!transformUnifiedUnit(networkMemoryRate.memoryTotal) ? (networkMemoryRate.memoryTotal).toFixed(2) : '--'}Gi</span>
            </p>
          </div>
        </div>
        <div className="echarts_item">
          <p className="ecahrts_title">pods</p>
          <Progress
            type="circle"
            percent={nodeDetailData.selfResourceQuota.podMax
              ? ((clusterPodCount / nodeDetailData.selfResourceQuota.podMax) * 100).toFixed(2)
              : 0
            }
            strokeColor={
              ((clusterPodCount / nodeDetailData.selfResourceQuota.podMax) * 100) >= 100
                ? '#e7434a'
                : '#09aa71'
            }
            format={(_percent) => `${_percent}%`}></Progress>
          <div className="word_flex">
            <p>
              <span>使用量</span>
              <span>{!transformUnifiedUnit(clusterPodCount) ? clusterPodCount : '--'}</span>
            </p>
            <p>
              <span>最大值</span>
              <span>{!transformUnifiedUnit(nodeDetailData.selfResourceQuota.podMax) ? nodeDetailData.selfResourceQuota.podMax : '--'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>;
}