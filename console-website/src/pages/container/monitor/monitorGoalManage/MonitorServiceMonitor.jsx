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
import { useEffect, useState, useCallback, useStore } from 'openinula';
import BreadCrumbCom from '@/components/BreadCrumbCom';
import { containerRouterPrefix } from '@/constant';
import Dayjs from 'dayjs';
import '@/styles/pages/workload.less';
import {
  Button,
  Form,
  Space,
  Input,
  Table,
  ConfigProvider,
  Popover,
  message,
}
  from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { DEFAULT_CURRENT_PAGE, ResponseCode } from '@/common/constants';
import DeleteInfoModal from '@/components/DeleteInfoModal';
import { MoreOutlined } from '@ant-design/icons';
import { Link, useHistory } from 'inula-router';
import {
  getCustomResourceDefinitionDetailDescription,
  getResourceExampleList,
  deleteResourceExample,
} from '@/api/containerApi';
import { disabledModifyMonitorServiceCr } from '@/common/constants';
import { sorterFirstAlphabet, forbiddenMsg } from '@/tools/utils';

export default function MonitorServiceMonitor() {
  const [serviceMonitorForm] = Form.useForm();
  const history = useHistory();
  const [serviceMonitorPage, setServiceMonitorPage] = useState(DEFAULT_CURRENT_PAGE);
  const [serviceMonitorList, setServiceMonitorList] = useState([]); // 数据集
  const [serviceMonitorLoading, setServiceMonitorLoading] = useState(false); // 加载中
  const [popOpen, setPopOpen] = useState(''); // 悬浮框是否展示
  const [prefixObj, setPrefixObj] = useState({}); // 前缀cr实例组
  const themeStore = useStore('theme');
  const [serviceMonitorDelModalOpen, setServiceMonitorDelModalOpen] = useState(false); // 删除对话框展示
  const [serviceMonitorDelName, setServiceMonitorDelName] = useState(''); // 删除的名称
  const [serviceMonitorDelNamespace, setServiceMonitorDelNamespace] = useState(''); // 删除的命名空间
  const [isServiceMonitorDelCheck, setIsServiceMonitorDelCheck] = useState(false); // 是否选中
  const [messageApi, contextHolder] = message.useMessage();
  const [originalList, setOriginalList] = useState([]); // 原始数据
  // 列表项
  const serviceMonitorColumns = [
    {
      title: '实例名称',
      key: 'exampleName',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.name, b.metadata.name),
      render: (_, record) => <Link to=
        {{
          pathname: `/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor/${record.metadata.namespace}/${record.metadata.name}`, state: {
            ...prefixObj,
          },
        }}>
        {record.metadata.name}
      </Link>,
    },
    {
      title: '命名空间',
      key: 'namespace',
      sorter: (a, b) => sorterFirstAlphabet(a.metadata.namespace, b.metadata.namespace),
      render: (_, record) => record.metadata.namespace,
    },
    {
      title: '创建时间',
      key: 'created_time',
      sorter: (a, b) => Dayjs(a.metadata.creationTimestamp) - Dayjs(b.metadata.creationTimestamp),
      render: (_, record) => Dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 120,
      key: 'handle',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popover placement="bottom"
            content={
              <div className="pop_modal">
                <Link className="primary_link" to={{
                  pathname: `/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor/${record.metadata.namespace}/${record.metadata.name}/yaml`,
                  state: { ...prefixObj },
                }}>
                  修改
                </Link>
                <Button
                  type="link"
                  onClick={() => handleDeleteServiceMonitor(record)}
                >
                  删除
                </Button>
              </div>
            }
            trigger="click"
            open={popOpen === record.metadata.uid && !disabledModifyMonitorServiceCr.includes(record.metadata.name)}
            onOpenChange={newOpen => newOpen ? setPopOpen(record.metadata.uid) : setPopOpen('')}>
            <MoreOutlined className={`common_antd_icon ${disabledModifyMonitorServiceCr.includes(record.metadata.name) ? 'disabled_color' : 'primary_color'}`} />
          </Popover>
        </Space>
      ),
    },
  ];

  // 删除按钮
  const handleDeleteServiceMonitor = (record) => {
    // 隐藏气泡框
    setPopOpen('');
    setServiceMonitorDelModalOpen(true); // 打开弹窗
    setServiceMonitorDelName(record.metadata.name);
    setServiceMonitorDelNamespace(record.metadata.namespace);
  };

  const handleDelServiceMonitorCancel = () => {
    setServiceMonitorDelModalOpen(false);
    setServiceMonitorDelName('');
    setServiceMonitorDelNamespace('');
  };

  const handleDelServiceMonitorConfirm = async () => {
    try {
      const res = await deleteResourceExample({ ...prefixObj, namespace: serviceMonitorDelNamespace }, serviceMonitorDelName);
      if (res.status === ResponseCode.OK) {
        messageApi.success('删除成功！');
        setServiceMonitorDelModalOpen(false);
        setIsServiceMonitorDelCheck(false);
        setServiceMonitorDelName('');
        setServiceMonitorDelNamespace('');
        getServiceMonitorList();
      }
    } catch (error) {
      if (error.response.status === ResponseCode.Forbidden) {
        forbiddenMsg(messageApi, error);
      } else {
        messageApi.error(`删除失败!${error.response.data.message}`);
      }
    }
  };
  const handleServiceMonitorCheckFn = (e) => {
    setIsServiceMonitorDelCheck(e.target.checked);
  };

  const getServiceMonitorList = useCallback(async (isChange = true) => {
    if (Object.keys(prefixObj).length) {
      setServiceMonitorLoading(true);
      try {
        const res = await getResourceExampleList(prefixObj);
        if (res.status === ResponseCode.OK) {
          setOriginalList([...res.data.items]);
          handleSearchServiceMonitor(res.data.items, isChange); // 先搜索
        }
      } catch (e) {
        if (e.response.data.code === ResponseCode.NotFound) {
          setServiceMonitorList([]); // 数组为空
        }
      }
      setServiceMonitorLoading(false);
    }
  }, [prefixObj]);

  const getCustomResource = useCallback(async () => {
    const res = await getCustomResourceDefinitionDetailDescription('servicemonitors.monitoring.coreos.com');
    if (res.status === ResponseCode.OK) {
      // 处理组数据
      setPrefixObj({
        group: res.data.spec.group,
        version: res.data.spec.versions[0].name,
        plural: res.data.status.acceptedNames.plural,
      });
    }
  }, []);

  useEffect(() => {
    // 获取自定义资源
    getCustomResource();
  }, [getCustomResource]);

  // 检索
  const handleSearchServiceMonitor = (totalData = originalList, isChange = true) => {
    const serviceMonitorFormName = serviceMonitorForm.getFieldValue('service_monitor_name');
    let temporyList = [];
    if (serviceMonitorFormName) {
      temporyList = totalData.filter(item => (item.metadata.name).toLowerCase().includes(serviceMonitorFormName.toLowerCase()));
    } else {
      temporyList = totalData;
    }
    setServiceMonitorList([...temporyList]);
    isChange ? setServiceMonitorPage(DEFAULT_CURRENT_PAGE) : null;
  };

  useEffect(() => {
    getServiceMonitorList();
  }, [getServiceMonitorList]);

  return <div className="child_content no_breadcrumb">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <BreadCrumbCom
      className="create_bread"
      items={[
        { title: '监控', path: `/${containerRouterPrefix}/monitor`, disabled: true },
        { title: '监控目标', path: '/monitorGoalManage' },
        { title: 'ServiceMonitor实例', path: '/serviceMonitor' },
      ]} />
    <div className="tab_container container_margin_box">
      <Form className="pod_searchForm form_padding_bottom" form={serviceMonitorForm}>
        <Form.Item name="service_monitor_name" className="pod_search_input">
          <Input.Search placeholder="搜索实例名称" onSearch={() => handleSearchServiceMonitor()} autoComplete="off" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button className="primary_btn" onClick={() => history.push({
              pathname: `/${containerRouterPrefix}/monitor/monitorGoalManage/serviceMonitor/create`,
              state: { ...prefixObj, namespace: '' },
            })}>创建实例</Button>
          </Space>
        </Form.Item>
      </Form>
      <div className="tab_table_flex">
        <ConfigProvider locale={zhCN}>
          <Table
            className="table_padding"
            loading={serviceMonitorLoading}
            columns={serviceMonitorColumns}
            dataSource={serviceMonitorList}
            pagination={{
              className: 'page',
              current: serviceMonitorPage,
              showTotal: (total) => `共${total}条`,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50],
              onChange: page => setServiceMonitorPage(page),
            }}
            scroll={{ x: 1280 }}
          />
        </ConfigProvider>
        <DeleteInfoModal
          title="删除ServiceMonitor实例"
          open={serviceMonitorDelModalOpen}
          cancelFn={handleDelServiceMonitorCancel}
          content={[
            '删除ServiceMonitor实例后将无法恢复，请谨慎操作。',
            `确定删除ServiceMonitor实例 ${serviceMonitorDelName} 吗？`,
          ]}
          isCheck={isServiceMonitorDelCheck}
          showCheck={true}
          checkFn={handleServiceMonitorCheckFn}
          confirmFn={handleDelServiceMonitorConfirm} />
      </div>
    </div>
  </div>;
}