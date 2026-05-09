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

import { Fragment, useState, useStore, useMemo } from 'openinula';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import { useHistory } from 'inula-router';
import { CloseCircleFilled, CheckCircleFilled, LoadingOutlined, QuestionCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { message } from 'antd';
import { filterManageState } from '@/utils/common';
import '@/styles/pages/helm.less';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function HelmDetailInfo({ helmName, helmDetailDataProps }) {
  const history = useHistory();

  const [helmDetailData, setHelmDetailData] = useState(helmDetailDataProps); // 详情数据

  const [messageApi, contextHolder] = message.useMessage();

  const [infoName, setInfoName] = useState(helmName);

  const themeStore = useStore('theme');

  // 状态图标判断  
  const helmStateIconFilter = (state) => {
    if (state === '部署成功') {
      return <CheckCircleFilled className="helm_state_successful" style={{ marginRight: '8px' }} />;
    } else if (state === '部署失败') {
      return <CloseCircleFilled className="helm_state_failed" style={{ marginRight: '8px' }} />;
    } else if (state === '未知') {
      return <QuestionCircleFilled className="helm_state_unknown" style={{ marginRight: '8px' }} />;
    } else if (state === '卸载中') {
      return <ExclamationCircleFilled className="helm_state_unknown" />;
    } else {
      return <LoadingOutlined className="helm_state_pending" style={{ marginRight: '8px' }} />;
    }
  };

  const goAppMarket = () => {
    if (helmDetailData.labels['openfuyao.io.repo']) {
      history.push(`/${containerRouterPrefix}/appMarket/marketCategory/ApplicationDetails/${helmDetailData.chart.metadata.name}/${helmDetailData.labels['openfuyao.io.repo']}/${helmDetailData.chart.metadata.version}`);
    } else {
      messageApi.info('安装来源非openFuyao应用市场', 5);
    }
  };

  const baseInfoItems = useMemo(() => [
    { key: '应用名称：', value: infoName },
    { key: '应用版本：', value: helmDetailData.chart?.metadata?.appVersion ? helmDetailData.chart.metadata.appVersion : '--' },
    { key: '命名空间：', value: helmDetailData?.namespace },
    { key: '模板版本：', value: helmDetailData.chart?.metadata?.version ? helmDetailData.chart.metadata.version : '--' },
    {
      key: '状态：',
      value: <span>{helmStateIconFilter(filterManageState(helmDetailData?.info?.status))}{filterManageState(helmDetailData?.info?.status)}</span>,
    },
    { key: '创建时间：', value: Dayjs(helmDetailData?.info?.firstDeployed).format('YYYY-MM-DD HH:mm') },
    { key: '应用模板：', value: helmDetailData.chart?.metadata?.name },
    { key: '更新时间：', value: Dayjs(helmDetailData?.info?.lastDeployed).format('YYYY-MM-DD HH:mm') },
  ], [helmDetailData]);

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="helm_tab_container container_margin_box tooltip_container_height">
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={baseInfoItems} columns={2} />
        </div>
      </div>
    </div>
  </Fragment>;
}