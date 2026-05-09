/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import '@/styles/components/diffTimeInfo.less';
import { WarningFilled } from '@ant-design/icons';
export default function DiffTimeInfo({
  time,
  className,
}) {
  return <div className={`diff_time_box ${className}`}>
    <WarningFilled className='warn_icon'/>
    <p>浏览器与服务器时间存在{time}秒差异，部分数据可能受到影响。</p>
  </div>;
}