/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useState, useStore, useEffect } from 'openinula';
import Dayjs from 'dayjs';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { EditOutlined } from '@ant-design/icons';
import { Tag, ConfigProvider, Table, message } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { ResponseCode } from '@/common/constants';
import { solveAnnotationOrLabelDiff, solveLimitTableList, forbiddenMsg } from '@/tools/utils';
import { solveLimitRangeRate } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
export default function Detail({ limitRangeName, limitRangeNamespace, limitRangeDetailDataProps, refreshFn }) {
  const [limitRangeDetailData, setLimitRangeDetailData] = useState(limitRangeDetailDataProps);
  const [messageApi, contextHolder] = message.useMessage();
  const [isLimitDetailAnnotationModalOpen, setIsLimitDetailAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [limitRangeTabelData, setLimitRangeTableData] = useState(solveLimitTableList(limitRangeDetailDataProps.spec.limits)); // 表数据
  const [oldAnnotations, setOldAnnotataions] = useState(limitRangeDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(limitRangeDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsLimitDetailAnnotationModalOpen(false);
    } else {
      const limitRangeDetailkeyArr = [];
      data.map(item => limitRangeDetailkeyArr.push(item.key));
      if (limitRangeDetailkeyArr.filter((item, index) => limitRangeDetailkeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('limitrange', limitRangeNamespace, limitRangeName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsLimitDetailAnnotationModalOpen(false);
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
    setIsLimitDetailAnnotationModalOpen(false);
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
          const res = await editAnnotationsOrLabels('limitrange', limitRangeNamespace, limitRangeName, addLabelList);
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

  const limitRangeDetailColumns = [
    {
      title: '类型',
      key: 'limit_type',
      render: (_, record) => record.type,
    },
    {
      title: '资源',
      key: 'limit_resource',
      ellipsis: true,
      render: (_, record) => record.resource,
    },
    {
      title: '最小',
      width: '15%',
      key: 'limit_smallest',
      render: (_, record) => record.min ? record.min : '--',
    },
    {
      title: '最大',
      width: '15%',
      key: 'limit_biggest',
      render: (_, record) => record.max ? record.max : '--',
    },
    {
      title: '默认请求',
      key: 'limit_request',
      render: (_, record) => record.defaultRequest || '--',
    },
    {
      title: '默认限制',
      key: 'limit',
      render: (_, record) => record.default || '--',
    },
    {
      title: '最大限制/请求比率',
      key: 'biggeset_limitOrRequest',
      render: (_, record) => solveLimitRangeRate(record.default, record.defaultRequest) || '--',
    },
  ];

  const limitRangeBaseInfoItems = [
    { key: '限制范围名称：', value: limitRangeDetailData?.metadata?.name },
    { key: '命名空间：', value: limitRangeDetailData?.metadata?.namespace },
    { key: '创建时间：', value: Dayjs(limitRangeDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={limitRangeBaseInfoItems} columns={1} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={limitRangeDetailData?.metadata.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {limitRangeDetailData.metadata?.labels?.length ?
                limitRangeDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLimitDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isLimitDetailAnnotationModalOpen} type="annotation" dataList={limitRangeDetailData?.metadata.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {limitRangeDetailData.metadata?.annotations?.length ?
                limitRangeDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add">
        <h3>限制</h3>
        <ConfigProvider locale={zhCN}>
          <Table className="table_padding"
            style={{ paddingRight: '0px' }}
            dataSource={limitRangeTabelData}
            columns={limitRangeDetailColumns}
            pagination={{
              className: 'page',
              pageSizeOptions: [10, 20, 50],
              style: { paddingRight: '0px' },
              showSizeChanger: true,
              showTotal: total => `共${total}条`,
            }} />
        </ConfigProvider>
      </div>
    </div>
  </Fragment>;
}