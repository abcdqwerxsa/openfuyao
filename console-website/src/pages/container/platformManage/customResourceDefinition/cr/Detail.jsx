/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useCallback, useState, useEffect, useStore, useMemo } from 'openinula';
import Dayjs from 'dayjs';
import AnnotationModal from '@/components/AnnotationModal';
import { editResourceExampleAnnotationOrlabels } from '@/api/containerApi';
import { EditOutlined } from '@ant-design/icons';
import { Tag, ConfigProvider, Table, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { ResponseCode } from '@/common/constants';
import { solveAnnotationOrLabelDiff, solveDecodePath, forbiddenMsg } from '@/tools/utils';
import { useParams } from 'inula-router';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function Detail({ resourceExampleName, prefixObjProps, resourceExampleDetailDataProps, refreshFn }) {
  const { customResourceName } = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const statusData = resourceExampleDetailDataProps.status?.conditions || [];
  const [resourceExampleDetailData, setResourceExampleDetailData] = useState(resourceExampleDetailDataProps); // 详情数据
  const [isCrAnnotationModalOpen, setIsCrAnnotationModalOpen] = useState(false);
  // 对话框展示
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [resourceExampleStatusTabelData, setResourceExampleStatusTableData] = useState([]); // 表数据
  const [resourceExampleVersionTabelData, setResourceExampleVersionTableData] = useState([]); // 表数据

  const [filterOptions, setFilterOptions] = useState([{ text: 'True', value: 'True' }, { text: 'False', value: 'False' }]); // 赋值筛选项
  const [resourceExampleFilterStatusObj, setResourceExampleFilterStatusObj] = useState({}); // 筛选

  const [oldAnnotations, setOldAnnotataions] = useState(resourceExampleDetailDataProps.metadata?.annotations);
  const [oldLabels, setOldLabels] = useState(resourceExampleDetailDataProps.metadata?.labels);
  const themeStore = useStore('theme');
  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsCrAnnotationModalOpen(false);
    } else {
      const crKeyArr = [];
      data.map(item => crKeyArr.push(item.key));
      if (crKeyArr.filter((item, index) => crKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editResourceExampleAnnotationOrlabels(prefixObjProps, resourceExampleName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsCrAnnotationModalOpen(false);
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
    setIsCrAnnotationModalOpen(false);
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
          const res = await editResourceExampleAnnotationOrlabels(prefixObjProps, resourceExampleName, addLabelList);
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

  const resourceExampleDetailStatusColumns = [
    {
      title: '类型',
      key: 'custom_resource_type',
      sorter: (a, b) => a.type.length - b.type.length,
      render: (_, record) => record.type,
    },
    {
      title: '状态',
      filters: filterOptions,
      filterMultiple: false,
      onFilter: (value, record) => value === (record.status === 'True' ? 'True' : 'False'),
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

  const getResourceExampleDetailStatusTableData = useCallback(async () => {
    let _status = '';
    if (Object.keys(resourceExampleFilterStatusObj).length !== 0) {
      const { customResourceStatus, ...resets } = resourceExampleFilterStatusObj.customResourceStatus ? customResourceStatus : '';
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
    setResourceExampleStatusTableData([...statusTableList]);
  }, [resourceExampleFilterStatusObj]);

  // 表格变化
  const handleResourceExampleStatusTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setResourceExampleFilterStatusObj(filter);
      }
    },
    []
  );

  useEffect(() => {
    // 获取详情
    getResourceExampleDetailStatusTableData();
  }, [getResourceExampleDetailStatusTableData]);

  const baseInfoItems = useMemo(() => {
    return [
      { key: '实例名称：', value: resourceExampleDetailData?.metadata.name },
      { key: '自定义资源定义：', value: solveDecodePath(customResourceName) },
      { key: '创建时间：', value: Dayjs(resourceExampleDetailData?.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm') },
    ];
  }, [resourceExampleDetailData]);

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={baseInfoItems} columns={1} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={resourceExampleDetailData?.metadata.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {resourceExampleDetailData.metadata?.labels?.length ?
                resourceExampleDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsCrAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isCrAnnotationModalOpen} type="annotation" dataList={resourceExampleDetailData?.metadata.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {resourceExampleDetailData.metadata?.annotations?.length ?
                resourceExampleDetailData.metadata.annotations.map(item =>
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
            dataSource={resourceExampleStatusTabelData}
            columns={resourceExampleDetailStatusColumns}
            pagination={{
              className: 'page',
              style: { paddingRight: '0px' },
              showTotal: total => `共${total}条`,
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
            }}
            onChange={handleResourceExampleStatusTableChange}
          />
        </ConfigProvider>
      </div>
    </div>
  </Fragment>;
}