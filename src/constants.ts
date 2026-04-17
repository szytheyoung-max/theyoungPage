import { CaseFilterState, Dimension, Granularity, Platform } from "./types";

export const GENERATION_STEPS = [
  "正在解析输入内容",
  "正在抽取功能点",
  "正在检索业务知识库",
  "正在生成测试用例",
  "正在去重与结构化输出",
] as const;

export const PLATFORM_OPTIONS: Platform[] = ["不限", "Windows", "macOS", "安卓", "iOS", "Web"];
export const DIMENSION_OPTIONS: Dimension[] = ["正向流程", "异常流程", "边界值", "权限测试", "兼容性测试", "易用性与 UI"];
export const GRANULARITY_OPTIONS: Granularity[] = ["粗略", "标准", "详细"];

export const EMPTY_FILTER: CaseFilterState = {
  query: "",
  level: "全部",
  group: "全部",
  dimension: "全部",
  highRiskOnly: false,
  editedOnly: false,
};
