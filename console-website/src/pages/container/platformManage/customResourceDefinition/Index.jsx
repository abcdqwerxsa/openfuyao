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
import { Button, Form, Space, Input, Popover, Table, ConfigProvider, message } from 'antd';
import { containerRouterPrefix } from '@/constant';
import { SyncOutlined, MoreOutlined } from '@ant-design/icons';
import '@/styles/pages/nodeManage.less';
import { useCallback, useEffect, useState, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import { getCustomResourceDefinitionList, deleteCustomResourceDefinition } from '@/api/containerApi';
import { Link, useHistory } from 'inula-router';
import zhCN from 'antd/es/locale/zh_CN';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { solveCustomResourceStatus, solveEncodePath, sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function CustomResourceDefinition() {
  const [customResourceDefinitionForm] = Form.useForm();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [customResourceDefinition, setCustomResourceDefinition] = useState([]); // table
  const [customResourceDefinitionLoading, setCustomResourceDefinitionLoading] = useState(false); // 加载中
  const themeStore = useStore('theme');
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [customResourceDefinitionPage, setCustomResourceDefinitionPage] = useState(DEFAULT_CURRENT_PAGE);
  const [customResourceDefinitionDelModalOpen, setCustomResourceDefinitionDelModalOpen] = useState(false); // 删除对话框展示
  const [customResourceDefinitionDelName, setCustomResourceDefinitionDelName] = useState(''); // 删除的名称
  const [isCustomResourceDefinitionDelCheck, setIsCustomResourceDefinitionDelCheck] = useState(false); // 是否选中

  const [filterCustomResourceDefinitionStatus, setFilterCustomResourceDefinitionStatus] = useState([]); // 赋值筛选项
  const [originalList, setOriginalList] = useState([]); // 原始数据

  const handleCustomResourceDefinitionOpenChange = (newOpen, record) => {
    if (newOpen) {
      setPopOpen(record.metadata.uid);
    } else {
      setPopOpen('');
    }
  };

  // 列表项
  const customResourceDefinitionColumns = [
    {
      title: '资源名称',
      key: 'customResourceDefinition_name',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to={`/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(record.metadata.name)}`}>{record.metadata.name}</Link>,
    },
    {
      title: '最新版本',
      key: 'customResourceDefinition_version',
      render: (_, record) => record.spec.versions ? record.spec.versions[0].name : '--',
    },
    {
      title: '状态',
      filters: filterCustomResourceDefinitionStatus,
      filterMultiple: false,
      key: 'customResourceDefinition_status',
      onFilter: (value, record) => value === 'normal' ? solveCustomResourceStatus(record.status.conditions) === true : solveCustomResourceStatus(record.status.conditions) === false,
      width: 220,
      render: (_, record) => <div className={`status_group`}>
        <span className={solveCustomResourceStatus(record.status.conditions) ? 'running_circle' : 'failed_circle'}></span>
        <span>{solveCustomResourceStatus(record.status.conditions) ? '正常' : '异常'}</span>
      </div>,
    },
    {
      title: '操作',
      key: 'customResourceDefinition_handle',
      fixed: 'right',
      width: 120,
      render: (_, record) => <Space>
        <Popover placement="bottom"
          content={
            <div className="pop_modal">
              <Button type="link"><Link to={`/${containerRouterPrefix}/customResourceDefinition/${solveEncodePath(record.metadata.name)}/yaml`}>修改</Link></Button>
              <Button type="link" onClick={() => handleDeleteCustomResourceDefinition(record)}>删除</Button>
            </div>
          }
          trigger="click"
          open={popOpen === record.metadata.uid}
          onOpenChange={e => handleCustomResourceDefinitionOpenChange(e, record)}>
          <MoreOutlined className="common_antd_icon primary_color" />
        </Popover>
      </Space>,
    },
  ];

  const getCustomResourceDefinition = useCallback(async (isChange = true) => {
    setCustomResourceDefinitionLoading(true);
    try {
      const res = await getCustomResourceDefinitionList();
      if (res.status === ResponseCode.OK) {
        setOriginalList([...res.data.items]);
        handleSearchCustomResourceDefinition(res.data.items, isChange); // 先搜索
      }
    } catch (e) {
      if (e.response.data.code === ResponseCode.NotFound) { // 404
        setCustomResourceDefinition([]); // 数组为空
      }
    }
    setCustomResourceDefinitionLoading(false);
  }, []);

  // 重置按钮
  const handleCustomResourceDefinitionReset = () => {
    getCustomResourceDefinition(false);
  };

  // 删除按钮
  const handleDeleteCustomResourceDefinition = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setCustomResourceDefinitionDelModalOpen(true); // 打开弹窗
    setCustomResourceDefinitionDelName(record.metadata.name);
    setIsCustomResourceDefinitionDelCheck(false);
  };

  const handleDelCustomResourceDefinitionCancel = () => {
    setCustomResourceDefinitionDelModalOpen(false);
    setCustomResourceDefinitionDelName('');
  };

  const handleDelCustomResourceDefinitionConfirm = async () => {
    try {
      const res = await deleteCustomResourceDefinition(customResourceDefinitionDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setCustomResourceDefinitionDelModalOpen(false);
          setCustomResourceDefinitionDelName('');
          getCustomResourceDefinition();
          setIsCustomResourceDefinitionDelCheck(false);
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
  const handleSearchCustomResourceDefinition = (totalData = originalList, isChange = true) => {
    const customResourceDefinitionFormName = customResourceDefinitionForm.getFieldValue('customResourceDefinition_name');
    let temporyList = totalData;
    if (customResourceDefinitionFormName) {
      temporyList = temporyList.filter(item => (item.metadata.name).toLowerCase().includes(customResourceDefinitionFormName.toLowerCase()));
    }
    setCustomResourceDefinition([...temporyList]);
    isChange ? setCustomResourceDefinitionPage(DEFAULT_CURRENT_PAGE) : null;
  };

  const handleCustomResourceDefinitionCheckFn = (e) => {
    setIsCustomResourceDefinitionDelCheck(e.target.checked);
  };

  useEffect(() => {
    getCustomResourceDefinition();
  }, [getCustomResourceDefinition]);

  useEffect(() => {
    // 赋值
    let statusArr = [{ text: '正常', value: 'normal' }, { text: '异常', value: 'failed' }];
    setFilterCustomResourceDefinitionStatus([...statusArr]);
  }, []);

  return <div className="child_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom className="create_bread" items={[
      { title: '自定义资源', path: `/${containerRouterPrefix}/customResourceDefinition`, disabled: true }]} />
    <div className="container_margin_box">
      <Form className="searchForm form_padding_bottom" form={customResourceDefinitionForm}>
        <Form.Item name="customResourceDefinition_name" className="search_input">
          <Input.Search placeholder="搜索资源名称" onSearch={() => handleSearchCustomResourceDefinition()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className="primary_btn" onClick={() => history.push(`/${containerRouterPrefix}/customResourceDefinition/createCustomResourceDefinition`)}>创建</Button>
            <Button icon={<SyncOutlined />} onClick={handleCustomResourceDefinitionReset} className="reset_btn" style={{ marginLeft: '16px' }}></Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex cluster_container_height">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={customResourceDefinitionLoading}
            columns={customResourceDefinitionColumns}
            dataSource={customResourceDefinition}
            pagination={{
              className: 'page',
              current: customResourceDefinitionPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setCustomResourceDefinitionPage(page),
            }}
          />
        </ConfigProvider>
      </div>
      <DeleteInfoModal
        title="删除自定义资源"
        open={customResourceDefinitionDelModalOpen}
        cancelFn={handleDelCustomResourceDefinitionCancel}
        content={[
          '删除自定义资源后将无法恢复，请谨慎操作。',
          `确定删除自定义资源 ${customResourceDefinitionDelName} 吗？`,
        ]}
        isCheck={isCustomResourceDefinitionDelCheck}
        showCheck={true}
        checkFn={handleCustomResourceDefinitionCheckFn}
        confirmFn={handleDelCustomResourceDefinitionConfirm} />
    </div>
  </div>;
}