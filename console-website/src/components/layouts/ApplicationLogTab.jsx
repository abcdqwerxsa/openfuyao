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

import { useCallback, useEffect, useState, useStore } from 'openinula';
import { ExportOutlined } from '@ant-design/icons';
import { ResponseCode } from '@/common/constants';
import { message, Button, Select, Form } from 'antd';
import { getHelmDetailLogPodAndContainer, getHelmDetailLogData } from '@/api/containerApi';
import '@/styles/pages/helm.less';
import { exportHelmLogOutPut, getContentBeforeFirstDigitDash } from '@/tools/utils';
import ToastMsg from '@/components/ToastMsg';

/**
 * Application Log Tab Component
 *
 * @param {Object} props
 * @param {string} props.nameProps - Application name
 * @param {string} props.namespaceProps - Namespace
 * @param {Object} props.releaseDataProps - Release data
 */
export default function ApplicationLogTab({ nameProps, namespaceProps, releaseDataProps }) {
  const [logForm] = Form.useForm();
  const [helmLog, setHelmLog] = useState();
  const [loading, setLoading] = useState(true); // 判断子组件是否加载
  const [messageApi, contextHolder] = message.useMessage();
  // pod下拉 options与value
  const [podOptions, setPodOptions] = useState([]);
  // 容器下拉 options与value
  const [containerOptions, setContainerOptions] = useState([]);

  const [logName, setLogName] = useState(nameProps);

  const [resourcesData, setResourcesData] = useState(releaseDataProps?.resources);

  const [logNamespace, setlogNamespace] = useState();

  const [helmNamespace, setHelmNamespace] = useState(namespaceProps);

  const [allContainer, setAllContainer] = useState([]);

  const themeStore = useStore('theme');

  const getPodNamespace = (podName) => {
    let lastNamespace = '';
    resourcesData.forEach(item => {
      if (podName === item.name) {
        if (item.namespace) {
          lastNamespace = item.namespace;
        }
      }
    });
    setlogNamespace(lastNamespace);
    return lastNamespace;
  };

  const getHelmLog = useCallback(async () => {
    let conditions = logForm.getFieldsValue();
    conditions.pod = logForm.getFieldsValue().pod;
    conditions.container = logForm.getFieldsValue().container;
    setLoading(true);
    if (logForm.getFieldsValue().pod && logForm.getFieldsValue().container) {
      const temNamespace = getPodNamespace(getContentBeforeFirstDigitDash(logForm.getFieldsValue().pod));
      const res = await getHelmDetailLogData(temNamespace, conditions.pod, conditions.container);
      if (res.status === ResponseCode.OK) {
        setHelmLog(res.data);
        setLoading(false);
      }
    }
  }, []);

  const handleReset = () => {
    setContainerOptions(allContainer[0].children);
    logForm.setFieldsValue({
      pod: allContainer[0].value,
      container: allContainer[0].children[0].value,
    });
    getHelmLog();
  };

  const handleExportLog = () => {
    if (helmLog) {
      exportHelmLogOutPut(`${logName}`, helmLog);
      messageApi.success('导出成功');
    } else {
      messageApi.error('暂无日志,不可导出');
    }
  };

  const handleSearch = () => {
    getHelmLog();
  };

  // 获取pod及container下拉内容
  const getPodSelectAndContainerValue = async () => {
    const res = await getHelmDetailLogPodAndContainer(helmNamespace, logName);
    if (res.status === ResponseCode.OK) {
      let podArr = [];
      let containerArr = [];
      let obj = res.data.data;
      // obj转arr
      const newArr = [];
      for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (obj[key].length === 1) {
            newArr.push({ pod: key, container: obj[key].toString() });
          } else {
            obj[key].forEach((item, index) => {
              newArr.push({ pod: key, container: obj[key][index] });
            });
          }
        }
      };
      // 处理数据 最终为关联的数组
      let _arr = [];
      let options = [];
      newArr.forEach(i => {
        if (i.pod) {
          _arr.push(i.pod);
          const filterList = options.filter(filterItem => filterItem.value === i.pod);
          if (filterList.length) {
            options.map(mapItem => {
              if (mapItem.value === i.pod) {
                if (mapItem.children.filter(mapFilterItem => mapFilterItem.value === i.container).length) {
                  const mapFindIndex = mapItem.children.findIndex((mapFilterItem) => mapFilterItem.value === i.container);
                  mapItem.children[mapFindIndex].children.push({ value: i.pod, label: i.pod });
                } else {
                  mapItem.children.push({
                    value: i.container,
                    label: i.container,
                    children: [{ value: i.pod, label: i.pod }],
                  });
                }
              }
            });
          } else {
            options.push({
              value: i.pod,
              label: i.pod,
              children: [{
                value: i.container,
                label: i.container,
                children: [{ value: i.pod, label: i.pod }],
              }],
            });
          }
        }
      });
      // 保存一份初始值
      setAllContainer(options);
      // 存pod下拉项数据
      options.forEach(podItem => {
        podArr.push({ value: podItem.value, label: podItem.value });
      });
      setPodOptions(podArr);
      // 存container下拉项数据
      options[0].children.forEach(i => {
        containerArr.push({ value: i.value, label: i.label });
      });
      setContainerOptions(containerArr);
      // 表单初始化展示及初始化日志接口调用
      if (logForm) {
        if (podArr.length && containerArr.length) {
          logForm.setFieldsValue({
            pod: podArr[0].value,
            container: containerArr[0].value,
          });
          let podFirstValue = podArr[0].value;
          let containerFirstValue = containerArr[0].value;
          const temNamespace = getPodNamespace(getContentBeforeFirstDigitDash(podFirstValue));
          const res1 = await getHelmDetailLogData(temNamespace, podFirstValue, containerFirstValue);
          if (res1.status === ResponseCode.OK) {
            setHelmLog(res1.data);
            setLoading(false);
          }
        } else {
          setHelmLog('');
        }
      }
    }
  };

  // 改变pod 关联项container也改变
  const handelChangeContainer = (podValue) => {
    let _newContainer = [];
    allContainer.filter(item => {
      if (item.value === podValue) {
        item.children.forEach(i => {
          _newContainer.push(i.value);
        });
      }
    });
    logForm.setFieldValue('container', _newContainer[0]);
    let filterContainerArr = [...new Set(_newContainer)];
    let _typeArr = [];
    filterContainerArr.forEach(i => {
      _typeArr.push({ label: i, value: i });
    });
    setContainerOptions(_typeArr);
  };

  useEffect(() => {
    getHelmLog();
  }, [getHelmLog]);

  useEffect(() => {
    getPodSelectAndContainerValue();
  }, []);

  return <div className="helm_tab_container" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#ffffff' : '#2a2d34ff' }}>
    <ToastMsg contextHolder={contextHolder} />
    <div className="helm_log_card" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#ffffff' : '#2a2d34ff' }}>
      <Form
        form={logForm}
        onFinish={handleSearch}
        className='helm_log_flex_box'
        style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#ffffff' : '#2a2d34ff' }}
      >
        <div className='helm_form_item' style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#ffffff' : '#2a2d34ff' }}>
          <Form.Item label="Pod" name="pod">
            <Select showSearch options={podOptions} className='log_options' onChange={() => handelChangeContainer(logForm.getFieldsValue().pod)} />
          </Form.Item>
          <Form.Item label="容器" name="container">
            <Select options={containerOptions} className='log_options' />
          </Form.Item>
        </div>
        <Form.Item style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#ffffff' : '#2a2d34ff' }}>
          <Button className='cancel_btn' style={{ marginRight: '16px', color: themeStore.$s.theme !== 'light' && '#fff' }} onClick={handleReset}>重置</Button>
          <Button htmlType="submit" className='primary_btn'>查询</Button>
        </Form.Item>
      </Form>
    </div>

    <div className="helm_log_space_box" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#ffffff' : '#2a2d34ff' }}>
      <div className="helm_log_space_box_title">
        <p className="box_title_h3" style={{ color: themeStore.$s.theme !== 'light' && '#fff' }}>日志</p>
        <div className="helm_log_tool_word_group" onClick={handleExportLog}>
          <ExportOutlined className="common_antd_icon primary_color" />
          <span>导出</span>
        </div>
      </div>
      <div className="helm_log_space_box_content" style={{ backgroundColor: themeStore.$s.theme === 'light' ? '#ffffff' : '#2a2d34ff' }}>
        <div className="helm_log_items">
          <pre className='helm_log_items_content'>{helmLog ? helmLog : '暂无日志'}</pre>
        </div>
      </div>
    </div>
  </div>;
}