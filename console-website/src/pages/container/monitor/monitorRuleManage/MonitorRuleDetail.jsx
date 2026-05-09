/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useCallback, useEffect, useState, useStore } from 'openinula';
import { useParams } from 'inula-router';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant';
import {
  ResponseCode,
  alarmStatusEx,
  alarmLevelEx,
} from '@/common/constants';
import { getAlarmListData } from '@/api/monitorApi';
import { filterAlertStatus, filterAlertStatusStyle } from '@/utils/common';

export default function MonitorRuleDetail() {
  const { name } = useParams();

  const [alarmDetail, setAlarmDetail] = useState();

  const themeStore = useStore('theme');

  const getAlarmDetail = useCallback(async () => {
    const res = await getAlarmListData();
    if (res.status === ResponseCode.OK) {
      const [data, ...resets] = res.data.alertingRules.filter(item => item.name === name);
      setAlarmDetail(data);
    }
  }, [name]);

  useEffect(() => {
    getAlarmDetail();
  }, [getAlarmDetail]);

  return <div className="child_content">
    <BreadCrumbCom className='create_bread' items={[
      { title: '监控', path: `/${containerRouterPrefix}/monitor`, disabled: true },
      { title: '告警规则', path: `/monitorRuleManage` },
      { title: '详情', path: `/detail` },
    ]} />
    <div className={`tab_container container_margin_box monitor_rule_container_width`}>
      <div className='detail_card'>
        <h3>告警规则信息</h3>
        <div className="detail_info_box">
          <div className="base_info_list">
            <div className="flex_item_opt monitor_rule">
              <div className="base_description">
                <p className='base_key'>分组：</p>
                <p className='base_value'>{alarmDetail?.group}</p>
              </div>
              <div className="base_description">
                <p className='base_key'>状态：</p>
                <p className='base_value status_group'>
                  <span className={`${!!alarmDetail?.status && (alarmDetail?.status).toLowerCase()}_circle`}></span>
                  <span>{`${alarmStatusEx[alarmDetail?.status]} (${alarmDetail?.status})`}</span>
                </p>
              </div>
              <div className="base_description">
                <p className='base_key'>持续时间：</p>
                <p className='base_value'>{alarmDetail?.duration}</p>
              </div>
            </div>
            <div className="flex_item_opt">
              <div className="base_description">
                <p className='base_key'>名称：</p>
                <p className='base_value' >{alarmDetail?.name}</p>
              </div>
              <div className="base_description">
                <p className='base_key'>等级：</p>
                  <p style={filterAlertStatusStyle(alarmDetail?.severity)}>{filterAlertStatus(alarmDetail?.severity)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className='detail_info_box'>
          <div className="base_info_list" style={{ width: '100%' }}>
            <div className="flex_item_opt">
              <div className="base_description" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <p className='base_key'>描述：</p>
                <p className='base_value' style={{ marginLeft: 0, marginTop: '12px' }}>{alarmDetail?.description || '--'}</p>
              </div>
              <div className="base_description" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <p className='base_key'>概述：</p>
                <p className='base_value' style={{ marginLeft: 0, marginTop: '12px' }}>{alarmDetail?.summary || '--'}</p>
              </div>
              <div className="base_description" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <p className='base_key'>表达式：</p>
                <p className='base_value' style={{ marginLeft: 0, marginTop: '12px' }}>{alarmDetail?.query}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div >;
}