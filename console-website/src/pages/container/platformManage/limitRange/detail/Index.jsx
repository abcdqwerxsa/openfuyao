/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
 *
 *       http://license.coscl.org.cn/MulanPSL2
 *
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import Detail from '@/pages/container/platformManage/limitRange/detail/Detail';
import LimitRangeDetailYaml from '@/pages/container/platformManage/limitRange/detail/LimitRangeDetailYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getLimitRange, deleteLimitRange, editAnnotationsOrLabels } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import ToastMsg from '@/components/ToastMsg';

export default function LimitRangeDetail() {
  const { namespace, name, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [limitRangeDelModalOpen, setLimitRangeDelModalOpen] = useState(false);
  const [isLimitRangeDelCheck, setIsLimitRangeDelCheck] = useState(false);
  const [detailLoded, setDetailLoded] = useState(false);

  const [limitRangeDetailTabKey, setLimitRangeDetailTabKey] = useState(activeKey || 'info');

  const [limitRangeDetailData, setLimitRangeDetailData] = useState({});

  const [limitRangePopOpen, setLimitRangePopOpen] = useState(false);
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [oldAnnotations, setOldAnnotataions] = useState();
  const [oldLabels, setOldLabels] = useState();

  const [limitRangeYaml, setLimitRangeYaml] = useState('');
  const [isReadyOnly, setIsReadyOnly] = useState(true);

  const themeStore = useStore('theme');

  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  const handleLimitRangePopOpenChange = (open) => {
    setLimitRangePopOpen(open);
  };

  const handleSetLimitRangeDetailTabKey = (key) => {
    setLimitRangeDetailTabKey(key);
    setIsReadyOnly(true);
  };

  const handleDeleteLimitRange = () => {
    setLimitRangePopOpen(false);
    setLimitRangeDelModalOpen(true);
  };

  const handleDelpLimitRangeCancel = () => {
    setLimitRangeDelModalOpen(false);
  };

  const handleDelLimitRangeConfirm = async () => {
    try {
      const res = await deleteLimitRange(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setLimitRangeDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/namespace/limitRange`);
        }, 2000);
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };

  const handleLimitRangeCheckFn = (e) => {
    setIsLimitRangeDelCheck(e.target.checked);
  };

  const getLimitRangeDetailInfo = useCallback(async () => {
    if (name && namespace) {
      setDetailLoded(false);
      const res = await getLimitRange(namespace, name);
      if (res.status === ResponseCode.OK) {
        setLimitRangeYaml(jsonToYaml(JSON.stringify(res.data)));
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldAnnotataions([...res.data.metadata.annotations]);
        setOldLabels([...res.data.metadata.labels]);
        setLimitRangeDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  const handleLimitRangeAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsAnnotationModalOpen(false);
    } else {
      const limitRangeAnnKeyArr = [];
      data.map(item => limitRangeAnnKeyArr.push(item.key));
      if (limitRangeAnnKeyArr.filter((item, index) => limitRangeAnnKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('limitrange', namespace, name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getLimitRangeDetailInfo();
              setIsAnnotationModalOpen(false);
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

  const handleLimitRangeAnnotationCancel = () => {
    setIsAnnotationModalOpen(false);
  };

  const handleEditLimitRangeAnnotation = () => {
    setIsAnnotationModalOpen(true);
    setLimitRangePopOpen(false);
  };

  const handleEditLimitRangeLabel = () => {
    setIsLabelModalOpen(true);
    setLimitRangePopOpen(false);
  };

  const handleLimitRangeLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const limitRangeLabelKeyArr = [];
      data.map(item => limitRangeLabelKeyArr.push(item.key));
      if (limitRangeLabelKeyArr.filter((item, index) => limitRangeLabelKeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const res = await editAnnotationsOrLabels('limitrange', namespace, name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getLimitRangeDetailInfo();
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

  const handleLimitRangeLabelCancel = () => {
    setIsLabelModalOpen(false);
  };

  const handleModify = () => {
    setLimitRangeDetailTabKey('yaml');
    setIsReadyOnly(false);
  };

  const items = [
    {
      key: 'info',
      label: '详情',
      children: <Detail
        limitRangeName={name}
        limitRangeNamespace={namespace}
        limitRangeDetailDataProps={limitRangeDetailData}
        refreshFn={getLimitRangeDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <LimitRangeDetailYaml
        limitRangeYamlProps={limitRangeYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getLimitRangeDetailInfo}
      />,
    },
  ];

  useEffect(() => {
    if (limitRangeDetailTabKey === 'info' || activeKey) {
      getLimitRangeDetailInfo();
    }
  }, [limitRangeDetailTabKey, getLimitRangeDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  return (
    <div className="child_content withBread_content">
      <ToastMsg contextHolder={contextHolder} />
      <BreadCrumbCom items={[
        { title: '命名空间', path: `/${containerRouterPrefix}/namespace/limitRange`, disabled: true },
        { title: 'LimitRange', path: `/${containerRouterPrefix}/namespace/limitRange` },
        { title: '详情', path: '/detail' },
      ]}
      />
      <div className="pod_title" style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
        <h3>{name}</h3>
        <Popover placement="bottom"
          content={
            <Space className="column_pop">
              <Button type="link" onClick={handleModify}>修改</Button>
              <Button type="link" onClick={handleEditLimitRangeLabel}>编辑标签</Button>
              <Button type="link" onClick={handleEditLimitRangeAnnotation}>编辑注解</Button>
              <Button type="link" onClick={handleDeleteLimitRange}>删除</Button>
            </Space>
          }
          open={limitRangePopOpen}
          onOpenChange={handleLimitRangePopOpenChange}>
          <Button className="primary_btn">操作 <DownOutlined className="small_margin_adjust" /></Button>
        </Popover>
        {detailLoded && <AnnotationModal open={isAnnotationModalOpen} type="annotation" dataList={limitRangeDetailData?.metadata.annotations} callbackOk={handleLimitRangeAnnotationOk} callbackCancel={handleLimitRangeAnnotationCancel} />}
        {detailLoded && <AnnotationModal open={isLabelModalOpen} type="label" dataList={limitRangeDetailData?.metadata.labels} callbackOk={handleLimitRangeLabelOk} callbackCancel={handleLimitRangeLabelCancel} />}
        <DeleteInfoModal
          title="删除限制范围"
          open={limitRangeDelModalOpen}
          cancelFn={handleDelpLimitRangeCancel}
          content={[
            '删除限制范围后将无法恢复，请谨慎操作。',
            `确定删除限制范围 ${name} 吗？`,
          ]}
          isCheck={isLimitRangeDelCheck}
          showCheck={true}
          checkFn={handleLimitRangeCheckFn}
          confirmFn={handleDelLimitRangeConfirm} />
      </div>
      {detailLoded && <Tabs items={items} onChange={handleSetLimitRangeDetailTabKey} activeKey={limitRangeDetailTabKey} destroyInactiveTabPane={true} />}
    </div>
  );
}
