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
import { containerRouterPrefix } from '@/constant';
import { useHistory } from 'inula-router';
import { Table, Space, Button, Popover, message, Tag } from 'antd';
import '@/styles/pages/alarm.less';
import { useLocation } from 'inula-router';
import dayjs from 'dayjs';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import { solveAnnotation } from '@/tools/utils';
import { filterAlertStatus, filterAlertStatusStyle, getTimeType } from '@/utils/common';
import { DownOutlined } from '@ant-design/icons';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { deleteSilentAlert, getSilentListDetail, getAlertOptions, creatSilentAlert } from '@/api/containerAlertApi';
import EditSilentAlarmModal from './EditSilentAlarmModal';
import utc from 'dayjs/plugin/utc';
import LabelTag from '@/components/LabelTag';
dayjs.extend(utc);
export default function AlarmDetail() {
  const history = useHistory();
  const location = useLocation();
  const [detailsInfo, setDetailsInfo] = useState();
  const [silentId, setSilentId] = useState(location.state.currentdetail.id);
  const [isSilentDelCheck, setIsSilentDelCheck] = useState(false); // 是否选中
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const silentDetailColumns = [
    {
      title: '告警名称',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space size="middle" className="alertName">
          {record.name}
        </Space>
      ),
    },
    {
      title: '告警描述',
      dataIndex: 'desc',
      key: 'desc',
      width: '25%',
    },
    {
      title: '告警等级',
      dataIndex: 'level',
      key: 'level',
      width: '150px',
      render: (_, record) => (
        <Space size="middle" className="">
          <div style={filterAlertStatusStyle(record.level)}>
            {filterAlertStatus(record.level)}
          </div>
        </Space>
      ),
    },
    {
      title: '触发时间',
      dataIndex: 'time',
      key: 'time',
      render: (_, record) => (
        <Space size="middle">
          {dayjs(record.time).format('YYYY-MM-DD HH:mm')}
        </Space>
      ),
    },
    {
      title: '标签',
      width: '40%',
      dataIndex: 'label',
      key: 'label',
      render: (_, record) => (
        <Space size="middle" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {solveAnnotation(record.label).map(item => (
            <p className='alarmDetail_info_labels_content'>{`${item.key}` + `=` + `${item.value}`}</p>
          ))}
        </Space>
      ),
    },
  ];
  const [propsChildData, setPropsChildData] = useState();
  const formType = 'edit';
  const [silentPopOpen, setSilentPopOpen] = useState(false); // 气泡悬浮
  const [silentDelModalOpen, setSilentDelModalOpen] = useState(false); // 删除对话框展示
  const [isSilentModalOpen, setIsSilentModalOpen] = useState(false);
  // 气泡
  const handlSilentPopOpenChange = (open) => {
    setSilentPopOpen(open);
  };
  const handleEditSilent = (data) => {
    setIsSilentModalOpen(true);
    let labelList = [];
    data.matchers.map(item => {
      labelList.push({
        key: item.name,
        value: item.value,
      });
    });
    let time = dayjs(dayjs(detailsInfo?.endtime).format('YYYY-MM-DD HH:mm')).diff(dayjs(detailsInfo?.begintime).format('YYYY-MM-DD HH:mm')) / 1000;
    setPropsChildData({
      beginTime: dayjs(dayjs(detailsInfo?.begintime).format('YYYY-MM-DD HH:mm')),
      labelList,
      creators: data.creators,
      remarks: data.remarks,
      timeType: getTimeType(time).type,
      timeNum: getTimeType(time).num,
    });
  };
  // 删除按钮
  const handleDeleteSilent = () => {
    setSilentPopOpen(false); // 气泡框
    setSilentDelModalOpen(true); // 打开弹窗
  };
  const deleteSilent = async () => {
    try {
      const res = await deleteSilentAlert(silentId);
      if (res.status === ResponseCode.OK) {
        messageApi.success(`删除${detailsInfo.name}成功！`);
        setSilentDelModalOpen(false);
        setTimeout(() => {
          history.push(`/${containerRouterPrefix}/alarm/silentAlarm`);
        }, 1000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(`删除${detailsInfo.name}失败！`);
      }
    }
  };
  const handleDelSilentCancel = () => {
    setSilentDelModalOpen(false);
  };
  const handleSilentCheckFn = (e) => {
    setIsSilentDelCheck(e.target.checked);
  };
  const cancelEdit = () => {
    setIsSilentModalOpen(false);
  };
  const handleChildClick = (data) => {
    let arr = data;
    editSilent(arr);
  };
  const editSilent = async (data) => {
    try {
      const res1 = await deleteSilentAlert(silentId);
      if (res1.status === ResponseCode.OK) {
        const res = await creatSilentAlert(data);
        if (res.status === ResponseCode.OK) {
          messageApi.success('编辑静默成功！');
          setIsSilentModalOpen(false);
          setSilentId(res.data.silenceID);
          cancelEdit();
          setTimeout(() => {
            history.push(`/${containerRouterPrefix}/alarm/silentAlarm`);
          }, 1000);
        } else {
          messageApi.error('编辑静默失败！');
        }
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      }
    }
  };
  const getAlertLists = async () => {
    let a = [];
    const res = await getAlertOptions();
    if (res.status === ResponseCode.OK) {
      a = res.data;
    }
    return a;
  };
  const getSilentDetail = useCallback(async () => {
    const res = await getSilentListDetail(silentId);
    let _alertlist = await getAlertLists();
    let arrAlertList = [];
    _alertlist.filter(item => item.status.state === 'suppressed').map(item => {
      arrAlertList.push({
        name: item.labels.alertname,
        desc: item.annotations.description,
        level: item.labels.severity,
        time: item.startsAt,
        alertIds: item.status.silencedBy.length > 0 ? item.status.silencedBy : item.status.inhibitedBy,
        label: item.labels,
      });
    });
    let silentDetail = {};
    if (res.status === ResponseCode.OK) {
      let _alertName;
      let _matcherName = res.data.matchers.filter(subitem => subitem.name === 'alertname');
      if (_matcherName.length > 0) {
        _alertName = _matcherName[0].value;
      } else {
        _alertName = `${res.data.matchers[0].name}=${res.data.matchers[0].value}`;
      }
      let _alertSecondlist = [];
      if (arrAlertList.length > 0) {
        arrAlertList.forEach(arr2item => {
          if (arr2item.alertIds.includes(res.data.id)) {
            _alertSecondlist.push(arr2item);
          }
        });
      }
      silentDetail = {
        key: res.data.id,
        name: _alertName,
        state: res.data.status.state,
        remarks: res.data.comment,
        creators: res.data.createdBy,
        begintime: res.data.startsAt,
        endtime: res.data.endsAt,
        alertNum: _alertSecondlist.length,
        id: res.data.id,
        alertList: _alertSecondlist,
        matchers: res.data.matchers,
      };
      setDetailsInfo(silentDetail);
    }
  }, [silentId]);
  useEffect(() => {
    getSilentDetail();
  }, [getSilentDetail]);

  return (
    <div className='alarmDetail child_content'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className='alarmDetail_top'>
        <BreadCrumbCom items={[{ title: '告警', disabled: true }, { title: '静默告警', path: `/${containerRouterPrefix}/alarm/silentAlarm` }, { title: '详情', path: `/${containerRouterPrefix}/alarm/silentAlarm/detail` + `${detailsInfo?.name}` }]} />
        <div className='alarmDetail_top_row' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
          <p className='alarmDetail_top_name' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{detailsInfo?.name}</p>
          <Popover
            placement='bottom'
            content={
              <Space className='column_pop'>
                <Button type='link' onClick={() => handleEditSilent(detailsInfo)}>修改</Button>
                <Button type='link' onClick={handleDeleteSilent}>删除</Button>
              </Space>
            }
            open={silentPopOpen}
            onOpenChange={handlSilentPopOpenChange}
          >
            <Button className='primary_btn'>
              操作 <DownOutlined className='small_margin_adjust' />
            </Button>
          </Popover>
        </div>
      </div>
      <div className='tab_container container_margin_box normal_container_height'>
        <div className="detail_card">
          <h3>基本信息</h3>
          <div className='detail_info_box'>
            <div className="base_info_list">
              <div className="flex_item_opt">
                <div className='base_description'>
                  <p className='base_key'>静默名称：</p>
                  <p className='base_value'>{detailsInfo?.name}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key'>静默状态：</p>
                  <p className='base_value'>{detailsInfo?.state}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key'>创建者：</p>
                  <p className='base_value'>{detailsInfo?.creators}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key'>备注：</p>
                  <p className='base_value'>{detailsInfo?.remarks}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className='base_description'>
                  <p className='base_key long_width'>静默开始时间：</p>
                  <p className='base_value'>{dayjs(detailsInfo?.begintime).format('YYYY-MM-DD HH:mm')}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key long_width'>静默结束时间：</p>
                  <p className='base_value'>{dayjs(detailsInfo?.endtime).format('YYYY-MM-DD HH:mm')}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key long_width'>最后更新时间：</p>
                  <p className='base_value'>{dayjs(detailsInfo?.begintime).format('YYYY-MM-DD HH:mm')}</p>
                </div>
              </div>
            </div>
            <div className="annotation">
              <div className='ann_title'>
                <p>标签：</p>
              </div>
              <div className='key_value'>
                {detailsInfo?.matchers.map(item => (
                  <LabelTag labelKey={item.name} labelValue={item.value} theme={themeStore.$s.theme} />
                ))}
              </div>
            </div>

          </div>
        </div>
        <div className="detail_card">
          <h3>已静默告警</h3>
          <div className='detail_info_box'>
            <Table columns={silentDetailColumns} dataSource={detailsInfo?.alertList} className='silentAlertDetailTable' />
          </div>
        </div>
      </div>
      <EditSilentAlarmModal formType={formType} isShowModel={isSilentModalOpen} data={propsChildData} cancelEdit={cancelEdit} submitModel={handleChildClick} />
      <DeleteInfoModal
        title="删除静默"
        open={silentDelModalOpen}
        cancelFn={handleDelSilentCancel}
        content={[
          '删除静默后，相关告警会恢复至当前告警列表。',
          `确定删除静默 ${detailsInfo?.name} 吗？`,
        ]}
        showCheck={true}
        isCheck={isSilentDelCheck}
        checkFn={handleSilentCheckFn}
        confirmFn={deleteSilent} />
    </div>
  );
}
