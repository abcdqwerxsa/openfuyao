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
import { useState, createRef, useContext, useEffect, useStore } from 'openinula';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { ResponseCode } from '@/common/constants';
import { message, Button } from 'antd';
import { addResourceExampleYamlData } from '@/api/containerApi';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import { useHistory, useLocation, useParams } from 'inula-router';
import { yamlTojson, solveEncodePath, exportYamlOutPut, jsonToYaml, solveDecodePath, forbiddenMsg } from '@/tools/utils';
import { NamespaceContext } from '@/namespaceContext';
import { crYamlExample, podGroupExample, queueSchedulingExampe, jobBatchExample } from '@/common/exampleYaml';

export default function CRCreate() {
  const { customResourceName } = useParams();
  const { state: prefixObj } = useLocation();
  const namespace = useContext(NamespaceContext);
  const history = useHistory();
  const [resourceExampleYaml, setResourceExampleYaml] = useState();
  const [messageApi, contextHolder] = message.useMessage();
  const [loaded, setLoaded] = useState(false);
  const themeStore = useStore('theme');
  const childCodeMirrorRef = createRef(null);

  const handleCopyYaml = () => {
    copy(resourceExampleYaml);
    messageApi.success('复制成功！');
  };

  const handleChangeYaml = (str) => {
    setResourceExampleYaml(str);
  };

  const handleSaveYaml = async () => {
    let errorCount = 0;
    let yamlJson = '';
    let passNamespace = namespace;
    try {
      yamlJson = yamlTojson(resourceExampleYaml);
      passNamespace = yamlJson.metadata?.namespace;
      prefixObj.namespace = passNamespace;
    } catch (e) {
      messageApi.error(`YAML格式不规范!${e.message}`);
      errorCount++;
    }
    if (!errorCount) {
      try {
        const res = await addResourceExampleYamlData(prefixObj, yamlJson);
        if (res.status === ResponseCode.Created) {
          messageApi.success('创建成功');
          setTimeout(() => {
            history.push(`/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(customResourceName)}/example`);
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
    setResourceExampleYaml(crYamlExample);
  };

  const exportYaml = () => {
    exportYamlOutPut('Cr', resourceExampleYaml);
    messageApi.success('导出成功');
  };

  useEffect(() => {
    // 拿取值进行赋值
    setLoaded(false);
    let crJson = yamlTojson(crYamlExample);
    crJson.apiVersion = prefixObj.apiVersion;
    crJson.kind = prefixObj.kind;
    if (prefixObj.scopeNamespace === 'Namespaced') {
      crJson.metadata.namespace = 'default';
    } else {
      delete crJson.metadata.namespace;
    }
    if (solveDecodePath(customResourceName) === 'podgroups.scheduling.volcano.sh') {
      crJson = yamlTojson(podGroupExample);
    }
    if (solveDecodePath(customResourceName) === 'queues.scheduling.volcano.sh') {
      crJson = yamlTojson(queueSchedulingExampe);
    }
    if (solveDecodePath(customResourceName) === 'jobs.batch.volcano.sh') {
      crJson = yamlTojson(jobBatchExample);
    }
    setResourceExampleYaml(jsonToYaml(JSON.stringify(crJson)));
    setLoaded(true);
  }, [prefixObj]);

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '自定义资源', path: `/${containerRouterPrefix}/customResourceDefinition` },
      { title: '详情', path: `/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(customResourceName)}/example` },
      { title: '创建实例', path: `/createCR` },
    ]} />
    <div className="tab_container container_margin_box normal_container_height">
      <div className="yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML</h3>
          <div className="yaml_tools">
            <div className="tool_word_group crCreateExport" onClick={exportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="tool_word_group crCreateCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      <div className="yaml_space_box">
        {loaded && <CodeMirrorEditor yamlData={resourceExampleYaml} changeYaml={handleChangeYaml} ref={childCodeMirrorRef} />}
        <div className="btn_footer">
          <Button className="cancel_btn" onClick={() => history.go(-1)}>取消</Button>
          <Button className="cancel_btn" onClick={handleResetCode}>重置</Button>
          <Button className="primary_btn" onClick={handleSaveYaml}>确定</Button>
        </div>
      </div>
    </div>
  </div>;
}