/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import CodeMirrorEditor from '@/components/CodeMirrorEditor';
import '@/styles/applicationMarket/index.less';
import { jsonToYaml, yamlTojson } from '@/tools/utils';
import { Button, message } from 'antd';
import { useState, createRef, useStore, useEffect } from 'openinula';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import copy from 'copy-to-clipboard';
import {
  createPod,
  createDeployment,
  createDaemonSet,
  createCronJob,
  createStatefulSet,
  addClusterRoleYamlData,
  addServiceAccountsYamlData,
  addRoleBindingsYamlData,
  createJob,
  createConfigMaps,
  createSecret,
  createResourceQuota,
  createLimitRange,
  addCustomResourceDefinitionYamlData,
  addServiceYamlData,
  addIngressYamlData,
  addNamespaceYamlData,
  addResourceExampleYamlData,
  getCustomResourceDefinitionList,
  addPvYamlData,
  addScYamlData,
  addPvcYamlData,
  addClusterRoleBindingYamlData,
  addRoleYamlData,
  createSpecifiedPriorityClasses
} from '@/api/containerApi';
import { exportYamlOutPut, forbiddenMsg } from '@/tools/utils';
import { containerRouterPrefix } from '@/constant.js';
import { withBasePath } from '@/utils/basePath';
import {
  ExportOutlined,
  CopyOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import '@/styles/pages/nodeManage.less';
import { useHistory } from 'inula-router';
import { ResponseCode } from '@/common/constants';

let count = true;

export default function OneClickDeploy() {
  const history = useHistory();
  const [info, setInfo] = useState('');
  const [deployLoading, setDeployLoading] = useState(false);
  const childCodeMirrorRef = createRef(null);
  const [deployYaml, setDeployYaml] = useState('');
  const themeStore = useStore('theme');
  const [windowWidth, setWidowWidth] = useState(window.screen.width);
  const [messageApi, contextHolder] = message.useMessage();
  const exportYaml = () => {
    exportYamlOutPut('Values', deployYaml);
    messageApi.success('导出成功');
  };

  const handleCopyYaml = () => {
    copy(deployYaml);
    messageApi.success('复制成功！');
  };
  const handleChangeDeployYaml = (e) => {
    setDeployYaml(e);
    if (e) {
      if (e.split('---').map((str) => str.trim())[0] === '') {
        const yaml = e.split('---').map((str) => str.trim()).slice(1);
        setInfo(yaml.map((el) => yamlTojson(el)));
      } else {
        const yaml = e.split('---').map((str) => str.trim());
        setInfo(yaml.map((el) => yamlTojson(el)));
      }
    }
  };

  const getCustomResourceDefinitionDetailDescriptionInfo = async (namespace, arr) => {
    let _data = arr.apiVersion.split('/');
    const [[group, ...resets], ...rest] = _data;
    const [[first, version, ...reset], restdata] = _data;
    const res = await getCustomResourceDefinitionList({
      customResourceDefinitionPage: 1,
      customResourceDefinitionPageSize: 10000,
      customResourceDefinitionContinue: '',
    });
    const crd = res.data.items.find(item => item.spec.group === group && item.spec.names.kind === arr.kind);
    if (crd) {
      const [plural, ...resetData] = crd.spec.names.plural;
      addResourceExampleYamlData({ group, version, plural, namespace }, arr);
    } else {
      throw new error('crd');
    };
  };

  const createResource = {
    Namespace: async (userData) => {
      count = true;
      const res = await addNamespaceYamlData(userData);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`Namespace创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    ServiceAccount: async (userData) => {
      count = true;
      const res = await addServiceAccountsYamlData(userData.metadata.namespace || 'default', userData);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`ServiceAccount创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Service: async (arr) => {
      count = true;
      const res = await addServiceYamlData(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`Service创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    ClusterRole: async (arr) => {
      count = true;
      const res = await addClusterRoleYamlData(arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`ClusterRole创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    ClusterRoleBinding: async (arr) => {
      count = true;
      const res = await addClusterRoleBindingYamlData(arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`ClusterRoleBinding创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Role: async (arr) => {
      count = true;
      const roleRes = await addRoleYamlData(arr.metadata.namespace || 'default', arr);
      try {
        if (roleRes.status === ResponseCode.Created) {
          messageApi.success(`Role创建成功!`);
        }
      } catch (error) {
        if (error.response && error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    RoleBinding: async (arr) => {
      count = true;
      const res = await addRoleBindingsYamlData(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`RoleBinding创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Pod: async (arr) => {
      count = true;
      const res = await createPod(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`Pod创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Deployment: async (arr) => {
      count = true;
      const res = await createDeployment(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`Deployment创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Job: async (arr) => {
      count = true;
      const res = await createJob(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`Job创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    CronJob: async (arr) => {
      count = true;
      const res = await createCronJob(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`CronJob创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    ConfigMap: async (arr) => {
      count = true;
      const res = await createConfigMaps(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`ConfigMap创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Secret: async (arr) => {
      count = true;
      const res = await createSecret(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`Secret创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    ResourceQuota: async (arr) => {
      count = true;
      const res = await createResourceQuota(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`ResourceQuota创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    LimitRange: async (arr) => {
      count = true;
      const res = await createLimitRange(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`LimitRange创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    CustomResourceDefinition: async (arr) => {
      count = true;
      const res = await addCustomResourceDefinitionYamlData(arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`CustomResourceDefinition创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    StatefulSet: async (arr) => {
      count = true;
      const res = await createStatefulSet(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`StatefulSet创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Ingress: async (arr) => {
      count = true;
      const res = await addIngressYamlData(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`Ingress创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    DaemonSet: async (arr) => {
      count = true;
      const res = await createDaemonSet(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`DaemonSet创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    PersistentVolume: async (arr) => {
      count = true;
      const res = await addPvYamlData(arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`PersistentVolume创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    PersistentVolumeClaim: async (arr) => {
      count = true;
      const res = await addPvcYamlData(arr.metadata.namespace || 'default', arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`PersistentVolumeClaim创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    StorageClass: async (arr) => {
      count = true;
      const res = await addScYamlData(arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`StorageClass创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    PriorityClass: async (arr) => {
      count = true;
      const res = await createSpecifiedPriorityClasses(arr);
      try {
        if (res.status === ResponseCode.Created) {
          messageApi.success(`PriorityClass创建成功!`);
        }
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          forbiddenMsg(messageApi, error);
        }
      }
    },
    Example: (arr) => getCustomResourceDefinitionDetailDescriptionInfo(arr.metadata.namespace || 'default', arr),
    default: (arr) => { throw new Error(`Unsupported kind: ${arr.kind}`) },
  };

  const createResources = async (infoArr) => {
    for (const config of infoArr) {
      await (createResource[config.kind] || createResource.default)(config);
    }
  };

  const handleDeploy = async () => {
    setDeployLoading(true);
    try {
      await createResources(info);
    } catch (error) {
      messageApi.error(`创建失败！${error.response.data.message}`);
      count = false;
    } finally {
      setDeployLoading(false);
      if (count) {
        setTimeout(() => {
          window.location.href = (withBasePath(`/${containerRouterPrefix}/workload/pod`));
        }, 3000);
      }
    }
  };

  const handleReset = () => {
    childCodeMirrorRef.current.resetCodeEditor();
  };

  const handleCancel = () => {
    history.goBack();
  };

  useEffect(() => {
    window.addEventListener('resize', () => {
      setWidowWidth(window.screen.width);
    });
    return () => removeEventListener('resize', () => { setWidowWidth(window.screen.width) });
  }, []);
  return (
    <div className='one_deploy_container'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      {windowWidth <= 1280 ? <BreadCrumbCom items={[{ title: 'YAML一键式部署应用', disabled: true }]} /> : <div className='one_deploy_title'>YAML一键式部署应用</div>}
      <div className='one_deploy_box normal_container_height'>
        <div className='yaml_card' style={{ paddingBottom: '32px 0' }}>
          <div className='yaml_flex_box'>
            <h3>YAML</h3>
            <div className='yaml_tools'>
              <div className='tool_word_group oneClickDeployExport' onClick={exportYaml}>
                <ExportOutlined className='common_antd_icon primary_color' />
                <span>导出</span>
              </div>
              <div className='tool_word_group oneClickDeployCopy' onClick={handleCopyYaml}>
                <CopyOutlined className='common_antd_icon primary_color' />
                <span>复制</span>
              </div>
            </div>
          </div>
        </div>
        <CodeMirrorEditor
          changeYaml={handleChangeDeployYaml}
          ref={childCodeMirrorRef}
        />
        <div className='btn_container' style={{ padding: '32px 0' }}>
          <Button className='cancel_btn' onClick={handleCancel}>
            取消
          </Button>
          <Button className='cancel_btn' onClick={handleReset}>
            重置
          </Button>
          <Button className='primary_btn' loading={deployLoading} onClick={handleDeploy}>
            部署
          </Button>
        </div>
      </div>
    </div>
  );
}
