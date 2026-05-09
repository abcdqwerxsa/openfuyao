/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
 *       http://license.coscl.org.cn/MulanPSL2
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */
import { Form, Select, DatePicker, Button, ConfigProvider, message } from 'antd';
import { useCallback, useEffect, useState, useStore } from 'openinula';
import { SyncOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import {
  timePeriodOptions,
  refreshTimeOptions,
  ResponseCode,
  stepList,
} from '@/common/constants';
import WorkloadMonitor from '@/pages/container/monitor/monitorDashboard/resourceSelect/WorkloadMonitor';
import { getResourceControllMonitor } from '@/api/monitorApi';
import { solveMonitorComponentData, solveDataAreaNumPalettePlus } from '@/tools/utils';
import '@/styles/pages/helm.less';
import infoStore from '@/store/infoStore';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
Dayjs.locale('zh-cn');
import ToastMsg from '@/components/ToastMsg';

/**
 * Application Monitor Tab Component
 *
 * @param {Object} props
 * @param {Object} props.dataProps - Resource data
 */
export default function ApplicationMonitorTab({ dataProps }) {
  let isFirstLoaded = true; // 首次加载

  const [messageApi, contextHolder] = message.useMessage();

  const [timeForm] = Form.useForm();

  const [clusterForm] = Form.useForm();

  const infoStoreExample = infoStore();

  const refreshTimeValue = Form.useWatch('refreshTime', timeForm); // 刷新间隔

  const [intervalId, setInterValId] = useState(0); // 定时器id

  const [workloadOptions, setWorkloadOptions] = useState([]);

  const [namespaceOptions, setNamespaceOptions] = useState([]);

  const [typeOptions, setTypeOptions] = useState([]);

  const [workloadData, setWorkloadData] = useState({});

  const [isLoading, setIsLoading] = useState(false);

  const [initOptions, setInitOptions] = useState([]);

  const [color, setColor] = useState([]); // 生成随机颜色

  const themeStore = useStore('theme');

  const handleResetMonitor = () => {
    timeForm.resetFields();
    renderRequest();
  };

  const getNamespaceTypeWorkloadList = () => {
    let _arr = [];
    let options = [];
    if (dataProps.resources) {
      dataProps.resources.forEach(i => {
        if (i.namespace) {
          _arr.push(i.namespace);
          const filterList = options.filter(filterItem => filterItem.value === i.namespace);
          if (filterList.length) {
            options.map(mapItem => {
              if (mapItem.value === i.namespace) {
                if (mapItem.children.filter(mapFilterItem => mapFilterItem.value === i.kind).length) { // 只workdload
                  const mapFindIndex = mapItem.children.findIndex((mapFilterItem) => mapFilterItem.value === i.kind);
                  mapItem.children[mapFindIndex].children.push({ value: i.name, label: i.name });
                } else {
                  if (i.kind === 'Deployment' || i.kind === 'StatefulSet' || i.kind === 'DaemonSet') {
                    mapItem.children.push({
                      value: i.kind.toLowerCase(),
                      label: i.kind.toLowerCase(),
                      children: [{ value: i.name, label: i.name }],
                    }); // type+workload
                  }
                }
              }
            });
          } else {
            if (i.kind === 'Deployment' || i.kind === 'StatefulSet' || i.kind === 'DaemonSet') {
              options.push({
                value: i.namespace,
                label: i.namespace,
                children: [{
                  value: i.kind.toLowerCase(),
                  label: i.kind.toLowerCase(),
                  children: [{ value: i.name, label: i.name }],
                }],
              });
            }
          }
        }
      });
    } else {
      return;
    }
    let namespaceArr = [];
    options.forEach(namespaceItem => {
      namespaceArr.push({ value: namespaceItem.value, label: namespaceItem.value });
    });

    setInitOptions(options);
    setNamespaceOptions(namespaceArr);
    let typeOptionArr = [];
    options[0].children.forEach(i => {
      typeOptionArr.push(i.value);
    });
    let _typeOption = [];
    typeOptionArr = [...new Set(typeOptionArr)];
    typeOptionArr.forEach(i => {
      _typeOption.push({ value: i, label: i });
    });
    setTypeOptions(_typeOption);
    setWorkloadOptions(options[0].children[0].children);

    clusterForm.setFieldValue('namespace', namespaceArr[0].value);
    clusterForm.setFieldValue('type', options[0].children[0].value);
    clusterForm.setFieldValue('workload', options[0].children[0].children[0].value);
  };

  const getResourceMonitor = useCallback(async () => {
    isFirstLoaded ? setIsLoading(false) : '';
    const formValues = timeForm.getFieldsValue();
    const comValues = clusterForm.getFieldsValue();
    let monitorDetailStart = Dayjs(formValues.endTime).subtract(parseInt(formValues.period), formValues.period.slice(-1));
    let monitorDetailEnd = Dayjs(formValues.endTime);
    // 处理时区问题
    const offset = infoStoreExample.$s.offsetCompareLocal;
    if (offset !== 0) {
      if (offset > 0) {
        monitorDetailStart = monitorDetailStart.subtract(offset, 'minute');
        monitorDetailEnd = monitorDetailEnd.subtract(offset, 'minute');
      } else {
        monitorDetailStart = monitorDetailStart.add(Math.abs(offset), 'minute');
        monitorDetailEnd = monitorDetailEnd.add(Math.abs(offset), 'minute');
      }
    }
    monitorDetailStart = monitorDetailStart.format('YYYY-MM-DD HH:mm:ss');
    monitorDetailEnd = monitorDetailEnd.format('YYYY-MM-DD HH:mm:ss');
    let conditions = {
      step: stepList[formValues.period],
      namespace: comValues.namespace,
      type: comValues.type,
      workload: comValues.workload,
    };
    let data = {};
    try {
      if (comValues.namespace && comValues.type && comValues.workload) {
        setIsLoading(true);
        const res = await getResourceControllMonitor({ cluster: 'cluster', value: 'workload', start: monitorDetailStart, end: monitorDetailEnd, conditions });
        if (res.status === ResponseCode.OK) {
          data = res.data.results;
          setWorkloadData(solveMonitorComponentData('workload', data));
        }
      } else {
        setWorkloadData({});
      }
    } catch (e) {
      messageApi.error('数据获取失败');
    }
    setIsLoading(true);
    isFirstLoaded = false;
  }, []);

  const renderRequest = useCallback(async () => {
    isFirstLoaded ? setIsLoading(false) : '';
    getResourceMonitor();
  }, []);

  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  // 自动刷新
  const getWebSockect = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId); // 清除计时器
      setInterValId(0);
    }
    if (refreshTimeValue) {
      const id = setInterval(() => {
        // 操作
        timeForm.setFieldValue('endTime', Dayjs()); // 时间赋值
        // 请求数据
        renderRequest();
      }, refreshTimeValue * 1000);
      setInterValId(id);
      localStorage.setItem('timeId', id);
    }
  }, [refreshTimeValue]);

  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  useEffect(() => {
    getWebSockect();
  }, [getWebSockect]);

  const handleValueChange = (changeValues) => {
    if (Object.prototype.hasOwnProperty.call(changeValues, 'endTime')) {
      timeForm.setFieldValue('refreshTime', 0);
    }
    getResourceMonitor();
  };

  // 修改时间回调
  const timeCallbackFn = (key, value, endTime = Dayjs()) => {
    timeForm.setFieldValue('endTime', endTime);
    renderRequest();
  };

  const handleClusterChange = async (changeValues) => {
    getResourceMonitor();
  };

  const handleChangeNamespace = (value) => {
    let namespaceTypeArr = [];
    initOptions.filter(item => {
      if (item.value === value) {
        item.children.forEach(i => {
          namespaceTypeArr.push(i.value);
        });
      }
    });
    clusterForm.setFieldValue('type', namespaceTypeArr[0]);
    let _newTypeArr = [...new Set(namespaceTypeArr)];
    let _typeArr = [];
    _newTypeArr.forEach(i => {
      _typeArr.push({ label: i, value: i });
    });
    setTypeOptions(_typeArr);
    handleChangeType(_typeArr[0].value);
    getResourceMonitor();
  };

  // type onchange
  const handleChangeType = (value) => {
    let typeWorkloadArr = [];
    initOptions.filter(item => {
      item.children.filter(i => {
        if (i.value === value) {
          i.children.forEach(workloadItem => {
            typeWorkloadArr.push(workloadItem.value);
          });
        }
      });
    });
    clusterForm.setFieldValue('workload', typeWorkloadArr[0]);
    let _newWorkloadArr = [...new Set(typeWorkloadArr)];
    let _workloadArr = [];
    _newWorkloadArr.forEach(i => {
      _workloadArr.push({ label: i, value: i });
    });
    setWorkloadOptions(_workloadArr);
    getResourceMonitor();
  };

  // workload onchange
  const handleChangeWorkload = (value) => {
    getResourceMonitor();
  };

  useEffect(() => {
    const rangeBirthColorList = solveDataAreaNumPalettePlus(1000); // 颜色区间根据类别生成
    setColor(rangeBirthColorList);
  }, []);

  useEffect(() => {
    getNamespaceTypeWorkloadList();
    renderRequest();
  }, []);

  return <div className="helm_tab_container container_margin_box tooltip_container_height">
    <ToastMsg contextHolder={contextHolder} />
    <div className="helm_monitor_card" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#f7f7f7' : '#171a1f' }}>
      <div className='helm_monitor_form' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div className='first_form'>
          <Form form={clusterForm} layout='inline'>
            <Form.Item label="namespace" name="namespace">
              <Select showSearch filterOption={filterOption} options={namespaceOptions} onChange={handleChangeNamespace} className='long-select' />
            </Form.Item>
            <Form.Item label="type" name="type" >
              <Select filterOption={filterOption} options={typeOptions} onChange={handleChangeType} className='long-select' />
            </Form.Item>
            <Form.Item label="workload" name="workload">
              <Select showSearch filterOption={filterOption} options={workloadOptions} onChange={handleChangeWorkload} className='long-select' />
            </Form.Item>
          </Form>
        </div>
        <div>
          <Form form={timeForm} layout='inline' onValuesChange={handleValueChange} initialValues={{
            period: '10m',
            endTime: Dayjs(),
            refreshTime: 0,
          }}>
            <ConfigProvider locale={zhCN}>
              <Form.Item name="period">
                <Select options={timePeriodOptions} className='short-select' />
              </Form.Item>
              <Form.Item name="endTime" label="结束时间">
                <DatePicker showTime className='long-select' />
              </Form.Item>
              <Form.Item name="refreshTime">
                <Select options={refreshTimeOptions} className='short-select' />
              </Form.Item>
              <Form.Item>
                <Button icon={<SyncOutlined />} onClick={handleResetMonitor} className="reset_btn"></Button>
              </Form.Item>
            </ConfigProvider>
          </Form>
        </div>
      </div>
      <WorkloadMonitor data={workloadData} loaded={isFirstLoaded ? isLoading : true} propsColor={color} refreshFn={() => timeCallbackFn('cluster')} />
    </div>
  </div>;
}