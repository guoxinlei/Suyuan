export default [
  //`drop table warehousings_cache`,
  //`drop table bottles`,
  //`drop table products`,
  //`drop table warehousings`,
  //`drop table warehousings_code`,
  //`drop table servers`,
  // 用户权限表
  `create table if not exists user_menus (
    id integer primary key,    -- id
    user_id integer,           -- user id
    menu_code integer,         -- 权限 code
    menu_name varchar(20),     -- 名称
    menu_icon varcahr(200)     -- 权限icon
  )`,
  // 商品列表
  /*`create table if not exists products (
    id integer primary key,    -- id
    user_id integer,           -- user id
    product_id integer,        -- product id
    product_name varchar(200), -- 商品名称
    vol varchar(100),          -- 酒精度
    capacity varchar(100),     -- 容量
    pic varchar(200)           -- 商品图片
  )`,*/
  // 瓶码-盒码关联记录表
  `create table if not exists bottles_log (
    id integer primary key,    -- id
    product varchar(200),      -- 商品
    product_id integer,        -- 商品id
    nums integer,              -- 待关联记录数
    create_at integer          -- 创建日期（长秒数）
  )`,
  // 瓶码-盒码关联表
  `create table if not exists bottles (
    id integer primary key,    -- id
    log_id integer not null,   -- 操作记录id
    bottle_code varchar(200),  -- 瓶码
    case_code varchar(200),    -- 盒码
    create_at integer          -- 创建日期（长秒数）
  )`,
  // 箱码-盒码关联记录表
  `create table if not exists boxes_log (
    id integer primary key,    -- id
    product varchar(200),      -- 商品
    product_id integer,        -- 商品id
    nums integer,              -- 待关联记录数
    create_at integer          -- 创建日期（长秒数）
  )`,
  // 箱码-盒码关联表
  `create table if not exists boxes (
    id integer primary key,    -- id
    log_id integer not null,   -- 操作记录id
    box_code varchar(200),     -- 箱码
    case_code varchar(200),    -- 盒码
    create_at integer          -- 创建日期（长秒数）
  )`,
  // 剁码-箱码关联记录表
  `create table if not exists stacks_log (
    id integer primary key,    -- id
    product varchar(200),      -- 商品
    product_id integer,        -- 商品id
    nums integer,              -- 待关联记录数
    create_at integer          -- 创建日期（长秒数）
  )`,
  // 剁码-箱码关联表
  `create table if not exists stacks (
    id integer primary key,    -- id
    log_id integer not null,   -- 操作记录id
    stack_code varchar(200),   -- 剁码
    box_code varchar(200),     -- 箱码
    create_at integer          -- 创建日期（长秒数）
  )`,
  // 生产线
  `create table if not exists production_lines (
    id integer primary key,    -- id
    line_id integer,           -- 生产线id
    user_id integer,           -- user id
    name varchar(200)          -- 生产线名称
  )`,
  // 出入库单
  `create table if not exists warehousings (
    id integer primary key,    -- id
    ware_no varchar(100),      -- 出入库单号
    ware_type integer,         -- 1 入库 2 出库 3 生产入库
    receiver_id integer,       -- 接收单位id
    receiver_name varchar(200),-- 接收单位名称
    create_at integer          -- 创建日期
  )`,
  // 出入库单缓存
  `create table if not exists warehousings_cache_v3 (
    id integer primary key,    -- id
    user_id integer,           -- userid
    server_id integer,         -- server id
    ware_no varchar(100),      -- 出入库单号
    ware_type integer,         -- 1 入库 2 出库 3 生产入库
    stacks integer,            -- 完成垛数
    products text,             -- 商品信息
    production_line text,      -- 生产线
    production_batch varchar(100),          -- 生产批次
    receiver_id integer,       -- 接收单位id
    receiver_name varchar(200),-- 接收单位名称
    create_at integer          -- 创建日期
  )`,
  `alter table warehousings_cache_v3 add boxes_per_stack integer`,
  // 出入库单商品
  `create table if not exists warehousings_product (
    id integer primary key,    -- id
    ware_id integer,           -- 出入库单id
    product_id integer,        -- 商品id
    product varchar(200),      -- 商品名称
    box_nums integer           -- 计划箱数
  )`,
  // 出入库单扫码记录
  `create table if not exists warehousings_code_v2 (
    id integer primary key,    -- id
    ware_id integer,           -- 出入库单id
    code_type varchar(20),     -- 扫码类别（stack，box，bottle）
    action_type varchar(20),   -- 操作类别（add，remove）
    code varchar(200),         -- 扫码内容
    box_number real,           -- 箱数
    product_id integer         -- 商品id
  )`,
  // api servers
  `create table if not exists servers (
    id integer primary key,    -- id
    name varchar(100),         -- 名称
    url varchar(200),          -- url
    is_default intger          -- 是否默认
  )`,
  // 登录记录
  `create table if not exists login_history (
    id integer primary key,    -- id
    login_name varchar(100),   -- 登录用户名
    user_id integer,           -- 用户id
    username varchar(100),     -- 用户名
    password varchar(100)      -- 密码
  )`,
  `insert into servers (id, name, url, is_default) values (1, '正式服务器', 'open.zhongjiuyun.com', 1)`,
  `insert into servers (id, name, url, is_default) values (2, '测试服务器', 'test.open.zhongjiuyun.com', 0)`,
  `update servers set url = 'api.qkj.com.cn' where id=1;`,
  `delete from servers where id=2;`
];