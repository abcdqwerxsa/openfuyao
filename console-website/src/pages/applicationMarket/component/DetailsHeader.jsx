/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import operatorIcon from '@/assets/images/operatorIcon.png';
import { Button, Select, Tooltip } from 'antd';
import { Link, useHistory } from 'inula-router';
import { useEffect, useState, useStore } from 'openinula';
import '@/styles/applicationMarket/index.less';
import { containerRouterPrefix } from '@/constant.js';
import { listNamespaces } from '@/api/containerApi';

export default function DetailsHeader({
  basicInfo,
  namespace,
  extensionName,
  version,
  icon,
  repo,
  chart,
  title,
  content,
  isOperator,
  operatorTitle,
  operatorDisabled,
  onDeleteOpen,
  versionList,
  onSelect = () => { },
  onDeployClick,
  isExtension,
  children,
}) {
  const [versionSelect, setVersionSelect] = useState('');
  const [defaultNameSpace, setDefaultNameSpace] = useState('');
  const themeStore = useStore('theme');
  const handleSelect = (value) => {
    onSelect(value);
    setVersionSelect(value);
  };
  const history = useHistory();

  const convertToRawUrl = (url) => {
    const githubPattern = /https:\/\/github\.com\/(?<user>.*)\/blob\/(?<repo>.*)/;
    const match = url.match(githubPattern);
    if (match) {
      return `https://raw.githubusercontent.com/${match.groups.user}/${match.groups.repo}`;
    }
    return url;
  };

  const [imgSrc, setImgSrc] = useState(() => {
    const initialUrl = icon || operatorIcon;
    return convertToRawUrl(initialUrl);
  });

  const getNameSpacesListInfo = async () => {
    const res = await listNamespaces();
    const arr = res.data.items.map((el) => ({
      label: el.metadata.name,
      value: el.metadata.name,
    }));
    setDefaultNameSpace(arr[0].value);
  };

  const goToManagementPage = () => {
    if (isExtension) {
      history.push(`/${containerRouterPrefix}/extendManage/${namespace}/${extensionName}`);
    } else {
      history.push(`/${containerRouterPrefix}/applicationManageHelm/${namespace}/${extensionName}`);
    }
  };

  useEffect(() => {
    const initialUrl = icon || operatorIcon;
    setImgSrc(convertToRawUrl(initialUrl));
  }, [icon]);

  useEffect(() => {
    getNameSpacesListInfo();
    setVersionSelect(version);
  }, []);

  return (
    <div className='details_header' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <div style={{ display: 'flex', gap: '20px', marginRight: '64px' }}>
        <div>
          <img src={imgSrc} className='img_icon' />
        </div>
        <div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center' }}>
            <Tooltip title={chart}>
              <div className='clamp_1' style={{ fontWeight: 'bold', maxWidth: '517px', color: themeStore.$s.theme === 'light' ? 'black' : '#fff' }}>{chart}</div>
            </Tooltip>
            {versionList && (
              <Select
                style={{ width: '160px', height: '21px' }}
                value={versionSelect}
                options={versionList}
                onChange={handleSelect}
              ></Select>
            )}
          </div>
          <Tooltip title={content}>
            <div style={{ fontSize: '14px', color: '#89939b', marginBottom: '15px' }} className='clamp_3'>{content}</div>
          </Tooltip>
          {children}
        </div>
      </div>
      <div>
        {isOperator === '1' && (
          <div>
            <Button
              className='primary_btn'
              onClick={() => goToManagementPage()}
              disabled={operatorDisabled}
            >
              {operatorTitle}
            </Button>
          </div>
        )}
        {isOperator === '2' && (
          <div>
            <Button
              className='primary_btn'
              onClick={() => {
                if (onDeployClick) {
                  onDeployClick(defaultNameSpace);
                  return;
                }
                history.push(`/${containerRouterPrefix}/appMarket/marketCategory/Deploy/${repo}/${chart}/${versionSelect || versionList[0]?.value}/${defaultNameSpace}`);
              }}
              disabled={operatorDisabled}
            >
              {operatorTitle}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
