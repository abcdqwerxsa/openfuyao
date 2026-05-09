/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import BreadCrumbCom from '@/components/BreadCrumbCom';
import ResourceCreate from '@/components/layouts/ResourceCreate';
import { addPvcYamlData } from '@/api/containerApi';
import { pvcYamlExample } from '@/common/exampleYaml';
import { containerRouterPrefix } from '@/constant.js';

export default function PvcCreate() {
  return (
    <div className="child_content">
      <BreadCrumbCom className="create_bread" items={[
        { title: '存储', link: `/${containerRouterPrefix}/storage/pvc` },
        { title: '数据卷声明(PVC)', link: `/${containerRouterPrefix}/storage/pvc` },
        { title: '创建数据卷声明(PVC)' },
      ]} />
      <ResourceCreate
        type="Pvc"
        yamlExample={pvcYamlExample}
        submitApi={addPvcYamlData}
        jumpPath={`/${containerRouterPrefix}/storage/pvc`}
      />
    </div>
  );
}
