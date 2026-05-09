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
import { editScLabelOrAnnotation } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';
import '@/styles/pages/podDetail.less';

export default function ScInfo({ scDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const [scDetailInfoData, setScDetailData] = useState(scDetailDataProps);

  const [oldAnnotations, setOldAnnotations] = useState(scDetailDataProps.metadata?.annotations ?? []);

  const [oldLabels, setOldLabels] = useState(scDetailDataProps.metadata?.labels ?? []);

  const [isScLabelModalOpen, setIsScLabelModalOpen] = useState(false);
  const [isScAnnotationModalOpen, setIsScAnnotationModalOpen] = useState(false);

  const themeStore = useStore('theme');

  const handleScLabelOk = async (data) => {
    const scLabKeyArr = [];
    data.map(item => scLabKeyArr.push(item.key));
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsScLabelModalOpen(false);
    } else {
      if (scLabKeyArr.filter((item, index) => scLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addScLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editScLabelOrAnnotation(scDetailInfoData.metadata.name, addScLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsScLabelModalOpen(false);
            }, 1000);
          }
        } catch (scError) {
          if (scError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, scError);
          } else {
            messageApi.error(`编辑标签失败！${scError.response.data.message}`);
          }
        }
      }
    }
  };

  const handleScLabelCancel = () => {
    setIsScLabelModalOpen(false);
  };

  const handleScAnnotationOk = async (data) => {
    const scAnnKeyArr = [];
    data.map(item => scAnnKeyArr.push(item.key));
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsScAnnotationModalOpen(false);
    } else {
      if (scAnnKeyArr.filter((item, index) => scAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addScAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editScLabelOrAnnotation(scDetailInfoData.metadata.name, addScAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsScAnnotationModalOpen(false);
            }, 1000);
          }
        } catch (scError) {
          if (scError.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, scError);
          } else {
            messageApi.error(`编辑注解失败！${scError.response.data.message}`);
          }
        }
      }
    }
  };

  const handleScAnnotationCancel = () => {
    setIsScAnnotationModalOpen(false);
  };

  const getScVolumeExpansionData = (type) => {
    let backType = '--';
    switch (type) {
      case true:
        backType = '是';
        break;
      case false:
        backType = '否';
        break;
      default:
        backType = '--';
        break;
    }
    return backType;
  };

  const scBaseInfoItems = useMemo(() => {
    const s = scDetailInfoData;
    return [
      { key: '名称：', value: s?.metadata?.name },
      { key: '创建时间：', value: Dayjs(s?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
      { key: '回收策略：', value: s?.reclaimPolicy },
      { key: '卷绑定模式：', value: s?.volumeBindingMode },
      { key: '存储提供者：', value: s?.provisioner },
      {
        key: '是否允许卷扩展：',
        value: s?.allowVolumeExpansion ? getScVolumeExpansionData(s.allowVolumeExpansion) : undefined,
      },
    ];
  }, [scDetailInfoData]);

  return <Fragment>
    {contextHolder}
    <div className={`tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card" style={{ padding: '32px 32px 0 32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div>
          <h3>基本信息</h3>
          <div className="detail_info_box">
            <DetailBaseInfoList items={scBaseInfoItems} columns={2} />

            <div className="annotation">
              <div className="ann_title">
                <p>标签：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsScLabelModalOpen(true)} />
              </div>
              <AnnotationModal open={isScLabelModalOpen} type="label" dataList={scDetailInfoData?.metadata?.labels} callbackOk={handleScLabelOk} callbackCancel={handleScLabelCancel} />
              <div className="key_value">
                {scDetailInfoData.metadata?.labels?.length ?
                  scDetailInfoData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
            <div className="annotation">
              <div className="ann_title">
                <p>注解：</p>
                <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsScAnnotationModalOpen(true)} />
              </div>
              <AnnotationModal open={isScAnnotationModalOpen} type="annotation" dataList={scDetailInfoData?.metadata?.annotations} callbackOk={handleScAnnotationOk} callbackCancel={handleScAnnotationCancel} />
              <div className="key_value">
                {scDetailInfoData.metadata?.annotations?.length ?
                  scDetailInfoData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                  <span style={{ marginTop: '13px' }}>0个</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Fragment>;
}
