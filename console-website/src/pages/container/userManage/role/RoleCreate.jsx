/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import '@/styles/pages/podDetail.less';
import { addRoleYamlData } from '@/api/containerApi';
import ResourceCreate from '@/components/layouts/ResourceCreate';
import { roleYamlExample } from '@/common/exampleYaml';

export default function RoleCreate() {
  return (
    <div className="child_content">
      <BreadCrumbCom
        className="create_bread"
        items={[
          { title: 'RBAC管理', disabled: true },
          { title: '角色', path: `/${containerRouterPrefix}/userManage/role` },
          { title: '创建' },
        ]}
      />
      <ResourceCreate
        type="Role"
        yamlExample={roleYamlExample}
        submitApi={addRoleYamlData}
        jumpPath={`/${containerRouterPrefix}/userManage/role`}
      />
    </div>
  );
}