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

import { Link } from 'inula-router';
import { useStore } from 'openinula';
import AppMarket from '@/assets/images/home/appMarket.png';
import Migrant from '@/assets/images/home/migrant.png';
import Pluggable from '@/assets/images/home/pluggable.png';
import AppManage from '@/assets/images/home/appManage.png';
import Engine from '@/assets/images/home/engine.png';
import Turbo from '@/assets/images/home/turbo.png';
import Monitoring from '@/assets/images/home/monitoring.png';
import Overview from '@/assets/images/home/overview.png';
import DarkOverview from '@/assets/images/home/darkOverview.png';
import boxBack from '@/assets/images/home/boxBackground.png';
import DarkBoxBack from '@/assets/images/home/darkBoxBackground.png';
import boxBackHover from '@/assets/images/home/boxBackgroundHover.png';
import DarkBoxBackHover from '@/assets/images/home/darkBoxBackgroundHover.png';
import '@/styles/pages/home.less';

export default function Home() {
  const themeStore = useStore('theme');
  const features = [
    {
      title: '极简安装部署',
      display: 'block',
      items: [
        {
          img: AppMarket,
          name: '应用市场',
          desc: '提供海量Turbo应用',
          linkText: '进入应用市场',
          target: '/container_platform/appMarket/appOverview',
        },
        {
          img: Migrant,
          name: '零成本应用迁移',
          desc: '支持主流平台快速迁移',
          linkText: '建设中...',
          target: undefined,
        },
      ],
    },
    {
      title: '极智运维交互',
      display: 'block',
      items: [
        {
          img: Pluggable,
          name: '可插拔架构',
          desc: '定制化平台能力',
          linkText: '进入扩展组件管理',
          target: '/container_platform/extendManage',
        },
        {
          img: AppManage,
          name: '应用管理',
          desc: '基于业务应用对K8S原生资源进行管理',
          linkText: '进入应用管理',
          target: '/container_platform/applicationManageHelm',
        },
      ],
    },
    {
      title: '算力一键加速',
      display: 'none',
      items: [
        {
          img: Engine,
          name: '算力引擎',
          desc: '自动化系统体检，识别性能瓶颈，一键启动加速',
          linkText: '建设中...',
          target: undefined,
        },
        {
          img: Turbo,
          name: 'Turbo加速插件',
          desc: '提供海量Turbo应用插件，充分释放鲲鹏硬件性能',
          linkText: '建设中...',
          target: undefined,
        },
      ],
    },
    {
      title: '极致可观测性',
      display: 'block',
      items: [
        {
          img: Monitoring,
          name: '监控看板',
          desc: '支持软硬件实时深度观测能力',
          linkText: '进入监控看板',
          target: '/container_platform/monitor/monitorDashboard',
        },
        {
          img: Overview,
          name: '集群总览',
          desc: '直观呈现集群整体当前资源占用情况',
          linkText: '进入集群总览',
          target: '/container_platform/overview',
        },
      ],
    },
  ];

  return (
    <div className='home_container'>
      <p className='home_main_title'>
        openFuyao让澎湃算力进入每个集群、每个组织
      </p>
      <div className='feature_boxes'>
        {
          features.map((item) => (
            <div className='feature_box' style={{ display: item.display }}>
              <img className='feature_box_back' src={themeStore.$s.theme === 'light' ? boxBack : DarkBoxBack} alt='' />
              <img className='feature_box_back_hover' src={themeStore.$s.theme === 'light' ? boxBackHover : DarkBoxBackHover} alt='' />
              <p className='feature_title'>{item.title}</p>
              <div className='feature_items'>
                <div className='feature_item'>
                  <img src={item.items[0].img} alt='' />
                  <p className='feature_name'>{item.items[0].name}</p>
                  <p className='feature_desc'>{item.items[0].desc}</p>
                  {
                    item.items[0].target ?
                      <p className='feature_link'>
                        <Link to={item.items[0].target}>{item.items[0].linkText}</Link>
                      </p> :
                      <p className='feature_link'>{item.items[0].linkText}</p>
                  }
                </div>
                <div className='feature_item'>
                  <img src={item.items[1].img} alt='' />
                  <p className='feature_name'>{item.items[1].name}</p>
                  <p className='feature_desc'>{item.items[1].desc}</p>
                  {
                    item.items[1].target ?
                      <p className='feature_link'>
                        <Link to={item.items[1].target}>{item.items[1].linkText}</Link>
                      </p> :
                      <p className='feature_link'>{item.items[1].linkText}</p>
                  }
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}