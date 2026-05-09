/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Radio, Form, Select, DatePicker, Button, ConfigProvider, message } from 'antd';
import { useCallback, useEffect, useState, useStore } from 'openinula';
import { SyncOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import {
  timePeriodOptions,
  refreshTimeOptions,
  typeOptions,
  ResponseCode,
  stepList,
} from '@/common/constants';
import ClusterMonitor from '@/pages/container/monitor/monitorDashboard/resourceSelect/ClusterMonitor';
import NodeMonitor from '@/pages/container/monitor/monitorDashboard/resourceSelect/NodeMonitor';
import WorkloadMonitor from '@/pages/container/monitor/monitorDashboard/resourceSelect/WorkloadMonitor';
import PodMonitor from '@/pages/container/monitor/monitorDashboard/resourceSelect/PodMonitor';
import ContainerMonitor from '@/pages/container/monitor/monitorDashboard/resourceSelect/ContainerMonitor';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import {
  getResourceControllMonitor,
  getNodeList,
  getNamespaceList,
  getWorkloadList,
} from '@/api/monitorApi';
import { getServiceTimeZoneInterface } from '@/api/containerApi';
import { solveMonitorComponentData, debounce, timelayDataSolve } from '@/tools/utils';
import infoStore from '@/store/infoStore';
import DiffTimeInfo from '@/components/DiffTimeInfo';
Dayjs.locale('zh-cn');
let lastPerformanceTime = window.performance.now();
let lastDate = new Date().getTime();
let checkResourceTimeChangeTimer = null;
let resourceTimer = null;
export default function ResourceMonitor({ propsType, propsColor }) {
  let isFirstLoaded = true; // 首次加载
  let abortController = null;
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedKey, setSelectedKeys] = useState('cluster');
  const infoStoreExample = infoStore();
  const [timeForm] = Form.useForm();
  const [clusterForm] = Form.useForm();
  const clusterValue = Form.useWatch('cluster', clusterForm);
  const refreshTimeValue = Form.useWatch('refreshTime', timeForm); // 刷新间隔
  const [intervalId, setInterValId] = useState(0); // 定时器id
  const [clusterOptions, setClusterOptions] = useState([]);
  const [instanceOptions, setInstanceOptions] = useState([]);
  const [namespaceOptions, setNamespaceOptions] = useState([]);
  const [workloadOptions, setWorkloadOptions] = useState([]);
  const [podOptions, setPodOptions] = useState([]);
  const [containerOptions, setContainerOptions] = useState([]);
  const [podContainerTotalData, setPodContainerTotalData] = useState([]); // 全部数据
  const [refreshTimePageOptions, setRefreshTimePageOptions] = useState(refreshTimeOptions);
  const [detailed, setDetailed] = useState(false); // 加载完成
  const [isScreenTrue, setIsScreenTrue] = useState(false); // 控制页面刷新动作是否显示骨架屏

  const [clusterData, setClusterData] = useState({});
  const [nodeData, setNodeData] = useState({});
  const [workloadData, setWorkloadData] = useState({});
  const [podData, setPodData] = useState({});
  const [containerData, setContainerData] = useState({});
  const themeStore = useStore('theme');
  const [diffTime, setDiffTime] = useState(0); // 相差时间
  const [timelyData, setTimelyData] = useState(); // 瞬时数据

  const handleResetMonitor = () => {
    renderRequest(selectedKey, clusterValue, false);
  };

  const getResourceList = useCallback(async () => {
    const res = await getNodeList();
    if (res.status === ResponseCode.OK) {
      let options = [];
      res.data.items.map(item => {
        if (!options.filter(opItem => opItem.value === item.metadata.name).length) {
          options.push({ label: item.metadata.name, value: item.metadata.name });
        }
      });
      setInstanceOptions([...options]);
      options.length
        ? clusterForm.setFieldValue('instance', [options[0].value])
        : clusterForm.setFieldValue('instance', undefined);
    }
  }, []);

  const getNamespaceMonitorList = useCallback(async () => {
    const res = await getNamespaceList();
    if (res.status === ResponseCode.OK) {
      let options = [];
      res.data.items.map(item => {
        if (!options.filter(opItem => opItem.value === item.metadata.name).length) {
          options.push({ label: item.metadata.name, value: item.metadata.name });
        }
      });
      setNamespaceOptions([...options]);
      options.length
        ? clusterForm.setFieldValue('namespace', options[0].value)
        : clusterForm.setFieldValue('namespace', undefined);
    }
  }, []);

  // hash映射
  const temporyHashMap = {
    cluster: data => setClusterData(data),
    node: data => setNodeData(data),
    workload: data => setWorkloadData(data),
    pod: data => setPodData(data),
    container: data => setContainerData(data),
  };

  const getResourceMonitor = useCallback(async (key, cluster, screenTrue = false) => {
    isFirstLoaded ? setDetailed(false) : '';
    const formValues = timeForm.getFieldsValue();
    let { instance, workload, pod, container, namespace, type } = clusterForm.getFieldsValue();
    let resourceMonitorStart = Dayjs(formValues.endTime).subtract(parseInt(formValues.period), formValues.period.slice(-1));
    let resourceMonitorEnd = Dayjs(formValues.endTime);
    // 处理时区问题
    const offset = infoStoreExample.$s.offsetCompareLocal;
    if (offset !== 0) {
      if (offset > 0) {
        resourceMonitorStart = resourceMonitorStart.subtract(offset, 'minute');
        resourceMonitorEnd = resourceMonitorEnd.subtract(offset, 'minute');
      } else {
        resourceMonitorStart = resourceMonitorStart.add(Math.abs(offset), 'minute');
        resourceMonitorEnd = resourceMonitorEnd.add(Math.abs(offset), 'minute');
      }
    }
    resourceMonitorStart = resourceMonitorStart.format('YYYY-MM-DD HH:mm:ss');
    resourceMonitorEnd = resourceMonitorEnd.format('YYYY-MM-DD HH:mm:ss');
    instance ? instance = instance.join('|') : '';
    workload ? workload = workload.join('|') : '';
    container ? container = container.join('|') : '';
    pod && key === 'pod' ? pod = pod.join('|') : '';
    let conditions = {
      step: stepList[formValues.period],
      instance,
      namespace,
      type,
      workload,
      pod,
      container,
    };
    key !== 'workload' ? getTimelyData(cluster, key, { ...conditions, step: '' }) : '';
    let data = {};
    try {
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();
      const { signal, ...resets } = abortController;
      const res = await getResourceControllMonitor({ cluster, value: key, start: resourceMonitorStart, end: resourceMonitorEnd, conditions }, signal);
      if (res.status === ResponseCode.OK) {
        data = solveMonitorComponentData(key, res.data.results);
      }
    } catch (e) {
      if (e.response.status !== ResponseCode.OK) {
        messageApi.error(`数据获取失败！${e.response.data}`);
      }
    }
    temporyHashMap[key](data);
    setDetailed(true);
    isFirstLoaded = false;
  }, []);

  const getWorkloadMonitorList = useCallback(async (namespace = clusterForm.getFieldsValue().namespace, type = clusterForm.getFieldsValue().type) => {
    const res = await getWorkloadList(namespace, type);
    if (res.status === ResponseCode.OK) {
      let options = [];
      res.data.items.map(item => {
        if (!options.filter(opItem => opItem.value === item.metadata.name).length) {
          options.push({ label: item.metadata.name, value: item.metadata.name });
        }
      });
      setWorkloadOptions([...options]);
      clusterForm.setFieldValue('workload', options.length ? [options[0].value] : undefined);
    }
  }, []);

  const getPodMonitorList = useCallback(async (namespace = clusterForm.getFieldsValue().namespace, key = 'pod') => {
    const res = await getWorkloadList(namespace, 'pod');
    if (res.status === ResponseCode.OK) {
      let containerList = [];
      let options = [];
      res.data.items.map(item => {
        if (!options.filter(opItem => opItem.value === item.metadata.name).length) {
          options.push({ label: item.metadata.name, value: item.metadata.name });
          containerList.push(item.spec.containers);
        }
      });
      setPodContainerTotalData(res.data.items);
      setPodOptions([...options]);
      if (key === 'pod') {
        clusterForm.setFieldValue('pod', options.length ? [options[0].value] : undefined);
      }
      if (key === 'container') {
        clusterForm.setFieldValue('pod', options.length ? options[0].value : undefined);
        let needContainerList = [];
        const [needContainerArr, ...resets] = containerList;
        if (needContainerArr) {
          needContainerArr.map(containerItem => {
            needContainerList.push({ label: containerItem.name, value: containerItem.name });
          });
        }
        clusterForm.setFieldValue('container', needContainerList.length ? [needContainerList[0].value] : undefined);
        setContainerOptions([...needContainerList]);
      }
    }
  }, []);

  const getContainerList = (pod) => {
    let needContainerList = [];
    podContainerTotalData.map(item => {
      if (item.metadata.name === pod) {
        item.spec.containers.map(containerItem => {
          needContainerList.push({ label: containerItem.name, value: containerItem.name });
        });
      }
    });
    clusterForm.setFieldValue('container', needContainerList.length ? [needContainerList[0].value] : undefined);
    setContainerOptions([...needContainerList]);
  };

  const renderRequest = useCallback(async (key, value, isRunInstance = true, isTrueBigScreen = isScreenTrue) => {
    isFirstLoaded ? setDetailed(false) : '';
    if (isRunInstance) {
      if (key === 'node') {
        await getResourceList();
      }
      if (key === 'workload') {
        await getNamespaceMonitorList();
        await getWorkloadMonitorList();
      }
      if (key === 'pod') {
        await getNamespaceMonitorList();
        await getPodMonitorList();
      }
      if (key === 'container') {
        await getNamespaceMonitorList();
        await getPodMonitorList(clusterForm.getFieldsValue().namespace, 'container');
      }
    }
    getTimeServiceResource(); // 获取时间
    getResourceMonitor(key, value, isTrueBigScreen);
  }, []);

  // 获取瞬时数据
  const getTimelyData = async (cluster, value, conditions) => {
    const res = await getResourceControllMonitor({ cluster, value, conditions });
    if (res.status === ResponseCode.OK) {
      setTimelyData(timelayDataSolve(value, res.data.results));
    }
  };

  useEffect(async () => {
    if (!isNaN(infoStoreExample.$s.offsetCompareLocal)) {
      if (clusterValue) {
        renderRequest(selectedKey, clusterValue);
      }
    }
  }, [clusterValue, selectedKey, infoStoreExample.$s.offsetCompareLocal]);

  const checkTime = () => {
    let currentPerformanceTime = window.performance.now();
    let currentDate = new Date().getTime();
    let performanceDiff = currentPerformanceTime - lastPerformanceTime;
    let dateDiff = currentDate - lastDate;
    if (Math.abs(performanceDiff - dateDiff) > 1000) {
      getTimeServiceResource();
      timeForm.setFieldValue('endTime', Dayjs(currentDate));
      renderRequest(selectedKey, clusterValue);
    }
    lastPerformanceTime = currentPerformanceTime;
    lastDate = currentDate;
    if (checkResourceTimeChangeTimer) {
      clearTimeout(checkResourceTimeChangeTimer);
    }
    checkResourceTimeChangeTimer = setTimeout(checkTime, 1000);
  };

  useEffect(() => {
    checkResourceTimeChangeTimer = setTimeout(checkTime, 1000);
    return () => clearTimeout(checkResourceTimeChangeTimer);
  }, [selectedKey, clusterValue, isScreenTrue]);

  useEffect(() => {
    if (propsType === 'component') {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
  }, [propsType, intervalId]);

  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  // 自动刷新
  const getWebSockect = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId); // 清除计时器
      setInterValId(0);
    }
    if (refreshTimeValue) {
      clearInterval(resourceTimer);
      resourceTimer = setInterval(() => {
        getTimeServiceResource();
      }, refreshTimeValue * 1000);
      const id = setInterval(() => {
        // 操作
        timeForm.setFieldValue('endTime', Dayjs()); // 时间赋值
        // 请求数据
        getResourceMonitor(selectedKey, clusterValue, isScreenTrue);
      }, refreshTimeValue * 1000);
      setInterValId(id);
    }
  }, [refreshTimeValue, selectedKey, clusterValue, isScreenTrue]);

  useEffect(() => {
    getWebSockect();
    return () => clearTimeout(resourceTimer);
  }, [getWebSockect]);

  const getClusterList = useCallback(async () => {
    let options = [
      {
        label: 'main',
        value: 'main',
      },
    ];
    setClusterOptions([...options]);
    if (clusterForm) {
      clusterForm.setFieldsValue({
        cluster: options[0].value,
      });
    }
  }, []);

  const handleSelectedMonitorKeys = (e) => {
    setSelectedKeys(e.target.value);
  };

  const handleValueChange = (changeValues) => {
    if (Object.prototype.hasOwnProperty.call(changeValues, 'endTime')) {
      timeForm.setFieldValue('refreshTime', 0);
      let temporyOptionsResourceMonitor = [];
      if (Dayjs(changeValues.endTime[0]) === Dayjs()) { // 此刻
        temporyOptionsResourceMonitor.push({ ...item });
      } else {
        refreshTimeOptions.map(item => {
          if (item.value !== 0) {
            const timeTempory = changeValues.endTime ? Dayjs(changeValues.endTime).format('YYYY-MM-DD HH:mm:ss') : undefined;
            if (timeTempory === Dayjs().format('YYYY-MM-DD HH:mm:ss')) { // 此刻
              temporyOptionsResourceMonitor.push({ ...item });
            } else {
              temporyOptionsResourceMonitor.push({ ...item, disabled: true });
            }
          } else {
            temporyOptionsResourceMonitor.push(item);
          }
        });
      }
      setRefreshTimePageOptions([...temporyOptionsResourceMonitor]);
    }
    if (!Object.prototype.hasOwnProperty.call(changeValues, 'refreshTime')) {
      debounce(() => renderRequest(selectedKey, clusterValue, false), 3000);
    }
  };
  // 修改时间回调
  const timeCallbackFn = (key, value, isLoad = false, endTime = Dayjs()) => {
    timeForm.setFieldValue('endTime', endTime);
    renderRequest(key, value, isLoad, true);
  };

  const handleClusterChange = async (changeValues) => {
    if (Object.prototype.hasOwnProperty.call(changeValues, 'type')) {
      await getWorkloadMonitorList(clusterForm.getFieldsValue().namespace, changeValues.type); // 请求渲染
    }
    if (Object.prototype.hasOwnProperty.call(changeValues, 'namespace')) {
      if (selectedKey === 'workload') {
        await getWorkloadMonitorList(clusterForm.getFieldsValue().namespace, clusterForm.getFieldsValue().type); // 请求渲染
      }
      if (selectedKey === 'pod') {
        await getPodMonitorList(clusterForm.getFieldsValue().namespace, 'pod'); // 请求渲染
      }
      if (selectedKey === 'container') {
        await getPodMonitorList(clusterForm.getFieldsValue().namespace, 'container'); // 请求渲染
      }
    }
    if (selectedKey === 'container') {
      if (Object.prototype.hasOwnProperty.call(changeValues, 'pod')) {
        getContainerList(changeValues.pod);
      }
    }
    getResourceMonitor(selectedKey, clusterForm.getFieldValue('cluster'), isScreenTrue);
  };

  const handleShowScreenBool = (value) => {
    setIsScreenTrue(value);
  };

  useEffect(() => {
    getClusterList();
  }, [getClusterList]);

  const getTimeServiceResource = useCallback(async () => {
    const res = await getServiceTimeZoneInterface();
    if (res.status === ResponseCode.OK) {
      if (res.data.data?.currentServerTime) {
        setDiffTime(Math.abs(Math.floor(new Date().getTime() / 1000) - (Number(res.data.data.currentServerTime))));
      }
    }
  }, []);

  return <div className="monitor_namespace">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    {diffTime >= 10 && <DiffTimeInfo time={diffTime} className={'monitor_diff_time'} />}
    <div className='monitor_content_header'>
      <Radio.Group
        value={selectedKey}
        onChange={handleSelectedMonitorKeys}
      >
        <Radio.Button value="cluster">集群</Radio.Button>
        <Radio.Button value="node">节点</Radio.Button>
        <Radio.Button value="workload">工作负载</Radio.Button>
        <Radio.Button value="pod">容器组</Radio.Button>
        <Radio.Button value="container">容器</Radio.Button>
      </Radio.Group>
      <ConfigProvider locale={zhCN}>
        <Form form={timeForm} layout='inline' onValuesChange={handleValueChange} initialValues={{
          refreshTime: 30,
          period: '10m',
          endTime: Dayjs(),
        }}>
          <Form.Item name="period" className='ResourceMonitor'>
            <Select options={timePeriodOptions} style={{ minWidth: '100px' }} />
          </Form.Item>
          <Form.Item name="endTime" label="结束时间" className='ResourceMonitor'>
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="refreshTime" className='ResourceMonitor'>
            <Select className='refresh_time_select' options={refreshTimePageOptions} />
          </Form.Item>
          <Form.Item className='ResourceMonitor'>
            <Button icon={<SyncOutlined />} onClick={handleResetMonitor} className="reset_btn"></Button>
          </Form.Item>
        </Form>
      </ConfigProvider>
    </div>
    <div className='monitor_search' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <Form form={clusterForm} layout='inline' onValuesChange={handleClusterChange}>
        <Form.Item label="cluster" name="cluster">
          <Select options={clusterOptions} style={{ width: 300 }} disabled />
        </Form.Item>
        {selectedKey === 'node' && <Form.Item label="instance" name="instance">
          <Select
            mode="multiple"
            maxTagCount={2}
            showSearch
            filterOption={filterOption}
            options={instanceOptions}
            style={{ minWidth: 300 }}
          />
        </Form.Item>}
        {(selectedKey === 'workload' || selectedKey === 'pod' || selectedKey === 'container') &&
          <Form.Item label="namespace" name="namespace">
            <Select showSearch filterOption={filterOption} options={namespaceOptions} style={{ width: 300 }} />
          </Form.Item>}
        {(selectedKey === 'workload') &&
          <Form.Item label="type" name="type" initialValue={typeOptions[0].value}>
            <Select options={typeOptions} style={{ width: 300 }} />
          </Form.Item>}
        {(selectedKey === 'workload') &&
          <Form.Item label="workload" name="workload">
            <Select
              mode="multiple"
              maxTagCount={2}
              showSearch
              filterOption={filterOption}
              options={workloadOptions}
              style={{ minWidth: 300 }}
            />
          </Form.Item>}
        {(selectedKey === 'pod' || selectedKey === 'container') &&
          <Form.Item label="pod" name="pod">
            <Select
              mode={selectedKey === 'pod' ? 'multiple' : '-'}
              maxTagCount={2}
              showSearch
              filterOption={filterOption}
              options={podOptions}
              style={{ minWidth: 300 }}
            />
          </Form.Item>}
        {(selectedKey === 'container') &&
          <Form.Item label="container" name="container">
            <Select
              showSearch
              mode="multiple"
              maxTagCount={2}
              filterOption={filterOption}
              options={containerOptions}
              style={{ width: 300 }}
            />
          </Form.Item>}
      </Form>
    </div>
    {selectedKey === 'cluster' && <ClusterMonitor
      data={clusterData}
      timelyData={timelyData}
      loaded={isFirstLoaded ? detailed : true}
      propsColor={propsColor}
      handleShowScreen={handleShowScreenBool}
      refreshFn={() => timeCallbackFn('cluster', clusterValue)}
    />}
    {selectedKey === 'node' && <NodeMonitor
      data={nodeData}
      timelyData={timelyData}
      loaded={isFirstLoaded ? detailed : true}
      propsColor={propsColor}
      handleShowScreen={handleShowScreenBool}
      refreshFn={() => timeCallbackFn('node', clusterValue)}
    />}
    {selectedKey === 'workload' &&
      <WorkloadMonitor
        data={workloadData}
        loaded={isFirstLoaded ? detailed : true}
        propsColor={propsColor}
        handleShowScreen={handleShowScreenBool}
        refreshFn={() => timeCallbackFn('workload', clusterValue)}
      />}
    {selectedKey === 'pod' &&
      <PodMonitor
        data={podData}
        timelyData={timelyData}
        loaded={isFirstLoaded ? detailed : true}
        propsColor={propsColor}
        handleShowScreen={handleShowScreenBool}
        refreshFn={() => timeCallbackFn('pod', clusterValue)}
      />}
    {selectedKey === 'container' &&
      <ContainerMonitor
        data={containerData}
        timelyData={timelyData}
        loaded={isFirstLoaded ? detailed : true}
        propsColor={propsColor}
        handleShowScreen={handleShowScreenBool}
        refreshFn={() => timeCallbackFn('container', clusterValue)}
      />}
  </div>;
}