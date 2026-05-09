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

import { useCallback, useEffect, useState, createRef, useStore, useMemo } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant.js';
import { getHelmUpgradeYamlData, getHelmDetailDescriptionData, getHelmTemplateDetailVersion, updateHelmLevelYaml } from '@/api/containerApi';
import { Form, Select, Tabs, Button, message } from 'antd';
import { ResponseCode } from '@/common/constants';
import copy from 'copy-to-clipboard';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import DiffComponent from '@/components/YamlDiff';
import { jsonToYaml, exportYamlOutPut } from '@/tools/utils';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import defaultIcon from '@/assets/images/helmIcon.png';
import Dayjs from 'dayjs';
import { filterRepeat } from '@/utils/common';
import ToastMsg from '@/components/ToastMsg';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

/**
 * Application/Extension Upgrade Layout Component
 *
 * @param {'application'|'extension'} type - Type: 'application' or 'extension'
 */
export default function ApplicationUpgradeLayout({ type = 'application' }) {
  const isExtension = type === 'extension';
  const routePrefix = isExtension ? 'extendManage' : 'applicationManageHelm';
  const paramName = isExtension ? 'extend_name' : 'helm_name';
  const paramNamespace = isExtension ? 'extend_namespace' : 'helm_namespace';

  const param = useParams();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const themeStore = useStore('theme');

  // State
  const [levelOptions, setLevelOptions] = useState([{ label: '', value: '' }]);
  const [loading, setLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState(true);
  const [tabKey, setTabKey] = useState('1');
  const childCodeMirrorRef = createRef(null);
  const [yamlData, setYamlData] = useState();
  const [beforeYamlData, setBeforeYamlData] = useState();
  const [upgradeInfoData, setUpgradeInfoData] = useState({});
  const [chartName, setChartName] = useState('');
  const [repoName, setRepoName] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [currentYamlValue, setCurrentYamlValue] = useState('');

  const name = param[paramName];
  const namespace = param[paramNamespace];

  // Text configuration
  const textConfig = {
    breadcrumbTitle: isExtension ? '扩展组件管理' : '应用管理',
    detailTitle: isExtension ? '扩展组件详情' : 'Helm详情',
    upgradeTitle: isExtension ? '扩展组件升级' : 'Helm升级',
  };

  // Handlers
  const handleCopy = () => {
    copy(yamlData);
    messageApi.success('复制成功！');
  };

  const handleExportYaml = () => {
    exportYamlOutPut('Values', beforeYamlData);
    messageApi.success('导出成功');
  };

  const handleChangeYaml = (yaml) => setYamlData(yaml);

  const handleSetTabKey = (key) => setTabKey(key);

  const handleResetCode = () => {
    if (isExtension) {
      setYamlData('');
      getYamlData(repoName, chartName);
    } else {
      setYamlData(beforeYamlData);
      childCodeMirrorRef.current.resetCodeEditor(beforeYamlData);
    }
  };

  const handleYamlOnchange = () => {
    if (currentVersion === form.getFieldValue('version')) {
      setLoading(true);
      setTimeout(() => {
        setBeforeYamlData(currentYamlValue);
        setYamlData(currentYamlValue);
        setLoading(false);
      }, 2000);
    } else {
      getYamlData(repoName, chartName);
    }
  };

  // Get level options
  const getLevelOptions = useCallback(async (repo, chart) => {
    try {
      const res = await getHelmTemplateDetailVersion(repo, chart);
      if (res.status === ResponseCode.OK) {
        let options = [];
        res.data.data.forEach(item => {
          options.push({ value: item.metadata.version, label: item.metadata.version });
        });
        options = filterRepeat(options);
        setLevelOptions([...options]);
      }
    } catch (e) {
      messageApi.error('获取版本信息失败');
    }
  }, []);

  // Get YAML data
  const getYamlData = useCallback(async (repo, chart) => {
    setLoading(true);
    try {
      const resYaml = await getHelmUpgradeYamlData(repo, chart, form.getFieldsValue().version);
      if (resYaml.status === ResponseCode.OK) {
        let replaceData = resYaml.data.data;
        if (!replaceData['values.yaml']) {
          replaceData['values.yaml'] = '';
        }
        replaceData['values.yaml'] = replaceData['values.yaml'].replace(/\r/g, '');
        setBeforeYamlData(replaceData['values.yaml']);
        setYamlData(replaceData['values.yaml']);
        setLoading(false);
      }
    } catch (e) {
      messageApi.error('获取yaml失败');
    }
  }, []);

  // Get detail data
  const getDetail = useCallback(async () => {
    try {
      const res = await getHelmDetailDescriptionData(namespace, name);
      if (res.status === ResponseCode.OK) {
        setUpgradeInfoData(res.data.data);
        form.setFieldsValue({ version: res.data.data.chart.metadata.version });
        setCurrentVersion(res.data.data.chart.metadata.version);
        setCurrentYamlValue(jsonToYaml(JSON.stringify(res.data.data.values)));
        setRepoName(res.data.data.labels['openfuyao.io.repo']);
        setChartName(res.data.data.chart.metadata.name);

        if (!res.data.data.labels['openfuyao.io.repo']) {
          messageApi.error('无法更新非平台来源应用', 10);
          return;
        }

        if (res.data.data.chart.metadata.version === form.getFieldValue('version')) {
          setBeforeYamlData(jsonToYaml(JSON.stringify(res.data.data.values)));
          setYamlData(jsonToYaml(JSON.stringify(res.data.data.values)));
          setLoading(false);
        } else {
          getYamlData(res.data.data.labels['openfuyao.io.repo'], res.data.data.chart.metadata.name);
        }
        getLevelOptions(res.data.data.labels['openfuyao.io.repo'], res.data.data.chart.metadata.name);
      }
    } catch (e) {
      messageApi.error('数据获取错误', 10);
    }
  }, [namespace, name]);

  // Update YAML
  const updateYaml = async () => {
    setLoadingButton(false);
    let data = {
      chartName: upgradeInfoData.chart.metadata.name,
      repoName: upgradeInfoData.labels['openfuyao.io.repo'],
      version: form.getFieldsValue().version,
      values: yamlData,
    };
    try {
      const res = await updateHelmLevelYaml(upgradeInfoData.namespace, upgradeInfoData.name, data);
      if (res.status === ResponseCode.Accepted) {
        messageApi.success('升级成功', 10);
        setTimeout(() => {
          history.push(`/${containerRouterPrefix}/${routePrefix}/${namespace}/${name}`);
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('升级失败', 10);
      }
    }
    setLoadingButton(true);
  };

  // Tab items
  const items = [
    {
      label: 'Values.yaml',
      key: '1',
      children: (
        <div>
          {!loading ? (
            <div className={isExtension ? 'extend_level_flex_box' : 'level_flex_box'}>
              <h3 className={`level_title ${isExtension ? '' : 'defaultClass'}`}>YAML（读写）</h3>
              <div className="level_tools">
                <div className="level_tool_word_group" onClick={handleExportYaml}>
                  <ExportOutlined className="common_antd_icon primary_color" />
                  <span>导出</span>
                </div>
                <div className="level_tool_word_group" onClick={handleCopy}>
                  <CopyOutlined className="common_antd_icon primary_color" />
                  <span>复制</span>
                </div>
              </div>
            </div>
          ) : <div></div>}
          <div className={`level_yaml_space_box ${isExtension ? '' : 'defaultClass'}`}>
            {!loading && (
              <CodeMirrorEditor
                yamlData={yamlData}
                changeYaml={handleChangeYaml}
                ref={childCodeMirrorRef}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: '变化',
      children: (
        <div className={isExtension ? 'extend_diff_box' : 'helm_diff_box'}>
          <DiffComponent
            diffDataList={[{
              oldData: beforeYamlData,
              newData: yamlData,
              isYamls: true,
              oldHeader: '旧配置文件',
              newHeader: '新配置文件'
            }]}
            outputFormat={'side-by-side'}
          />
        </div>
      ),
    },
  ];

  useEffect(() => {
    getDetail();
  }, [getDetail]);

  // CSS class names based on type
  const tabTopClass = isExtension ? 'extend-tab-top' : 'helm-tab-top';
  const upgradeTitleClass = isExtension ? 'extend_upgrade_title' : 'helm_upgrade_title';
  const basicBoxClass = isExtension ? 'extend_upgrade_basic_box' : 'upgrade_basic_box';
  const upgradeBoxClass = isExtension ? 'extend_upgrade_box' : 'upgrade_box';
  const levelCardClass = isExtension ? 'extend_level_card' : 'level_card';
  const formClass = isExtension ? 'extend_level_form' : 'level_form';
  const versionSelectClass = isExtension ? 'extend_version_select' : 'version_select';
  
  const baseInfoItems = useMemo(() => [
    { key: '应用名称：', value: upgradeInfoData.name },
    { key: '模板版本：', value: upgradeInfoData.chart?.metadata?.version },
    { key: '命名空间：', value: upgradeInfoData.namespace },
    { key: '创建时间：', value: Dayjs(upgradeInfoData.info?.firstDeployed).format('YYYY-MM-DD HH:mm') },
    { key: '应用模板：', value: upgradeInfoData.chart?.metadata?.name },
    { key: '更新时间：', value: Dayjs(upgradeInfoData.info?.lastDeployed).format('YYYY-MM-DD HH:mm') },
  ], [upgradeInfoData]);

  return (
    <div className={`child_content withBread_content ${isExtension ? 'extend_all' : ''}`}>
      <ToastMsg contextHolder={contextHolder} />
      <div className={tabTopClass}>
        <BreadCrumbCom items={[
          { title: textConfig.breadcrumbTitle, path: `/${containerRouterPrefix}/${routePrefix}` },
          { title: textConfig.detailTitle, path: `/${namespace}/${name}` },
          { title: textConfig.upgradeTitle }
        ]} />
      </div>
      <div className={upgradeTitleClass}>
        <div style={{ display: 'flex' }}>
          <div>
            <img
              src={defaultIcon}
              alt=""
              style={{ height: '30px', width: '30px', marginRight: '8px' }}
              className='title_image'
            />
          </div>
          <div className={`upgrade_descript_group ${isExtension ? '' : 'defaultClass'}`}>
            <div style={{ marginRight: '64px' }}>
              <h3 className={`upgrade_descript_group_name ${isExtension ? '' : 'defaultClass'}`}>
                {upgradeInfoData.name}
              </h3>
            </div>
            <div style={{ marginRight: '64px' }}>
              <p className={`upgrade_descript_group_description ${isExtension ? '' : 'defaultClass'}`}>
                {upgradeInfoData.chart?.metadata?.description}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className={basicBoxClass}>
        <div
          className={`detail_card basic_level_card ${isExtension ? '' : 'defaultClass'}`}
          style={{
            padding: '32px 32px 0px 32px',
            background: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34'
          }}
        >
          <h3 className="box_title_h3">当前版本信息</h3>
          <div className="detail_info_box">
            <DetailBaseInfoList items={baseInfoItems} columns={2} />
          </div>
          <div className={levelCardClass}>
            <h3 className="box_title_h3">升级信息</h3>
            <Form form={form} layout="vertical" className={formClass}>
              <Form.Item
                label="版本信息"
                name="version"
                rules={[{ required: true, message: '请选择一个版本!' }]}
              >
                <Select
                  options={levelOptions}
                  className={versionSelectClass}
                  onChange={handleYamlOnchange}
                />
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>

      <div className={upgradeBoxClass}>
        <div className="level_card">
          <h3 className="box_title_h3">参数配置</h3>
          <Tabs items={items} onChange={handleSetTabKey} activeKey={tabKey} />
        </div>
      </div>
      <div className="level_btn_footer">
        <div className='level_btn_footer_button'>
          <Button className='cancel_btn' style={isExtension ? {} : { marginRight: '16px' }} onClick={() => history.go(-1)}>
            取消
          </Button>
            <Button
              className={loading ? 'disable_btn' : 'cancel_btn'}
              style={{ marginRight: '16px' }}
              disabled={loading}
              onClick={handleResetCode}
            >
              重置
            </Button>
          {loadingButton ? (
            <Button
              className={loading ? 'disable_btn' : 'primary_btn'}
              disabled={loading}
              onClick={updateYaml}
            >
              确定
            </Button>
          ) : (
            <Button className='upgrade_btn' disabled={true}>升级中</Button>
          )}
        </div>
      </div>
    </div>
  );
}