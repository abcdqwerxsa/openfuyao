/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Fragment, useCallback, useEffect, useState, useStore, useMemo } from 'openinula';
import { ResponseCode } from '@/common/constants';
import Dayjs from 'dayjs';
import { EditOutlined, InfoCircleFilled } from '@ant-design/icons';
import { ConfigProvider, Tag, message, Table, Space } from 'antd';
import AnnotationModal from '@/components/AnnotationModal';
import { editPvLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
import '@/styles/pages/podDetail.less';

export default function PvInfo({ pvDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const [pvDetailInfoData, setPvDetailData] = useState(pvDetailDataProps);

  const [oldAnnotations, setOldAnnotations] = useState(pvDetailDataProps.metadata?.annotations ?? []);

  const [oldLabels, setOldLabels] = useState(pvDetailDataProps.metadata?.labels ?? []);

  const themeStore = useStore('theme');

  const [isPvLabelModalOpen, setIsPvLabelModalOpen] = useState(false);
  const [isPvAnnotationModalOpen, setIsPvAnnotationModalOpen] = useState(false);

  const handlePvLabelOk = async (data) => {
    const pvLabKeyArr = [];
    data.map(item => pvLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsPvLabelModalOpen(false);
    } else {
      if (pvLabKeyArr.filter((item, index) => pvLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editPvLabelOrAnnotation(pvDetailInfoData.metadata.name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsPvLabelModalOpen(false);
            }, 1000);
          }
        } catch (e) {
          if (e.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, e);
          } else {
            messageApi.error(`编辑标签失败！${e.response.data.message}`);
          }
        }
      }
    }
  };

  const handlePvLabelCancel = () => {
    setIsPvLabelModalOpen(false);
  };

  const handlePvAnnotationOk = async (data) => {
    const pvAnnKeyArr = [];
    data.map(item => pvAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsPvAnnotationModalOpen(false);
    } else {
      if (pvAnnKeyArr.filter((item, index) => pvAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editPvLabelOrAnnotation(pvDetailInfoData.metadata.name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsPvAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (e) {
          if (e.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, e);
          } else {
            messageApi.error(`编辑注解失败！${e.response.data.message}`);
          }
        }
      }
    }
  };

  const handlePvAnnotationCancel = () => {
    setIsPvAnnotationModalOpen(false);
  };

  const pvBaseInfoItems = useMemo(() => {
    const p = pvDetailInfoData;
    return [
      { key: '名称：', value: p?.metadata?.name },
      { key: '创建时间：', value: Dayjs(p?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
      { key: '状态：', value: p?.status?.phase },
      { key: '回收策略：', value: p?.spec?.persistentVolumeReclaimPolicy },
      { key: '容量：', value: p?.spec?.capacity?.storage },
      { key: '访问模式：', value: p?.spec?.accessModes },
      { key: '存储池名称：', value: p?.spec?.storageClassName },
      { key: '绑定数据卷声明：', value: p?.spec?.claimRef?.name },
    ];
  }, [pvDetailInfoData]);

  return <Fragment>
    {contextHolder}
    <div className={`tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card" style={{ padding: '32px 32px 0 32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div>
          <h3>基本信息</h3>
          <div className="detail_info_box">
            <DetailBaseInfoList items={pvBaseInfoItems} columns={2} />
            <div className="annotation">
              <div className="ann_title">
                <p>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvLabelModalOpen} type="label" dataList={pvDetailInfoData?.metadata?.labels} callbackOk={handlePvLabelOk} callbackCancel={handlePvLabelCancel} />
              <div className="key_value">
                {pvDetailInfoData.metadata?.labels?.length ?
                  pvDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvAnnotationModalOpen} type="annotation" dataList={pvDetailInfoData?.metadata?.annotations} callbackOk={handlePvAnnotationOk} callbackCancel={handlePvAnnotationCancel} />
              <div className="key_value">
                {pvDetailInfoData.metadata?.annotations?.length ?
                  pvDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Fragment>;
}
