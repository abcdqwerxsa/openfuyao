/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { Checkbox, Tooltip } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'openinula';
import { getHelmRepoList } from '@/api/applicationMarketApi';
import '@/styles/applicationMarket/index.less';
import { QuestionCircleOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';

const plainOptions = [
  { label: '人工智能/机器学习', value: 'artificial-intelligence' },
  { label: '计算', value: 'computing' },
  { label: '数据库', value: 'database' },
  { label: '开发者工具', value: 'developer-tool' },
  { label: 'CI/CD', value: 'CI/CD' },
  { label: '监控', value: 'monitor' },
  { label: '日志', value: 'log' },
  { label: '网络', value: 'network' },
  { label: '可观测性', value: 'observability' },
  { label: '安全', value: 'security' },
  { label: '存储', value: 'storage' },
  { label: '大数据', value: 'big-data' },
];
export function ApplicationType({
  sceneCheckedList = [],
  sourceCheckedList = [],
  extensionChecked = false,
  computingChecked = false,
  onSelectType,
  onSelectSource,
  onExtensionComponent,
  onComputingEngine,
  onClearFilter,
}) {
  const [sourceOptions, setSourceOptions] = useState([]);
  const [isSceneExtend, setIsSceneExtend] = useState(true);
  const [isSourceExtend, setIsSourceExtend] = useState(true);
  const [moreSourceOption, setMoreSourceOption] = useState([]);
  const CheckboxGroup = Checkbox.Group;
  const onChange = (list) => {
    onSelectType(list);
  };

  const handleExtensionComponent = (e) => {
    if (e.target.checked) {
      onExtensionComponent('openfuyao-extension');
    } else {
      onExtensionComponent('');
    }
  };

  const handleComputingEngine = (e) => {
    onComputingEngine(e.target.checked);
  };
  const handleSelectSource = (list) => {
    onSelectSource(list);
  };

  const handleClear = () => {
    if (onClearFilter) {
      onClearFilter();
      return;
    }
    onSelectSource([]);
    onSelectType([]);
    onExtensionComponent('');
    onComputingEngine(false);
  };

  const getHelmRepoListInfo = async () => {
    const res = await getHelmRepoList('', '', 1, -1);
    const data = res.data.data.items.map((el) => el.name);
    if (data.length > 10) {
      setMoreSourceOption(data.slice(0, 10));
    };
    setSourceOptions(res.data.data.items.map((el) => el.name));
  };

  const getMore = () => {
    setMoreSourceOption(sourceOptions);
  };

  useEffect(() => {
    getHelmRepoListInfo();
  }, []);
  return (
    <div className='application_type'>
      <div className='application_type_item'>
        <div
          className='application_type_title'
          style={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <div>应用类型</div>
          <div onClick={handleClear} style={{ zIndex: '99999' }}><ClearOutlined /></div>
        </div>
        <div>
          <Checkbox style={{ marginBottom: '15px' }} checked={computingChecked} onChange={handleComputingEngine}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span>算力引擎插件</span>
              <span>
                <Tooltip title='通过Helm Chart快速部署算力优化加速应用，释放最大算力潜能。' placement='top'>
                  <QuestionCircleOutlined style={{ color: '#89939bff' }} />
                </Tooltip>
              </span>
            </div>
          </Checkbox>
          <Checkbox checked={extensionChecked} onChange={handleExtensionComponent}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span>扩展组件</span>
              <span>
                <Tooltip title='通过Helm Chart快速部署平台扩展功能，体验扩展组件的无限可能。' placement='top'>
                  <QuestionCircleOutlined style={{ color: '#89939bff' }} />
                </Tooltip>
              </span>
            </div>
          </Checkbox>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <div className='application_type_title'>
            场景
          </div>
          {!isSceneExtend && <div><UpOutlined onClick={() => setIsSceneExtend(true)} style={{ color: '#89939bff' }} /></div>}
          {isSceneExtend && <div><DownOutlined onClick={() => setIsSceneExtend(false)} style={{ color: '#89939bff' }} /></div>}
        </div>
        {isSceneExtend && <CheckboxGroup
          options={plainOptions}
          value={sceneCheckedList}
          onChange={onChange}
        />}
      </div>
      <div className='application_type_item'>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <div className='application_type_title'>来源</div>
          {!isSourceExtend && <div><UpOutlined onClick={() => setIsSourceExtend(true)} style={{ color: '#89939bff' }} /></div>}
          {isSourceExtend && <div><DownOutlined onClick={() => setIsSourceExtend(false)} style={{ color: '#89939bff' }} /></div>}
        </div>
        {isSourceExtend && sourceOptions.length < 11 && <div>
          <CheckboxGroup
            options={sourceOptions}
            value={sourceCheckedList}
            onChange={handleSelectSource}
          />
        </div>
        }
        {isSourceExtend && sourceOptions.length > 10 && <div><CheckboxGroup
          options={moreSourceOption}
          value={sourceCheckedList}
          onChange={handleSelectSource}
          style={{ marginBottom: '18px' }}
        />
          {sourceOptions.length !== moreSourceOption.length && <div style={{ color: '#3f66f5', cursor: 'pointer' }} onClick={getMore}>更多</div>}
        </div>
        }
      </div>
    </div>
  );
}
