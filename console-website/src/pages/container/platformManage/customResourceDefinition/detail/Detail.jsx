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
import { Fragment, useCallback, useState, useEffect, useStore, useMemo } from 'openinula';
import Dayjs from 'dayjs';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { CheckCircleFilled, EditOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Tag, ConfigProvider, Table, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { ResponseCode } from '@/common/constants';
import { solveAnnotationOrLabelDiff, solveCustomResourceStatus, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function Detail({ customResourceDefinitionName, customResourceDefinitionDetailDataProps, refreshFn }) {
  const [messageApi, contextHolder] = message.useMessage();
  const statusData = customResourceDefinitionDetailDataProps.status.conditions;
  const baseInfoData = customResourceDefinitionDetailDataProps.spec.versions;
  const [customResourceDefinitionDetailData, setCustomResourceDefinitionDetailData] = useState(customResourceDefinitionDetailDataProps); // 详情数据
  const [isCrDetailAnnotationModalOpen, setIsCrDetailAnnotationModalOpen] = useState(false);

  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [customResourceDefinitionStatusTabelData, setCustomResourceDefinitionStatusTableData] = useState([]); // 表数据
  const [customResourceDefinitionVersionTabelData, setCustomResourceDefinitionVersionTableData] = useState([]); // 表数据

  const [filterOptions, setFilterOptions] = useState([{ text: 'True', value: 'True' }, { text: 'False', value: 'False' }]); // 赋值筛选项
  const [customResourceDefinitionFilterStatusObj, setCustomResourceDefinitionFilterStatusObj] = useState({}); // 筛选
  const [customResourceDefinitionFilterVersionObj, setCustomResourceDefinitionFilterVersionObj] = useState({}); // 筛选

  const [oldAnnotations, setOldAnnotataions] = useState(customResourceDefinitionDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(customResourceDefinitionDetailDataProps.metadata.labels);

  const themeStore = useStore('theme');

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsCrDetailAnnotationModalOpen(false);
    } else {
      const crDetailKeyArr = [];
      data.map(item => crDetailKeyArr.push(item.key));
      if (crDetailKeyArr.filter((item, index) => crDetailKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('customresourcedefinition', '', customResourceDefinitionName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsCrDetailAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败！${error.response.data.message}`);
          }
        }
      }
    }
  };
  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsCrDetailAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const keyArr = [];
      data.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('customresourcedefinition', '', customResourceDefinitionName, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsLabelModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑标签失败！${error.response.data.message}`);
          }
        }
      }
    }
  };
  // 标签失败回调
  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const customResourceDefinitionDetailStatusColumns = [
    {
      title: '类型',
      key: 'custom_resource_type',
      sorter: (a, b) => a.type.localeCompare(b.type),
      render: (_, record) => record.type,
    },
    {
      title: '状态',
      filters: filterOptions,
      filterMultiple: false,
      key: 'customResourceStatus',
      render: (_, record) => <div className={`status_group`}>
        <span className={record.status === 'True' ? 'running_circle' : 'failed_circle'}></span>
        <span>{record.status === 'True' ? 'True' : 'False'}</span>
      </div>,
    },
    {
      title: '更新时间',
      width: '15%',
      sorter: (a, b) => Dayjs(a.lastTransitionTime) - Dayjs(b.lastTransitionTime),
      key: 'custom_resource_update_time',
      render: (_, record) => Dayjs(record.lastTransitionTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '原因',
      key: 'custom_resource_resource_reason',
      ellipsis: true,
      render: (_, record) => record.reason || '--',
    },
    {
      title: '消息',
      key: 'custom_resource_resource_message',
      ellipsis: true,
      render: (_, record) => record.message || '--',
    },
  ];

  const customResourceDefinitionDetailVersionColumns = [
    {
      title: '版本名称',
      sorter: (a, b) => a.name.length - b.name.length,
      key: 'custom_resource_version_name',
      render: (_, record) => record.name,
    },
    {
      title: '可服务',
      key: 'custom_resource_service',
      filters: filterOptions,
      filterMultiple: false,
      render: (_, record) => <div className={`status_group`}>
        <span>{record.served ? 'True' : 'False'}</span>
      </div>,
    },
    {
      title: '存储',
      key: 'custom_resource_session',
      filters: filterOptions,
      filterMultiple: false,
      render: (_, record) => <div className={`status_group`}>
        <span>{record.storage ? 'True' : 'False'}</span>
      </div>,
    },
  ];

  const getCustomResourceDefinitionDetailStatusTableData = useCallback(async () => {
    let _status = '';
    if (Object.keys(customResourceDefinitionFilterStatusObj).length !== 0) {
      const [customResourceStatus, ...resets] = customResourceDefinitionFilterStatusObj.customResourceStatus ? customResourceDefinitionFilterStatusObj.customResourceStatus : '';
      _status = customResourceStatus; // 获取筛选框
    }
    let statusTableList = [];
    if (_status) {
      statusData.map(item => {
        if (item.status === _status) {
          statusTableList.push(item);
        }
      });
    } else {
      statusTableList = statusData;
    }
    setCustomResourceDefinitionStatusTableData([...statusTableList]);
  }, [customResourceDefinitionFilterStatusObj]);

  const getCustomResourceDefinitionDetailVersionTableData = useCallback(async () => {
    let _service = '';
    let _session = '';
    let filterKeyArr = Object.keys(customResourceDefinitionFilterVersionObj);
    if (filterKeyArr.length !== 0) {
      if (filterKeyArr.includes('custom_resource_service')) {
        _service = customResourceDefinitionFilterVersionObj.custom_resource_service ? customResourceDefinitionFilterVersionObj.custom_resource_service[0] : ''; // 获取筛选框
      }
      if (filterKeyArr.includes('custom_resource_session')) {
        _session = customResourceDefinitionFilterVersionObj.custom_resource_session ? customResourceDefinitionFilterVersionObj.custom_resource_session[0] : ''; // 获取筛选框
      }
    }
    let versionTableList = [];
    if (_service && !_session) {
      baseInfoData.map(item => {
        if (item.served === (_service === 'True')) {
          versionTableList.push(item);
        }
      });
    }
    if (_session && !_service) {
      baseInfoData.map(item => {
        if (item.storage === (_session === 'True')) {
          versionTableList.push(item);
        }
      });
    }
    if (_session && _service) {
      baseInfoData.map(item => {
        if (item.storage === (_session === 'True') && item.served === (_service === 'True')) {
          versionTableList.push(item);
        }
      });
    }
    (!_service && !_session) && (versionTableList = baseInfoData);
    setCustomResourceDefinitionVersionTableData([...versionTableList]);
  }, [customResourceDefinitionFilterVersionObj]);

  // 表格变化
  const handleCustomResourceDefinitionVersionTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setCustomResourceDefinitionFilterVersionObj(filter);
      }
    },
    []
  );

  // 表格变化
  const handleCustomResourceDefinitionStatusTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setCustomResourceDefinitionFilterStatusObj(filter);
      }
    },
    []
  );

  useEffect(() => {
    // 获取详情
    getCustomResourceDefinitionDetailStatusTableData();
    getCustomResourceDefinitionDetailVersionTableData();
  }, [getCustomResourceDefinitionDetailStatusTableData, getCustomResourceDefinitionDetailVersionTableData]);

const baseInfoItems = useMemo(() => {
  return [
    { key: '资源名称：', value: customResourceDefinitionDetailData?.metadata.name },
    { key: '最新版本：', value: customResourceDefinitionDetailData?.spec.versions ? customResourceDefinitionDetailData.spec.versions[0].name : '--' },
    { key: '建立：', value: solveCustomResourceStatus(customResourceDefinitionDetailData?.status.conditions) ? <CheckCircleFilled style={{ color: '#09aa71' }} /> : <ExclamationCircleFilled style={{ color: '#e7434a' }} /> },
    { key: '范围：', value: customResourceDefinitionDetailData?.spec.scope || '--' },
    { key: '创建时间：', value: Dayjs(customResourceDefinitionDetailData?.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];
}, [customResourceDefinitionDetailData]);
  
  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={baseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={customResourceDefinitionDetailData?.metadata.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {customResourceDefinitionDetailData.metadata?.labels?.length ?
                customResourceDefinitionDetailData.metadata.labels.map(item =>
                  <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsCrDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isCrDetailAnnotationModalOpen} type="annotation" dataList={customResourceDefinitionDetailData?.metadata.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {customResourceDefinitionDetailData.metadata?.annotations?.length ?
                customResourceDefinitionDetailData.metadata.annotations.map(item =>
                  <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add">
        <h3>状态信息</h3>
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            style={{ paddingRight: '0px' }}
            dataSource={customResourceDefinitionStatusTabelData}
            columns={customResourceDefinitionDetailStatusColumns}
            pagination={{
              className: 'page',
              style: { paddingRight: '0px' },
              showTotal: total => `共${total}条`,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
            }}
            onChange={handleCustomResourceDefinitionStatusTableChange}
          />
        </ConfigProvider>
      </div>
      <div className="detail_card container_card_add">
        <h3>版本信息</h3>
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            style={{ paddingRight: '0px' }}
            dataSource={customResourceDefinitionVersionTabelData}
            columns={customResourceDefinitionDetailVersionColumns}
            pagination={{
              className: 'page',
              style: { paddingRight: '0px' },
              showTotal: total => `共${total}条`,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
            }}
            onChange={handleCustomResourceDefinitionVersionTableChange}
          />
        </ConfigProvider>
      </div>
    </div>
  </Fragment>;
}