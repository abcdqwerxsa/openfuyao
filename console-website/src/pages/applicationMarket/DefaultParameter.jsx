/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import MarketCodeMirrorEditor from '@/components/MarketCodeMirrorEditor';
import { exportYamlOutPut } from '@/tools/utils';
import { ExportOutlined, CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { message, Skeleton } from 'antd';
import { useState, useEffect, useStore } from 'openinula';
import NoContent from '@/assets/images/noContent.png';

export default function DefaultParameter({ defaultParams, chart, loading }) {
  const themeStore = useStore('theme');
  const [messageApi, contextHolder] = message.useMessage();

  const exportYaml = () => {
    try {
      exportYamlOutPut(chart, defaultParams);
      messageApi.success('导出成功');
    } catch (error) {
      messageApi.error('导出失败，请重试');
    }
  };

  const handleCopyYaml = () => {
    try {
      copy(defaultParams);
      messageApi.success('复制成功！');
    } catch (error) {
      messageApi.error('复制失败，请重试');
    }
  };

  if (!defaultParams) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', height: '100%', padding: '1px 32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', minHeight: '400px', justifyContent: 'center' }}>
          <div><img src={NoContent} alt="无内容" /></div>
          <div style={{ color: '#89939b', fontSize: '14px' }}>无默认参数</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '400px', padding: '32px', backgroundColor: themeStore.$s.theme === 'light' ? '#fff' : '#2a2d34ff' }}>
      <div style={{ background: themeStore.$s.theme === 'dark' ? '#2a2d34ff' : '#fff', color: themeStore.$s.theme === 'dark' ? '#fff' : '#333' }}>
        {contextHolder}
      </div>
      <div className="helm_yaml_card">
        <div className="yaml_flex_box">
          <h3>YAML</h3>
          <div className="yaml_tools">
            <div className="tool_word_group defaultParameterExport" onClick={exportYaml}>
              <ExportOutlined className="common_antd_icon primary_color" />
              <span>导出</span>
            </div>
            <div className="tool_word_group defaultParameterCopy" onClick={handleCopyYaml}>
              <CopyOutlined className="common_antd_icon primary_color" />
              <span>复制</span>
            </div>
          </div>
        </div>
      </div>
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <MarketCodeMirrorEditor yamlData={defaultParams} className='fit_content' isEdit={false} />
      )}
    </div>
  );
}
