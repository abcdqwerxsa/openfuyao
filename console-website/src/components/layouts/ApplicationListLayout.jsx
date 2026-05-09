/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
 *       http://license.coscl.org.cn/MulanPSL2
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */

import BreadCrumbCom from '@/components/BreadCrumbCom';
import { Button, Form, Space, Input, Table, ConfigProvider, Popover, message, Tooltip } from 'antd';
import { SyncOutlined, MoreOutlined, CloseCircleFilled, CheckCircleFilled, LoadingOutlined, QuestionCircleFilled, ExclamationCircleFilled } from '@ant-design/icons';
import { useCallback, useStore, useEffect, useState, useContext } from 'openinula';
import { DEFAULT_CURRENT_PAGE, manageStatusFilterOptions } from '@/common/constants';
import { getHelmsData, getHelmHistoryVersionData, rollBackHelmVersion, deleteRelease } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import { Link, useHistory, useLocation } from 'inula-router';
import { containerRouterPrefix } from '@/constant.js';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import ApplicationBackModal from '@/components/layouts/ApplicationBackModal';
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';
import { filterManageState } from '@/utils/common';
import defaultIcon from '@/assets/images/helmIcon.png';
import '@/styles/pages/helm.less';
import { NamespaceContext } from '@/namespaceContext';
import Dayjs from 'dayjs';
import ToolTipComponent from '@/components/ToolTipComponent';
import { sorterFirstAlphabet } from '@/tools/utils';
import ToastMsg from '@/components/ToastMsg';

/**
 * Application/Extension List Layout Component
 *
 * @param {Object} props
 * @param {'application'|'extension'} props.type - Type: 'application' or 'extension'
 * @param {Array} props.extraColumns - Extra columns for extension (e.g., plugin toggle column)
 * @param {React.ReactNode} props.pluginStore - Plugin store for extension
 */
export default function ApplicationListLayout({ type = 'application', extraColumns = [], pluginStore }) {
  const isExtension = type === 'extension';

  // Text configuration based on type
  const textConfig = {
    breadcrumbTitle: isExtension ? '扩展组件管理' : '应用管理',
    searchPlaceholder: isExtension ? '搜索扩展组件名称' : '搜索应用名称',
    tableName: isExtension ? '扩展组件名称' : '应用名称',
    tooltipDesc: isExtension
      ? '扩展组件应用是通过自定义的前端提供扩展功能，您可以通过helm chart进行快速部署，并能便捷地进行升级、回退、启停前端界面和卸载等操作。'
      : 'Helm应用是通过helm chart进行快速部署的应用实例，您可以便捷地进行升级、回退和卸载等操作。',
    uninstallTitle: isExtension ? '卸载扩展组件' : '卸载应用',
    uninstallConfirm: isExtension ? '确定卸载扩展组件' : '确定卸载应用',
  };

  // Route configuration based on type
  const routePrefix = isExtension ? 'extendManage' : 'applicationManageHelm';

  const [form] = Form.useForm();
  const history = useHistory();
  const location = useLocation();
  const nowNamespace = useContext(NamespaceContext);

  const [originalList, setOriginalList] = useState([]);
  const [filterValue, setFilterValue] = useState();
  const [filterStatus, setFilterStatus] = useState([]);

  const [messageApi, contextHolder] = message.useMessage();
  const [page, setPage] = useState(DEFAULT_CURRENT_PAGE);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popOpen, setPopOpen] = useState('');

  // Uninstall modal state
  const [uninstallModal, setUninstallModal] = useState(false);
  const [uninstallName, setUninstallName] = useState('');
  const [uninstallNamespace, setUninstallNamespace] = useState('');
  const [isUninstallCheck, setIsUninstallCheck] = useState(false);
  const [onceClick, setOnceClick] = useState(false);

  // Rollback modal state
  const [backModal, setBackModal] = useState(false);
  const [backName, setBackName] = useState('');
  const [backAppVersion, setBackAppVersion] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [releaseHistoryList, setReleaseHistoryList] = useState([]);
  const [checkedNameSpace, setCheckedNameSpace] = useState('');
  const [checkedName, setCheckedName] = useState('');
  const [checkedVersion, setCheckedVersion] = useState(1);

  // Extension specific state
  const [uninstallLoading, setUninstallLoading] = useState(false);
  const [uninstallStatusList, setUninstallStatusList] = useState({});
  const [checkList, setCheckList] = useState({});

  const themeStore = useStore('theme');

  // Reset button
  const handleReset = () => {
    getList(false);
  };

  // Upgrade button
  const handleUpgrade = (record) => {
    history.push(`/${containerRouterPrefix}/${routePrefix}/${record.namespace}/${record.name}/upgrade`);
  };

  // Uninstall button
  const handleUninstall = (record) => {
    setPopOpen('');
    setUninstallModal(true);
    setUninstallName(record.name);
    setUninstallNamespace(record.namespace);
  };

  // Confirm uninstall
  const handleConfirmUninstall = async () => {
    setOnceClick(true);
    if (isExtension) {
      setUninstallLoading(true);
      let map = uninstallStatusList;
      map[uninstallName] = true;
      setUninstallStatusList({ ...map });
    }

    try {
      const res = await deleteRelease(uninstallNamespace, uninstallName);
      if (res.status === ResponseCode.OK) {
        if (isExtension) {
          setUninstallLoading(false);
          let map = uninstallStatusList;
          map[uninstallName] = false;
          setUninstallStatusList({ ...map });
          messageApi.open({
            duration: 10,
            content: (
              <div className='extend_customize_message'>
                <CheckCircleFilled className='extend_customize_message_icon' />
                <p className='extend_customize_context'>扩展组件{uninstallName}卸载成功</p>
                <p className='extend_customize_operate' onClick={() => window.location.reload()}>点击刷新</p>
              </div>
            ),
          });
        } else {
          messageApi.success('卸载成功');
        }
        setUninstallModal(false);
        setIsUninstallCheck(false);
        getList();
        setOnceClick(false);
      }
    } catch (error) {
      if (isExtension) {
        setUninstallLoading(false);
        let map = uninstallStatusList;
        map[uninstallName] = false;
        setUninstallStatusList({ ...map });
      }
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      }
      setOnceClick(false);
    }
  };

  // Cancel uninstall modal
  const handleCancelModal = () => {
    if (isExtension) {
      let map = uninstallStatusList;
      if (map[uninstallName]) {
        messageApi.loading('卸载中...');
      } else {
        setIsUninstallCheck(false);
        map[uninstallName] = false;
        setUninstallStatusList({ ...map });
      }
    } else {
      setIsUninstallCheck(false);
    }
    setUninstallModal(false);
  };

  // Uninstall checkbox
  const handleUninstallCheckFn = (e) => {
    setIsUninstallCheck(e.target.checked);
    if (isExtension) {
      let map = checkList;
      map[uninstallName] = e.target.checked;
      setCheckList({ ...map });
    }
  };

  // Rollback button
  const handleRollback = (record) => {
    setPopOpen('');
    setBackModal(true);
    setBackName(record.name);
    setBackAppVersion(record.chart.metadata.appVersion);
    setCurrentVersion(record.version);
    getHistoryVersionList(record.namespace, record.name);
  };

  // Confirm rollback
  const handleConfirmRollback = async () => {
    try {
      const res = await rollBackHelmVersion(checkedNameSpace, checkedName, checkedVersion);
      if (res.status === ResponseCode.OK) {
        messageApi.success('回退版本成功');
        setBackModal(false);
        getList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        messageApi.error('操作失败，当前用户没有操作权限，请联系管理员添加权限!');
      } else {
        messageApi.error('回退版本失败');
      }
      setBackModal(false);
    }
  };

  // Cancel rollback modal
  const handleCancelRollbackModal = () => {
    setBackModal(false);
  };

  // Get history version list
  const getHistoryVersionList = useCallback(async (namespace, releaseName) => {
    try {
      const res = await getHelmHistoryVersionData(namespace, releaseName);
      if (res.status === ResponseCode.OK) {
        const arrList = res.data.data.map((item, index) => ({
          ...item,
          key: index + 1,
        }));
        setReleaseHistoryList(arrList);
      }
    } catch (e) {
      setReleaseHistoryList([]);
    }
  }, []);

  // Row selection for rollback
  const rowSelection = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setCheckedNameSpace(selectedRows[0].namespace);
      setCheckedVersion(selectedRows[0].version);
      setCheckedName(selectedRows[0].name);
    },
    getCheckboxProps: (record) => ({
      name: record.version,
      disabled: currentVersion === record.version,
    }),
  };

  // Status icon filter
  const stateIconFilter = (state) => {
    if (state === '部署成功') {
      return <CheckCircleFilled className={`${isExtension ? 'extend' : 'helm'}_state_successful`} />;
    } else if (state === '部署失败') {
      return <CloseCircleFilled className={`${isExtension ? 'extend' : 'helm'}_state_failed`} />;
    } else if (state === '未知') {
      return <QuestionCircleFilled className={`${isExtension ? 'extend' : 'helm'}_state_unknown`} />;
    } else if (state === '卸载中') {
      return <ExclamationCircleFilled className={`${isExtension ? 'extend' : 'helm'}_state_unknown`} />;
    } else {
      return <LoadingOutlined className={`${isExtension ? 'extend' : 'helm'}_state_pending`} />;
    }
  };

  // Table columns
  const columns = [
    {
      title: textConfig.tableName,
      key: 'name',
      dataIndex: 'name',
      sorter: (a, b) => sorterFirstAlphabet(a.name, b.name),
      render: (_, record) => (
        <Space size="middle">
          <div className={`${isExtension ? 'extend' : 'helm'}_name`}>
            {record.chart.metadata.icon ? (
              <img
                src={record.chart.metadata.icon}
                alt=""
                style={{ height: '34px', width: '34px', marginRight: '8px' }}
                onError={(e) => e.target.src = defaultIcon}
              />
            ) : (
              <img src={defaultIcon} alt="" style={{ height: '34px', width: '34px', marginRight: '8px' }} />
            )}
            <Link to={`/${containerRouterPrefix}/${routePrefix}/${record.namespace}/${record.name}`}>
              {record.name}
            </Link>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'state',
      filters: filterStatus,
      filteredValue: filterValue ? [filterValue] : [],
      filterMultiple: false,
      sorter: (a, b) => sorterFirstAlphabet(filterManageState(a.info.status), filterManageState(b.info.status)),
      onFilter: (value, record) => filterManageState(record.info.status).toLowerCase() === value.toLowerCase(),
      render: (_, record) => (
        <Space size="middle">
          <span>{stateIconFilter(filterManageState(record.info.status))}</span>
          <span className={`${isExtension ? 'extend' : 'helm'}_state_margin`}>
            {filterManageState(record.info.status)}
          </span>
        </Space>
      ),
    },
    ...extraColumns,
    {
      title: '更新时间',
      key: 'update_time',
      sorter: (a, b) => Dayjs(a.info.lastDeployed) - Dayjs(b.info.lastDeployed),
      render: (_, record) => (
        <Space size="middle">
          {Dayjs(record.info.lastDeployed).format('YYYY-MM-DD HH:mm')}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'handle',
      render: (_, record) => (
        <Space>
          <Popover
            placement="bottom"
            content={
              <div className="pop_modal">
                <Button type="link" onClick={() => handleUpgrade(record)}>升级</Button>
                <Button type="link" onClick={() => handleRollback(record)}>回退</Button>
                <Button type="link" onClick={() => handleUninstall(record)}>卸载</Button>
              </div>
            }
            trigger="click"
            open={popOpen === `${record.name}_${record.namespace}`}
            onOpenChange={(newOpen) => newOpen ? setPopOpen(`${record.name}_${record.namespace}`) : setPopOpen('')}
          >
            <MoreOutlined className="common_antd_icon primary_color" />
          </Popover>
        </Space>
      ),
    },
  ];

  // Rollback table columns
  const backColumns = [
    {
      title: '应用模板',
      width: '20%',
      key: 'name',
      ellipsis: true,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip placement="bottom" title={record.chartName}>
            <p className={currentVersion === record.version ? 'now_version' : ''}>{record.chartName}</p>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '序号',
      key: 'version',
      ellipsis: true,
      render: (_, record) => (
        <Space size="middle" className={`${isExtension ? 'defaultExtendIndexClass' : 'defaultHelmIndexClass'}`}>
          <p className={currentVersion === record.version ? 'now_version' : ''}>{record.version}</p>
          {currentVersion === record.version && (
            <div className="back_version_disable">
              <span className={`back_version_disable_font ${isExtension ? 'defaultExtendIndexClass' : 'defaultHelmIndexClass'}`}>当前版本</span>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'chart',
      ellipsis: true,
      width: '25%',
      key: 'chart',
      render: (_, record) => (
        <Space size="middle" className={`${isExtension ? 'defaultExtendIndexClass' : 'defaultHelmIndexClass'}`}>
          <Tooltip placement="bottom" title={`${record.chartName}-${record.chartVersion}`}>
            <p className={currentVersion === record.version ? 'now_version' : ''}>
              {record.chartName}-{record.chartVersion}
            </p>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'createTime',
      width: '25%',
      ellipsis: true,
      render: (_, record) => (
        <Space size="middle" className={`${isExtension ? 'defaultExtendIndexClass' : 'defaultHelmIndexClass'}`}>
          <p className={currentVersion === record.version ? 'now_version' : ''}>
            {Dayjs(record.lastDeployed).format('YYYY-MM-DD HH:mm')}
          </p>
        </Space>
      ),
    },
  ];

  // Get list data
  const getList = useCallback(async (isChange = true) => {
    setLoading(true);
    try {
      // Extension uses true, Application uses false
      const res = await getHelmsData(isExtension);
      if (res.status === ResponseCode.OK) {
        setOriginalList(res.data?.data?.items ? [...res.data.data.items] : []);
        handleSearch(res.data.data.items, isChange);
      }
    } catch (e) {
      if (e.response?.data?.code === ResponseCode.NotFound) {
        setList([]);
      }
    }
    setLoading(false);
  }, [isExtension]);

  // Search handler
  const handleSearch = (totalData = originalList, isChange = true) => {
    const searchName = form.getFieldValue(isExtension ? 'extend_name' : 'helm_name');
    let tempList = totalData || [];
    if (searchName) {
      tempList = tempList.filter(item =>
        (item.name).toLowerCase().includes(searchName.toLowerCase())
      );
    }
    setList([...tempList]);
    if (isChange) setPage(DEFAULT_CURRENT_PAGE);
  };

  // Table change handler
  const handleTableChange = useCallback(
    (_pagination, filter, _sorter, extra) => {
      if (extra.action === 'filter') {
        setFilterValue(filter.state);
      }
    },
    []
  );

  useEffect(() => {
    getList();
  }, [getList]);

  useEffect(() => {
    if (location?.state?.status) {
      setFilterValue([location.state.status.toLowerCase()]);
      window.history.replaceState(null, '');
    }
  }, [location]);

  useEffect(() => {
    const statusArr = manageStatusFilterOptions.map(item => ({
      text: item,
      value: item,
    }));
    setFilterStatus([...statusArr]);
  }, []);

  // CSS class names based on type
  const containerClass = isExtension ? 'extend_all' : '';
  const tabTopClass = isExtension ? 'extend-tab-top' : 'helm-tab-top';
  const tabContainerClass = isExtension ? 'extend-tab-container' : 'helm-tab-container';
  const searchFormClass = isExtension ? 'extend-searchForm' : 'helm-searchForm';
  const searchInputClass = isExtension ? 'extend-search-input' : 'helm-search-input';

  return (
    <div className={`child_content withBread_content overview ${containerClass}`}>
      <ToastMsg contextHolder={contextHolder} />
      <div className={tabTopClass}>
        <BreadCrumbCom
          className="create_bread"
          items={[{ title: textConfig.breadcrumbTitle, path: `/${containerRouterPrefix}/${routePrefix}` }]}
        />
      </div>
      <ToolTipComponent>
        <span>{textConfig.tooltipDesc}</span>
      </ToolTipComponent>
      <div
        className={tabContainerClass}
        style={isExtension ? { backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' } : {}}
      >
        <Form className={`${searchFormClass} form_padding_bottom`} form={form}>
          <Form.Item name={isExtension ? 'extend_name' : 'helm_name'} className={searchInputClass}>
            <Input.Search
              placeholder={textConfig.searchPlaceholder}
              onSearch={() => handleSearch()}
              autoComplete="off"
              maxLength={53}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                icon={<SyncOutlined />}
                onClick={handleReset}
                className="reset_btn"
                style={{ marginLeft: '16px' }}
              />
            </Space>
          </Form.Item>
        </Form>
        <div
          className="tab_table_flex"
          style={isExtension ? { backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' } : {}}
        >
          <ConfigProvider locale={zhCN}>
            <Table
              className="table_padding"
              loading={loading}
              columns={columns}
              dataSource={list}
              onChange={handleTableChange}
              pagination={{
                className: 'page',
                current: page,
                showTotal: (total) => `共${total}条`,
                showSizeChanger: true,
                showQuickJumper: true,
                pageSizeOptions: [10, 20, 50],
                onChange: (p) => setPage(p),
              }}
            />
          </ConfigProvider>
        </div>
        <DeleteInfoModal
          title={textConfig.uninstallTitle}
          open={uninstallModal}
          cancelFn={handleCancelModal}
          confirmText="卸载"
          content={[
            '卸载后将无法恢复，请谨慎操作。',
            `${textConfig.uninstallConfirm} ${uninstallName} 吗？`,
          ]}
          isCheck={isExtension ? checkList[uninstallName] : isUninstallCheck}
          showCheck={true}
          onceClick={onceClick}
          confirmBtnStatus={isExtension ? uninstallStatusList[uninstallName] : undefined}
          checkFn={handleUninstallCheckFn}
          confirmFn={handleConfirmUninstall}
        />
        <ApplicationBackModal
          title="应用回退"
          open={backModal}
          name={backName}
          version={backAppVersion}
          dataSource={releaseHistoryList}
          cancelFn={handleCancelRollbackModal}
          tableColumns={backColumns}
          confirmFn={handleConfirmRollback}
          rowSelection={rowSelection}
        />
      </div>
    </div>
  );
}