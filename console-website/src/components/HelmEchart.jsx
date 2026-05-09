/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
  
 *       http://license.coscl.org.cn/MulanPSL2
  
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */

import * as echarts from 'echarts';
import { useEffect } from 'openinula';

function Echart(props, ref) {
  useEffect(() => {
    let myChart = echarts.getInstanceByDom(document.getElementById(props.propsId));
    if (myChart == null) {
      myChart = echarts.init(document.getElementById(props.propsId));
    }
    if (props.data) {
      myChart.setOption(props.data);
    }
  });
  return (
    <div id={props.propsId} style={props.propsStyle} />
  );
}
export default Echart;