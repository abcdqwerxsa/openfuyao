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
import { Table, ConfigProvider } from 'antd';
import '@/styles/pages/nodeManage.less';
import { useEffect, useState } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import zhCN from 'antd/es/locale/zh_CN';
import { sorterFirstAlphabet } from '@/tools/utils';
import { getClusterRoleList } from '@/api/clusterApi';
export default function ClusterUser() {
  const [clusterUserPage, setClusterUserPage] = useState(DEFAULT_CURRENT_PAGE);
  const [clusterUserListData, setClusterUserListData] = useState(); // table

  // 列表项
  const clusterUserColumns = [
    {
      title: '角色名称',
      key: 'member_name',
      sorter: (a, b) => sorterFirstAlphabet(a.name, b.name),
      render: (_, record) => record.name || '--',
    },
    {
      title: '描述',
      key: 'member_user',
      render: (_, record) => record.description || '--',
    },
  ];
  const getRoleList = async () => {
    const res = await getClusterRoleList();
    let dataList = [];
    if (res.status === ResponseCode.OK) {
      res.data.Data.map(item => {
        dataList.push({
          name: item.metadata.name,
          description: item.metadata.annotations.description,
        });
      });
    }
    setClusterUserListData(dataList);
  };
  useEffect(() => {
    getRoleList();
  }, []);

  return <div className='child_content withBread_content'>
    <BreadCrumbCom className='create_bread' items={[
      { title: '集群角色', path: `/`, disabled: true },
    ]} />
    <div className="container_margin_box" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className='tab_table_flex cluster_container_height' style={{ paddingTop: '32px', height: 'calc(100vh - 200px)' }}>
        <ConfigProvider locale={zhCN}>
          <Table
            className='table_padding'
            columns={clusterUserColumns}
            dataSource={clusterUserListData}
            pagination={{
              className: 'page',
              current: clusterUserPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setClusterUserPage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
    </div>
  </div>;
}