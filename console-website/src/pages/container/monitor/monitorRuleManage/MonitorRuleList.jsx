/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useEffect, useState, useCallback, useStore } from 'openinula';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant';
import '@/styles/pages/workload.less';
import { getAlarmListData } from '@/api/monitorApi';
import {
  Button,
  Form,
  Space,
  Table,
  ConfigProvider,
  Select,
}
  from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PAGE_SIZE,
  ResponseCode,
  alarmLevelOptions,
  alarmStatusOptions,
  alarmStatusEx,
  alarmLevelEx,
} from '@/common/constants';
import { Link } from 'inula-router';
import { filterAlertStatus, filterAlertStatusStyle } from '@/utils/common';
import { sorterFirstAlphabet } from '@/tools/utils';

let alarmRuleListTotal = [];
export default function MonitorRuleList() {
  const [alarmRuleForm] = Form.useForm();
  const [groupOptions, setGroupOptions] = useState([]);
  const [alarmRulePage, setAlarmRulePage] = useState(DEFAULT_CURRENT_PAGE);
  const [alaramRulePageSize, setAlarmRulePageSize] = useState(DEFAULT_PAGE_SIZE);
  const [alaramRuleLoading, setAlarmRuleLoading] = useState(true);
  const [alarmRuleList, setAlarmRuleList] = useState([]);
  const themeStore = useStore('theme');

  const handleReset = () => {
    alarmRuleForm.resetFields();
    getAlarmList();
  };

  const handleSearch = () => {
    setAlarmRuleLoading(true);
    let data = alarmRuleListTotal;
    let conditions = alarmRuleForm.getFieldsValue();
    if (conditions.group) {
      data = data.filter(item => item.group === conditions.group);
    }
    if (conditions.level) {
      data = data.filter(item => item.severity === conditions.level);
    }
    if (conditions.status) {
      data = data.filter(item => item.status === conditions.status);
    }
    setAlarmRulePage(1);
    setAlarmRulePageSize(10);
    setAlarmRuleList([...data]);
    setAlarmRuleLoading(false);
  };

  const solveCurrentOptions = (options) => {
    let filters = [];
    options.map(item => {
      if (item.label !== '全部') {
        filters.push({ text: item.label, value: item.value });
      }
    });
    return filters;
  };

  const alarmRuleColumns = [
    {
      title: '告警组',
      key: 'group',
      sorter: (a, b) => sorterFirstAlphabet(a.group, b.group),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/monitor/monitorRuleManage/detail/${record.name}`}>{record.group}</Link>,
    },
    {
      title: '告警名称',
      key: 'alarmName',
      sorter: (a, b) => sorterFirstAlphabet(a.name, b.name),
      render: (_, record) => record.name,
    },
    {
      title: '告警等级',
      key: 'level',
      sorter: (a, b) => sorterFirstAlphabet(filterAlertStatus(a.severity), filterAlertStatus(b.severity)),
      filters: solveCurrentOptions(alarmLevelOptions),
      onFilter: (value, record) => record.severity === value,
      filterMultiple: false,
      render: (_, record) => <div style={filterAlertStatusStyle(record.severity)} >
        {filterAlertStatus(record.severity)}
      </div >,
    },
    {
      title: '告警状态',
      key: 'status',
      filters: solveCurrentOptions(alarmStatusOptions),
      onFilter: (value, record) => record.status === value,
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(a.status, b.status),
      width: 220,
      render: (_, record) => <div className={`status_group`}>
        <span className={`${(record.status).toLowerCase()}_circle`}></span>
        <span>{`${alarmStatusEx[record.status]} (${record.status})`}</span>
      </div>,
    },
  ];

  const getAlarmList = useCallback(async () => {
    setAlarmRuleLoading(true);
    try {
      const res = await getAlarmListData();
      if (res.status === ResponseCode.OK) {
        setAlarmRuleList([...res.data.alertingRules]);
        alarmRuleListTotal = res.data.alertingRules;
        // 设置options
        makeOptions(res.data.alertingRules);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setAlarmRuleList([]); // 数组为空
      }
    }
    setAlarmRuleLoading(false);
  }, []);

  const makeOptions = (data) => {
    let groupOptionsFinally = [{ label: '全部', value: '' }];
    let groupOptionsTempory = [];
    data.map(item => {
      if (!groupOptionsTempory.includes(item.group)) {
        groupOptionsTempory.push(item.group);
        groupOptionsFinally.push({ label: item.group, value: item.group });
      }
    });
    setGroupOptions([...groupOptionsFinally]);
  };

  useEffect(() => {
    getAlarmList();
  }, [getAlarmList]);

  return <div className="child_content no_breadcrumb">
    <BreadCrumbCom
      className="create_bread"
      items={[
        { title: '监控', path: `/${containerRouterPrefix}/monitor`, disabled: true },
        { title: '告警规则', path: '/monitorRuleManage' },
      ]} />
    <div className="tab_container container_margin_box backgroundAdjust_box">
      <Form className="alermForm pod_searchForm form_padding_bottom" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }} form={alarmRuleForm} initialValues={{
        group: '',
        level: '',
        status: '',
      }}>
        <Form.Item name="group" className="pod_search_input" label="告警组">
          <Select options={groupOptions} />
        </Form.Item>
        <Form.Item name="level" className="pod_search_input" label="告警等级">
          <Select options={alarmLevelOptions} />
        </Form.Item>
        <Form.Item name="status" className="pod_search_input" label="告警状态">
          <Select options={alarmStatusOptions} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className='cancel_btn' onClick={handleReset}>重置</Button>
            <Button className='primary_btn' onClick={handleSearch}>查询</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex monitorRule_table">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={alaramRuleLoading}
            columns={alarmRuleColumns}
            dataSource={alarmRuleList}
            scroll={{ x: 1280 }}
            pagination={{
              className: 'page',
              page: alarmRulePage,
              pageSize: alaramRulePageSize,
              onChange: (current, limit) => {
                setAlarmRulePage(current);
                setAlarmRulePageSize(limit);
              },
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
            }}
          />
        </ConfigProvider>
      </div>
    </div>
  </div>;
}