/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { SettingOutlined } from '@ant-design/icons';
import { containerRouterPrefix } from '@/constant.js';
import { useHistory } from 'inula-router';

export function Banner() {
  const history = useHistory();
  return (
    <div>
      <div className='banner'>
        <div className='banner_content'>
          <div className='banner_text'>openFuyao应用市场</div>
          <div>
            应用市场支持以Helm为主的扩展组件及应用的浏览、查找和部署功能，并提供算力优化加速应用，释放澎湃算力。
          </div>
        </div>
      </div>
    </div>
  );
}
