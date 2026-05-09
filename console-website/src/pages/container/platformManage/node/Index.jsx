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
import { Button, Form, Space, Input, Table, ConfigProvider } from 'antd';
import { containerRouterPrefix } from '@/constant';
import { SyncOutlined } from '@ant-design/icons';
import '@/styles/pages/nodeManage.less';
import { useCallback, useEffect, useState } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode, nodeStatusOptions, nodeTypeOptions } from '@/common/constants';
import { listNodes } from '@/api/containerApi';
import { Link, useLocation } from 'inula-router';
import zhCN from 'antd/es/locale/zh_CN';
import ManageNodeIcon from '@/assets/images/manageNodeIcon.png';
import WorkerNodeIcon from '@/assets/images/workerNodeIcon.png';
import { solveNodeBaseInfo, solveNodeIpAddress, solveNodeType, sorterFirstAlphabet } from '@/tools/utils';
export default function Node() {
  const [nodeForm] = Form.useForm();
  const { state } = useLocation();
  const [nodePage, setNodePage] = useState(DEFAULT_CURRENT_PAGE);
  const [nodeInfo, setNodeInfo] = useState({}); // 节点情况
  const [nodeListData, setNodeListData] = useState([]); // 节点table
  const [nodeLoading, setNodeLoading] = useState(false); // 加载中
  const [filterNodeStatus, setFilterNodeStatus] = useState([]); // 赋值筛选项
  const [filterNodeType, setFilterNodeType] = useState([]); // 赋值筛选项
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterNodeValue, setFilterNodeValue] = useState();
  const [filterNodeStatusValue, setFilterNodeStatusValue] = useState();
  const [filterNodeTypeValue, setFilterNodeTypeValue] = useState();

  // 列表项
  const nodeColumns = [
    {
      title: '节点名称',
      key: 'node_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/nodeManage/${record.metadata.name}`}>{record.metadata.name}</Link>,
    },
    {
      title: 'IP地址',
      key: 'node_ip',
      sorter: (a, b) => sorterFirstAlphabet(solveNodeIpAddress(a.status.addresses), solveNodeIpAddress(b.status.addresses)),
      render: (_, record) => solveNodeIpAddress(record.status.addresses),
    },
    {
      title: '类型',
      filters: filterNodeType,
      filteredValue: filterNodeTypeValue ? [filterNodeTypeValue] : [],
      filterMultiple: false,
      onFilter: (value, record) => solveNodeType(record.metadata.labels) === value,
      sorter: (a, b) => sorterFirstAlphabet(nodeTypeOptions[solveNodeType(a.metadata.labels)], nodeTypeOptions[solveNodeType(b.metadata.labels)]),
      key: 'nodeType',
      render: (_, record) => nodeTypeOptions[solveNodeType(record.metadata.labels)],
    },
    {
      title: '状态',
      filters: filterNodeStatus,
      filterMultiple: false,
      filteredValue: filterNodeStatusValue ? [filterNodeStatusValue] : [],
      onFilter: (value, record) => (value === 'normal' ? record.metadata.name !== '' : record.metadata.name === ''),
      sorter: true,
      key: 'nodeStatus',
      width: 220,
      render: (_, _record) => <div className={`status_group`}>
        <span className='running_circle'></span>
        <span>正常</span>
      </div>,
    },
    {
      title: '是否繁忙',
      filters: [{ text: '是', value: 'True' }, { text: '否', value: 'False' }],
      filteredValue: filterNodeValue ? [filterNodeValue] : [],
      onFilter: (value, record) =>
        value === 'True'
          ? record.status.conditions.some(item => (item.type !== 'Ready' && item.status === 'True') || (item.type === 'Ready' && item.status === 'False'))
          : record.status.conditions.every(item => (item.type === 'Ready' && item.status === 'True') || (item.type !== 'Ready' && item.status === 'False')),
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(
        a.status.conditions.some(item => (item.type !== 'Ready' && item.status === 'True') || (item.type === 'Ready' && item.status === 'False')) ? '是' : '否',
        b.status.conditions.some(item => (item.type !== 'Ready' && item.status === 'True') || (item.type === 'Ready' && item.status === 'False')) ? '是' : '否',
      ),
      key: 'isNodeBusy',
      render: (_, record) => record.status.conditions.some(item => (item.type !== 'Ready' && item.status === 'True') || (item.type === 'Ready' && item.status === 'False')) ? '是' : '否',
    },
    {
      title: 'OS',
      key: 'node_os',
      sorter: (a, b) => sorterFirstAlphabet(a.status.nodeInfo.osImage, b.status.nodeInfo.osImage),
      render: (_, record) => record.status.nodeInfo.osImage || '--',
    },
  ];

  const getNodeListData = useCallback(async (isChange = true) => {
    setNodeLoading(true);
    try {
      const res = await listNodes();
      if (res.status === ResponseCode.OK) {
        setNodeInfo(solveNodeBaseInfo(res.data.items));
        setOriginalList([...res.data.items]);
        handleSearchNode(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setNodeListData([]); // 数组为空
      }
    }
    setNodeLoading(false);
  }, []);

  // 重置按钮
  const handleNodeReset = () => {
    getNodeListData(false);
  };

  // 检索
  const handleSearchNode = (totalData = originalList, isChange = true) => {
    const nodeFormName = nodeForm.getFieldValue('node_name');
    let temporyList = totalData;
    if (nodeFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(nodeFormName.toLowerCase()));
    }
    setNodeListData([...temporyList]);
    isChange ? setNodePage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    getNodeListData();
  }, [getNodeListData]);

  const handleNodeTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        if (Object.prototype.hasOwnProperty.call(filter, 'isNodeBusy')) {
          setFilterNodeValue(filter.isNodeBusy && filter.isNodeBusy.length ? filter.isNodeBusy[0] : null);
        }
        if (Object.prototype.hasOwnProperty.call(filter, 'nodeStatus')) {
          setFilterNodeStatusValue(filter.nodeStatus && filter.nodeStatus.length ? filter.nodeStatus[0] : null);
        }
        if (Object.prototype.hasOwnProperty.call(filter, 'nodeType')) {
          setFilterNodeTypeValue(filter.nodeType && filter.nodeType.length ? filter.nodeType[0] : null);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      let value = (state.status === '繁忙' ? 'True' : 'False');
      setFilterNodeValue(value);
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    // 赋值
    let statusArr = [];
    let typeArr = [];
    Object.keys(nodeStatusOptions).map(item => {
      statusArr.push({ text: nodeStatusOptions[item], value: item });
    });
    Object.keys(nodeTypeOptions).map(item => {
      typeArr.push({ text: nodeTypeOptions[item], value: item });
    });
    setFilterNodeStatus([...statusArr]);
    setFilterNodeType([...typeArr]);
  }, []);

  return <div className="child_content">
    <BreadCrumbCom className="create_bread" items={[
      { title: '节点', path: `/${containerRouterPrefix}/nodeManage`, disabled: true }]} />
    <div className="node_header node_manage_card_header">
      <div className="no_image_flex">
        <div className="node_title">
          <span>{nodeInfo.unnormalNode}</span>
          <span>/</span>
          <span>{nodeInfo.totalNode}</span>
        </div>
        <p>异常节点/总节点</p>
      </div>
      <div className="node_item">
        <img src={ManageNodeIcon} />
        <div className="node_title">
          <div className="node_count">{nodeInfo.manageNode}</div>
          <p>管理节点</p>
        </div>
      </div>
      <div className="node_item">
        <img src={WorkerNodeIcon} />
        <div className="node_title">
          <div className="node_count">{nodeInfo.workerNode}</div>
          <p>工作节点</p>
        </div>
      </div>
    </div>
    <div className="container_margin_box">
      <Form className="searchForm form_padding_bottom" form={nodeForm}>
        <Form.Item name="node_name" className="search_input">
          <Input.Search placeholder="搜索节点名称" onSearch={() => handleSearchNode()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button icon={<SyncOutlined />} onClick={handleNodeReset} className="reset_btn"></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex" style={{ height: 'calc(100vh - 413px)' }}>
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={nodeLoading}
            columns={nodeColumns}
            dataSource={nodeListData}
            onChange={handleNodeTableChange}
            pagination={{
              className: 'page',
              current: nodePage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setNodePage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
      </div>
    </div>
  </div>;
}