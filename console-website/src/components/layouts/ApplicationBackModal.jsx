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

import { Modal, Table, Button, Tooltip } from 'antd';
import { Fragment, useStore } from 'openinula';
import '@/styles/pages/helm.less';

/**
 * Application Back/Rollback Modal Component
 *
 * @param {string} title - Modal title
 * @param {string} name - Application name
 * @param {string} version - Application version
 * @param {boolean} open - Control modal open
 * @param {Function} cancelFn - Cancel callback
 * @param {Array} tableColumns - Table columns
 * @param {Array} dataSource - Table data source
 * @param {Object} rowSelection - Row selection config
 * @param {Function} confirmFn - Confirm callback
 */
export default function ApplicationBackModal({
  title,
  name,
  version,
  open,
  cancelFn,
  tableColumns,
  dataSource,
  rowSelection,
  confirmFn,
}) {
  const themeStore = useStore('theme');

  return (
    <Modal
      className={`modal_flex_back ${themeStore.$s.theme === 'dark' ? 'dark_box' : ''}`}
      title={title}
      open={open}
      onOk={confirmFn}
      onCancel={cancelFn}
      width="720px"
      footer={[
        <Fragment key="footer">
          <Button className='cancel_btn' onClick={cancelFn}>取消</Button>
          <Button className='primary_btn' onClick={confirmFn}>确定</Button>
        </Fragment>,
      ]}
    >
      <div className="modal_flex_back_info">
        <p className="name_group">
          应用名称：
          <span className="name">
            <Tooltip placement="top" title={name}>
              {name.length > 18 ? name.slice(0, 18).concat('...') : name}
            </Tooltip>
          </span>
        </p>
        <p className="template_group">
          应用版本：<span className="template">{version || '--'}</span>
        </p>
      </div>

      <Table
        scroll={{ y: 240 }}
        columns={tableColumns}
        dataSource={dataSource}
        pagination={false}
        rowKey={source => source.chart}
        rowSelection={{
          type: 'radio',
          ...rowSelection,
        }}
      />
    </Modal>
  );
}