/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useCallback, useEffect, useState, useStore } from 'openinula';
import { ResponseCode } from '@/common/constants';
import Dayjs from 'dayjs';
import { EditOutlined } from '@ant-design/icons';
import { ConfigProvider, Tag, message, Table, Space } from 'antd';
import AnnotationModal from '@/components/AnnotationModal';
import { editServiceLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
import ToastMsg from '@/components/ToastMsg';

export default function Detail({ serviceDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);

  const [messageApi, contextHolder] = message.useMessage();

  const [serviceDetailInfoData, setServiceDetailInfoData] = useState(serviceDetailDataProps); // 详情数据

  const [oldAnnotations, setOldAnnotations] = useState(serviceDetailDataProps.metadata.annotations); // 未修改前注解

  const [oldLabels, setOldLabels] = useState(serviceDetailDataProps.metadata.labels);

  const [servicePortMappingTabelData, setServicePortMappingTabelData] = useState([]); // 服务端口映射表

  const [serviceDetailInfoLoading, setServiceDetailInfoLoading] = useState(false);

  const themeStore = useStore('theme');

  // 标签对话框展示
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  // 注解对话框展示
  const [isServiceAnnotationModalOpen, setIsServiceAnnotationModalOpen] = useState(false);

  const [serviceDetailInfoSortObj, setServiceDetailInfoSortObj] = useState({}); // 排序

  // 标签成功回调
  const handleLabelOk = async (data) => {
    const keyArr = [];
    data.map(item => keyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editServiceLabelOrAnnotation(serviceDetailInfoData.metadata.namespace, serviceDetailInfoData.metadata.name, addLabelList);
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
            messageApi.error(`编辑标签失败!${error.response.data.message}`);
          }
        }
      }
    }
  };

  // 标签失败回调
  const handleLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    const keyArr = [];
    data.map(item => keyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsServiceAnnotationModalOpen(false);
    } else {
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editServiceLabelOrAnnotation(serviceDetailInfoData.metadata.namespace, serviceDetailInfoData.metadata.name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsServiceAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`删除失败!${error.response.data.message}`);
          }
        }
      }
    }
  };

  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsServiceAnnotationModalOpen(false);
  };

  // 表格变化
  const handleServiceDetailInfoTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'sort') {
        setServiceDetailInfoSortObj({ key: _sorter.columnKey, order: _sorter.order });
      }
    },
    []
  );

  // 列表项
  const serviceDetailInfoColumns = [
    {
      title: '名称',
      key: 'serviceInfo_name',
      // sorter: true,
      // sortOrder: serviceDetailInfoSortObj.order,
      render: (_, record) => (
        <Space size="middle">
          {record.name ? record.name : '--'}
        </Space>
      ),
    },
    {
      title: '端口',
      key: 'serviceInfo_pod',
      render: (_, record) => (
        <Space size="middle">
          {record.port ? record.port : '--'}
        </Space>
      ),
    },
    {
      title: '协议',
      key: 'serviceInfo_protocol',
      render: (_, record) => (
        <Space size="middle">
          {record.protocol ? record.protocol : '--'}
        </Space>
      ),
    },
    {
      title: 'Pod端口或名称',
      key: 'serviceInfo_portOrName',
      render: (_, record) => (
        <Space size="middle">
          {record.targetPort ? record.targetPort : '--'}
        </Space>
      ),
    },
  ];

  const getServiceDetailInfoTableList = useCallback(async () => {
    setServiceDetailInfoLoading(true);
    let data = serviceDetailDataProps.spec?.ports ? serviceDetailDataProps.spec.ports : [];
    setServicePortMappingTabelData(data);
    setServiceDetailInfoLoading(false);
  }, [serviceDetailInfoSortObj]);

  useEffect(() => {
    getServiceDetailInfoTableList();
  }, [getServiceDetailInfoTableList]);

  const serviceBaseInfoItems = [
    {
      key: 'serviceName',
      value: serviceDetailInfoData?.metadata.name,
      description: 'Service名称',
    },
    {
      key: 'namespace',
      value: serviceDetailInfoData?.metadata.namespace,
      description: '命名空间',
    },
    {
      key: 'creationTimestamp',
      value: Dayjs(serviceDetailInfoData?.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
      description: '创建时间',
    },
  ];

  return <Fragment>
    <ToastMsg contextHolder={contextHolder} />
    <div className={`net_tab_container container_margin_box ${isShow ? 'net_tooltip_container_height' : 'net_normal_container_height'}`}>
      <div className="detail_card net-detail-card" style={{ padding: '32px 32px 0 32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div>
          <h3>基本信息</h3>
          <div className="detail_info_box">
            <DetailBaseInfoList items={serviceBaseInfoItems} columns={1} />
            <div className="annotation">
              <div className="ann_title">
                <p>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isLabelModalOpen} type="label" dataList={serviceDetailInfoData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
              <div className="key_value">
                {serviceDetailInfoData.metadata?.labels?.length ?
                  serviceDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>

            <div className="annotation">
              <div className="ann_title">
                <p>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsServiceAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isServiceAnnotationModalOpen} type="annotation" dataList={serviceDetailInfoData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
              <div className="key_value">
                {serviceDetailInfoData.metadata?.annotations?.length ?
                  serviceDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="net-detail-table-box">
          <h3>服务端口映射</h3>
          <div className="net-detail-table">
            <ConfigProvider locale={zhCN}>
              <Table style={{ paddingRight: '0px' }} loading={serviceDetailInfoLoading} dataSource={servicePortMappingTabelData} columns={serviceDetailInfoColumns}
                pagination={{
                  className: 'page',
                  pageSizeOptions: [10, 20, 50],
                }}
                onChange={handleServiceDetailInfoTableChange} />
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}