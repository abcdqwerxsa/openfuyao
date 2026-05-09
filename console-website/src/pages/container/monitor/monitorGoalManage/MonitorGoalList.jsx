/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useEffect, useState, useCallback } from 'openinula';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant';
import Dayjs from 'dayjs';
import '@/styles/pages/workload.less';
import { getMonitorGoalListData } from '@/api/monitorApi';
import {
  Button,
  Form,
  Space,
  Input,
  Table,
  Pagination,
  ConfigProvider,
}
  from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { DEFAULT_CURRENT_PAGE, DEFAULT_PAGE_SIZE, ResponseCode, monitorGoalFilterOptions } from '@/common/constants';
import { useHistory } from 'inula-router';
import { sorterFirstAlphabet } from '@/tools/utils';

let monitorTargetRuleList = [];
export default function MonitorGoalList() {
  const [goalForm] = Form.useForm();
  const history = useHistory();
  const [filterGoalStatus, setFilterGoalStatus] = useState([]); // 赋值筛选项
  const [goalPage, setGoalPage] = useState(DEFAULT_CURRENT_PAGE);
  const [goalPageSize, setGoalPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [goalTotal, setGoalTotal] = useState(0);
  const [goalList, setGoalList] = useState([]); // 数据集
  const [goalLoading, setGoalLoading] = useState(false); // 加载中

  const [goalSortObj, setGoalSortObj] = useState({}); // 排序
  const [goalFilterObj, setGoalFilterObj] = useState({}); // 筛选
  // 列表项
  const goalColumns = [
    {
      title: '端点',
      key: 'endpoint',
      sorter: (a, b) => sorterFirstAlphabet(a.endpoint, b.endpoint),
      render: (_, record) => <span>{record.endpoint}</span>,
    },
    {
      title: '监视',
      key: 'targetName',
      sorter: (a, b) => sorterFirstAlphabet(a.targetName, b.targetName),
      render: (_, record) => record.targetName,
    },
    {
      title: '健康状态',
      filters: filterGoalStatus,
      filteredValue: goalFilterObj.status ? [goalFilterObj.status] : null,
      sorter: (a, b) => sorterFirstAlphabet(a.health, b.health),
      filterMultiple: false,
      key: 'status',
      width: 220,
      render: (_, record) => <div className={`status_group`}>
        <span className={`${(record.health).toLowerCase()}_circle`}></span>
        <span>{record.health}</span>
      </div>,
    },
    {
      title: '命名空间',
      key: 'namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.namespace, b.namespace),
      render: (_, record) => record.namespace,
    },
    {
      title: '最后刮削',
      key: 'finally_time',
      sorter: (a, b) => Dayjs(a.lastScrape) - Dayjs(b.lastScrape),
      render: (_, record) => Dayjs(record.lastScrape).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '刮削持续时间',
      key: 'continue_time',
      sorter: (a, b) => sorterFirstAlphabet((a.lastScrapeDuration).toFixed(4), (b.lastScrapeDuration).toFixed(4)),
      render: (_, record) => `${(record.lastScrapeDuration).toFixed(4)}ms`,
    },
  ];

  useEffect(() => {
    let statusArr = [];
    monitorGoalFilterOptions.map(item => {
      statusArr.push({ text: item.value, value: item.value });
    });
    setFilterGoalStatus([...statusArr]);
  }, []);

  const getGoalList = useCallback(async () => {
    setGoalLoading(true);
    try {
      const res = await getMonitorGoalListData();
      if (res.status === ResponseCode.OK) {
        let solveBeforeData = res.data.targets;
        if (Object.keys(goalFilterObj).length !== 0) {
          if (goalFilterObj.status) {
            const [filterStatus, ...resets] = goalFilterObj.status;
            solveBeforeData = solveBeforeData.filter(item => item.health === filterStatus);
          }
        }
        setGoalList([...solveBeforeData]);
        monitorTargetRuleList = res.data.targets;
        setGoalTotal(solveBeforeData.length);
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setGoalList([]); // 数组为空
        setGoalTotal(0);
      }
    }
    setGoalLoading(false);
  }, [goalFilterObj]);

  // 检索
  const handleSearchGoal = (e) => {
    if (e) {
      const data = monitorTargetRuleList.filter(item =>
        (item.endpoint).toLowerCase().includes(e.toLowerCase()) || (item.namespace).toLowerCase().includes(e.toLowerCase())
      );
      setGoalList([...data]);
      setGoalTotal(data.length);
    } else {
      getGoalList();
    }
  };

  // 表格变化
  const handleGoalTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setGoalPage(DEFAULT_CURRENT_PAGE);
        setGoalFilterObj(filter);
      }
    },
    []
  );

  // 分页变化
  const onChangeGoalsPageOrPageSize = async (current, limit) => {
    setGoalPage(current);
    setGoalPageSize(limit);
  };

  useEffect(() => {
    getGoalList();
  }, [getGoalList]);

  return <div className="child_content">
    <BreadCrumbCom
      className="create_bread"
      items={[
        { title: '监控', path: `/${containerRouterPrefix}/monitor/monitorDashboard`, disabled: true },
        { title: '监控目标', path: '/' },
      ]} />
    <div className="tab_container container_margin_box">
      <Form className="pod_searchForm form_padding_bottom" form={goalForm}>
        <Form.Item name="namespace" className="pod_search_input">
          <Input.Search placeholder="搜索端点或者命名空间" onSearch={handleSearchGoal} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor`)} style={{ width: 'auto' }}>ServiceMonitor实例</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={goalLoading}
            columns={goalColumns}
            dataSource={goalList}
            pagination={{
              className: 'page',
              current: goalPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              total: goalTotal,
              pageSize: goalPageSize,
              onChange: onChangeGoalsPageOrPageSize,
              pageSizeOptions: [10, 20, 50],
            }}
            onChange={handleGoalTableChange}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
    </div>
  </div>;
}