/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Modal, Button } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import '@/styles/components/deleteInfoModal.less';
import { Fragment, useStore } from 'openinula';

export default function TerminalNewModal({
  open,
  cancelFn,
  handleOk,
}) {
  const themeStore = useStore('theme');
  return <Modal className={`modal_flex_delete ${themeStore.$s.theme === 'dark' ? 'dark_box' : ''}`} open={open} title={'提示'} onCancel={cancelFn} destroyOnClose
    footer={[
      <Fragment>
        <Button className='cancel_btn' onClick={cancelFn}>取消</Button>
        <Button className='primary_btn' onClick={handleOk}>开启</Button>
      </Fragment>,
    ]}>
    <div className='modal_delete_content'>
      <ExclamationCircleFilled className='warn_icon' />
      <div className='word_tograry'>
        <div className='word_tograry_alarm'>
          <p className='bread_word_delete'>开启新终端将关闭已开启的终端</p>
        </div>
      </div>
    </div>
  </Modal>;
}