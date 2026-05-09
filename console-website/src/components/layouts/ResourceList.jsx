/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import {
  Button,
  Form,
  Space,
  Input,
  Table,
  ConfigProvider,
  Popover,
  message,
} from 'antd';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN';
import { useCallback, useEffect, useState, useContext } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import { Link, useHistory, useLocation } from 'inula-router';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { NamespaceContext } from '@/namespaceContext';
import { forbiddenMsg } from '@/tools/utils';
import '@/styles/pages/workload.less';
import ToastMsg from '@/components/ToastMsg';

export default function ResourceList({
  resourceType,
  columns,
  getResourceFn,
  deleteResourceFn,
  validateDelete,
  deleteSuccessMessage = '删除成功！请手动刷新',
  yamlEditPath,
  createLabel = '创建',
  createMenuItems = [],
}) {
  const [searchForm] = Form.useForm();

  const history = useHistory();
  const location = useLocation();

  const { state } = location;

  const namespace = useContext(NamespaceContext);

  const [messageApi, contextHolder] = message.useMessage();
  const [resourceList, setResourceList] = useState([]); // 数据集
  const [loading, setLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [pageIndex, setPageIndex] = useState(DEFAULT_CURRENT_PAGE); // 页码
  const [delModalOpen, setDelModalOpen] = useState(false); // 删除对话框展示
  const [delRecord, setDelRecord] = useState(null); // 删除的资源对象
  const [isDelCheck, setIsDelCheck] = useState(false); // 是否选中

  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [filterValue, setFilterValue] = useState();
  const [createPopOpen, setCreatePopOpen] = useState(false); // 气泡悬浮

  // 刷新按钮
  const handleResetWorkload = () => {
    getResourceList(false);
  };

  // 打开创建气泡菜单
  const handleRolePopOpenChange = (open) => {
    setCreatePopOpen(open);
  };

  // 删除按钮
  const handleDeleteResource = (record) => {
    if (validateDelete) {
      const errMsg = validateDelete(record);
      if (errMsg) {
        messageApi.error(errMsg);
        return;
      }
    }
    // 隐藏气泡框
    setPopOpen('');
    setDelModalOpen(true); // 打开弹窗
    setDelRecord(record);
    setIsDelCheck(false);
  };

  const handleDelCancel = () => {
    setDelModalOpen(false);
    setDelRecord(null);
  };

  const handleDelConfirm = async () => {
    if (!delRecord) {
      return;
    }
    try {
      const res = await deleteResourceFn(delRecord);
      if (res.status === ResponseCode.OK) {
        messageApi.success(deleteSuccessMessage);
        setIsDelCheck(false);
        setDelModalOpen(false);
        setDelRecord(null);
        getResourceList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleDelCheckFn = (e) => {
    setIsDelCheck(e.target.checked);
  };

  const handlePopOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  const handleCreate = useCallback(() => {
    history.push(`${location.pathname.trim('/')}/create`);
  }, [history, location.pathname]);

  const tableColumns = (() => {
    // 添加单选
    columns.forEach(column => {
      if (column.enableFilter) {
        column.filters = column.enableFilter.options;
        column.filterMultiple = false;
        column.filteredValue = filterValue ? [filterValue] : [];
        column.onFilter = (value, record) =>
          column.enableFilter.target(record).toLowerCase() === value.toLowerCase();
      }
    });

    return [...columns, {
      title: '操作',
      width: 120,
      key: 'handle',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popover
            className='pod'
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link"><Link to={yamlEditPath(record)}>修改</Link></Button>
                <Button type="link" onClick={() => handleDeleteResource(record)}>删除</Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid}
            onOpenChange={e => handlePopOpenChange(e, record)}>
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    }];
  })();

  // 获取资源列表
  const getResourceList = useCallback(async (isChange = true) => {
    setLoading(true);
    try {
      const res = await getResourceFn(namespace);
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearch(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) {
        setResourceList([]); // 数组为空
      }
      messageApi.error(`获取资源列表失败: ${e.response.data.message}`)
    }
    setLoading(false);
  }, [namespace, getResourceFn]);

  // 检索
  const handleSearch = (totalData = originalList, isChange = true) => {
    const resourceName = searchForm.getFieldValue('resource_name');
    let temporyList = totalData;
    if (resourceName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(resourceName.toLowerCase()));
    }
    setResourceList([...temporyList]);
    isChange ? setPageIndex(DEFAULT_CURRENT_PAGE) : null;
  };

  const handleTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        const entry = Object.entries(filter || {}).find(([, v]) => Array.isArray(v) && v.length > 0);
        setFilterValue(entry ? entry[1][0] : undefined);
      }
    },
    []
  );

  useEffect(() => {
    if (state && state.status) {
      setFilterValue(state.status.toLowerCase());
      window.history.replaceState(null, '');
    }
  }, [state]);

  useEffect(() => {
    getResourceList();
  }, [getResourceList]);

  return <div className="tab_container container_margin_box">
    <ToastMsg contextHolder={contextHolder} />
    <Form className="pod_searchForm form_padding_bottom" form={searchForm}>
      <Form.Item name="resource_name" className="pod_search_input">
        <Input.Search placeholder={`搜索 ${resourceType} 名称`} onSearch={() => handleSearch()} autoComplete="off" />
      </Form.Item>
      <Form.Item>
        <Space>
          {
            createMenuItems?.length > 0 ? <Popover placement='bottom'
              content={
                <Space className='column_pop'>
                  {createMenuItems.map(item => (
                    <Button type="link" key={item.key} onClick={item.onClick}>{item.label}</Button>
                  ))}
                </Space>
              }
              open={createPopOpen}
              onOpenChange={handleRolePopOpenChange}
            >
              <Button className="primary_btn" onClick={() => setCreatePopOpen(true)}>{createLabel}</Button>
            </Popover> : <Button className="primary_btn" onClick={handleCreate}>{createLabel}</Button>
          }
          <Button icon={<SyncOutlined />} onClick={handleResetWorkload} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_table_flex">
      <ConfigProvider locale={zhCN}>
        <Table
          className="table_padding"
          loading={loading}
          columns={tableColumns}
          dataSource={resourceList}
          onChange={handleTableChange}
          pagination={{
            className: 'page',
            current: pageIndex,
            showTotal: (total) => `共${total}条`,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (page) => setPageIndex(page),
          }}
          scroll={{ x: 1280 }}
        />
      </ConfigProvider>
    </div>
    <DeleteInfoModal
      title={`删除 ${resourceType}`}
      open={delModalOpen}
      cancelFn={handleDelCancel}
      content={[
        `删除 ${resourceType} 后将无法恢复，请谨慎操作。`,
        `确定删除 ${resourceType} ${delRecord?.metadata?.name || ''} 吗？`,
      ]}
      isCheck={isDelCheck}
      showCheck={true}
      checkFn={handleDelCheckFn}
      confirmFn={handleDelConfirm} />
  </div>;
}