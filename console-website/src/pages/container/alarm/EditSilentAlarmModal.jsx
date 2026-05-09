/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { Select, Button, Space, Form, Input, DatePicker, Modal, InputNumber, ConfigProvider, message } from 'antd';
import { useEffect, useState, useStore } from 'openinula';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { silentOptions } from '@/common/constants';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');
dayjs.extend(utc);
export default function EditSilentAlarmModal(props) {
  const [silentFormEdit] = Form.useForm();
  const themeStore = useStore('theme');
  const [beginTimeEdit, setBegintimeEdit] = useState(props.data?.beginTime);
  const [endTimeEdit, setEndtimeEdit] = useState();
  const [durationsEdit, setDurationsEdit] = useState(props.data?.timeNum);
  const [timetypeEdit, setTimetypeEdit] = useState(props.data?.timeType);
  const [timeTypeEditOption, setTimeTypeOption] = useState(silentOptions);
  const dateFormat = 'YYYY-MM-DD HH:mm';
  const [messageApi, contextHolder] = message.useMessage();
  const handleChangeTimeEdit = (dates, dateStrings) => {
    if (dates) {
      setBegintimeEdit(dayjs(dateStrings));
    }
  };
  const handleChangeTimetypeEdit = (value) => {
    setTimetypeEdit(value);
  };
  const checkSilentRemarksEdit = async (rule, value) => {
    if (!value) {
      throw new Error('备注不能为空');
    }
    if (value.length > 64) {
      throw new Error('备注长度不能超过64');
    }
    return Promise.resolve();
  };
  const handleChangeDurationsEdit = (value) => {
    setDurationsEdit(value);
  };
  const cancelModelEdit = () => {
    silentFormEdit.resetFields();
    setBegintimeEdit(props.data?.beginTime);
    setEndtimeEdit();
    props.cancelEdit();
  };
  const submitModelSilentEdit = () => {
    let _labelList = [];
    silentFormEdit.getFieldsValue().labelList.map(item => {
      _labelList.push({
        name: item.key,
        value: item.value,
        isEqual: true,
        isRegex: false,
      });
    });
    let arr = {};
    if (silentFormEdit.getFieldsValue().beginTimeEdit) {
      let formTime = dayjs(silentFormEdit.getFieldsValue().beginTimeEdit.format('YYYY-MM-DD HH:mm')).unix();
      let nowTime = dayjs(dayjs().format('YYYY-MM-DD HH:mm')).unix();
      if (formTime < nowTime) {
        messageApi.error('编辑静默失败，静默开始时间不能小于当前时间！');
      } else {
        arr = {
          startsAt: silentFormEdit.getFieldsValue().beginTimeEdit.utc().format(),
          endsAt: (silentFormEdit.getFieldsValue().beginTimeEdit.add(durationsEdit, timetypeEdit)).utc().format(),
          createdBy: silentFormEdit.getFieldsValue().creators,
          comment: silentFormEdit.getFieldsValue().remarks,
          matchers: _labelList,
        };
        props.submitModel(arr);
        silentFormEdit.resetFields();
      }
    } else {
      arr = {
        startsAt: dayjs().utc().format(),
        endsAt: (dayjs().add(durationsEdit, timetypeEdit)).utc().format(),
        createdBy: silentFormEdit.getFieldsValue().creators,
        comment: silentFormEdit.getFieldsValue().remarks,
        matchers: _labelList,
      };
      props.submitModel(arr);
      silentFormEdit.resetFields();
    }
  };
  useEffect(() => {
    setDurationsEdit(props.data?.timeNum);
    setTimetypeEdit(props.data?.timeType);
    silentFormEdit.setFieldsValue({
      beginTimeEdit: props.data?.beginTime,
      labelList: props.data?.labelList,
      remarks: props.data?.remarks,
      creators: props.data?.creators,
      durations: props.data?.timeNum,
      timetype: props.data?.timeType,
    });
  }, [props.data?.beginTime, props.data?.labelList, props.data?.remarks, props.data?.creators, props.data?.timeType, props.data?.timeNum]);
  return (
    <Modal
      className={`silentModel silentModelCommon ${themeStore.$s.theme === 'dark' ? 'dark_box' : ''}`}
      title={props.formType === 'add' ? '创建静默' : '修改静默'} open={props.isShowModel} onCancel={cancelModelEdit}
      footer={[]}
      forceRender
    >
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <ConfigProvider locale={zhCN}>
        <Form
          form={silentFormEdit}
          name='silentForm'
          layout="vertical"
          onFinish={submitModelSilentEdit}
        >
          <div className='formTime'>
            <Form.Item name='beginTimeEdit' label='静默开始时间' >
              <DatePicker value={beginTimeEdit} format={dateFormat} placeholder='默认时间为当前时间' style={{ width: '318px', marginRight: '20px' }} minDate={dayjs()} onChange={handleChangeTimeEdit} showTime />
            </Form.Item>
            <Form.Item name='durations' label='静默持续时间'
              rules={[
                { required: true, message: `静默持续时间不能为空` },
                { type: 'number', min: 1, max: 100, message: '数值必须在1到100之间' },
                { type: 'integer', message: '请输入正确的整数' },
              ]} >
              <InputNumber value={durationsEdit} placeholder='请输入1-100的整数' style={{ width: '190px', marginRight: '20px' }} onChange={handleChangeDurationsEdit} />
            </Form.Item>
            <Form.Item name='timetype' label=' '>
              <Select value={timetypeEdit} style={{ width: '120px' }} options={timeTypeEditOption} onChange={handleChangeTimetypeEdit} />
            </Form.Item>
          </div>
          <p><span style={{ color: '#E94547' }}>*</span> 标签</p>
          <div style={{ display: 'flex', margin: '8px 0' }}><p style={{ width: '392px', marginRight: '15px' }}>键</p><p>值</p></div>
          <Form.List name={`labelList`} title='标签' rules={[
            {
              validator: async (_, labelTemporyList) => {
                if (labelTemporyList.length === 0) {
                  return Promise.reject(new Error('至少有一项标签项'));
                } else {
                  return Promise.resolve();
                }
              },
            },
          ]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    className='field_label_edit_silent'
                    style={{
                      display: 'flex',
                    }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      className='field_label_edit_silent'
                      name={[name, 'key']}
                      rules={[
                        {
                          required: true,
                          message: `标签值不能为空`,
                        },
                      ]}
                    >
                      <Input className='field_label_edit_silent' placeholder="请输入" style={{ width: '392px', marginRight: '8px' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      className='field_value_edit_silent'
                      name={[name, 'value']}
                      rules={[
                        {
                          required: true,
                          message: `标签值不能为空`,
                        },
                      ]}
                    >
                      <Input className='field_value_edit_silent' placeholder="请输入" style={{ width: '220px' }} />
                    </Form.Item>
                    <DeleteOutlined className="common_antd_icon delete_common" onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button className="icon_btn" type="link" onClick={() => add()} block icon={<PlusCircleOutlined className="primary_icon common_antd_icon" />}>
                    添加标签
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Form.Item name='creators' label='创建者' rules={[
              { required: true },
            ]}>
              <Input style={{ width: '318px', marginRight: '20px' }} placeholder="请填写" disabled={true} />
            </Form.Item>
            <Form.Item name='remarks' label='备注' rules={[{ required: true, validator: checkSilentRemarksEdit }]}>
              <Input style={{ width: '318px' }} placeholder="请填写" />
            </Form.Item>
          </div>
          <div className='formBtn'>
            <Form.Item>
              <Button className='cancel_btn edit_silent_btn' onClick={cancelModelEdit} style={{ marginRight: '14px' }}>取消</Button>
              <Button className='primary_btn edit_silent_btn' htmlType='submit'>确定</Button>
            </Form.Item>
          </div>
        </Form>
      </ConfigProvider>
    </Modal >
  );
}
