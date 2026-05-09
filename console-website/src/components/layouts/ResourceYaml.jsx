/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useState, createRef, useEffect, Fragment, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { message, Button } from 'antd';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { exportYamlOutPut, yamlTojson, forbiddenMsg } from '@/tools/utils';
import { ResponseCode } from '@/common/constants';
import ToastMsg from '../ToastMsg';

export default function ResourceYaml({
  yamlProps,
  readOnly,
  handleEditFn,
  updateFn,
  refreshFn,
  clusterScoped = false,
}) {
  const [workloadYaml, setWorkloadYaml] = useState(yamlProps);
  const [yamlSourceRevision, setYamlSourceRevision] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [fileName, setFileName] = useState('');
  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(workloadYaml);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (yaml) => {
    setWorkloadYaml(yaml);
  };

  const handleSaveYaml = async () => {
    let yamlJson = '';
    let errorCount = 0;
    let passNamespace = '';
    let passName = '';
    try {
      yamlJson = yamlTojson(workloadYaml);
      passNamespace = yamlTojson(yamlProps).metadata.namespace; // 默认取之前的命名空间
      passName = yamlJson.metadata.name;
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      if (clusterScoped) {
        try {
          const res = await updateFn(passName, yamlJson);
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
      } else if (passNamespace) {
        try {
          const res = await updateFn(passNamespace, passName, yamlJson);
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

  const handleResetCode = () => {
    setWorkloadYaml(yamlProps);
    childCodeMirrorRef.current.resetCodeEditor(yamlProps);
  };

  const exportYaml = () => {
    exportYamlOutPut(`${fileName}`, workloadYaml);
    messageApi.success('导出成功');
  };

  const handleCodeCancel = () => {
    handleEditFn(true);
    setWorkloadYaml(yamlProps);
  };

  useEffect(() => {
    setWorkloadYaml(yamlProps);
    setYamlSourceRevision((r) => r + 1);
  }, [yamlProps]);

  useEffect(() => {
    try {
      const detailData = yamlTojson(yamlProps);
      setFileName(detailData.metadata.name);
    } catch {
      setFileName('output');
    }
  }, [yamlProps]);

  return <div className="tab_container container_margin_box normal_container_height">
    <ToastMsg contextHolder={contextHolder} />
    <div className="yaml_card">
      <div className="yaml_flex_box">
        <h3>{readOnly ? <Fragment>YAML <EditOutlined style={{ color: '#3f66f5' }} onClick={() => handleEditFn(false)} /> </Fragment> : 'YAML'}</h3>
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
      <CodeMirrorEditor className={readOnly ? 'no_btn' : ''} yamlData={workloadYaml} changeYaml={handleChangeYaml} isEdit={!readOnly} yamlSourceRevision={yamlSourceRevision} ref={childCodeMirrorRef} />
      {!readOnly && <div className="btn_footer">
        <Button className="cancel_btn" onClick={handleCodeCancel}>取消</Button>
        <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
        <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
      </div>}
    </div>
  </div>;
}