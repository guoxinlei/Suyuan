export default [
  // 商品列表
  `create table if not exists products_v3 (
    id integer primary key,    -- id
    user_id integer,           -- user id
    product_id integer,        -- product id
    product_name varchar(200), -- 商品名称
    vol varchar(100),          -- 酒精度
    capacity varchar(100),     -- 容量
    pic varchar(200),          -- 商品图片
    source_type integer,       -- 类型（0 通用，1 erp 组垛和组箱专用）
    stackstandard integer      -- 垛规
  )`
];