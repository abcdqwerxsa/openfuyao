/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useState, useStore } from 'openinula';
import { Select, Form, Button, Modal, DatePicker, Input, InputNumber, message, ConfigProvider } from 'antd';
import '@/styles/pages/alarm.less';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { silentOptions } from '@/common/constants';
import UserStore from '@/store/userStore';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');
dayjs.extend(utc);
export default function SetSilentAlarmModal(props) {
  const userStore = UserStore();
  const [messageApi, contextHolder] = message.useMessage();
  const themeStore = useStore('theme');
  const [silentForm] = Form.useForm();
  const [beginTime, setBeginTime] = useState();
  const [remarks, setRemarks] = useState(props.remarks);
  const [endTime, setEndTime] = useState();
  const [durations, setDurations] = useState(1);
  const [timeType, setTimeType] = useState('d');
  const [timeTypeOption, setTimeTypeOption] = useState(silentOptions);
  const dateFormat = 'YYYY-MM-DD HH:mm';
  const cancelModelEdit = () => {
    silentForm.resetFields();
    setBeginTime();
    setEndTime();
    props.cancelEdit();
  };
  const handleChangeTime = (dates, dateStrings) => {
    if (dates) {
      setBeginTime(dayjs(dateStrings));
    };
  };
  const handleChangeTimeType = (value) => {
    setTimeType(value);
  };
  const handleChangeDurations = (value) => {
    setDurations(value);
  };
  const checkRemarks = async (rule, value) => {
    if (!value) {
      throw new Error('备注不能为空');
    }
    if (value.length > 64) {
      throw new Error('备注长度不能超过64');
    }
    return Promise.resolve();
  };
  const submitModelEditSilent = () => {
    let arr = {};
    if (silentForm.getFieldsValue().beginTime) {
      let formTime = dayjs(silentForm.getFieldsValue().beginTime.format('YYYY-MM-DD HH:mm')).unix();
      let nowTime = dayjs(dayjs().format('YYYY-MM-DD HH:mm')).unix();
      if (formTime < nowTime) {
        messageApi.error('编辑静默失败，静默开始时间不能小于当前时间！');
      } else {
        arr = {
          startsAt: silentForm.getFieldsValue().beginTime.utc().format(),
          endsAt: (silentForm.getFieldsValue().beginTime.add(durations, timeType)).utc().format(),
          createdBy: silentForm.getFieldsValue().creators,
          comment: silentForm.getFieldsValue().remarks,
        };
        props.submitModel(arr);
      }
    } else {
      arr = {
        startsAt: dayjs().utc().format(),
        endsAt: (dayjs().add(durations, timeType)).utc().format(),
        createdBy: silentForm.getFieldsValue().creators,
        comment: silentForm.getFieldsValue().remarks,
      };
      props.submitModel(arr);
    }
  };
  return (
    <Modal
      className={`alertModel silentModelCommon ${themeStore.$s.theme === 'dark' ? 'dark_box' : ''}`}
      title='设置静默告警' open={props.isShowModal} onCancel={cancelModelEdit} footer={[]}
    >
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <ConfigProvider locale={zhCN}>
        <Form
          layout='vertical'
          form={silentForm}
          name='silentForm'
          initialValues={{
            timetype: timeTypeOption[2],
            creators: userStore.user.name,
            durations:1,
            remarks,
          }}
          onFinish={submitModelEditSilent}
        >
          <Form.Item name='beginTime' label='静默开始时间' >
            <DatePicker placeholder='默认时间为当前时间' format={dateFormat} style={{ width: '318px', marginRight: '20px' }} minDate={dayjs()} onChange={handleChangeTime} showTime />
          </Form.Item>
          <div className='formTime'>
            <Form.Item name='durations' label='静默持续时间' rules={[
              { required: true, message: `静默持续时间不能为空` },
              { type: 'number', min: 1, max: 100, message: '数值必须在1到100之间' },
              { type: 'integer', message: '请输入正确的整数' },
            ]}>
              <InputNumber value={durations} placeholder='请输入1-100的整数' style={{ width: '190px', marginRight: '8px' }} onChange={handleChangeDurations} />
            </Form.Item>
            <Form.Item name='timetype' label=' '>
              <Select value={timeType} style={{ width: '120px' }} options={timeTypeOption} onChange={handleChangeTimeType} />
            </Form.Item>
          </div>
          <Form.Item name='creators' label='创建者' rules={[{ required: true, message: '创建者不能为空' }]}>
            <Input style={{ width: '318px', marginRight: '20px' }} disabled={true} placeholder="请填写" />
          </Form.Item>
          <Form.Item name='remarks' label='备注' rules={[{ required: true, validator: checkRemarks }]}>
            <Input style={{ width: '318px' }} placeholder="请填写" />
          </Form.Item>
          <div className='formBtn' style={{ marginTop: '-32px' }}>
            <Form.Item>
              <Button className='cancel_btn' onClick={cancelModelEdit} style={{ marginRight: '14px' }}>取消</Button>
              <Button className='primary_btn' htmlType='submit'>确定</Button>
            </Form.Item>
          </div>
        </Form>
      </ConfigProvider>
    </Modal>
  );
}
