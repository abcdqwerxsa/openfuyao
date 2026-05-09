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
import { EditOutlined, InfoCircleFilled } from '@ant-design/icons';
import { ConfigProvider, Tag, message, Table, Space } from 'antd';
import AnnotationModal from '@/components/AnnotationModal';
import { editIngressLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
import ToastMsg from '@/components/ToastMsg';

export default function Detail({ ingressDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);

  const [messageApi, contextHolder] = message.useMessage();

  const [ingressDetailInfoData, setIngressDetailData] = useState(ingressDetailDataProps); // 详情数据

  const [oldAnnotations, setOldAnnotations] = useState(ingressDetailDataProps.metadata.annotations); // 未修改前注解

  const [oldLabels, setOldLabels] = useState(ingressDetailDataProps.metadata.labels);

  const [ingressRuleTabelData, setIngressRuleTabelData] = useState([]); // 规则表

  const [ingressDetailInfoLoading, setIngressDetailInfoLoading] = useState(false); // 加载中

  // 标签对话框展示
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  // 注解对话框展示
  const [isIngressAnnotationModalOpen, setIsIngressAnnotationModalOpen] = useState(false);

  const [ingressDetailInfoSortObj, setIngressDetailInfoSortObj] = useState({}); // 排序

  const themeStore = useStore('theme');

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
          const res = await editIngressLabelOrAnnotation(ingressDetailInfoData.metadata.namespace, ingressDetailInfoData.metadata.name, addLabelList);
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
      setIsIngressAnnotationModalOpen(false);
    } else {
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editIngressLabelOrAnnotation(ingressDetailInfoData.metadata.namespace, ingressDetailInfoData.metadata.name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsIngressAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          } else {
            messageApi.error(`编辑注解失败!${error.response.data.message}`);
          }
        }
      }
    }
  };

  // 注解失败回调
  const handleAnnotationCancel = () => {
    setIsIngressAnnotationModalOpen(false);
  };

  // 表格变化
  const handleIngressDetailInfoTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'sort') {
        setIngressDetailInfoSortObj({ key: _sorter.columnKey, order: _sorter.order });
      }
    },
    []
  );

  const ingressDetailInfoColumns = [
    {
      title: '主机',
      key: 'host',
      // sorter: true,
      // sortOrder: ingressDetailInfoSortObj.order,
      render: (_, record) => (
        <Space size="middle">
          {record.host ? record.host : '--'}
        </Space>
      ),
    },
    {
      title: '路径',
      key: 'path',
      render: (_, record) => (
        <Space size="middle">
          {record.http.paths ? record.http.paths[0].path : '--'}
        </Space>
      ),
    },
    {
      title: '路径类型',
      key: 'type',
      render: (_, record) => (
        <Space size="middle">
          {record.http.paths ? record.http.paths[0].pathType : '--'}
        </Space>
      ),
    },
    {
      title: '服务',
      key: 'service',
      render: (_, record) => (
        <Space size="middle">
          {record.http.paths ? record.http.paths[0].backend.service.name : '--'}
        </Space>
      ),
    },
    {
      title: '服务端口',
      key: 'port',
      render: (_, record) => (
        <Space size="middle">
          {record.http.paths ? record.http.paths[0].backend.service.port.number : '--'}
        </Space>
      ),
    },
  ];

  const getIngressDetailInfoTableList = useCallback(() => {
    setIngressDetailInfoLoading(true);
    let data = ingressDetailInfoData.spec.rules ? ingressDetailInfoData.spec.rules : [];
    setIngressRuleTabelData(data);
    setIngressDetailInfoLoading(false);
  }, [ingressDetailInfoSortObj]);

  useEffect(() => {
    // 获取详情
    getIngressDetailInfoTableList();
  }, [getIngressDetailInfoTableList]);

  const ingressBaseInfoItems = [
    {
      key: 'ingressName',
      value: ingressDetailInfoData?.metadata.name,
      description: 'Ingress名称',
    },
    {
      key: 'namespace',
      value: ingressDetailInfoData?.metadata.namespace,
      description: '命名空间',
    },
    {
      key: 'creationTimestamp',
      value: Dayjs(ingressDetailInfoData?.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
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
            <DetailBaseInfoList items={ingressBaseInfoItems} columns={1} />
            <div className="annotation">
              <div className="ann_title">
                <p>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isLabelModalOpen} type="label" dataList={ingressDetailInfoData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
              <div className="key_value">
                {ingressDetailInfoData.metadata?.labels?.length ?
                  ingressDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsIngressAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isIngressAnnotationModalOpen} type="annotation" dataList={ingressDetailInfoData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
              <div className="key_value">
                {ingressDetailInfoData.metadata?.annotations?.length ?
                  ingressDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="net-detail-table-box">
          <h3>Ingress规则</h3>
          <div className='hint'>
            <InfoCircleFilled className='hint_icon' />
            <span className='hint_text'>Ingress定义了允许入站连接到达后端定义的端点的规则合集</span>
          </div>
          <div className="net-detail-table">
            <ConfigProvider locale={zhCN}>
              <Table style={{ paddingRight: '0px' }} loading={ingressDetailInfoLoading} dataSource={ingressRuleTabelData} columns={ingressDetailInfoColumns}
                pagination={{
                  className: 'page',
                  pageSizeOptions: [10, 20, 50],
                }}
                onChange={handleIngressDetailInfoTableChange} />
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}