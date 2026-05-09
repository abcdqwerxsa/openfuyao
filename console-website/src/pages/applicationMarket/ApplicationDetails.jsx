/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import '@/styles/applicationMarket/index.less';
import DetailsHeader from './component/DetailsHeader';
import DetailsTabComponent from '@/pages/applicationMarket/component/DetailsTabComponent';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { useState, useEffect, useStore } from 'openinula';
import { containerRouterPrefix } from '@/constant.js';
import {
  getRepoChartVersionFile,
  getAllVersionInfo,
  getAppointVersionChart,
} from '@/api/applicationMarketApi';
import { getHelmsData } from '@/api/containerApi';
import { useParams, useHistory } from 'inula-router';
import Dayjs from 'dayjs';
import extensionManagement from '@/assets/images/extensionManagement.png';
import { message } from 'antd';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import ToastMsg from '@/components/ToastMsg';

export default function ApplicationDetails() {
  const { chart, repo, versionRepo } = useParams();
  const history = useHistory();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailInfo, setDetailInfo] = useState(null);
  const [defaultParams, setDefaultParams] = useState(null);
  const [versionList, setVersionList] = useState([]);
  const [version, setVersion] = useState(versionRepo);
  const [basicInfo, setBasicInfo] = useState(null);
  const [isDeploy, setIsDeploy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [namespace, setNameSpace] = useState(null);
  const [extensionName, setExtensionName] = useState(null);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [riskChecked, setRiskChecked] = useState(false);
  const [deployNamespace, setDeployNamespace] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');

  const isSelectExtensionComponent = basicInfo?.metadata?.keywords
    ? basicInfo?.metadata?.keywords?.includes('openfuyao-extension')
    : false;

  const repoType = (type) => {
    switch (type) {
      case 'openFuyao':
        return '官方仓库';
      case 'local':
        return '本地仓库';
      default:
        return '用户添加';
    }
  };
  const contentArray = [
    {
      title: '仓库名称',
      value: basicInfo?.repo || '--',
    },
    {
      title: '应用版本',
      value: basicInfo?.metadata.appVersion || '--',
    },
    {
      title: '添加时间',
      value:
        Dayjs(basicInfo?.metadata.created).format('YYYY-MM-DD HH:mm:ss') ||
        '--',
    },
    {
      title: '供应商类型',
      value: repoType(basicInfo?.repo),
    },
  ];

  function handleDeleteOpen() {
    setDeleteOpen((open) => !open);
  }

  function handleCancelFn() {
    setDeleteOpen((open) => !open);
  }

  const goToDeployPage = (targetNamespace) => {
    history.push(
      `/${containerRouterPrefix}/appMarket/marketCategory/Deploy/${repo}/${chart}/${version || versionList[0]?.value}/${targetNamespace}`,
    );
  };

  const handleDeployClick = (targetNamespace) => {
    if (basicInfo?.repo === 'openFuyao') {
      goToDeployPage(targetNamespace);
      return;
    }
    setDeployNamespace(targetNamespace);
    setRiskChecked(false);
    setRiskModalOpen(true);
  };

  const handleRiskCancel = () => {
    setRiskModalOpen(false);
    setRiskChecked(false);
  };

  const handleRiskConfirm = () => {
    goToDeployPage(deployNamespace);
    setRiskModalOpen(false);
    setRiskChecked(false);
  };

  const getDetailInfo = async (versionArr) => {
    try {
      setLoading(true);
      const res = await getRepoChartVersionFile(
        repo,
        chart,
        version || versionArr[0]?.value,
        'detail',
      );
      setDefaultParams(res.data.data.values || '');
      setDetailInfo(res.data.data.readme || '');
    } catch (e) {
      messageApi.error(e.response?.data?.msg);
      setDefaultParams('');
      setDetailInfo('');
    } finally {
      setLoading(false);
    }
  };

  const getAllVersionInfoList = async () => {
    const res = await getAllVersionInfo(repo, chart);
    const versionArr = res.data.data.map((el) => ({
      label: `版本： ${el.metadata.version}`,
      value: el.metadata.version,
    }));
    getDetailInfo(versionArr);
    if (!versionRepo) {
      setVersion(versionArr[0]?.value);
    }
    setVersionList(versionArr);
  };

  const getAppointVersionChartInfo = async (versionInfo) => {
    const res = await getAppointVersionChart(repo, chart, versionInfo);
    setBasicInfo(res.data.data[0]);
  };

  const handleSelectFn = async (value) => {
    setVersion(value);
    try {
      setLoading(true);
      const res = await getRepoChartVersionFile(
        repo,
        chart,
        value,
        'detail',
      );
      setDetailInfo(res.data.data.readme || '');
      setDefaultParams(res.data.data.values || '');
    } catch (e) {
      messageApi.error(e.response?.data?.msg);
      setDetailInfo('');
      setDefaultParams('');
    } finally {
      setLoading(false);
    }
  };

  const getApplicationManageInfo = async () => {
    let remainingObj = {
      extension: true,
      sortBy: '',
      ascending: '',
      status: '',
    };
    const res = await getHelmsData(true, 10000, '', '', remainingObj);
    const found = res.data.data.items.find(el => {
      if (el.chart.metadata.name === chart && el.labels['openfuyao.io.repo'] === repo) {
        setNameSpace(el.namespace);
        setExtensionName(el.name);
        setIsDeploy(true);
        return true; // Stop further iteration
      }
      return false;
    });

    if (!found) {
      setIsDeploy(false);
    }
  };

  useEffect(() => {
    getAppointVersionChartInfo(version);
  }, [version]);

  useEffect(() => {
    getAllVersionInfoList();
    getApplicationManageInfo();
  }, []);

  useEffect(() => {
    // 监听主题变化，并设置 body 的背景色
    const updateBodyBackground = () => {
      document.body.style.backgroundColor = themeStore.$s.theme === 'light' ? '#fff' : '#17141f';
    };

    // 初次加载时设置一次
    updateBodyBackground();

    // 订阅主题变化
    const unsubscribe = themeStore.$watch('$s.theme', updateBodyBackground);

    // 组件卸载时取消订阅
    return () => {
      unsubscribe();
    };
  }, [themeStore.$s.theme]);

  return (
    <div style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#f7f7f7ff' : 'black' }} className={themeStore.$s.theme === 'light' ? '' : 'dark_box'}>
      <ToastMsg contextHolder={contextHolder} />
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      </div>
      <div className='application_breadcrumb detail_breadcrumb_sub'>
        <BreadCrumbCom
          items={[
            {
              title: '应用市场',
              key: 'appMarket',
              path: `/${containerRouterPrefix}/appMarket`,
            },
            {
              title: '应用列表',
              key: 'list',
              path: `/marketCategory`,
            },
            {
              title: '详情',
            },
          ]}
        />
      </div>
      <div className='detail_container'>
        {version && (
          <DetailsHeader
            basicInfo={basicInfo?.metadata}
            icon={basicInfo?.metadata.icon}
            repo={repo}
            chart={chart}
            version={version}
            namespace={namespace}
            extensionName={extensionName}
            versionList={versionList}
            onDeleteOpen={handleDeleteOpen}
            title={repo}
            content={basicInfo?.metadata?.description}
            isOperator={isDeploy ? '1' : '2'}
            operatorTitle={isDeploy ? '管理' : '部署'}
            operatorDisabled={loading}
            onSelect={handleSelectFn}
            isExtension={isSelectExtensionComponent}
            onDeployClick={handleDeployClick}
          >
            {isSelectExtensionComponent && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img src={extensionManagement} />
                </div>
                <div style={{ color: '#89939b' }}>扩展组件</div>
              </div>
            )}
          </DetailsHeader>
        )}
        <div className='application_details_content' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
          {contentArray.map((item) => (
            <div style={{ display: 'flex' }}>
              <div style={{ display: 'flex', marginBottom: '16px' }}>
                <div className='tips_color' style={{ minWidth: '100px' }}>{`${item.title}：`}</div>
                <div>
                  <div className='clamp_1' style={{ width: '200px', color: themeStore.$s.theme === 'light' ? 'black' : '#fff' }}>{item.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <DetailsTabComponent
          detailInfo={detailInfo}
          defaultParams={defaultParams}
          chart={chart}
          loading={loading}
        />
      </div>
      <DeleteInfoModal
        title='第三方应用提示'
        open={riskModalOpen}
        cancelFn={handleRiskCancel}
        content={[
          '当前应用或扩展组件非官方提供，可能存在兼容性或安全风险。',
          '请确认您已了解相关风险后继续部署。',
        ]}
        confirmFn={handleRiskConfirm}
        confirmText='继续部署'
        showCheck
        isCheck={riskChecked}
        checkFn={(e) => setRiskChecked(e.target.checked)}
        checkboxText='我已了解并确认上述风险'
      />
    </div>
  );
}
