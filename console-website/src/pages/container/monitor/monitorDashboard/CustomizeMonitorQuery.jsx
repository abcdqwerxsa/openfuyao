/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import '@/styles/pages/monitor.less';
import { Button, Form, Select, DatePicker, Input, Table, ConfigProvider, Checkbox } from 'antd';
import { Fragment, useCallback, useEffect, useState, useStore } from 'openinula';
import Dayjs from 'dayjs';
import { SyncOutlined, DeleteOutlined, UpOutlined, DownOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { containerRouterPrefix } from '@/constant';
import {
  timePeriodOptions,
  refreshTimeOptions,
  stepList,
  ResponseCode,
} from '@/common/constants';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { randomUuid, solveDataAreaNumPalettePlus, solveQueryMonitor, rgbToHexOut } from '@/tools/utils';
import DataAreaChart from '@/components/echarts/DataAreaChart';
import { message, FloatButton } from 'antd';
import { getCustomizeQuery } from '@/api/monitorApi';
import EmptyData from '@/components/EmptyData';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import infoStore from '@/store/infoStore';

const { TextArea } = Input;
let totalIDList = {};
let totalColorIDList = {};
Dayjs.locale('zh-cn');
export default function CustomizeMonitorQuery() {
  const [timeForm] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();
  const infoStoreExample = infoStore();
  const refreshTimeValue = Form.useWatch('refreshTime', timeForm); // 刷新间隔
  const [rangeColorList, setRangeColorList] = useState([]); // 生成随机颜色
  const [intervalId, setInterValId] = useState(0); // 定时器id
  const [queryElementIDList, setQueryElementIDList] = useState([]); // 查询节点
  const [isSearch, setIsSearch] = useState(false);
  const [seletedMarkId, setSelectMarkId] = useState([]);
  const [inputList, setInputList] = useState([]);
  const [refreshTimePageOptions, setRefreshTimePageOptions] = useState(refreshTimeOptions);
  const [selectIdList, setSelectIdList] = useState([]); // 点击图例
  const [loading, setLoading] = useState(true);
  const [isCheck, setIsCheck] = useState(false); // 判断是否反选
  const themeStore = useStore('theme');
  const handleResetMonitor = useCallback((isActive = false) => {
    if (isActive) {
      inputList.map(item => {
        handleSearchMonitor(item.id); // 自动执行
      });
    }
  }, [inputList]);

  const filterColorList = (data, objMap) => {
    const colorMap = new Map(objMap.map(item => [item.type, item.color]));
    const uniqueItems = [...new Map(data.map(item => [item.type, item])).values()];
    const colors = uniqueItems.map(({ type }) => colorMap.get(type) ?? null);
    return colors;
  };

  const handleCancelPaint = (uuid, selfId, dataSource) => {
    setLoading(true);
    if (!Object.keys(totalIDList).includes(uuid.toString())) {
      totalIDList[uuid] = []; // 实例化
    }
    let temporyId = totalIDList[uuid];
    if (!totalIDList[uuid].includes(selfId)) {
      setQueryElementIDList(preQuery => {
        let newQuery = preQuery;
        newQuery.map(item => {
          if (item.id === uuid) {
            let chartDataListTempory = item.chartDataList;
            chartDataListTempory = chartDataListTempory.concat(item.totalData.filter(filterItem => filterItem.type === selfId));
            item.chartDataList = chartDataListTempory;
            item.rangeColor = filterColorList(chartDataListTempory, totalColorIDList[uuid]);
          }
        });
        return [...newQuery];
      });
      // 原生js
      const [element, ...resets] = document.getElementsByClassName(`${uuid}_${selfId}_color`);
      element.style.background = element.style.color;
      temporyId.push(selfId);
    } else {
      setQueryElementIDList(preQuery => {
        let newQuery = preQuery;
        newQuery.map(item => {
          if (item.id === uuid) {
            let chartDataListTempory = item.totalData;
            chartDataListTempory = chartDataListTempory.filter(filterItem => filterItem.type !== selfId);
            item.chartDataList = chartDataListTempory;
          }
        });
        return [...newQuery];
      });
      const [element, ...resets] = document.getElementsByClassName(`${uuid}_${selfId}_color`);
      element.style.background = '#ccc';
      temporyId = temporyId.filter(temporyItem => temporyItem !== selfId);
      // 取消颜色选集
      setQueryElementIDList(preQuery => {
        let newQuery = preQuery;
        newQuery.map(item => {
          if (item.id === uuid) {
            const rgbValue = window.getComputedStyle(element).color;
            const [r, g, b] = rgbValue.match(/\d+/g).map(Number);
            item.rangeColor = item.rangeColor.filter(filterItem => (filterItem !== element.style.color && filterItem !== rgbToHexOut(r, g, b)));
          }
        });
        return [...newQuery];
      });
    }
    setLoading(false);
    totalIDList[uuid] = [...temporyId];
    const checkBox = document.querySelector(`#checkbox_${uuid}_current`);
    if (totalIDList[uuid].length !== dataSource.length) {
      checkBox.value = false;
      if (checkBox.parentNode.classList.contains('container-platform-checkbox-checked')) {
        checkBox.parentNode.classList.remove('container-platform-checkbox-checked');
      }
    } else {
      checkBox.parentNode.classList.add('container-platform-checkbox-checked');
    }
    setSelectIdList([...temporyId]);
  };

  const onChange = (uuid, dataSource) => {
    // 全选或者反选
    if (!totalIDList[uuid].length || totalIDList[uuid].length !== dataSource.length) {
      if (totalIDList[uuid].length !== dataSource.length) { // 非正常全选
        setTimeout(() => {
          const checkBox = document.querySelector(`#checkbox_${uuid}_current`);
          checkBox.parentNode.classList.add('container-platform-checkbox-checked');
        }, 0);
      }
      dataSource.map(item => {
        const [element, ...resets] = document.getElementsByClassName(`${uuid}_${item.idSelf}_color`);
        if (element) {
          element.style.background = element.style.color;
        }
        totalIDList[uuid].push(item.idSelf);
      });
      totalIDList[uuid] = Array.from(new Set([...totalIDList[uuid]]));
      setIsCheck(true);
      setQueryElementIDList(preQuery => {
        let newQuery = preQuery;
        newQuery.map(item => {
          if (item.id === uuid) {
            item.inputValue = item.inputValue;
            item.dataSource = item.dataSource;
            item.tableColumns = item.tableColumns;
            item.rangeColor = item.rangeColor;
            item.errorMessage = item.errorMessage;
            item.chartDataList = item.totalData;
            item.totalData = item.totalData;
          }
        });
        return [...newQuery];
      });
    } else {
      totalIDList[uuid] = [];
      setTimeout(() => {
        const checkBox = document.querySelector(`#checkbox_${uuid}_current`);
        checkBox.parentNode.classList.remove('container-platform-checkbox-checked');
      }, 0);
      dataSource.map(item => {
        const [element, ...resets] = document.getElementsByClassName(`${uuid}_${item.idSelf}_color`);
        if (element) {
          element.style.background = '#ccc';
        }
      });
      setIsCheck(true);
      setQueryElementIDList(preQuery => {
        let newQuery = preQuery;
        newQuery.map(item => {
          if (item.id === uuid) {
            item.dataSource = item.dataSource;
            item.tableColumns = item.tableColumns;
            item.rangeColor = item.rangeColor;
            item.errorMessage = item.errorMessage;
            item.chartDataList = [];
            item.totalData = item.totalData;
            item.inputValue = item.inputValue;
          }
        });
        return [...newQuery];
      });
    }
  };

  const renderColumns = useCallback((id, tableColumns, dataSource, selectIdTempory = []) => {
    let selectIdListTempory = selectIdTempory || selectIdList;
    let columns = [];
    tableColumns.map(item => {
      let element = '';
      if (item === 'idSelf') {
        element = {
          title: <Fragment>
            <Checkbox
              id={`checkbox_${id}_current`}
              defaultChecked={true}
              onChange={() => onChange(id, dataSource)}>
            </Checkbox>
          </Fragment>,
          key: 'color',
          render: (_, record) => <div className='legend_group'>
            <span className={`legend_color ${id}_${record.idSelf}_color`}
              style={{ background: `${!selectIdListTempory.includes(record.idSelf) ? '#ccc' : record.color}`, cursor: 'pointer', color: record.color }}
              onClick={() => handleCancelPaint(id, record.idSelf, dataSource)}></span>
          </div>,
        };
      } else {
        let title = item;
        if (item === 'timestamp') {
          title = '采集时间';
        }
        if (item === 'value') {
          title = '值';
        }
        element = {
          title,
          key: item,
          render: (_, record) => item !== 'timestamp' ? (record[item] || '--') : (Dayjs(record[item] * 1000).format('YYYY年MM月DD日 HH:mm:ss') || '--'),
        };
      }
      columns.push(element);
    });
    return columns;
  }, [selectIdList]);

  const handleSearchMonitor = async (id) => {
    // 查询
    const [{ value }, ...resets] = inputList.filter(item => item.id === id);
    let errorMessage = '';
    // 请求接口
    const formValues = timeForm.getFieldsValue();
    let conditions = {
      step: stepList[formValues.period],
      start: Dayjs(formValues.endTime).subtract(parseInt(formValues.period), formValues.period.slice(-1)),
      end: Dayjs(formValues.endTime),
    };
    // 处理时区问题
    const offset = infoStoreExample.$s.offsetCompareLocal;
    if (offset !== 0) {
      if (offset > 0) {
        conditions.start = conditions.start.subtract(offset, 'minute');
        conditions.end = conditions.end.subtract(offset, 'minute');
      } else {
        conditions.start = conditions.start.add(Math.abs(offset), 'minute');
        conditions.end = conditions.end.add(Math.abs(offset), 'minute');
      }
    }
    conditions.start = conditions.start.format('YYYY-MM-DD HH:mm:ss');
    conditions.end = conditions.end.format('YYYY-MM-DD HH:mm:ss');
    let chartDataListTempory = [];
    let chartTableTempory = {};

    const res = await getCustomizeQuery(value, conditions.start, conditions.end, conditions.step);
    if (res.status === ResponseCode.OK) {
      if (res.data.code === 0) {
        const oldData = res.data.data.result;
        // 处理数据
        let { tableColumns, chartDataList, chartTableList } = solveQueryMonitor(oldData);
        chartDataListTempory = chartDataList;
        let typeList = [];
        chartDataListTempory.map(item => {
          if (!typeList.includes(item.type)) {
            typeList.push(item.type);
          }
        });

        let dataSource = [];
        typeList.map((index) => {
          let obj = {};
          tableColumns.map(columnsItem => {
            obj[columnsItem] = chartTableList[index][columnsItem];
          });
          obj.key = index;
          obj.color = rangeColorList[index];
          dataSource.push(obj);
        });

        if (!Object.keys(totalIDList).includes(id.toString())) {
          totalIDList[id] = []; // 实例化
          totalColorIDList[id] = [];
          if (!totalIDList[id].length) { // 不存在选择项正常添加
            dataSource.map(dataSourceItem => {
              totalIDList[id].push(dataSourceItem.idSelf);
            });
            setSelectIdList(totalIDList[id]);
            totalIDList[id].map(item => {
              // 上色
              const [element, ...resetColors] = document.getElementsByClassName(`${id}_${item}_color`);
              if (element) {
                element.style.background = element.style.color;
              }
            });
          }
          if (!totalColorIDList[id].length) {
            dataSource.map((dataSourceItem, dataSourceIndex) => {
              totalColorIDList[id].push({ type: typeList[dataSourceIndex], color: dataSourceItem.color });
            });
          }
        }
        chartDataListTempory = chartDataListTempory.filter(chartDataFilterItem => totalIDList[id].includes(chartDataFilterItem.type));
        // 生成columns
        const columns = renderColumns(id, tableColumns, dataSource, totalIDList[id]);
        chartTableTempory = {
          columns,
          dataSource,
        };
      } else {
        errorMessage = {
          reason: res.data.code,
          info: res.data.msg,
        };
      }
    }
    setQueryElementIDList(preQuery => {
      let newQuery = preQuery;
      preQuery.map(item => {
        if (item.id === id) {
          item.totalData = chartDataListTempory;
          item.inputValue = value;
          item.chartDataList = chartDataListTempory;
          item.dataSource = chartTableTempory.dataSource;
          item.tableColumns = chartTableTempory.columns;
          item.rangeColor = rangeColorList;
          item.errorMessage = errorMessage;
        }
      });
      return [...newQuery];
    });

    // 默认展开
    if (!seletedMarkId.includes(id)) {
      setSelectMarkId(preID => {
        return [...preID, id];
      });
    }
    setLoading(false);
  };

  const toTop = () => {
    const target = document.querySelector('.container_content');
    target.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const toDown = () => {
    const target = document.querySelector('.container_content');
    target.scrollTo({ top: target.scrollHeight - target.clientHeight, left: 0, behavior: 'smooth' });
  };

  const handleDeleteQuery = (id) => {
    const inputArr = inputList.filter(item => item.id !== id);
    const newList = queryElementIDList.filter(item => item.id !== id);
    // 删掉输入框内容
    setQueryElementIDList([...newList]);
    setInputList([...inputArr]);
  };

  const handleSolveMarkIdAdd = (id) => {
    setSelectMarkId(preID => {
      return [...preID, id];
    });
  };
  const handleSolveMarkIdDelete = (id) => {
    const newList = seletedMarkId.filter(item => item !== id);
    setSelectMarkId([...newList]);
  };

  const renderElement = useCallback(() => {
    const markID = randomUuid();
    let limit = false;
    let temporyList = inputList;
    setQueryElementIDList(preQuery => {
      if (preQuery.length === 10) {
        limit = true;
        return [...preQuery];
      } else {
        return [...preQuery, {
          id: markID,
          inputValue: '',
          errorMessage: {
            reason: '',
            info: '',
          },
          chartDataList: [],
          tableColumns: [],
          dataSource: [],
        }];
      }
    });
    temporyList.push({ id: markID, value: '' });
    temporyList.length
      ? setInputList(temporyList) // 初始化塞值
      : setInputList([{ id: markID, value: '' }]); // 初始化塞值
    if (limit) {
      messageApi.error('查询数量最多为十个!');
    }
  }, []);

  const handleAddQuery = () => {
    renderElement();
  };

  // 输入值
  const handleChange = (e, id) => {
    let newList = [...inputList];
    const arr = newList.filter(item => item.id === id);
    if (arr.length) {
      newList.map(newItem => {
        if (newItem.id === id) {
          newItem.value = e.target.value;
        }
      });
    } else {
      newList.push({
        id,
        value: e.target.value,
      });
    };
    let queryList = [...queryElementIDList];
    queryList.map(queryItem => {
      if (queryItem.id === id) {
        queryItem.inputValue = e.target.value;
      }
    });
    setQueryElementIDList(queryList);
    setInputList(newList);
  };

  useEffect(() => {
    renderElement();
  }, [renderElement]);

  // 随机生成颜色
  useEffect(() => {
    const rangeBirthColorList = solveDataAreaNumPalettePlus(1000); // 颜色区间根据类别生成
    setRangeColorList(rangeBirthColorList);
  }, []);

  // 自动刷新
  const getWebSockect = useCallback(() => {
    timeForm.setFieldValue('endTime', Dayjs()); // 时间赋值
    if (intervalId) {
      clearInterval(intervalId); // 清除计时器
      setInterValId(0);
    }
    if (refreshTimeValue) {
      const id = setInterval(() => {
        // 操作
        timeForm.setFieldValue('endTime', Dayjs()); // 时间赋值
        // 请求数据
        // 模拟用户多次点击
        inputList.map(item => {
          // 重置
          totalIDList = {}; // 置空
          // 回色
          const checkBox = document.querySelector(`#checkbox_${item.id}_current`);
          checkBox?.parentNode?.classList.add('container-platform-checkbox-checked'); // 全选
          handleSearchMonitor(item.id); // 自动执行
        });
      }, refreshTimeValue * 1000);
      setInterValId(id);
    }
  }, [refreshTimeValue]);

  const handleValueChange = (changeValues) => {
    if (Object.prototype.hasOwnProperty.call(changeValues, 'endTime')) {
      timeForm.setFieldValue('refreshTime', 0);
      let temporyOptionsCustomizeMonitorQuery = [];
      if (Dayjs(changeValues.endTime[0]) === Dayjs()) { // 此刻
        temporyOptionsCustomizeMonitorQuery.push({ ...item });
      } else {
        refreshTimeOptions.map(item => {
          if (item.value !== 0) {
            const timeTempory = changeValues.endTime ? Dayjs(changeValues.endTime).format('YYYY-MM-DD HH:mm:ss') : undefined;
            if (timeTempory === Dayjs().format('YYYY-MM-DD HH:mm:ss')) { // 此刻
              temporyOptionsCustomizeMonitorQuery.push({ ...item });
            } else {
              temporyOptionsCustomizeMonitorQuery.push({ ...item, disabled: true });
            }
          } else {
            temporyOptionsCustomizeMonitorQuery.push(item);
          }
        });
      }
      setRefreshTimePageOptions([...temporyOptionsCustomizeMonitorQuery]);
    }
    if (!Object.prototype.hasOwnProperty.call(changeValues, 'refreshTime')) {
      inputList.map(item => {
        handleSearchMonitor(item.id); // 自动执行
      });
    }
  };

  // 表格变化
  const handleTableChange = (uuid, totalData) => {
    // 将元素赋值
    setTimeout(() => {
      let totalList = [];
      totalData.map(queryTotalItem => {
        totalList.push(queryTotalItem.type);
      }); // 总数
      const temporyList = new Set(totalIDList[uuid]);
      let filtered = totalList.filter(totalFilterItem => !temporyList.has(totalFilterItem));
      filtered = [...new Set(filtered)];
      filtered.map(filteredItem => {
        const [element, ...resets] = document.getElementsByClassName(`${uuid}_${filteredItem}_color`);
        if (element) {
          element.style.background = '#ccc';
        }
      });
    }, 0); // 分页改变后0执行
  };

  useEffect(() => {
    getWebSockect();
  }, [getWebSockect]);

  useEffect(() => {
    handleResetMonitor();
  }, [handleResetMonitor]);

  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={[
      { title: '监控', path: `/${containerRouterPrefix}/monitor/monitorDashboard`, disabled: true },
      { title: '监控看板', path: `/` },
      { title: '自定义查询', path: `/customize/query` },
    ]} />
    <div className="monitor_query_container">
      <div className='monitor_query_header'>
        <Button
          className={'primary_btn'}
          onClick={handleAddQuery}
        >
          添加查询
        </Button>
        <Form form={timeForm}
          layout='inline'
          initialValues={{
            period: '10m',
            endTime: Dayjs(),
            refreshTime: 30,
          }}
          onValuesChange={handleValueChange}
        >
          <ConfigProvider locale={zhCN}>
            <Form.Item name="period" className='CustomizeMonitorQuery'>
              <Select options={timePeriodOptions} style={{ minWidth: '100px' }} />
            </Form.Item>
            <Form.Item name="endTime" label="结束时间" className='CustomizeMonitorQuery'>
              <DatePicker showTime />
            </Form.Item>
            <Form.Item name="refreshTime" className='CustomizeMonitorQuery'>
              <Select className='refresh_time_select' options={refreshTimePageOptions} />
            </Form.Item>
            <Form.Item className='CustomizeMonitorQuery'>
              <Button icon={<SyncOutlined />} onClick={() => handleResetMonitor(true)} className="reset_btn"></Button>
            </Form.Item>
          </ConfigProvider>
        </Form>
      </div>
      <div className='monitor_query_box_all'>
        {queryElementIDList.map(item => (
          <div className={`monitor_query_box ${item.id}`}>
            <div className={`monitor_query_total ${item.id}`}>
              <div className={`monitor_query_item ${item.id}`}>
                {!seletedMarkId.includes(item.id) ?
                  <UpOutlined className='arrow' onClick={() => handleSolveMarkIdAdd(item.id)} />
                  : <DownOutlined className='arrow' onClick={() => handleSolveMarkIdDelete(item.id)} />
                }
                <TextArea onChange={e => handleChange(e, item.id)} placeholder='请输入prometheus表达式（shift+enter进行折行）'
                  value={item.inputValue}
                  style={{ height: 32, resize: 'none' }} allowClear />
                <Button className='primary_btn monitor_query_btn' onClick={() => handleSearchMonitor(item.id)}>查询</Button>
                <DeleteOutlined className='delete' onClick={() => handleDeleteQuery(item.id)} />
              </div>
              {!!(seletedMarkId.includes(item.id) && item.errorMessage.reason) && <div className='monitor_container'>
                <div className='monitor_error_box'>
                  <ExclamationCircleOutlined />
                  <div className='info_box'>
                    <p>{item.errorMessage.reason}</p>
                    <p>{item.errorMessage.info}</p>
                  </div>
                </div>
              </div>}
              {!!(seletedMarkId.includes(item.id) && item.chartDataList && (item.chartDataList.length || isCheck)) && <div className='chart_table'>
                <DataAreaChart id={`${item.id}_monitor_query_chart`} title={''} data={item.chartDataList} type="line" rangeColorProps={item.rangeColor} isShowScreen={false} isShowLegend={false} />
                <ConfigProvider locale={zhCN}>
                  <Table
                    className="monitor_table"
                    loading={loading}
                    columns={item.tableColumns}
                    dataSource={item.dataSource}
                    onChange={() => handleTableChange(item.id, item.totalData)}
                    pagination={{
                      className: 'page',
                      showTotal: (total) => `共${total}条`,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      pageSizeOptions: [5, 10],
                    }} />
                </ConfigProvider>
              </div>
              }
              {!!seletedMarkId.includes(item.id) && item.chartDataList.length === 0 && !item.errorMessage && <div className='chart_table' ><EmptyData /></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
    <FloatButton.Group
      className='CustomizeMonitorQuery float_btn_right'
      shape="square"
      style={{ right: 20 }}>
      <FloatButton icon={<ArrowUpOutlined />} onClick={toTop} />
      <FloatButton icon={<ArrowDownOutlined />} onClick={toDown} />
    </FloatButton.Group>
  </div>;
}