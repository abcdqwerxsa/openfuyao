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
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/podDetail.less';
import { useState, createRef, useContext, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addResourceExampleYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory, useLocation } from 'inula-router';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { NamespaceContext } from '@/namespaceContext';
import { serviceMonitorYamlExample } from '@/common/exampleYaml';

export default function MonitorCreateService() {
  const { state: prefixObj } = useLocation();
  const history = useHistory();
  const namespace = useContext(NamespaceContext);
  const [serviceMonitorYaml, setServiceMonitorYaml] = useState(serviceMonitorYamlExample);
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(serviceMonitorYaml);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (str) => {
    setServiceMonitorYaml(str);
  };

  const exportYaml = () => {
    exportYamlOutPut(`ServiceMonitor`, serviceMonitorYaml);
    messageApi.success('导出成功');
  };

  const handleSaveYaml = async () => {
    // YAML转json
    let errorCount = 0;
    let passNamespace = namespace; // 默认选择当前空间
    let yamlJsonMonitorCreateService = '';
    try {
      yamlJsonMonitorCreateService = yamlTojson(serviceMonitorYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (yamlJsonMonitorCreateService.metadata && yamlJsonMonitorCreateService.metadata.namespace) {
        passNamespace = yamlJsonMonitorCreateService.metadata.namespace; // 传入文件的命名空间优先级best
      }
      if (passNamespace) {
        try {
          const res = await addResourceExampleYamlData({ ...prefixObj, namespace: passNamespace }, yamlJsonMonitorCreateService);
          if (res.status === ResponseCode.Created) {
            messageApi.success('创建成功');
            setTimeout(() => {
              history.push(`/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor`);
            }, 2000);
          }
        } catch (monitorCreateServiceError) {
          if (monitorCreateServiceError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, monitorCreateServiceError);
          } else {
            messageApi.error(`创建失败！${monitorCreateServiceError.response.data.message}`);
          }
        }
      } else {
        messageApi.error('命名空间必须填写！');
      }
    }
  };

  const handleResetCode = () => {
    setServiceMonitorYaml(serviceMonitorYamlExample);
    childCodeMirrorRef.current.resetCodeEditor(serviceMonitorYamlExample);
  };

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={[
      { title: '监控', path: `/${containerRouterPrefix}/monitor`, disabled: true },
      { title: '监控目标', path: `/monitorGoalManage` },
      { title: 'ServiceMonitor实例', path: `/serviceMonitor` },
      { title: '创建实例', path: `/create` },
    ]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML</h3>
          <div className="yaml_tools">
            <div className="tool_word_group monitorCreateServiceExport" onClick={exportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="tool_word_group monitorCreateServiceCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        <CodeMirrorEditor yamlData={serviceMonitorYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />
        <div className="btn_footer">
          <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}