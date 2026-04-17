export type Platform = "不限" | "Windows" | "macOS" | "安卓" | "iOS" | "Web";
export type Dimension =
  | "正向流程"
  | "异常流程"
  | "边界值"
  | "权限测试"
  | "兼容性测试"
  | "易用性与 UI";
export type Granularity = "粗略" | "标准" | "详细";
export type RunStatus = "生成中" | "已完成" | "失败";
export type InputType = "文档" | "文本";
export type CaseLevel = "P0" | "P1" | "P2";
export type CaseSource = "AI" | "知识库" | "参考风格";

export interface TestCase {
  id: string;
  name: string;
  level: CaseLevel;
  group: string;
  precondition: string;
  steps: string;
  expected: string;
  source: CaseSource[];
  dimensions: Dimension[];
  highRisk: boolean;
  edited: boolean;
  highValue: boolean;
  inBaseline: boolean;
  updatedAt: string;
}

export interface RunConfig {
  platform: Platform;
  dimensions: Dimension[];
  granularity: Granularity;
  businessDomain: string;
  customPrompt: string;
  refCaseFileName: string;
}

export interface GenerationRun {
  id: string;
  name: string;
  inputType: InputType;
  sourceTitle: string;
  sourceSummary: string;
  createdAt: string;
  status: RunStatus;
  config: RunConfig;
  caseCount: number;
  recognizedFeatureCount: number;
  knowledgeHits: string[];
  platformNote: string;
  cases: TestCase[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  businessDomain: string;
  note?: string;
  updatedAt: string;
  runs: GenerationRun[];
}

export interface WorkspaceDraft {
  batchName: string;
  inputType: InputType;
  documentName: string;
  textInput: string;
  config: RunConfig;
}

export interface CaseFilterState {
  query: string;
  level: "全部" | CaseLevel;
  group: string;
  dimension: "全部" | Dimension;
  highRiskOnly: boolean;
  editedOnly: boolean;
}
