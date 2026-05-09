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

import { Fragment, useEffect, useState, useStore, useMemo } from 'openinula';
import { ResponseCode } from '@/common/constants';
import { containerRouterPrefix } from '@/constant.js';
import Dayjs from 'dayjs';
import { useHistory } from 'inula-router';
import { EditOutlined, CloseCircleFilled, CheckCircleFilled, LoadingOutlined, InfoCircleFilled, QuestionCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { message, Switch, Button } from 'antd';
import { filterManageState } from '@/utils/common';
import { getExtendPageList, updateExtendPageItemState } from '@/api/containerApi';
import '@/styles/pages/extend.less';
import NoExtendManage from '@/assets/images/noExtendManage.png';
import ToastMsg from '@/components/ToastMsg';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

let arr = []; // 全局扩展保存时的对比

export default function ExtendDetailInfo({
  extendName,
  extendDetailDataProps,
  isEditNow,
  handleEditFn,
  handleOkRefreshFn,
  handleCancelRefreshFn,
  handlePluginShow,
}) {
  const [isShow, setIsShow] = useState(true);

  const history = useHistory();

  const [extendDetailData, setHelmDetailData] = useState(extendDetailDataProps); // 详情数据

  const [detailLoading, setDetailLoading] = useState(false); // 页面整体加载

  const [messageApi, contextHolder] = message.useMessage();

  const [pluginsList, setPluginsList] = useState([]);

  const themeStore = useStore('theme');

  // 状态图标判断  
  const extendStateIconFilter = (state) => {
    if (state === '部署成功') {
      return <CheckCircleFilled className="extend_state_successful" style={{ marginRight: '8px' }} />;
    } else if (state === '部署失败') {
      return <CloseCircleFilled className="extend_state_failed" style={{ marginRight: '8px' }} />;
    } else if (state === '未知') {
      return <QuestionCircleFilled className="extend_state_unknown" style={{ marginRight: '8px' }} />;
    } else if (state === '卸载中') {
      return <ExclamationCircleFilled className="helm_state_unknown" />;
    } else {
      return <LoadingOutlined className="extend_state_pending" style={{ marginRight: '8px' }} />;
    }
  };

  const getExtendDetailExtendPageList = async () => {
    let resourcesList = extendDetailData.resources;
    let pluginName = [];
    if (resourcesList) {
      resourcesList.forEach(item => {
        if (item.kind === 'ConsolePlugin') {
          pluginName.push(item.name);
        }
      });
    }
    try {
      let _pluginsArr = [];
      for (let i = 0; i < pluginName.length; i++) {
        const res = await getExtendPageList(pluginName[i]);
        if (res.status === ResponseCode.OK) {
          _pluginsArr.push({ name: res.data.data.pluginName, info: `${res.data.data.displayName}${res.data.data.pluginName}${res.data.data.entrypoint}`, enabled: res.data.data.enabled });
          arr.push({ name: res.data.data.pluginName, value: res.data.data.enabled });
        }
      }
      setPluginsList(_pluginsArr);
      if (_pluginsArr.length) {
        handlePluginShow(true);
      } else {
        handlePluginShow(false);
      }
    } catch (e) {
      setPluginsList([]);
      handlePluginShow(false);
    }
  };

  const onChangeSwitch = (checked, record) => {
    record.enabled = checked;
    arr.map((item => {
      if (item.name === record.name) {
        item.value = record.enabled;
      }
    }));
  };

  const handSave = async () => {
    try {
      let count = 0; // 递归让接口执行完
      for (let i = 0; i < pluginsList.length; i++) {
        const indexList = arr.filter(item => item.name === pluginsList[i].name);
        if (indexList.length) {
          const res = await updateExtendPageItemState(indexList[0].name, { pluginName: indexList[0].name, enabled: indexList[0].value });
          count++;
        }
      }
      if (count === pluginsList.length) {
        setTimeout(() => {
          handleOkRefreshFn();
          handleEditFn(true);
        }, 1000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('保存失败', 5);
      }
    }
  };

  const handCancel = () => {
    handleEditFn(true);
    handleCancelRefreshFn();
  };

  const goAppMarket = () => {
    if (extendDetailData.labels['openfuyao.io.repo']) {
      history.push(`/${containerRouterPrefix}/appMarket/marketCategory/ApplicationDetails/${extendDetailData.chart.metadata.name}/${extendDetailData.labels['openfuyao.io.repo']}/${extendDetailData.chart.metadata.version}`);
    } else {
      messageApi.info('安装来源非openFuyao应用市场', 5);
    }
  };

  useEffect(() => {
    getExtendDetailExtendPageList();
  }, []);

  const baseInfoItems = useMemo(() => [
    { key: '应用名称：', value: extendName },
    {
      key: '状态：',
      value: <span>{extendStateIconFilter(filterManageState(extendDetailData.info.status))}{filterManageState(extendDetailData.info.status)}</span>
    },
    { key: '创建时间：', value: Dayjs(extendDetailData.info.firstDeployed).format('YYYY-MM-DD HH:mm') },
    { key: '更新时间：', value: Dayjs(extendDetailData.info.lastDeployed).format('YYYY-MM-DD HH:mm') },
    { key: '命名空间：', value: extendDetailData.namespace },
    { key: '应用模板：', value: extendDetailData.chart?.metadata?.name ? extendDetailData.chart.metadata.name : '--' },
    { key: '模板版本：', value: extendDetailData.chart?.metadata?.version ? extendDetailData.chart.metadata.version : '--' },
  ], [extendDetailData]);

  return <Fragment>
    <ToastMsg contextHolder={contextHolder} />
    <div className={`extend_tab_container container_margin_box`} style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <div className="detail_card basic_info_card_extend">
        <div className="basic_info_card_left">
          <h3>基本信息</h3>
          <div className="detail_info_box">
            <DetailBaseInfoList items={baseInfoItems} columns={1} />
          </div>
        </div>
        <div className='basic_info_card_right'>
          {extendDetailData.info?.status !== 'failed' ? <div>
            <div className='title' >
              <h3 style={{ marginRight: '10px' }}>扩展界面启停</h3>
              {(isEditNow && pluginsList.length !== 0) && <EditOutlined className='edit' onClick={() => handleEditFn(false)} />}
            </div>
            <div className='hint'>
              <InfoCircleFilled className='hint_icon' />
              <span className='hint_text'>扩展组件提供自定义的扩展前端界面。扩展界面启用/停用后，系统将提示您刷新以展示最新的前端界面。请确保信任该扩展组件。</span>
            </div>
            {pluginsList.length !== 0 ? pluginsList.map(item => {
              return < div className='extend_box'>
                <div className='extend_content'>
                  <div className='extend_content_group'>
                    <p className='group_name'>{item.name}</p>
                    <Switch disabled={isEditNow} defaultChecked={item.enabled} onChange={e => onChangeSwitch(e, item)} />
                  </div>
                  <div className='extend_content_group'>
                    <p className='group_info'>{item.info}</p>
                  </div>
                </div>
              </div>;
            }) :
              <div>
                <div className='no_extend_box'>
                  <div className='no_extend_content'>
                    <img src={NoExtendManage} alt="" />
                    <p className='no_extend_content_info'>当前扩展组件不包含扩展界面</p>
                  </div>
                </div>
              </div>
            }
            {!isEditNow && <div className='extend_boxButton'>
              <Button className='cancel_btn' onClick={handCancel} style={{ marginRight: '16px' }}>取消</Button>
              <Button className='primary_btn' onClick={handSave}>保存</Button>
            </div>}
          </div> :
            <div>
              <div className='title' >
                <h3 className="box_title_h3" style={{ marginRight: '10px' }}>扩展界面启停</h3>
              </div>
              <div className='no_extend_box'>
                <div className='no_extend_content'>
                  <img src={NoExtendManage} alt="" />
                  <p className='no_extend_content_info'>扩展组件部署失败，无法管理界面启停</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  </Fragment>;
}