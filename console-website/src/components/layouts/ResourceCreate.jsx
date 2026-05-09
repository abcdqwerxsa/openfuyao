/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */

import { useState, createRef, useContext, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory } from 'inula-router';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { NamespaceContext } from '@/namespaceContext';
import '@/styles/pages/podDetail.less';
import ToastMsg from '@/components/ToastMsg';

/**
 * 通用 WorkloadCreate 组件
 * @param {string} type 类型
 * @param {string} yamlExample 示例 yaml
 * @param {Function} submitApi 命名空间资源: (namespace, yamlJson) => Promise；clusterScoped 时: (yamlJson) => Promise
 * @param {string} jumpPath 成功创建后跳转地址
 * @param {boolean} clusterScoped 为 true 时不校验命名空间，仅传入 yaml 调用 submitApi(yamlJson)
 */
export default function ResourceCreate({
  type = '',
  yamlExample = '',
  submitApi,
  jumpPath = '/',
  clusterScoped = false,
}) {
  const history = useHistory();
  const namespace = useContext(NamespaceContext);
  const [yamlStr, setYamlStr] = useState(yamlExample);
  const [messageApi, contextHolder] = message.useMessage();
  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(yamlStr);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (str) => {
    setYamlStr(str);
  };

  const handleSaveYaml = async () => {
    // YAML转json
    let errorCount = 0;
    let passNamespace = namespace; // 默认选择当前空间
    let yamlJson = '';
    try {
      yamlJson = yamlTojson(yamlStr);
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (clusterScoped) {
        try {
          const res = await submitApi(yamlJson);
          if (res.status === ResponseCode.Created) {
            messageApi.success('创建成功');
            setTimeout(() => {
              history.push(jumpPath);
            }, 600);
          }
        } catch (error) {
          if (error.response?.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else if (error.response) {
            messageApi.error(`创建失败！${error.response.data.message}`);
          }
        }
      } else {
        if (yamlJson.metadata && yamlJson.metadata.namespace) {
          passNamespace = yamlJson.metadata.namespace;
        }
        if (passNamespace) {
          try {
            const res = await submitApi(passNamespace, yamlJson);
            if (res.status === ResponseCode.Created) {
              messageApi.success('创建成功');
              setTimeout(() => {
                history.push(jumpPath);
              }, 600);
            }
          } catch (error) {
            if (error.response?.status === ResponseCode.Forbidden) {
              forbiddenMsg(messageApi, error);
            } else if (error.response) {
              messageApi.error(`创建失败！${error.response.data.message}`);
            }
          }
        } else {
          messageApi.error('命名空间必须填写！');
        }
      }
    }
  };

  const handleResetCode = () => {
    setYamlStr(yamlExample);
    childCodeMirrorRef.current.resetCodeEditor(yamlExample);
  };

  const exportYaml = () => {
    exportYamlOutPut(type, yamlStr);
    messageApi.success('导出成功');
  }

  return <div className="tab_container container_margin_box normal_container_height">
    <ToastMsg contextHolder={contextHolder} />
    <div className="yaml_card">
      <div className="yaml_flex_box">
        <h3>YAML</h3>
        <div className="yaml_tools">
          <div className="tool_word_group" onClick={exportYaml}>
            <ExportOutlined className="common_antd_icon primary_color" />
            <span>导出</span>
          </div>
          <div className="tool_word_group" onClick={handleCopyYaml}>
            <CopyOutlined className="common_antd_icon primary_color" />
            <span>复制</span>
          </div>
        </div>
      </div>
    </div>
    <div className="yaml_space_box">
      <CodeMirrorEditor
        yamlData={yamlStr}
        changeYaml={handleChangeYaml}
        ref={childCodeMirrorRef}
      />
      <div className="btn_footer">
        <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
        <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
        <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
      </div>
    </div>

  </div>;
}
