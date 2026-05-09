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
import { Fragment, useCallback, useEffect, useState, useStore } from 'openinula';
import { SyncOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import Etcd from '@/pages/container/monitor/monitorDashboard/componentSelect/Etcd';
import KubeApiServer from '@/pages/container/monitor/monitorDashboard/componentSelect/KubeApiServer';
import KubeController from '@/pages/container/monitor/monitorDashboard/componentSelect/KubeController';
import KubeScheduler from '@/pages/container/monitor/monitorDashboard/componentSelect/KubeScheduler';
import KubeLet from '@/pages/container/monitor/monitorDashboard/componentSelect/KubeLet';
import KubeProxy from '@/pages/container/monitor/monitorDashboard/componentSelect/KubeProxy';
import Addon from '@/pages/container/monitor/monitorDashboard/componentSelect/Addon';
import {
  timePeriodOptions,
  refreshTimeOptions,
  controllMonitorOptions,
  nodeMonitorOptions,
  ResponseCode,
  stepList,
} from '@/common/constants';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import {
  getComponentControllPlatformMonitor,
  getResourceMonitor,
} from '@/api/monitorApi';
import { getServiceTimeZoneInterface } from '@/api/containerApi';
import { solveMonitorComponentData, firstAlphabetUp, debounce, timelayDataComponentSolve } from '@/tools/utils';
import infoStore from '@/store/infoStore';
import DiffTimeInfo from '@/components/DiffTimeInfo';

Dayjs.locale('zh-cn');

let lastPerformanceTime = window.performance.now();
let lastDate = new Date().getTime();
let checkComTimeChangeTimer = null;
let componentTimer = null;
export default function ComponentMonitor({ propsType, propsColor }) {
  let isFirstLoaded = true; // 首次加载
  let abortController = null;
  const [selectedKey, setSelectedKeys] = useState('controll');
  const [timeForm] = Form.useForm();
  const [componentForm] = Form.useForm();
  const infoStoreExample = infoStore();
  const componentValue = Form.useWatch('component', componentForm);
  const refreshTimeValue = Form.useWatch('refreshTime', timeForm); // 刷新间隔
  const [monitorIntervalId, setMonitorInterValId] = useState(0); // 定时器id
  const [instanceOptions, setInstanceOptions] = useState([]); // 设置instance
  const [componentOptions, setComponentOptions] = useState([]); // 设置component
  const [etcdData, setEtcdData] = useState({});
  const [refreshTimePageOptions, setRefreshTimePageOptions] = useState(refreshTimeOptions);
  const [detailed, setDetailed] = useState(false); // 加载完成
  const [resourceDetailed, setResourceDetailed] = useState(false); // 资源
  const [resourceListOptions, setResourceListOptions] = useState([]);
  const [verbOptions, setVerbOptions] = useState([]);
  const [kubeApiServerData, setKubeApiServerData] = useState({}); // kube-apuserver
  const [kubeControllerData, setKubeControllerData] = useState({});
  const [kubeschedulerData, setKubeSchedulerData] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
  const [isScreenTrue, setIsScreenTrue] = useState(false); // 控制页面刷新动作是否显示骨架屏
  const [isTimeRefresh, setIsTimeRefresh] = useState(false); // 区分自动刷新没有新数据不隐藏
  const [diffTime, setDiffTime] = useState(0); // 相差时间
  const [timelyData, setTimelyData] = useState(); // 瞬时数据

  const [kubeLetData, setKubeLetData] = useState({}); // 节点组件数据
  const [kubeProxyData, setKubeProxyData] = useState({});

  const [addonData, setAddonData] = useState({});

  const themeStore = useStore('theme');

  // hash映射
  const temporyHashMap = {
    etcd: data => setEtcdData(data),
    kubeApiserver: data => setKubeApiServerData(data),
    kubeControllerManager: data => setKubeControllerData(data),
    kubeScheduler: data => setKubeSchedulerData(data),
    kubelet: data => setKubeLetData(data),
    kubeProxy: data => setKubeProxyData(data),
    coredns: data => setAddonData(data),
  };

  const handleSelectedMonitorKeys = (e) => {
    setSelectedKeys(e.target.value);
    // 设置默认值
    if (e.target.value === 'controll') {
      componentForm.setFieldsValue({
        component: 'etcd',
      });
    }
    if (e.target.value === 'node') {
      componentForm.setFieldsValue({
        component: 'kubelet',
      });
    }
  };

  // 获取瞬时数据
  const getTimelyData = async (key, component, conditions) => {
    const res = await getComponentControllPlatformMonitor({ key, component, conditions });
    if (res.status === ResponseCode.OK) {
      setTimelyData(timelayDataComponentSolve(component, res.data.results));
    }
  };

  const handleResetMonitor = () => {
    renderRequest(selectedKey, componentValue || 'addon', false);
  };

  const getComponenOptions = useCallback((key) => {
    const optionsMap = {
      controll: controllMonitorOptions,
      node: nodeMonitorOptions,
      addon: [],
    };
    setComponentOptions(optionsMap[key]);
  }, []);

  // 修改时间回调
  const timeCallbackFn = (key, value, isLoad = false, endTime = Dayjs()) => {
    timeForm.setFieldValue('endTime', endTime);
    renderRequest(key, value, isLoad, true); // 默认展示大卡片
  };

  // 获取控制组件接口
  const getMonitorComponentControlData = useCallback(async (key, value, isShowScreen) => {
    isFirstLoaded ? setDetailed(false) : '';
    const formValues = timeForm.getFieldsValue();
    const comValues = componentForm.getFieldsValue();
    let monitorStart = Dayjs(formValues.endTime).subtract(parseInt(formValues.period), formValues.period.slice(-1));
    let monitorEnd = Dayjs(formValues.endTime);
    // 处理失去问题
    const offset = infoStoreExample.$s.offsetCompareLocal;
    if (offset !== 0) {
      if (offset > 0) {
        monitorStart = monitorStart.subtract(offset, 'minute');
        monitorEnd = monitorEnd.subtract(offset, 'minute');
      } else {
        monitorStart = monitorStart.add(Math.abs(offset), 'minute');
        monitorEnd = monitorEnd.add(Math.abs(offset), 'minute');
      }
    }
    monitorStart = monitorStart.format('YYYY-MM-DD HH:mm:ss');
    monitorEnd = monitorEnd.format('YYYY-MM-DD HH:mm:ss');
    let resource = '';
    if (comValues.resource) {
      resource = comValues.resource.join('|');
    }
    let instance = '';
    if (comValues.instance) {
      instance = comValues.instance.join('|');
    }
    let verb = '';
    if (comValues.verb) {
      verb = comValues.verb.join('|');
    }
    let conditions = {
      step: stepList[formValues.period],
      verb,
      resource,
      instance,
    };
    let passValue = value;
    if (key === 'addon') {
      passValue = 'coredns';
    }
    (passValue === 'etcd' || passValue === 'kube-apiserver') ? getTimelyData(key, passValue, { ...conditions, step: '' }) : '';
    // 处理逻辑
    let newValue = '';
    passValue.split('-').map((item, index) => {
      index ? newValue += firstAlphabetUp(item) : newValue += item;
    });
    // 处理数据源
    let data = {};
    try {
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();
      const { signal, ...resets } = abortController;
      const res = await getComponentControllPlatformMonitor({ key, component: passValue, start: monitorStart, end: monitorEnd, conditions }, signal);
      if (res.status === ResponseCode.OK) {
        data = solveMonitorComponentData(passValue, res.data.results);
      }
    } catch (e) {
      if (e.response.status !== ResponseCode.OK) {
        messageApi.error(`数据获取失败！${e.response.data}`);
      }
    }
    temporyHashMap[newValue](data);
    setDetailed(true);
    isFirstLoaded = false;       
  }, []);

  // 获取instance
  const getResourceList = useCallback(async (value, isShowScreen) => {
    isFirstLoaded ? setResourceDetailed(false) : '';
    if (value !== 'kube-apiserver') {
      const expr = `up{job="${value}"}`;
      const res = await getResourceMonitor(expr);
      if (res.status === ResponseCode.OK) {
        let options = [];
        // 设置instances
        res.data.data.result?.map(item => {
          if (item.labels && item.labels.instance) {
            // 判断是否重复塞值
            if (!options.filter(opItem => opItem.value === item.labels.instance).length) {
              options.push({ label: item.labels.instance, value: item.labels.instance });
            }
          }
        });
        setInstanceOptions([...options]);
        // 设置instance
        if (options.length) {
          componentForm.setFieldValue('instance', options.length ? [options[0].value] : undefined);
        }
      }
    } else {
      const resourceRes = await getResourceMonitor('count(apiserver_request_total) by (resource)');
      if (resourceRes.status === ResponseCode.OK) {
        let options = [];
        if (resourceRes.data.code === 0) {
          if (resourceRes.data.data.result) {
            resourceRes.data.data.result.map(item => {
              if (item.labels && item.labels.resource) {
                options.push({ label: item.labels.resource, value: item.labels.resource });
              }
            });
          }
          setResourceListOptions([...options]);
          if (options.length) {
            componentForm.setFieldValue('resource', options.length ? [options[0].value] : undefined);
          }
        }
      }
      const expr = `count(apiserver_request_total) by (verb)`;
      const verbRes = await getResourceMonitor(expr);
      if (verbRes.status === ResponseCode.OK) {
        let options = [];
        if (verbRes.data.code === 0) {
          if (verbRes.data.data.result) {
            verbRes.data.data.result.map(item => {
              if (item.labels && item.labels.verb) {
                options.push({ label: item.labels.verb, value: item.labels.verb });
              }
            });
          }
          setVerbOptions([...options]);
          if (options.length) {
            componentForm.setFieldValue('verb', options.length ? [options[0].value] : undefined);
          }
        }
      }
    }
    setResourceDetailed(true);
  }, []);

  const renderRequest = useCallback(async (key, value, isRunInstance = true, isShowScreen = isScreenTrue) => {
    let passValue = value;
    if (passValue) {
      if (key === 'addon') {
        passValue = 'kube-dns';
      }
      if (isRunInstance) {
        await getResourceList(passValue, isShowScreen);
      }
      getTimeServiceComponent(); // 获取时间
      getMonitorComponentControlData(key, passValue, isShowScreen);
    }
  }, []);

  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  // 自动刷新
  const getWebSockect = useCallback(() => {
    if (monitorIntervalId) {
      clearInterval(monitorIntervalId); // 清除计时器
      setMonitorInterValId(0);
    }
    if (refreshTimeValue) {
      clearInterval(componentTimer);
      componentTimer = setInterval(() => {
        getTimeServiceComponent();
      }, refreshTimeValue * 1000);
      const id = setInterval(() => {
        // 操作
        timeForm.setFieldValue('endTime', Dayjs()); // 时间赋值
        // 请求接口
        renderRequest(selectedKey, componentValue || 'addon', false, isScreenTrue);
        // 请求数据
      }, refreshTimeValue * 1000);
      setMonitorInterValId(id);
    }
  }, [refreshTimeValue, selectedKey, componentValue, isScreenTrue]);

  const checkComTime = () => {
    let currentPerformanceTime = window.performance.now();
    let currentDate = new Date().getTime();
    let performanceDiff = currentPerformanceTime - lastPerformanceTime;
    let dateDiff = currentDate - lastDate;
    if (Math.abs(performanceDiff - dateDiff) > 1000) {
      getTimeServiceComponent();
      timeForm.setFieldValue('endTime', Dayjs(currentDate));
      renderRequest(selectedKey, componentValue || 'addon', false, isScreenTrue);
    }
    lastPerformanceTime = currentPerformanceTime;
    lastDate = currentDate;
    if (checkComTimeChangeTimer) {
      clearTimeout(checkComTimeChangeTimer);
    }
    checkComTimeChangeTimer = setTimeout(checkComTime, 1000);
  };
  
  useEffect(() => {
    checkComTimeChangeTimer = setTimeout(checkComTime, 1000);
    return () => clearTimeout(checkComTimeChangeTimer);
  }, [selectedKey, componentValue, isScreenTrue]);

  useEffect(() => {
    if (propsType === 'resource') {
      clearInterval(monitorIntervalId);
    }
    return () => clearInterval(monitorIntervalId);
  }, [propsType, monitorIntervalId]);

  useEffect(() => {
    getWebSockect();
    return () => clearInterval(componentTimer);
  }, [getWebSockect]);

  useEffect(() => {
    getComponenOptions(selectedKey);
    if (!isNaN(infoStoreExample.$s.offsetCompareLocal)) {
      renderRequest(selectedKey, componentValue);
    }
  }, [selectedKey, componentValue, getComponenOptions, infoStoreExample.$s.offsetCompareLocal]);

  const handleValueChange = (changeValues) => {
    if (Object.prototype.hasOwnProperty.call(changeValues, 'endTime')) {
      timeForm.setFieldValue('refreshTime', 0);
      let temporyOptionsComponentMonitor = [];
      if (Dayjs(changeValues.endTime[0]) === Dayjs()) { // 此刻
        temporyOptionsComponentMonitor.push({ ...item });
      } else {
        refreshTimeOptions.map(item => {
          if (item.value !== 0) {
            const timeTempory = changeValues.endTime ? Dayjs(changeValues.endTime).format('YYYY-MM-DD HH:mm:ss') : undefined;
            if (timeTempory === Dayjs().format('YYYY-MM-DD HH:mm:ss')) { // 此刻
              temporyOptionsComponentMonitor.push({ ...item });
            } else {
              temporyOptionsComponentMonitor.push({ ...item, disabled: true });
            }
          } else {
            temporyOptionsComponentMonitor.push(item);
          }
        });
      }
      setRefreshTimePageOptions([...temporyOptionsComponentMonitor]);
    }
    if (!Object.prototype.hasOwnProperty.call(changeValues, 'refreshTime')) {
      debounce(renderRequest(selectedKey, componentValue, false), 3000);
    }
  };

  const handleComponentChange = (changeValues) => {
    if (!Object.prototype.hasOwnProperty.call(changeValues, 'component')) {
      debounce(renderRequest(selectedKey, componentValue || 'addon', false), 3000);
    }
  };

  const handleShowScreenBool = (value) => {
    setIsScreenTrue(value);
  };

  const renderInstanceCount = (data, type) => {
    if (data) {
      if (isNaN(data.up) && isNaN(data.down)) {
        return '--';
      } else {
        if (type === 'up') {
          return isNaN(data.up) || data.up === -1 ? '--' : (data.up || '--');
        }
        if (type === 'down') {
          return isNaN(data.down) || data.down === -1 ? '--' : (data.down || '--');
        }
      }
    }
    return '--';
  };

  const getTimeServiceComponent = useCallback(async () => {
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
        <Radio.Button value="controll">控制平面组件</Radio.Button>
        <Radio.Button value="node">节点组件</Radio.Button>
        <Radio.Button value="addon">Addon</Radio.Button>
      </Radio.Group>
      <ConfigProvider locale={zhCN}>
        <Form form={timeForm} layout='inline' onValuesChange={handleValueChange} initialValues={{
          endTime: Dayjs(),
          period: '10m',
          refreshTime: 30,
        }}>
          <Form.Item name="period" className='ComponentMonitor'>
            <Select options={timePeriodOptions} style={{ minWidth: '100px' }} />
          </Form.Item>
          <Form.Item name="endTime" label="结束时间" className='ComponentMonitor'>
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="refreshTime" className='ComponentMonitor'>
            <Select className='refresh_time_select' options={refreshTimePageOptions} />
          </Form.Item>
          <Form.Item className='ComponentMonitor'>
            <Button icon={<SyncOutlined />} onClick={handleResetMonitor} className="reset_btn"></Button>
          </Form.Item>
        </Form>
      </ConfigProvider>
    </div>
    <div className='monitor_search' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <Form form={componentForm} layout='inline' onValuesChange={handleComponentChange} initialValues={{
        component: 'etcd',
      }}>
        {selectedKey !== 'addon' && <Form.Item label="组件" name="component">
          <Select options={componentOptions} style={{ width: 300 }} />
        </Form.Item>
        }
        {componentValue !== 'kube-apiserver' && <Form.Item label="instance" name="instance">
          <Select
            mode="multiple"
            maxTagCount={2}
            allowClear
            showSearch
            filterOption={filterOption}
            options={instanceOptions}
            style={{ minWidth: 300 }}
          />
        </Form.Item>}
        {componentValue === 'kube-apiserver' && <>
          <Form.Item label="resource" name="resource">
            <Select
              mode="multiple"
              maxTagCount={2}
              options={resourceListOptions}
              style={{ minWidth: 300 }}
            />
          </Form.Item><Form.Item label="verb" name="verb">
            <Select
              mode="multiple"
              maxTagCount={2}
              allowClear
              options={verbOptions}
              style={{ minWidth: 300 }}
            />
          </Form.Item>
        </>
        }
      </Form>
    </div>
    {componentValue === 'etcd' && <div className='show_component_card' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <div className='monitor_aim_flex'>
        <div className='monitor_aim_flex_item'>
          <p style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>ETCD</p>
          <p>组件名称</p>
        </div>
      </div>
      <div className='monitor_aim_flex_item'>
        <p style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{renderInstanceCount(timelyData, 'down')}</p>
        <p>非运行中的etcd实例总数</p>
      </div>
      <div className='monitor_aim_flex_item'>
        <p style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{renderInstanceCount(timelyData, 'up')}</p>
        <p>运行中的etcd实例总数</p>
      </div>
      <div className='monitor_aim_flex_item'>
        <p style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{timelyData?.total || '--'}</p>
        <p>实例总数</p>
      </div>
    </div>}
    {componentValue === 'kube-apiserver' && <div className='show_component_card'>
      <div className='monitor_aim_flex'>
        <div className='monitor_aim_flex_item'>
          <p>kube-apiserver</p>
          <p>组件名称</p>
        </div>
      </div>
      <div className='monitor_aim_flex_item'>
        <p>{timelyData?.apiQps}</p>
        <p>API QPS（rps）</p>
      </div>
      <div className='monitor_aim_flex_item'>
        <p>{timelyData?.readRequestSuccessRate}%</p>
        <p>读请求成功率（%）</p>
      </div>
      <div className='monitor_aim_flex_item'>
        <p>{timelyData?.writeRequestSuccessRate}%</p>
        <p>写请求成功率（%）</p>
      </div>
    </div>}
    {componentValue === 'etcd' && <Etcd
      etcdData={etcdData}
      loaded={isFirstLoaded ? (detailed && resourceDetailed) : true}
      handleShowScreen={handleShowScreenBool}
      refreshFn={() => timeCallbackFn('controll', 'etcd')}
      propsColor={propsColor}
    />}
    {componentValue === 'kube-apiserver' && <KubeApiServer
      data={kubeApiServerData}
      loaded={isFirstLoaded ? (detailed && resourceDetailed) : true}
      handleShowScreen={handleShowScreenBool}
      refreshFn={() => timeCallbackFn('controll', 'kube-apiserver')}
      propsColor={propsColor}
    />}
    {componentValue === 'kube-controller-manager' && <KubeController
      data={kubeControllerData}
      loaded={isFirstLoaded ? (detailed && resourceDetailed) : true}
      handleShowScreen={handleShowScreenBool}
      refreshFn={() => timeCallbackFn('controll', 'kube-controller-manager')}
      propsColor={propsColor}
    />}
    {componentValue === 'kube-scheduler' && <KubeScheduler
      data={kubeschedulerData}
      loaded={isFirstLoaded ? (detailed && resourceDetailed) : true}
      handleShowScreen={handleShowScreenBool}
      propsColor={propsColor}
      refreshFn={() => timeCallbackFn('controll', 'kube-scheduler')}
    />}
    {selectedKey === 'node' && <Fragment>
      {componentValue === 'kubelet' && <KubeLet
        data={kubeLetData}
        handleShowScreen={handleShowScreenBool}
        loaded={isFirstLoaded ? (detailed && resourceDetailed) : true}
        propsColor={propsColor}
        refreshFn={() => timeCallbackFn('node', 'kubelet')}
      />}
      {componentValue === 'kube-proxy' && <KubeProxy
        data={kubeProxyData}
        handleShowScreen={handleShowScreenBool}
        loaded={isFirstLoaded ? (detailed && resourceDetailed) : true}
        propsColor={propsColor}
        refreshFn={() => timeCallbackFn('node', 'kube-proxy')}
      />}
    </Fragment>}
    {selectedKey === 'addon' && <Addon
      data={addonData}
      handleShowScreen={handleShowScreenBool}
      loaded={isFirstLoaded ? (detailed && resourceDetailed) : true}
      propsColor={propsColor}
      refreshFn={() => timeCallbackFn('addon', 'addon')}
    />}
  </div>;
}