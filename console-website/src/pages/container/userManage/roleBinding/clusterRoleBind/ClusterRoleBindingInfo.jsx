
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
import { EditOutlined } from '@ant-design/icons';
import Dayjs from 'dayjs';
import { Tag, message } from 'antd';
import { solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import AnnotationModal from '@/components/AnnotationModal';
import { editAnnotationsOrLabels } from '@/api/containerApi';
import { ResponseCode } from '@/common/constants';
import LabelTag from '@/components/LabelTag';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function Detail({ roleBindName, roleBindDetailDataProps, refreshFn }) {
  const [roleBindDetailData, setRoleBindDetailData] = useState(roleBindDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();

  const [isClusterRoleBindDetailAnnotationModalOpen, setIsClusterRoleBindDetailAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState(roleBindDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(roleBindDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');

  // 注解成功回调
  const handleRoleBindAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsClusterRoleBindDetailAnnotationModalOpen(false);
    } else {
      const roleBindAnnKeyArr = [];
      data.map(item => roleBindAnnKeyArr.push(item.key));
      if (roleBindAnnKeyArr.filter((item, index) => roleBindAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addRoleBindAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('clusterrolebinding', '', roleBindName, addRoleBindAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsClusterRoleBindDetailAnnotationModalOpen(false);
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
  const handleRoleBindAnnotationCancel = () => {
    setIsClusterRoleBindDetailAnnotationModalOpen(false);
  };

  // 标签失败回调
  const handleRoleBindLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  // 标签成功回调
  const handleRoleBindLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const roleBindLabKeyArr = [];
      data.map(item => roleBindLabKeyArr.push(item.key));
      if (roleBindLabKeyArr.filter((item, index) => roleBindLabKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addRoleBindLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('clusterrolebinding', '', roleBindName, addRoleBindLabelList);
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

  const clusterRoleBindingBaseInfoItems = [
    { key: '角色绑定名称：', value: roleBindDetailData?.metadata?.name },
    { key: '绑定类型：', value: '集群角色绑定' },
    { key: '创建时间：', value: Dayjs(roleBindDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card clusterRoleBindDetail">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={clusterRoleBindingBaseInfoItems} columns={1} />
          <div className="annotation clusterRoleBindDetail">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={roleBindDetailData.metadata?.labels} callbackOk={handleRoleBindLabelOk} callbackCancel={handleRoleBindLabelCancel} />
            <div className="key_value">
              {roleBindDetailData.metadata?.labels?.length ?
                roleBindDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span className='clusterRoleBindDetail' style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation clusterRoleBindDetail">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsClusterRoleBindDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isClusterRoleBindDetailAnnotationModalOpen} type="annotation" dataList={roleBindDetailData?.metadata?.annotations} callbackOk={handleRoleBindAnnotationOk} callbackCancel={handleRoleBindAnnotationCancel} />
            <div className="key_value">
              {roleBindDetailData.metadata?.annotations?.length ?
                roleBindDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span className='clusterRoleBindDetail' style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}