
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


export default function ClusterRoleInfo({ roleName, roleDetailDataProps, refreshFn }) {
  const [roleDetailData, setRoleDetailData] = useState(roleDetailDataProps); // 详情数据
  const [messageApi, contextHolder] = message.useMessage();

  const [isClusterRoleDetailAnnotationModalOpen, setIsClusterRoleDetailAnnotationModalOpen] = useState(false);
  const [isClusterRoleLabelModalOpen, setIsClusterRoleLabelModalOpen] = useState(false);
  const [oldAnnotations, setOldAnnotataions] = useState(roleDetailDataProps.metadata.annotations);
  const [oldLabels, setOldLabels] = useState(roleDetailDataProps.metadata.labels);
  const themeStore = useStore('theme');

  // 注解成功回调
  const handleClusterRoleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsClusterRoleDetailAnnotationModalOpen(false);
    } else {
      const clusterDetailKeyArr = [];
      data.map(item => clusterDetailKeyArr.push(item.key));
      if (clusterDetailKeyArr.filter((item, index) => clusterDetailKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('clusterrole', '', roleName, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn();
              setIsClusterRoleDetailAnnotationModalOpen(false);
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
  const handleClusterRoleAnnotationCancel = () => {
    setIsClusterRoleDetailAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleClusterRoleLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsClusterRoleLabelModalOpen(false);
    } else {
      const ClusterRolekeyArr = [];
      data.map(item => ClusterRolekeyArr.push(item.key));
      if (ClusterRolekeyArr.filter((item, index) => ClusterRolekeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addClusterRoleLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('clusterrole', '', roleName, addClusterRoleLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              refreshFn();
              setIsClusterRoleLabelModalOpen(false);
            }, 1000);
          }
        } catch (error) {
          if (error.response.status === ResponseCode.Forbidden) {
            forbiddenMsg(messageApi, error);
          }
          messageApi.error(`编辑标签失败！${error.response.data.message}`);
        }
      }
    }
  };

  // 标签失败回调
  const handleClusterRoleLabelCancel = () => {
    setIsClusterRoleLabelModalOpen(false);
  };

  const clusterRoleBaseInfoItems = [
    { key: '角色名称：', value: roleDetailData?.metadata?.name },
    { key: '角色类型：', value: roleDetailData?.kind },
    { key: '创建时间：', value: Dayjs(roleDetailData?.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm') },
  ];

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`tab_container container_margin_box normal_container_height`}>
      <div className="detail_card cluster_role_card1">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={clusterRoleBaseInfoItems} columns={2} />
          <div className="annotation cluster_role_card1_lab">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsClusterRoleLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isClusterRoleLabelModalOpen} type="label" dataList={roleDetailData.metadata?.labels} callbackOk={handleClusterRoleLabelOk} callbackCancel={handleClusterRoleLabelCancel} />
            <div className="key_value">
              {roleDetailData.metadata?.labels?.length ?
                roleDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation cluster_role_card1_ann">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsClusterRoleDetailAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isClusterRoleDetailAnnotationModalOpen} type="annotation" dataList={roleDetailData?.metadata?.annotations} callbackOk={handleClusterRoleAnnotationOk} callbackCancel={handleClusterRoleAnnotationCancel} />
            <div className="key_value">
              {roleDetailData.metadata?.annotations?.length ?
                roleDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Fragment>;
}