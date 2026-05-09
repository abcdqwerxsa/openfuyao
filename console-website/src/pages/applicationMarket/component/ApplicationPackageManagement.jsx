/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Button, Input, message, Pagination, ConfigProvider, Tooltip } from 'antd';
import { InfoCircleFilled, QuestionCircleOutlined } from '@ant-design/icons';
import { useState, useEffect, useStore } from 'openinula';
import zhCN from 'antd/es/locale/zh_CN';
import '@/styles/applicationMarket/index.less';
import CreateApplicationPackage from '@/pages/applicationMarket/component/CreateApplicationPackage';
import {
  getHelmChartDetails,
  deleteHelmChart,
  synchronizationHelmRepo,
  getsynchronizationStatus,
} from '@/api/applicationMarketApi';
import Dayjs from 'dayjs';
import { useHistory } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import helmIcon from '@/assets/images/helmIcon.png';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import ToastMsg from '@/components/ToastMsg';

const { Search } = Input;
const limitSearch = 53;
export default function ApplicationPackageManagemen() {
  const [total, setTotal] = useState(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [packageName, setPackageName] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();

  function handleCreateWareHouse() {
    setOpenAdd((open) => !open);
  };

  const handleCancel = () => {
    getHelmChartListInfo();
    setOpenAdd((open) => !open);
  };

  const handleChange = (page, pageSize) => {
    setCurrentPage(page);
    setLimit(pageSize);
  };

  const getHelmChartListInfo = async () => {
    try {
      const res = await getHelmChartDetails(packageName, currentPage, limit);
      setDataSource(res.data.data.items);
      setTotal(res.data.data.totalItems);
    } catch (error) {
      messageApi.error(error.response?.data?.msg);
    }
  };

  const handleInput = (e) => {
    if (e.target.value.length >= limitSearch) {
      messageApi.error(`搜索名称不能超过${limitSearch}个字符`);
      return;
    };
    setPackageName(e.target.value);
  };

  const handleSearch = async (e) => {
    try {
      const res = await getHelmChartDetails(e, currentPage, limit);
      setDataSource(res.data.data.items);
      setTotal(res.data.data.totalItems);
    } catch (error) {
      messageApi.error(error.response?.data?.msg);
    }
  };

  const handleRefresh = () => {
    getHelmChartListInfo();
  };

  const checkUpdateStatus = (timeout) => {
    const startTime = Date.now();
    const intervalld = setInterval(async () => {
      const currentTime = Date.now();
      if (currentTime - startTime >= timeout) {
        clearInterval(intervalld);
        messageApi.error(`同步失败`);
        setSyncLoading(false);
        return;
      };
      try {
        const res = await getsynchronizationStatus('local');
        if (res.data.msg === 'complete') {
          getHelmChartListInfo();
          messageApi.success(`本地仓库同步成功`);
          clearInterval(intervalld);
          setSyncLoading(false);
        };
        if (res.data.msg === 'in_progress') {
          setSyncLoading(true);
        }
      } catch (error) {
        messageApi.error(error.response?.data.msg);
        clearInterval(intervalld);
        setSyncLoading(false);
      };
    }, 3000);
  };

  const handleSynchronization = async () => {
    setSyncLoading(true);
    const timeout = 5 * 60 * 1000;
    try {
      const res = await synchronizationHelmRepo('local');
      checkUpdateStatus(timeout);
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else if (error.response.status === ResponseCode.BadRequest && error.response.data.msg.includes('syncronizing in progress')) {
        setSyncLoading(true);
        checkUpdateStatus(timeout);
      } else {
        messageApi.error(error.response?.data?.msg);
      }
    }
  };
  useEffect(() => {
    getHelmChartListInfo();
  }, [currentPage, limit, packageName]);

  return (
    <div className='child_content withBread_content'>
      <ToastMsg contextHolder={contextHolder} />
      <div className='prompt' style={{ backgroundColor: themeStore.$s.theme && 'rgba(119,174,247, 0.12)', border: '1px solid rgab(119,174,247, 0.50)' }}>
        <InfoCircleFilled className='prompt-icon' />
        <span>平台以应用包形式提供应用和扩展组件。您可以添加本地应用包或扩展组件包，应用或扩展组件将会快速发布在应用市场内。</span>
      </div>
      <div style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff', margin: '20px 32px', borderRadius: '4px', paddingBottom: '126px' }}>
        <div>
          <div className='ware_house_search'>
            <Search
              placeHolder='搜索包'
              style={{ width: '300px', height: '32px' }}
              onChange={handleInput}
              onSearch={handleSearch}
              maxLength={limitSearch}
            />
            <div style={{ display: 'flex', gap: '16px' }}>
              <Button className='primary_btn' onClick={handleCreateWareHouse}>
                添加包
              </Button>
              <div>
                <Button loading={syncLoading} className='cancel_btn' onClick={handleSynchronization}>同步</Button>
                <Tooltip title='由于网络波动等原因，可能到导致操作同步不及时，请手动同步操作。'>
                  <QuestionCircleOutlined style={{ color: '#89939bff', marginLeft: '8px' }} />
                </Tooltip>
              </div>
            </div>
          </div>
          <div className='package_item_container'>
            {dataSource.map((el) => (
              <PackageItem info={el} onRefresh={handleRefresh} />
            ))}
          </div>
          <CreateApplicationPackage
            openAdd={openAdd}
            onCancelFn={handleCancel}
          />
        </div>
        {total > 10 &&
          <ConfigProvider locale={zhCN}>
            <Pagination
              className='page'
              showTotal={(curTotal) => `共${curTotal}条`}
              showSizeChanger
              showQuickJumper
              total={total}
              onChange={handleChange}
              pageSizeOptions={[10, 20, 50]}
            ></Pagination>
          </ConfigProvider>}
      </div>
    </div>
  );
}

function PackageItem({ info, onRefresh }) {
  const history = useHistory();
  const [deletePackageName, setDeletePackageName] = useState('');
  const [packageNameDelModalOpen, setPackageNameDelModalOpen] = useState(false);
  const [isPackageNameDelCheck, setIsPackageNameDelCheck] = useState(false); // 是否选中
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();
  const handleDelete = (name) => {
    setDeletePackageName(name);
    setPackageNameDelModalOpen(true);
  };

  const handleDelPackageNameConfirm = async () => {
    try {
      const res = await deleteHelmChart(deletePackageName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          onRefresh();
        }, 1000);
        setPackageNameDelModalOpen(false);
        setIsPackageNameDelCheck(false);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error(error.response?.data.msg);
      }
    };
  };

  const goToPackageDetail = () => {
    history.push(
      {
        pathname: `/${containerRouterPrefix}/appMarket/stash/packageManageDetails/${info.repo}/${info.metadata.name}`,
        state: {
          pkgDetail: info.metadata,
        },
      }
    );
  };

  const handlePackageNameeCheckFn = (e) => {
    setIsPackageNameDelCheck(e.target.checked);
  };

  const handleDelPackageNameCancel = () => {
    setDeletePackageName('');
    setIsPackageNameDelCheck(false);
    setPackageNameDelModalOpen(false);
  };

  return (
    <div className='package_item' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff', border: themeStore.$s.theme === 'light' ? '1px solid #dcdcdc' : '1px solid #444' }}>
      <ToastMsg contextHolder={contextHolder} />
      <div onClick={goToPackageDetail} style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            marginBottom: '20px',
            gap: '16px',
          }}
        >
          <div>
            <img
              src={info.metadata.icon ? info.metadata.icon : helmIcon}
              style={{ height: '48px', width: '48px' }}
              alt='暂无图标'
            />
          </div>
          <div>
            <Tooltip title={info.metadata.name}>
              <div className='fz_16 fw_bold application_title clamp_2'>{info.metadata.name}</div>
            </Tooltip>
            <div>{Dayjs(info.metadata.created).format('YYYY-MM-DD')}</div>
          </div>
        </div>
        <Tooltip title={info.metadata.description}>
          <div className='clamp_3'>{info.metadata.description}</div>
        </Tooltip>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          style={{ width: 64, backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34ff' }}
          onClick={() => handleDelete(info.metadata.name)}
        >
          删除
        </Button>
      </div>
      <DeleteInfoModal
        title="删除包"
        open={packageNameDelModalOpen}
        cancelFn={handleDelPackageNameCancel}
        content={[
          '删除包后将无法恢复，请谨慎操作。',
          `确定删除包 ${deletePackageName} 吗？`,
        ]}
        isCheck={isPackageNameDelCheck}
        showCheck={true}
        checkFn={handlePackageNameeCheckFn}
        confirmFn={handleDelPackageNameConfirm} />
    </div>
  );
}
