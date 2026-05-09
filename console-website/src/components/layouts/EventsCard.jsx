/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import '@/styles/components/eventsCard.less';
import { Fragment, useEffect, useState, useCallback, useRef } from 'openinula';
import { Button, Form, Space, Select, Timeline, FloatButton } from 'antd';
import Dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import EmptyData from '@/components/EmptyData';
import { getEventsData } from '@/api/containerApi';
import { ArrowUpOutlined, EllipsisOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, DEFAULT_CURRENT_PAGE, ResponseCode, eventLevelOptions } from '@/common/constants';
import { throttle } from '@/tools/function';
import { filterRepeat } from '@/utils/common';
Dayjs.extend(isBetween);
/**
 * 
 * @param namespace //命名空间
 * @param name //名称 
 * @param type //类型
 * @param nodeCondition //节点数据
 * @returns 
 */
const eventsPageSize = DEFAULT_PAGE_SIZE;
export default function EventsCard({ namespace = '', name = '', type = '', nodeCondition = {}, isNormal = false }) {
  const [eventsSearchForm] = Form.useForm();
  const [eventsPage, setEventsPage] = useState(DEFAULT_CURRENT_PAGE);
  const [eventsContinue, setEventsContinue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScroll, setIsScroll] = useState(true);
  const timeLineRef = useRef(null);
  const pageRef = useRef(0); // 设置监听最新值

  const resourceOptions = [
    {
      label: '全部',
      value: '',
    },
    {
      label: 'Pod',
      value: 'Pod',
    },
    {
      label: 'Deployment',
      value: 'Deployment',
    },
    {
      label: 'StatefulSet',
      value: 'StatefulSet',
    },
    {
      label: 'DaemonSet',
      value: 'DaemonSet',
    },
    {
      label: 'Job',
      value: 'Job',
    },
    {
      label: 'CronJob',
      value: 'CronJob',
    },
  ];

  const toTop = () => {
    const target = document.querySelector('.container_content');
    target.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const [resourceNameOptions, setResourceNameOptions] = useState([]);

  const [eventsTimeline, setEventTimeline] = useState([]);

  const getPodEventsTimeLine = useCallback(async (
    page = eventsPage,
    pageSize = eventsPageSize,
    continueToken = eventsContinue,
  ) => {
    setLoading(true);
    let conditions = {
      eventLevel: eventsSearchForm.getFieldsValue().eventLevel,
      passName: name,
      resourceName: eventsSearchForm.getFieldsValue().resourceName || name,
      resourceType: eventsSearchForm.getFieldsValue().resourceType || type,
      isNormal,
    };
    if (nodeCondition.nodeName) {
      conditions.nodeEvents = {
        nodeName: nodeCondition.nodeName,
        type: nodeCondition.type,
      };
    }
    const res = await getEventsData(
      {
        page,
        limit: pageSize,
        continueToken,
      },
      namespace,
      conditions,
    );
    if (res.status === ResponseCode.OK) {
      let data = res.data.items;
      setEventsContinue(res.data.metadata.continue);
      if (res.data.metadata.continue) {
        sessionStorage.setItem('isScroll', 'true');
        setIsScroll(true);
      } else {
        sessionStorage.setItem('isScroll', 'false');
        setIsScroll(false);
      }
      if (eventsPage === 1) {
        setEventTimeline(data);
      } else {
        setEventTimeline(eventsTimeline.concat(data));
      }
      setLoading(false);
    }
  }, [namespace, eventsPage, eventsPageSize, eventsSearchForm, isNormal]);

  const handleScroll = useCallback(() => {
    const { scrollHeight, clientHeight, scrollTop } = document.querySelector('.container_content');

    if (scrollHeight - scrollTop <= clientHeight + 1) { // add an 'epsilon' to allow looser precision
      if (!loading) {
        // 节流
        if (sessionStorage.getItem('isScroll') === 'true') {
          setEventsPage(pre => pre + 1);
        }
      }
    }
  }, []);

  const handleReset = () => {
    eventsSearchForm.setFieldsValue({
      resourceType: '',
      resourceName: '',
      eventLevel: '',
      time: '',
    });
    setEventsPage(DEFAULT_CURRENT_PAGE);
    getPodEventsTimeLine();
    setEventsContinue('');
  };
  const getNameOptions = async () => {
    const res = await getEventsData({ page: 1, limit: 10000, continueToken: '' }, '', '');
    if (res.status === ResponseCode.OK) {
      let _nameOption = [{ label: '全部', value: '' }];
      res.data.items.map(item => {
        _nameOption.push({
          label: item.metadata.name,
          value: item.metadata.name,
        });
      });
      setResourceNameOptions(filterRepeat(_nameOption));
    }
  };
  useEffect(() => {
    pageRef.current = eventsPage;
  }, [eventsPage]);
  useEffect(() => {
    if (!type) {
      getNameOptions();
    }
  }, []);

  useEffect(() => {
    if (eventsSearchForm) {
      eventsSearchForm.setFieldsValue({
        resourceType: type,
        resourceName: name,
        eventLevel: '',
        time: '',
      });
    }
  }, [type, name]);

  useEffect(() => {
    getPodEventsTimeLine();
  }, [getPodEventsTimeLine]);

  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  const handleSearch = () => {
    setEventsContinue('');
    eventsPage !== 1 ? setEventsPage(DEFAULT_CURRENT_PAGE) : getPodEventsTimeLine(1, 10, '');
  };

  useEffect(() => {
    window.addEventListener('wheel', throttle(handleScroll));
    return () => window.removeEventListener('wheel', handleScroll);
  }, []);

  return <Fragment>
    <Form
      id='formTop'
      className='events_form'
      form={eventsSearchForm}
      onFinish={handleSearch}>
      <div className='select_box'>
        {(!type) && <>
          <Form.Item label="资源名称" name="resourceName" initialValue={type || 'all'}>
            <Select showSearch filterOption={filterOption} options={resourceNameOptions} />
          </Form.Item>
          <Form.Item label="资源类型" name="resourceType" initialValue={name || 'all'}>
            <Select options={resourceOptions} />
          </Form.Item>
        </>
        }
        <Form.Item label="事件等级" name="eventLevel" initialValue={'all'}>
          <Select options={eventLevelOptions} />
        </Form.Item>
      </div>
      <Form.Item className='events_search_btn'>
        <Space>
          <Button className='cancel_btn' style={{ marginRight: '8px' }} onClick={handleReset}>重置</Button>
          <Button htmlType="submit" className='primary_btn'>查询</Button>
        </Space>
      </Form.Item>
    </Form>
    <div className='event_timeLine' ref={timeLineRef}>
      {eventsTimeline.length ? <Timeline items={
        eventsTimeline.map(item => ({
          color: '#3f66f5',
          children: <div className="timeLine_box">
            <p className="time_title">{Dayjs(item.metadata.creationTimestamp).format('YYYY-M-DD HH:mm:ss')}</p>
            <div className="time_message_card">
              <div className='time_info'>
                <div className='time_info_item'>
                  <span className={`${item.type === 'Normal' ? 'running_circle' : 'failed_circle'}`}></span>
                  <span className='status_word'>{item.type === 'Normal' ? '正常' : '警告'}</span>
                </div>
                <div className='time_info_item'>
                  <span >命名空间:</span>
                  <span>{item.metadata.namespace}</span>
                </div>
                <div className='time_info_item'>
                  <span>资源名称:</span>
                  <span>{item.metadata.name}</span>
                </div>
              </div>
              <p>{item.note}</p>
            </div>
          </div>
        }))
      } /> : <EmptyData />}
      {!!eventsTimeline.length && isScroll && <div className='bottom_title' onClick={handleScroll} >
        <EllipsisOutlined />
        {loading ? <span>加载中...</span> : <span>查看更多</span>}
      </div>}
    </div>
    <FloatButton.Group
      shape="square"
      className='float_btn_right'
      style={{
        right: 20,
      }}>
      <FloatButton icon={< ArrowUpOutlined />} onClick={toTop}></FloatButton>
    </FloatButton.Group>
  </Fragment>;
}