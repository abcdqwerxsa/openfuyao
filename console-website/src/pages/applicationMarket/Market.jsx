/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Banner } from './Banner';
import { ConfigProvider, Input, message, theme } from 'antd';
import '@/styles/applicationMarket/index.less';
import { useState, useEffect, useStore } from 'openinula';
import { getHelmChartList, getRecommendHelmChartList, getExtensionHelmChartList } from '@/api/applicationMarketApi';
import ecoPartnerHover from '@/assets/images/ecoPartnerHover.png';
import ecoPartner from '@/assets/images/ecoPartner.png';
import MarketCategoryItem from '@/pages/applicationMarket/MarketCategoryItem';
import aiml from '@/assets/images/marketplaceIcon/aiml.svg';
import computing from '@/assets/images/marketplaceIcon/computing.svg';
import database from '@/assets/images/marketplaceIcon/database.svg';
import devTool from '@/assets/images/marketplaceIcon/devtool.svg';
import cicd from '@/assets/images/marketplaceIcon/cicd.svg';
import monitoring from '@/assets/images/marketplaceIcon/monitoring.svg';
import logging from '@/assets/images/marketplaceIcon/logging.svg';
import network from '@/assets/images/marketplaceIcon/network.svg';
import observability from '@/assets/images/marketplaceIcon/observability.svg';
import security from '@/assets/images/marketplaceIcon/security.svg';
import storage from '@/assets/images/marketplaceIcon/storage.svg';
import allCategory from '@/assets/images/marketplaceIcon/allCategory.svg';
import turboCertificate from '@/assets/images/turboCertificate.png';
import enginePlug from '@/assets/images/enginePlug.png';
import turboIcon from '@/assets/images/turboIcon.png';
import { useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import turboBGCBack from '@/assets/images/turboBackground.png';
import turboBGCBackDark from '@/assets/images/turboBackgroundDark.png';
import turboBGCBackHover from '@/assets/images/turboBackgroundHover.png';
import { MarketBlock } from './MarketBlock';
import { ResponseCode } from '@/common/constants';

const categoryList = [
  {
    icon: aiml,
    title: '人工智能/机器学习',
    value: 'artificial-intelligence',
  },
  {
    icon: computing,
    title: '计算',
    value: 'computing',
  },
  {
    icon: database,
    title: '数据库',
    value: 'database',
  },
  {
    icon: devTool,
    title: '开发者工具',
    value: 'developer-tool',
  },
  {
    icon: cicd,
    title: 'CI/CD',
    value: 'CI/CD',
  },
  {
    icon: monitoring,
    title: '监控',
    value: 'monitor',
  },
  {
    icon: logging,
    title: '日志',
    value: 'log',
  },
  {
    icon: network,
    title: '网络',
    value: 'network',
  },
  {
    icon: observability,
    title: '可观测性',
    value: 'observability',
  },
  {
    icon: security,
    title: '安全',
    value: 'security',
  },
  {
    icon: storage,
    title: '存储',
    value: 'storage',
  },
  {
    icon: allCategory,
    title: '全部分类',
    value: 'null',
  },
];
const defaultPageSize = 50;
const limitSearch = 53;

// 初始状态下从 localStorage 中获取主题设置
const initialTheme = localStorage.getItem('theme') || 'light'; // 默认为 'light' 主题
export default function Market() {
  const history = useHistory();
  const { Search } = Input;
  const [chart, setChart] = useState('');
  const [sortType, setSortType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [sceneList, setSceneList] = useState([]);
  const [sourceList, setSourceList] = useState([]);
  const [isSelectExtensionComponent, setIsSelectExtensionComponent] = useState(false);
  const [customeInfo, setCustomeInfo] = useState([]);
  const [recommendInfo, setRecommendInfo] = useState([]);
  const [turboInfo, setTurboInfo] = useState([]);
  const [recommendLoaded, setReCommendLoaded] = useState(false); //
  const [turboLoaded, setTurboLoaded] = useState(false);
  const [customeLoaded, setCustomeLoaded] = useState(false);
  const [recommendError, setRecommendError] = useState(false); // 是否错误
  const [turboError, setTurboError] = useState(false);
  const [customeError, setCustomeError] = useState(false);
  const themeStore = useStore('theme');

  const getRecommendHelmChartListInfo = async () => {
    setReCommendLoaded(false);
    try {
      const res = await getRecommendHelmChartList();
      if (res.status === ResponseCode.OK) {
        let items = [];
        if (res.data.data.length && res.data.data[0].Charts) {
          items = res.data.data[0].Charts.slice(0, 4);
        }
        setRecommendInfo(items);
      } else {
        setRecommendInfo([]);
        setRecommendError(true);
      }
    } catch (e) {
      setRecommendInfo([]);
      setRecommendError(true);
    }
    setReCommendLoaded(true);
  };

  const getCustomedHelmChartListInfo = async () => {
    setCustomeLoaded(false);
    try {
      const res = await getExtensionHelmChartList('openfuyao-extension');
      if (res.status === ResponseCode.OK) {
        let items = [];
        if (res.data.data.items.length) {
          items = res.data.data.items.slice(0, 4);
        }
        setCustomeInfo(items);
      } else {
        setCustomeInfo([]);
        setCustomeError(true);
      }
    } catch (e) {
      setCustomeInfo([]);
      setCustomeError(true);
    }
    setCustomeLoaded(true);
  };

  const getTurboHelmChartListInfo = async () => {
    setTurboLoaded(false);
    try {
      const res = await getRecommendHelmChartList('openfuyao-accelerator');
      if (res.status === ResponseCode.OK) {
        let items = [];
        if (res.data.data.length && res.data.data[0].Charts) {
          items = res.data.data[0].Charts.slice(0, 4);
        }
        setTurboInfo(items);
      } else {
        setTurboInfo([]);
        setTurboError(true);
      }
    } catch (e) {
      setTurboInfo([]);
      setTurboError(true);
    }
    setTurboLoaded(true);
  };

  const handleInput = (e) => {
    if (e.target.value.length >= limitSearch) {
      message.error(`搜索名称不能超过${limitSearch}个字符`);
      return;
    };
  };

  const handleSearch = (e) => {
    history.push({
      pathname: `/${containerRouterPrefix}/appMarket/marketCategory/null`,
      state: {
        isQuery: e,
      },
    });
  };
  useEffect(() => {
    getRecommendHelmChartListInfo();
    getCustomedHelmChartListInfo();
    getTurboHelmChartListInfo();
  }, []);
  return (
    <ConfigProvider theme={{ algorithm: themeStore.$s.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      <div style={{ height: 'calc(100vh - 112px)', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#171a1f', marginBottom: 0 }}>
        <Banner />
        <div style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34', padding: '28px 0' }}>
          <div className='market_recommend'><Search placeholder='搜索应用名称' onChange={handleInput} onSearch={handleSearch} maxLength={limitSearch}/></div>
          <MarketBlock
            title='为您推荐'
            loaded={recommendLoaded}
            link={`/${containerRouterPrefix}/appMarket/marketCategory/null`}
            data={recommendInfo}
          >
            <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid #dcdcdcff', borderRadius: '4px', padding: '32px 0' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}> <img src={enginePlug} /></div>
                <div style={{ color: '#89939b', textAlign: 'center' }}>{recommendError ? '获取应用失败，请检查网络连接后再试' : '暂无数据'}</div>
              </div>
            </div>
          </MarketBlock>
        </div>

        <div className='recommend_source_category_container' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#171a1f' }}>
          <div className='recommend_source_category'>
            {
              categoryList.map((el) => (
                <MarketCategoryItem
                  icon={el.icon}
                  categoryTitle={el.title}
                  tipIcon={el.tipIcon}
                  value={el.value}
                />
              ))
            }
          </div>
        </div>

        <div style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34', padding: '28px 0' }}>
          <MarketBlock
            title='加速您的应用'
            loaded={turboLoaded}
            link={`/${containerRouterPrefix}/appMarket/marketCategory/null/false/true`}
            data={turboInfo}
            pic={enginePlug}
          >
            <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid #dcdcdcff', borderRadius: '4px', padding: '32px 0' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}> <img src={enginePlug} /></div>
                <div style={{ color: '#89939b', textAlign: 'center' }}>{turboError ? '获取应用失败，请检查网络连接后再试' : '暂无数据'}</div>
              </div>
            </div>
          </MarketBlock>

          <MarketBlock
            title='平台扩展能力'
            link={`/${containerRouterPrefix}/appMarket/marketCategory/null/true`}
            data={customeInfo}
            loaded={customeLoaded}
          >
            <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid #dcdcdcff', borderRadius: '4px', padding: '32px 0' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}> <img src={enginePlug} /></div>
                <div style={{ color: '#89939b', textAlign: 'center' }}>{customeError ? '获取应用失败，请检查网络连接后再试' : '暂无数据'}</div>
              </div>
            </div>
          </MarketBlock>
        </div>

        <div className='turbo_certificate' style={{ display: 'none' }}>
          <div className='turbo_title'>
            Turbo认证
          </div>
          <div className='turbo_body'>
            <div className='turbo_bgc'>
              <img className='turbo_bgc_back' src={themeStore.$s.theme === 'light' ? turboBGCBack : turboBGCBackDark} alt='' />
              <img className='turbo_bgc_back_hover' src={turboBGCBackHover} alt='' />
              <div className='turbo_bgc_clip'>
                <div className='turbo_bgc_frame'>
                  <div className='turbo_bgc_icon'><img src={turboIcon} alt='turbo' /></div>
                  <div className='turbo_bgc_title'>Turbo是什么?</div>
                  <div className='turbo_bgc_text'>
                    Turbo是openFuyao推出的一项认证，专门用于标识已经过加速的云原生应用。获得turbo认证的应用，经过严格的性能优化和质量保证，能够提供更高效、更稳定的服务体验。
                  </div>
                </div>
              </div>
            </div>
            <div className='turbo_bgc'>
              <img className='turbo_bgc_back' src={themeStore.$s.theme === 'light' ? turboBGCBack : turboBGCBackDark} alt='' />
              <img className='turbo_bgc_back_hover' src={turboBGCBackHover} alt='' />
              <div className='turbo_bgc_clip'>
                <div className='turbo_bgc_frame'>
                  <div className='turbo_bgc_icon'><img src={turboCertificate} alt='turbo' /></div>
                  <div className='turbo_bgc_title'>如何获取Turbo认证？</div>
                  <div className='turbo_bgc_text'>
                    <li>申请：开发者或生态伙伴提交应用认证申请。</li>
                    <li>评估：应用使能SIG组对申请的应用进行性能评估和质量测试</li>
                    <li>认证：通过评估并符合标准的应用将获得Turbo认证标识。</li>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='turbo_trip'>
            Turbo认证之旅敬请期待...
          </div>
        </div>
      </div >
    </ConfigProvider >
  );
};
