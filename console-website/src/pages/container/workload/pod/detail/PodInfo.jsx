/**
 *  Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *  openFuyao is licensed under Mulan PSL v2.
 *  You can use this software according to the terms and conditions of the Mulan PSL v2.
 *  You may obtain a copy of Mulan PSL v2 at:
  
 *       http://license.coscl.org.cn/MulanPSL2
  
 *   THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 *   EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 *   MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *   See the Mulan PSL v2 for more details.
 */
import { Link } from 'inula-router';
import { containerRouterPrefix } from '@/constant';
import { Fragment, useCallback, useEffect, useMemo, useState, useStore } from 'openinula';
import { CloseOutlined, CodeOutlined } from '@ant-design/icons';
import { ResponseCode, podContainerOptions } from '@/common/constants';
import { editAnnotationsOrLabels, getPodLog } from '@/api/containerApi';
import Dayjs from 'dayjs';
import { EditOutlined, CalendarOutlined } from '@ant-design/icons';
import { ConfigProvider, Table, Tag, message, Modal, Spin } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import AnnotationModal from '@/components/AnnotationModal';
import { firstAlphabetUp, solveAnnotationOrLabelDiff, forbiddenMsg } from '@/tools/utils';
import LabelTag from '@/components/LabelTag';
import ToolTipComponent from '@/components/ToolTipComponent';
import NoPermissionsModal from '@/components/NoPermissionsModal';
import TerminalNewModal from '@/components/webTerminal/TerminalNewModal';
import { checkTerminalAccess } from '@/api/terminalApi';
import DetailBaseInfoList from '@/components/DetailBaseInfoList';

export default function PodInfo({ podName, podNamespace, podDetailDataProps, refreshFn }) {
  const [isShow, setIsShow] = useState(true);
  const [containerTableTotalData, setContainerTableTotalData] = useState([]); // 全部数据
  const [messageApi, contextHolder] = message.useMessage();

  const [oldAnnotations, setOldAnnotations] = useState(podDetailDataProps.metadata.annotations); // 未修改前注解
  const [oldLabels, setOldLabels] = useState(podDetailDataProps.metadata.labels);

  const [podDetailData, setPodDetailData] = useState(podDetailDataProps); // 详情数据

  const [podContainerTableData, setPodContainerTableData] = useState([]); // 容器列表数据
  const [filterContainerStatus, setFilterContainerStatus] = useState([]); // 赋值筛选项

  const [containerLoading, setContainerLoading] = useState(false); // 加载中
  const [containerFilterObj, setContainerFilterObj] = useState({});
  const [logContent, setLogContent] = useState('');
  const [logName, setLogName] = useState('');
  const [logOpen, setLogOpen] = useState('');
  const [logLoaded, setLogLoaded] = useState(true);
  const [noPermissionsModalOpen, setNoPermissionsModalOpen] = useState(false); // 无权限弹窗
  const [newTerminalModal, setNewTerminalModal] = useState(false); // 终端重复

  const [containerName, setContainerName] = useState('');

  // 对话框展示
  const [isPodAnnotationModalOpen, setIsPodAnnotationModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const themeStore = useStore('theme');
  const terminalStore = useStore('terminal');

  const handleShowChange = () => {
    setIsShow(false);
  };

  const getContainerTableData = useCallback(async () => {
    setContainerLoading(true);
    let _status = '';
    let containerData = [];
    // 筛选状态
    if (Object.keys(containerFilterObj).length !== 0) {
      _status = containerFilterObj.container_status ? containerFilterObj.container_status[0] : ''; // 获取筛选框
    }
    if (_status) {
      containerData = containerTableTotalData.filter(item => (item.containerReason).toLowerCase() === _status.toLowerCase()); // 相等项
    } else {
      containerData = containerTableTotalData;
    }
    setPodContainerTableData(containerData);
    setContainerLoading(false);
  }, [containerFilterObj, containerTableTotalData]);

  // 表格变化
  const handleContainerTableChange = useCallback(
    (
      _pagination,
      filter,
      _sorter,
      extra
    ) => {
      if (extra.action === 'filter') {
        setContainerFilterObj(filter);
      }
    },
    []
  );

  // 请求日志
  const handleRequestLog = async (name) => {
    setLogName(name);
    setLogLoaded(false);
    try {
      const res = await getPodLog(podNamespace, podName, name);
      if (res.status === ResponseCode.OK) {
        setLogContent(res.data);
        setLogOpen(true);
        setLogLoaded(true);
      }
    } catch (e) {
      setLogLoaded(true);
      if (e.response.data.code === ResponseCode.BadRequest) {
        messageApi.error(e.response.data.message);
      } else {
        messageApi.error(`容器状态异常，无法获取日志！`);
      }
    };
  };

  // 列表项
  const podDetailColumns = [
    {
      title: '容器名称',
      key: 'container_name',
      render: (_, record) => <span>{record.containerName}</span>,
    },
    {
      title: '状态',
      filters: filterContainerStatus,
      filterMultiple: false,
      key: 'container_status',
      render: (_, record) => <p className={`resource_status ${(record.containerStatus).toLowerCase()}_circle`}>
        {firstAlphabetUp(record.containerReason)}
      </p>,
    },
    {
      title: '镜像',
      width: '25%',
      key: 'container_mirror',
      ellipsis: true,
      render: (_, record) => record.containerMirror,
    },
    {
      title: '内存',
      width: '15%',
      key: 'container_memory',
      render: (_, record) => record.containerMemory ? record.containerMemory : '--',
    },
    {
      title: '日志',
      key: 'container_log',
      render: (_, record) =>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Spin spinning={!logLoaded && logName === record.containerName} />
          <CalendarOutlined className="primary_icon common_antd_icon" onClick={() => handleRequestLog(record.containerName)} />
        </div>,
    },
    {
      title: '终端',
      key: 'terminal_console',
      render: (_, record) => <CodeOutlined className="primary_icon common_antd_icon" onClick={() => handleTerminalConsole(record.containerName)} />,
    },
  ];

  const handleClosePermissionModal = () => {
    setNoPermissionsModalOpen(false);
  };

  const handleCancelNewTerminal = () => {
    setNewTerminalModal(false);
  };

  const handleOkNewTerminal = () => {
    terminalStore.$a.setTerminalInit({ type: 'container', name: containerName });
    terminalStore.$a.setTerminalScreenSize('middle');
    terminalStore.$a.setTerminalPodDescription({ namespace: podNamespace, pod: podName });
    terminalStore.$a.setTerminalOpen(false);
    setTimeout(() => {
      terminalStore.$a.setTerminalOpen(true);
    });
    setNewTerminalModal(false);
  };

  const handleTerminalConsole = async (name) => {
    // 检查权限
    setContainerName(name);
    terminalStore.$a.setTerminalPodDescription({ namespace: podNamespace, pod: podName });
    try {
      const permissionsRes = await checkTerminalAccess(
        `/namespace/${terminalStore.$s.podDescription.namespace}/pod/${terminalStore.$s.podDescription.pod}/container/${name}/terminal`
      );
      if (permissionsRes.data.Code === ResponseCode.OK) {
        if (terminalStore.$s.isOpen) {
          setNewTerminalModal(true);
        } else {
          terminalStore.$a.setTerminalInit({ type: 'container', name });
          terminalStore.$a.setTerminalScreenSize('middle');
          terminalStore.$a.setTerminalOpen(true);
        }
      }
      if (permissionsRes.data.Code === ResponseCode.Forbidden) {
        setNoPermissionsModalOpen(true);
      }
      if (permissionsRes.data.Code === ResponseCode.NotFound) {
        messageApi.error(permissionsRes.data.data);
      }
      if (permissionsRes.data.Code === ResponseCode.InternalServerError) {
        messageApi.error('服务错误');
      }
    } catch (e) {
      if (e.response.data.Code === ResponseCode.Forbidden) {
        setNoPermissionsModalOpen(true);
      } else if (e.response.data.Code === ResponseCode.InternalServerError) {
        messageApi.error('服务错误');
      } else {
        messageApi.error('调用检查权限接口失败！');
      }
    }
  };

  // 注解成功回调
  const handleAnnotationOk = async (data) => {
    if (JSON.stringify(oldAnnotations) === JSON.stringify(data)) {
      messageApi.info('注解未进行修改');
      setIsPodAnnotationModalOpen(false);
    } else {
      const podAnnotationkeyArr = [];
      data.map(item => podAnnotationkeyArr.push(item.key));
      if (podAnnotationkeyArr.filter((item, index) => podAnnotationkeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的注解
        const addAnnotationList = solveAnnotationOrLabelDiff(oldAnnotations, data, 'annotation');
        try {
          const resPodAnnotation = await editAnnotationsOrLabels('pod', podNamespace, podName, addAnnotationList);
          if (resPodAnnotation.status === ResponseCode.OK) {
            messageApi.success('编辑注解成功');
            setTimeout(() => {
              refreshFn(); // 先刷新防止页面抖动
              setIsPodAnnotationModalOpen(false);
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
    setIsPodAnnotationModalOpen(false);
  };

  // 标签成功回调
  const handleLabelOk = async (data) => {
    if (JSON.stringify(oldLabels) === JSON.stringify(data)) {
      messageApi.info('标签未进行修改');
      setIsLabelModalOpen(false);
    } else {
      const podLabelkeyArr = [];
      data.map(item => podLabelkeyArr.push(item.key));
      if (podLabelkeyArr.filter((item, index) => podLabelkeyArr.indexOf(item) !== index).length) {
        messageApi.error('存在相同key!');
      } else {
        // 请求接口添加
        // 比较前后是否一致 返回处理后的标签
        const addLabelList = solveAnnotationOrLabelDiff(oldLabels, data, 'label');
        try {
          const resPodLabel = await editAnnotationsOrLabels('pod', podNamespace, podName, addLabelList);
          if (resPodLabel.status === ResponseCode.OK) {
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

  const handleLogOk = () => {
    setLogOpen(false);
    setLogName('');
    setLogContent('');
  };

  useEffect(() => {
    // 获取详情
    getContainerTableData();
  }, [getContainerTableData]);

  useEffect(() => {
    let total = [];
    let totalStatusList = [];
    let filterContainerList = [];
    podDetailDataProps.spec.containers.map(item => {
      total.push({
        containerName: item.name,
        containerMemory: item.resources?.requests?.memory || '',
      });
    });
    podDetailDataProps.status.containerStatuses.map(item => {
      total.forEach((containerItem) => {
        if (item.name === containerItem.containerName) { // 判断是否存在name
          containerItem.containerStatus = Object.keys(item.state)[0] || 'Unknown'; // 默认取数组第一项状态key
          containerItem.containerReason = (Object.prototype.hasOwnProperty.call(item.state, containerItem.containerStatus) &&
            item.state[containerItem.containerStatus].reason) ||
            containerItem.containerStatus;
          containerItem.containerMirror = item.image || '--';
          totalStatusList.push(containerItem.containerReason);
        }
      });
    });
    totalStatusList = [...new Set(totalStatusList)];
    totalStatusList.map(statusItem => {
      filterContainerList.push({ text: firstAlphabetUp(statusItem), value: firstAlphabetUp(statusItem) });
    });
    setFilterContainerStatus([...filterContainerList]);
    setContainerTableTotalData([...total]);
  }, [podDetailDataProps]);

  const podBaseInfoItems = useMemo(() => {
    const d = podDetailData;
    const phase = d?.status?.phase;
    return [
      { key: 'Pod名称：', value: d?.metadata?.name },
      { key: '所属节点名称：', value: d?.spec?.nodeName },
      {
        key: 'Pod状态：',
        value: phase && <span className={`${phase.toLowerCase()}_circle`}>{phase}</span>,
      },
      { key: '所属节点IP地址：', value: d?.status?.hostIP },
      { key: 'Pod IP地址：', value: d?.status?.podIP },
      {
        key: '重启次数：',
        value: d?.status?.containerStatuses?.reduce((acc, item) => acc + item.restartCount, 0),
      },
      { key: '命名空间：', value: d?.metadata?.namespace },
      {
        key: '创建时间：',
        value: d?.metadata?.creationTimestamp && Dayjs(d.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
      },
    ];
  }, [podDetailData]);

  return <Fragment>
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <div className={`${isShow ? '' : 'cant_show'}`}>
      <ToolTipComponent>
        <div className="podDetail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className='promot-box'>工作负载监控详情请前往<Link to={`/${containerRouterPrefix}/monitor/monitorDashboard`}>监控大屏</Link>查看</div>
          <CloseOutlined onClick={handleShowChange} />
        </div>
      </ToolTipComponent>
    </div>
    <div className={`tab_container container_margin_box ${isShow ? 'tooltip_container_height' : 'normal_container_height'}`}>
      <div className="detail_card">
        <h3>基本信息</h3>
        <div className="detail_info_box">
          <DetailBaseInfoList items={podBaseInfoItems} columns={2} />
          <div className="annotation">
            <div className="ann_title">
              <p>标签：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsLabelModalOpen(true)} />
            </div>
            <AnnotationModal open={isLabelModalOpen} type="label" dataList={podDetailData?.metadata?.labels} callbackOk={handleLabelOk} callbackCancel={handleLabelCancel} />
            <div className="key_value">
              {podDetailData.metadata?.labels?.length ?
                podDetailData.metadata.labels.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
          <div className="annotation">
            <div className="ann_title">
              <p>注解：</p>
              <EditOutlined className="primary_icon common_antd_icon" onClick={() => setIsPodAnnotationModalOpen(true)} />
            </div>
            <AnnotationModal open={isPodAnnotationModalOpen} type="annotation" dataList={podDetailData?.metadata?.annotations} callbackOk={handleAnnotationOk} callbackCancel={handleAnnotationCancel} />
            <div className="key_value">
              {podDetailData.metadata?.annotations?.length ?
                podDetailData.metadata.annotations.map(item => <LabelTag labelKey={item.key} labelValue={item.value} theme={themeStore.$s.theme} />) :
                <span style={{ marginTop: '13px' }}>0个</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="detail_card container_card_add">
        <h3>容器</h3>
        <ConfigProvider locale={zhCN}>
          <Table className="table_padding" style={{ paddingRight: '0px' }} loading={containerLoading} dataSource={podContainerTableData} columns={podDetailColumns}
            pagination={{
              className: 'page',
              pageSizeOptions: [10, 20, 50],
              showSizeChanger: true,
              showTotal: total => `共${total}条`,
            }}
            onChange={handleContainerTableChange} />
        </ConfigProvider>
      </div>
      <NoPermissionsModal open={noPermissionsModalOpen} handleOpen={handleClosePermissionModal} />
      <TerminalNewModal open={newTerminalModal} handleOk={handleOkNewTerminal} cancelFn={handleCancelNewTerminal} />
      <Modal
        className="pod_log_container"
        width={800}
        title={`容器${logName}日志`}
        open={logOpen}
        onOk={handleLogOk}
        onCancel={handleLogOk}
        footer={(_, { OkBtn }) => (
          <>
            <OkBtn />
          </>
        )}
      >
        <div className="pod_log_content">
          <pre>{logContent}</pre>
        </div>
      </Modal>
    </div>
  </Fragment>;
}