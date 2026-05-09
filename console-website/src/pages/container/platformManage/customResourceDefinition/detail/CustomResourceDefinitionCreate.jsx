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
import { useState, createRef, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addCustomResourceDefinitionYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory } from 'inula-router';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { customResourceDefinitionYamlExample } from '@/common/exampleYaml';
export default function CustomResourceDefinitionCreate() {
  const history = useHistory();
  const [customResourceDefinitionYaml, setCustomResourceDefinitionYaml] = useState(customResourceDefinitionYamlExample);
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(customResourceDefinitionYaml);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (str) => {
    setCustomResourceDefinitionYaml(str);
  };

  const handleSaveYaml = async () => {
    let errorCount = 0;
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(customResourceDefinitionYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      try {
        const res = await addCustomResourceDefinitionYamlData(yamlJson);
        if (res.status === ResponseCode.Created) {
          messageApi.success('创建成功');
          setTimeout(() => {
            history.push(`/${containerRouterPrefix}/customResourceDefinition`);
          }, 2000);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        } else {
          messageApi.error(`创建失败！${error.response.data.message}`);
        }
      }
    }
  };

  const handleResetCode = () => {
    setCustomResourceDefinitionYaml(customResourceDefinitionYamlExample);
    childCodeMirrorRef.current.resetCodeEditor(customResourceDefinitionYamlExample);
  };

  const exportYaml = () => {
    exportYamlOutPut('CustomResourceDefinition', customResourceDefinitionYaml);
    messageApi.success('导出成功');
  };

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={[
      { title: '自定义资源', path: `/${containerRouterPrefix}/customResourceDefinition` },
      { title: '创建自定义资源', path: `/createCustomResourceDefinition` }]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML</h3>
          <div className="yaml_tools">
            <div className="tool_word_group customResourceDefinitionCreateExport" onClick={exportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="tool_word_group customResourceDefinitionCreateCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        <CodeMirrorEditor yamlData={customResourceDefinitionYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />
        <div className="btn_footer">
          <Button className="cancel_btn borderRadiusRight6" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn borderRadiusRight6" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn borderRadiusRight6" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}