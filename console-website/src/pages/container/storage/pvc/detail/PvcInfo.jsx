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
import { editPvcLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
import '@/styles/pages/podDetail.less';

export default function PvcInfo({ pvcDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);

  const [messageApi, contextHolder] = message.useMessage();

  const [pvcDetailInfoData, setPvcDetailData] = useState(pvcDetailDataProps);

  const [oldAnnotations, setOldAnnotations] = useState(pvcDetailDataProps.metadata?.annotations ?? []);

  const [oldLabels, setOldLabels] = useState(pvcDetailDataProps.metadata?.labels ?? []);

  const [isPvcLabelModalOpen, setIsPvcLabelModalOpen] = useState(false);
  const [isPvcAnnotationModalOpen, setIsPvcAnnotationModalOpen] = useState(false);

  const themeStore = useStore('theme');

  const handlePvcLabelOk = async (data) => {
    const pvcLabKeyArr = [];
    data.map(item => pvcLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsPvcLabelModalOpen(false);
    } else {
      if (pvcLabKeyArr.filter((item, index) => pvcLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addPvcLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editPvcLabelOrAnnotation(pvcDetailInfoData.metadata.namespace, pvcDetailInfoData.metadata.name, addPvcLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsPvcLabelModalOpen(false);
            }, 1000);
          }
        } catch (pvce) {
          if (pvce.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, pvce);
          } else {
            messageApi.error(`编辑标签失败！${pvce.response.data.message}`);
          }
        }
      }
    }
  };

  const handlePvcLabelCancel = () => {
    setIsPvcLabelModalOpen(false);
  };

  const handlePvcAnnotationOk = async (data) => {
    const pvcAnnKeyArr = [];
    data.map(item => pvcAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsPvcAnnotationModalOpen(false);
    } else {
      if (pvcAnnKeyArr.filter((item, index) => pvcAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addPvcAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editPvcLabelOrAnnotation(pvcDetailInfoData.metadata.namespace, pvcDetailInfoData.metadata.name, addPvcAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsPvcAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (pvce) {
          if (pvce.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, pvce);
          } else {
            messageApi.error(`编辑注解失败！${pvce.response.data.message}`);
          }
        }
      }
    }
  };

  const handlePvcAnnotationCancel = () => {
    setIsPvcAnnotationModalOpen(false);
  };

  const pvcBaseInfoItems = useMemo(() => {
    const p = pvcDetailInfoData;
    return [
      { key: '名称：', value: p?.metadata?.name },
      { key: '创建时间：', value: Dayjs(p?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
      { key: '状态：', value: p?.status?.phase },
      { key: '命名空间：', value: p?.metadata?.namespace },
      { key: '容量：', value: p?.spec?.resources?.requests?.storage },
      { key: '访问模式：', value: p?.spec?.accessModes },
      { key: '关联存储池：', value: p?.spec?.storageClassName },
    ];
  }, [pvcDetailInfoData]);

  return <Fragment>
    {contextHolder}
    <div className={`tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card" style={{ padding: '32px 32px 0 32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div>
          <h3>基本信息</h3>
          <div className="detail_info_box">
            <DetailBaseInfoList items={pvcBaseInfoItems} columns={2} />
            <div className="annotation">
              <div className="ann_title">
                <p>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvcLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvcLabelModalOpen} type="label" dataList={pvcDetailInfoData?.metadata?.labels} callbackOk={handlePvcLabelOk} callbackCancel={handlePvcLabelCancel} />
              <div className="key_value">
                {pvcDetailInfoData.metadata?.labels?.length ?
                  pvcDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPvcAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isPvcAnnotationModalOpen} type="annotation" dataList={pvcDetailInfoData?.metadata?.annotations} callbackOk={handlePvcAnnotationOk} callbackCancel={handlePvcAnnotationCancel} />
              <div className="key_value">
                {pvcDetailInfoData.metadata?.annotations?.length ?
                  pvcDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Fragment>;
}
