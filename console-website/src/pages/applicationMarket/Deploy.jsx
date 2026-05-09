/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Form, Input, Select, Tabs, Button, message, Breadcrumb } from 'antd';
import DetailsHeader from '@/pages/applicationMarket/component/DetailsHeader';
import '@/styles/applicationMarket/index.less';
import { useEffect, useState, createRef, useStore } from 'openinula';
import { containerRouterPrefix } from '@/constant.js';
import { withBasePath } from '@/utils/basePath';
import { Link, useHistory, useParams } from 'inula-router';
import {
  installReleaseToNameSpace,
  getAllVersionInfo,
  getRepoChartVersionFile,
  getAppointVersionChart,
} from '@/api/applicationMarketApi';
import { ResponseCode } from '@/common/constants';
import { listNamespaces } from '@/api/containerApi';
import DiffComponent from '@/components/YamlDiff';
import { exportYamlOutPut } from '@/tools/utils';
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import {
  ExportOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import '@/styles/applicationMarket/dark.less';
import BreadCrumbCom from '@/components/BreadCrumbCom';

export default function Deploy() {
  const history = useHistory();
  const { chart, repo, versionSelect, defaultNameSpace } = useParams();
  const [form] = Form.useForm();
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nameSpaceList, setNameSpaceList] = useState([]);
  const [versionList, setVersionList] = useState([]);
  const [detailInfo, setDetailInfo] = useState('');
  const [defaultParams, setDefaultParams] = useState('');
  const [version, setVersion] = useState('');
  const [nameSpace, setNameSpace] = useState('');
  const [configurationValue, setConfiguration] = useState('');
  const [applicationName, setApplicationName] = useState('');
  const [versionLoaded, setVersionLoaded] = useState(false);
  const [basicInfo, setBasicInfo] = useState(null);
  const [beforeYamlData, setBeforeYamlData] = useState('');
  const [paramsYamlData, setParamsYamlData] = useState('');
  const childCodeMirrorRef = createRef(null);
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  // 初始表单数值
  const initialValues = {
    version: versionSelect,
    nameSpace: defaultNameSpace,
  };
  const handleChangeYaml = (yaml) => {
    setParamsYamlData(yaml);
  };

  const exportYaml = () => {
    exportYamlOutPut('Values', paramsYamlData);
    messageApi.success('导出成功');
  };
  const handleCopyYaml = () => {
    copy(paramsYamlData);
    messageApi.success('复制成功！');
  };

  const items = [
    {
      key: '1',
      label: 'Values.yaml',
      children: (
        <div>
          <div className='yaml_card'>
            <div className='yaml_flex_box'>
              <h3 style={{ color: themeStore.$s.theme === 'light' ? 'black' : '#fff' }}>Value(读写)</h3>
              <div className='yaml_tools'>
                <div className='tool_word_group deployExport' onClick={exportYaml}>
                  <ExportOutlined className='common_antd_icon primary_color' />
                  <span>导出</span>
                </div>
                <div className='tool_word_group deployCopy' onClick={handleCopyYaml}>
                  <CopyOutlined className='common_antd_icon primary_color' />
                  <span>复制</span>
                </div>
              </div>
            </div>
          </div>
          <CodeMirrorEditor
            yamlData={paramsYamlData}
            changeYaml={handleChangeYaml}
            ref={childCodeMirrorRef}
          />
        </div>
      ),
    },
    {
      key: '2',
      label: '变化',
      children: (
        <DiffComponent
          diffDataList={[
            {
              oldData: beforeYamlData,
              newData: paramsYamlData,
              isYamls: true,
              oldHeader: '旧配置文件',
              newHeader: '新配置文件',
            },
          ]}
          outputFormat={'side-by-side'}
        />
      ),
    },
  ];

  const getNameSpacesListInfo = async () => {
    const res = await listNamespaces();
    const arr = res.data.items.map((el) => ({
      label: el.metadata.name,
      value: el.metadata.name,
    }));
    setNameSpace(arr[0].value);
    setNameSpaceList(arr);
  };

  const getAllVersionInfoList = async () => {
    const res = await getAllVersionInfo(repo, chart);
    const versionArr = res.data.data.map((el) => ({
      label: el.metadata.version,
      value: el.metadata.version,
    }));
    if (versionArr.length !== 0) {
      setVersionLoaded(true);
    }
    setVersionList(versionArr);
  };

  const isGoToOperationComponent = (arr) => {
    return arr.includes('openfuyao-extension');
  };

  const handleDeploy = async (e) => {
    await form.validateFields();
    setIsLoading(true);
    try {
      await installReleaseToNameSpace(nameSpace, applicationName, {
        chartName: chart,
        repoName: repo,
        version,
        values: paramsYamlData,
      });
      if (basicInfo?.keywords && isGoToOperationComponent(basicInfo?.keywords)) {
        await messageApi.success('部署成功，即将跳转扩展组件管理页面');
        setTimeout(() => {
          setIsLoading(false);
          window.location = withBasePath(`/${containerRouterPrefix}/extendManage`);
        }, 1000);
      } else {
        await messageApi.success('部署成功，即将跳转应用管理页面');
        setTimeout(() => {
          setIsLoading(false);
          history.push(`/${containerRouterPrefix}/applicationManageHelm`);
        }, 1000);
      }
    } catch (error) {
      setIsLoading(false);
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(error.response?.data?.msg);
      }
    }
  };

  const getDetailInfo = async (targetVersion) => {
    const res = await getRepoChartVersionFile(
      repo,
      chart,
      targetVersion || versionSelect,
      'detail'
    );
    const replaceYamlData = res.data.data;
    replaceYamlData.values = (replaceYamlData.values || '').replace(/\r/g, '');
    setConfiguration(replaceYamlData.values);
    setParamsYamlData(replaceYamlData.values);
    setBeforeYamlData(replaceYamlData.values);
    setDefaultParams(replaceYamlData.values);
    setTimeout(() => {
      childCodeMirrorRef?.current?.resetCodeEditor(replaceYamlData.values);
    }, 0);
    setLoaded(true);
  };

  const handleSelectVersion = (e) => {
    setVersion(e);
  };

  const handleSelectNameSpace = (e) => {
    setNameSpace(e);
  };

  const handleInputName = (e) => {
    setApplicationName(e.target.value);
  };

  const getAppointVersionChartInfo = async () => {
    const res = await getAppointVersionChart(repo, chart, version);
    setBasicInfo(res.data.data[0].metadata);
  };

  const onFinish = () => { };
  useEffect(() => {
    setVersion(versionSelect);
    getAllVersionInfoList();
    getNameSpacesListInfo();
  }, []);

  useEffect(() => {
    if (!version) {
      return;
    }
    setLoaded(false);
    getDetailInfo(version);
  }, [version]);

  useEffect(() => {
    if (version) {
      getAppointVersionChartInfo();
    }
  }, [version]);

  return (
    <div style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#f7f7f7' : '#171a1f' }} className={themeStore.$s.theme === 'light' ? '' : 'dark_box'}>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className='application_breadcrumb'>
        <BreadCrumbCom
          items={[
            {
              title: '应用市场',
              path: `/${containerRouterPrefix}/appMarket`,
            },
            {
              title: '应用列表',
              path: `/marketCategory`,
            },

            {
              title: '应用详情',
              path: `/ApplicationDetails/${chart}/${repo}/${versionSelect}`,
            },
            {
              title: '部署',
            },
          ]}
        />
      </div>
      <div>
        <div className='detail_container' style={{ marginBottom: '20px' }}>
          <DetailsHeader
            chart={chart}
            version={version}
            icon={basicInfo?.icon}
            content={basicInfo?.description}
          ></DetailsHeader>
        </div>
        <Form
          layout='vertical'
          form={form}
          initialValues={initialValues}
          name='form_in_modal'
          onFinish={onFinish}
          style={{ paddingBottom: '100px' }}
        >
          <div
            className='detail_container installation_information'
            style={{ marginBottom: '20px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}
          >
            <div className='installation_information_title'>安装信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
              <Form.Item label='应用名称' name='applicationName'
                rules={[
                  {
                    required: true,
                    message: '请输入应用名称',
                  },
                  {
                    pattern: /^[a-z0-9](?:[a-z0-9.-]{0,50}[a-z0-9])?$/,
                    message: '长度小于53，仅包含小写字母、数字、"-"和"."，且仅能以字母或数字开头与结尾',
                  },
                ]}
              >
                <Input style={{ width: '600px' }} placeholder='请输入应用名称' onChange={handleInputName} />
              </Form.Item>
            </div>
            <Form.Item label='版本信息' name='version'
              rules={[
                {
                  required: true,
                  message: '请输入版本信息',
                },
              ]}
              style={{ display: 'flex', flexDirection: 'column', marginBottom: '0px' }}
            >
              <Select
                options={versionList}
                onChange={handleSelectVersion}
                style={{ width: '600px', marginBottom: '32px' }}
              ></Select>
            </Form.Item>
            <Form.Item label='命名空间' name='nameSpace'
              rules={[
                {
                  required: true,
                  message: '请选择命名空间',
                },
              ]}
              style={{ display: 'flex', flexDirection: 'column', marginBottom: '0px' }}
            >
              <Select
                options={nameSpaceList}
                onChange={handleSelectNameSpace}
                style={{ width: '600px' }}
              ></Select>
            </Form.Item>
          </div>
          <div>
            <div className='detail_container' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff', padding: '32px' }}>
              <div className='installation_information_title' style={{ color: themeStore.$s.theme === 'light' ? 'black' : '#fff' }}>参数配置</div>
              {loaded && <Tabs items={items} tabBarStyle={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff', color: '#000' }} />}
            </div>
          </div>
          <div className='deploy_footer'>
            <div
              className='detail_container'
              style={{ display: 'flex', gap: '16px' }}
            >
              <Link
                to={`/${containerRouterPrefix}/appMarket/marketCategory/ApplicationDetails/${chart}/${repo}/${versionSelect}`}
              >
                <Button className='cancel_btn'>取消</Button>
              </Link>
              <Button
                className='primary_btn'
                loading={isLoading}
                htmlType='submit'
                onClick={handleDeploy}
                disabled={!loaded}
              >
                {isLoading ? '部署中' : '确认'}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
