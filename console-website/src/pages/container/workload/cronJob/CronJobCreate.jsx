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
import { createCronJob } from '@/api/containerApi';
import { cronJobYamlExample } from '@/common/exampleYaml';
import { containerRouterPrefix } from '@/constant.js';

export default function CronJobCreate() {
  return (
    <div className="child_content">
      <BreadCrumbCom className="create_bread" items={[
        { title: '工作负载', link: `/${containerRouterPrefix}/workload` },
        { title: 'CronJob', link: `/${containerRouterPrefix}/workload/cronJob` },
        { title: '创建' },
      ]} />
      <ResourceCreate
        type="CronJob"
        yamlExample={cronJobYamlExample}
        submitApi={createCronJob}
        jumpPath={`/${containerRouterPrefix}/workload/cronJob`}
      />
    </div>
  );
}