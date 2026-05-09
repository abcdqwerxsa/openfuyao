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
import { useState, createRef, Fragment, useEffect, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { message, Button } from 'antd';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { updateResourceExampleYamlData } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { yamlTojson, exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { disabledModifyMonitorServiceCr } from '@/common/constants';

export default function Yaml({ serviceMonitorYamlProps, prefixObjProps, readOnly, handleEditFn, refreshFn }) {
  const [serviceYaml, setServiceYaml] = useState(serviceMonitorYamlProps);
  const [messageApi, contextHolder] = message.useMessage();
  const [hidden, setHidden] = useState(false);
  const [fileName, setFileName] = useState('');
  const childCodeMirrorRef = createRef(null);
  const themeStore = useStore('theme');

  const handleCopyYaml = () => {
    copy(serviceYaml);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (yaml) => {
    setServiceYaml(yaml);
  };

  const handleSaveYaml = async () => {
    let yamlJson = '';
    let errorCount = 0;
    let passNamespace = '';
    let passName = '';
    try {
      yamlJson = yamlTojson(serviceYaml);
      passNamespace = yamlTojson(serviceMonitorYamlProps).metadata.namespace; // 默认取之前的命名空间
      passName = yamlTojson(serviceMonitorYamlProps).metadata.name;
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (passNamespace) {
        try {
          const res = await updateResourceExampleYamlData({ ...prefixObjProps, namespace: passNamespace }, passName, yamlJson);
          if (res.status === ResponseCode.OK) {
            messageApi.success('修改成功');
            setTimeout(() => {
              refreshFn();
              handleEditFn(true);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`修改失败！${error.response.data.message}`);
          }
          // 重置yaml
          setTimeout(() => {
            refreshFn();
          }, 1000);
        }
      }
    }
  };

  const exportYaml = () => {
    exportYamlOutPut(`${fileName}`, serviceYaml);
    messageApi.success('导出成功');
  };

  const handleResetCode = () => {
    setServiceYaml(serviceMonitorYamlProps);
    childCodeMirrorRef.current.resetCodeEditor(serviceMonitorYamlProps);
  };

  const handleCodeCancel = () => {
    handleEditFn(true);
    setServiceYaml(serviceMonitorYamlProps);
  };

  const handleEditJudge = () => {
    const detailData = yamlTojson(serviceMonitorYamlProps);
    if (!disabledModifyMonitorServiceCr.includes(detailData.metadata.name)) {
      handleEditFn(false);
    }
  };

  useEffect(() => {
    const detailData = yamlTojson(serviceMonitorYamlProps);
    setFileName(detailData.metadata.name);
    if (disabledModifyMonitorServiceCr.includes(detailData.metadata.name)) {
      setHidden(true);
      handleEditFn(true);
    }
  }, [serviceMonitorYamlProps]);

  return <div className="tab_container container_margin_box normal_container_height">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="yaml_card">
      <div className="yaml_flex_box">
        {hidden ?
          <h3>YAML</h3> :
          <h3>{readOnly ? <Fragment>YAML <EditOutlined style={{ color: '#3f66f5' }} onClick={handleEditJudge} /></Fragment> : 'YAML'}</h3>
        }
        <div className="yaml_tools">
          <div className="tool_word_group yamlExport" onClick={exportYaml}>
            <ExportOutlined className="common_antd_icon primary_color" />
            <span>导出</span>
          </div>
          <div className="tool_word_group yamlCopy" onClick={handleCopyYaml}>
            <CopyOutlined className="common_antd_icon primary_color" />
            <span>复制</span>
          </div>
        </div>
      </div>
    </div>
    <div className='yaml_space_box'>
      <CodeMirrorEditor className={readOnly ? 'no_btn' : ''} yamlData={serviceYaml} changeYaml={handleChangeYaml} isEdit={!readOnly} ref={childCodeMirrorRef} />
      {!readOnly && <div className="btn_footer">
        <Button className="cancel_btn" onClick={handleCodeCancel}>取消</Button>
        <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
        <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
      </div>}
    </div>
  </div>;
}