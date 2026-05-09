/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Form, Input, Space, Pagination, ConfigProvider, Button, Table, Collapse, message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { DEFAULT_CURRENT_PAGE, DEFAULT_PAGE_SIZE, ResponseCode } from '@/common/constants';
import { useCallback, useEffect, useState } from 'openinula';
import { listPods, getCPUAndMemUsageFromAllPods } from '@/api/containerApi';
import zhCN from 'antd/es/locale/zh_CN';
import PodIcon from '@/assets/images/monitor/monitorPod.png';
import Dayjs from 'dayjs';
import { firstAlphabetUp, calculatePageTotal } from '@/tools/utils';
import EmptyData from '@/components/EmptyData';
import Big from 'big.js';

export default function NodePod({ nodeName }) {
  const [nodePodForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [nodePodData, setNodePodData] = useState([]); // 节点数据
  const [nodePodPage, setNodePodPage] = useState(DEFAULT_CURRENT_PAGE);
  const [nodePodPageSize, setNodePodPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [nodePodTotal, setNodePodTotal] = useState(0);
  const [podLoaded, setPodLoaded] = useState(false); // 加载完成
  const [collapseItems, setCollapseItems] = useState([]); // 渲染项
  const [originalList, setOriginalList] = useState([]); // 原始数据

  // 选中项
  const [selectPodNameList, setSelectPodNameList] = useState([]);

  // 检索
  const handleSearchNodePod = (totalData = originalList) => {
    const nodePodFormName = nodePodForm.getFieldValue('node_pod_name');
    let temporyList = [];
    let changeData = [];
    if (nodePodFormName) {
      temporyList = totalData.filter(item =>(item.metadata.name).toLowerCase().includes(nodePodFormName.toLowerCase()));
    } else {
      temporyList = totalData;
    }
    changeData = temporyList.slice(0, nodePodPageSize);
    renderCollapseItems(changeData);
    setNodePodData([...temporyList]);
    setNodePodPage(1);
    setSelectPodNameList([]);
    setNodePodTotal(temporyList.length);
  };

  // 列表
  const getNodePodList = useCallback(async () => {
    setPodLoaded(false);
    const res = await listPods('', { nodeName });
    if (res.status === ResponseCode.OK) {
      setOriginalList([...res.data.items]);
      setNodePodTotal(res.data.items.length);
      let temporyList = [];
      temporyList = res.data.items.length < nodePodPageSize ? res.data.items : res.data.items.slice(0, nodePodPageSize);
      setNodePodData([...temporyList]);
      const podUsage = await getNamespaceCpuAndMemoryData();
      res.data.items.forEach(obj => {
        let pod = obj.metadata.name;
        if (podUsage[pod]) {
          obj.metadata.cpuUsage = podUsage[pod].cpuUsage;
          obj.metadata.memoryUsage = podUsage[pod].memoryUsage;
        } else {
          obj.metadata.cpuUsage = '-';
          obj.metadata.memoryUsage = '-';
        }
      });
      renderCollapseItems(temporyList);
    }
    setPodLoaded(true);
  }, []);

  // 重置按钮
  const handleNodePodReset = () => {
    getNodePodList();
  };

  // 渲染标签页面
  const renderLabelItem = (item) => {
    return <div className="node_pod_card_item">
      <div className="node_icon_title_group">
        <img src={PodIcon} style={{width: '48px'}}/>
        <div className="node_title" >
          <p title={item.metadata.name}>{item.metadata.name}</p>
          <p>创建时间：{Dayjs(item.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
        </div>
      </div>
      <div className="node_subtitle">
        <p>{item.status.podIP}</p>
        <p>Pod IP地址</p>
      </div>
      <div className="node_subtitle">
        <p>{item.metadata.cpuUsage}</p>
        <p>CPU(core)</p>
      </div>
      <div className="node_subtitle">
        <p>{item.metadata.memoryUsage}</p>
        <p>内存(MB)</p>
      </div>
    </div>;
  };

  // 渲染表格
  const renderChildrenTableItem = (containers) => {
    return <Table className="node_table" dataSource={containers} columns={nodePodColumns} pagination={false} />;
  };

  // 处理数据
  const cleanOriginalData = (data) => {
    let containerTableTotalData = [];
    data.spec.containers.map(item => {
      containerTableTotalData.push({
        containerName: item.name,
        containerPort: item.ports ? item.ports[0].containerPort : '--',
      });
    });
    data.status.containerStatuses.map(item => {
      containerTableTotalData.forEach((containerItem) => {
        if (item.name === containerItem.containerName) { // 判断是否存在name
          let [statusKey, ...resets] = Object.keys(item.state);
          containerItem.containerStatus = statusKey; // 默认取数组第一项状态key
          containerItem.containerMirror = item.image;
        }
      });
    });
    return containerTableTotalData;
  };

  // data为当前节点的pod数据，根据监控接口，获取pod消耗
  const getNamespaceCpuAndMemoryData = useCallback(async () => {
    const podUsage = {};
    try {
      let res = await getCPUAndMemUsageFromAllPods();
      if (res.status === ResponseCode.OK) {
        res.data.results.forEach(result => {
          const type = result.metricName;
          if (type === 'pod_cpu_usage') {
            result?.data?.result?.forEach(({ labels: { pod }, sample: { value = 0 } = {} }) => {
              if (!podUsage[pod]) {
                podUsage[pod] = { cpuUsage: new Big(0), memoryUsage: new Big(0) };
              }
              podUsage[pod].cpuUsage = podUsage[pod].cpuUsage.plus(new Big(value));
            });
          } else if (type === 'pod_memory_usage') {
            result?.data?.result?.forEach(({ labels: { pod }, sample: { value = 0 } = {} }) => {
              if (!podUsage[pod]) {
                podUsage[pod] = { cpuUsage: new Big(0), memoryUsage: new Big(0) };
              }
              podUsage[pod].memoryUsage = podUsage[pod].memoryUsage.plus(new Big(value));
            });
          } else {
          }
        });
        for (const usage of Object.values(podUsage)) {
          let parseCpu = parseFloat(usage.cpuUsage.toFixed(2));
          if (usage.cpuUsage.eq(0)) {
            usage.cpuUsage = '0';
          } else if (parseCpu === 0) {
            usage.cpuUsage = '< 0.01';
          } else {
            usage.cpuUsage = parseCpu;
          }
          let parseMem = parseFloat((usage.memoryUsage.div(1024 * 1024)).toFixed(2));
          if (usage.memoryUsage.eq(0)) {
            usage.memoryUsage = '0';
          } else if (parseMem === 0) {
            usage.memoryUsage = '< 0.01';
          } else {
            usage.memoryUsage = parseMem;
          }
        }
      }
    } catch (e) {
      messageApi.error(`获取Pod的内存&CPU失败!`);
      return podUsage;
    }
    return podUsage;
  });

  const renderCollapseItems = async (data) => {
    let items = [];

    // 处理数据
    data.map(item => {
      const containersPassList = cleanOriginalData(item);
      items.push({
        key: item.metadata.name,
        label: renderLabelItem(item),
        children: renderChildrenTableItem(containersPassList),
      });
    });
    setCollapseItems([...items]);
  };

  const nodePodColumns = [
    {
      title: '容器名称',
      key: 'container_name',
      render: (_, record) => record.containerName,
    },
    {
      title: '镜像',
      key: 'container_mirror',
      render: (_, record) => record.containerMirror,
    },
    {
      title: '状态',
      key: 'container_status',
      render: (_, record) => <div className={`status_group`}>
        <span className={`${(record.containerStatus).toLowerCase()}_circle`}></span>
        <span>{firstAlphabetUp(record.containerStatus)}</span>
      </div>,
    },
    {
      title: '端口',
      key: 'container_port',
      render: (_, record) => record.containerPort,
    },
  ];

  // 处理点击函数
  const handleChangeCollapseItem = (name) => {
    if (name.length) {
      setSelectPodNameList([...name]);
    } else {
      setSelectPodNameList([]);
    }
  };

  const onChangeNodePodPageOrPageSize = (current, limit) => {
    setNodePodPage(current);
    setNodePodPageSize(limit);
    // 处理数据
    let changeData = originalList; // 原始数据
    let totalData = [];
    const nodePodFormName = nodePodForm.getFieldValue('node_pod_name');
    if (nodePodFormName) {
      changeData = changeData.filter(item => (item.metadata.name).toLowerCase().includes(nodePodFormName.toLowerCase()));
    }
    totalData = changeData;
    changeData = changeData.slice((current - 1) * limit, limit + ((current - 1) * limit));
    setNodePodData([...changeData]);
    setNodePodTotal(totalData.length);
    renderCollapseItems(changeData);
  };

  useEffect(() => {
    getNodePodList();
  }, [getNodePodList]);

  return <div className="node_box">
    <Form form={nodePodForm} className="searchForm node_search">
      <Form.Item name="node_pod_name" className="search_input">
        <Input.Search placeholder="搜索Pod名称" onSearch={() => handleSearchNodePod()} autoComplete="off" />
      </Form.Item>
      <Form.Item style={{ display: 'none' }}>
        <Space>
          <Button icon={<SyncOutlined />} onClick={handleNodePodReset} className="reset_btn"></Button>
        </Space>
      </Form.Item>
    </Form>
    <div className="tab_container container_margin_box normal_container_height node_margin_box node_background">
      {podLoaded && (collapseItems.length ?
        <Collapse items={collapseItems} activeKey={selectPodNameList} onChange={handleChangeCollapseItem} />
        : (<EmptyData />))}
    </div>

    <ConfigProvider locale={zhCN}>
      <Pagination
        className="page node_page"
        showTotal={(total) => `共${total}条`}
        showSizeChanger
        showQuickJumper
        current={nodePodPage}
        pageSize={nodePodPageSize}
        total={nodePodTotal}
        onChange={onChangeNodePodPageOrPageSize}
        pageSizeOptions={[10, 20, 50]}
      >
      </Pagination>
    </ConfigProvider>
  </div>;
}