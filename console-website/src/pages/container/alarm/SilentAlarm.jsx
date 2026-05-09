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
import { MoreOutlined } from '@ant-design/icons';
import { containerRouterPrefix } from '@/constant';
import { Link } from 'inula-router';
import { Select, Button, Table, Space, Popover, Form, Input, DatePicker, Modal, ConfigProvider, message, InputNumber } from 'antd';
import { useEffect, useState, useStore, useCallback } from 'openinula';
import dayjs from 'dayjs';
import zhCN from 'antd/es/locale/zh_CN';
import { deleteSilentAlert, getSilentList, getAlertOptions, creatSilentAlert } from '@/api/containerAlertApi';
import { ResponseCode } from '@/common/constants';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { filterRepeatByid, filterRepeat } from '@/utils/common';
import UserStore from '@/store/userStore';
import EditSilentAlarmModal from './EditSilentAlarmModal';
import '@/styles/pages/alarm.less';
import { sorterFirstAlphabet } from '@/tools/utils';
import { getTimeType } from '@/utils/common';
let setTimeoutId = 0;
let searchString = '';
export default function SilentAlarm() {
  const userStore = UserStore();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectSilentName, setSelectSilentName] = useState('全部');
  const [selectSilentLabel, setSelectSilentLabel] = useState([]);
  const [popOpen, setPopOpen] = useState('');
  const [formType, setFormType] = useState('');
  const [silentDelModalOpen, setSilentDelModalOpen] = useState(false);
  const [silentName, setSilentName] = useState('');
  const [silentId, setSilentId] = useState('');
  const [silentTableList, setSilentTableList] = useState([]);
  const [silentNameOptions, setSilentNameOptions] = useState([]);
  const [labelOptions, setLabelOptions] = useState([]);
  const [isSilentModalOpen, setIsSilentModalOpen] = useState(false);
  const themeStore = useStore('theme');
  const [isSilentDelCheck, setIsSilentDelCheck] = useState(false); // 是否选中
  const [filterAlarmValue, setFilterAlarmValue] = useState();
  const [filterAlarmStatus, setFilterAlarmStatus] = useState([]); // 赋值筛选项
  const defaultOptions = [{
    label: '全部',
    value: '全部',
  }];
  const [propsChildData, setPropsChildData] = useState();
  const changeSilentName = (value) => {
    setSelectSilentName(value);
  };
  const changeSilentLabel = (value) => {
    setSelectSilentLabel(value);
  };
  const resetSilentSearch = () => {
    searchString = '';
    setSelectSilentLabel([]);
    setSelectSilentName('全部');
    getSilentLists();
  };
  const searchSilent = () => {
    let searchString1 = '';
    let searchString2 = '';
    if (selectSilentName !== '全部') {
      if (selectSilentName.includes('=')) {
        searchString1 = `&filter=` + `${selectSilentName}`;
      } else {
        searchString1 = `&filter=alertname=` + `${selectSilentName}`;
      }
    }
    if (selectSilentLabel.length > 0) {
      selectSilentLabel.map(item => {
        searchString2 += (`&filter=` + `${item}`);
      });
    }
    searchString = searchString1 + searchString2;
    getSilentLists(searchString);
  };
  const handleEditSilent = (data) => {
    setFormType('edit');
    setSilentId(data.id);
    setIsSilentModalOpen(true);
    let labelList = [];
    data.matchers.map(item => {
      labelList.push({
        key: item.name,
        value: item.value,
      });
    });
    let time = dayjs(dayjs(data.endtime).format('YYYY-MM-DD HH:mm')).diff(dayjs(data.begintime).format('YYYY-MM-DD HH:mm')) / 1000;
    setPropsChildData({
      labelList,
      beginTime: dayjs(data.begintime),
      creators: data.creators,
      remarks: data.remarks,
      timeType: getTimeType(time).type,
      timeNum: getTimeType(time).num,
    });
  };
  function handleDeleteSilent(param) {
    setSilentName(param.name);
    setSilentId(param.id);
    setSilentDelModalOpen(true);
  }
  function handleDelSilentCancel() {
    setSilentDelModalOpen(false);
    setIsSilentDelCheck(false);
    setSilentName('');
  }
  const handleAlarmTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterAlarmValue(filter.creators);
      }
    },
    []
  );
  const silentColumns = [
    {
      title: '静默名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.name, b.name),
      render: (_, record) => (
        <Space size="middle" className="alertName">
          <Link to={{ pathname: `/${containerRouterPrefix}/alarm/silentAlarm/detail/${record.name}`, state: { currentdetail: record } }}>{record.name}</Link>
        </Space>
      ),
    },
    {
      title: '静默状态',
      dataIndex: 'state',
      key: 'state',
      sorter: (a, b) => sorterFirstAlphabet(a.state === 'active' ? '已激活' : '等待中', b.state === 'active' ? '已激活' : '等待中'),
      render: (_, record) => (
        <Space size="middle"><span className={record.state === 'active' ? 'alertActive' : 'alertPending'}></span>{record.state === 'active' ? '已激活' : '等待中'}</Space>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'begintime',
      key: 'begintime',
      sorter: (a, b) => sorterFirstAlphabet(dayjs(a.begintime).format('YYYY-MM-DD HH:mm:ss'), dayjs(b.begintime).format('YYYY-MM-DD HH:mm:ss')),
      render: (_, record) => (
        <Space size="middle" className="">{dayjs(record.begintime).format('YYYY-MM-DD HH:mm')}</Space>
      ),
    },
    {
      title: '结束时间',
      dataIndex: 'endtime',
      key: 'endtime',
      sorter: (a, b) => sorterFirstAlphabet(dayjs(a.endtime).format('YYYY-MM-DD HH:mm:ss'), dayjs(b.endtime).format('YYYY-MM-DD HH:mm:ss')),
      render: (_, record) => (
        <Space size="middle" className="">{dayjs(record.endtime).format('YYYY-MM-DD HH:mm')}</Space>
      ),
    },
    {
      title: '创建者',
      dataIndex: 'creators',
      key: 'creators',
      filters: filterAlarmStatus,
      filterMultiple: false,
      filteredValue: filterAlarmValue ? [filterAlarmValue] : [],
      onFilter: (value, record) => (record.creators).toLowerCase() === value.toLowerCase(),
      sorter: (a, b) => sorterFirstAlphabet(a.creators, b.creators),
      render: (_, record) => (
        <Space size="middle" className="">{record.creators}</Space>
      ),
    },
    {
      title: '匹配告警数',
      dataIndex: 'alertNum',
      key: 'alertNum',
      sorter: (a, b) => sorterFirstAlphabet(a.alertNum, b.alertNum),
      render: (_, record) => (
        <Space size="middle" className="">{record.alertNum}</Space>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      sorter: (a, b) => sorterFirstAlphabet(a.remarks, b.remarks),
      maxWidth: 200,
      render: (_, record) => (
        <Space size="middle" className="remarkWarp">{record.remarks}</Space>
      ),
    },
    {
      title: '操作',
      key: 'x',
      dataIndex: '',
      render: (_, record) => (
        <Space>
          <Popover
            placement='bottom'
            content={
              <div className='pop_modal deafultClass'>
                <Button type='link' onClick={() => handleEditSilent(record)}>
                  修改
                </Button>
                <Button type='link' onClick={() => handleDeleteSilent(record)}>
                  删除
                </Button>
              </div>
            }
            trigger='click'
            open={popOpen === record.key}
            onOpenChange={(newOpen) =>
              newOpen ? setPopOpen(record.key) : setPopOpen('')
            }
          >
            <MoreOutlined className='common_antd_icon primary_color' />
          </Popover>
        </Space>
      ),
    },
  ];
  const showSilentModal = () => {
    setFormType('add');
    setIsSilentModalOpen(true);
    setPropsChildData({
      beginTime: '',
      labelList: [{ key: '', value: '' }],
      remarks: '',
      creators: userStore.user.name,
      timeType: 'd',
      timeNum: 1,
    });
  };
  const handleChildClick = (data) => {
    let arr = data;
    editSilent(arr);
  };
  const cancelEdit = () => {
    setIsSilentModalOpen(false);
  };
  const editSilent = async (data) => {
    if (formType === 'edit') {
      try {
        const res1 = await deleteSilentAlert(silentId);
        if (res1.status === ResponseCode.OK) {
          setSilentId('');
          const res = await creatSilentAlert(data);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑静默成功！');
            setIsSilentModalOpen(false);
            resetSilentSearch();
            cancelEdit();
          } else {
            messageApi.error('编辑静默失败！');
          }
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
        }
      }
    } else {
      try {
        const res = await creatSilentAlert(data);
        if (res.status === ResponseCode.OK) {
          messageApi.success('创建静默成功！');
          setIsSilentModalOpen(false);
          resetSilentSearch();
          cancelEdit();
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
        } else {
          let errorData = '';
          if (typeof (error.response.data) === 'string') {
            errorData = error.response.data;
          } else {
            errorData = error.response.data.message;
          }
          messageApi.error(`创建静默失败,原因：${errorData}！`);
        }
      }
    }
  };
  const deleteSilent = async () => {
    try {
      const res = await deleteSilentAlert(silentId);
      if (res.status === ResponseCode.OK) {
        messageApi.success(`删除${silentName}成功！`);
        setSilentDelModalOpen(false);
        setIsSilentDelCheck(false);
        setSilentName('');
        getSilentLists();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      }
    }
  };

  const handleSilentCheckFn = (e) => {
    setIsSilentDelCheck(e.target.checked);
  };

  const getAlertLists = async () => {
    let a = [];
    const res = await getAlertOptions();
    if (res.status === ResponseCode.OK) {
      a = res.data;
    }
    return a;
  };
  const getSilentLists = async (string = searchString) => {
    const res = await getSilentList(string);
    let alertlists = await getAlertLists();
    let arr2 = [];
    alertlists.filter(item => item.status.state === 'suppressed').map(item => {
      arr2.push({
        name: item.labels.alertname,
        desc: item.annotations.description,
        level: item.labels.severity,
        time: item.startsAt,
        alertIds: item.status.silencedBy.length > 0 ? item.status.silencedBy : item.status.inhibitedBy,
        label: item.labels,
      });
    });
    let arr = [];
    if (res.status === ResponseCode.OK) {
      res.data.filter(item => item.status.state === 'active' || item.status.state === 'pending').map(item => {
        let alertNames;
        let matcherName = item.matchers.filter(subitem => subitem.name === 'alertname');
        if (matcherName.length > 0) {
          alertNames = matcherName[0].value;
        } else {
          alertNames = `${item.matchers[0].name}=${item.matchers[0].value}`;
        }
        let _alertSecondlist = [];
        if (arr2.length > 0) {
          arr2.forEach(arr2item => {
            if (arr2item.alertIds.includes(item.id)) {
              _alertSecondlist.push(arr2item);
            }
          });
        }
        arr.push({
          key: item.id,
          name: alertNames,
          state: item.status.state,
          remarks: item.comment,
          creators: item.createdBy,
          begintime: item.startsAt,
          endtime: item.endsAt,
          alertNum: _alertSecondlist.length,
          id: item.id,
          alertList: _alertSecondlist,
          matchers: item.matchers,
        });
      });
      let silentNameOption = [];
      let silentLabelOptions = [];
      filterRepeatByid(arr).map(item => {
        silentNameOption.push({
          label: item.name,
          value: item.name,
        });
        item.matchers.map(subitem => {
          silentLabelOptions.push({
            label: `${subitem.name}=${subitem.value}`,
            value: `${subitem.name}=${subitem.value}`,
          });
        });
      });
      arr = arr.sort((a, b) => dayjs(b.begintime).unix() - dayjs(a.begintime).unix());
      setLabelOptions(filterRepeat(silentLabelOptions));
      setSilentNameOptions(defaultOptions.concat(filterRepeat(silentNameOption)));
      let filiterCreators = [];
      filterRepeatByid(arr).forEach(item => {
        filiterCreators.push({
          text: item.creators,
          value: item.creators,
        });
      });
      setFilterAlarmStatus(filterRepeat(filiterCreators));
      setSilentTableList(filterRepeatByid(arr));
    }
  };
  const getSilentOptions = async () => {
    const res = await getSilentList();
    let arrOption = [];
    if (res.status === ResponseCode.OK) {
      res.data.filter(item => item.status.state === 'active' || item.status.state === 'pending').map(item => {
        let alertNamesOption;
        let matcherName = item.matchers.filter(subitem => subitem.name === 'alertname');
        if (matcherName.length > 0) {
          alertNamesOption = matcherName[0].value;
        } else {
          alertNamesOption = `${item.matchers[0].name}=${item.matchers[0].value}`;
        }
        arrOption.push({
          key: item.id,
          name: alertNamesOption,
          matchers: item.matchers,
        });
      });
      let silentNameOptions2 = [];
      let silentLabelOption = [];
      filterRepeatByid(arrOption).map(item => {
        silentNameOptions2.push({
          label: item.name,
          value: item.name,
        });
        item.matchers.map(subitem => {
          silentLabelOption.push({
            label: `${subitem.name}=${subitem.value}`,
            value: `${subitem.name}=${subitem.value}`,
          });
        });
      });
      setLabelOptions(filterRepeat(silentLabelOption));
      setSilentNameOptions(defaultOptions.concat(filterRepeat(silentNameOptions2)));
    }
  };
  const timeSearch = () => {
    clearTimeout(setTimeoutId);
    getSilentLists(searchString);
    setTimeoutId = setTimeout(() => {
      timeSearch();
    }, 15000);
  };
  useEffect(() => {
    getSilentOptions();
    setTimeoutId = 0;
    searchString = '';
  }, []);

  useEffect(() => {
    timeSearch();
    return () => clearTimeout(setTimeoutId);
  }, []);

  return (
    <div className='silentAlarm child_content'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <BreadCrumbCom items={[{ title: '告警', path: `/${containerRouterPrefix}/alarm/silentAlarm`, disabled: true }, { title: '静默告警', path: '/' }]} />
      <div className='silentAlarm_top' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <p className='silentAlarm_top_name' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>静默名称</p>
        <Select
          className='silentAlarm_top_nameSearch'
          defaultValue={'全部'}
          style={{ width: 236 }}
          options={silentNameOptions}
          onChange={changeSilentName}
          value={selectSilentName}
        />
        <p className='silentAlarm_top_label' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>标签</p>
        <Select
          className='silentAlarm_top_labelSearch'
          mode="multiple"
          allowClear
          placeholder="请选择标签"
          style={{ width: '580px', maxWidth: '500px' }}
          onChange={changeSilentLabel}
          options={labelOptions}
          value={selectSilentLabel}
        />
        <Button onClick={resetSilentSearch} className='silentAlarm_top_resetSearch btn'>重置</Button>
        <Button type="primary" onClick={searchSilent} className='btn'>查询</Button>
      </div>
      <div className='silentAlarm_content' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <Button type="primary" onClick={showSilentModal} className='creatSilentBtn'>创建静默</Button>
        <ConfigProvider locale={zhCN}>
          <Table
            columns={silentColumns}
            onChange={handleAlarmTableChange}
            pagination={{
              className: 'page',
              style: { paddingRight: '0px' },
              showTotal: total => `共${total}条`,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ paddingLeft: '160px' }}>
                  <p>已静默告警</p>
                  {record.alertList.map((item, index) => (
                    <div style={{ display: 'flex' }}>
                      <p style={{ marginRight: '8px' }}>{`${item.name}:`}</p>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>

              ),
              rowExpandable: (record) => record.name !== '',
            }}
            dataSource={silentTableList}
          />
        </ConfigProvider>
      </div>
      <EditSilentAlarmModal formType={formType} isShowModel={isSilentModalOpen} data={propsChildData} cancelEdit={cancelEdit} submitModel={handleChildClick} />
      <DeleteInfoModal
        title="删除静默"
        open={silentDelModalOpen}
        cancelFn={handleDelSilentCancel}
        content={[
          '删除静默后，相关告警会恢复至当前告警列表。',
          `确定删除静默 ${silentName} 吗？`,
        ]}
        showCheck={true}
        isCheck={isSilentDelCheck}
        checkFn={handleSilentCheckFn}
        confirmFn={deleteSilent} />
    </div >
  );
}
