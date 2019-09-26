export default [
  // 机构
  `create table if not exists organizations_v2 (
    id integer primary key,    -- id
    org_id integer,            -- 机构id
    user_id integer,           -- user id
    name varchar(200),         -- 机构名称
    ware_type integer          -- 1 入库 2 出库 3 生产入库
  )`,
];