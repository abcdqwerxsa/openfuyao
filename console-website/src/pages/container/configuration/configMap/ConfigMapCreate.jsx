/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { ExportOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, message, Breadcrumb } from 'antd';
import { containerRouterPrefix } from '@/constant';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { createConfigMaps } from '@/api/containerApi';
import { useState, useRef, useStore } from 'openinula';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { useHistory, Link } from 'inula-router';
import copy from 'copy-to-clipboard';
import { configYamlExample } from '@/common/exampleYaml';
import '@/styles/pages/configMap.less';
import { ResponseCode } from '@/common/constants';

export default function ConfigMapCreate() {
  const history = useHistory();
  const [create, setCreate] = useState('');
  const [createConfigurationLoading, setCreateConfigurationLoading] = useState(false);
  const childCodeMirrorRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const handleFn = (e) => {
    setCreate(e);
  };

  const handleCreate = async () => {
    setCreateConfigurationLoading(true);
    // YAML转json
    let errorCount = 0;
    let yamlJsonCreateConfiguration = '';
    let passNamespace = ''; // 默认选择当前空间
    try {
      yamlJsonCreateConfiguration = yamlTojson(create);
    } catch (e) {
      messageApi.error('YAML格式不规范');
      errorCount++;
    }
    if (!errorCount) {
      if (yamlJsonCreateConfiguration.metadata && yamlJsonCreateConfiguration.metadata.namespace) {
        passNamespace = yamlJsonCreateConfiguration.metadata.namespace; // CreateConfiguration 传入文件的命名空间优先级best
      }
      if (passNamespace) {
        try {
          const res = await createConfigMaps(passNamespace, yamlJsonCreateConfiguration);
          if (res.status === ResponseCode.Created) {
            messageApi.success('创建成功');
            setTimeout(() => {
              history.push(`/${containerRouterPrefix}/configuration/configMap`);
            }, 2000);
            setCreateConfigurationLoading(false);
          }
        } catch (createConfigurationError) {
          setCreateConfigurationLoading(false);
          if (createConfigurationError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, createConfigurationError);
          } else {
            messageApi.error(`创建失败！${createConfigurationError.response.data.message}`);
          }
        }
      } else {
        messageApi.error('命名空间必须填写！');
      }
    }
    setCreateConfigurationLoading(false);
  };
  const exportYamlCreateConfiguration = () => {
    exportYamlOutPut('configMap', create);
    messageApi.success('导出成功');
  };
  const handleCopyYamlCreateConfiguration = () => {
    copy(create);
    messageApi.success('复制成功！');
  };

  const handleResetCodeCreateConfiguration = () => {
    childCodeMirrorRef.current.resetCodeEditor(configYamlExample);
  };

  return (
    <div className='configmap child_content withBread_content CreateConfiguration'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <BreadCrumbCom
        className='create_bread'
        items={[
          { title: '配置与密钥', path: `/${containerRouterPrefix}/configuration/configMap`, disabled: true },
          { title: 'ConfigMap', path: `/${containerRouterPrefix}/configuration/configMap` },
          { title: '创建' },
        ]}
      />
      <div className='tab_container CreateConfiguration'>
        <div className="yaml_card">
          <div className="yaml_flex_box">
            <h3>YAML</h3>
            <div className="yaml_tools">
              <div className="tool_word_group createConfigurationExport" onClick={exportYamlCreateConfiguration}>
                <ExportOutlined className="common_antd_icon primary_color" />
                <span>导出</span>
              </div>
              <div className="tool_word_group createConfigurationCopy" onClick={handleCopyYamlCreateConfiguration}>
                <CopyOutlined className="common_antd_icon primary_color" />
                <span>复制</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '0 32px' }}>
          <CodeMirrorEditor changeYaml={handleFn} ref={childCodeMirrorRef} yamlData={configYamlExample} />
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'flex-end',
              padding: '20px 0',
            }}
          >
            <Button
              className='cancel_btn CreateConfiguration'
              onClick={() => history.push(`/${containerRouterPrefix}/configuration/configMap`)}
            >
              取消
            </Button>
            <Button className='cancel_btn CreateConfiguration' onClick={handleResetCodeCreateConfiguration}>
              重置
            </Button>
            <Button
              loading={createConfigurationLoading}
              onClick={handleCreate}
              className='primary_btn CreateConfiguration'
            >
              确定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
