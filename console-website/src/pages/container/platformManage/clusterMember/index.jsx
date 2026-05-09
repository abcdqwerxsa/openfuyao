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
import { Button, Form, Space, Input, Popover, Table, ConfigProvider, message, Modal, Select } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import '@/styles/pages/nodeManage.less';
import { useCallback, useEffect, useState, useStore } from 'openinula';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import { Link, useHistory } from 'inula-router';
import zhCN from 'antd/es/locale/zh_CN';
import { sorterFirstAlphabet } from '@/tools/utils';
import { getInvitedClusterMemberList, editWaitInviteClusterMemberList, getClusterRoleList, inviteMemberRole, deleteClusterUser } from '@/api/clusterApi';
import InvitedModal from './invitedModal';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import NoPermissions from '@/components/NoPermissions';
import { filterRepeat } from '@/utils/common';
export default function ClusterMember() {
  const themeStore = useStore('theme');
  const [clusterForm] = Form.useForm();
  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();
  const [clusterMemberPage, setClusterMemberPage] = useState(DEFAULT_CURRENT_PAGE);
  const [editRole, setEditRole] = useState('');
  const [roleOption, setRoleOption] = useState();
  const [clusterMemberListData, setClusterMemberListData] = useState(); // table
  const [clusterMemberLoading, setClusterMemberLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [clusterMemberDelModalOpen, setClusterMemberDelModalOpen] = useState(false); // 删除对话框展示
  const [clusterMemberEditModalOpen, setClusterMemberEditModalOpen] = useState(false); // 修改角色对话框展示
  const [clusterMemberEditName, setClusterMemberEditName] = useState(''); // 编辑的名称
  const [clusterMemberDelName, setClusterMemberDelName] = useState(''); // 删除的名称
  const [originalList, setOriginalList] = useState([]); // 原始数据
  const [isresetInvite, setIsresetInvite] = useState(false);
  const [isMemberDelCheck, setIsMemberDelCheck] = useState(false); // 是否选中
  const [isShowNopermission, setIsShowNopermission] = useState(false);
  const [filterMemberValue, setFilterMemberValue] = useState();
  const [filterMemberOption, setFilterMemberOption] = useState([]);
  // 列表项       
  const clusterMemberColumns = [
    {
      title: '成员名称',
      key: 'member_name',
      sorter: (a, b) => sorterFirstAlphabet(a.Username, b.Username),
      render: (_, record) => record.Username || '--',
    },
    {
      title: '角色',
      key: 'member_user',
      filters: filterMemberOption,
      filterMultiple: false,
      filteredValue: filterMemberValue ? [filterMemberValue] : [],
      sorter: (a, b) => sorterFirstAlphabet(a.ClusterRole, b.ClusterRole),
      onFilter: (value, record) => record.ClusterRole.toLowerCase() === value.toLowerCase(),
      render: (_, record) => record.ClusterRole || '--',
    },
    {
      title: '操作',
      key: 'namespace_handle',
      fixed: 'right',
      width: 120,
      render: (_, record) => <Space>
        <Popover placement='bottom' content={<div className='pop_modal'>
          <Button type='link' onClick={() => handleOpenEdit(record)}>修改角色</Button>
          <Button type='link' onClick={() => handleOpenDelete(record.Username)}>移除</Button></div>
        } trigger='click' open={popOpen === record.Username} onOpenChange={newOpen => newOpen ? setPopOpen(record.Username) : setPopOpen('')}>
          <MoreOutlined className='common_antd_icon primary_color' />
        </Popover>
      </Space>,
    },
  ];
  const [isNoInivtedModalOpen, setIsNoInvitedModalOpen] = useState(false);
  const cancelInvited = () => {
    setIsNoInvitedModalOpen(false);
    setIsresetInvite(true);
  };
  const handleClickInvitedModel = () => {
    setIsNoInvitedModalOpen(true);
  };
  const getInvitedListData = useCallback(async (isChange = true) => {
    setClusterMemberLoading(false);
    try {
      const res = await getInvitedClusterMemberList();
      if (res.status === ResponseCode.OK) {
        if (res.data.Data && res.data.Data.length > 0) {
          setOriginalList([...res.data.Data]);
        } else {
          setOriginalList([]);
        }
      }
      handleSearchClusterName(res.data.Data, isChange); // 先搜索
    } catch (error) {
      if (error.response?.status === ResponseCode.Forbidden) {
        setIsShowNopermission(true);
      }
      if (error.response?.status === ResponseCode.NotFound) {
        setClusterMemberListData([]); // 数组为空
      }
    }
    setClusterMemberLoading(false);
  }, []);

  // 删除按钮
  const handleOpenDelete = (data) => {
    // 隐藏气泡框
    setPopOpen('');
    setClusterMemberDelModalOpen(true); // 打开弹窗
    setClusterMemberDelName(data);
  };
  // 编辑按钮
  const handleOpenEdit = (data) => {
    // 隐藏气泡框
    setPopOpen('');
    setEditRole(data.ClusterRole);
    setClusterMemberEditModalOpen(true); // 打开弹窗
    setClusterMemberEditName(data.Username);
  };

  const handleCancelDelete = () => {
    setClusterMemberDelModalOpen(false);
    setIsMemberDelCheck(false);
    setClusterMemberDelName('');
  };

  const handleClusterMemberTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setFilterMemberValue(filter.member_user);
      }
    },
    []
  );

  const handleDelMember = async () => {
    try {
      setIsresetInvite(false);
      const res = await deleteClusterUser(clusterMemberDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success(`移除${clusterMemberDelName}成员成功！`);
        setClusterMemberDelModalOpen(false);
        setClusterMemberDelName('');
        setIsMemberDelCheck(false);
        setIsresetInvite(true);
        getInvitedListData();
      }
    } catch (e) {
      messageApi.error(`移除${clusterMemberDelName}成员失败，原因：${e.response?.data.Msg}!`);
    }
  };

  const handleCancelEdit = () => {
    setClusterMemberEditModalOpen(false);
    setClusterMemberEditName('');
    setEditRole('');
  };
  const handleEditMember = async () => {
    try {
      const res = await editWaitInviteClusterMemberList(clusterMemberEditName, editRole);
      if (res.status === ResponseCode.OK) {
        messageApi.success(`编辑${clusterMemberEditName}成员成功！`);
        setClusterMemberEditModalOpen(false);
        setClusterMemberEditName('');
        setEditRole('');
        getInvitedListData();
      }
    } catch (e) {
      messageApi.error(`编辑${clusterMemberEditName}成员失败！`);
    }
  };
  const handleSelectRole = (value) => {
    setEditRole(value);
  };
  const handleClickNoinvitedData = (data) => {
    let count = 0;
    data.map(async item => {
      const res = await inviteMemberRole(item.member, item.role);
      setIsresetInvite(false);
      if (res.status === ResponseCode.OK) {
        messageApi.success(`邀请${item.member}成员成功！`);
        count++;
      } else {
        count++;
        messageApi.error(`邀请${item.member}成员失败！`);
      }
      if (count === data.length) {
        setIsresetInvite(true);
        getInvitedListData();
        setIsNoInvitedModalOpen(false);
        count = 0;
      }
    });
  };

  // 检索
  const handleSearchClusterName = (totalData = originalList, isChange = true) => {
    const memberFormName = clusterForm.getFieldValue('memebr_name');
    let temporyList = totalData;
    if (memberFormName) {
      temporyList = temporyList.filter(item => (item.Username).toLowerCase().includes(memberFormName.toLowerCase()));
    }
    setClusterMemberListData(temporyList);
    let arr = [];
    temporyList.map(item => {
      arr.push({ text: item.ClusterRole, value: item.ClusterRole });
    });
    setFilterMemberOption(filterRepeat(arr));
    isChange ? setClusterMemberPage(DEFAULT_CURRENT_PAGE) : null;
  };
  const handleMemberCheckFn = (e) => {
    setIsMemberDelCheck(e.target.checked);
  };
  const getRoleOption = async () => {
    const res = await getClusterRoleList();
    let option = [];
    if (res.status === ResponseCode.OK) {
      res.data.Data.map(item => {
        option.push({
          label: item.metadata.name,
          value: item.metadata.name,
        });
      });
    }
    setRoleOption(option);
  };
  useEffect(() => {
    getRoleOption();
  }, []);

  useEffect(() => {
    getInvitedListData();
  }, [getInvitedListData]);

  return <div className='child_content withBread_content'>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    {isShowNopermission ? '' : <BreadCrumbCom className='create_bread' items={[{ title: '集群成员', path: `/`, disabled: true }]} />}
    {isShowNopermission ? < NoPermissions /> :
      <div className="container_margin_box" style={{ display: 'flex', flexDirection: 'column' }}>
        <Form className="searchForm form_padding_bottom" form={clusterForm}>
          <Form.Item name="memebr_name" className="search_input">
            <Input.Search placeholder="搜索成员名称" onSearch={() => handleSearchClusterName()} autoComplete="off" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button className='primary_btn' onClick={handleClickInvitedModel}>邀请</Button>
            </Space>
          </Form.Item>
        </Form>
        <div className='tab_table_flex cluster_container_height'>
          <ConfigProvider locale={zhCN}>
            <Table
              className='table_padding'
              loading={clusterMemberLoading}
              onChange={handleClusterMemberTableChange}
              columns={clusterMemberColumns}
              dataSource={clusterMemberListData}
              pagination={{
                className: 'page',
                current: clusterMemberPage,
                showTotal: (total) => `共${total}条`,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: [10, 20, 50],
                onChange: page => setClusterMemberPage(page),
              }}
              scroll={{ x: 1280 }}
            />
          </ConfigProvider>
        </div>
        <InvitedModal isresetInvited={isresetInvite} isShowModel={isNoInivtedModalOpen}
          submitNoinvitedModel={handleClickNoinvitedData} cancelEdit={cancelInvited} />
        <DeleteInfoModal
          title="移除成员"
          open={clusterMemberDelModalOpen}
          cancelFn={handleCancelDelete}
          content={[
            '移除用户后将会失去对应角色权限。',
            `确定移除 ${clusterMemberDelName} 吗？`,
          ]}
          showCheck={true}
          confirmText={'移除'}
          isCheck={isMemberDelCheck}
          checkFn={handleMemberCheckFn}
          confirmFn={handleDelMember} />
        <Modal title="修改角色" getContainer={false} width={682} height={270} open={clusterMemberEditModalOpen} onOk={handleEditMember} onCancel={handleCancelEdit}
          footer={[
            <Button onClick={handleCancelEdit} className='cancel_btn'>
              取消
            </Button>,
            <Button className='primary_btn' onClick={handleEditMember}>
              确定
            </Button>,
          ]}>
          <p style={{ margin: '10px 0 8px', color: '#666 ' }}>角色</p>
          <Select style={{ width: '100%' }} value={editRole} options={roleOption} onChange={handleSelectRole} />
        </Modal>
      </div>
    }

  </div>;
}