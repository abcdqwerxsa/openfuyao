/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/podDetail.less';
import { useState, createRef, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addNamespaceYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory } from 'inula-router';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { namespaceYamlExample } from '@/common/exampleYaml';
export default function NamespaceCreate() {
  const history = useHistory();
  const [namespaceYaml, setNamespaceYaml] = useState(namespaceYamlExample);
  const [messageApi, contextHolder] = message.useMessage();
  const childCodeMirrorRef = createRef(null);
  const themeStore = useStore('theme');
  const handleCopyYaml = () => {
    copy(namespaceYaml);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (str) => {
    setNamespaceYaml(str);
  };

  const handleSaveYaml = async () => {
    let errorCount = 0;
    let yamlJson = '';
    let passNamespace = '';
    try {
      yamlJson = yamlTojson(namespaceYaml);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (yamlJson.metadata && yamlJson.metadata.name) {
        passNamespace = yamlJson.metadata.name; // 命名空间name
      }
      if (passNamespace) {
        try {
          const res = await addNamespaceYamlData(yamlJson);
          if (res.status === ResponseCode.Created) {
            messageApi.success('创建成功');
            setTimeout(() => {
              history.push(`/${containerRouterPrefix}/namespace/namespaceManage`);
            }, 2000);
          }
        } catch (namespaceCreateError) {
          if (namespaceCreateError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, namespaceCreateError);
          } else {
            messageApi.error(`创建失败！${namespaceCreateError.response.data.message}`);
          }
        }
      } else {
        messageApi.error('命名空间必须填写！');
      }
    }
  };

  const handleResetCode = () => {
    setNamespaceYaml(namespaceYamlExample);
    childCodeMirrorRef.current.resetCodeEditor(namespaceYamlExample);
  };

  const exportYaml = () => {
    exportYamlOutPut('Namespace', namespaceYaml);
    messageApi.success('导出成功');
  };

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={[
      { title: '命名空间', link: `/${containerRouterPrefix}/namespace/namespaceManage` },
      { title: 'Namespace', link: `/${containerRouterPrefix}/namespace/namespaceManage` },
      { title: '创建' }]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML</h3>
          <div className="yaml_tools">
            <div className="tool_word_group namespaceCreateExport" onClick={exportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>

            <div className="tool_word_group namespaceCreateCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        <CodeMirrorEditor yamlData={namespaceYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />
        <div className="btn_footer">
          <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}