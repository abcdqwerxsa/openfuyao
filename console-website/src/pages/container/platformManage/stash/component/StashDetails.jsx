/* Copyright(c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
    EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON - INFRINGEMENT,
        MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import DetailsContent from '@/pages/applicationMarket/component/DetailsContent';
import '@/styles/pages/stash.less';
import {
  Input,
  Button,
  Table,
  Pagination,
  message,
  ConfigProvider,
  Popover,
  Space,
  Modal,
  Form,
  Radio,
  Tooltip,
  Breadcrumb,
} from 'antd';
import {
  getHelmRepoDetail,
  getHelmRepoChartsList,
  synchronizationHelmRepo,
  deleteHelmRepo,
  getsynchronizationStatus,
  updateHelmRepo,
  getNewHelmChartList,
} from '@/api/applicationMarketApi';
import { DownOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState, useStore } from 'openinula';
import { useParams, useHistory } from 'inula-router';
import Dayjs from 'dayjs';
import zhCN from 'antd/es/locale/zh_CN';
import { containerRouterPrefix } from '@/constant';
import { Link } from 'inula-router';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { sorterFirstAlphabet } from '@/tools/utils';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import applicationExtendDefault from '@/assets/images/application_extend_default.png';

const official = 'openfuyao';
const local = 'local';
const { Search } = Input;
export default function StashDetails() {
  const history = useHistory();
  const { repo } = useParams();
  const [dataSource, setDataSource] = useState([]);
  const [chartName, setChartName] = useState('');
  const [total, setTotal] = useState(0);
  const [basicInfo, setBasicInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [syncBtn, setSyncBtn] = useState('同步');
  const [syncLoading, setSyncLoading] = useState(false);
  const [podPopOpen, setPodPopOpen] = useState(false);
  const [updateInitValue, setUpdateInitValue] = useState({ name: '', url: '' });
  const [openAdd, setOpenAdd] = useState(false);
  const [form] = Form.useForm();
  const [isShow, setIsShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formRadio, setFormRadio] = useState('2');
  const [messageApi, contextHolder] = message.useMessage();
  const [isRepoDelCheck, setIsRepoDelCheck] = useState(false);
  const [repotDelModalOpen, setRepoDelModalOpen] = useState(false);
  const themeStore = useStore('theme');
  const [noneModalOpen, setNoneModalOpen] = useState(false);
  const [isNoneDelCheck, setIsNoneDelCheck] = useState(false);

  const [sortType, setSortType] = useState('');

  const [filterType, setfilterType] = useState([]);

  const [sortOrder, setSortOrder] = useState('');
  let timeId = 0;
  const repoType = (type) => {
    switch (type) {
      case 'openfuyao':
        return '官方仓库';
      case 'local':
        return '本地仓库';
      default:
        return '用户添加';
    }
  };
  const limitSearch = 53;
  const contentArray = useMemo(() => [
    {
      title: '仓库名称',
      value: basicInfo?.spec?.displayName || '--',
    },
    {
      title: '仓库类型',
      value: repoType(basicInfo?.metadata?.name),
    },
    {
      title: '仓库地址',
      value: basicInfo?.spec?.url || '--',
    },
    {
      title: '上次同步时间',
      value: Dayjs(basicInfo?.metadata?.annotations['openfuyao.com/modificationTimestamp']).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
    },
    {
      title: '创建时间',
      value: Dayjs(basicInfo?.metadata?.creationTimestamp).format(
        'YYYY-MM-DD HH:mm:ss'
      ),
    },
  ], [basicInfo]);

  const columns = [
    {
      title: '名称',
      sorter: true,
      key: 'name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div><img src={record.icon || applicationExtendDefault} style={{ width: '40px', height: '40px' }} /></div>
          <div>
            <Tooltip title={record.name}>
              <div className='clamp_1'>{record.name}</div>
            </Tooltip>
            <Tooltip title={record.description}>
              <div style={{ color: '#89939b', width: '200px' }} className='clamp_1'>{record.description}</div>
            </Tooltip>
          </div>
        </div>
      ),
      width: 450,
    },
    {
      title: '类型',
      key: 'keywords',
      filters: [
        { text: '应用', value: 'application' },
        { text: '扩展组件', value: 'openfuyao-extension' },
        // 添加更多筛选项
      ],
      render: (_, record) =>
        record.keywords ? isExtension(record.keywords) : '应用',
    },
    {
      title: '最新版本',
      dataIndex: 'version',
    },
    {
      title: '创建时间',
      key: 'created',
      sorter: true,
      render: (_, record) => Dayjs(record.created).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const isDelete = (type) => {
    switch (type) {
      case 'openFuyao':
        return false;
      case 'local':
        return false;
      default:
        return true;
    }
  };

  const isExtension = (arr) => {
    const extension = arr.some(item => item === 'openfuyao-extension');
    if (extension) {
      return '扩展组件';
    } else {
      return '应用';
    }
  };

  const getHelmRepoDetailInfo = async () => {
    const res = await getHelmRepoDetail(repo);
    let _updateValue = {};
    _updateValue.name = res.data.data.metadata.name;
    _updateValue.url = res.data.data.spec.url;
    setUpdateInitValue(_updateValue);
    setBasicInfo(res.data.data);
  };
  const getNewHelmChartListInfo = async (chartNameInput = chartName) => {
    const params = {
      sortType,
      filterType,
      sortOrder,
    };
    try {
      const res = await getNewHelmChartList(repo, chartNameInput, params, currentPage, limit);
      setTotal(res.data.data.totalItems);
      const arr = res.data.data.items.map((el) => el.metadata);
      setDataSource(arr);
    } catch (error) {
      messageApi.error(error.response.data.msg);
    }
  };

  const handleInput = (e) => {
    if (e.target.value.length >= limitSearch) {
      message.error(`搜索名称不能超过${limitSearch}个字符`);
      return;
    };
  };

  const handleSearch = (searchName) => {
    setChartName(searchName);
    setCurrentPage(1);
  };

  const handleChange = (page, pageSize) => {
    setCurrentPage(page);
    setLimit(pageSize);
  };

  const handleSynchronization = async () => {
    setSyncLoading(true);
    const timeout = 5 * 60 * 1000;
    try {
      await synchronizationHelmRepo(repo);
      checkUpdateStatus(timeout);
      setSyncLoading(false);
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        setSyncLoading(false);
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        if (error.response.data.msg.includes('syncronizing in progress')) {
          setSyncLoading(true);
          checkUpdateStatus(timeout);
        } else {
          messageApi.error(error.response.data.msg);
        }
      }
    }
  };

  const checkUpdateStatus = (timeout) => {
    const startTime = Date.now();
    const intervalld = setInterval(async () => {
      const currentTime = Date.now();
      if (currentTime - startTime >= timeout) {
        clearInterval(intervalld);
        messageApi.error(`${repo}同步失败`);
        setSyncLoading(false);
        return;
      };
      try {
        const res = await getsynchronizationStatus(repo);
        if (res.data.msg === 'complete') {
          setSyncBtn('同步');
          messageApi.success(`${repo}仓库同步成功`);
          clearInterval(intervalld);
          getNewHelmChartListInfo();
          setSyncLoading(false);
        };
        if (res.data.msg === 'in_progress') {
          setSyncLoading(true);
        }
      } catch (e) {
        messageApi.error(e.response.data.msg);
        clearInterval(intervalld);
        setSyncLoading(false);
      };
    }, 3000);
  };

  const handlePodPopOpenChange = (open) => {
    setPodPopOpen(open);
  };
  const updateRepo = (data) => {
    form.setFieldValue('name', data.name);
    form.setFieldValue('url', data.url);
    setOpenAdd((open) => !open);
    setPodPopOpen(false);
  };
  function handleCancel() {
    setOpenAdd((open) => !open);
    form.resetFields();
    setFormRadio('2');
    setIsShow(true);
  }
  function handleChangeRadio(e) {
    setFormRadio(e.target.value);
    if (e.target.value === '1') {
      setNoneModalOpen(true);
    } else {
      setIsShow(true);
    }
  }

  const handleDelNone = () => {
    setNoneModalOpen(false);
    setIsNoneDelCheck(false);
    setFormRadio('2');
  };
  const handleNoneCheckFn = (e) => {
    setIsNoneDelCheck(e.target.checked);
  };

  const confirmNoneFn = () => {
    setIsShow(false);
    setNoneModalOpen(false);
  };
  const onFinish = async () => {
    setLoading(true);
    let _data = {
      name: form.getFieldsValue().name,
      url: form.getFieldsValue().url,
      username: form.getFieldsValue().username,
      password: form.getFieldsValue().password,
    };
    let encoder = new TextEncoder();
    _data = Object.assign({}, _data, {
      username: Object.values(encoder.encode(_data.username)),
      password: Object.values(encoder.encode(_data.password)),
    });
    try {
      await updateHelmRepo(_data);
      messageApi.success('更新成功');
      if (limit !== 10 || currentPage !== 1) {
        handleChange(1, 10);
      } else {
        getHelmRepoDetailInfo();
        getHelmRepoChartsListInfo();
      }
      setLoading(false);
      setIsShow(true);
      handleCancel();
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(error.response.data.msg);
      }
      setLoading(false);
    }
  };
  const handleRepoCheckFn = (e) => {
    setIsRepoDelCheck(e.target.checked);
  };
  const deleteRepo = () => {
    setPodPopOpen(false);
    setRepoDelModalOpen(true);
  };
  function handleDelRepoCancel() {
    setRepoDelModalOpen(false);
    setIsRepoDelCheck(false);
  };
  const deleteReopFn = async () => {
    clearTimeout(timeId);
    try {
      const res = await deleteHelmRepo(updateInitValue.name);
      if (res.status === 200) {
        messageApi.success(`删除${updateInitValue.name}成功`);
        setRepoDelModalOpen(false);
        setIsRepoDelCheck(false);
        const id = setTimeout(() => {
          history.push(`/${containerRouterPrefix}/appMarket/stash`);
        }, 1000);
        timeId = id;
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(error.response?.data?.message);
      }
    }
  };

  const handleChange1 = (pagination, filters, sorter) => {
    if (filters?.keywords) {
      setCurrentPage(1);
      setfilterType([...Object.values(filters?.keywords)]);
    } else {
      setfilterType([]);
    }
    // 按照类型进行排序
    if (Object.keys(sorter).length) {
      setCurrentPage(1);
      setSortType('');
      setSortOrder('');
      if (sorter.columnKey === 'created') {
        if (sorter.order) {
          setSortType('time');
          setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
        } else {
          setSortOrder('');
        };
      };
      if (sorter.columnKey === 'name') {
        if (sorter.order) {
          setSortType('name');
          setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
        } else {
          setSortOrder('');
        };
      }
    };
  };

  useEffect(() => {
    getHelmRepoDetailInfo();
  }, []);

  useEffect(() => {
    getNewHelmChartListInfo();
  }, [sortType, filterType, sortOrder, currentPage, chartName, limit]);

  return (
    <div className='child_content withBread_content'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <BreadCrumbCom
        items={[
          { title: '仓库配置', disabled: true },
          { title: '仓库', path: `/${containerRouterPrefix}/appMarket/stash` },
          { title: '仓库详情' },
        ]}
      />
      <div className='ware_house_detail_header' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: themeStore.$s.theme !== 'light' && '#fff' }}>{repo}</div>
        <Popover placement='bottom'
          content={
            <Space className='column_pop'>
              <Button type='link' disabled={!isDelete(repo)} onClick={() => updateRepo(updateInitValue)}>修改</Button>
              <Button type='link' disabled={!isDelete(repo)} onClick={() => deleteRepo()}>删除</Button>
            </Space>
          }
          open={podPopOpen}
          onOpenChange={handlePodPopOpenChange}>
          <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
        </Popover>
      </div>
      <div className='stash_details_container'>
        <DetailsContent contentArray={contentArray} title='基本信息' />
        <div style={{ padding: '20px 32px 0px 32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
          <div className='fz_16 fw_bold mg_b_20' style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>应用/扩展组件</div>
          <div className='display_flex mg_b_20'>
            <Search
              placeholder='搜索名称'
              style={{ width: '300px', height: '32px' }}
              onChange={handleInput}
              onSearch={handleSearch}
              maxLength={limitSearch}
            />
            <Button
              className='cancel_btn'
              loading={syncLoading}
              onClick={handleSynchronization}
            >
              {syncBtn}
            </Button>
          </div>
          <ConfigProvider locale={zhCN}>
            <Table dataSource={dataSource} columns={columns} pagination={false} onChange={handleChange1} />
            <Pagination
              className='page'
              showTotal={(curTotal) => `共${curTotal}条`}
              showSizeChanger
              showQuickJumper
              total={total}
              current={currentPage}
              pageSize={limit}
              onChange={handleChange}
              pageSizeOptions={[10, 20, 50]}
            ></Pagination>
          </ConfigProvider>
          <Modal
            open={openAdd}
            title={'修改仓库'}
            width={720}
            onCancel={handleCancel}
            footer={[
              <Button key='back' className='cancel_btn' onClick={handleCancel}> 取消</Button>,
              <Button key='submit' loading={loading} className='primary_btn' onClick={onFinish}>确定</Button>,
            ]}
          >
            <Form
              layout='vertical'
              form={form}
              name='form_in_modal'
              onFinish={onFinish}
            >
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                  <div className='form_container'>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Form.Item
                        style={{ width: '100%' }}
                        name='name'
                        label='仓库名称'
                      >
                        <Input placeholder='请输入' disabled={true} />
                      </Form.Item>
                      <Form.Item name='url' label='仓库地址' style={{ width: '100%' }}>
                        <Input placeholder='请输入' />
                      </Form.Item>
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: '15px' }}>认证方式</div>
                    <div style={{ display: 'flex', gap: '40px' }}>
                      <Radio.Group onChange={handleChangeRadio} value={formRadio}>
                        <Radio className='custom-checkbox' value='1'>
                          NONE
                        </Radio>
                        <Radio className='custom-checkbox' value='2'>
                          用户名/密码
                        </Radio>
                      </Radio.Group>
                    </div>
                  </div>
                  {isShow && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '20px',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Form.Item
                        style={{ width: '50%' }}
                        name='username'
                        label='用户名'
                        rules={[{ required: true, message: '请输入用户名' }]}
                      >
                        <Input placeholder='请输入用户名' />
                      </Form.Item>
                      <Form.Item name='password' label='密码' style={{ width: '50%' }}
                        rules={[{ required: true, message: '请输入密码' }]}
                      >
                        <Input.Password placeholder='请输入密码' type='password' onCopy={(e) => e.preventDefault()} />
                      </Form.Item>
                    </div>
                  )}
                </div>
              </div>
            </Form>
          </Modal>
          <DeleteInfoModal
            title='删除'
            open={repotDelModalOpen}
            cancelFn={handleDelRepoCancel}
            content={[
              '删除将无法恢复，请谨慎操作。',
              `确定删除仓库 ${updateInitValue.name} 吗？`,
            ]}
            isCheck={isRepoDelCheck}
            showCheck={true}
            checkFn={handleRepoCheckFn}
            confirmFn={deleteReopFn} />
          <DeleteInfoModal
            title='安全风险'
            open={noneModalOpen}
            cancelFn={handleDelNone}
            content={[
              '连接用户名密码的仓库可能导致不安全后果，请谨慎操作。',
              `确定连接吗？`,
            ]}
            isCheck={isNoneDelCheck}
            checkboxText='我已了解风险'
            showCheck={true}
            confirmText={'确定'}
            checkFn={handleNoneCheckFn}
            confirmFn={confirmNoneFn}
          />
        </div>
      </div>
    </div>
  );
}
