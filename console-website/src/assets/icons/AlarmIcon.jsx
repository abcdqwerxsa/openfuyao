/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import alarmDarkIcon from '@/assets/images/menu/alarmDarkIcon.png';
import alarmSelectedIcon from '@/assets/images/menu/alarmSelectedIcon.png';
import alarmIcon from '@/assets/images/menu/alarmIcon.png';
const alarmFilled = (theme) => (
  <img src={theme === 'light' ? alarmSelectedIcon : alarmDarkIcon} />
);

const alarmOutlined = (theme) => (
  <img src={alarmIcon} />
);

export default function AlarmIcon(selected, theme) {
  return (
    <div className="menu-icon">
      {selected ? alarmFilled(theme) : alarmOutlined(theme)}
    </div>
  );
}