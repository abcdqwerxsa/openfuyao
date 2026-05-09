/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Modal, Button, Checkbox } from 'antd';
import { ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import '@/styles/components/deleteInfoModal.less';
import { Fragment, useStore } from 'openinula';


/**
 * 
 * @param title 对话框标题
 * @param open 控制对话框打开
 * @param cancelFn 取消函数回调
 * @param content 对话框内容 数组！
 * @param confirmFn 确认回调
 * @param confirmText 确认按钮文本 默认可不填
 * @param showCheck 是否展示检查框(默认不展示)
 * @param isCheck 是否选中(默认不展示)
 * @param checkFn 选中回调(默认不展示)
 * @returns 
 */
export default function DeleteInfoModal({
  title,
  open,
  cancelFn,
  content,
  confirmFn,
  confirmText = '删除',
  cancelText = '取消',
  showCheck = false,
  isCheck = false,
  onceClick,
  checkFn = () => { },
  checkboxText = `已了解${confirmText}操作无法恢复`,
  confirmBtnStatus = false,
}) {
  const themeStore = useStore('theme');
  return <Modal className={`modal_flex_delete ${themeStore.$s.theme === 'dark' ? 'dark_box' : ''}`} open={open} title={title} onCancel={cancelFn} destroyOnClose
    footer={[
      <Fragment>
        <Button className={`${!isCheck && showCheck ? 'disabled_btn' : 'delete_btn'}`} onClick={confirmFn} disabled={(!isCheck && showCheck) || onceClick}>{confirmText}</Button>
        <Button className='cancel_btn' onClick={cancelFn}>{cancelText}</Button>
      </Fragment>,
    ]}>
    <div className='modal_delete_content'>
      <ExclamationCircleOutlined className='warn_icon' />
      <div className='word_tograry'>
        <div className='word_tograry_alarm'>
          {content.map(item => (
            <p className='bread_word_delete'>{item}</p>
          ))}
        </div>
        {!!showCheck && <Checkbox className='multi_checkbox' checked={isCheck} onChange={e => {
          checkFn(e);
        }}>{checkboxText}</Checkbox>}
      </div>
    </div>
    <div style={{ margin: '5px 0 0 70px' }}>
      {confirmBtnStatus ? <div>
        <LoadingOutlined style={{ color: '#3f66f5' }} />
        <span style={{ marginLeft: '5px' }}>卸载中，关闭卸载窗口不影响后台卸载进程运行</span>
      </div> : <></>}
    </div>
  </Modal>;
}