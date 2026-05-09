/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import '@/styles/applicationMarket/index.less';
import { ResponseCode } from '@/common/constants';
import HelmIcon from '@/assets/images/helmIcon.png';
import {
  Table,
  Button,
  Space,
  Popover,
  message,
  ConfigProvider,
  Pagination,
} from 'antd';
import { useEffect, useState, useStore } from 'openinula';
import { MoreOutlined } from '@ant-design/icons';
import {
  getAllVersionInfo,
  deleteHelmChartVersion,
  getAppointChartInfo,
} from '@/api/applicationMarketApi';
import { useLocation, useParams } from 'inula-router';
import Dayjs from 'dayjs';
import zhCN from 'antd/es/locale/zh_CN';
import CreateVersion from '@/pages/applicationMarket/component/CreateVersion';
import { containerRouterPrefix } from '@/constant';
import '@/styles/applicationMarket/index.less';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { sorterFirstAlphabet } from '@/tools/utils';

export default function PackageManagementDetail() {
  const { repo, chart } = useParams();
  const { state: { pkgDetail } } = useLocation();
  const [total, setTotal] = useState(0);
  const [popOpen, setPopOpen] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [openAdd, setOpenAdd] = useState(false);
  const [detailsInfo, setDetailsInfo] = useState(null);
  const [isRepoDelCheck, setIsRepoDelCheck] = useState(false);
  const [repotDelModalOpen, setRepoDelModalOpen] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deleteVersion, setVersion] = useState('');
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  const [current, setCurrent] = useState(1);

  const handleDelete = (record) => {
    setDeleteName(record.name);
    setVersion(record.version);
    setRepoDelModalOpen(true);
  };

  function handleDelRepoCancel() {
    setDeleteName('');
    setRepoDelModalOpen(false);
    setIsRepoDelCheck(false);
  };

  const handleRepoCheckFn = (e) => {
    setIsRepoDelCheck(e.target.checked);
  };

  const deleteReopFn = async () => {
    try {
      await deleteHelmChartVersion(deleteName, deleteVersion);
      getAllVersionInfoData();
      getAppointChartInfoDetails();
      setDeleteName('');
      setRepoDelModalOpen(false);
      setIsRepoDelCheck(false);
      messageApi.success('删除成功！');
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(error.response.message);
      }
    };
  };
  const columns = [
    {
      title: '版本',
      key: 'version',
      sorter: (a, b) => sorterFirstAlphabet(a.version, b.version),
      render: (_, record) => record.version,
    },
    {
      title: '添加时间',
      key: 'created',
      sorter: (a, b) => Dayjs(a.created) - Dayjs(b.created),
      render: (_, record) =>
        Dayjs(record.created).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'handle',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popover
            placement='bottom'
            className='packageManagementDetail'
            content={
              <div className='pop_modal'>
                <Button type='link' onClick={() => handleDelete(record)}>
                  删除
                </Button>
              </div>
            }
            trigger='click'
            open={popOpen === `${record.name}${record.created}`}
            onOpenChange={(newOpen) =>
              newOpen
                ? setPopOpen(`${record.name}${record.created}`)
                : setPopOpen('')
            }
          >
            <MoreOutlined className='common_antd_icon primary_color packageManagementDetail' />
          </Popover>
        </Space>
      ),
    },
  ];

  const handleChange = (page, pageSize) => {
    setCurrentPage(page);
    setLimit(pageSize);
  };

  const handleCreateVersion = () => {
    setOpenAdd((open) => !open);
    getAllVersionInfoData();
    getAppointChartInfoDetails();
  };

  const handleCancelVersion = () => {
    setOpenAdd((open) => !open);
  };

  const handleRefresh = () => {
    getAllVersionInfoData();
    getAppointChartInfoDetails();
    setOpenAdd((open) => !open);
  };

  const getAppointChartInfoDetails = async () => {
    const res = await getAppointChartInfo(chart);
    if (res.data.data && res.data.data.items.length) {
      setDetailsInfo((res.data.data.items)[0].metadata);
    }
  };

  const handlePageChange = (page) => {
    setCurrent(page); // 更新当前页码
  };

  const getAllVersionInfoData = async () => {
    try {
      const res = await getAllVersionInfo(repo, chart, currentPage, limit);
      const infoData = res.data.data.map((el) => el.metadata);
      infoData.sort((a, b) => sorterFirstAlphabet(a.version, b.version));
      setDataSource(infoData);
      setTotal(res.data.data.length);
    } catch (error) {
      messageApi.error(error.msg);
    };
  };

  useEffect(() => {
    getAllVersionInfoData();
  }, [repo, chart, currentPage, limit]);

  useEffect(() => {
    getAppointChartInfoDetails();
  }, [chart, repo]);

  return (
    <div className='child_content withBread_content'>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <BreadCrumbCom
        items={[
          {
            title: '仓库配置',
          },
          {
            title: '仓库',
            path: `/${containerRouterPrefix}/appMarket/stash`,
          },
          {
            title: '包详情',
          },
        ]}
      />
      <div className='package_details_header' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div>
          <img src={detailsInfo?.icon || HelmIcon} style={{ height: '48px', weight: '48px' }} />
        </div>
        <div>
          <div className='application_description' style={{ fontWeight: 'bold', fontSize: '20px', minWidth: '250px', color: themeStore.$s.theme !== 'light' && '#fff' }}>{chart}</div>
          <div style={{ minWidth: '1000px', color: themeStore.$s.theme === 'light' ? '#89939b' : '#fff', fontSize: '14px', marginTop: '12px' }}>{detailsInfo?.description || pkgDetail?.description}</div>
        </div>
      </div>
      <div style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff', margin: '0 32px' }}>
        <div className='version_management' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: themeStore.$s.theme !== 'light' && '#fff' }}>版本管理</div>
          <Button
            className='primary_btn'
            onClick={handleCreateVersion}
          >
            添加版本
          </Button>
        </div>
        <div style={{ margin: '0 32px' }}>
          <ConfigProvider locale={zhCN}>
            <Table dataSource={dataSource}
              columns={columns}
              pagination={{
                current,
                pageSizeOptions: [10, 20, 50],
                showSizeChanger: true,
                showQuickJumper: true,
                onChange: handlePageChange,
                hideOnSinglePage: dataSource.length <= 10,
                showTotal: () => `共${dataSource.length}条`,
              }} />
          </ConfigProvider>
        </div>
      </div>
      <CreateVersion
        openAdd={openAdd}
        onCancelFn={handleCancelVersion}
        onRefresh={handleRefresh}
      />
      <DeleteInfoModal
        title='删除'
        cancelFn={handleDelRepoCancel}
        open={repotDelModalOpen}
        content={[
          '删除将无法恢复，请谨慎操作。',
          `确定删除仓库 ${deleteName} 吗？`,
        ]}
        showCheck={true}
        isCheck={isRepoDelCheck}
        checkFn={handleRepoCheckFn}
        confirmFn={deleteReopFn} />
    </div>
  );
}
