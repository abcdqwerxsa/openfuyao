/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useState, useEffect, useCallback, useStore } from 'openinula';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Form, Space, Input, Popover, Table, ConfigProvider, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { Link, useHistory } from 'inula-router';
import { solveEncodePath, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import { getResourceExampleList, deleteResourceExample } from '@/api/containerApi';
import Dayjs from 'dayjs';
import { containerRouterPrefix } from '@/constant.js';

export default function ResourceExampleDetailExample({ customResourceDefinitionDetailDataProps }) {
  const [resourceExampleForm] = Form.useForm();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [resourceExamplePage, setResourceExamplePage] = useState(DEFAULT_CURRENT_PAGE);
  const [resourceExample, setResourceExample] = useState([]); // table
  const [resourceExampleLoading, setResourceExampleLoading] = useState(false); // 加载中
  const [prefixObj, setPrefixObj] = useState({
    group: customResourceDefinitionDetailDataProps.spec.group,
    version: customResourceDefinitionDetailDataProps.spec.versions[0].name,
    plural: customResourceDefinitionDetailDataProps.spec.names.plural,
  });
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const themeStore = useStore('theme');
  const [resourceExampleDelModalOpen, setResourceExampleDelModalOpen] = useState(false); // 删除对话框展示
  const [resourceExampleDelName, setResourceExampleDelName] = useState(''); // 删除的名称
  const [isResourceExampleDelCheck, setIsResourceExampleDelCheck] = useState(false); // 是否选中
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [yamlExampleObj, setYamlExampleObj] = useState({});

  // 列表项
  const resourceExampleColumns = [
    {
      title: '实例名称',
      key: 'resourceExample_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) =>
        <Link to={{
          pathname: `/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(customResourceDefinitionDetailDataProps.metadata.name)}/cr/${record.metadata.name}`,
          state: { ...prefixObj, namespace: record.metadata.namespace },
        }}>{record.metadata.name}
        </Link>,
    },
    {
      title: '命名空间',
      key: 'resourceExample_version',
      render: (_, record) => record.metadata.namespace ? record.metadata.namespace : '--',
    },
    {
      title: '创建时间',
      key: 'resourceExample_createdTime',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'resourceExample_handle',
      fixed: 'right',
      width: 120,
      render: (_, record) => <Space>
        <Popover placement="bottom"
          content={
            <div className="pop_modal">
              <Link className="primary_link" to={{
                pathname: `/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(
                  customResourceDefinitionDetailDataProps.metadata.name)}/cr/${record.metadata.name}/yaml`,
                state: { ...prefixObj, namespace: record.metadata.namespace },
              }}>
                修改
              </Link>
              <Button type="link" onClick={() => handleDeleteResourceExample(record)}>删除</Button>
            </div>
          }
          trigger="click"
          open={popOpen === record.metadata.uid}
          onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.uid) : setPopOpen('')}>
          <MoreOutlined className="common_antd_icon primary_color" />
        </Popover>
      </Space>,
    },
  ];

  const getResourceExample = useCallback(async (isChange = true) => {
    setResourceExampleLoading(true);
    try {
      const res = await getResourceExampleList(prefixObj);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchResourceExample(res.data.items, isChange); // 先搜索
        setYamlExampleObj({
          apiVersion: res.data.apiVersion,
          kind: res.data.kind.replace('List', ''),
          scopeNamespace: customResourceDefinitionDetailDataProps.spec.scope,
        });
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setResourceExample([]); // 数组为空
      }
    }
    setResourceExampleLoading(false);
  }, [prefixObj]);

  // 重置按钮
  const handleResourceExampleReset = () => {
    getResourceExample();
  };

  // 删除按钮
  const handleDeleteResourceExample = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setResourceExampleDelModalOpen(true); // 打开弹窗
    setResourceExampleDelName(record.metadata.name);
    setIsResourceExampleDelCheck(false);
    setPrefixObj({ ...prefixObj, namespace: record.metadata.namespace });
  };

  const handleDelResourceExampleCancel = () => {
    setResourceExampleDelModalOpen(false);
    setResourceExampleDelName('');
    setPrefixObj({ ...prefixObj, namespace: '' });
  };

  const handleDelResourceExampleConfirm = async () => {
    try {
      const res = await deleteResourceExample(prefixObj, resourceExampleDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
        setResourceExampleDelModalOpen(false);
          setResourceExampleDelName('');
          setPrefixObj({ ...prefixObj, namespace: '' });
          setIsResourceExampleDelCheck(false);
          getResourceExample();
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  // 检索
  const handleSearchResourceExample = (totalData = originalList, isChange = true) => {
    const resourceExampleFormName = resourceExampleForm.getFieldValue('resourceExample_name');
    let temporyList = totalData;
    if (resourceExampleFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(resourceExampleFormName.toLowerCase()));
    }
    setResourceExample([...temporyList]);
    isChange ? setResourceExamplePage(DEFAULT_CURRENT_PAGE) : null;
  };

  const handleResourceExampleCheckFn = (e) => {
    setIsResourceExampleDelCheck(e.target.checked);
  };

  useEffect(() => {
    getResourceExample();
  }, [getResourceExample]);

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className="container_margin_box">
      <Form className="searchForm form_padding_bottom" form={resourceExampleForm}>
        <Form.Item name="resourceExample_name" className="search_input">
          <Input.Search placeholder="搜索实例名称" onSearch={() => handleSearchResourceExample()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              className="primary_btn borderRadiusRight6"
              onClick={() => history.push({
                pathname:
                  `/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(customResourceDefinitionDetailDataProps.metadata.name)}/createCR`,
                state: { ...prefixObj, namespace: '', ...yamlExampleObj },
              })}>
              创建
            </Button>
            <Button icon={<SyncOutlined />} onClick={handleResourceExampleReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex cluster_container_height">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={resourceExampleLoading}
            columns={resourceExampleColumns}
            dataSource={resourceExample}
            pagination={{
              className: 'page',
              current: resourceExamplePage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setResourceExamplePage(page),
            }}
            scroll={{ x: 1280 }}>
          </Table>
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="删除自定义资源实例"
        open={resourceExampleDelModalOpen}
        cancelFn={handleDelResourceExampleCancel}
        content={[
          '删除自定义资源实例后将无法恢复，请谨慎操作。',
          `确定删除自定义资源实例 ${resourceExampleDelName} 吗？`,
        ]}
        isCheck={isResourceExampleDelCheck}
        showCheck={true}
        checkFn={handleResourceExampleCheckFn}
        confirmFn={handleDelResourceExampleConfirm} />
    </div>
  </Fragment>;
}