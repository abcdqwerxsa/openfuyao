/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant.js';
import { Link, useLocation } from 'inula-router';
import { useEffect, useState, useStore } from 'openinula';
import { Select, Form, Button, Table, Space, ConfigProvider, Modal, DatePicker, Input, message, InputNumber } from 'antd';
import { filterRepeat, filterAlertStatus, filterAlertStatusStyle, filterAlertTime, filterContinueTime } from '@/utils/common';
import { ResponseCode } from '@/common/constants';
import '@/styles/pages/alarm.less';
import { SettingOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN';
import dayjs from 'dayjs';
import { getAlertOptions, creatSilentAlert, getLoki } from '@/api/containerAlertApi';
import { solveAnnotation, sorterFirstAlphabet } from '@/tools/utils';
import SetSilentAlarmModal from './SetSilentAlarmModal';
let formLevel = '全部';
let formTime = '全部';
let formResource = '全部';
let setTimeoutId = 0;
let searchString = '';
let continueTime = [];
export default function AlarmIndex() {
  const userStore = useStore();
  const themeStore = useStore('theme');
  const [alertForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isShowEditModal, SetIsShowEditModal] = useState(false);
  const [selectSilentLabel, setSelectSilentLabel] = useState([]);
  const [alertTableList, setAlertTableList] = useState([]);
  const [matchers, setMarchers] = useState([]);
  const [critical, setCritical] = useState(0);
  const [warning, setWarning] = useState(0);
  const [info, setInfo] = useState(0);
  const [remarks, SetRemarks] = useState('');
  const location = useLocation();
  const defaultOptions = [{
    label: '全部',
    value: '全部',
  }];
  const [labelOptions, setLabelOptions] = useState([
  ]);
  const [alertNameOption, setAlertNameOption] = useState([
  ]);
  const [alertLevelOption, setAlertLevelOption] = useState([
    { label: '全部', value: '全部' },
    { label: '严重', value: 'critical' },
    { label: '警告', value: 'warning' },
    { label: '提示', value: 'info' },
  ]);
  const [alertTimeOption, setAlertTimeOption] = useState([
    {
      value: '全部',
      label: '全部',
    },
    {
      value: '1d',
      label: '1天以内',
    },
    {
      value: '1-5d',
      label: '1-5天以内',
    },
    {
      value: '5-10d',
      label: '5-10天以内',
    },
    {
      value: '10d',
      label: '10天以上',
    },
  ]);
  const [alertSourceOption, setAlertSourceOption] = useState([{ label: '全部', value: '' }, { label: 'prometheus', value: 'prometheus' }]);
  const resetSearch = () => {
    searchString = '';
    alertForm.resetFields();
    setSelectSilentLabel([]);
    formLevel = '全部';
    formTime = '全部';
    formResource = '全部';
    getAlert();
  };
  const editSilentAlarm = (data) => {
    SetIsShowEditModal(true);
    let _matchers = [];
    solveAnnotation(data.labels).map(item => {
      _matchers.push({
        name: item.key,
        value: item.value,
        isRegex: false,
        isEqual: true,
      });
    });
    setMarchers(_matchers);
    SetRemarks(data.comment);
  };
  const cancelEdit = () => {
    SetIsShowEditModal(false);
  };
  const handleChildClick = (data) => {
    let arr = data;
    arr.matchers = matchers;
    editSilent(arr);
  };
  const editSilent = async (data) => {
    try {
      const res = await creatSilentAlert(data);
      if (res.status === ResponseCode.OK) {
        messageApi.success('设置静默成功！');
        cancelEdit();
        getAlert();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('编辑静默失败！');
      }
    }
  };
  // table项
  const stateColumns = [
    {
      title: '告警名称',
      key: 'name',
      fixed: 'left',
      sorter: (a, b) => sorterFirstAlphabet(a.name, b.name),
      render: (_, record) => (
        <Space size="middle" className="alertName">
          <Link to={{ pathname: `/${containerRouterPrefix}/alarm/alarmIndex/detail/${record.name}`, state: { currentdetail: record } }}>{record.name}</Link>
        </Space>
      ),
    },
    {
      title: '告警描述',
      key: 'desc',
      width: '20%',
      sorter: (a, b) => sorterFirstAlphabet(a.desc, b.desc),
      render: (_, record) => (
        <Space size="middle" className="">{record.desc}</Space>
      ),
    },
    {
      title: '命名空间',
      key: 'namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.namespace, b.namespace),
      render: (_, record) => (
        <Space size="middle" className="">{record.namespace}</Space>
      ),
    },
    {
      title: 'Pod',
      key: 'pod',
      sorter: (a, b) => sorterFirstAlphabet(a.pod, b.pod),
      render: (_, record) => (
        <Space size="middle" style={{ paddingRight: '10px', maxWidth: '200px', wordBreak: 'break-all' }}>{record.pod}</Space>
      ),
    },
    {
      title: '告警等级',
      key: 'level',
      sorter: (a, b) => sorterFirstAlphabet(filterAlertStatus(a.level), filterAlertStatus(b.level)),
      render: (_, record) => (
        <Space size="middle" className="">
          <div style={filterAlertStatusStyle(record.level)}>
            {filterAlertStatus(record.level)}
          </div>
        </Space>
      ),
    },
    {
      title: '持续时间',
      key: 'timeDiff',
      sorter: (a, b) => sorterFirstAlphabet(a.timeDiff, b.timeDiff),
      render: (_, record) => (
        <Space size="middle" className="">{filterAlertTime(record.timeDiff)}</Space>
      ),
    },
    {
      title: '触发时间',
      key: 'begintime',
      sorter: (a, b) => (dayjs(a.begintime) - dayjs(b.begintime)),
      render: (_, record) => (
        <Space size="middle" className="">{dayjs(record.begintime).format('YYYY-MM-DD HH:mm:ss')}</Space>
      ),
    },
    {
      title: '告警源',
      key: 'resource',
      width: '120px',
      sorter: (a, b) => sorterFirstAlphabet(a.resource, b.resource),
      render: (_, record) => (
        <Space>
          <p style={{ wordWrap: 'break-word', width: '100px' }}>{record.resource}</p>
        </Space>
      ),
    },
    {
      title: '静默告警',
      width: '100px',
      key: 'silentAlarm',
      render: (_, record) => (
        <Space size="middle" style={{ marginLeft: '30px' }}>
          <SettingOutlined onClick={() => editSilentAlarm(record)} style={{ color: '#3f66f5ff', fontSize: '20px' }} />
        </Space>
      ),
    },
  ];
  const changeSilentLabel = (value) => {
    setSelectSilentLabel(value);
  };
  const getFilterAlertList = () => {
    let searchStringName = '';
    let searchStringLabel = '';
    if (alertForm.getFieldsValue().selectName !== '全部') {
      searchStringName = `&filter=alertname=` + `${alertForm.getFieldsValue().selectName}`;
    }
    if (selectSilentLabel.length > 0) {
      selectSilentLabel.map(item => {
        searchStringLabel += (`&filter=` + `${item}`);
      });
    }
    formLevel = alertForm.getFieldsValue().selectLevel;
    formTime = alertForm.getFieldsValue().selectTime;
    if (alertForm.getFieldsValue().selectResource !== '全部') {
      formResource = alertForm.getFieldsValue().selectResource;
    }
    searchString = searchStringName + searchStringLabel;
    getAlert(searchString);
  };
  const handleChangeContinueTime = (e) => {
    if (e !== '全部') {
      continueTime = filterContinueTime(e);
    }
  };
  const getLokiOptions = async () => {
    const res = await getLoki();
    if (res.status === ResponseCode.OK) {
      if (res.data.data?.includes('running')) {
        setAlertSourceOption([{ label: '全部', value: '' }, { label: 'loki', value: 'loki' }, { label: 'prometheus', value: 'prometheus' }]);
      }
    }
  };
  const getAlertOption = async () => {
    const res = await getAlertOptions();
    if (res.status === ResponseCode.OK) {
      let nameList = [];
      let labelList = [];
      let filterData = res.data.filter(item => item.status.state === 'active');
      filterData.map(item => {
        nameList.push({
          label: item.labels.alertname,
          value: item.labels.alertname,
        });
        solveAnnotation(item.labels).map(subitem => {
          labelList.push({
            label: `${subitem.key}=${subitem.value}`,
            value: `${subitem.key}=${subitem.value}`,
          });
        });
      });
      setAlertNameOption(defaultOptions.concat(filterRepeat(nameList)));
      setLabelOptions(filterRepeat(labelList));
    }
  };
  const getAlert = async (string = searchString) => {
    const res = await getAlertOptions(string);
    let alertLists = [];
    if (res.status === ResponseCode.OK) {
      let filterData = res.data.filter(item => item.status.state === 'active');
      filterData.map(item => {
        let resource = '';
        let resourceType = '';
        if (item.labels.prometheus) {
          resource = `prometheus=${item.labels.prometheus}`;
          resourceType = 'prometheus';
        }
        if (item.labels.loki) {
          resource = `loki=${item.labels.Loki}`;
          resourceType = 'loki';
        }
        alertLists.push({
          name: item.labels.alertname ? item.labels.alertname : '--',
          desc: item.annotations.description ? item.annotations.description : '--',
          summary: item.annotations.summary ? item.annotations.summary : '--',
          namespace: item.labels.namespace ? item.labels.namespace : '--',
          pod: item.labels.pod ? item.labels.pod : '--',
          level: item.labels.severity ? item.labels.severity : '--',
          begintime: item.startsAt ? item.startsAt : '--',
          time: item.startsAt ? item.startsAt : '--',
          endtime: item.endsAt ? item.endsAt : '--',
          resource: resourceType ? resourceType : '--',
          labels: item.labels,
          resourceType,
          timeDiff: dayjs(dayjs(item.endsAt).format('YYYY-MM-DD HH:mm:ss')).diff(dayjs(item.startsAt).format('YYYY-MM-DD HH:mm:ss')) / 1000,
          createdBy: item.createdBy ? item.createdBy : '',
          comment: item.comment ? item.comment : '',
        });
      });
      const alertCountList = [];
      alertCountList.push(...alertLists);
      if (formTime !== '全部' && formTime !== '10d') {
        alertLists = alertLists.filter(item => item.timeDiff < continueTime[1] && item.timeDiff >= continueTime[0]);
      }
      if (formTime !== '全部' && formTime === '10d') {
        alertLists = alertLists.filter(item => item.timeDiff >= continueTime[0]);
      }
      if (formLevel !== '全部') {
        alertLists = alertLists.filter(item => item.level === formLevel);
      }
      if (formResource !== '全部' && formResource) {
        alertLists = alertLists.filter(item => item.resourceType === formResource);
      }
      alertLists = alertLists.sort((a, b) => dayjs(b.begintime).unix() - dayjs(a.begintime).unix());
      setCritical(alertCountList.filter((item) => item.level === 'critical').length);
      setWarning(alertCountList.filter((item) => item.level === 'warning').length);
      setInfo(alertCountList.filter((item) => item.level === 'info').length);
      setAlertTableList(alertLists);
    }
  };
  const timeSearch = () => {
    clearTimeout(setTimeoutId);
    getAlert(searchString);
    const id = setTimeout(() => {
      timeSearch();
    }, 15000);
    setTimeoutId = id;
  };

  const selectLevelChange = async (type) => {
    if (type === 'critical') {
      alertForm.setFieldValue('selectLevel', 'critical');
    } else if (type === 'warning') {
      alertForm.setFieldValue('selectLevel', 'warning');
    } else {
      alertForm.setFieldValue('selectLevel', 'info');
    }
    getFilterAlertList();
  };

  useEffect(() => {
    getAlertOption();
    getLokiOptions();
    formLevel = '全部';
    formTime = '全部';
    formResource = '全部';
    setTimeoutId = 0;
    searchString = '';
  }, []);

  useEffect(() => {
    selectLevelChange(location.state.alarmType);
  }, []);

  useEffect(() => {
    timeSearch();
    return () => clearTimeout(setTimeoutId);
  }, []);

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="alarm-bread">
      <BreadCrumbCom items={[{ title: '告警', path: `/${containerRouterPrefix}/alarm/alarmIndex`, disabled: true }, { title: '当前告警', path: '/' }]} />
    </div>
    <div className='warning-container'>
      <div className='warning-container-top' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div className='warning-container-top-form'>
          <Form style={{ display: 'flex', flexWrap: 'wrap' }} form={alertForm}
            initialValues={{
              selectName: '全部',
              selectLevel: '全部',
              selectTime: '全部',
              selectResource: '全部',
              selectNamespace: '全部',
              selectPods: '全部',
            }}
          >
            <div className="warning-container-top-form-format">
              <Form.Item
                name="selectName"
                label="告警名称"
                className='warning-280'
              >
                <Select
                  className=''
                  options={alertNameOption}
                />
              </Form.Item>

              <Form.Item
                name="selectLevel"
                label="告警等级"
                className='warning-280'
              >
                <Select
                  className=''
                  options={alertLevelOption}
                />
              </Form.Item>

              <Form.Item
                name="selectTime"
                label="持续时间"
                className='warning-280'
              >
                <Select
                  className=''
                  options={alertTimeOption}
                  onChange={handleChangeContinueTime}
                />
              </Form.Item>

              <Form.Item
                name="selectResource"
                label="告警源"
                className='warning-280'
              >
                <Select
                  className=''
                  options={alertSourceOption}
                />
              </Form.Item>
            </div>
            <div className="warning-container-top-form-format-nowarp">
              <Form.Item
                name="selectLables"
                label="标签"
              >
                <Select
                  className='silentAlarm_top_labelSearch'
                  mode="multiple"
                  allowClear
                  style={{ width: '580px', maxWidth: '500px' }}
                  placeholder="请选择标签"
                  onChange={changeSilentLabel}
                  options={labelOptions}
                  value={selectSilentLabel}
                />
              </Form.Item>

              <Form.Item
              >
                <div className="button-group warning-300">
                  <Button className='cancel_btn' onClick={resetSearch}>重置</Button>
                  <Button className='primary_btn' onClick={getFilterAlertList} >查询</Button>
                </div>
              </Form.Item>
            </div>
          </Form>
        </div>
      </div>
      <div className="warning-container-table" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div className="alarmNum">
          <div className="alarmNumOne">
            <p className="alarmNumOneType" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>严重</p>
            <p className="alarmNumOneNumWrong" onClick={() => selectLevelChange('critical')}>{critical}</p>
          </div><div className="alarmNumOne">
            <p className="alarmNumOneType" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>警告</p>
            <p className="alarmNumOneNumWarning" onClick={() => selectLevelChange('warning')}>{warning}</p>
          </div>
          <div className="alarmNumOne">
            <p className="alarmNumOneType" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>提示</p>
            <p className="alarmNumOneNumInfo" onClick={() => selectLevelChange('info')}>{info}</p>
          </div>
        </div>
        <div>
          <ConfigProvider locale={zhCN}>
            <Table dataSource={alertTableList} columns={stateColumns} pagination={{
              className: 'page',
              style: { paddingRight: '0px' },
              showTotal: total => `共${total}条`,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
            }} style={{ minHeight: 'calc(100vh - 470px)' }} scroll={{ x: 1300 }} />
          </ConfigProvider>
        </div>
      </div>
      <SetSilentAlarmModal isShowModal={isShowEditModal} cancelEdit={cancelEdit} remarks={remarks} submitModel={handleChildClick} />
    </div >
  </div>;
}