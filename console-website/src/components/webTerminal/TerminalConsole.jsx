/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { Modal, message, Button } from 'antd';
import { CloseOutlined, ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, Fragment, useStore, useCallback } from 'openinula';
import useWebSocket from '@/hooks/useWebSocket';
import { getWsPrefix } from '@/common/constants';
import dayjs from 'dayjs';

const maxWaitMinute = 20;
const modalCloseMinute = 5;

const TerminalConsole = forwardRef((props, ref) => {
  let chaltCount = 0; // 与后端交流次数实时刷新
  let gainTerminalFirst = '';
  let fitAddon = null;
  const terminalRef = useRef(null);
  const [term, setTerm] = useState(); // term实例
  const terminalStore = useStore('terminal');
  const userStore = useStore('user');
  const [lastInteractionTime, setLastInteractionTime] = useState(new Date());
  const [messageApi, contextHolder] = message.useMessage();
  let timeID = 0; // 计时器ID
  let recycleTimeID = 0;
  let openInfoTimeID = 0;
  const [infoModal, setInfoModal] = useState(false);
  const [ws, wsData, wsState] = useWebSocket(`${getWsPrefix().terminalUrl}${terminalStore.$s.type === 'cluster' ?
    `/user/${userStore.$s.user.name}/terminal`
    : `/namespace/${terminalStore.$s.podDescription.namespace}/pod/${terminalStore.$s.podDescription.pod}/container/${terminalStore.$s.name}/terminal`}`);

  useImperativeHandle(ref, () => ({
    resizeScreenConsole,
  }));

  const disablePrint = (disabled = true) => {
    const textarea = terminalRef.current?.textarea;
    if (textarea) {
      textarea.disabled = disabled;
    }
  };

  const resizeRemoteTerminal = () => {
    const cols = Math.ceil(document.querySelector('.terminal_console_box').offsetWidth / 9);
    const rows = Math.ceil(document.querySelector('.terminal_console_box').offsetHeight / 17);
    if (wsState === 'open') {
      ws.send(JSON.stringify({ Op: 'resize', Cols: cols, Rows: rows }));
    }
  };

  const initConsole = useCallback((dom) => {
    if (ws) {
      const currentTerm = new Terminal({
        rendererType: 'dom',
        cursorBlink: true,
        convertEol: true,
        // scrollback: 800,
        rows: Math.ceil(document.querySelector('.terminal_console_box').offsetHeight / 17),
        cols: Math.ceil(document.querySelector('.terminal_console_box').offsetWidth / 9),
        theme: {
          foreground: '#F7F7F7',
          background: '#2A2D34',
        },
      });
      resizeRemoteTerminal();
      currentTerm.write(`connection(updated at ${dayjs().format('YYYY-MM-DD HH:mm:ss')})...`);
      disablePrint();
      fitAddon = new FitAddon();
      currentTerm.loadAddon(fitAddon);
      fitAddon.fit();
      currentTerm.open(dom);
      currentTerm.onData(data => {
        clearTimeout(timeID);
        clearTimeout(openInfoTimeID);
        clearTimeout(recycleTimeID);
        setLastInteractionTime(new Date());
        if (gainTerminalFirst) {
          ws.send(JSON.stringify({ Op: 'stdin', Data: data }));
        }
      });
      window.addEventListener('resize', () => {
        currentTerm.resize(Math.ceil(document.querySelector('.terminal_console_box').offsetWidth / 9), Math.ceil(document.querySelector('.terminal_console_box').offsetHeight / 17) - 2);
        resizeRemoteTerminal();
      });
      ws.addEventListener('message', ({ data }) => {
        try {
          const outData = JSON.parse(data);
          if (!chaltCount) {
            currentTerm.write(`\r\n`);
            gainTerminalFirst = outData.Data;
          }
          outData.Data.replace('\u001b[?2004l\r\r\n', '');
          currentTerm.write(outData.Data);
          chaltCount++;
        } catch (e) {
          const outData = data;
        }
      });
      setTerm(currentTerm);
    }
  }, [ws]);

  const rightHandle = () => {
    currentTerm.element.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const selection = currentTerm.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection).then(() => {
          currentTerm.write(selection);
        }, (err) => {
          messageApi.error('复制到剪贴板失败：', err);
        });
      }
    });
  };

  const getCursorOffsetLength = (offsetLength, subString = '') => {
    let cursorOffsetLength = '';
    for (let offset = 0; offset < offsetLength; offset++) {
      cursorOffsetLength += subString;
    }
    return cursorOffsetLength;
  };

  const keyAction = (currentTerm, userInfoName = userStore.$s.user.name) => {
    // 定义变量获取整行数据
    let currentLineData = '';
    // 历史行输入数据
    let historyLineData = [];
    let last = 0;
    // 使其能够输入汉字
    currentTerm.onData(async key => {
      // enter键
      setLastInteractionTime(new Date());
      if (key.charCodeAt(0) === 13) {
        // 将行数据进行添加进去
        if (currentLineData !== '') {
          // 将当前行数据传入历史命令数组中存储
          historyLineData.push(currentLineData);
          // 定义当前行命令在整个数组中的位置
          last = historyLineData.length - 1;
        }
        // 当输入clear时清空终端内容
        if (currentLineData === 'clear') {
          currentTerm.clear();
          // 清空当前行数据
          currentTerm.write('\r\u001b[K');
          currentLineData = '';
          currentTerm.write(`${gainTerminalFirst}`);
        } else {
          // 在这可以进行发起请求将整行数据传入
          currentTerm.write('\r\n');
          ws.send(JSON.stringify({ Op: 'stdin', Data: `${currentLineData}\n` }));
          // 清空当前行数据
          currentLineData = '';
        }
      } else if (key.charCodeAt(0) === 127) {
        // 删除键--》当前行偏移量x大于终端提示符所占位置时进行删除
        const perLength = gainTerminalFirst.length;
        if (currentTerm._core.buffer.x > perLength) {
          const currentOffsetLength = currentTerm._core.buffer.x;
          currentLineData = currentLineData.slice(0, -1);
          currentTerm.write('\b \b');
        }
      } else if (key === '\u001b[A') {
        // up键的时候
        let len = 0;
        if (historyLineData.length > 0) {
          len = historyLineData.length + 1;
        }
        if (last < len && last > 0) {
          // 当前行有数据的时候进行删除掉在进行渲染上存储的历史数据
          for (let i = 0; i < currentLineData.length; i++) {
            if (currentTerm._core.buffer.x > gainTerminalFirst.length) {
              currentTerm.write('\b \b');
            }
          }
          let text = historyLineData[last - 1];
          currentTerm.write(text);
          // 重点，一定要记住存储当前行命令保证下次up或down时不会光标错乱覆盖终端提示符
          currentLineData = text;
          last--;
        }
      } else if (key === '\u001b[B') {
        // down键
        let lent = 0;
        if (historyLineData.length > 0) {
          lent = historyLineData.length - 1;
        }
        if (last < lent && last > -1) {
          for (let i = 0; i < currentLineData.length; i++) {
            if (currentTerm._core.buffer.x > gainTerminalFirst.length) {
              currentTerm.write('\b \b');
            }
          }
          let text = historyLineData[last + 1];
          currentTerm.write(text);
          currentLineData = text;
          last++;
        }
      } else {
        // 啥也不做的时候就直接输入
        currentLineData += key;
        currentTerm.write(key);
      }
    });
  };

  const resizeScreenConsole = () => {
    if (term) {
      term.resize(Math.ceil(document.querySelector('.terminal_console_box').offsetWidth / 9), Math.ceil(document.querySelector('.terminal_console_box').offsetHeight / 17));
      resizeRemoteTerminal();
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      if (term) {
        term.dispose();
      }
      initConsole(terminalRef.current);
    }
  }, [terminalRef, terminalStore.$s.name, initConsole]);

  useEffect(() => {
    window.addEventListener('resize', () => fitAddon?.fit());
  }, []);

  useEffect(() => {
    if (wsState === 'closed' || wsState === 'fail') {
      term.write(`\r\n\x1B[1;3;31mTerminal connection is closed!\x1B[0m`);
    }
    if (wsState !== 'open') {
      disablePrint();
    }
  }, [wsState, term, ws]);

  useEffect(() => {
    return () => ws.close();
  }, [ws]);

  const handleCloseTerminalInfo = () => {
    messageApi.destroy('infoTerminal');
  };

  useEffect(() => {
    const checkInactivity = () => {
      const currentTime = new Date();
      const inactivityDuration = (currentTime - lastInteractionTime) / 1000 / 60;
      if (inactivityDuration >= (maxWaitMinute + modalCloseMinute)) {
        handleCloseTerminalInfo();
        setInfoModal(true); // 打开提示框
      } else {
        if (inactivityDuration > maxWaitMinute) {
          messageApi.open({
            type: 'info',
            className: `${terminalStore.$s.screenSize}_terminal_msg terminal_info_msg`,
            key: 'infoTerminal',
            icon: <InfoCircleFilled />,
            content: <div>
              提示：您已经超过{maxWaitMinute}分钟未进行操作，终端将在{modalCloseMinute}分钟后关闭。
              <CloseOutlined style={{ color: '#f7f7f7', fontSize: '14px', marginLeft: '20px' }} onClick={handleCloseTerminalInfo} />
            </div>,
            duration: 0,
          });
          openInfoTimeID = setTimeout(() => {
            handleCloseTerminalInfo();
            if (terminalStore.$s.screenSize !== 'small') {
              setInfoModal(true); // 打开提示框
            }
          }, modalCloseMinute * 60 * 1000);
        } else {
          handleCloseTerminalInfo();
          recycleTimeID = setTimeout(() => checkInactivity(), 1000);
        }
      }
    };

    timeID = setTimeout(checkInactivity, 1000);

    return () => {
      clearTimeout(timeID);
      clearTimeout(openInfoTimeID);
      clearTimeout(recycleTimeID);
    };
  }, [lastInteractionTime, terminalStore.$s.screenSize]);

  const handleCloseTerminal = () => {
    setInfoModal(false);
    terminalStore.$a.setTerminalOpen(false);
    terminalStore.$a.setTerminalScreenSize('middle');
  };

  return <>
    <div ref={terminalRef} className="terminal_console_box" style={{ width: '100%' }}>{contextHolder}</div>
    <Modal
      className='modal_flex_delete terminal_console_modal'
      open={infoModal}
      title='提示'
      getContainer={false}
      onCancel={handleCloseTerminal}
      footer={[
        <Fragment>
          <Button className='cancel_btn' onClick={handleCloseTerminal}>确定</Button>
        </Fragment>,
      ]}>
      <div className='modal_delete_content'>
        <ExclamationCircleFilled className='warn_icon' />
        <div className='word_tograry'>
          <div className='word_tograry_alarm'>
            <p className='bread_word_delete'>{`您已超过${maxWaitMinute}分钟未进行操作，终端将关闭。`}</p>
          </div>
        </div>
      </div>
    </Modal>
  </>;
});

export default TerminalConsole;