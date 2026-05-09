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
import { useParams, useHistory } from 'inula-router';
import { useEffect, useState, useCallback, useStore } from 'openinula';
import '@/styles/pages/alarm.less';
import { useLocation } from 'inula-router';
import dayjs from 'dayjs';
import { Tag } from 'antd';
import { solveAnnotation } from '@/tools/utils';
import { filterAlertStatus, filterAlertStatusStyle } from '@/utils/common';
import LabelTag from '@/components/LabelTag';
export default function AlarmDetail() {
  const param = useParams();
  const name = decodeURI(param.alarm_name);
  const location = useLocation();
  const themeStore = useStore('theme');
  const detailsInfo = location.state.currentdetail;

  return (
    <div className='alarmDetail child_content'>
      <div className='alarmDetail_top'>
        <BreadCrumbCom items={[{ title: '告警', disabled: true }, { title: '当前告警', path: `/${containerRouterPrefix}/alarm/alarmIndex` }, { title: '详情', path: `/${containerRouterPrefix}/alarm/alarmIndex/detail` + `${name}` }]} />
        <div className='alarmDetail_top_row' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
          <p className='alarmDetail_top_name' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>{name}</p>
        </div>
      </div>
      <div className='tab_container container_margin_box normal_container_height'>
        <div className="detail_card">
          <h3>基本信息</h3>
          <div className="detail_info_box">
            <div className="base_info_list">
              <div className="flex_item_opt">
                <div className='base_description'>
                  <p className='base_key'>告警规则：</p>
                  <p className='base_value'>{detailsInfo.name}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key'>描述：</p>
                  <p className='base_value'>{detailsInfo.desc}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key'>触发时间：</p>
                  <p className='base_value'>{dayjs(detailsInfo.time).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
              </div>
              <div className="flex_item_opt">
                <div className='base_description'>
                  <p className='base_key'>告警等级：</p>
                  <p style={filterAlertStatusStyle(detailsInfo.level)}>{filterAlertStatus(detailsInfo.level)}</p>
                </div>
                <div className='base_description'>
                  <p className='base_key'>实情：</p>
                  <p className='base_value'>{detailsInfo.summary}</p>
                </div>
              </div>
            </div>
            <div className="annotation">
              <div className='ann_title'>
                <p>标签：</p>
              </div>
              <div className='key_value'>
                {solveAnnotation(detailsInfo.labels).map(item => (
                  <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
