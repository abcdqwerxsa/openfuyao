/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import ApplicationRecommetItem from '@/pages/applicationMarket/ApplicationRecommetItem';
import arrow from '@/assets/images/arrow.png';
import { useHistory } from 'inula-router';
import { useStore, useEffect, Fragment } from 'openinula';
import { Skeleton } from 'antd';
import '@/styles/applicationMarket/marketBlock.less';
import marketLoading from '@/assets/images/marketLoading.png';

export function MarketBlock({ title, link, data, loaded, children }) {
  const history = useHistory();
  const themeStore = useStore('theme');
  
  return (
    <div className='market_recommend'>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: '0 auto' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: themeStore.$s.theme === 'light' ? 'black' : '#f7f7f7' }}>{title}</div>
        {!!data.length && !!loaded &&
          <div
            style={{ display: 'flex', gap: '4px', marginBottom: '12px', cursor: 'pointer' }}
            onClick={() => history.push(link)}
          >
            <div style={{ color: '#3f66f5' }}>更多</div>
            <div><img src={arrow} style={{ marginTop: '6px' }} /></div>
          </div>}
      </div>
      {loaded ? <Fragment>
        {data.length ? (<div className='market_recommend_item'>
          {data.map(item => <ApplicationRecommetItem itemMeta={item.metadata} repo={item.repo} />)}
        </div>) : children}
      </Fragment>
        : <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid #dcdcdcff', borderRadius: '4px', padding: '32px 0' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}> <img src={marketLoading} /></div>
            <div style={{ color: '#89939b', textAlign: 'center' }}>正在加载中</div>
          </div>
        </div>}
    </div>
  );
}
