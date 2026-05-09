/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { containerRouterPrefix } from '@/constant.js';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import CronJobEvents from '@/pages/container/workload/cronJob/detail/CronJobEvents';
import CronJobInfo from '@/pages/container/workload/cronJob/detail/CronJobInfo';
import CronJobYaml from '@/pages/container/workload/cronJob/detail/CronJobYaml';
import { Tabs, Button, Popover, Space, message } from 'antd';
import { useState, useEffect, useCallback, useStore } from 'openinula';
import { useHistory, useParams } from 'inula-router';
import { DownOutlined } from '@ant-design/icons';
import '@/styles/pages/podDetail.less';
import { getCronJob, editAnnotationsOrLabels, deleteCronJob } from '@/api/containerApi';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { ResponseCode } from '@/common/constants';
import AnnotationModal from '@/components/AnnotationModal';
import { jsonToYaml, solveAnnotation, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';

export default function CronJobDetail() {
  const { name, namespace, activeKey } = useParams();

  const history = useHistory();
  const [messageApi, contextHolder] = message.useMessage();

  const [cronJobDelModalOpen, setCronJobDelModalOpen] = useState(false); // 删除对话框展示
  const [isCronJobDelCheck, setIsCronJobDelCheck] = useState(false); // 是否选中
  const [detailLoded, setDetailLoded] = useState(false); // 加载完成

  const [cronJobDetailTabKey, setCronJobDetailTabKey] = useState(activeKey || 'info');

  const [cronJobDetailData, setCronJobDetailData] = useState({}); // 详情数据

  const [cronJobPopOpen, setCronJobPopOpen] = useState(false); // 气泡悬浮

  const [isReadyOnly, setIsReadyOnly] = useState(true); // 是否只读

  const [isCronJobAnnotationModalOpen, setIsCronJobAnnotationModalOpen] = useState(false);
  const [isCronJobLabelModalOpen, setIsCronJobLabelModalOpen] = useState(false);
  const [oldCronJobAnnotations, setOldCronJobAnnotataions] = useState();
  const [oldCronJobLabels, setOldCronJobLabels] = useState();

  const [cronJobYaml, setCronJobYaml] = useState(''); // 传递yaml

  const themeStore = useStore('theme');

  // 气泡
  const handleCronJobPopOpenChange = (open) => {
    setCronJobPopOpen(open);
  };

  const handleSetCronJobDetailTabKey = (key) => {
    setCronJobDetailTabKey(key);
    setIsReadyOnly(true);
  };

  // 删除按钮
  const handleDeleteCronJob = () => {
    setCronJobPopOpen(false); // 气泡框
    setCronJobDelModalOpen(true); // 打开弹窗
  };

  const handleDelpCronJobCancel = () => {
    setCronJobDelModalOpen(false);
  };

  const handleDelpCronJobConfirm = async () => {
    try {
      const res = await deleteCronJob(namespace, name);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setTimeout(() => {
          setCronJobDelModalOpen(false);
          history.push(`/${containerRouterPrefix}/workload/cronJob`);
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

  const handleCronJobDetailCheckFn = (e) => {
    setIsCronJobDelCheck(e.target.checked);
  };

  const handleModify = () => {
    setCronJobDetailTabKey('yaml'); // 跳向yaml
    setIsReadyOnly(false); // 退出只读模式
  };

  // 注解成功回调
  const handleAnnotationOk = async (cronJobData) => {
    if (JSON.stringify(oldCronJobAnnotations) === JSON.stringify(cronJobData)) {
      messageApi.info('注解未进行修改');
      setIsCronJobAnnotationModalOpen(false);
    } else {
      const keyArr = [];
      cronJobData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldCronJobAnnotations, cronJobData, 'annotation');
        try {
          const res = await editAnnotationsOrLabels('cronjob', namespace, name, addAnnotationList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              getCronJobDetailInfo();
              setIsCronJobAnnotationModalOpen(false);
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
    setIsCronJobAnnotationModalOpen(false);
  };

  const handleEditAnnotation = () => {
    setIsCronJobAnnotationModalOpen(true);
    setCronJobPopOpen(false);
  };

  const handleEditLabel = () => {
    setIsCronJobLabelModalOpen(true);
    setCronJobPopOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (cronJobData) => {
    if (JSON.stringify(oldCronJobLabels) === JSON.stringify(cronJobData)) {
      messageApi.info('标签未进行修改');
      setIsCronJobLabelModalOpen(false);
    } else {
      const keyArr = [];
      cronJobData.map(item => keyArr.push(item.key));
      if (keyArr.filter((item, index) => keyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addLabelList = solveAnnotationOrLabelDiff(oldCronJobLabels, cronJobData, 'label');
        try {
          const res = await editAnnotationsOrLabels('cronjob', namespace, name, addLabelList);
          if (res.status === ResponseCode.OK) {
            messageApi.success('编辑标签成功');
            setTimeout(() => {
              getCronJobDetailInfo();
              setIsCronJobLabelModalOpen(false);
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
    setIsCronJobLabelModalOpen(false);
  };

  const getCronJobDetailInfo = useCallback(async () => {
    if (name && namespace) {
      setDetailLoded(false);
      const res = await getCronJob(namespace, name);
      if (res.status === ResponseCode.OK) {
        setCronJobYaml(jsonToYaml(JSON.stringify(res.data))); // 先传递保持元数据clean
        res.data.metadata.annotations = solveAnnotation(res.data.metadata.annotations);
        res.data.metadata.labels = solveAnnotation(res.data.metadata.labels);
        setOldCronJobAnnotataions([...res.data.metadata.annotations]);
        setOldCronJobLabels([...res.data.metadata.labels]);
        setCronJobDetailData(res.data);
      }
      setDetailLoded(true);
    }
  }, [name, namespace]);

  // 处理只读
  const handleReadyOnly = (bool) => {
    setIsReadyOnly(bool);
  };

  useEffect(() => {
    if (cronJobDetailTabKey === 'info' || activeKey) {
      getCronJobDetailInfo();
    }
  }, [cronJobDetailTabKey, getCronJobDetailInfo]);

  useEffect(() => {
    if (activeKey) {
      setIsReadyOnly(false);
    }
  }, [activeKey]);

  const items = [
    {
      key: 'info',
      label: '详情',
      children: <CronJobInfo
        cronJobName={name}
        cronJobNamespace={namespace}
        cronJobDetailDataProps={cronJobDetailData}
        refreshFn={getCronJobDetailInfo}
      />,
    },
    {
      key: 'yaml',
      label: 'YAML',
      children: <CronJobYaml
        cronJobYamlProps={cronJobYaml}
        readOnly={isReadyOnly}
        handleEditFn={handleReadyOnly}
        refreshFn={getCronJobDetailInfo} />,
    },
    {
      key: 'events',
      label: '事件',
      children: <CronJobEvents
        cronJobName={name}
        cronJobUid={cronJobDetailData?.metadata?.uid}
        cronJobNamespace={namespace} />,
    },
  ];

  return <div className="child_content withBread_content">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom items={[
      { title: '工作负载', path: `/${containerRouterPrefix}/workload`, disabled: true },
      { title: 'CronJob', path: `/cronJob` },
      { title: '详情', path: `/detail` },
    ]} />
    <div className='pod_title' style={{ border: themeStore.$s.theme !== 'light' && 'none', backgroundColor: themeStore.$s.theme !== 'light' && '#2a2d34' }}>
      <h3>{name}</h3>
      <Popover placement='bottom'
        content={
          <Space className='column_pop'>
            <Button type="link" onClick={handleModify}>修改</Button>
            <Button type="link" onClick={handleEditLabel}>修改标签</Button>
            <Button type="link" onClick={handleEditAnnotation}>修改注解</Button>
            <Button type="link" onClick={handleDeleteCronJob}>删除</Button>
          </Space>
        }
        open={cronJobPopOpen}
        onOpenChange={handleCronJobPopOpenChange}>
        <Button className='primary_btn'>操作 <DownOutlined className='small_margin_adjust' /></Button>
      </Popover>
      {detailLoded && <AnnotationModal open={isCronJobAnnotationModalOpen} type="annotation" dataList={cronJobDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />}
      {detailLoded && <AnnotationModal open={isCronJobLabelModalOpen} type="label" dataList={cronJobDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />}
      <DeleteInfoModal
        title="删除CronJob"
        open={cronJobDelModalOpen}
        cancelFn={handleDelpCronJobCancel}
        content={[
          '删除CronJob后将无法恢复，请谨慎操作。',
          `确定删除CronJob ${name} 吗？`,
        ]}
        isCheck={isCronJobDelCheck}
        showCheck={true}
        checkFn={handleCronJobDetailCheckFn}
        confirmFn={handleDelpCronJobConfirm} />
    </div>
    {detailLoded && <Tabs items={items} onChange={handleSetCronJobDetailTabKey} activeKey={cronJobDetailTabKey} destroyInactiveTabPane={true}></Tabs>}
  </div>;
}