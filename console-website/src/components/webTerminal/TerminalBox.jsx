/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import {
  LineOutlined,
  ExpandOutlined,
  CloseOutlined,
  ExpandAltOutlined,
  CompressOutlined,
  CaretRightOutlined,
  RightOutlined,
  CaretLeftOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import '@/styles/components/webTerminal.less';
import { useRef, useState, Fragment, useStore, useEffect } from 'openinula';
import TerminalConsole from '@/components/webTerminal/TerminalConsole';
import { Modal, Button } from 'antd';
import '@/styles/components/deleteInfoModal.less';
import { terminalType } from '@/common/constants';
import { publicLink } from '@/common/constants';

const handleList = [
  {
    name: '查看所有容器组',
    example: 'Kubectl get pods',
  },
  {
    name: '查看节点详情',
    example: 'Kubectl describe nodes <node-name>xxxxxx xxxxx',
  },
];

const closeContent = ['关闭后，该终端的内容将不会显示在新开启的终端。', '确定关闭该终端吗？'];

export default function TerminalBox() {
  const terminalStore = useStore('terminal');
  const terminalRef = useRef(null);
  const [collapseTerminalMenu, setCollapseTerminalMenu] = useState(false);
  const [closeTerminalOpen, setCloseTerminalOpen] = useState(false);
  const [isShowModal, setIsShowModal] = useState(true);
  const handleCloseTerminalTempory = () => {
    setCloseTerminalOpen(true);
  };

  const handleCollapseTerminalMenu = () => {
    setCollapseTerminalMenu(!collapseTerminalMenu);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.resizeScreenConsole();
      }
    });
  };

  const handleChangeScreenSize = (size) => {
    terminalStore.$a.setTerminalScreenSize(size);
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.resizeScreenConsole();
      }
    });
  };

  const handleCloseTerminalModal = () => {
    setCloseTerminalOpen(false);
  };

  const handleConfirmTerminalModal = () => {
    setCloseTerminalOpen(false);
    terminalStore.$a.setTerminalOpen(false);
    terminalStore.$a.setTerminalScreenSize('middle');
  };

  useEffect(() => {
    if (terminalStore.$s.screenSize !== 'small') {
      setIsShowModal(true); // 打开提示框
    } else {
      setIsShowModal(false);
    }
  }, [terminalStore.$s.screenSize]);

  return <div className={`terminal_box ${terminalStore.$s.screenSize}_screen_window`}>
    <div className='terminal_header'>
      <div className='terminal_host_name'>
        <span> {terminalType[terminalStore.$s.type]}：<span className='host_desc'>{terminalStore.$s.name}</span></span>
      </div>
      <div className='terminal_tools'>
        {terminalStore.$s.screenSize !== 'small' ? <LineOutlined onClick={() => handleChangeScreenSize('small')} /> : <ExpandAltOutlined onClick={() => handleChangeScreenSize('middle')} />}
        {terminalStore.$s.screenSize !== 'large' ? <ExpandOutlined onClick={() => handleChangeScreenSize('large')} /> : <CompressOutlined onClick={() => handleChangeScreenSize('middle')} />}
        <CloseOutlined onClick={handleCloseTerminalTempory} />
      </div>
    </div>
    <div className='terminal_content'>
      <div className='terminal_console_actually'>
        <TerminalConsole ref={terminalRef} />
      </div>
      {terminalStore.$s.type === 'cluster' && <div className={`terminal_example_menu  ${collapseTerminalMenu ? 'collapse_terminal_example_menu' : ''}`}>
        {collapseTerminalMenu ?
          <CaretLeftOutlined className='terminal_handle_menu' onClick={handleCollapseTerminalMenu} />
          : <CaretRightOutlined className='terminal_handle_menu' onClick={handleCollapseTerminalMenu} />}
        <div className={`terminal_menu_content`}>
          {handleList.map(item => <div className='terminal_handle_box'>
            <div className='desc_word'>
              <p>操作说明：</p>
              <p>{item.name}</p>
            </div>
            <div className='desc_word'>
              <p>具体命令示例：</p>
              <p>{item.example}</p>
            </div>
          </div>)}
          <p className='more_terminal_aim'>参考以下kubectl命令<span><a href={publicLink.kubectlLink} target='_blank'>了解更多<RightOutlined /></a></span></p>
        </div>
      </div>}
    </div>
    <Modal
      className='modal_flex_delete terminal_console_modal'
      open={closeTerminalOpen}
      title='关闭终端'
      getContainer={isShowModal ? false : document.body}
      onCancel={handleCloseTerminalModal}
      footer={[
        <Fragment>
          <Button className='cancel_btn' onClick={handleCloseTerminalModal}>取消</Button>
          <Button className='confirm_btn primary_btn' onClick={handleConfirmTerminalModal}>确定</Button>
        </Fragment>,
      ]}>
      <div className='modal_delete_content'>
        <ExclamationCircleFilled className='warn_icon' />
        <div className='word_tograry'>
          <div className='word_tograry_alarm'>
            {closeContent.map(item => (
              <p className='bread_word_delete'>{item}</p>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  </div>;
}