/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import Inula, { useEffect, useState, useStore, useCallback } from 'openinula';
import operatorIcon from '@/assets/images/operatorIcon.png';
import { containerRouterPrefix } from '@/constant.js';
import { useHistory } from 'inula-router';
import extensionManagement from '@/assets/images/extensionManagement.png';
import applicationExtendDefault from '@/assets/images/application_extend_default.png';
import { Tooltip } from 'antd';

export default function ApplicationRecommetItem({ itemMeta, repo, types }) {
  const history = useHistory();
  const themeStore = useStore('theme');
  const repoType = (type) => {
    switch (type) {
      case 'openFuyao':
        return '官方仓库提供';
      case 'local':
        return '本地仓库提供';
      default:
        return '用户添加';
    }
  };
  const isSelectExtensionComponent = itemMeta?.keywords
    ? itemMeta?.keywords?.includes('openfuyao-extension')
    : false;
  const handleViewDetails = () => {
    history.push(
      `/${containerRouterPrefix}/appMarket/marketCategory/ApplicationDetails/${itemMeta.name}/${repo}/${itemMeta.version}`
    );
  };
  const convertToRawUrl = (url) => {
    const githubPattern = /https:\/\/github\.com\/(?<user>.*)\/blob\/(?<repo>.*)/;
    const match = url.match(githubPattern);
    if (match) {
      return `https://raw.githubusercontent.com/${match.groups.user}/${match.groups.repo}`;
    }
    return url;
  };

  const [imgSrc, setImgSrc] = useState(() => {
    const initialUrl = itemMeta.icon || applicationExtendDefault;
    return convertToRawUrl(initialUrl);
  });

  const handleImgError = () => {
    setImgSrc(applicationExtendDefault);
  };

  useEffect(() => {
    const initialUrl = itemMeta.icon || applicationExtendDefault;
    setImgSrc(convertToRawUrl(initialUrl));
  }, [itemMeta]);

  return (
    <div className='application_item' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34' }} onClick={handleViewDetails}>
      <div>
        <div className='application_item_header'>
          <div className='application_item_logo'>
            <img src={imgSrc} alt='' onError={handleImgError} />
          </div>
          <div>
            <div className='application_item_title clamp_2' style={{ color: themeStore.$s.theme === 'light' ? 'black' : '#f7f7f7' }}>{itemMeta.name}</div>
            <div className='application_item_text'>{repoType(types ? repo : itemMeta.repo)}</div>
          </div>
        </div>
        <div className='application_item_text clamp_3'>{itemMeta.description}</div>
      </div>
      {isSelectExtensionComponent && (
        <div className='extension_label'>
          <img src={extensionManagement} />
          <div className='application_item_text'>扩展组件</div>
        </div>
      )}
    </div>
  );
}