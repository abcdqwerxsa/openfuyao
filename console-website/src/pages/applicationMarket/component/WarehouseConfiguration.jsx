/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import {
  Table,
  Space,
  Popover,
  Button,
  Input,
  Modal,
  Pagination,
  message,
  ConfigProvider,
  Form,
  Radio,
  Tooltip
} from 'antd';
import { MoreOutlined, InfoCircleFilled } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN';
import '@/styles/applicationMarket/index.less';
import '@/styles/pages/helm.less';
import { useEffect, useRef, useState, useStore } from 'openinula';
import { createHelmRepo } from '@/api/applicationMarketApi';
import {
  getHelmRepoList,
  deleteHelmRepo,
  synchronizationHelmRepo,
  updateHelmRepo,
  getsynchronizationStatus,
} from '@/api/applicationMarketApi';
import { Link } from 'inula-router';
import { containerRouterPrefix } from '@/constant';
import local from '@/assets/images/local.png';
import authority from '@/assets/images/authority.png';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import { sorterFirstAlphabet } from '@/tools/utils';
const { Search } = Input;

const limitSearch = 53;
export default function WarehouseConfiguration() {
  const [popOpen, setPopOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [repoName, setRepoName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formType, setFormType] = useState('add');
  const [form] = Form.useForm();
  const [isShowWare, setIsShowWare] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formRadioWare, setFormRadioWare] = useState('2');
  const [isRepoDelCheck, setIsRepoDelCheck] = useState(false);
  const [repotDelModalOpen, setRepoDelModalOpen] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const [noneModalOpenWare, setNoneModalOpenWare] = useState(false);
  const [isNoneDelCheckWare, setIsNoneDelCheckWare] = useState(false);
  const [unsafeModalOpen, setUnsafeModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [isCertCheckWare, setIsCertCheckWare] = useState(false);
  const [sortType, setSortType] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  // 自定义仓库名称校验函数
  const validateRepoName = async (_rule, value) => {
    const regex = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
    if (value && !regex.test(value)) {
      return Promise.reject(new Error('仓库名称由小写字符、数字、"."和"-"组成，且仅能以字母或数字开头与结尾'));
    } else {
      return Promise.resolve();
    }
  };

  const handleDelete = async (record) => {
    setDeleteName(record.name);
    setRepoDelModalOpen(true);
  };
  function handleDelRepoCancel() {
    setDeleteName('');
    setRepoDelModalOpen(false);
    setIsRepoDelCheck(false);
  };
  const handleEdit = (record, type) => {
    form.setFieldValue('name', record.name);
    form.setFieldValue('url', record.url);
    setFormType(type);
    setOpenAdd((open) => !open);
  };

  function handleCreateWareHouse(type) {
    form.setFieldValue('name', '');
    form.setFieldValue('url', '');
    setFormType(type);
    setOpenAdd((open) => !open);
  };

  function handleCancel() {
    setOpenAdd((open) => !open);
    setIsShowWare(true);
    setIsNoneDelCheckWare(false);
    form.resetFields();
    setFormRadioWare('2');
    form.setFieldsValue({
      username: '', // 清空用户名字段
      password: '', // 清空密码字段
    });
  };

  const handleRepoCheckFn = (e) => {
    setIsRepoDelCheck(e.target.checked);
  };

  const handleSynchronization = async (repo) => {
    const timeout = 2 * 60 * 1000;
    try {
      if (!repo) {
        return;
      }
      await synchronizationHelmRepo(repo);
      checkUpdateStatus(timeout, repo);
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else if (error.response.status === ResponseCode.BadRequest && error.response.data.msg.includes('syncronizing in progress')) {
        checkUpdateStatus(timeout);
      } else {
        messageApi.error(error.response?.data.msg);
      }
    }
  };

  const checkUpdateStatus = (timeout, repo) => {
    if (!repo) {
      return;
    };
    const startTime = Date.now();
    const intervalld = setInterval(async () => {
      const currentTime = Date.now();
      if (currentTime - startTime >= timeout) {
        clearInterval(intervalld);
        messageApi.error(`${repo}同步失败`);
        return;
      };
      try {
        const res = await getsynchronizationStatus(repo);
        if (res.data.msg === 'complete') {
          messageApi.success(`${repo}仓库同步成功!`);
          clearInterval(intervalld);
        };
        if (res.data.msg === 'failed') {
          messageApi.success(`${repo}仓库同步失败!`);
          clearInterval(intervalld);
        }
      } catch (error) {
        messageApi.error(error.response?.data?.msg);
        clearInterval(intervalld);
      };
    }, 3000);
  };

  const columns = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      sorter: true,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <Link
            to={`/${containerRouterPrefix}/appMarket/stash/wareHouse/stashDetails/${record.name}`}
          >
            {record.name}
          </Link>
          <div>
            <Tooltip title='官方仓库'>
              {record.name === 'openFuyao' && <img src={authority} />}
            </Tooltip>
            <Tooltip title='本地仓库'>
              {record.name === 'local' && <img src={local} />}
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
    },
    {
      title: '操作',
      key: 'handle',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Popover
            placement='bottom'
            className='warehouseConfiguration'
            content={
              <div className='pop_modal'>
                <Button
                  type='link'
                  onClick={() => handleSynchronization(record.name)}
                  className='warehouseConfiguration'
                >
                  同步仓库
                </Button>
                <Button
                  type='link'
                  disabled={
                    record.name === 'openFuyao' || record.name === 'local'
                  }
                  onClick={() => handleEdit(record, 'edit')}
                >
                  修改
                </Button>
                <Button
                  type='text'
                  disabled={
                    record.name === 'openFuyao' || record.name === 'local'
                  }
                  className={record.name === 'openFuyao' || record.name === 'local' ? 'btn_disabled' : ''}
                  onClick={() => handleDelete(record)}
                >
                  删除
                </Button>
              </div>
            }
            trigger='click' btn_
            open={popOpen === record.name}
            onOpenChange={(newOpen) =>
              newOpen ? setPopOpen(record.name) : setPopOpen('')
            }
          >
            <MoreOutlined className='common_antd_icon primary_color warehouseConfiguration' />
          </Popover>
        </Space>
      ),
    },
  ];

  const handleChange = (page, pageSize) => {
    setCurrentPage(page);
    setLimit(pageSize);
  };

  const handleInput = (e) => {
    if (e.target.value.length >= limitSearch) {
      messageApi.error(`搜索名称不能超过${limitSearch}个字符`);
      return;
    };
    setRepoName(e.target.value);
  };

  const handleSearch = async (e) => {
    const res = await getHelmRepoList(e, '', currentPage, limit);
    setDataSource(res.data.data.items);
    setTotal(res.data.data.totalItems);
  };

  const getHelmRepoListInfo = async () => {
    const params = {
      sortType,
      sortOrder,
    };
    const res = await getHelmRepoList(repoName, sortType, currentPage, limit, sortOrder);
    setDataSource(res.data.data.items);
    setTotal(res.data.data.totalItems);
  };

  function handleChangeRadioWare(event) {
    setFormRadioWare(event.target.value);
    if (event.target.value === '1') {
      setNoneModalOpenWare(true);
    } else {
      setIsShowWare(true);
    }
  }

  const handleDelNoneWare = () => {
    setNoneModalOpenWare(false);
    setIsNoneDelCheckWare(false);
    setFormRadioWare('2');
  };

  const handleNoneCheckFnWare = (e) => {
    setIsNoneDelCheckWare(e.target.checked);
  };

  const confirmNoneFnWare = () => {
    setIsShowWare(false);
    setNoneModalOpenWare(false);
  };

  const onFinishWare = async () => {
    await form.validateFields();
    try {
      setLoading(true);
      
      // 判断URL协议
      let reg = /(?<urlPrefix>https?):\/\/[\w.]+\/?\S*/i;
      const match = reg.exec(form.getFieldsValue().url);
      if (match) {
        if (match.groups.urlPrefix === 'http') {
          setUnsafeModalOpen(true);
        } else if (match.groups.urlPrefix === 'https') {
          setCertModalOpen(true);
        }
      } else {
        handleContinueAddRepo();
      }
    } catch (error) {
      setLoading(false);
      messageApi.error(error.response?.data.msg);
    }
  };

  const handleContinueAddRepo = async () => {
    let _data = {
      name: form.getFieldsValue().name,
      url: form.getFieldsValue().url,
      username: form.getFieldsValue().username,
      password: form.getFieldsValue().password,
    };
    let encoder = new TextEncoder();
    if (formType === 'add') {
      _data = Object.assign({}, _data, {
        username: Object.values(encoder.encode(_data.username)),
        password: Object.values(encoder.encode(_data.password)),
      });
      try {
        await createHelmRepo(_data);
        messageApi.success('添加成功');
        getHelmRepoListInfo();
        setIsNoneDelCheckWare(false);
        handleCancel();
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
        } else {
          messageApi.error(error.response?.data.msg);
        }
      }
    } else {
      _data = Object.assign({}, _data, {
        username: Object.values(encoder.encode(_data.username)),
        password: Object.values(encoder.encode(_data.password)),
      });
      try {
        await updateHelmRepo(_data);
        messageApi.success('更新成功');
        getHelmRepoListInfo();
        handleCancel();
      } catch (error) {
        if (error.response.status === ResponseCode.Forbidden) {
          messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
        } else {
          messageApi.error(error.response?.data?.msg);
        }
      }
    }
    setLoading(false);
  };

  const deleteReopFn = async () => {
    try {
      const res = await deleteHelmRepo(deleteName);
      if (res.status === 200) {
        messageApi.success(`删除${deleteName}成功`);
        setRepoDelModalOpen(false);
        setIsRepoDelCheck(false);
        if (limit !== 10 || currentPage !== 1) {
          handleChange(1, 10);
        } else {
          getHelmRepoListInfo();
        }
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(error.response?.data?.message);
      }
    }
  };

  const handleUnsafeContinue = () => {
    setUnsafeModalOpen(false);
    handleContinueAddRepo();
  };

  const handleunSafeConfirm = () => {
    setUnsafeModalOpen(false);
    setLoading(false);
  };

  const handleCertCheckFn = (e) => {
    setIsCertCheckWare(e.target.checked);
  };

  const handleCertCancel = () => {
    setCertModalOpen(false);
    setIsCertCheckWare(false);
    setLoading(false);
  };

  const handleCertContinue = () => {
    setCertModalOpen(false);
    handleContinueAddRepo();
  };

  const handleChange1 = (pagination, filters, sorter) => {
    // 按照类型进行排序
    if (Object.keys(sorter).length) {
      if (sorter.field === 'name') {
        setSortType('name');
        if (sorter.order) {
          setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
        } else {
          setSortOrder('asc');
        };
      } else {
        setSortType('');
        setSortOrder('');
      };
    }
  };

  useEffect(() => {
    getHelmRepoListInfo();
  }, [repoName, currentPage, limit, sortType, sortOrder]);

  return (
    <>
      <div className='prompt' style={{ backgroundColor: themeStore.$s.theme !== 'light' && 'rgba(119,174,247, 0.12)', border: '1px solid rgab(119,174,247, 0.50)' }}>
        <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
          {contextHolder}
        </div>
        <InfoCircleFilled className='prompt-icon' />
        <span>应用仓库用于存放用户上传的应用包与扩展组件包。您也可以将自己的应用托管到openFuyao平台，在应用市场中统一进行部署和管理。</span>
      </div>
      <div style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff', margin: '0 32px' }}>
        <div className='ware_house_search'>
          <Search
            placeHolder='请输入仓库'
            style={{ width: '300px', height: '32px' }}
            onChange={handleInput}
            onSearch={handleSearch}
            maxLength={limitSearch}
          />
          <div style={{ display: 'flex', gap: '23px' }}>
            <Button className='primary_btn' onClick={() => handleCreateWareHouse('add')}>
              添加仓库
            </Button>
          </div>
        </div>
        <ConfigProvider locale={zhCN}>
          <Table
            className='table_padding'
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            onChange={handleChange1}
          />
          <Pagination
            className='page'
            showTotal={(curTotal) => `共${curTotal}条`}
            total={total}
            showSizeChanger
            showQuickJumper
            pageSize={limit}
            current={currentPage}
            pageSizeOptions={[10, 20, 50]}
            onChange={handleChange}
          ></Pagination>
        </ConfigProvider>
        <DeleteInfoModal
          title='安全风险'
          open={unsafeModalOpen}
          cancelFn={handleunSafeConfirm}
          cancelText='停止'
          content={[
            'http为不安全的通信协议，建议使用https，确定要继续吗？',
          ]}
          confirmText='继续'
          confirmFn={handleUnsafeContinue}
        />
        <Modal
          className={themeStore.$s.theme === 'dark' ? 'dark_box' : ''}
          open={openAdd}
          getContainer={false}
          title={formType === 'add' ? '添加仓库' : '修改仓库'}
          width={720}
          onCancel={handleCancel}
          footer={[
            <Button key='back' className='cancel_btn' onClick={handleCancel}> 取消</Button>,
            <Button key='submit' loading={loading} className='primary_btn' htmlType='submit' onClick={onFinishWare}>确定</Button>,
          ]}
        >
          <Form
            layout='vertical'
            form={form}
            onFinish={onFinishWare}
            name='form_in_modal'
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                minHeight: '200px',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  flexDirection: 'column',
                  display: 'flex',
                }}
              >
                <div className='form_container'>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexDirection: 'column',
                    }}
                  >
                    <Form.Item
                      name='name'
                      label='仓库名称'
                      rules={[{ required: true, message: '请输入仓库名称' }, { validator: validateRepoName }]}
                    >
                      <Input placeholder='请输入' disabled={formType === 'edit' ? true : false} />
                    </Form.Item>
                    <Form.Item name='url' label='仓库地址'
                      rules={[{ required: true, message: '请输入仓库地址' }]}
                    >
                      <Input placeholder='请输入' />
                    </Form.Item>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: '15px' }}>认证方式</div>
                  <div style={{ display: 'flex', gap: '40px' }}>
                    <Radio.Group onChange={handleChangeRadioWare} value={formRadioWare}>
                      <Radio className='custom-checkbox noneUser' value='1'>
                        NONE
                      </Radio>
                      <Radio className='custom-checkbox users' value='2'>
                        用户名/密码
                      </Radio>
                    </Radio.Group>
                  </div>
                </div>
                {isShowWare && (
                  <div
                    className='defalutClass'
                    style={{
                      marginTop: '20px',
                      gap: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Form.Item
                      style={{ width: '50%' }}
                      name='username'
                      className='defalutClass'
                      label='用户名'
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input placeholder='请输入' />
                    </Form.Item>
                    <Form.Item
                      name='password'
                      label='密码'
                      rules={[{ required: true, message: '请输入密码' }]}
                      style={{ width: '50%' }}
                    >
                      <Input.Password placeholder='请输入密码' type='password' onCopy={(event) => event.preventDefault()} />
                    </Form.Item>
                  </div>
                )}
              </div>
            </div>
          </Form>
        </Modal>
        <DeleteInfoModal
          cancelFn={handleDelRepoCancel}
          title='删除'
          open={repotDelModalOpen}
          content={[
            '删除将无法恢复，请谨慎操作。',
            `确定删除仓库 ${deleteName} 吗？`,
          ]}
          checkFn={handleRepoCheckFn}
          isCheck={isRepoDelCheck}
          showCheck={true}
          confirmFn={deleteReopFn} />
        <DeleteInfoModal
          title='安全风险'
          open={noneModalOpenWare}
          cancelFn={handleDelNoneWare}
          content={[
            '连接无用户名密码的仓库可能导致不安全后果，请谨慎操作。',
            `确定连接吗？`,
          ]}
          isCheck={isNoneDelCheckWare}
          checkboxText='我已了解风险'
          showCheck={true}
          confirmText={'确定'}
          checkFn={handleNoneCheckFnWare}
          confirmFn={confirmNoneFnWare}
        />
        <DeleteInfoModal
          title='证书配置提示'
          open={certModalOpen}
          cancelFn={handleCertCancel}
          cancelText='取消'
          content={[
            '检测到您使用 HTTPS 协议访问仓库。',
            '为确保安全连接，需要配置对应的证书。',
            '请确认已正确配置证书，否则可能无法正常访问仓库。',
          ]}
          isCheck={isCertCheckWare}
          checkboxText='我已配置证书或了解风险'
          showCheck={true}
          confirmText='继续'
          checkFn={handleCertCheckFn}
          confirmFn={handleCertContinue}
        />
      </div>
    </>
  );
}
