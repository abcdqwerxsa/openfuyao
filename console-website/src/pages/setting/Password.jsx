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

import Inula, { useState, useStore } from 'openinula';
import '@/styles/pages/setUserInfo.less';
import SetUserMenu from '@/components/SetUserMenu';
import { Button, Form, Input, message } from 'antd';
import { ResponseCode } from '@/common/constants';
import { logoutSSO, updatePassword } from '@/api/loginApi';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { withBasePath } from '@/utils/basePath';

const validPrompt1 = '密码长度8~32位';
const validPrompt2 = '包含英文字母、数字、特殊字符 `~!@#$%^&*()-_=+\\|[{ }];:\'",<.>/?';
const validPrompt3 = '不能和账号及账号逆序相同';
const confirmPrompt = '两次输入密码需要一致';

function PromptLine({ valid, msg }) {
  return (
    <div className="prompt-line">
      <div className="prompt-icon">
        {valid ?
          <CheckCircleFilled style={{ color: '#09aa71' }} /> :
          <CloseCircleFilled style={{ color: '#e7434a' }} />}
      </div>
      <div className="prompt-text">{msg}</div>
    </div>
  );
}

export default function Password() {
  const userStore = useStore('user');
  const themeStore = useStore('theme');
  const [passwordForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfitmPwd] = useState('');
  const [passwordValid1, setPasswordValid1] = useState(false);
  const [passwordValid2, setPasswordValid2] = useState(false);
  const [passwordValid3, setPasswordValid3] = useState(false);
  const [confirmValid, setConfirmValid] = useState(false);
  const [onceClick, setOnceClick] = useState(true);

  const passwordPattern = /^(?=.*[0-9])(?=.*[A-Za-z])(?=.*[`~!@#$%^&*()\-_=+\\|\[{}\];:'",<.>/?])[A-Za-z0-9`~!@#$%^&*()\-_=+\\|\[{}\];:'",<.>/?]+$/;
  const reverseStr = (s) => s.split('').reverse().join('');

  const handleNewInput = (e) => {
    const newPassword = e.target.value;
    setNewPwd(newPassword);

    setPasswordValid1(newPassword.length >= 8 && newPassword.length <= 32);
    setPasswordValid2(passwordPattern.test(newPassword));
    const username = userStore.$s.user.name;
    setPasswordValid3(newPassword !== username && reverseStr(newPassword) !== username);
    setConfirmValid(newPassword === confirmPwd);
  };

  const handleConfirmInput = (e) => {
    const confirmPassword = e.target.value;
    setConfitmPwd(confirmPassword);
    setConfirmValid(confirmPassword === newPwd);
  };

  const handleSubmit = async () => {
    setOnceClick(false);
    let encoder = new TextEncoder();
    updatePassword(
      userStore.$s.user.name,
      Object.values(encoder.encode(passwordForm.getFieldValue('old_password'))),
      Object.values(encoder.encode(passwordForm.getFieldValue('new_password'))),
    )
      .then(res => {
        if (res.status === ResponseCode.OK) {
          messageApi.success('修改密码成功，即将退出', 1, () => {
            logoutSSO()
              .then(() => {
                setTimeout(() => {
                  window.location.href = withBasePath('/rest/auth/login');
                }, 1000);
              });
          });
        }
      })
      .catch(error => {
        if (error.response.status === ResponseCode.Found) {
          messageApi.error('修改密码失败达到上限，锁定用户', 1, () => {
            logoutSSO()
              .then(() => {
                setTimeout(() => {
                  window.location.href = withBasePath('/rest/auth/login');
                }, 1000);
              });
          });
        }
        if (error.response.status === ResponseCode.UnAuthorized) {
          messageApi.error('修改密码失败', 1);
        }
      }).finally(()=>{
          setOnceClick(true);
      });
  };

  return <div className="user_set_box">
    <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
      {contextHolder}
    </div>
    <p className="user_title">用户设置</p>
    <div className="user_set_content">
      <SetUserMenu />
      <div className="user_info_content">
        <h3>密码设置</h3>
        <Form className="formList update_form" form={passwordForm} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="当前密码"
            name="old_password"
            className="modify_password_item"
            rules={[
              {
                required: true,
                message: '请输入当前密码!',
              },
            ]}
          >
            <Input.Password className="user_input" placeholder="请输入" onCopy={(e) => e.preventDefault()} />
          </Form.Item>

          <Form.Item
            label="新密码"
            className="modify_password_item"
          >
            <Form.Item
              name="new_password"
              rules={[
                {
                  required: true,
                  message: '请输入新密码!',
                },
              ]}
            >
              <Input.Password className="user_input" placeholder="请输入" onInput={handleNewInput} onCopy={(e) => e.preventDefault()} />
            </Form.Item>
            <PromptLine valid={passwordValid1} msg={validPrompt1} />
            <PromptLine valid={passwordValid2} msg={validPrompt2} />
            <PromptLine valid={passwordValid3} msg={validPrompt3} />
          </Form.Item>

          <Form.Item
            label="确认密码"
            className="modify_password_item"
          >
            <Form.Item
              name="confirm_password"
              dependencies={['new_password']}
              rules={[
                {
                  required: true,
                  message: '请确认新密码!',
                },
              ]}>
              <Input.Password className="user_input" placeholder="请输入" onInput={handleConfirmInput} onCopy={(e) => e.preventDefault()} />
            </Form.Item>
            <PromptLine valid={confirmValid} msg={confirmPrompt} />
          </Form.Item>
          <Form.Item className="modify_password_btn">
            <Button className="primary_btn" htmlType="submit" disabled={
              !(passwordValid1 && passwordValid2 && passwordValid3 && confirmValid && onceClick)
            }>确认</Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  </div>;
}