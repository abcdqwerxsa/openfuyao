/* Copyright (c) 2024 Huawei Technologies Co., Ltd.
openFuyao is licensed under Mulan PSL v2.
You can use this software according to the terms and conditions of the Mulan PSL v2.
You may obtain a copy of Mulan PSL v2 at:
         http://license.coscl.org.cn/MulanPSL2
THIS SOFTWARE IS PROVIDED ON AN 'AS IS' BASIS, WITHOUT WARRANTIES OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
See the Mulan PSL v2 for more details. */
import { useState } from 'openinula';
export default function RecommendSourceItem({ icon, iconHover, title, description }) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  return (
    <div onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><img src={isHovered ? iconHover : icon} style={{ width: '132px' }} /></div>
      <div className='recommend_source_title'>{title}</div>
      <div className='recommend_source_description'>{description}</div>
    </div>
  );
};